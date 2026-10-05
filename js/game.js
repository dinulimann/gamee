/*
 * CV Quest — game RPG top-down berisi CV interaktif.
 * Tanpa library, cukup Canvas 2D. Semua konten diambil dari js/data.js.
 */
(() => {
  'use strict';

  const CV_BASE = window.CV || {};
  CV_BASE.skills = CV_BASE.skills || [];
  CV_BASE.npcs = CV_BASE.npcs || [];
  const I18N = window.I18N || { id: {} };
  // CV aktif = CV dasar + terjemahan (kalau bahasa Inggris dipilih)
  let CV = CV_BASE;

  // ---------------------------------------------------------------- utils
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const SAVE_KEY = 'cvquest:v1';
  const store = {
    load() {
      try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; }
    },
    save(v) {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(v)); } catch (e) { /* abaikan */ }
    },
  };
  // gabungkan terjemahan ke data dasar; daftar digabung per urutan item
  function mergeDeep(base, over) {
    if (over === undefined || over === null) return base;
    if (Array.isArray(base) && Array.isArray(over)) return base.map((b, i) => mergeDeep(b, over[i]));
    if (base && typeof base === 'object' && !Array.isArray(base) && typeof over === 'object' && !Array.isArray(over)) {
      const out = { ...base };
      for (const k of Object.keys(over)) out[k] = mergeDeep(base[k], over[k]);
      return out;
    }
    return over;
  }
  const initials = (name) => {
    const w = String(name || '?').trim().split(/\s+/);
    return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
  };

  // layar loading hilang setelah semua gambar siap (atau paling lama 8 detik)
  function hideLoader() {
    const el = document.getElementById('loader');
    if (!el || el.classList.contains('done')) return;
    el.classList.add('done');
    setTimeout(() => el.remove(), 450);
  }
  setTimeout(hideLoader, 8000);

  // Vercel Web Analytics (event kustom hanya tercatat di paket Vercel yang mendukungnya)
  function track(name, data) {
    try { if (window.va) window.va('event', data ? { name, data } : { name }); } catch (e) { /* abaikan */ }
  }

  // ---------------------------------------------------------------- aset gambar
  // Sprite di folder assets/. Kalau ada yang gagal dimuat, game memakai gambar bawaan (kode).
  const IMG = {};
  const sprite = (name) => {
    const im = IMG[name];
    return im && im.complete && im.naturalWidth ? im : null;
  };
  const onAssetsReady = [];
  (function loadAssets() {
    const names = [
      'tile-grass', 'tile-path', 'tile-sand', 'tile-water', 'tile-plaza',
      'tree-oak', 'tree-pine', 'flowers', 'fountain',
      'building-about', 'building-experience', 'building-education',
      'building-skills', 'building-projects', 'building-contact',
      'player', 'npc-kades', 'npc-bendahara', 'npc-data',
      'gem-backend', 'gem-frontend', 'gem-database', 'gem-data', 'gem-devops', 'gem-domain',
      'avatar', 'logo', 'title-bg',
      'cat', 'lamp', 'lamp-off', 'guestbook',
    ];
    let pending = names.length;
    const done = () => {
      pending--;
      const bar = document.getElementById('loaderBar');
      if (bar) bar.style.width = `${Math.round(((names.length - pending) / names.length) * 100)}%`;
      if (pending === 0) { onAssetsReady.forEach((f) => f()); hideLoader(); }
    };
    names.forEach((n) => {
      const im = new Image();
      im.onload = done; im.onerror = done;
      im.src = `assets/${n}.png`;
      IMG[n] = im;
    });
  })();

  // ---------------------------------------------------------------- state
  const saved = store.load();
  const state = {
    visited: saved.visited || [],
    gems: saved.gems || [],
    talked: saved.talked || [],
    ach: saved.ach || [],
    finale: !!saved.finale,
    muted: !!saved.muted,
    music: saved.music !== false,
    timeMode: saved.timeMode || 'auto', // auto | day | night
    weather: saved.weather || 'auto', // auto | clear | rain
    catFed: !!saved.catFed,
    lang: I18N[saved.lang] ? saved.lang : (/^id\b|^ms\b/i.test(navigator.language || '') ? 'id' : 'en'),
  };
  const persist = () => store.save(state);
  // ?lang=en / ?lang=id di URL (berguna saat membagikan link ke recruiter)
  try {
    const qLang = new URLSearchParams(location.search).get('lang');
    if (qLang && I18N[qLang]) state.lang = qLang;
  } catch (e) { /* abaikan */ }

  // ---------------------------------------------------------------- bahasa
  const lookup = (d, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), d);
  function t(key, vars) {
    let v = lookup(I18N[state.lang], key);
    if (v === undefined) v = lookup(I18N.id, key);
    if (v === undefined) return key;
    if (typeof v === 'string' && vars) v = v.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return v;
  }
  function buildCV() {
    CV = state.lang === 'en' && window.CV_EN ? mergeDeep(CV_BASE, window.CV_EN) : CV_BASE;
  }
  buildCV();

  // ---------------------------------------------------------------- world
  const TILE = 32, MW = 44, MH = 32;
  const GRASS = 0, PATH = 1, WATER = 2, SAND = 3, PLAZA = 4;
  const BW = 5, BH = 4;
  const SPAWN = { x: 22, y: 18 };
  const FOUNTAIN = { x: 22 * TILE + 16, y: 15 * TILE + 16 };

  const SECTIONS = [
    { id: 'about', icon: '🏠', color: '#e07a5f', roof: '#9c3d2a', tx: 7, ty: 4, path: [[9, 8], [9, 10], [17, 10], [17, 11]] },
    { id: 'experience', icon: '💼', color: '#5b8def', roof: '#2f4f9e', tx: 20, ty: 3, path: [[22, 7], [22, 11]] },
    { id: 'education', icon: '🎓', color: '#9b6dd6', roof: '#5a3a8c', tx: 32, ty: 4, path: [[34, 8], [34, 10], [27, 10], [27, 11]] },
    { id: 'skills', icon: '🛠️', color: '#f2a541', roof: '#a8641a', tx: 7, ty: 21, path: [[9, 25], [13, 25], [13, 19], [17, 19]] },
    { id: 'projects', icon: '🧪', color: '#2bb3a3', roof: '#17756b', tx: 20, ty: 21, path: [[22, 25], [26, 25], [26, 19]] },
    { id: 'contact', icon: '✉️', color: '#e8577e', roof: '#a12a4f', tx: 31, ty: 21, path: [[33, 25], [29, 25], [29, 19], [27, 19]] },
  ];
  SECTIONS.forEach((b) => {
    b.ex = b.tx + 2; b.ey = b.ty + BH; // tile pintu masuk (di depan pintu)
    b.doorX = b.ex * TILE + 16; b.doorY = b.ey * TILE + 12;
  });

  const CAT_COLORS = { Backend: '#f72585', Frontend: '#4cc9f0', Database: '#ffd166', Data: '#80ed99', DevOps: '#5b8def', Domain: '#ff9f43', Tools: '#ffd166', 'Soft Skill': '#80ed99' };
  const catColor = (c) => CAT_COLORS[c] || '#c77dff';
  const CAT_GEMS = { Backend: 'backend', Frontend: 'frontend', Database: 'database', Tools: 'database', Data: 'data', 'Soft Skill': 'data', DevOps: 'devops', Domain: 'domain' };

  const grid = (v) => Array.from({ length: MH }, () => new Array(MW).fill(v));
  const tiles = grid(GRASS), solid = grid(false), deco = grid(0), bld = grid(null);
  const inb = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;

  // pantai & pulau
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      const d = Math.min(x, y, MW - 1 - x, MH - 1 - y);
      const e = 2 + (Math.sin(x * 0.55) + Math.sin(y * 0.45 + 1) > 0.9 ? 1 : 0);
      if (d < e) tiles[y][x] = WATER;
      else if (d < e + 1) tiles[y][x] = SAND;
      const pd = Math.hypot(x - 38, y - 15);
      if (pd < 2.3) tiles[y][x] = WATER;
      else if (pd < 3.3 && tiles[y][x] === GRASS) tiles[y][x] = SAND;
    }
  }
  // alun-alun
  for (let y = 11; y <= 19; y++) for (let x = 17; x <= 27; x++) tiles[y][x] = PLAZA;
  // jalan setapak
  SECTIONS.forEach((b) => {
    for (let i = 0; i < b.path.length - 1; i++) {
      let [x, y] = b.path[i];
      const [x2, y2] = b.path[i + 1];
      for (;;) {
        if (tiles[y][x] !== PLAZA) tiles[y][x] = PATH;
        if (x === x2 && y === y2) break;
        x += Math.sign(x2 - x); y += Math.sign(y2 - y);
      }
    }
    for (let y = b.ty; y < b.ty + BH; y++) for (let x = b.tx; x < b.tx + BW; x++) { solid[y][x] = true; bld[y][x] = b; }
  });
  // air mancur
  for (let y = 14; y <= 16; y++) for (let x = 21; x <= 23; x++) solid[y][x] = true;
  // papan tamu di alun-alun
  const BOARD = { tx: 19, ty: 12, x: 19 * TILE + 16, y: 12 * TILE + 28 };
  solid[BOARD.ty][BOARD.tx] = true;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (tiles[y][x] === WATER) solid[y][x] = true;

  // pohon & dekorasi
  const rng = mulberry32(20241);
  const trees = [];
  const clearAround = (x, y) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (!inb(nx, ny) || tiles[ny][nx] !== GRASS || bld[ny][nx]) return false;
    }
    return !bld[y + 1]?.[x] && !bld[y + 2]?.[x];
  };
  for (let y = 0; y < MH; y++) {
    for (let x = 0; x < MW; x++) {
      if (tiles[y][x] !== GRASS || solid[y][x]) continue;
      const r = rng();
      if (r < 0.15 && clearAround(x, y) && Math.hypot(x - SPAWN.x, y - SPAWN.y) > 4) {
        solid[y][x] = true;
        trees.push({ x, y, kind: rng() < 0.35 ? 'pine' : 'oak', s: 0.85 + rng() * 0.3 });
      } else if (r < 0.23) deco[y][x] = 1 + Math.floor(rng() * 3); // bunga
      else if (r < 0.3) deco[y][x] = 9; // rumput
    }
  }

  // tile yang bisa dicapai dari titik awal
  const reach = grid(false);
  (function bfs() {
    const q = [[SPAWN.x, SPAWN.y]];
    reach[SPAWN.y][SPAWN.x] = true;
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (inb(nx, ny) && !solid[ny][nx] && !reach[ny][nx]) { reach[ny][nx] = true; q.push([nx, ny]); }
      }
    }
  })();
  function nearestReachable(x, y) {
    x = clamp(Math.round(x), 0, MW - 1); y = clamp(Math.round(y), 0, MH - 1);
    let best = null, bd = Infinity;
    for (let yy = 0; yy < MH; yy++) for (let xx = 0; xx < MW; xx++) {
      if (!reach[yy][xx]) continue;
      const d = Math.hypot(xx - x, yy - y);
      if (d < bd) { bd = d; best = { x: xx, y: yy }; }
    }
    return best;
  }

  // permata skill
  const gems = [];
  (function placeGems() {
    const cand = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      if (reach[y][x] && (tiles[y][x] === GRASS || tiles[y][x] === SAND) && Math.hypot(x - SPAWN.x, y - SPAWN.y) > 4) cand.push({ x, y });
    }
    for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
    let minD = 7;
    const picked = [];
    while (picked.length < CV.skills.length && minD >= 0) {
      for (const c of cand) {
        if (picked.length >= CV.skills.length) break;
        if (picked.includes(c)) continue;
        if (picked.every((p) => Math.hypot(p.x - c.x, p.y - c.y) >= minD)) picked.push(c);
      }
      minD--;
    }
    picked.forEach((c, i) => gems.push({ i, x: c.x * TILE + 16, y: c.y * TILE + 20, phase: rng() * 6 }));
  })();
  const gemCollected = (i) => state.gems.includes(i);

  // ---------------------------------------------------------------- characters
  const player = {
    x: SPAWN.x * TILE + 16, y: SPAWN.y * TILE + 22,
    dir: 'down', phase: 0, moving: false, path: null, target: null,
    shirt: '#f2a541', pants: '#2d3a5c', skin: '#f1c27d', hair: '#3b2416', sprite: 'player',
  };
  const NPC_SPRITES = ['npc-kades', 'npc-bendahara', 'npc-data'];
  const npcs = CV.npcs.map((n, i) => {
    const h = nearestReachable(...(n.home || [SPAWN.x - 3, SPAWN.y]));
    return {
      i, name: n.name || '?', sprite: n.sprite || NPC_SPRITES[i],
      shirt: n.shirt || '#6c757d', hair: n.hair || '#222', pants: '#3a3a4a', skin: ['#e0ac69', '#f1c27d', '#c68642'][i % 3],
      home: h, x: h.x * TILE + 16, y: h.y * TILE + 22, dir: 'down', phase: 0, moving: false,
      path: null, wait: 1 + Math.random() * 2, talking: false,
    };
  });

  // ---------------------------------------------------------------- pathfinding (A*, 8 arah)
  function findPath(sx, sy, gx, gy) {
    if (!inb(gx, gy) || solid[gy][gx] || !inb(sx, sy)) return null;
    const N = MW * MH, idx = (x, y) => y * MW + x;
    const g = new Float32Array(N).fill(Infinity), f = new Float32Array(N).fill(Infinity);
    const came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const h = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
    const s = idx(sx, sy);
    g[s] = 0; f[s] = h(sx, sy);
    const open = [s];
    while (open.length) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
      const cur = open[bi];
      open[bi] = open[open.length - 1]; open.pop();
      if (closed[cur]) continue;
      closed[cur] = 1;
      const cx = cur % MW, cy = (cur / MW) | 0;
      if (cx === gx && cy === gy) {
        const out = [];
        for (let c = cur; c !== s; c = came[c]) out.push({ x: c % MW, y: (c / MW) | 0 });
        return out.reverse();
      }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!inb(nx, ny) || solid[ny][nx]) continue;
        if (dx && dy && (solid[cy][nx] || solid[ny][cx])) continue;
        const ni = idx(nx, ny);
        if (closed[ni]) continue;
        const ng = g[cur] + (dx && dy ? 1.414 : 1);
        if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; f[ni] = ng + h(nx, ny); open.push(ni); }
      }
    }
    return null;
  }
  const tileOf = (c) => ({ x: Math.floor(c.x / TILE), y: Math.floor((c.y - 2) / TILE) });

  // ---------------------------------------------------------------- sound
  const Sound = {
    ctx: null,
    init() {
      if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { /* tanpa suara */ } }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone(f, d = 0.08, type = 'square', v = 0.04, delay = 0) {
      if (state.muted || !this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(this.ctx.destination);
      o.start(t); o.stop(t + d + 0.02);
    },
    seq(notes, step = 0.07, type = 'square', v = 0.04) { notes.forEach((n, i) => this.tone(n, step * 1.5, type, v, i * step)); },
    open() { this.seq([392, 523, 659], 0.06, 'triangle', 0.06); },
    close() { this.seq([523, 392], 0.05, 'triangle', 0.04); },
    gem() { this.seq([784, 988, 1175, 1568], 0.05, 'square', 0.035); },
    talk() { this.tone(300 + Math.random() * 120, 0.03, 'square', 0.02); },
    click() { this.tone(660, 0.04, 'triangle', 0.04); },
    nope() { this.seq([220, 165], 0.07, 'sawtooth', 0.03); },
    win() { this.seq([523, 659, 784, 1047, 784, 1047, 1319], 0.1, 'triangle', 0.06); },
    coin() { this.seq([988, 1319], 0.06, 'square', 0.04); this.tone(200, 0.3, 'sine', 0.04, 0.25); },
    meow() {
      if (state.muted || !this.ctx) return;
      const c = this.ctx, t0 = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = 'triangle';
      o.frequency.setValueAtTime(620, t0); o.frequency.linearRampToValueAtTime(980, t0 + 0.12); o.frequency.linearRampToValueAtTime(560, t0 + 0.38);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.42);
      o.connect(g).connect(c.destination); o.start(t0); o.stop(t0 + 0.45);
    },
  };

  // ---------------------------------------------------------------- musik latar 8-bit
  // Lagu pendek 8 birama (C - Am - F - G) yang diulang. Malam hari memakai suara yang lebih lembut.
  const CHORDS = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
  const MELODY = [
    72, 0, 76, 0, 79, 0, 76, 74, 72, 0, 0, 69, 72, 0, 0, 0,
    69, 0, 72, 0, 77, 0, 76, 74, 74, 0, 0, 71, 74, 0, 79, 0,
    76, 0, 79, 0, 84, 0, 81, 79, 76, 0, 72, 0, 76, 0, 0, 0,
    77, 0, 76, 0, 74, 0, 72, 0, 71, 0, 74, 0, 72, 0, 0, 0,
  ];
  const ARP = [0, 1, 2, 1, 0, 1, 2, 1];
  const Music = {
    gain: null, timer: null, step: 0, nextT: 0, bpm: 96,
    start() {
      if (!Sound.ctx || !state.music) return;
      const c = Sound.ctx;
      if (!this.gain) { this.gain = c.createGain(); this.gain.gain.value = 0; this.gain.connect(c.destination); }
      this.gain.gain.cancelScheduledValues(c.currentTime);
      this.gain.gain.setTargetAtTime(1, c.currentTime, 0.5);
      if (!this.timer) { this.nextT = c.currentTime + 0.1; this.timer = setInterval(() => this.schedule(), 60); }
    },
    stop() {
      clearInterval(this.timer); this.timer = null;
      if (this.gain && Sound.ctx) this.gain.gain.setTargetAtTime(0, Sound.ctx.currentTime, 0.2);
    },
    schedule() {
      const c = Sound.ctx, dur = 60 / this.bpm / 2;
      if (this.nextT < c.currentTime - 0.1) this.nextT = c.currentTime + 0.05; // tab sempat tidur
      while (this.nextT < c.currentTime + 0.25) {
        this.play(this.step, this.nextT, dur);
        this.nextT += dur; this.step = (this.step + 1) % MELODY.length;
      }
    },
    note(midi, t0, dur, type, vol) {
      const c = Sound.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(this.gain);
      o.start(t0); o.stop(t0 + dur + 0.05);
    },
    play(i, t0, dur) {
      const ch = CHORDS[(i >> 3) % 4], k = i & 7;
      const night = dark > NIGHT_MAX * 0.5;
      if (k === 0 || k === 4) this.note(ch[0] - 12, t0, dur * 3.5, 'triangle', 0.08);
      this.note(ch[ARP[k]], t0, dur * 0.9, night ? 'sine' : 'square', night ? 0.025 : 0.01);
      const m = MELODY[i];
      if (m) this.note(night ? m - 12 : m, t0, dur * 1.8, night ? 'triangle' : 'square', night ? 0.06 : 0.022);
    },
  };
  document.addEventListener('visibilitychange', () => {
    if (!Sound.ctx) return;
    if (document.hidden) Sound.ctx.suspend();
    else if (ui.title.classList.contains('hidden')) Sound.ctx.resume();
  });

  // ---------------------------------------------------------------- DOM refs
  const canvas = $('#game'), ctx = canvas.getContext('2d');
  const mm = $('#minimap'), mctx = mm.getContext('2d');
  const ui = {
    hud: $('#hud'), prompt: $('#prompt'), action: $('#actionBtn'), toasts: $('#toasts'),
    modal: $('#modal'), modalTitle: $('#modalTitle'), modalIcon: $('#modalIcon'), modalBody: $('#modalBody'),
    quest: $('#quest'), questBody: $('#questBody'), classic: $('#classic'), classicBody: $('#classicBody'),
    title: $('#title'), dialog: $('#dialog'), dialogName: $('#dialogName'), dialogText: $('#dialogText'),
    progress: $('#hudProgress'), settings: $('#settings'),
    terminal: $('#terminal'), termOut: $('#termOut'), termInput: $('#termInput'),
  };
  const isTouch = matchMedia('(pointer: coarse)').matches;

  // ---------------------------------------------------------------- toasts
  function toast(html, ms = 2800) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = html;
    ui.toasts.appendChild(el);
    while (ui.toasts.children.length > 3) ui.toasts.firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, ms);
  }

  // ---------------------------------------------------------------- achievements
  const ACH = [
    { id: 'first_door', icon: '🚪' },
    { id: 'first_gem', icon: '💎' },
    { id: 'talker', icon: '💬' },
    { id: 'wish', icon: '⛲' },
    { id: 'optimizer', icon: '⚡' },
    { id: 'hacker', icon: '💻' },
    { id: 'cat', icon: '🐱' },
    { id: 'guest', icon: '📌' },
    { id: 'all_sections', icon: '🗺️' },
    { id: 'all_gems', icon: '👑' },
  ];
  const achCount = () => ACH.filter((a) => state.ach.includes(a.id)).length;
  const achName = (a) => t('ach.' + a.id)[0];
  const achDesc = (a) => t('ach.' + a.id)[1];
  function unlock(id) {
    if (state.ach.includes(id)) return;
    const a = ACH.find((x) => x.id === id);
    if (!a) return;
    state.ach.push(id);
    persist();
    setTimeout(() => {
      toast(`${t('achToast', { icon: a.icon, name: esc(achName(a)) })}<small>${esc(achDesc(a))}</small>`, 3500);
      Sound.seq([659, 784, 1047], 0.08, 'triangle', 0.05);
    }, 400);
  }
  const allSectionsDone = () => SECTIONS.every((s) => state.visited.includes(s.id));
  const allGemsDone = () => gems.every((g) => gemCollected(g.i));

  function updateProgress() {
    const v = SECTIONS.filter((s) => state.visited.includes(s.id)).length;
    const g = gems.filter((x) => gemCollected(x.i)).length;
    ui.progress.innerHTML = `<span title="${esc(t('pVisited'))}">🏠 ${v}/${SECTIONS.length}</span><span title="${esc(t('pGems'))}">💎 ${g}/${gems.length}</span><span title="${esc(t('pAch'))}">🏆 ${achCount()}/${ACH.length}</span><span title="${esc(t('pTime'))}" id="hudClock"></span>`;
    lastClock = '';
  }

  // ---------------------------------------------------------------- content renderers
  const avatarHtml = () => (sprite('avatar')
    ? `<div class="avatar big has-img" role="img" aria-label="${esc(CV.name)}"></div>`
    : `<div class="avatar big">${esc(initials(CV.name))}</div>`);
  const pdfUrl = () => `assets/cv-${String(CV_BASE.name || 'cv').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${state.lang}.pdf`;
  const pdfButton = (cls = 'btn') => `<a class="${cls}" href="${pdfUrl()}" download data-pdf>${t('downloadPdf')}</a>`;
  const joinDot = (...p) => p.filter(Boolean).map(esc).join(' · ');
  const linkOrText = (url, label) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label || url)}</a>` : '');

  const chipBlock = (title, list) =>
    (list || []).length ? `<h4>${title}</h4><div class="chips">${list.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : '';

  function renderAbout() {
    return `
      <div class="about-head">
        ${avatarHtml()}
        <div>
          <h3>${esc(CV.name)}</h3>
          <p class="muted">${esc(CV.role)}${CV.location ? ' · 📍 ' + esc(CV.location) : ''}</p>
          ${CV.tagline ? `<p class="tagline">“${esc(CV.tagline)}”</p>` : ''}
        </div>
      </div>
      ${(CV.about || []).map((p) => `<p>${esc(p)}</p>`).join('')}
      ${(CV.facts || []).length ? `<h4>${t('hHighlights')}</h4><ul class="facts">${CV.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      ${chipBlock(t('hLooking'), CV.lookingFor)}
      ${chipBlock(t('hInterests'), CV.interests)}`;
  }

  function renderExperience(classic) {
    const items = CV.experience || [];
    if (classic) {
      return items.map((e) => `
        <div class="cv-item">
          <div class="cv-item-head"><strong>${esc(e.title)} — ${esc(e.company)}</strong><span class="muted">${esc(e.period)}</span></div>
          <ul>${(e.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
        </div>`).join('');
    }
    return `<button class="btn pg-open" type="button" data-action="payroll">${t('pgOpen')}</button>
      <p class="muted">${t('expHint')}</p>` + items.map((e, i) => `
      <details class="card" ${i === 0 ? 'open' : ''}>
        <summary><span>💼</span><span><div class="card-title">${esc(e.title)}</div><div class="card-sub">${joinDot(e.company, e.period)}</div></span></summary>
        <div class="card-body"><ul>${(e.points || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>
      </details>`).join('');
  }

  function renderEducation(classic) {
    const items = CV.education || [];
    if (classic) {
      return items.map((e) => `
        <div class="cv-item">
          <div class="cv-item-head"><strong>${esc(e.degree)} — ${esc(e.school)}</strong><span class="muted">${esc(e.period)}</span></div>
          ${e.detail ? `<div>${esc(e.detail)}</div>` : ''}
        </div>`).join('');
    }
    return items.map((e, i) => `
      <details class="card" ${i === 0 ? 'open' : ''}>
        <summary><span>🎓</span><span><div class="card-title">${esc(e.school)}</div><div class="card-sub">${joinDot(e.degree, e.period)}</div></span></summary>
        <div class="card-body">${esc(e.detail || '')}</div>
      </details>`).join('');
  }

  let revealSkills = false;
  function renderSkills(classic) {
    if (classic) {
      return `<div class="skills-plain">${CV.skills.map((s) => `<div><span>${esc(s.name)}</span><span>${'★'.repeat(s.level || 0)}${'☆'.repeat(5 - (s.level || 0))}</span></div>`).join('')}</div>`;
    }
    const found = gems.filter((g) => gemCollected(g.i)).length;
    const cats = {};
    const other = t('other');
    CV.skills.forEach((s, i) => { (cats[s.category || other] = cats[s.category || other] || []).push({ ...s, i }); });
    return `
      <div class="skill-info">
        <span>💎 ${t('skillsFound', { n: found, t: gems.length })}</span>
        ${found < gems.length ? `<button class="btn small" data-action="reveal">${revealSkills ? t('hide') : t('reveal')}</button>` : ''}
      </div>
      ${Object.entries(cats).map(([cat, list]) => `
        <h4>${esc(cat.toUpperCase())}</h4>
        <div class="skills">${list.map((s) => {
          const open = revealSkills || gemCollected(s.i);
          const lvl = clamp(s.level || 0, 0, 5);
          return `<div class="skill ${open ? '' : 'locked'}">
            <div class="skill-top"><span>${open ? esc(s.name) : '??? 🔒'}</span><span>${open ? '★'.repeat(lvl) + '☆'.repeat(5 - lvl) : ''}</span></div>
            ${open && s.note ? `<div class="skill-note">${esc(s.note)}</div>` : ''}
            <div class="bar"><i style="--w:${open ? lvl * 20 : 0}%;--c:${catColor(s.category)}"></i></div>
          </div>`;
        }).join('')}</div>`).join('')}`;
  }

  function renderProjects(classic) {
    const items = CV.projects || [];
    if (classic) {
      return items.map((p) => `
        <div class="cv-item">
          <div class="cv-item-head"><strong>${esc(p.name)}</strong>${linkOrText(p.link, t('link'))}</div>
          <div>${esc(p.desc)}</div>
          <div class="chips">${(p.tech || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
        </div>`).join('');
    }
    return etlHtml() + `<p class="muted">${t('projHint')}</p>` + items.map((p, i) => `
      <details class="card">
        <summary><span>🧪</span><span><div class="card-title">${esc(p.name)}</div><div class="card-sub">${(p.tech || []).map(esc).join(' · ')}</div></span></summary>
        <div class="card-body">
          <p style="margin-top:0">${esc(p.desc)}</p>
          <div class="chips">${(p.tech || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
          ${p.link ? `<a class="btn small" href="${esc(p.link)}" target="_blank" rel="noopener">${t('viewProject')}</a>` : ''}
          ${/payroll/i.test(CV_BASE.projects?.[i]?.name || '') && i === 0 ? `<button class="btn small" type="button" data-action="payroll">${t('pgOpen')}</button>` : ''}
        </div>
      </details>`).join('');
  }

  function contactLinks() {
    const c = CV.contact || {};
    const out = [];
    if (c.email) out.push({ icon: '✉️', label: c.email, href: 'mailto:' + c.email });
    if (c.github) out.push({ icon: '🐙', label: 'GitHub', href: c.github });
    if (c.linkedin) out.push({ icon: '💼', label: 'LinkedIn', href: c.linkedin });
    if (c.website) out.push({ icon: '🌐', label: 'Website', href: c.website });
    return out;
  }
  function renderContact(classic) {
    const links = contactLinks();
    if (classic) return links.map((l) => `${l.icon} <a href="${esc(l.href)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(' &nbsp; ');
    return `
      <p>${t('contactIntro')}</p>
      <div class="contact-grid">
        ${links.map((l) => `<a class="btn" href="${esc(l.href)}" target="_blank" rel="noopener">${l.icon} ${esc(l.label)}</a>`).join('')}
        ${CV.contact?.email ? `<button class="btn ghost" data-action="copy">${t('copyEmail')}</button>` : ''}
        ${pdfButton('btn ghost')}
      </div>`;
  }

  const RENDER = { about: renderAbout, experience: renderExperience, education: renderEducation, skills: renderSkills, projects: renderProjects, contact: renderContact };

  function renderClassic() {
    const sec = (title, html) => (html ? `<section><h2>${title}</h2>${html}</section>` : '');
    return `
      <header class="cv-head">
        ${avatarHtml()}
        <div>
          <h1>${esc(CV.name)}</h1>
          <div><strong>${esc(CV.role)}</strong>${CV.location ? ' · ' + esc(CV.location) : ''}</div>
          ${CV.tagline ? `<div class="muted">${esc(CV.tagline)}</div>` : ''}
          <div style="margin-top:6px">${renderContact(true)}</div>
        </div>
      </header>
      ${sec(t('cAbout'), (CV.about || []).map((p) => `<p>${esc(p)}</p>`).join(''))}
      ${sec(t('cLooking'), (CV.lookingFor || []).length ? `<div class="chips">${CV.lookingFor.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : '')}
      ${sec(t('cExp'), renderExperience(true))}
      ${sec(t('cEdu'), renderEducation(true))}
      ${sec(t('cSkills'), CV.skills.length ? renderSkills(true) : '')}
      ${sec(t('cProj'), renderProjects(true))}
      ${sec(t('cInterests'), (CV.interests || []).map(esc).join(' · '))}`;
  }

  // ---------------------------------------------------------------- overlays
  let modalOnClose = null, modalSection = null, modalKind = null;
  function openModal({ title, icon, color, html, section, onClose, kind }) {
    ui.modalTitle.textContent = title;
    ui.modalIcon.textContent = icon || '';
    ui.modal.querySelector('.modal-card').style.setProperty('--accent', color || '#5b8def');
    ui.modalBody.innerHTML = html;
    ui.modalBody.scrollTop = 0;
    ui.modal.classList.remove('hidden');
    modalOnClose = onClose || null;
    modalSection = section || null;
    modalKind = kind || (section ? 'section' : null);
    Sound.open();
  }
  function closeModal() {
    if (ui.modal.classList.contains('hidden')) return;
    ui.modal.classList.add('hidden');
    Sound.close();
    doorCooldown = 0.6;
    const cb = modalOnClose; modalOnClose = null; modalSection = null; modalKind = null;
    if (cb) cb();
  }

  function openSection(b) {
    player.path = null; player.target = null;
    const first = state.visited.length === 0;
    if (!state.visited.includes(b.id)) {
      state.visited.push(b.id);
      persist();
      burst(b.doorX, b.doorY - 30, b.color, 24);
    }
    openModal({
      title: `${b.name} — ${b.label}`, icon: b.icon, color: b.color, section: b.id,
      html: RENDER[b.id](false),
      onClose: () => { if (allSectionsDone()) unlock('all_sections'); checkFinale(); },
    });
    if (first) unlock('first_door');
    updateProgress();
    track('section_open', { id: b.id });
  }

  function openQuest() {
    const v = SECTIONS.filter((s) => state.visited.includes(s.id)).length;
    const g = gems.filter((x) => gemCollected(x.i)).length;
    const total = SECTIONS.length + gems.length;
    const pct = total ? Math.round(((v + g) / total) * 100) : 100;
    ui.questBody.innerHTML = `
      <p>${t('qMain', { name: esc(CV.name) })}</p>
      <div class="progress-big"><i style="--w:${pct}%"></i></div>
      <p class="muted" style="margin:4px 0 0">${t('qPct', { p: pct, g, t: gems.length })}</p>
      <h4>${t('qBuildings')}</h4>
      <ul class="quest-list">${SECTIONS.map((s) => `
        <li class="${state.visited.includes(s.id) ? 'done' : ''}">
          <span>${state.visited.includes(s.id) ? '✅' : '⬜'}</span>
          <span class="q-name">${s.icon} ${esc(s.name)} <span class="muted">· ${esc(s.label)}</span></span>
          <button class="btn small" data-goto="${s.id}">${t('go')}</button>
        </li>`).join('')}</ul>
      <h4>${t('qAch')}</h4>
      <div class="ach-grid">${ACH.map((a) => `
        <div class="ach ${state.ach.includes(a.id) ? '' : 'locked'}"><span class="ach-icon">${a.icon}</span><b>${esc(achName(a))}</b><div class="muted">${esc(achDesc(a))}</div></div>`).join('')}</div>
      <h4>${t('qOther')}</h4>
      <button class="btn ghost small" data-action="reset">${t('reset')}</button>`;
    ui.quest.classList.remove('hidden');
    Sound.click();
  }
  const closeQuest = () => ui.quest.classList.add('hidden');

  function openClassic() {
    ui.classicBody.innerHTML = renderClassic();
    ui.classic.classList.remove('hidden');
    Sound.click();
  }
  const closeClassic = () => ui.classic.classList.add('hidden');

  function openHelp() {
    openModal({ title: t('helpTitle'), icon: '❔', color: '#2bb3a3', html: t('help'), kind: 'help' });
  }

  function anyOverlay() {
    return !ui.modal.classList.contains('hidden') || !ui.quest.classList.contains('hidden') ||
      !ui.classic.classList.contains('hidden') || !ui.title.classList.contains('hidden') ||
      !ui.terminal.classList.contains('hidden');
  }

  // ---------------------------------------------------------------- dialog
  const dlg = { active: false, npc: null, lines: [], i: 0, shown: 0, last: 0 };
  function startDialog(npc) {
    player.path = null; player.target = null;
    const lines = [...((CV.npcs[npc.i] || {}).lines || ['👋'])];
    const todo = SECTIONS.find((s) => !state.visited.includes(s.id));
    const gLeft = gems.filter((g) => !gemCollected(g.i)).length;
    if (weather.rain > 0.3) lines.push(t('npcRain'));
    else if (dark > NIGHT_MAX * 0.5) lines.push(t('npcNight'));
    if (todo) lines.push(t('npcTodo', { place: `${todo.icon} ${todo.name}` }));
    else if (gLeft) lines.push(t('npcGems', { n: gLeft }));
    else lines.push(t('npcDone'));
    Object.assign(dlg, { active: true, npc, lines, i: 0, shown: 0, last: 0 });
    npc.talking = true; npc.path = null; npc.moving = false;
    ui.dialogName.textContent = npc.name;
    ui.dialogText.textContent = '';
    ui.dialog.classList.remove('hidden');
    if (!state.talked.includes(npc.i)) {
      state.talked.push(npc.i); persist();
      if (npcs.every((n) => state.talked.includes(n.i))) unlock('talker');
    }
  }
  function advanceDialog() {
    const line = dlg.lines[dlg.i];
    if (dlg.shown < line.length) { dlg.shown = line.length; return; }
    dlg.i++; dlg.shown = 0; dlg.last = 0;
    if (dlg.i >= dlg.lines.length) endDialog();
  }
  function endDialog() {
    dlg.active = false;
    if (dlg.npc) { dlg.npc.talking = false; dlg.npc.wait = 1.5; }
    ui.dialog.classList.add('hidden');
  }
  function updateDialog(dt) {
    if (!dlg.active) return;
    const line = dlg.lines[dlg.i];
    if (dlg.shown < line.length) {
      dlg.shown = Math.min(line.length, dlg.shown + dt * 45);
      if ((dlg.shown | 0) - dlg.last >= 3) { dlg.last = dlg.shown | 0; Sound.talk(); }
    }
    ui.dialogText.textContent = Array.from(line).slice(0, dlg.shown | 0).join('');
  }

  // ---------------------------------------------------------------- fountain wish
  function makeWish() {
    Sound.coin();
    burst(FOUNTAIN.x, FOUNTAIN.y - 10, '#9ad8ff', 30);
    const wishes = t('wishes');
    toast(`🪙 ${wishes[Math.floor(Math.random() * wishes.length)]}`);
    unlock('wish');
  }

  // ---------------------------------------------------------------- mini-game: optimasi payroll
  const PG_BASE = 12.5; // menit sebelum optimasi
  const PG_EFFECT = [-6, -3, -2.5, -0.7, -0.3, 2]; // efek tiap pilihan (lihat pgOpts di i18n.js)
  const pg = { sel: new Set(), running: false, result: null, raf: 0 };
  const numLocale = () => (state.lang === 'id' ? 'id-ID' : 'en-US');
  const pgMinutes = () => Math.max(0.25, PG_BASE + [...pg.sel].reduce((a, i) => a + PG_EFFECT[i], 0));
  function fmtDur(min) {
    const total = Math.round(min * 60), m = Math.floor(total / 60), sec = total % 60;
    return m ? t('pgMin', { m, s: sec }) : t('pgSec', { s: sec });
  }
  function openPayrollGame() {
    pg.sel.clear(); pg.result = null; pg.running = false;
    openModal({
      title: t('pgTitle'), icon: '🎮', color: '#5b8def', kind: 'payroll', html: '',
      onClose: () => { pg.running = false; cancelAnimationFrame(pg.raf); },
    });
    renderPayroll();
  }
  function renderPayroll() {
    if (modalKind !== 'payroll') return;
    const est = pgMinutes(), pct = clamp((est / PG_BASE) * 100, 2, 100);
    const scroll = ui.modalBody.scrollTop;
    ui.modalBody.innerHTML = `
      <p>${t('pgIntro')}</p>
      <div class="pg-opts">${t('pgOpts').map(([title, hint], i) => `
        <button type="button" class="pg-opt ${pg.sel.has(i) ? 'on' : ''}" data-action="pg-toggle" data-i="${i}" ${pg.running || pg.result ? 'disabled' : ''}>
          <span class="pg-check">${pg.sel.has(i) ? '✅' : '⬜'}</span>
          <span><b>${esc(title)}</b><small>${esc(hint)}</small></span>
        </button>`).join('')}</div>
      <div class="pg-meter">
        <div class="pg-meter-top"><span>${t('pgEstimate')}</span><b>${fmtDur(est)}</b></div>
        <div class="pg-bar"><i class="${est < 1 ? 'good' : ''}" style="width:${pct}%"></i></div>
      </div>
      <div class="pg-run" id="pgRun">${pg.result || `<button class="btn" type="button" data-action="pg-run">${t('pgRun')}</button>`}</div>
      <p class="muted pg-note">${t('pgNote')}</p>`;
    ui.modalBody.scrollTop = scroll;
  }
  function pgToggle(i) {
    if (pg.running || pg.result) return;
    if (pg.sel.has(i)) pg.sel.delete(i); else pg.sel.add(i);
    Sound.tone(PG_EFFECT[i] < 0 ? 880 : 220, 0.06, 'triangle', 0.04);
    renderPayroll();
  }
  function pgRun() {
    if (pg.running) return;
    pg.running = true;
    renderPayroll();
    const minutes = pgMinutes(), dur = clamp(minutes * 350, 700, 5000), total = 5000;
    $('#pgRun').innerHTML = `<div class="pg-bar big"><i id="pgProg" style="width:0%"></i></div><div class="muted" id="pgCount">${t('pgRunning')}</div>`;
    const t0 = performance.now();
    let lastTick = 0;
    const step = (now) => {
      if (!pg.running || modalKind !== 'payroll') return;
      const k = Math.min(1, (now - t0) / dur);
      $('#pgProg').style.width = `${k * 100}%`;
      $('#pgCount').textContent = t('pgProcessed', { n: Math.round(k * total).toLocaleString(numLocale()), t: total.toLocaleString(numLocale()) });
      if (now - lastTick > 120) { lastTick = now; Sound.tone(500 + k * 500, 0.03, 'square', 0.015); }
      if (k < 1) { pg.raf = requestAnimationFrame(step); return; }
      pg.running = false;
      const win = minutes < 1;
      pg.result = `<div class="pg-result ${win ? 'win' : ''}">${t(win ? 'pgWin' : 'pgSlow', { time: fmtDur(minutes), name: esc(CV.name) })}</div>
        <button class="btn ghost small" type="button" data-action="pg-again">${t('pgAgain')}</button>`;
      renderPayroll();
      if (win) { Sound.win(); confetti(70); unlock('optimizer'); track('payroll_win'); }
      else Sound.nope();
    };
    pg.raf = requestAnimationFrame(step);
  }

  // ---------------------------------------------------------------- animasi pipeline ETL (Lab Proyek)
  let etlSel = 0, etlRows = 0, etlShown = -1;
  const ETL_ICONS = ['🗄️', '🐘', '🧮', '📒'];
  function etlHtml() {
    const nodes = t('etlNodes');
    return `
      <div class="etl">
        <h4>${t('etlTitle')}</h4>
        <div class="etl-flow">${nodes.map(([n], i) => `${i ? '<div class="etl-pipe" aria-hidden="true"><i></i><i></i><i></i></div>' : ''}
          <button type="button" class="etl-node ${i === etlSel ? 'on' : ''}" data-action="etl" data-i="${i}"><span class="etl-ic">${ETL_ICONS[i]}</span><span>${esc(n)}</span></button>`).join('')}
        </div>
        <div class="etl-desc" id="etlDesc"><b>${esc(nodes[etlSel][0])}</b> — ${esc(nodes[etlSel][1])}</div>
        <div class="etl-foot"><span class="muted">${t('etlHint')}</span><span><b id="etlCount">${Math.floor(etlRows).toLocaleString(numLocale())}</b> ${t('etlRows')}</span></div>
      </div>`;
  }
  function etlSelect(i) {
    etlSel = i;
    const nodes = t('etlNodes');
    document.querySelectorAll('.etl-node').forEach((el, k) => el.classList.toggle('on', k === i));
    const d = $('#etlDesc');
    if (d) d.innerHTML = `<b>${esc(nodes[i][0])}</b> — ${esc(nodes[i][1])}`;
    Sound.click();
  }
  function updateEtl(dt) {
    if (modalSection !== 'projects') return;
    etlRows += dt * (380 + Math.sin(time * 2) * 120);
    const n = Math.floor(etlRows / 7) * 7;
    if (n !== etlShown) {
      etlShown = n;
      const el = document.getElementById('etlCount');
      if (el) el.textContent = n.toLocaleString(numLocale());
    }
  }

  // ---------------------------------------------------------------- terminal rahasia (SQL mini)
  const term = { hist: [], hi: 0, ready: false, sqlDone: false };
  function openTerminal() {
    if (!ui.title.classList.contains('hidden')) return;
    if (dlg.active) endDialog();
    ui.terminal.classList.remove('hidden');
    if (!term.ready) { term.ready = true; termPrint(TERM_LOGO, 'logo'); termPrint(t('termWelcome'), 'dim'); }
    setTimeout(() => ui.termInput.focus(), 30);
    Sound.click();
  }
  function closeTerminal() { ui.terminal.classList.add('hidden'); ui.termInput.blur(); }
  const TERM_LOGO = String.raw`  ___ __   __   ___                 _
 / __|\ \ / /  / _ \ _  _  ___  ___| |_
| (__  \ V /  | (_) | || |/ -_)(_-<|  _|
 \___|  \_/    \__\_\\_,_|\___|/__/ \__|`;
  function termPrint(text, cls = '') {
    const el = document.createElement('pre');
    el.className = 'tl ' + cls;
    el.textContent = text;
    ui.termOut.appendChild(el);
    while (ui.termOut.children.length > 300) ui.termOut.firstChild.remove();
    ui.termOut.scrollTop = ui.termOut.scrollHeight;
  }
  function termTables() {
    return {
      skills: CV.skills.map((x) => ({ name: x.name, level: x.level || 0, category: x.category || '' })),
      experience: (CV.experience || []).map((x) => ({ title: x.title, company: x.company, period: x.period || '-' })),
      projects: (CV.projects || []).map((x) => ({ name: x.name, tech: (x.tech || []).join(', ') })),
      education: (CV.education || []).map((x) => ({ school: x.school, degree: x.degree, period: x.period || '-' })),
    };
  }
  function asciiTable(rows, cols) {
    const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c]).length)));
    const line = '+' + w.map((n) => '-'.repeat(n + 2)).join('+') + '+';
    const fmt = (vals) => '| ' + vals.map((v, i) => String(v).padEnd(w[i])).join(' | ') + ' |';
    return [line, fmt(cols), line, ...rows.map((r) => fmt(cols.map((c) => r[c]))), line].join('\n');
  }
  function runSql(q) {
    const m = q.match(/^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?\s*;?\s*$/i);
    if (!m) throw new Error('syntax: SELECT cols FROM table [WHERE ...] [ORDER BY col [DESC]] [LIMIT n]');
    const [, colsRaw, table, where, orderBy, dir, limit] = m;
    const tables = termTables();
    const data = tables[table.toLowerCase()];
    if (!data) throw new Error(`relation "${table}" does not exist`);
    const allCols = Object.keys(data[0] || {});
    const checkCol = (c) => { if (!allCols.includes(c)) throw new Error(`column "${c}" does not exist`); return c; };
    let rows = data.slice();
    if (where) {
      const conds = where.split(/\s+and\s+/i).map((c) => {
        const cm = c.trim().match(/^(\w+)\s*(=|!=|<>|>=|<=|>|<|like)\s*(.+)$/i);
        if (!cm) throw new Error(`cannot parse condition "${c.trim()}"`);
        let v = cm[3].trim();
        const quoted = /^'.*'$|^".*"$/.test(v);
        v = quoted ? v.slice(1, -1) : v;
        return { col: checkCol(cm[1].toLowerCase()), op: cm[2].toLowerCase(), v, num: !quoted && v !== '' && !isNaN(v) };
      });
      rows = rows.filter((r) => conds.every(({ col, op, v, num }) => {
        const a = r[col];
        if (op === 'like') return new RegExp('^' + v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$', 'i').test(String(a));
        const x = num ? Number(a) : String(a).toLowerCase(), y = num ? Number(v) : v.toLowerCase();
        return { '=': x === y, '!=': x !== y, '<>': x !== y, '>': x > y, '<': x < y, '>=': x >= y, '<=': x <= y }[op];
      }));
    }
    if (orderBy) {
      const c = checkCol(orderBy.toLowerCase()), sgn = /desc/i.test(dir || '') ? -1 : 1;
      rows.sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * sgn);
    }
    if (limit) rows = rows.slice(0, +limit);
    if (/^count\(\*\)$/i.test(colsRaw.trim())) return asciiTable([{ count: rows.length }], ['count']);
    const cols = colsRaw.trim() === '*' ? allCols : colsRaw.split(',').map((c) => checkCol(c.trim().toLowerCase()));
    return asciiTable(rows, cols) + '\n' + t('termRows', { n: rows.length });
  }
  function runCommand(raw) {
    const cmd = String(raw || '').trim();
    termPrint('dinul@cv-quest:~$ ' + cmd, 'cmd');
    if (!cmd) return;
    term.hist.push(cmd); term.hi = term.hist.length;
    const [c0, ...args] = cmd.split(/\s+/);
    const c = c0.toLowerCase();
    const contact = CV.contact || {};
    try {
      if (/^select\b/i.test(cmd)) {
        termPrint(runSql(cmd));
        if (!term.sqlDone) { term.sqlDone = true; unlock('hacker'); track('terminal_sql'); }
      } else if (c === 'help') {
        termPrint([t('termHelp'),
          '  SELECT * FROM skills WHERE level >= 4 ORDER BY level DESC;',
          '  SELECT name, tech FROM projects;',
          '  SELECT COUNT(*) FROM skills WHERE category = \'Backend\';',
          '  show tables · describe <table> · whoami · ls · cat <file>',
          '  neofetch · lang id|en · hire · coffee · date · clear · exit'].join('\n'));
      } else if (c === 'show' && /^tables;?$/i.test(args[0] || '')) {
        termPrint(asciiTable(Object.keys(termTables()).map((n) => ({ table: n })), ['table']));
      } else if (c === 'describe' || c === 'desc') {
        const name = (args[0] || '').replace(/;$/, '').toLowerCase(), tb = termTables()[name];
        if (!tb) throw new Error(`relation "${name}" does not exist`);
        termPrint(asciiTable(Object.keys(tb[0] || {}).map((k) => ({ column: k, type: typeof tb[0][k] === 'number' ? 'int' : 'text' })), ['column', 'type']));
      } else if (c === 'whoami') {
        termPrint(`${CV.name} — ${CV.role}${CV.location ? ' · ' + CV.location : ''}`);
      } else if (c === 'ls') {
        termPrint('about.txt  contact.txt  skills.db  experience.db  projects.db  education.db');
      } else if (c === 'cat') {
        const f = (args[0] || '').toLowerCase();
        if (f === 'about.txt') termPrint((CV.about || []).join('\n\n'));
        else if (f === 'contact.txt') termPrint(Object.entries(contact).filter(([, v]) => v).map(([k, v]) => `${k.padEnd(9)} ${v}`).join('\n') || '-');
        else if (/\.db$/.test(f)) termPrint(`(binary) — try: SELECT * FROM ${f.replace(/\.db$/, '')};`);
        else throw new Error(`cat: ${args[0] || ''}: No such file`);
      } else if (c === 'neofetch') {
        const top = CV.skills.slice().sort((a, b) => (b.level || 0) - (a.level || 0)).slice(0, 4).map((x) => x.name).join(', ');
        termPrint([`   .--.      ${CV.name}`, `  |o_o |     role:     ${CV.role}`, `  |:_/ |     location: ${CV.location || '-'}`,
          ` //   \\ \\    skills:   ${CV.skills.length} (${top}…)`, `(|     | )   projects: ${(CV.projects || []).length}`,
          `/'\\_   _/\`\\  uptime:   ${Math.floor(time / 60)}m ${Math.floor(time % 60)}s in CV Quest`, `\\___)=(___/`].join('\n'));
      } else if (c === 'lang') {
        const l = (args[0] || '').toLowerCase();
        if (!I18N[l]) throw new Error('usage: lang id|en');
        setLang(l); termPrint(t('langToast'));
      } else if (c === 'hire' || (c === 'sudo' && /hire/i.test(args.join(' ')))) {
        if (c === 'sudo') termPrint(t('termSudo'));
        termPrint(t('termHire'));
        setTimeout(() => { closeTerminal(); openSection(SECTIONS.find((x) => x.id === 'contact')); }, 700);
      } else if (c === 'sudo') {
        termPrint(t('termSudo'));
      } else if (c === 'coffee') {
        termPrint(t('termCoffee'));
      } else if (c === 'date') {
        termPrint(new Date().toLocaleString(numLocale()));
      } else if (c === 'echo') {
        termPrint(args.join(' '));
      } else if (c === 'clear' || c === 'cls') {
        ui.termOut.innerHTML = '';
      } else if (c === 'exit' || c === 'quit') {
        closeTerminal();
      } else {
        termPrint(t('termNotFound', { c: c0 }), 'err');
      }
    } catch (err) {
      termPrint(t('termSqlError', { e: err.message }), 'err');
    }
  }
  ui.termInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && term.hist.length) { term.hi = Math.max(0, term.hi - 1); ui.termInput.value = term.hist[term.hi]; e.preventDefault(); }
    else if (e.key === 'ArrowDown') { term.hi = Math.min(term.hist.length, term.hi + 1); ui.termInput.value = term.hist[term.hi] || ''; e.preventDefault(); }
  });
  ui.terminal.addEventListener('pointerdown', (e) => { if (e.target === ui.terminal) closeTerminal(); else if (!e.target.closest('input')) setTimeout(() => ui.termInput.focus(), 0); });

  // ---------------------------------------------------------------- cuaca (hujan)
  const weather = { rain: state.weather === 'rain' ? 1 : 0, target: 0, timer: 70 + Math.random() * 60, drops: [], raining: false, noise: null, gain: null };
  function updateWeather(dt) {
    if (state.weather === 'clear') weather.target = 0;
    else if (state.weather === 'rain') weather.target = 1;
    else {
      weather.timer -= dt;
      if (weather.timer <= 0) {
        if (weather.target > 0) { weather.target = 0; weather.timer = 90 + Math.random() * 120; }
        else if (Math.random() < 0.5) { weather.target = 0.55 + Math.random() * 0.45; weather.timer = 35 + Math.random() * 35; }
        else weather.timer = 60 + Math.random() * 60;
      }
    }
    weather.rain += (weather.target - weather.rain) * Math.min(1, dt * 0.7);
    const raining = weather.rain > 0.3;
    if (raining !== weather.raining) {
      weather.raining = raining;
      if (state.weather === 'auto' && ui.title.classList.contains('hidden') && !anyOverlay()) toast(t(raining ? 'rainStarts' : 'rainStops'), 2200);
    }
    // tetesan hujan (ruang layar)
    const want = Math.round(240 * weather.rain);
    while (weather.drops.length < want) weather.drops.push({ x: Math.random() * (vw + 100), y: Math.random() * -vh, s: 560 + Math.random() * 300, l: 14 + Math.random() * 14 });
    if (weather.drops.length > want) weather.drops.length = want;
    for (const d of weather.drops) {
      d.y += d.s * dt; d.x -= d.s * 0.18 * dt;
      if (d.y > vh) { d.y = -20 - Math.random() * 60; d.x = Math.random() * (vw + 100); }
    }
    // percikan di tanah
    if (!weather.splashes) weather.splashes = [];
    for (let k = 0; k < weather.rain * 40 * dt * 10; k++) if (Math.random() < 0.1) weather.splashes.push({ x: Math.random() * vw, y: Math.random() * vh, t: 0 });
    weather.splashes = weather.splashes.filter((p) => (p.t += dt) < 0.35);
    updateRainSound();
  }
  function updateRainSound() {
    const c = Sound.ctx;
    if (!c) return;
    const vol = state.muted || !ui.title.classList.contains('hidden') ? 0 : 0.05 * weather.rain;
    if (!weather.noise && vol > 0.001) {
      const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6;
      weather.gain = c.createGain(); weather.gain.gain.value = 0;
      src.connect(f).connect(weather.gain).connect(c.destination); src.start();
      weather.noise = src;
    }
    if (weather.gain && Math.abs(weather.gain.gain.value - vol) > 0.002) weather.gain.gain.setTargetAtTime(vol, c.currentTime, 0.3);
  }
  function drawRain() {
    if (weather.rain < 0.02) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgba(30,45,75,${0.3 * weather.rain})`;
    ctx.fillRect(0, 0, vw, vh);
    ctx.strokeStyle = `rgba(210,228,255,${0.4 + 0.25 * weather.rain})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (const d of weather.drops) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * 0.18, d.y - d.l); }
    ctx.stroke();
    ctx.lineWidth = 1;
    for (const p of weather.splashes || []) {
      const k = p.t / 0.35;
      ctx.strokeStyle = `rgba(210,228,255,${0.6 * (1 - k)})`;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, 2 + k * 6, 1 + k * 2.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // ---------------------------------------------------------------- kucing desa
  const catHome = nearestReachable(13, 13);
  const cat = { x: catHome.x * TILE + 16, y: catHome.y * TILE + 22, dir: 'right', path: null, wait: 2, moving: false, phase: 0, repath: 0, i: 7 };
  function updateCat(dt) {
    if (state.catFed) {
      const d = Math.hypot(player.x - cat.x, player.y - cat.y);
      cat.repath -= dt;
      if (d > 52 && cat.repath <= 0) {
        cat.repath = 0.5;
        const s0 = tileOf(cat), g = tileOf(player);
        const p = findPath(s0.x, s0.y, g.x, g.y);
        cat.path = p && p.length > 1 ? p.slice(0, -1) : null;
      }
      if (d < 34) cat.path = null;
      if (cat.path) { if (followPath(cat, d > 140 ? 200 : 140, dt)) cat.moving = false; }
      else { cat.moving = false; if (d < 60) cat.dir = player.x < cat.x ? 'left' : 'right'; }
    } else if (cat.path) {
      if (followPath(cat, 40, dt)) cat.moving = false;
    } else {
      cat.moving = false;
      cat.wait -= dt;
      if (cat.wait <= 0) {
        cat.wait = 2 + Math.random() * 4;
        const tx = catHome.x + Math.round((Math.random() - 0.5) * 6), ty = catHome.y + Math.round((Math.random() - 0.5) * 4);
        if (inb(tx, ty) && reach[ty][tx]) { const s0 = tileOf(cat); cat.path = findPath(s0.x, s0.y, tx, ty); if (cat.path && !cat.path.length) cat.path = null; }
      }
    }
    if (cat.moving) cat.phase += dt * 14;
  }
  function interactCat() {
    Sound.meow();
    hearts(cat.x, cat.y - 18);
    if (!state.catFed) {
      state.catFed = true; persist();
      toast(t('catFed', { name: t('catName') }), 3200);
      unlock('cat');
      track('cat_fed');
    } else {
      const lines = t('catPet');
      toast(lines[Math.floor(Math.random() * lines.length)].replace('{name}', t('catName')), 1800);
    }
  }
  const CAT_H = 22; // tinggi sprite kucing (satuan dunia)
  function drawCat() {
    const { x, y } = cat, flip = cat.dir === 'left' ? -1 : 1;
    const step = cat.moving ? Math.sin(cat.phase) : 0, bob = Math.abs(step) * 1.2;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x, y, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    const im = sprite('cat');
    if (im) {
      // strip 4 frame: bawah, kiri, kanan, atas (sama seperti player.png)
      const fw = im.naturalWidth / 4, fh = im.naturalHeight;
      const h = CAT_H, w = (fw / fh) * h;
      const f = Math.max(0, DIRS.indexOf(cat.dir));
      ctx.save(); ctx.translate(x, y + 1 - bob); ctx.rotate(step * 0.06);
      ctx.drawImage(im, f * fw, 0, fw, fh, -w / 2, -h, w, h);
      ctx.restore();
    } else drawCatShape(x, y, flip, step, bob);
    if (!state.catFed) {
      const by = y - 32 + Math.sin(time * 3) * 2;
      ctx.fillStyle = '#fff'; rrect(ctx, x - 10, by - 9, 20, 15, 5); ctx.fill();
      ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🐟', x, by - 1);
    }
  }
  // kucing bawaan (digambar kode) bila assets/cat.png tidak ada
  function drawCatShape(x, y, flip, step, bob) {
    ctx.save(); ctx.translate(x, y - bob); ctx.scale(flip, 1);
    const wag = Math.sin(time * (cat.moving ? 8 : 3));
    ctx.strokeStyle = '#d9822f'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-7, -7); ctx.quadraticCurveTo(-14, -9 + wag * 3, -12 + wag, -17); ctx.stroke();
    ctx.fillStyle = '#d9822f';
    ctx.fillRect(-6, -4, 2.4, 4 + step * 1.5); ctx.fillRect(-2, -4, 2.4, 4 - step * 1.5);
    ctx.fillRect(2, -4, 2.4, 4 - step * 1.5); ctx.fillRect(5, -4, 2.4, 4 + step * 1.5);
    ctx.fillStyle = '#f2a65a';
    ctx.beginPath(); ctx.ellipse(0, -7, 8.5, 4.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d07a2a'; ctx.lineWidth = 1.2;
    for (const sx of [-4, -1, 2]) { ctx.beginPath(); ctx.moveTo(sx, -11); ctx.lineTo(sx + 1, -8); ctx.stroke(); }
    ctx.fillStyle = '#f2a65a';
    ctx.beginPath(); ctx.arc(8, -12, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4.2, -15); ctx.lineTo(5, -20.5); ctx.lineTo(7.8, -16); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8.5, -16.5); ctx.lineTo(11.5, -20); ctx.lineTo(12.2, -14.5); ctx.fill();
    ctx.fillStyle = '#2a1d14';
    const blink = Math.sin(time * 1.1 + 2) > 0.97;
    ctx.fillRect(9.2, -13, 1.5, blink ? 0.5 : 2);
    ctx.fillStyle = '#ff8fa3'; ctx.fillRect(12, -11.5, 1.4, 1.2);
    ctx.restore();
  }

  // ---------------------------------------------------------------- papan tamu
  const gb = { entries: null, status: 'idle', note: '', sending: false };
  function openGuestbook() {
    player.path = null; player.target = null;
    gb.note = '';
    openModal({ title: t('gbName'), icon: '📋', color: '#a0673c', kind: 'guestbook', html: '' });
    renderGuestbookShell();
    loadGuestbook();
  }
  function renderGuestbookShell() {
    if (modalKind !== 'guestbook') return;
    ui.modalBody.innerHTML = `
      <p>${t('gbIntro', { name: esc(CV.name) })}</p>
      <form class="gb-form" id="gbForm" autocomplete="off">
        <input id="gbNameIn" maxlength="24" placeholder="${esc(t('gbNamePh'))}" aria-label="${esc(t('gbNamePh'))}" />
        <textarea id="gbMsgIn" maxlength="140" rows="2" placeholder="${esc(t('gbMsgPh'))}" aria-label="${esc(t('gbMsgPh'))}"></textarea>
        <div class="gb-row"><span class="muted" id="gbCount">0/140</span><button class="btn small" id="gbSend" type="submit">${esc(t('gbPost'))}</button></div>
        <div class="gb-note" id="gbNote" aria-live="polite">${esc(gb.note)}</div>
        <div class="muted gb-rules">${esc(t('gbRules'))}</div>
      </form>
      <div class="gb-list" id="gbList"></div>`;
    $('#gbMsgIn').addEventListener('input', (e) => { $('#gbCount').textContent = `${e.target.value.length}/140`; });
    renderGbList();
  }
  function renderGbList() {
    const el = $('#gbList');
    if (!el) return;
    if (gb.status === 'loading' && !gb.entries) { el.innerHTML = `<p class="muted">${esc(t('gbLoading'))}</p>`; return; }
    if (gb.status === 'offline') { el.innerHTML = `<p class="muted">${esc(t('gbOffline'))}</p>`; return; }
    if (!gb.entries || !gb.entries.length) { el.innerHTML = `<p class="muted">${esc(t('gbEmpty'))}</p>`; return; }
    el.innerHTML = gb.entries.map((e, i) => `
      <div class="gb-note-card" style="--r:${((i * 37) % 7) - 3}deg">
        <div class="gb-msg">${esc(e.m)}</div>
        <div class="gb-meta">— ${esc(e.n || t('gbAnon'))} · ${esc(new Date(e.t).toLocaleDateString(numLocale(), { day: 'numeric', month: 'short', year: 'numeric' }))}</div>
      </div>`).join('');
  }
  async function loadGuestbook() {
    gb.status = 'loading'; renderGbList();
    try {
      const r = await fetch('api/guestbook');
      const data = r.ok ? await r.json() : null;
      if (data && Array.isArray(data.entries)) { gb.entries = data.entries; gb.status = 'ok'; }
      else gb.status = 'offline';
    } catch (e) { gb.status = 'offline'; }
    renderGbList();
  }
  async function postGuestbook() {
    const nameEl = $('#gbNameIn'), msgEl = $('#gbMsgIn'), note = $('#gbNote');
    const m = msgEl.value.trim();
    if (m.length < 2 || gb.sending) return;
    gb.sending = true; $('#gbSend').disabled = true;
    let key = 'gbError';
    try {
      const r = await fetch('api/guestbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nameEl.value, message: m }) });
      const data = await r.json().catch(() => ({}));
      if (r.status === 201 && data.entry) {
        key = 'gbThanks';
        gb.entries = [data.entry, ...(gb.entries || [])]; gb.status = 'ok';
        msgEl.value = ''; $('#gbCount').textContent = '0/140';
        unlock('guest'); track('guestbook_post'); Sound.coin();
        renderGbList();
      } else if (r.status === 400 && data.error === 'rejected') key = 'gbRejected';
      else if (r.status === 429) key = 'gbRate';
      else if (r.status === 503 || r.status === 404 || r.status === 405) key = 'gbOffline';
    } catch (e) { key = 'gbOffline'; }
    gb.sending = false;
    if ($('#gbSend')) $('#gbSend').disabled = false;
    gb.note = t(key);
    if (note) note.textContent = gb.note;
    if (key !== 'gbThanks') Sound.nope();
  }
  const BOARD_W = 54; // lebar sprite papan tamu (satuan dunia)
  function drawBoard() {
    const { x, y } = BOARD;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x, y, 20, 4, 0, 0, Math.PI * 2); ctx.fill();
    const im = sprite('guestbook');
    if (im) {
      const w = BOARD_W, h = (im.naturalHeight / im.naturalWidth) * w;
      ctx.drawImage(im, x - w / 2, y - h + 2, w, h);
      return;
    }
    ctx.fillStyle = '#6b4226';
    ctx.fillRect(x - 17, y - 34, 4, 34); ctx.fillRect(x + 13, y - 34, 4, 34);
    ctx.fillStyle = '#a0673c'; rrect(ctx, x - 22, y - 46, 44, 28, 3); ctx.fill();
    ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 2; ctx.stroke();
    const notes = [['#fff6c2', -16, -42, -0.08], ['#c9f1ff', -3, -43, 0.06], ['#ffd6e7', 9, -41, -0.05], ['#e2ffd0', -10, -31, 0.07], ['#fff', 4, -31, -0.04]];
    for (const [col, nx, ny, r] of notes) {
      ctx.save(); ctx.translate(x + nx + 4, y + ny + 4); ctx.rotate(r);
      ctx.fillStyle = col; ctx.fillRect(-5, -4, 10, 8);
      ctx.fillStyle = '#e8577e'; ctx.fillRect(-1, -5, 2, 2);
      ctx.restore();
    }
    ctx.fillStyle = '#5a3a20';
    ctx.beginPath(); ctx.moveTo(x - 25, y - 46); ctx.lineTo(x + 25, y - 46); ctx.lineTo(x + 20, y - 51); ctx.lineTo(x - 20, y - 51); ctx.closePath(); ctx.fill();
  }

  // partikel hati (kucing)
  function hearts(x, y) {
    for (let k = 0; k < 6; k++) parts.push({ x: x + (Math.random() - 0.5) * 16, y, vx: (Math.random() - 0.5) * 30, vy: -50 - Math.random() * 40, life: 1, t: 0, color: '#ff6b8a', size: 9, heart: true });
  }

  // ---------------------------------------------------------------- finale
  function checkFinale() {
    if (state.finale || !allSectionsDone() || !allGemsDone()) return;
    state.finale = true; persist();
    track('finale');
    Sound.win();
    confetti(160);
    setTimeout(() => openModal({
      title: t('finTitle'), icon: '🏆', color: '#f2a541', kind: 'finale',
      html: `
        <p style="font-size:1.1rem">${t('finThanks', { name: esc(CV.name) })}</p>
        <p>${t('finStats', { b: SECTIONS.length, g: gems.length, a: achCount() })}</p>
        <div class="contact-grid">
          <button class="btn" data-action="contact">${t('finContact')}</button>
          <button class="btn ghost" data-action="classic">${t('finCV')}</button>
          ${pdfButton('btn ghost')}
          <button class="btn ghost" data-action="reset">${t('finAgain')}</button>
        </div>`,
    }), 900);
  }

  function resetGame() {
    if (!confirm(t('resetConfirm'))) return;
    store.save({ muted: state.muted, music: state.music, timeMode: state.timeMode, weather: state.weather, lang: state.lang });
    location.reload();
  }

  // ---------------------------------------------------------------- particles
  const parts = [], confs = [];
  function burst(x, y, color, n = 16) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, sp = 30 + Math.random() * 90;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.6 + Math.random() * 0.5, t: 0, color, size: 1.5 + Math.random() * 2.5 });
    }
  }
  function confetti(n) {
    const cols = ['#f2c14e', '#e8577e', '#5b8def', '#80ed99', '#c77dff', '#4cc9f0'];
    for (let k = 0; k < n; k++) {
      confs.push({ x: Math.random() * vw, y: -20 - Math.random() * vh * 0.5, vx: (Math.random() - 0.5) * 80, vy: 80 + Math.random() * 120, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10, color: cols[k % cols.length], w: 6 + Math.random() * 5, h: 4 + Math.random() * 4 });
    }
  }
  function updateParticles(dt) {
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.heart ? 0 : 160) * dt; p.vx *= 0.98;
      if (p.t > p.life) parts.splice(k, 1);
    }
    for (let k = confs.length - 1; k >= 0; k--) {
      const c = confs[k];
      c.x += c.vx * dt; c.y += c.vy * dt; c.r += c.vr * dt; c.vx += Math.sin(time * 3 + k) * 20 * dt;
      if (c.y > vh + 20) confs.splice(k, 1);
    }
  }

  // ---------------------------------------------------------------- input
  const keys = {};
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
  window.addEventListener('keydown', (e) => {
    // terminal rahasia: tombol ` (atau ~) membuka/menutup
    if (e.code === 'Backquote' && ui.title.classList.contains('hidden')) {
      const open = !ui.terminal.classList.contains('hidden');
      if (open) { e.preventDefault(); closeTerminal(); return; }
      if (!anyOverlay()) { e.preventDefault(); openTerminal(); return; }
    }
    if (!ui.terminal.classList.contains('hidden')) {
      if (e.code === 'Escape') closeTerminal();
      return;
    }
    if (!ui.title.classList.contains('hidden')) {
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); startGame(); }
      else if (e.code === 'KeyL') setLang(state.lang === 'id' ? 'en' : 'id');
      return;
    }
    if (e.code === 'Escape') {
      if (!ui.settings.classList.contains('hidden')) ui.settings.classList.add('hidden');
      else if (dlg.active) endDialog();
      else if (!ui.modal.classList.contains('hidden')) closeModal();
      else if (!ui.quest.classList.contains('hidden')) closeQuest();
      else if (!ui.classic.classList.contains('hidden')) closeClassic();
      return;
    }
    if (anyOverlay()) return;
    if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = true; e.preventDefault(); return; }
    if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (dlg.active) advanceDialog();
      else if (current) interact(current);
    } else if (e.code === 'KeyQ') openQuest();
    else if (e.code === 'KeyC') openClassic();
    else if (e.code === 'KeyM') toggleSound();
    else if (e.code === 'KeyN') toggleMusic();
    else if (e.code === 'KeyT') toggleDayNight();
    else if (e.code === 'KeyR') toggleWeather();
    else if (e.code === 'KeyL') setLang(state.lang === 'id' ? 'en' : 'id');
    else if (e.code === 'KeyH') openHelp();
  });
  window.addEventListener('keyup', (e) => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

  function screenToWorld(cx, cy) { return { x: cx / zoom + cam.x, y: cy / zoom + cam.y }; }
  function hitBuilding(w) {
    return SECTIONS.find((b) => w.x > b.tx * TILE - 4 && w.x < (b.tx + BW) * TILE + 4 && w.y > buildingTop(b) + 10 && w.y < (b.ty + BH) * TILE);
  }
  const hitNpc = (w) => npcs.find((n) => Math.abs(w.x - n.x) < 14 && w.y > n.y - (sprite(n.sprite) ? CHAR_H : 36) && w.y < n.y + 6);
  const hitFountain = (w) => Math.hypot(w.x - FOUNTAIN.x, w.y - FOUNTAIN.y) < 48;
  const hitCat = (w) => Math.abs(w.x - cat.x) < 14 && w.y > cat.y - 24 && w.y < cat.y + 6;
  const hitBoard = (w) => Math.abs(w.x - BOARD.x) < 24 && w.y > BOARD.y - 52 && w.y < BOARD.y + 4;

  let hover = null;
  canvas.addEventListener('pointermove', (e) => {
    if (isTouch) return;
    const w = screenToWorld(e.clientX, e.clientY);
    hover = (hitCat(w) ? cat : null) || (hitBoard(w) ? BOARD : null) || hitBuilding(w) || hitNpc(w) || (hitFountain(w) ? 'fountain' : null);
    canvas.style.cursor = hover ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerdown', (e) => {
    Sound.init();
    ui.settings.classList.add('hidden');
    if (anyOverlay()) return;
    if (dlg.active) { advanceDialog(); return; }
    const w = screenToWorld(e.clientX, e.clientY);
    if (hitCat(w)) return goToCat();
    if (hitBoard(w)) return goToBoard();
    const b = hitBuilding(w);
    if (b) return goToBuilding(b);
    const n = hitNpc(w);
    if (n) return goToNpc(n);
    if (hitFountain(w)) return goToFountain();
    walkTo(Math.floor(w.x / TILE), Math.floor(w.y / TILE), null);
  });

  ui.dialog.addEventListener('pointerdown', (e) => { e.stopPropagation(); advanceDialog(); });
  ui.action.addEventListener('click', () => { Sound.init(); if (dlg.active) advanceDialog(); else if (current) interact(current); });

  mm.addEventListener('pointerdown', (e) => {
    if (anyOverlay() || dlg.active) return;
    const r = mm.getBoundingClientRect();
    const pad = 4;
    const x = Math.floor(((e.clientX - r.left - pad) / (r.width - pad * 2)) * MW);
    const y = Math.floor(((e.clientY - r.top - pad) / (r.height - pad * 2)) * MH);
    const b = bld[y]?.[x];
    if (b) goToBuilding(b); else walkTo(x, y, null);
  });

  // klik di dalam overlay
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-close], [data-action], [data-goto], [data-lang]');
    if (!e.target.closest('#settings, #btnSettings')) ui.settings.classList.add('hidden');
    if (el && el.dataset.lang) { Sound.init(); setLang(el.dataset.lang); return; }
    const t2 = el;
    if (!t2) {
      if (e.target === ui.modal) closeModal();
      else if (e.target === ui.quest) closeQuest();
      else if (e.target === ui.classic) closeClassic();
      return;
    }
    if (t2.hasAttribute('data-close')) {
      if (t2.closest('#modal')) closeModal();
      else if (t2.closest('#quest')) closeQuest();
      else if (t2.closest('#classic')) closeClassic();
    } else if (t2.dataset.goto) {
      closeQuest();
      goToBuilding(SECTIONS.find((s) => s.id === t2.dataset.goto));
    } else {
      const a = t2.dataset.action;
      if (a === 'reveal') { revealSkills = !revealSkills; ui.modalBody.innerHTML = renderSkills(false); Sound.click(); }
      else if (a === 'copy') {
        const done = () => toast(t('copied'));
        try { navigator.clipboard.writeText(CV.contact.email).then(done, () => prompt(t('copyPrompt'), CV.contact.email)); }
        catch (err) { prompt(t('copyPrompt'), CV.contact.email); }
      } else if (a === 'reset') resetGame();
      else if (a === 'classic') { closeModal(); openClassic(); }
      else if (a === 'contact') { closeModal(); openSection(SECTIONS.find((s) => s.id === 'contact')); }
      else if (a === 'sound') toggleSound();
      else if (a === 'music') toggleMusic();
      else if (a === 'time') toggleTime();
      else if (a === 'weather') toggleWeather();
      else if (a === 'terminal') { ui.settings.classList.add('hidden'); openTerminal(); }
      else if (a === 'payroll') { if (modalKind) closeModal(); openPayrollGame(); }
      else if (a === 'pg-toggle') pgToggle(+t2.dataset.i);
      else if (a === 'pg-run') pgRun();
      else if (a === 'pg-again') { pg.sel.clear(); pg.result = null; renderPayroll(); }
      else if (a === 'etl') etlSelect(+t2.dataset.i);
      else if (a === 'gb-reload') loadGuestbook();
    }
  });
  document.addEventListener('click', (e) => { if (e.target.closest('[data-pdf]')) track('pdf_download', { lang: state.lang }); });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'gbForm') { e.preventDefault(); postGuestbook(); return; }
    if (e.target.id === 'termForm') { e.preventDefault(); runCommand(ui.termInput.value); ui.termInput.value = ''; return; }
  });

  $('#btnQuest').onclick = () => { Sound.init(); openQuest(); };
  $('#btnCV').onclick = () => { Sound.init(); openClassic(); };
  $('#btnHelp').onclick = () => { Sound.init(); openHelp(); };
  $('#btnSettings').onclick = () => { Sound.init(); ui.settings.classList.toggle('hidden'); updateSettingsUI(); };
  $('#btnDayNight').onclick = toggleDayNight;
  $('#btnLang').onclick = () => { Sound.init(); setLang(state.lang === 'id' ? 'en' : 'id'); };
  $('#btnPrint').onclick = () => window.print();
  $('#btnStart').onclick = startGame;
  $('#btnStartClassic').onclick = () => { startGame(); openClassic(); };

  function toggleSound() {
    state.muted = !state.muted; persist();
    updateSettingsUI();
    if (!state.muted) Sound.click();
  }
  function toggleMusic() {
    Sound.init();
    state.music = !state.music; persist();
    if (state.music) Music.start(); else Music.stop();
    updateSettingsUI();
    toast(t(state.music ? 'musicOn' : 'musicOff'), 1600);
  }
  // tombol 🌙/☀️: lompat ke malam atau pagi, lalu siklus waktu berjalan seperti biasa
  function toggleDayNight() {
    Sound.init();
    const toNight = dark < NIGHT_MAX * 0.5;
    state.timeMode = 'auto';
    clock = toNight ? 0.92 : 0.27; // ±22.00 atau ±06.30
    persist();
    updateSettingsUI();
    Sound.seq(toNight ? [784, 659, 523] : [523, 659, 784], 0.07, 'triangle', 0.045);
  }
  function toggleTime() {
    const order = ['auto', 'day', 'night'];
    state.timeMode = order[(order.indexOf(state.timeMode) + 1) % order.length]; persist();
    updateSettingsUI();
    toast(t({ auto: 'timeAuto', day: 'timeDay', night: 'timeNight' }[state.timeMode]), 1800);
    Sound.click();
  }
  const MODE_ICON = { auto: '🌗', day: '☀️', night: '🌙' };
  function updateSettingsUI() {
    $('#setSoundVal').textContent = state.muted ? '🔇 ' + t('off') : '🔊 ' + t('on');
    $('#setMusicVal').textContent = state.music ? '🎵 ' + t('on') : '🔕 ' + t('off');
    $('#setTimeVal').textContent = MODE_ICON[state.timeMode] + ' ' + t({ auto: 'modeAuto', day: 'modeDay', night: 'modeNight' }[state.timeMode]);
    $('#setWeatherVal').textContent = { auto: '🌦️ ', clear: '☀️ ', rain: '🌧️ ' }[state.weather] + t({ auto: 'wAuto', clear: 'wClear', rain: 'wRain' }[state.weather]);
  }
  function toggleWeather() {
    const order = ['auto', 'clear', 'rain'];
    state.weather = order[(order.indexOf(state.weather) + 1) % order.length]; persist();
    weather.timer = 20 + Math.random() * 40;
    updateSettingsUI();
    Sound.click();
  }

  // ---------------------------------------------------------------- ganti bahasa
  function applyI18n() {
    document.documentElement.lang = state.lang;
    SECTIONS.forEach((b) => { [b.name, b.label] = t('sec.' + b.id); });
    npcs.forEach((n) => { n.name = (CV.npcs[n.i] || {}).name || n.name; });
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => {
      el.title = t(el.dataset.i18nTitle);
      el.setAttribute('aria-label', el.title);
    });
    document.querySelectorAll('[data-lang]').forEach((el) => el.classList.toggle('active', el.dataset.lang === state.lang));
    $('#btnLang').textContent = state.lang.toUpperCase();
    const pdf = $('#btnPdf');
    if (pdf) { pdf.href = pdfUrl(); pdf.textContent = t('downloadPdf'); }
    if (ui.termInput) ui.termInput.placeholder = 'help';
    $('#hudName').textContent = CV.name || '';
    $('#hudRole').textContent = CV.role || '';
    $('#titleName').textContent = CV.name || '';
    $('#titleRole').textContent = CV.role || '';
    $('#titleTag').textContent = CV.tagline || '';
    $('#btnStart').textContent = t(state.visited.length || state.gems.length ? 'continue' : 'start');
    lastPromptKey = '';
    updateProgress();
    updateSettingsUI();
  }
  function setLang(l) {
    if (!I18N[l] || l === state.lang) return;
    state.lang = l; persist();
    buildCV();
    applyI18n();
    if (dlg.active) endDialog();
    // panel yang sedang terbuka digambar ulang dalam bahasa baru
    if (!ui.quest.classList.contains('hidden')) openQuest();
    if (!ui.classic.classList.contains('hidden')) ui.classicBody.innerHTML = renderClassic();
    if (!ui.modal.classList.contains('hidden')) {
      if (modalSection) {
        const b = SECTIONS.find((x) => x.id === modalSection);
        ui.modalTitle.textContent = `${b.name} — ${b.label}`;
        ui.modalBody.innerHTML = RENDER[b.id](false);
      } else if (modalKind === 'help') {
        ui.modalTitle.textContent = t('helpTitle'); ui.modalBody.innerHTML = t('help');
      } else if (modalKind === 'payroll') {
        ui.modalTitle.textContent = t('pgTitle');
        if (!pg.running) renderPayroll();
      } else if (modalKind === 'guestbook') {
        ui.modalTitle.textContent = t('gbName');
        renderGuestbookShell(); renderGbList();
      }
    }
    track('language', { lang: l });
    if (ui.title.classList.contains('hidden')) toast(t('langToast'), 1600);
    else Sound.click();
  }

  // ---------------------------------------------------------------- movement
  const SPEED = 150;
  let doorCooldown = 0;
  function blockedAt(x, y) {
    const x0 = Math.floor((x - 6) / TILE), x1 = Math.floor((x + 5.99) / TILE);
    const y0 = Math.floor((y - 5) / TILE), y1 = Math.floor((y + 0.99) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!inb(tx, ty) || solid[ty][tx]) return true;
    return false;
  }
  function setDir(c, dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) c.dir = dx > 0 ? 'right' : 'left';
    else if (dy) c.dir = dy > 0 ? 'down' : 'up';
  }
  function followPath(c, speed, dt) {
    const wp = c.path[0];
    const tx = wp.x * TILE + 16, ty = wp.y * TILE + 22;
    const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy), step = speed * dt;
    setDir(c, dx, dy);
    c.moving = true;
    if (d <= step) {
      c.x = tx; c.y = ty; c.path.shift();
      if (!c.path.length) { c.path = null; return true; }
    } else { c.x += (dx / d) * step; c.y += (dy / d) * step; }
    return false;
  }

  let marker = null;
  function walkTo(gx, gy, target) {
    if (!inb(gx, gy) || solid[gy][gx] || !reach[gy][gx]) {
      const n = nearestReachable(gx, gy);
      if (!n) return;
      gx = n.x; gy = n.y;
    }
    const s = tileOf(player);
    const p = findPath(s.x, s.y, gx, gy);
    if (!p) { Sound.nope(); return; }
    if (!p.length) { player.path = null; player.target = target; arrive(); return; }
    player.path = p; player.target = target;
    marker = { x: gx * TILE + 16, y: gy * TILE + 22, t: 0 };
  }
  function goToBuilding(b) {
    if (Math.hypot(player.x - b.doorX, player.y - b.doorY) < 30) return openSection(b);
    walkTo(b.ex, b.ey, { type: 'building', b });
  }
  function goToNpc(n) {
    if (Math.hypot(player.x - n.x, player.y - n.y) < 44) return startDialog(n);
    const t = tileOf(n);
    walkTo(t.x, t.y + 1, { type: 'npc', n, tries: 3 });
  }
  function goToCat() {
    if (Math.hypot(player.x - cat.x, player.y - cat.y) < 40) return interactCat();
    const ct = tileOf(cat);
    walkTo(ct.x, ct.y, { type: 'cat', tries: 3 });
  }
  function goToBoard() {
    if (Math.hypot(player.x - BOARD.x, player.y - BOARD.y) < 44) return openGuestbook();
    walkTo(BOARD.tx, BOARD.ty + 1, { type: 'board' });
  }
  function goToFountain() {
    if (Math.hypot(player.x - FOUNTAIN.x, player.y - FOUNTAIN.y) < 78) return makeWish();
    walkTo(22, 17, { type: 'fountain' });
  }
  function arrive() {
    const t = player.target;
    player.target = null; marker = null;
    if (!t) return;
    if (t.type === 'building') openSection(t.b);
    else if (t.type === 'fountain') { player.dir = 'up'; makeWish(); }
    else if (t.type === 'board') { player.dir = 'up'; openGuestbook(); }
    else if (t.type === 'cat') {
      if (Math.hypot(player.x - cat.x, player.y - cat.y) < 52) interactCat();
      else if (t.tries > 0) { const ct = tileOf(cat); walkTo(ct.x, ct.y, { ...t, tries: t.tries - 1 }); }
    }
    else if (t.type === 'npc') {
      if (Math.hypot(player.x - t.n.x, player.y - t.n.y) < 56) startDialog(t.n);
      else if (t.tries > 0) { const nt = tileOf(t.n); walkTo(nt.x, nt.y + 1, { ...t, tries: t.tries - 1 }); }
    }
  }

  // objek yang bisa diajak berinteraksi saat ini
  let current = null;
  function findInteractable() {
    let best = null, bd = Infinity;
    for (const b of SECTIONS) {
      const d = Math.hypot(player.x - b.doorX, player.y - b.doorY);
      if (d < 30 && d < bd) { bd = d; best = { type: 'building', b }; }
    }
    for (const n of npcs) {
      const d = Math.hypot(player.x - n.x, player.y - n.y);
      if (d < 44 && d < bd) { bd = d; best = { type: 'npc', n }; }
    }
    const cd = Math.hypot(player.x - cat.x, player.y - cat.y);
    if (cd < 36 && cd < bd) { bd = cd; best = { type: 'cat' }; }
    const gd = Math.hypot(player.x - BOARD.x, player.y - BOARD.y);
    if (gd < 44 && gd < bd) { bd = gd; best = { type: 'board' }; }
    const fd = Math.hypot(player.x - FOUNTAIN.x, player.y - FOUNTAIN.y);
    if (fd < 78 && fd < bd) best = { type: 'fountain' };
    return best;
  }
  function interact(it) {
    Sound.init();
    if (it.type === 'building') openSection(it.b);
    else if (it.type === 'npc') startDialog(it.n);
    else if (it.type === 'fountain') makeWish();
    else if (it.type === 'cat') interactCat();
    else if (it.type === 'board') openGuestbook();
  }
  let lastPromptKey = '';
  function updatePrompt() {
    current = dlg.active ? null : findInteractable();
    let text = '', key = '';
    if (current) {
      const v = isTouch ? t('verbTouch') : t('verbKey');
      if (current.type === 'building') { key = 'b' + current.b.id; text = t('pEnter', { v, place: `${current.b.icon} ${current.b.name}` }); }
      else if (current.type === 'npc') { key = 'n' + current.n.i; text = t('pTalk', { v, name: current.n.name }); }
      else if (current.type === 'cat') { key = 'c' + state.catFed; text = t(state.catFed ? 'pPet' : 'pFeed', { v, name: t('catName') }); }
      else if (current.type === 'board') { key = 'g'; text = t('pGuest', { v }); }
      else { key = 'f'; text = t('pWish', { v }); }
      key += state.lang;
    }
    if (key !== lastPromptKey) {
      lastPromptKey = key;
      ui.prompt.textContent = text;
      ui.prompt.classList.toggle('hidden', !text);
      ui.action.classList.toggle('hidden', !text || !isTouch);
    }
  }

  // ---------------------------------------------------------------- camera / resize
  let vw = 0, vh = 0, dpr = 1, zoom = 2;
  const cam = { x: 0, y: 0 };
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth; vh = window.innerHeight;
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
    lightCv.width = canvas.width; lightCv.height = canvas.height;
    const across = vw >= 900 ? 22 : vw >= 600 ? 16 : 10.5;
    zoom = clamp(Math.min(vw / (across * TILE), vh / (9 * TILE)), 0.6, 3);
    snapCamera();
  }
  function camTarget() {
    const viewW = vw / zoom, viewH = vh / zoom, mapW = MW * TILE, mapH = MH * TILE;
    return {
      x: viewW >= mapW ? (mapW - viewW) / 2 : clamp(player.x - viewW / 2, 0, mapW - viewW),
      y: viewH >= mapH ? (mapH - viewH) / 2 : clamp(player.y - 16 - viewH / 2, 0, mapH - viewH),
    };
  }
  function snapCamera() { const t = camTarget(); cam.x = t.x; cam.y = t.y; }
  window.addEventListener('resize', resize);

  // ---------------------------------------------------------------- siang & malam
  const DAY_LEN = 300; // detik untuk satu hari penuh di desa
  const NIGHT_MAX = 0.72; // kegelapan maksimum
  let clock = 0.3; // 0 = tengah malam, 0.25 = jam 6 pagi, 0.5 = tengah hari
  let dark = state.timeMode === 'night' ? NIGHT_MAX : 0;
  let lastClock = '', isNight = dark > NIGHT_MAX * 0.5;
  function targetDark() {
    if (state.timeMode === 'day') return 0;
    if (state.timeMode === 'night') return NIGHT_MAX;
    const c = Math.cos(clock * Math.PI * 2); // 1 = tengah malam, -1 = tengah hari
    return clamp((c - 0.25) / 0.6, 0, 1) * NIGHT_MAX;
  }
  function updateDayNight(dt) {
    if (state.timeMode === 'auto') clock = (clock + dt / DAY_LEN) % 1;
    else clock = state.timeMode === 'day' ? 0.5 : 0;
    dark += (targetDark() - dark) * Math.min(1, dt * 1.5);
    const nightNow = dark > NIGHT_MAX * 0.5;
    if (nightNow !== isNight) {
      isNight = nightNow;
      updateDayNightButton();
      if (state.timeMode === 'auto' && ui.title.classList.contains('hidden') && !anyOverlay()) toast(t(nightNow ? 'nightFalls' : 'dayBreaks'), 2600);
    }
    const mins = Math.floor((clock * 24 * 60) / 10) * 10;
    const label = `${dark > NIGHT_MAX * 0.4 ? '🌙' : '☀️'} ${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    if (label !== lastClock) {
      lastClock = label;
      const el = document.getElementById('hudClock');
      if (el) el.textContent = label;
    }
  }

  // lampu jalan di sudut alun-alun dan sepanjang jalan setapak
  const LAMPS = [[17, 11], [27, 11], [17, 19], [27, 19], [13, 23], [29, 23], [9, 9], [34, 9]]
    .map(([x, y]) => ({ x: x * TILE + 26, y: y * TILE + 26 }));
  function updateDayNightButton() {
    const btn = document.getElementById('btnDayNight');
    if (btn) btn.textContent = isNight ? '☀️' : '🌙';
  }
  const lampLit = () => clamp(dark / (NIGHT_MAX * 0.45), 0, 1);

  // kunang-kunang di sekitar pepohonan (hanya terlihat saat malam)
  const flies = Array.from({ length: Math.min(36, trees.length) }, (_, k) => {
    const tr = trees[Math.floor(rng() * trees.length)];
    return { x: tr.x * TILE + 16 + (rng() - 0.5) * 40, y: tr.y * TILE + (rng() - 0.5) * 40, a: rng() * 6, s: 0.6 + rng() * 0.8, k };
  });
  function updateFlies(dt) {
    if (dark < 0.1) return;
    for (const f of flies) {
      f.a += dt * f.s;
      f.x += Math.cos(f.a * 0.9 + f.k) * 14 * dt;
      f.y += Math.sin(f.a * 1.3) * 10 * dt;
    }
  }

  // ---------------------------------------------------------------- update
  let time = 0;
  function update(dt) {
    time += dt;
    updateDayNight(dt);
    updateWeather(dt);
    updateFlies(dt);
    updateEtl(dt);
    updateCat(dt);
    if (lights.flash) { lights.flash.t -= dt; if (lights.flash.t <= 0) lights.flash = null; }
    updateParticles(dt);
    updateDialog(dt);
    doorCooldown = Math.max(0, doorCooldown - dt);
    if (marker) marker.t += dt;

    const paused = anyOverlay() || dlg.active;
    // NPC tetap bergerak kecuali sedang ngobrol
    for (const n of npcs) {
      if (n.talking) { n.moving = false; setDir(n, player.x - n.x, player.y - n.y); continue; }
      if (n.path) { if (followPath(n, 45, dt)) n.moving = false; }
      else {
        n.moving = false;
        n.wait -= dt;
        if (n.wait <= 0) {
          n.wait = 1.5 + Math.random() * 3;
          const tx = n.home.x + Math.round((Math.random() - 0.5) * 8), ty = n.home.y + Math.round((Math.random() - 0.5) * 6);
          if (inb(tx, ty) && reach[ty][tx]) { const s = tileOf(n); n.path = findPath(s.x, s.y, tx, ty); if (n.path && !n.path.length) n.path = null; }
        }
      }
      if (n.moving) n.phase += dt * 9;
    }

    if (!paused) {
      let ix = 0, iy = 0;
      if (keys.left) ix--; if (keys.right) ix++; if (keys.up) iy--; if (keys.down) iy++;
      if (ix || iy) {
        player.path = null; player.target = null; marker = null;
        const len = Math.hypot(ix, iy);
        const dx = (ix / len) * SPEED * dt, dy = (iy / len) * SPEED * dt;
        let blockedY = false;
        if (dx && !blockedAt(player.x + dx, player.y)) player.x += dx;
        if (dy) { if (!blockedAt(player.x, player.y + dy)) player.y += dy; else blockedY = true; }
        setDir(player, ix, iy);
        player.moving = true;
        // menabrak pintu dari depan = masuk
        if (blockedY && iy < 0 && !doorCooldown) {
          const b = SECTIONS.find((s) => Math.abs(player.x - s.doorX) < 14 && Math.abs(player.y - s.doorY) < 16);
          if (b) { for (const k in keys) keys[k] = false; openSection(b); }
        }
      } else if (player.path) {
        if (followPath(player, SPEED, dt)) { player.moving = false; arrive(); }
      } else player.moving = false;
      if (player.moving) player.phase += dt * 12;

      // ambil permata
      for (const g of gems) {
        if (gemCollected(g.i)) continue;
        if (Math.hypot(player.x - g.x, player.y - 4 - g.y) < 20) collectGem(g);
      }
      updatePrompt();
    } else if (!ui.prompt.classList.contains('hidden') || !ui.action.classList.contains('hidden')) {
      lastPromptKey = '';
      ui.prompt.classList.add('hidden');
      ui.action.classList.add('hidden');
    }

    const ct = camTarget(), k = Math.min(1, dt * 7);
    cam.x += (ct.x - cam.x) * k; cam.y += (ct.y - cam.y) * k;
  }

  function collectGem(g) {
    state.gems.push(g.i); persist();
    const s = CV.skills[g.i];
    Sound.gem();
    if (dark > 0.05) lights.flash = { x: g.x, y: g.y, t: 0.6 };
    burst(g.x, g.y - 10, catColor(s.category), 22);
    toast(`${t('gemFound', { name: esc(s.name), stars: '★'.repeat(clamp(s.level || 0, 0, 5)) })}<small>${esc(s.category || '')} · ${state.gems.length}/${gems.length}</small>`);
    if (state.gems.length === 1) unlock('first_gem');
    if (allGemsDone()) unlock('all_gems');
    updateProgress();
    checkFinale();
  }

  // ---------------------------------------------------------------- pre-render tanah
  const GS = 2; // resolusi pre-render
  const ground = document.createElement('canvas');
  ground.width = MW * TILE * GS; ground.height = MH * TILE * GS;
  function drawGround() {
    const g = ground.getContext('2d');
    g.setTransform(GS, 0, 0, GS, 0, 0);
    g.clearRect(0, 0, MW * TILE, MH * TILE);
    const r = mulberry32(77);
    // pola tile 64px (pre-render 2x) -> 32 satuan dunia
    const pat = {};
    for (const [t, n] of [[GRASS, 'grass'], [PATH, 'path'], [SAND, 'sand'], [WATER, 'water'], [PLAZA, 'plaza']]) {
      const im = sprite('tile-' + n);
      if (!im) continue;
      pat[t] = g.createPattern(im, 'repeat');
      pat[t].setTransform(new DOMMatrix().scale(TILE / im.naturalWidth));
    }
    const flowers = sprite('flowers');
    const is = (x, y, t) => inb(x, y) && tiles[y][x] === t;
    const land = (x, y) => inb(x, y) && tiles[y][x] !== WATER;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const px = x * TILE, py = y * TILE, t = tiles[y][x];
      if ((t === GRASS || t === PATH || t === PLAZA) && pat[GRASS]) {
        g.fillStyle = pat[GRASS]; g.fillRect(px, py, TILE, TILE);
      } else if (t === GRASS || t === PATH || t === PLAZA) {
        g.fillStyle = (x * 7 + y * 13) % 5 === 0 ? '#66ad47' : '#6cb34d';
        g.fillRect(px, py, TILE, TILE);
        g.strokeStyle = '#5a9a3d'; g.lineWidth = 1;
        for (let k = 0; k < 3; k++) {
          const bx = px + r() * 28 + 2, by = py + r() * 26 + 4;
          g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 1, by - 3); g.stroke();
        }
      }
      if (t === SAND && pat[SAND]) {
        g.fillStyle = pat[SAND]; g.fillRect(px, py, TILE, TILE);
      } else if (t === SAND) {
        g.fillStyle = '#ecd9a0'; g.fillRect(px, py, TILE, TILE);
        g.fillStyle = '#d8c184';
        for (let k = 0; k < 5; k++) g.fillRect(px + r() * 30, py + r() * 30, 2, 2);
      }
      if (t === WATER) {
        g.fillStyle = pat[WATER] || '#3b8fd1'; g.fillRect(px, py, TILE, TILE);
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(px + r() * 20, py + r() * 28, 8, 2);
        g.fillStyle = '#9bd3f2';
        if (land(x, y - 1)) g.fillRect(px, py, TILE, 4);
        if (land(x, y + 1)) g.fillRect(px, py + TILE - 3, TILE, 3);
        if (land(x - 1, y)) g.fillRect(px, py, 3, TILE);
        if (land(x + 1, y)) g.fillRect(px + TILE - 3, py, 3, TILE);
      }
      if (t === PATH) {
        g.fillStyle = pat[PATH] || '#d9b884';
        const m = 3;
        const l = is(x - 1, y, PATH) || is(x - 1, y, PLAZA) ? 0 : m;
        const rr = is(x + 1, y, PATH) || is(x + 1, y, PLAZA) ? 0 : m;
        const u = is(x, y - 1, PATH) || is(x, y - 1, PLAZA) || bld[y - 1]?.[x] ? 0 : m;
        const d = is(x, y + 1, PATH) || is(x, y + 1, PLAZA) ? 0 : m;
        g.fillRect(px + l, py + u, TILE - l - rr, TILE - u - d);
        g.fillStyle = '#c49f68';
        if (!pat[PATH]) for (let k = 0; k < 3; k++) g.fillRect(px + 6 + r() * 20, py + 6 + r() * 20, 3, 2);
      }
      if (t === PLAZA && pat[PLAZA]) {
        g.fillStyle = pat[PLAZA]; g.fillRect(px, py, TILE, TILE);
      } else if (t === PLAZA) {
        g.fillStyle = '#d3cbbf'; g.fillRect(px, py, TILE, TILE);
        g.strokeStyle = '#bdb3a4'; g.lineWidth = 1;
        const off = y % 2 ? 8 : 0;
        g.strokeRect(px + 0.5, py + 0.5, TILE, 16);
        g.strokeRect(px + 0.5, py + 16.5, TILE, 16);
        g.beginPath();
        g.moveTo(px + 16 + off - (off ? 16 : 0), py); g.lineTo(px + 16 + off - (off ? 16 : 0), py + 16);
        g.moveTo(px + 24 - off, py + 16); g.lineTo(px + 24 - off, py + 32);
        g.stroke();
      }
      const dc = deco[y][x];
      if (dc && dc < 9 && flowers) {
        const fs = 16 + dc * 2;
        g.drawImage(flowers, px + 2 + r() * (TILE - fs - 4), py + 2 + r() * (TILE - fs - 4), fs, fs);
      } else if (dc && dc < 9) {
        const cols = ['#ff6b9a', '#ffd166', '#ffffff'];
        for (let k = 0; k < 3; k++) {
          const fx = px + 6 + r() * 20, fy = py + 6 + r() * 20;
          g.fillStyle = '#3f7d2c'; g.fillRect(fx, fy, 1, 4);
          g.fillStyle = cols[dc - 1]; g.beginPath(); g.arc(fx + 0.5, fy, 2.2, 0, Math.PI * 2); g.fill();
          g.fillStyle = '#ffde59'; g.fillRect(fx, fy - 0.5, 1, 1);
        }
      } else if (dc === 9 && !pat[GRASS]) {
        g.strokeStyle = '#4f8f36'; g.lineWidth = 1.5;
        const fx = px + 10 + r() * 12, fy = py + 20 + r() * 6;
        g.beginPath(); g.moveTo(fx - 4, fy - 6); g.lineTo(fx, fy); g.lineTo(fx + 4, fy - 6); g.moveTo(fx, fy); g.lineTo(fx, fy - 8); g.stroke();
      }
    }
  }
  drawGround();
  onAssetsReady.push(drawGround);

  // minimap dasar
  const mmBase = document.createElement('canvas');
  mmBase.width = MW * 4; mmBase.height = MH * 4;
  (function drawMiniBase() {
    const g = mmBase.getContext('2d');
    const col = { [GRASS]: '#6cb34d', [PATH]: '#d9b884', [WATER]: '#3b8fd1', [SAND]: '#ecd9a0', [PLAZA]: '#d3cbbf' };
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      g.fillStyle = col[tiles[y][x]]; g.fillRect(x * 4, y * 4, 4, 4);
    }
    g.fillStyle = '#2f6b25';
    trees.forEach((t) => g.fillRect(t.x * 4 + 1, t.y * 4 + 1, 2, 2));
    g.fillStyle = '#9ad8ff'; g.fillRect(21 * 4, 14 * 4, 12, 12);
  })();
  mm.width = MW * 4; mm.height = MH * 4;

  // ---------------------------------------------------------------- drawing helpers
  function rrect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => clamp(Math.round(v + amt), 0, 255);
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  const CHAR_H = 44; // tinggi sprite karakter (satuan dunia)
  const DIRS = ['down', 'left', 'right', 'up'];
  function drawCharacterSprite(c, im) {
    const fw = im.naturalWidth / 4, fh = im.naturalHeight;
    const h = CHAR_H, w = (fw / fh) * h;
    const f = Math.max(0, DIRS.indexOf(c.dir));
    const step = c.moving ? Math.sin(c.phase) : 0;
    const bob = c.moving ? Math.abs(step) * 2.2 : 0;
    const breathe = c.moving ? 1 : 1 + Math.sin(time * 2.2 + (c.i || 0)) * 0.012;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(c.x, c.y, 10 - bob, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(c.x, c.y + 1 - bob);
    ctx.rotate(step * 0.07);
    ctx.scale(1, breathe);
    ctx.drawImage(im, f * fw, 0, fw, fh, -w / 2, -h, w, h);
    ctx.restore();
  }

  function drawCharacter(c) {
    const im = sprite(c.sprite);
    if (im) return drawCharacterSprite(c, im);
    const x = c.x, y = c.y;
    const sw = c.moving ? Math.sin(c.phase) : 0;
    const bob = c.moving ? Math.abs(Math.sin(c.phase)) * 1.5 : Math.sin(time * 2 + (c.i || 0)) * 0.4;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(x, y, 9, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    // kaki
    ctx.fillStyle = c.pants;
    ctx.fillRect(x - 5, y - 8 - (sw > 0 ? sw * 2 : 0), 4, 8);
    ctx.fillRect(x + 1, y - 8 - (sw < 0 ? -sw * 2 : 0), 4, 8);
    // tangan
    ctx.fillStyle = c.skin;
    const side = c.dir === 'left' || c.dir === 'right';
    if (!side) {
      ctx.fillRect(x - 9, y - 18 - bob + sw * 1.5, 3, 8);
      ctx.fillRect(x + 6, y - 18 - bob - sw * 1.5, 3, 8);
    }
    // badan
    ctx.fillStyle = c.shirt;
    rrect(ctx, x - 7, y - 20 - bob, 14, 13, 4); ctx.fill();
    if (side) { ctx.fillStyle = c.skin; ctx.fillRect(x - 1.5 + sw * 3, y - 17 - bob, 3, 8); }
    // kepala
    const hy = y - 26 - bob;
    ctx.fillStyle = c.skin;
    ctx.beginPath(); ctx.arc(x, hy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    if (c.dir === 'up') ctx.arc(x, hy, 7.5, 0, Math.PI * 2);
    else if (c.dir === 'left') { ctx.arc(x + 1, hy - 1, 7.5, Math.PI * 0.85, Math.PI * 2.35); }
    else if (c.dir === 'right') { ctx.arc(x - 1, hy - 1, 7.5, Math.PI * 0.65, Math.PI * 2.15); }
    else ctx.arc(x, hy - 1, 7.5, Math.PI, Math.PI * 2);
    ctx.fill();
    // mata
    if (c.dir !== 'up') {
      ctx.fillStyle = '#1c1c28';
      const blink = Math.sin(time * 1.3 + (c.i || 0) * 2) > 0.985;
      const eh = blink ? 0.6 : 2.4;
      if (c.dir === 'down') { ctx.fillRect(x - 3.5, hy, 1.8, eh); ctx.fillRect(x + 1.7, hy, 1.8, eh); }
      else if (c.dir === 'left') ctx.fillRect(x - 4.5, hy, 1.8, eh);
      else ctx.fillRect(x + 2.7, hy, 1.8, eh);
    }
  }

  function drawTree(t) {
    const x = t.x * TILE + 16, y = t.y * TILE + 28, s = t.s;
    const sway = Math.sin(time * 1.2 + t.x * 0.7 + t.y) * 1.2;
    const im = sprite(t.kind === 'pine' ? 'tree-pine' : 'tree-oak');
    if (im) {
      const w = (t.kind === 'pine' ? 50 : 64) * s, h = (w * im.naturalHeight) / im.naturalWidth;
      ctx.save();
      ctx.translate(x, y + h * 0.06);
      ctx.transform(1, 0, sway * -0.012, 1, 0, 0); // daun bergoyang, pangkal tetap
      ctx.drawImage(im, -w / 2, -h, w, h);
      ctx.restore();
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x, y, 13 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a4f2a';
    ctx.fillRect(x - 3, y - 12 * s, 6, 12 * s);
    if (t.kind === 'pine') {
      for (let k = 0; k < 3; k++) {
        const w = (16 - k * 4) * s, top = y - (22 + k * 10) * s;
        ctx.fillStyle = k % 2 ? '#2f7a43' : '#2a6e3c';
        ctx.beginPath(); ctx.moveTo(x - w + sway * k * 0.3, top + 14 * s); ctx.lineTo(x + w + sway * k * 0.3, top + 14 * s); ctx.lineTo(x + sway * (k + 1) * 0.4, top - 6 * s); ctx.closePath(); ctx.fill();
      }
    } else {
      const cx = x + sway, cy = y - 26 * s;
      ctx.fillStyle = '#2f7d32';
      ctx.beginPath(); ctx.arc(cx - 7 * s, cy + 3 * s, 10 * s, 0, Math.PI * 2); ctx.arc(cx + 7 * s, cy + 3 * s, 10 * s, 0, Math.PI * 2); ctx.arc(cx, cy - 5 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#43a047';
      ctx.beginPath(); ctx.arc(cx - 3 * s, cy - 7 * s, 6 * s, 0, Math.PI * 2); ctx.fill();
    }
  }

  const BLD_SCALE = 0.84; // piksel sprite -> satuan dunia
  const buildingSprite = (b) => sprite('building-' + b.id);
  function buildingTop(b) {
    const im = buildingSprite(b);
    return im ? (b.ty + BH) * TILE + 6 - im.naturalHeight * BLD_SCALE : b.ty * TILE - 18;
  }

  function drawBuilding(b) {
    const x0 = b.tx * TILE, y0 = b.ty * TILE, w = BW * TILE, h = BH * TILE;
    const hl = hover === b || (current && current.type === 'building' && current.b === b);
    const im = buildingSprite(b);
    if (im) {
      const sw = im.naturalWidth * BLD_SCALE, sh = im.naturalHeight * BLD_SCALE;
      const sx = x0 + w / 2 - sw / 2, sy = y0 + h + 6 - sh;
      ctx.drawImage(im, sx, sy, sw, sh);
      if (hl) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.12 + Math.sin(time * 6) * 0.06;
        ctx.drawImage(im, sx, sy, sw, sh);
        ctx.restore();
      }
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x0 + 8, y0 + h - 6, w - 4, 10);
    // dinding
    ctx.fillStyle = '#f4ead5';
    ctx.fillRect(x0 + 6, y0 + 40, w - 12, h - 40);
    ctx.fillStyle = '#e2d4b6';
    ctx.fillRect(x0 + 6, y0 + h - 10, w - 12, 10);
    ctx.fillStyle = b.color;
    ctx.fillRect(x0 + 6, y0 + 40, w - 12, 6);
    // atap
    ctx.fillStyle = b.roof;
    ctx.beginPath();
    ctx.moveTo(x0 - 2, y0 + 46); ctx.lineTo(x0 + w + 2, y0 + 46);
    ctx.lineTo(x0 + w - 20, y0 - 10); ctx.lineTo(x0 + 20, y0 - 10); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = shade(b.roof, 25); ctx.lineWidth = 2;
    for (let k = 1; k < 4; k++) {
      const yy = y0 - 10 + k * 14, inset = 20 - (k * 14 * 22) / 56;
      ctx.beginPath(); ctx.moveTo(x0 + inset, yy); ctx.lineTo(x0 + w - inset, yy); ctx.stroke();
    }
    ctx.fillStyle = shade(b.roof, -25);
    ctx.fillRect(x0 - 2, y0 + 44, w + 4, 4);
    // cerobong
    ctx.fillStyle = '#8d6e63'; ctx.fillRect(x0 + w - 44, y0 - 18, 12, 20);
    // jendela
    const lit = Math.min(1, 0.75 + Math.sin(time * 2 + b.tx) * 0.1 + dark * 0.4);
    for (const wx of [x0 + 18, x0 + w - 46]) {
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(wx - 2, y0 + 58, 32, 28);
      ctx.fillStyle = `rgba(255,226,140,${lit})`; ctx.fillRect(wx, y0 + 60, 28, 24);
      ctx.fillStyle = '#6d4c41'; ctx.fillRect(wx + 13, y0 + 60, 2, 24); ctx.fillRect(wx, y0 + 71, 28, 2);
      ctx.fillStyle = b.color; ctx.fillRect(wx - 3, y0 + 86, 34, 4);
    }
    // pintu
    const dx = x0 + w / 2 - 14, dy = y0 + h - 40;
    ctx.fillStyle = '#5a3b24'; rrect(ctx, dx - 2, dy - 2, 32, 42, 6); ctx.fill();
    ctx.fillStyle = shade(b.color, -40); rrect(ctx, dx, dy, 28, 40, 5); ctx.fill();
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(dx + 21, dy + 22, 2, 0, Math.PI * 2); ctx.fill();
    if (hl) {
      ctx.strokeStyle = `rgba(255,255,255,${0.6 + Math.sin(time * 6) * 0.3})`; ctx.lineWidth = 3;
      rrect(ctx, dx - 4, dy - 4, 36, 46, 8); ctx.stroke();
    }
  }

  // Ikon & teks diukur terpisah: lebar emoji (mis. 🛠️ ✉️) sering diukur lebih kecil
  // daripada saat digambar di Windows/Android, jadi ikon diberi slot tetap.
  const SIGN_FONT = '800 11px Nunito, system-ui, sans-serif';
  const EMOJI_FONT = '12px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", system-ui, sans-serif';
  function drawSign(b) {
    const x = (b.tx + BW / 2) * TILE, y = Math.min(b.ty * TILE - 30, buildingTop(b) - 4) + Math.sin(time * 2 + b.tx) * 2;
    const visited = state.visited.includes(b.id);
    const label = `${b.name}${visited ? ' ✓' : ''}`;
    ctx.font = EMOJI_FONT;
    const iconW = Math.max(16, ctx.measureText(b.icon).width + 2);
    ctx.font = SIGN_FONT;
    const textW = ctx.measureText(label).width;
    const pad = 9, gap = 5, tw = pad * 2 + iconW + gap + textW, left = x - tw / 2;
    ctx.fillStyle = visited ? 'rgba(20,60,30,0.85)' : 'rgba(17,21,36,0.85)';
    rrect(ctx, left, y - 10, tw, 20, 8); ctx.fill();
    ctx.strokeStyle = visited ? '#80ed99' : b.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = EMOJI_FONT;
    ctx.fillStyle = '#fff';
    ctx.fillText(b.icon, left + pad + iconW / 2, y + 1);
    ctx.textAlign = 'left';
    ctx.font = SIGN_FONT;
    ctx.fillText(label, left + pad + iconW + gap, y + 1);
    ctx.textAlign = 'center';
    if (!visited) {
      ctx.fillStyle = '#f2c14e';
      ctx.font = '900 14px Nunito, system-ui, sans-serif';
      ctx.fillText('!', left + tw + 6, y - 8 + Math.sin(time * 5) * 2);
    }
  }

  function drawFountain() {
    const { x, y } = FOUNTAIN;
    const im = sprite('fountain');
    if (im) {
      const w = 128, h = (w * im.naturalHeight) / im.naturalWidth, top = y + 46 - h;
      ctx.drawImage(im, x - w / 2, top, w, h);
      // tetesan air dari pancuran
      ctx.fillStyle = 'rgba(220,245,255,0.85)';
      for (let k = 0; k < 12; k++) {
        const p = (time * 0.8 + k / 12) % 1, a = (k / 12) * Math.PI * 2;
        const px = x + Math.cos(a) * p * 22, py = top + 10 - Math.sin(p * Math.PI) * 10 + p * 34;
        ctx.beginPath(); ctx.arc(px, py, 1.3, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(x, y + 8, 46, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9e9e9e';
    ctx.beginPath(); ctx.ellipse(x, y + 4, 44, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bdbdbd';
    ctx.beginPath(); ctx.ellipse(x, y, 44, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4aa3df';
    ctx.beginPath(); ctx.ellipse(x, y, 36, 23, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.5;
    for (let k = 0; k < 3; k++) {
      const r = Math.max(0.1, (time * 14 + k * 12) % 36);
      ctx.globalAlpha = 1 - r / 36;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.64, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#a7a7a7'; ctx.fillRect(x - 5, y - 26, 10, 26);
    ctx.fillStyle = '#c4c4c4'; ctx.beginPath(); ctx.ellipse(x, y - 26, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
    // semburan air
    ctx.fillStyle = 'rgba(190,230,255,0.9)';
    for (let k = 0; k < 14; k++) {
      const p = (time * 0.9 + k / 14) % 1, a = (k / 14) * Math.PI * 2;
      const px = x + Math.cos(a) * p * 26, py = y - 30 - Math.sin(p * Math.PI) * 18 + p * 24;
      ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawGem(g) {
    const s = CV.skills[g.i], c = catColor(s.category);
    const bob = Math.sin(time * 3 + g.phase) * 3;
    const x = g.x, y = g.y - 12 + bob;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(g.x, g.y + 2, 6 - bob * 0.3, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    const glow = ctx.createRadialGradient(x, y, 0, x, y, 18);
    glow.addColorStop(0, c + 'aa'); glow.addColorStop(1, c + '00');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
    const im = sprite('gem-' + CAT_GEMS[s.category]);
    if (im) {
      const w = 24, h = (w * im.naturalHeight) / im.naturalWidth;
      ctx.drawImage(im, x - w / 2, y - h / 2, w, h);
      return;
    }
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 7, y - 2); ctx.lineTo(x, y + 9); ctx.lineTo(x - 7, y - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x + 7, y - 2); ctx.lineTo(x, y - 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    if (Math.sin(time * 4 + g.phase * 3) > 0.9) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x + 4, y - 8, 1.5, 5); ctx.fillRect(x + 2.25, y - 6.25, 5, 1.5);
    }
  }

  function drawNpcBubble(n) {
    const near = Math.hypot(player.x - n.x, player.y - n.y) < 90 || hover === n;
    const fresh = !state.talked.includes(n.i);
    const y = n.y - (sprite(n.sprite) ? CHAR_H + 12 : 44) + Math.sin(time * 4 + n.i) * 2;
    if (fresh && !n.talking) {
      ctx.fillStyle = '#fff'; rrect(ctx, n.x - 8, y - 10, 16, 16, 5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(n.x - 3, y + 6); ctx.lineTo(n.x, y + 10); ctx.lineTo(n.x + 3, y + 6); ctx.fill();
      ctx.fillStyle = '#e8577e'; ctx.font = '900 12px Nunito, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', n.x, y - 1);
    }
    if (near) {
      ctx.font = '800 10px Nunito, system-ui, sans-serif';
      const tw = ctx.measureText(n.name).width + 10;
      const ty = fresh && !n.talking ? y - 22 : y - 4;
      ctx.fillStyle = 'rgba(17,21,36,0.8)'; rrect(ctx, n.x - tw / 2, ty - 7, tw, 14, 6); ctx.fill();
      ctx.fillStyle = '#f2c14e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.name, n.x, ty);
    }
  }

  // ---------------------------------------------------------------- lampu & cahaya malam
  const LAMP_H = 56; // tinggi sprite lampu jalan (satuan dunia)
  function drawLamp(L) {
    const { x, y } = L, lit = lampLit();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(x, y, 6, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    const on = sprite('lamp'), off = sprite('lamp-off');
    if (on || off) {
      // lampu mati di bawah, lampu menyala di atasnya dengan transparansi sesuai gelapnya hari
      const draw = (im, a) => {
        const h = LAMP_H, w = (im.naturalWidth / im.naturalHeight) * h;
        ctx.globalAlpha = a; ctx.drawImage(im, x - w / 2, y - h + 1, w, h); ctx.globalAlpha = 1;
      };
      if (off) draw(off, 1);
      if (on && (lit > 0 || !off)) draw(on, off ? lit : 1);
      return;
    }
    ctx.fillStyle = '#3b3f4f';
    ctx.fillRect(x - 4, y - 4, 8, 4);
    ctx.fillRect(x - 1.5, y - 36, 3, 33);
    ctx.fillStyle = '#2b2e3a';
    rrect(ctx, x - 6, y - 47, 12, 12, 3); ctx.fill();
    ctx.fillStyle = `rgb(${Math.round(150 + 105 * lit)},${Math.round(160 + 60 * lit)},${Math.round(150 - 40 * lit)})`;
    ctx.fillRect(x - 4, y - 45, 8, 8);
    ctx.fillStyle = '#2b2e3a';
    ctx.beginPath(); ctx.moveTo(x - 8, y - 47); ctx.lineTo(x + 8, y - 47); ctx.lineTo(x, y - 53); ctx.closePath(); ctx.fill();
  }

  // Lapisan gelap digambar di kanvas terpisah, lalu "dilubangi" di sekitar sumber cahaya.
  const lightCv = document.createElement('canvas'), lctx = lightCv.getContext('2d');
  const lights = { flash: null };
  const WARM = '255,196,120', COOL = '130,215,255';
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };

  function collectLights(visible) {
    const L = [];
    const lit = lampLit();
    for (const p of LAMPS) if (visible(p.x / TILE, p.y / TILE, 4)) L.push({ x: p.x, y: p.y - 41, r: 110 * (0.5 + 0.5 * lit), a: lit, c: WARM, g: 0.45 });
    for (const b of SECTIONS) {
      if (!visible(b.tx + 2, b.ty + 2, 6)) continue;
      const im = buildingSprite(b);
      const bottom = (b.ty + BH) * TILE + 6;
      const sw = im ? im.naturalWidth * BLD_SCALE : BW * TILE, sh = im ? im.naturalHeight * BLD_SCALE : BH * TILE + 10;
      const left = (b.tx + BW / 2) * TILE - sw / 2;
      const wy = bottom - sh * (im ? 0.3 : 0.42);
      L.push({ x: left + sw * 0.25, y: wy, r: 52, a: 0.85, c: WARM, g: 0.35 });
      L.push({ x: left + sw * 0.75, y: wy, r: 52, a: 0.85, c: WARM, g: 0.35 });
      L.push({ x: b.doorX, y: bottom - 24, r: 44, a: 0.7, c: WARM, g: 0.25 });
    }
    L.push({ x: FOUNTAIN.x, y: FOUNTAIN.y, r: 85, a: 0.5, c: COOL, g: 0.22 });
    L.push({ x: player.x, y: player.y - 16, r: 80, a: 0.6, c: WARM, g: 0.12 });
    for (const n of npcs) L.push({ x: n.x, y: n.y - 16, r: 45, a: 0.35 });
    for (const g of gems) {
      if (gemCollected(g.i) || !visible(g.x / TILE, g.y / TILE)) continue;
      L.push({ x: g.x, y: g.y - 12, r: 36, a: 0.8, c: hexRgb(catColor(CV.skills[g.i].category)), g: 0.5 });
    }
    if (lights.flash) L.push({ x: lights.flash.x, y: lights.flash.y - 12, r: 160 * lights.flash.t, a: 1, c: '255,255,220', g: 0.6 * lights.flash.t });
    return L;
  }

  function renderLighting(s, cx, cy, visible) {
    const k = dark / NIGHT_MAX;
    // semburat jingga saat senja & fajar
    const dusk = state.timeMode === 'auto' ? Math.sin(Math.PI * clamp(k, 0, 1)) : 0;
    if (dusk > 0.02) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(255,120,60,${0.13 * dusk})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (dark < 0.01) return;
    const L = collectLights(visible);
    lctx.globalCompositeOperation = 'source-over';
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.clearRect(0, 0, lightCv.width, lightCv.height);
    lctx.fillStyle = `rgba(10,16,50,${dark})`;
    lctx.fillRect(0, 0, lightCv.width, lightCv.height);
    lctx.globalCompositeOperation = 'destination-out';
    lctx.setTransform(s, 0, 0, s, -cx * s, -cy * s);
    for (const l of L) {
      if (l.r < 1) continue;
      const g = lctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, `rgba(0,0,0,${l.a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g; lctx.beginPath(); lctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); lctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lightCv, 0, 0);
    // pendar hangat/dingin di atas kegelapan
    ctx.setTransform(s, 0, 0, s, -cx * s, -cy * s);
    ctx.globalCompositeOperation = 'lighter';
    for (const l of L) {
      if (!l.c || l.r < 1) continue;
      const r = l.r * 0.7;
      const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      g.addColorStop(0, `rgba(${l.c},${l.g * k})`); g.addColorStop(1, `rgba(${l.c},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(l.x, l.y, r, 0, Math.PI * 2); ctx.fill();
    }
    // kunang-kunang
    if (dark > 0.15) {
      for (const f of flies) {
        if (!visible(f.x / TILE, f.y / TILE)) continue;
        const a = (0.5 + 0.5 * Math.sin(time * 3 + f.a * 5)) * k;
        ctx.fillStyle = `rgba(220,255,120,${a})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(220,255,120,${a * 0.25})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------- render
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#3b8fd1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const s = dpr * zoom;
    const cx = Math.round(cam.x * s) / s, cy = Math.round(cam.y * s) / s;
    ctx.setTransform(s, 0, 0, s, -cx * s, -cy * s);
    ctx.imageSmoothingEnabled = true;

    const viewW = vw / zoom, viewH = vh / zoom;
    const sx = clamp(cx, 0, MW * TILE), sy = clamp(cy, 0, MH * TILE);
    const sw = clamp(viewW, 0, MW * TILE - sx), sh = clamp(viewH, 0, MH * TILE - sy);
    if (sw > 0 && sh > 0) ctx.drawImage(ground, sx * GS, sy * GS, sw * GS, sh * GS, sx, sy, sw, sh);

    const tx0 = Math.max(0, Math.floor(cx / TILE) - 1), ty0 = Math.max(0, Math.floor(cy / TILE) - 1);
    const tx1 = Math.min(MW - 1, Math.ceil((cx + viewW) / TILE) + 1), ty1 = Math.min(MH - 1, Math.ceil((cy + viewH) / TILE) + 2);
    const visible = (x, y, m = 2) => x >= tx0 - m && x <= tx1 + m && y >= ty0 - m && y <= ty1 + m;

    // kilau air
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let y = ty0; y <= ty1; y++) for (let x = tx0; x <= tx1; x++) {
      if (tiles[y][x] !== WATER) continue;
      const o = Math.sin(time * 1.5 + x * 1.3 + y * 0.7) * 5;
      const px = x * TILE + 8 + o, py = y * TILE + 12 + ((x * 5 + y * 3) % 12);
      ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 4, py - 3, px + 8, py);
    }
    ctx.stroke();

    // penanda tujuan
    if (marker) {
      const r = 6 + Math.sin(marker.t * 8) * 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(marker.x, marker.y, r + 4, (r + 4) * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    // rute
    if (player.path && player.path.length > 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (const p of player.path) { ctx.beginPath(); ctx.arc(p.x * TILE + 16, p.y * TILE + 22, 2, 0, Math.PI * 2); ctx.fill(); }
    }

    for (const g of gems) if (!gemCollected(g.i) && visible(g.x / TILE, g.y / TILE)) drawGem(g);

    // entitas diurutkan berdasarkan y
    const ents = [];
    for (const t of trees) if (visible(t.x, t.y)) ents.push({ y: t.y * TILE + 28, d: () => drawTree(t) });
    for (const b of SECTIONS) if (visible(b.tx + 2, b.ty + 2, 5)) ents.push({ y: (b.ty + BH) * TILE - 4, d: () => drawBuilding(b) });
    ents.push({ y: FOUNTAIN.y + 30, d: drawFountain });
    for (const L of LAMPS) if (visible(L.x / TILE, L.y / TILE)) ents.push({ y: L.y, d: () => drawLamp(L) });
    ents.push({ y: BOARD.y, d: drawBoard });
    if (visible(cat.x / TILE, cat.y / TILE)) ents.push({ y: cat.y, d: drawCat });
    for (const n of npcs) ents.push({ y: n.y, d: () => drawCharacter(n) });
    ents.push({ y: player.y + 0.1, d: () => drawCharacter(player) });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.d();

    for (const p of parts) {
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      if (p.heart) {
        ctx.font = `${p.size}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('♥', p.x, p.y);
      } else ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    renderLighting(s, cx, cy, visible);
    drawRain();
    ctx.setTransform(s, 0, 0, s, -cx * s, -cy * s);
    for (const b of SECTIONS) if (visible(b.tx + 2, b.ty, 6)) drawSign(b);
    for (const n of npcs) drawNpcBubble(n);

    // confetti (ruang layar)
    if (confs.length) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (const c of confs) {
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.r);
        ctx.fillStyle = c.color; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
        ctx.restore();
      }
    }
  }

  let mmTimer = 0;
  function renderMinimap(dt) {
    mmTimer -= dt;
    if (mmTimer > 0) return;
    mmTimer = 0.1;
    mctx.drawImage(mmBase, 0, 0);
    for (const b of SECTIONS) {
      const v = state.visited.includes(b.id);
      mctx.fillStyle = v ? b.color : shade(b.color, -60);
      mctx.fillRect(b.tx * 4, b.ty * 4, BW * 4, BH * 4);
      if (!v) { mctx.fillStyle = '#fff'; mctx.fillRect(b.tx * 4 + 9, b.ty * 4 + 5, 2, 4); mctx.fillRect(b.tx * 4 + 9, b.ty * 4 + 10, 2, 2); }
    }
    for (const g of gems) if (!gemCollected(g.i)) { mctx.fillStyle = catColor(CV.skills[g.i].category); mctx.fillRect(g.x / 8 - 1.5, g.y / 8 - 2.5, 3, 3); }
    mctx.fillStyle = '#fff';
    for (const n of npcs) mctx.fillRect(n.x / 8 - 1, n.y / 8 - 3, 2, 3);
    mctx.fillStyle = '#a0673c'; mctx.fillRect(BOARD.x / 8 - 2, BOARD.y / 8 - 4, 4, 3);
    mctx.fillStyle = '#f2a65a'; mctx.fillRect(cat.x / 8 - 1, cat.y / 8 - 2, 2, 2);
    if (dark > 0.05) { mctx.fillStyle = `rgba(10,16,50,${dark * 0.6})`; mctx.fillRect(0, 0, mm.width, mm.height); }
    mctx.strokeStyle = 'rgba(255,255,255,0.7)'; mctx.lineWidth = 1;
    mctx.strokeRect(cam.x / 8 + 0.5, cam.y / 8 + 0.5, vw / zoom / 8, vh / zoom / 8);
    if (Math.sin(time * 10) > -0.3) {
      mctx.fillStyle = '#ff3b3b';
      mctx.beginPath(); mctx.arc(player.x / 8, player.y / 8 - 2, 2.5, 0, Math.PI * 2); mctx.fill();
    }
  }

  // ---------------------------------------------------------------- start
  function startGame() {
    Sound.init();
    if (ui.title.classList.contains('hidden')) return;
    ui.title.classList.add('hidden');
    ui.hud.classList.remove('hidden');
    mm.classList.remove('hidden');
    Sound.seq([523, 659, 784, 1047], 0.08, 'triangle', 0.05);
    if (!state.visited.length && !state.gems.length) {
      setTimeout(() => toast(isTouch ? t('hintTouch') : t('hintKey'), 4500), 500);
      setTimeout(() => { const n = npcs[0]; if (n) toast(t('npcWants', { name: esc(n.name) }), 3500); }, 5500);
    } else toast(t('welcomeBack'));
    Music.start();
    track('game_start', { lang: state.lang });
  }

  function initUI() {
    const ini = esc(initials(CV.name));
    $('#hudAvatar').innerHTML = ini; $('#titleAvatar').innerHTML = ini;
    const whenLoaded = (name, f) => (sprite(name) ? f() : IMG[name].addEventListener('load', f));
    whenLoaded('avatar', () => {
      for (const el of [$('#hudAvatar'), $('#titleAvatar')]) { el.textContent = ''; el.classList.add('has-img'); }
    });
    whenLoaded('logo', () => {
      const badge = $('.title-badge');
      if (badge) badge.outerHTML = '<img class="title-logo" src="assets/logo.png" alt="CV Quest" />';
    });
    document.title = `${CV.name ? CV.name + ' — ' : ''}CV Quest`;
    applyI18n();
    updateDayNightButton();
  }

  let lastT = performance.now();
  function frame(now) {
    const dt = clamp((now - lastT) / 1000, 0, 0.05);
    lastT = now;
    update(dt);
    render();
    if (!mm.classList.contains('hidden')) renderMinimap(dt);
    requestAnimationFrame(frame);
  }

  initUI();
  resize();
  requestAnimationFrame(frame);

  // untuk debugging di console
  window.cvQuest = { state, player, gems, npcs, cat, weather, SECTIONS, setLang, get dark() { return dark; } };
})();
