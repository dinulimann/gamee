/*
 * CV Quest — game RPG top-down berisi CV interaktif.
 * Tanpa library, cukup Canvas 2D. Semua konten diambil dari js/data.js.
 */
(() => {
  'use strict';

  const CV = window.CV || {};
  CV.skills = CV.skills || [];
  CV.npcs = CV.npcs || [];

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
  const initials = (name) => {
    const w = String(name || '?').trim().split(/\s+/);
    return (w.length > 1 ? w[0][0] + w[1][0] : w[0].slice(0, 2)).toUpperCase();
  };

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
      'avatar', 'logo',
    ];
    let pending = names.length;
    const done = () => { if (--pending === 0) onAssetsReady.forEach((f) => f()); };
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
  };
  const persist = () => store.save(state);

  // ---------------------------------------------------------------- world
  const TILE = 32, MW = 44, MH = 32;
  const GRASS = 0, PATH = 1, WATER = 2, SAND = 3, PLAZA = 4;
  const BW = 5, BH = 4;
  const SPAWN = { x: 22, y: 18 };
  const FOUNTAIN = { x: 22 * TILE + 16, y: 15 * TILE + 16 };

  const SECTIONS = [
    { id: 'about', name: 'Rumah Saya', label: 'Tentang Saya', icon: '🏠', color: '#e07a5f', roof: '#9c3d2a', tx: 7, ty: 4, path: [[9, 8], [9, 10], [17, 10], [17, 11]] },
    { id: 'experience', name: 'Kantor Karier', label: 'Pengalaman', icon: '💼', color: '#5b8def', roof: '#2f4f9e', tx: 20, ty: 3, path: [[22, 7], [22, 11]] },
    { id: 'education', name: 'Akademi', label: 'Pendidikan', icon: '🎓', color: '#9b6dd6', roof: '#5a3a8c', tx: 32, ty: 4, path: [[34, 8], [34, 10], [27, 10], [27, 11]] },
    { id: 'skills', name: 'Bengkel Skill', label: 'Keahlian', icon: '🛠️', color: '#f2a541', roof: '#a8641a', tx: 7, ty: 21, path: [[9, 25], [13, 25], [13, 19], [17, 19]] },
    { id: 'projects', name: 'Lab Proyek', label: 'Proyek', icon: '🧪', color: '#2bb3a3', roof: '#17756b', tx: 20, ty: 21, path: [[22, 25], [26, 25], [26, 19]] },
    { id: 'contact', name: 'Kantor Pos', label: 'Kontak', icon: '✉️', color: '#e8577e', roof: '#a12a4f', tx: 31, ty: 21, path: [[33, 25], [29, 25], [29, 19], [27, 19]] },
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
      i, name: n.name || 'Warga', lines: n.lines || ['Halo!'], sprite: n.sprite || NPC_SPRITES[i],
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
  };

  // ---------------------------------------------------------------- DOM refs
  const canvas = $('#game'), ctx = canvas.getContext('2d');
  const mm = $('#minimap'), mctx = mm.getContext('2d');
  const ui = {
    hud: $('#hud'), prompt: $('#prompt'), action: $('#actionBtn'), toasts: $('#toasts'),
    modal: $('#modal'), modalTitle: $('#modalTitle'), modalIcon: $('#modalIcon'), modalBody: $('#modalBody'),
    quest: $('#quest'), questBody: $('#questBody'), classic: $('#classic'), classicBody: $('#classicBody'),
    title: $('#title'), dialog: $('#dialog'), dialogName: $('#dialogName'), dialogText: $('#dialogText'),
    progress: $('#hudProgress'), sound: $('#btnSound'),
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
    { id: 'first_door', icon: '🚪', name: 'Tamu Pertama', desc: 'Masuki bangunan pertama' },
    { id: 'first_gem', icon: '💎', name: 'Mata Jeli', desc: 'Temukan permata skill pertama' },
    { id: 'talker', icon: '💬', name: 'Ramah Tamah', desc: 'Ngobrol dengan semua warga' },
    { id: 'wish', icon: '⛲', name: 'Penuh Harapan', desc: 'Lempar koin ke air mancur' },
    { id: 'all_sections', icon: '🗺️', name: 'Penjelajah', desc: 'Kunjungi semua bangunan' },
    { id: 'all_gems', icon: '👑', name: 'Kolektor', desc: 'Kumpulkan semua permata skill' },
  ];
  function unlock(id) {
    if (state.ach.includes(id)) return;
    const a = ACH.find((x) => x.id === id);
    if (!a) return;
    state.ach.push(id);
    persist();
    setTimeout(() => {
      toast(`🏆 Pencapaian terbuka: ${a.icon} ${esc(a.name)}<small>${esc(a.desc)}</small>`, 3500);
      Sound.seq([659, 784, 1047], 0.08, 'triangle', 0.05);
    }, 400);
  }
  const allSectionsDone = () => SECTIONS.every((s) => state.visited.includes(s.id));
  const allGemsDone = () => gems.every((g) => gemCollected(g.i));

  function updateProgress() {
    const v = SECTIONS.filter((s) => state.visited.includes(s.id)).length;
    const g = gems.filter((x) => gemCollected(x.i)).length;
    ui.progress.innerHTML = `<span title="Bangunan dikunjungi">🏠 ${v}/${SECTIONS.length}</span><span title="Permata skill">💎 ${g}/${gems.length}</span><span title="Pencapaian">🏆 ${state.ach.length}/${ACH.length}</span>`;
  }

  // ---------------------------------------------------------------- content renderers
  const joinDot = (...p) => p.filter(Boolean).map(esc).join(' · ');
  const linkOrText = (url, label) => (url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label || url)}</a>` : '');

  const chipBlock = (title, list) =>
    (list || []).length ? `<h4>${title}</h4><div class="chips">${list.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : '';

  function renderAbout() {
    return `
      <div class="about-head">
        <div class="avatar big">${esc(initials(CV.name))}</div>
        <div>
          <h3>${esc(CV.name)}</h3>
          <p class="muted">${esc(CV.role)}${CV.location ? ' · 📍 ' + esc(CV.location) : ''}</p>
          ${CV.tagline ? `<p class="tagline">“${esc(CV.tagline)}”</p>` : ''}
        </div>
      </div>
      ${(CV.about || []).map((p) => `<p>${esc(p)}</p>`).join('')}
      ${(CV.facts || []).length ? `<h4>SOROTAN</h4><ul class="facts">${CV.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
      ${chipBlock('🎯 POSISI YANG DICARI', CV.lookingFor)}
      ${chipBlock('💡 MINAT', CV.interests)}`;
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
    return `<p class="muted">Ketuk setiap kartu untuk melihat detailnya.</p>` + items.map((e, i) => `
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
    CV.skills.forEach((s, i) => { (cats[s.category || 'Lainnya'] = cats[s.category || 'Lainnya'] || []).push({ ...s, i }); });
    return `
      <div class="skill-info">
        <span>💎 Kamu menemukan <b>${found}/${gems.length}</b> permata skill. Jelajahi desa untuk membuka sisanya!</span>
        ${found < gems.length ? `<button class="btn small" data-action="reveal">${revealSkills ? '🙈 Sembunyikan' : '👀 Intip semua'}</button>` : ''}
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
          <div class="cv-item-head"><strong>${esc(p.name)}</strong>${linkOrText(p.link, 'tautan')}</div>
          <div>${esc(p.desc)}</div>
          <div class="chips">${(p.tech || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
        </div>`).join('');
    }
    return `<p class="muted">Ketuk proyek untuk membuka detail.</p>` + items.map((p) => `
      <details class="card">
        <summary><span>🧪</span><span><div class="card-title">${esc(p.name)}</div><div class="card-sub">${(p.tech || []).map(esc).join(' · ')}</div></span></summary>
        <div class="card-body">
          <p style="margin-top:0">${esc(p.desc)}</p>
          <div class="chips">${(p.tech || []).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
          ${p.link ? `<a class="btn small" href="${esc(p.link)}" target="_blank" rel="noopener">🔗 Lihat proyek</a>` : ''}
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
      <p>Terima kasih sudah mampir! Ingin bekerja sama atau sekadar menyapa? Kirim surat lewat salah satu jalur di bawah ini 📮</p>
      <div class="contact-grid">
        ${links.map((l) => `<a class="btn" href="${esc(l.href)}" target="_blank" rel="noopener">${l.icon} ${esc(l.label)}</a>`).join('')}
        ${CV.contact?.email ? `<button class="btn ghost" data-action="copy">📋 Salin email</button>` : ''}
      </div>`;
  }

  const RENDER = { about: renderAbout, experience: renderExperience, education: renderEducation, skills: renderSkills, projects: renderProjects, contact: renderContact };

  function renderClassic() {
    const sec = (title, html) => (html ? `<section><h2>${title}</h2>${html}</section>` : '');
    return `
      <header class="cv-head">
        <div class="avatar big">${esc(initials(CV.name))}</div>
        <div>
          <h1>${esc(CV.name)}</h1>
          <div><strong>${esc(CV.role)}</strong>${CV.location ? ' · ' + esc(CV.location) : ''}</div>
          ${CV.tagline ? `<div class="muted">${esc(CV.tagline)}</div>` : ''}
          <div style="margin-top:6px">${renderContact(true)}</div>
        </div>
      </header>
      ${sec('Tentang Saya', (CV.about || []).map((p) => `<p>${esc(p)}</p>`).join(''))}
      ${sec('Posisi yang Dicari', (CV.lookingFor || []).length ? `<div class="chips">${CV.lookingFor.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>` : '')}
      ${sec('Pengalaman', renderExperience(true))}
      ${sec('Pendidikan', renderEducation(true))}
      ${sec('Keahlian', CV.skills.length ? renderSkills(true) : '')}
      ${sec('Proyek', renderProjects(true))}
      ${sec('Minat', (CV.interests || []).map(esc).join(' · '))}`;
  }

  // ---------------------------------------------------------------- overlays
  let modalOnClose = null, modalSection = null;
  function openModal({ title, icon, color, html, section, onClose }) {
    ui.modalTitle.textContent = title;
    ui.modalIcon.textContent = icon || '';
    ui.modal.querySelector('.modal-card').style.setProperty('--accent', color || '#5b8def');
    ui.modalBody.innerHTML = html;
    ui.modalBody.scrollTop = 0;
    ui.modal.classList.remove('hidden');
    modalOnClose = onClose || null;
    modalSection = section || null;
    Sound.open();
  }
  function closeModal() {
    if (ui.modal.classList.contains('hidden')) return;
    ui.modal.classList.add('hidden');
    Sound.close();
    doorCooldown = 0.6;
    const cb = modalOnClose; modalOnClose = null; modalSection = null;
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
  }

  function openQuest() {
    const v = SECTIONS.filter((s) => state.visited.includes(s.id)).length;
    const g = gems.filter((x) => gemCollected(x.i)).length;
    const total = SECTIONS.length + gems.length;
    const pct = total ? Math.round(((v + g) / total) * 100) : 100;
    ui.questBody.innerHTML = `
      <p><b>Misi utama:</b> kenali ${esc(CV.name)} dengan mengunjungi semua bangunan dan mengumpulkan semua permata skill.</p>
      <div class="progress-big"><i style="--w:${pct}%"></i></div>
      <p class="muted" style="margin:4px 0 0">${pct}% selesai · 💎 ${g}/${gems.length} permata</p>
      <h4>BANGUNAN</h4>
      <ul class="quest-list">${SECTIONS.map((s) => `
        <li class="${state.visited.includes(s.id) ? 'done' : ''}">
          <span>${state.visited.includes(s.id) ? '✅' : '⬜'}</span>
          <span class="q-name">${s.icon} ${esc(s.name)} <span class="muted">· ${esc(s.label)}</span></span>
          <button class="btn small" data-goto="${s.id}">Pergi ➜</button>
        </li>`).join('')}</ul>
      <h4>PENCAPAIAN</h4>
      <div class="ach-grid">${ACH.map((a) => `
        <div class="ach ${state.ach.includes(a.id) ? '' : 'locked'}"><span class="ach-icon">${a.icon}</span><b>${esc(a.name)}</b><div class="muted">${esc(a.desc)}</div></div>`).join('')}</div>
      <h4>LAINNYA</h4>
      <button class="btn ghost small" data-action="reset">🔁 Ulangi dari awal</button>`;
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
    openModal({
      title: 'Cara Bermain', icon: '❔', color: '#2bb3a3',
      html: `
        <ul>
          <li>🚶 Berjalan: <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> atau tombol panah — atau cukup <b>klik / ketuk</b> tempat tujuan di peta.</li>
          <li>🏠 Masuk bangunan: dekati pintunya lalu tekan <kbd>E</kbd> / <kbd>Spasi</kbd>, atau langsung klik bangunannya.</li>
          <li>💬 Ngobrol dengan warga: klik warganya atau tekan <kbd>E</kbd> saat berada di dekatnya.</li>
          <li>💎 Permata berkilau = skill. Jalan di atasnya untuk mengambilnya.</li>
          <li>🗺️ Klik minimap di pojok kanan bawah untuk berjalan cepat.</li>
          <li>⌨️ Pintasan: <kbd>Q</kbd> misi · <kbd>C</kbd> CV klasik · <kbd>M</kbd> suara · <kbd>Esc</kbd> tutup.</li>
        </ul>
        <p class="muted">Progresmu tersimpan otomatis di browser ini.</p>`,
    });
  }

  function anyOverlay() {
    return !ui.modal.classList.contains('hidden') || !ui.quest.classList.contains('hidden') ||
      !ui.classic.classList.contains('hidden') || !ui.title.classList.contains('hidden');
  }

  // ---------------------------------------------------------------- dialog
  const dlg = { active: false, npc: null, lines: [], i: 0, shown: 0, last: 0 };
  function startDialog(npc) {
    player.path = null; player.target = null;
    const lines = [...npc.lines];
    const todo = SECTIONS.find((s) => !state.visited.includes(s.id));
    const gLeft = gems.filter((g) => !gemCollected(g.i)).length;
    if (todo) lines.push(`Ngomong-ngomong, kamu belum mampir ke ${todo.icon} ${todo.name}, lho.`);
    else if (gLeft) lines.push(`Masih ada ${gLeft} permata skill yang belum ditemukan. Semangat!`);
    else lines.push('Wah, kamu sudah menjelajahi semuanya. Hebat! 🎉');
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
  const WISHES = [
    'Semoga kamu menemukan kandidat terbaik! 🍀',
    'Koinnya tenggelam dengan anggun... harapanmu tercatat ✨',
    'Plung! Air mancur berkilau sebentar. Pertanda baik!',
    'Semoga harimu menyenangkan dan kodenya bebas bug 🐛🚫',
  ];
  function makeWish() {
    Sound.coin();
    burst(FOUNTAIN.x, FOUNTAIN.y - 10, '#9ad8ff', 30);
    toast(`🪙 ${WISHES[Math.floor(Math.random() * WISHES.length)]}`);
    unlock('wish');
  }

  // ---------------------------------------------------------------- finale
  function checkFinale() {
    if (state.finale || !allSectionsDone() || !allGemsDone()) return;
    state.finale = true; persist();
    Sound.win();
    confetti(160);
    setTimeout(() => openModal({
      title: 'Petualangan Selesai!', icon: '🏆', color: '#f2a541',
      html: `
        <p style="font-size:1.1rem">Terima kasih sudah menjelajahi seluruh desa dan mengenal <b>${esc(CV.name)}</b>! 🎉</p>
        <p>Kamu mengunjungi ${SECTIONS.length} bangunan, mengumpulkan ${gems.length} permata skill, dan membuka ${state.ach.length} pencapaian.</p>
        <div class="contact-grid">
          <button class="btn" data-action="contact">✉️ Hubungi saya</button>
          <button class="btn ghost" data-action="classic">📄 Lihat CV lengkap</button>
          <button class="btn ghost" data-action="reset">🔁 Main lagi</button>
        </div>`,
    }), 900);
  }

  function resetGame() {
    if (!confirm('Hapus progres dan mulai dari awal?')) return;
    store.save({ muted: state.muted });
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
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 160 * dt; p.vx *= 0.98;
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
    if (!ui.title.classList.contains('hidden')) {
      if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); startGame(); }
      return;
    }
    if (e.code === 'Escape') {
      if (dlg.active) endDialog();
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

  let hover = null;
  canvas.addEventListener('pointermove', (e) => {
    if (isTouch) return;
    const w = screenToWorld(e.clientX, e.clientY);
    hover = hitBuilding(w) || hitNpc(w) || (hitFountain(w) ? 'fountain' : null);
    canvas.style.cursor = hover ? 'pointer' : 'default';
  });
  canvas.addEventListener('pointerdown', (e) => {
    Sound.init();
    if (anyOverlay()) return;
    if (dlg.active) { advanceDialog(); return; }
    const w = screenToWorld(e.clientX, e.clientY);
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
    const t = e.target.closest('[data-close], [data-action], [data-goto]');
    if (!t) {
      if (e.target === ui.modal) closeModal();
      else if (e.target === ui.quest) closeQuest();
      else if (e.target === ui.classic) closeClassic();
      return;
    }
    if (t.hasAttribute('data-close')) {
      if (t.closest('#modal')) closeModal();
      else if (t.closest('#quest')) closeQuest();
      else if (t.closest('#classic')) closeClassic();
    } else if (t.dataset.goto) {
      closeQuest();
      goToBuilding(SECTIONS.find((s) => s.id === t.dataset.goto));
    } else {
      const a = t.dataset.action;
      if (a === 'reveal') { revealSkills = !revealSkills; ui.modalBody.innerHTML = renderSkills(false); Sound.click(); }
      else if (a === 'copy') {
        const done = () => toast('📋 Email disalin!');
        try { navigator.clipboard.writeText(CV.contact.email).then(done, () => prompt('Salin email:', CV.contact.email)); }
        catch (err) { prompt('Salin email:', CV.contact.email); }
      } else if (a === 'reset') resetGame();
      else if (a === 'classic') { closeModal(); openClassic(); }
      else if (a === 'contact') { closeModal(); openSection(SECTIONS.find((s) => s.id === 'contact')); }
    }
  });

  $('#btnQuest').onclick = () => { Sound.init(); openQuest(); };
  $('#btnCV').onclick = () => { Sound.init(); openClassic(); };
  $('#btnHelp').onclick = () => { Sound.init(); openHelp(); };
  ui.sound.onclick = () => { Sound.init(); toggleSound(); };
  $('#btnPrint').onclick = () => window.print();
  $('#btnStart').onclick = startGame;
  $('#btnStartClassic').onclick = () => { startGame(); openClassic(); };

  function toggleSound() {
    state.muted = !state.muted; persist();
    ui.sound.textContent = state.muted ? '🔇' : '🔊';
    if (!state.muted) Sound.click();
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
    const fd = Math.hypot(player.x - FOUNTAIN.x, player.y - FOUNTAIN.y);
    if (fd < 78 && fd < bd) best = { type: 'fountain' };
    return best;
  }
  function interact(it) {
    Sound.init();
    if (it.type === 'building') openSection(it.b);
    else if (it.type === 'npc') startDialog(it.n);
    else if (it.type === 'fountain') makeWish();
  }
  let lastPromptKey = '';
  function updatePrompt() {
    current = dlg.active ? null : findInteractable();
    let text = '', key = '';
    if (current) {
      const verb = isTouch ? 'Ketuk 💬' : 'Tekan E';
      if (current.type === 'building') { key = 'b' + current.b.id; text = `${verb} — masuk ${current.b.icon} ${current.b.name}`; }
      else if (current.type === 'npc') { key = 'n' + current.n.i; text = `${verb} — ngobrol dengan ${current.n.name}`; }
      else { key = 'f'; text = `${verb} — lempar koin ke air mancur 🪙`; }
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

  // ---------------------------------------------------------------- update
  let time = 0;
  function update(dt) {
    time += dt;
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

    const t = camTarget(), k = Math.min(1, dt * 7);
    cam.x += (t.x - cam.x) * k; cam.y += (t.y - cam.y) * k;
  }

  function collectGem(g) {
    state.gems.push(g.i); persist();
    const s = CV.skills[g.i];
    Sound.gem();
    burst(g.x, g.y - 10, catColor(s.category), 22);
    toast(`💎 Skill ditemukan: <b>${esc(s.name)}</b> ${'★'.repeat(clamp(s.level || 0, 0, 5))}<small>${esc(s.category || '')} · ${state.gems.length}/${gems.length}</small>`);
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
    const lit = 0.75 + Math.sin(time * 2 + b.tx) * 0.1;
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

  function drawSign(b) {
    const x = (b.tx + BW / 2) * TILE, y = Math.min(b.ty * TILE - 30, buildingTop(b) - 4) + Math.sin(time * 2 + b.tx) * 2;
    const visited = state.visited.includes(b.id);
    const txt = `${b.icon} ${b.name}${visited ? ' ✓' : ''}`;
    ctx.font = '800 11px Nunito, system-ui, sans-serif';
    const tw = ctx.measureText(txt).width + 16;
    ctx.fillStyle = visited ? 'rgba(20,60,30,0.85)' : 'rgba(17,21,36,0.85)';
    rrect(ctx, x - tw / 2, y - 10, tw, 20, 8); ctx.fill();
    ctx.strokeStyle = visited ? '#80ed99' : b.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y + 1);
    if (!visited) {
      ctx.fillStyle = '#f2c14e';
      ctx.font = '900 14px Nunito, system-ui, sans-serif';
      ctx.fillText('!', x + tw / 2 + 4, y - 8 + Math.sin(time * 5) * 2);
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
    for (const n of npcs) ents.push({ y: n.y, d: () => drawCharacter(n) });
    ents.push({ y: player.y + 0.1, d: () => drawCharacter(player) });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.d();

    for (const b of SECTIONS) if (visible(b.tx + 2, b.ty, 6)) drawSign(b);
    for (const n of npcs) drawNpcBubble(n);

    for (const p of parts) {
      ctx.globalAlpha = 1 - p.t / p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

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
      setTimeout(() => toast(isTouch ? '👆 Ketuk peta untuk berjalan. Ketuk bangunan untuk masuk!' : '🚶 WASD / panah untuk berjalan, atau klik peta. Klik bangunan untuk masuk!', 4500), 500);
      setTimeout(() => { const n = npcs[0]; if (n) toast(`💬 ${esc(n.name)} sepertinya ingin menyapamu.`, 3500); }, 5500);
    } else toast('👋 Selamat datang kembali! Progresmu sudah dimuat.');
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
    $('#hudName').textContent = CV.name || '';
    $('#hudRole').textContent = CV.role || '';
    $('#titleName').textContent = CV.name || '';
    $('#titleRole').textContent = CV.role || '';
    $('#titleTag').textContent = CV.tagline || '';
    document.title = `${CV.name ? CV.name + ' — ' : ''}CV Quest`;
    ui.sound.textContent = state.muted ? '🔇' : '🔊';
    if (state.visited.length || state.gems.length) $('#btnStart').textContent = '▶ Lanjutkan Petualangan';
    updateProgress();
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
  window.cvQuest = { state, player, gems, npcs, SECTIONS };
})();
