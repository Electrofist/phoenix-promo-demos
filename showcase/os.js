/* Phoenix OS: window manager + apps. Everything runs in the page; no backend. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const css = (name, el = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth <= 700;
  const SKIN = document.documentElement.dataset.skin || 'Phoenix';
  const bootT = Date.now();

  /* ---------- icons (stroke = currentColor, restyled by skins) ---------- */
  const I = {
    logo: '<path d="M12 2.5c.8 3 3.8 4.6 3.8 8.4a3.8 3.8 0 0 1-7.6 0c0-1.6.7-2.7 1.5-3.4.2 1.4 1 2 1.6 2.2.6-1.8.9-4.4.7-7.2z"/><path d="M6.5 13.5C4.6 14.6 3.5 16.6 3.5 19h17c0-2.4-1.1-4.4-3-5.5"/>',
    terminal: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M7 10l3 2.5L7 15M12.5 15h4.5"/>',
    files: '<path d="M3 7.5A2 2 0 0 1 5 5.5h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 10h18"/>',
    notes: '<path d="M6 3.5h8.5l4 4V20.5H6z"/><path d="M14.5 3.5v4h4M9 12h6.5M9 15.5h4.5"/>',
    paint: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.9s-1-1.6-1-2.6 1-1.5 2-1.5h2.2A3.8 3.8 0 0 0 21 11.2C21 6.7 17 3 12 3z"/><circle cx="7.5" cy="11.5" r="1.1"/><circle cx="10" cy="7.2" r="1.1"/><circle cx="15" cy="7.2" r="1.1"/>',
    music: '<path d="M9 18V6l10-2.2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    snake: '<path d="M6.5 9h11A4.5 4.5 0 0 1 22 13.5v.5a3 3 0 0 1-5.4 1.8L15 14H9l-1.6 1.8A3 3 0 0 1 2 14v-.5A4.5 4.5 0 0 1 6.5 9z"/><path d="M7 11.2v3.2M5.4 12.8h3.2"/><circle cx="16" cy="12" r=".6"/><circle cx="18" cy="13.6" r=".6"/>',
    code: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5M13.5 4.5l-3 15"/>',
    settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v2.8M12 18.7v2.8M2.5 12h2.8M18.7 12h2.8M5.3 5.3l2 2M16.7 16.7l2 2M5.3 18.7l2-2M16.7 7.3l2-2"/>',
    trash: '<path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
    wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.2a9.5 9.5 0 0 1 13 0M8.6 15.4a5 5 0 0 1 6.8 0"/><circle cx="12" cy="18.6" r="1" fill="currentColor"/>',
    battery: '<rect x="2.5" y="7.5" width="17" height="9" rx="2"/><path d="M22 10.5v3"/><rect x="4.5" y="9.5" width="11" height="5" rx="1" fill="currentColor" stroke="none"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    close: '<path d="M7 7l10 10M17 7L7 17"/>', min: '<path d="M6 12h12"/>', max: '<path d="M7 7h10v10H7z"/>'
  };
  const svg = (k, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${I[k]}</svg>`;
  const tile = (k) => `<span class="tile" style="background:var(--t-${k})">${svg(k)}</span>`;

  /* ---------- virtual files ---------- */
  const VFS = {
    'readme.txt': `Welcome to Phoenix OS 1.0\n\nThis whole operating system is one HTML file, built from a single prompt inside Phoenix Code.\n\nTry:\n  • ⌘/Ctrl + K to search apps\n  • Right-click the desktop\n  • Open Terminal and type "help"\n  • Flip the ⑂ variant chip in Live Preview to reskin everything`,
    'todo.md': `# Today\n- [x] Boot an OS inside a code editor\n- [x] Make a drum machine\n- [ ] Beat my own Snake high score\n- [ ] Order pizza (it's tradition)`,
    'pizza.txt': `Margherita, the Phoenix way\n\n500g Caputo 00 · 325g water · 15g salt · 1g yeast\nRest 48h. Open by hand. San Marzano, fior di latte, basil.\n90 seconds at 485°C.`,
    'secret.txt': `You found it. 🔥\nThe phoenix always rises: try "matrix" in the terminal.`
  };

  /* ---------- apps ---------- */
  const apps = {
    terminal: { title: 'Terminal', w: 620, h: 400, render: Terminal },
    files: { title: 'Files', w: 620, h: 400, render: Files },
    notes: { title: 'Notes', w: 460, h: 420, render: Notes },
    paint: { title: 'Paint', w: 700, h: 500, render: Paint },
    music: { title: 'Beats', w: 720, h: 420, render: Music },
    snake: { title: 'Snake', w: 440, h: 500, render: Snake },
    code: { title: 'Code', w: 860, h: 500, render: Code },
    settings: { title: 'Settings', w: 480, h: 460, render: Settings },
    about: { title: 'About Phoenix OS', w: 380, h: 400, render: About, hidden: true }
  };
  const dockOrder = ['terminal', 'files', 'notes', 'paint', 'music', 'snake', 'code', 'settings'];

  /* ---------- shell ---------- */
  document.body.insertAdjacentHTML('afterbegin', `
    <div class="boot" id="boot"><div class="boot-logo">${svg('logo')}</div><div class="boot-bar"><i></i></div><div class="boot-name">Phoenix OS</div></div>
    <header class="menubar">
      <button class="mb-logo" id="mbLogo" aria-label="Phoenix menu">${svg('logo')}</button>
      <span class="mb-app" id="mbApp">Phoenix</span>
      <nav class="mb-menus"><span>File</span><span>Edit</span><span>View</span><span>Window</span><span>Help</span></nav>
      <div class="mb-right">
        <button class="mb-search" id="spotBtn" aria-label="Search apps">${svg('search')}<span>⌘K</span></button>
        ${svg('wifi')}${svg('battery')}<span id="clock"></span>
      </div>
    </header>
    <main class="desktop" id="desktop"><div class="watermark" aria-hidden="true">${SKIN}</div><div class="desk-icons" id="deskIcons"></div></main>
    <nav class="dock" id="dock" aria-label="Dock"><button class="start-btn" id="startBtn">${svg('logo')}<span>Start</span></button></nav>
    <div class="spot" id="spot" hidden><div class="spot-box"><input class="spot-in" id="spotIn" placeholder="Search apps and files…" aria-label="Search"><div class="spot-list" id="spotList"></div></div></div>
    <div class="ctx" id="ctx" hidden></div>`);
  const desktop = $('#desktop'), dock = $('#dock');

  dockOrder.forEach(id => {
    dock.appendChild(h(`<button class="dock-item" data-app="${id}" aria-label="${apps[id].title}">${tile(id)}<span class="label">${apps[id].title}</span></button>`));
  });
  dock.appendChild(h('<span class="dock-sep"></span>'));
  dock.appendChild(h(`<button class="dock-item" data-trash aria-label="Trash">${tile('trash')}<span class="label">Trash</span></button>`));
  dock.addEventListener('click', e => { const b = e.target.closest('[data-app]'); if (b) open(b.dataset.app); else if (e.target.closest('[data-trash]')) toast('Trash is empty. Nothing to regret.'); });

  [['files', 'Files'], ['notes', 'readme.txt', 'readme.txt'], ['code', 'Code'], ['music', 'Beats']].forEach(([id, label, file]) => {
    const b = h(`<button class="desk-icon">${tile(id)}<span>${label}</span></button>`);
    b.addEventListener('dblclick', () => file ? openFile(file) : open(id));
    b.addEventListener('keydown', e => { if (e.key === 'Enter') file ? openFile(file) : open(id); });
    if (matchMedia('(pointer:coarse)').matches) b.addEventListener('click', () => file ? openFile(file) : open(id));
    $('#deskIcons').appendChild(b);
  });

  const tickClock = () => { const d = new Date(); $('#clock').textContent = d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }) + '  ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };
  tickClock(); setInterval(tickClock, 10000);

  /* ---------- window manager ---------- */
  let z = 100, cascade = 0;
  const wins = new Map();
  function open(id, opts = {}) {
    const app = apps[id]; if (!app) return null;
    const key = opts.key || id;
    if (wins.has(key)) { const w = wins.get(key); w.el.classList.remove('min'); focus(w); return w; }
    const D = desktop.getBoundingClientRect();
    const W = Math.min(app.w, D.width - 40), H = Math.min(app.h, D.height - 110);
    const x = Math.max(10, (D.width - W) / 2 + (cascade % 6) * 26 - 60), y = Math.max(10, (D.height - H) / 2 - 40 + (cascade % 6) * 22 - 30);
    cascade++;
    const el = h(`<section class="win" role="dialog" aria-label="${opts.title || app.title}" style="left:${x}px;top:${y}px;width:${W}px;height:${H}px">
      <div class="win-title"><div class="win-btns">
        <button class="wbtn close" aria-label="Close">${svg('close')}</button><button class="wbtn min" aria-label="Minimize">${svg('min')}</button><button class="wbtn max" aria-label="Maximize">${svg('max')}</button>
      </div><div class="win-name">${opts.title || app.title}</div><div class="win-btns" style="visibility:hidden;width:var(--title-balance,52px)"></div></div>
      <div class="win-body"></div><div class="win-resize"></div></section>`);
    desktop.appendChild(el);
    const w = { id, key, el, body: $('.win-body', el), app, cleanup: [] };
    wins.set(key, w);
    el.addEventListener('pointerdown', () => focus(w));
    $('.close', el).onclick = () => close(w);
    $('.min', el).onclick = () => { el.classList.add('min'); el.classList.remove('active'); setMenuApp(); };
    $('.max', el).onclick = () => el.classList.toggle('max');
    $('.win-title', el).addEventListener('dblclick', () => el.classList.toggle('max'));
    drag(w); resize(w);
    focus(w);
    try { app.render(w, opts); } catch (err) { w.body.innerHTML = `<div class="pane"><h2>App crashed</h2><p>${err.message}</p></div>`; console.error(err); }
    updateDock();
    return w;
  }
  function close(w) {
    w.cleanup.forEach(fn => fn()); w.el.classList.add('closing');
    setTimeout(() => w.el.remove(), reduce ? 0 : 200);
    wins.delete(w.key); updateDock(); setMenuApp();
  }
  function focus(w) {
    wins.forEach(o => o.el.classList.remove('active'));
    w.el.classList.add('active'); w.el.style.zIndex = ++z; setMenuApp(w);
  }
  function setMenuApp(w) {
    if (!w) { const top = [...wins.values()].filter(o => !o.el.classList.contains('min')).sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0]; if (top) return focus(top); }
    $('#mbApp').textContent = w ? (w.el.getAttribute('aria-label')) : 'Phoenix';
  }
  function updateDock() { dock.querySelectorAll('[data-app]').forEach(b => b.classList.toggle('running', [...wins.values()].some(w => w.id === b.dataset.app))); }
  function drag(w) {
    const bar = $('.win-title', w.el);
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('.wbtn') || small() || w.el.classList.contains('max')) return;
      const sx = e.clientX, sy = e.clientY, ox = w.el.offsetLeft, oy = w.el.offsetTop, D = desktop.getBoundingClientRect();
      bar.setPointerCapture(e.pointerId);
      const mv = ev => { w.el.style.left = Math.min(D.width - 80, Math.max(-w.el.offsetWidth + 80, ox + ev.clientX - sx)) + 'px'; w.el.style.top = Math.min(D.height - 40, Math.max(0, oy + ev.clientY - sy)) + 'px'; };
      const up = () => { bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); };
      bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up);
    });
  }
  function resize(w) {
    const g = $('.win-resize', w.el);
    g.addEventListener('pointerdown', e => {
      e.stopPropagation(); const sx = e.clientX, sy = e.clientY, ow = w.el.offsetWidth, oh = w.el.offsetHeight;
      g.setPointerCapture(e.pointerId);
      const mv = ev => { w.el.style.width = Math.max(260, ow + ev.clientX - sx) + 'px'; w.el.style.height = Math.max(180, oh + ev.clientY - sy) + 'px'; w.onresize && w.onresize(); };
      const up = () => { g.removeEventListener('pointermove', mv); g.removeEventListener('pointerup', up); };
      g.addEventListener('pointermove', mv); g.addEventListener('pointerup', up);
    });
  }
  function toast(msg) {
    const t = h(`<div style="position:fixed;left:50%;top:calc(var(--menubar-h) + 14px);translate:-50% 0;z-index:9000;padding:10px 16px;border-radius:var(--btn-radius);background:var(--win-bg);border:var(--win-border);box-shadow:var(--win-shadow);-webkit-backdrop-filter:var(--win-blur);backdrop-filter:var(--win-blur);font-size:13px">${msg}</div>`);
    document.body.appendChild(t); setTimeout(() => t.remove(), 2200);
  }
  function openFile(name) { return open('notes', { key: 'file:' + name, title: name, file: name }); }

  /* ---------- Terminal ---------- */
  function Terminal(w) {
    w.body.innerHTML = `<div class="term" tabindex="-1"><div class="out"></div><div class="term-line"><span class="p">guest@phoenix ~ %</span><input class="term-in" spellcheck="false" autocomplete="off" aria-label="Terminal input"></div></div>`;
    const term = $('.term', w.body), out = $('.out', w.body), input = $('.term-in', w.body);
    const hist = []; let hi = 0;
    const print = (html, cls = '') => { out.insertAdjacentHTML('beforeend', `<pre class="${cls}">${html}</pre>`); term.scrollTop = term.scrollHeight; };
    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    const cmds = {
      help: () => print(`<span class="acc">Phoenix shell</span>, commands:\n  ls · cat &lt;file&gt; · open &lt;app&gt; · neofetch · matrix · calc &lt;expr&gt;\n  weather · pizza · date · whoami · echo · theme · clear · exit\n<span class="dim">apps: ${Object.keys(apps).join(', ')}</span>`),
      ls: () => print(Object.keys(VFS).map(f => `<span class="acc">${f}</span>`).join('   ')),
      cat: a => VFS[a] ? print(esc(VFS[a])) : print(`cat: ${esc(a || '')}: No such file`, 'dim'),
      open: a => apps[a] ? (open(a), print(`opening ${a}…`, 'dim')) : VFS[a] ? (openFile(a), print(`opening ${a}…`, 'dim')) : print(`open: unknown app "${esc(a || '')}"`, 'dim'),
      neofetch: () => {
        const up = Math.max(1, Math.round((Date.now() - bootT) / 60000));
        print(`<span class="acc">      .:.         </span>  <b>guest</b>@<b>phoenix</b>
<span class="acc">     .:::.        </span>  ──────────────
<span class="acc">    .:: ::.       </span>  <span class="acc">OS</span>      Phoenix OS 1.0
<span class="acc">   ::  :  ::      </span>  <span class="acc">Host</span>    Phoenix Code Live Preview
<span class="acc">  ::  :::  ::     </span>  <span class="acc">Kernel</span>  JavaScript
<span class="acc">  ':: ::: ::'     </span>  <span class="acc">Uptime</span>  ${up} min
<span class="acc">   ':::::::'      </span>  <span class="acc">Shell</span>   psh 1.0
<span class="acc">  .::'''''::.     </span>  <span class="acc">Display</span> ${innerWidth}×${innerHeight}
<span class="acc"> ::'       '::    </span>  <span class="acc">Skin</span>    ${SKIN}
                    <span class="acc">CPU</span>     ${navigator.hardwareConcurrency || '?'} cores`);
      },
      date: () => print(new Date().toString()),
      whoami: () => print('guest. Everyone is a guest at the fire.'),
      echo: a => print(esc(a || '')),
      weather: () => print('Napoli · 24°C · ☀ sunny · ideal pizza weather'),
      theme: () => print(`current skin: <span class="acc">${SKIN}</span>\nswitch skins with the ⑂ variant chip in Phoenix Live Preview`),
      pizza: () => print(`<span class="acc">        _....._
     .'  o   O '.
    /  O   o   O \\
   |  o  O   o  o |
    \\  O   o  O  /
     '._  o  _.'
        '""""'</span>   one Margherita, coming up 🔥`),
      calc: a => { if (!a || /[^0-9+\-*/().%\s^]/.test(a)) return print('calc: numbers and + - * / ( ) % ^ only', 'dim'); try { print(String(Function(`"use strict";return (${a.replace(/\^/g, '**')})`)())); } catch { print('calc: syntax error', 'dim'); } },
      matrix: () => matrix(),
      sudo: () => print('nice try 🙂', 'dim'),
      clear: () => { out.innerHTML = ''; },
      exit: () => close(w)
    };
    function run(line) {
      print(`<span class="p">guest@phoenix ~ %</span> ${esc(line)}`);
      const [c, ...rest] = line.trim().split(/\s+/); if (!c) return;
      (cmds[c] || (() => print(`psh: command not found: ${esc(c)}. Try "help"`, 'dim')))(rest.join(' '));
    }
    function matrix() {
      const cv = h('<canvas class="matrix"></canvas>'); w.body.appendChild(cv);
      const r = w.body.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = r.width * d; cv.height = r.height * d;
      const g = cv.getContext('2d'); g.scale(d, d); const fs = 14, cols = Math.ceil(r.width / fs), ys = Array(cols).fill(0).map(() => Math.random() * -40);
      const col = css('--accent', w.el) || '#ff6a2c'; let t0 = performance.now(), raf;
      const loop = now => {
        g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 0, r.width, r.height); g.fillStyle = col; g.font = `${fs}px monospace`;
        ys.forEach((y, i) => { g.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), i * fs, y * fs); ys[i] = y * fs > r.height && Math.random() > .97 ? 0 : y + 1; });
        if (now - t0 < 4500) raf = requestAnimationFrame(loop); else cv.remove();
      };
      raf = requestAnimationFrame(loop); w.cleanup.push(() => cancelAnimationFrame(raf));
    }
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const v = input.value; input.value = ''; if (v.trim()) { hist.push(v); hi = hist.length; } run(v); }
      else if (e.key === 'ArrowUp') { if (hi > 0) input.value = hist[--hi]; e.preventDefault(); }
      else if (e.key === 'ArrowDown') { input.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); e.preventDefault(); }
      else if (e.key === 'Tab') { e.preventDefault(); const [c, a = ''] = input.value.split(' '); const pool = input.value.includes(' ') ? [...Object.keys(apps), ...Object.keys(VFS)] : Object.keys(cmds); const m = pool.find(k => k.startsWith(input.value.includes(' ') ? a : c)); if (m) input.value = input.value.includes(' ') ? `${c} ${m}` : m; }
    });
    term.addEventListener('click', () => { if (!getSelection().toString()) input.focus(); });
    w.run = run;
    cmds.neofetch(); print('type <span class="acc">help</span> to get started', 'dim');
    setTimeout(() => input.focus(), 50);
  }

  /* ---------- Files ---------- */
  function Files(w) {
    w.body.innerHTML = `<div class="files"><div class="files-side"><span class="on">Documents</span><span>Desktop</span><span>Music</span><span>Recent</span></div><div class="files-grid"></div></div>`;
    const grid = $('.files-grid', w.body);
    Object.keys(VFS).forEach(name => {
      const b = h(`<button class="file">${tile('notes')}<span>${name}</span></button>`);
      b.addEventListener('dblclick', () => openFile(name)); b.addEventListener('keydown', e => e.key === 'Enter' && openFile(name));
      if (matchMedia('(pointer:coarse)').matches) b.addEventListener('click', () => openFile(name));
      grid.appendChild(b);
    });
    [['paint', 'Paint.app'], ['music', 'Beats.app'], ['snake', 'Snake.app']].forEach(([id, n]) => {
      const b = h(`<button class="file">${tile(id)}<span>${n}</span></button>`); b.addEventListener('dblclick', () => open(id)); grid.appendChild(b);
    });
  }

  /* ---------- Notes ---------- */
  function Notes(w, opts) {
    const k = 'pos-note:' + (opts.file || 'scratch');
    w.body.innerHTML = `<textarea class="notes" spellcheck="false" aria-label="Note"></textarea>`;
    const ta = $('textarea', w.body);
    ta.value = localStorage.getItem(k) ?? (opts.file ? VFS[opts.file] : 'Scratchpad. Autosaves as you type ✍️');
    ta.addEventListener('input', () => localStorage.setItem(k, ta.value));
  }

  /* ---------- Paint ---------- */
  function Paint(w) {
    const colors = ['#141414', '#ff6a2c', '#ff3d6e', '#ffc828', '#22c55e', '#2f7bff', '#8b5cf6', '#ffffff'];
    w.body.innerHTML = `<div class="toolbar">${colors.map((c, i) => `<button class="swatch${i ? '' : ' on'}" data-c="${c}" style="background:${c}" aria-label="Color ${c}"></button>`).join('')}
      <span class="spacer"></span><input type="range" min="2" max="40" value="8" aria-label="Brush size">
      <button class="ui-btn" data-erase>Eraser</button><button class="ui-btn" data-clear>Clear</button><button class="ui-btn primary" data-save>Save</button></div>
      <div class="paint-wrap"><canvas></canvas></div>`;
    const cv = $('canvas', w.body), g = cv.getContext('2d'), wrap = $('.paint-wrap', w.body), size = $('input', w.body);
    let color = colors[0], erase = false, last = null;
    const fit = () => {
      const r = wrap.getBoundingClientRect(), d = devicePixelRatio || 1; if (!r.width) return;
      const old = document.createElement('canvas'); old.width = cv.width; old.height = cv.height; old.getContext('2d').drawImage(cv, 0, 0);
      cv.width = r.width * d; cv.height = r.height * d; g.setTransform(d, 0, 0, d, 0, 0);
      g.fillStyle = css('--paper', w.el) || '#fff'; g.fillRect(0, 0, r.width, r.height); g.drawImage(old, 0, 0, old.width / d, old.height / d);
    };
    requestAnimationFrame(fit); w.onresize = fit;
    const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); last = pos(e); stroke(e); });
    cv.addEventListener('pointermove', e => { if (last) stroke(e); });
    cv.addEventListener('pointerup', () => last = null);
    function stroke(e) { const p = pos(e); g.strokeStyle = erase ? (css('--paper', w.el) || '#fff') : color; g.lineWidth = +size.value * (e.pressure && e.pointerType === 'pen' ? e.pressure * 2 : 1); g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(...last); g.lineTo(...p); g.stroke(); last = p; }
    w.body.addEventListener('click', e => {
      const s = e.target.closest('.swatch'); if (s) { color = s.dataset.c; erase = false; w.body.querySelectorAll('.swatch').forEach(x => x.classList.toggle('on', x === s)); $('[data-erase]', w.body).classList.remove('on'); }
      if (e.target.closest('[data-erase]')) { erase = !erase; e.target.closest('[data-erase]').classList.toggle('on', erase); }
      if (e.target.closest('[data-clear]')) { const r = wrap.getBoundingClientRect(); g.fillStyle = css('--paper', w.el) || '#fff'; g.fillRect(0, 0, r.width, r.height); }
      if (e.target.closest('[data-save]')) { const a = document.createElement('a'); a.download = 'phoenix-paint.png'; a.href = cv.toDataURL(); a.click(); }
    });
    w.paint = { stroke: (pts, c = colors[1], s = 10) => { g.strokeStyle = c; g.lineWidth = s; g.lineCap = g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } };
  }

  /* ---------- Beats: 16-step drum machine + synth ---------- */
  function Music(w) {
    const rows = ['kick', 'snare', 'hat', 'synth'];
    const pat = { kick: [0, 4, 8, 12, 14], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14, 15], synth: [0, 3, 6, 10, 11] };
    w.body.innerHTML = `<div class="toolbar"><button class="ui-btn primary" data-play>▶ Play</button><label style="display:flex;gap:8px;align-items:center;font-size:13px">Tempo <input type="range" min="70" max="160" value="112" data-bpm></label><span data-bpmv style="font:600 12px var(--font-mono)">112 BPM</span><span class="spacer"></span><button class="ui-btn" data-rand>Shuffle</button><button class="ui-btn" data-clr>Clear</button></div>
      <div class="seq"><div class="seq-grid">${rows.map(r => `<span class="seq-label">${r}</span>` + Array.from({ length: 16 }, (_, i) => `<button class="step${i % 4 === 0 ? ' q' : ''}${pat[r].includes(i) ? ' on' : ''}" data-r="${r}" data-i="${i}" aria-label="${r} step ${i + 1}"></button>`).join('')).join('')}</div><canvas class="viz"></canvas></div>`;
    const grid = $('.seq-grid', w.body), viz = $('.viz', w.body), playBtn = $('[data-play]', w.body), bpm = $('[data-bpm]', w.body);
    grid.addEventListener('click', e => { const s = e.target.closest('.step'); if (s) s.classList.toggle('on'); });
    $('[data-rand]', w.body).onclick = () => grid.querySelectorAll('.step').forEach(s => s.classList.toggle('on', Math.random() < (s.dataset.r === 'hat' ? .55 : s.dataset.r === 'kick' ? .3 : .2)));
    $('[data-clr]', w.body).onclick = () => grid.querySelectorAll('.step').forEach(s => s.classList.remove('on'));
    bpm.oninput = () => $('[data-bpmv]', w.body).textContent = bpm.value + ' BPM';
    let ac, an, master, playing = false, step = 0, next = 0, timer, raf;
    const scale = [0, 3, 5, 7, 10, 12, 15, 17];
    const init = () => {
      ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .7;
      an = ac.createAnalyser(); an.fftSize = 128; master.connect(an); an.connect(ac.destination);
    };
    const noise = () => { const b = ac.createBuffer(1, ac.sampleRate * .3, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(); s.buffer = b; return s; };
    const play = (r, t, i) => {
      const g = ac.createGain(); g.connect(master);
      if (r === 'kick') { const o = ac.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g); o.start(t); o.stop(t + .36); }
      if (r === 'snare') { const n = noise(), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(.7, t); g.gain.exponentialRampToValueAtTime(.001, t + .18); n.connect(f); f.connect(g); n.start(t); n.stop(t + .2); }
      if (r === 'hat') { const n = noise(), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.28, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); n.connect(f); f.connect(g); n.start(t); n.stop(t + .06); }
      if (r === 'synth') { const o = ac.createOscillator(), f = ac.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = 110 * Math.pow(2, scale[i % scale.length] / 12); f.type = 'lowpass'; f.frequency.setValueAtTime(2400, t); f.frequency.exponentialRampToValueAtTime(300, t + .25); g.gain.setValueAtTime(.22, t); g.gain.exponentialRampToValueAtTime(.001, t + .3); o.connect(f); f.connect(g); o.start(t); o.stop(t + .32); }
    };
    const sched = () => {
      while (next < ac.currentTime + .1) {
        const s = step, t = next;
        grid.querySelectorAll(`.step[data-i="${s}"].on`).forEach(b => play(b.dataset.r, t, s));
        setTimeout(() => { grid.querySelectorAll('.now').forEach(b => b.classList.remove('now')); grid.querySelectorAll(`.step[data-i="${s}"]`).forEach(b => b.classList.add('now')); }, Math.max(0, (t - ac.currentTime) * 1000));
        next += 60 / bpm.value / 4; step = (step + 1) % 16;
      }
    };
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const r = viz.getBoundingClientRect(), d = devicePixelRatio || 1; if (viz.width !== Math.round(r.width * d)) { viz.width = r.width * d; viz.height = r.height * d; }
      const g = viz.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, r.width, r.height);
      const data = new Uint8Array(an ? an.frequencyBinCount : 64); if (an) an.getByteFrequencyData(data);
      const n = 48, bw = r.width / n, col = css('--accent', w.el);
      for (let i = 0; i < n; i++) { const v = (data[i] || 0) / 255, bh = Math.max(3, v * r.height * .9); g.fillStyle = col; g.globalAlpha = .35 + v * .65; g.fillRect(i * bw + 2, r.height - bh, bw - 4, bh); }
      g.globalAlpha = 1;
    };
    draw();
    const toggle = () => {
      if (!ac) init(); ac.resume();
      playing = !playing; playBtn.textContent = playing ? '■ Stop' : '▶ Play'; playBtn.classList.toggle('on', playing);
      if (playing) { step = 0; next = ac.currentTime + .05; timer = setInterval(sched, 25); } else { clearInterval(timer); grid.querySelectorAll('.now').forEach(b => b.classList.remove('now')); }
    };
    playBtn.onclick = toggle;
    w.toggle = toggle;
    w.cleanup.push(() => { clearInterval(timer); cancelAnimationFrame(raf); ac && ac.close(); });
  }

  /* ---------- Snake ---------- */
  function Snake(w) {
    w.body.innerHTML = `<div class="toolbar"><b data-score>Score 0</b><span class="spacer"></span><span style="color:var(--text-dim);font-size:12px" data-best></span></div><div class="snake-wrap" tabindex="0" aria-label="Snake game"><canvas width="360" height="360"></canvas><div class="snake-msg"><b>Snake</b><span style="color:var(--text-dim)">Arrows / WASD / swipe</span><button class="ui-btn primary" data-go>Play</button></div></div>`;
    const cv = $('canvas', w.body), g = cv.getContext('2d'), wrap = $('.snake-wrap', w.body), msg = $('.snake-msg', w.body);
    const N = 18, C = 20; let sn, dir, nd, food, score, alive = false, iv;
    let best = +localStorage.getItem('pos-snake') || 0; $('[data-best]', w.body).textContent = 'Best ' + best;
    const place = () => { do food = [Math.random() * N | 0, Math.random() * N | 0]; while (sn.some(([x, y]) => x === food[0] && y === food[1])); };
    const start = () => { sn = [[8, 9], [7, 9], [6, 9]]; dir = nd = [1, 0]; score = 0; alive = true; place(); msg.style.display = 'none'; clearInterval(iv); iv = setInterval(tick, 110); wrap.focus(); draw(); };
    const draw = () => {
      const bg = css('--panel-2', w.el), acc = css('--accent', w.el), txt = css('--text', w.el);
      g.clearRect(0, 0, 360, 360); g.fillStyle = bg; g.fillRect(0, 0, 360, 360);
      g.fillStyle = txt; g.beginPath(); g.arc(food[0] * C + C / 2, food[1] * C + C / 2, C / 2.6, 0, 7); g.fill();
      sn.forEach(([x, y], i) => { g.fillStyle = acc; g.globalAlpha = 1 - i / (sn.length * 1.6); g.beginPath(); g.roundRect(x * C + 1.5, y * C + 1.5, C - 3, C - 3, 5); g.fill(); });
      g.globalAlpha = 1;
    };
    const tick = () => {
      dir = nd; const hd = [(sn[0][0] + dir[0] + N) % N, (sn[0][1] + dir[1] + N) % N];
      if (sn.some(([x, y]) => x === hd[0] && y === hd[1])) { alive = false; clearInterval(iv); if (score > best) { best = score; localStorage.setItem('pos-snake', best); $('[data-best]', w.body).textContent = 'Best ' + best; } msg.innerHTML = `<b>Game over · ${score}</b><button class="ui-btn primary" data-go>Again</button>`; msg.style.display = ''; return; }
      sn.unshift(hd); if (hd[0] === food[0] && hd[1] === food[1]) { score++; $('[data-score]', w.body).textContent = 'Score ' + score; place(); } else sn.pop();
      draw();
    };
    const turn = (x, y) => { if (alive && (x !== -dir[0] || y !== -dir[1])) nd = [x, y]; };
    wrap.addEventListener('keydown', e => { const k = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] }[e.key]; if (k) { e.preventDefault(); turn(...k); } });
    let tx, ty; wrap.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    wrap.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0); else turn(0, Math.sign(dy)); });
    w.body.addEventListener('click', e => { if (e.target.closest('[data-go]')) start(); });
    sn = [[8, 9], [7, 9], [6, 9]]; food = [13, 9]; requestAnimationFrame(draw);
    w.cleanup.push(() => clearInterval(iv));
  }

  /* ---------- Code: live HTML playground ---------- */
  function Code(w) {
    const starter = `<style>
  body{margin:0;height:100vh;display:grid;place-items:center;
    background:radial-gradient(circle at 30% 30%,#ff6a2c,#5b3dff);
    font:800 44px system-ui;color:#fff}
  span{display:inline-block;animation:hop .6s infinite alternate}
  span:nth-child(2){animation-delay:.1s}span:nth-child(3){animation-delay:.2s}
  @keyframes hop{to{transform:translateY(-18px)}}
</style>
<h1><span>Hello</span> <span>from</span> <span>Phoenix</span></h1>`;
    w.body.innerHTML = `<div class="code"><textarea spellcheck="false" aria-label="HTML source"></textarea><iframe sandbox="allow-scripts" title="Preview"></iframe></div>`;
    const ta = $('textarea', w.body), fr = $('iframe', w.body);
    ta.value = localStorage.getItem('pos-code') ?? starter;
    let t; const run = () => { fr.srcdoc = ta.value; localStorage.setItem('pos-code', ta.value); };
    ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 250); });
    ta.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } });
    run();
  }

  /* ---------- Settings ---------- */
  function Settings(w) {
    const accents = ['#ff6a2c', '#ff3d6e', '#8b5cf6', '#2f7bff', '#22c55e', '#ffc828'];
    w.body.innerHTML = `<div class="pane"><h2>Settings</h2>
      <div class="row"><span>Accent colour</span><div class="dots">${accents.map(c => `<button class="swatch" data-a="${c}" style="background:${c}" aria-label="Accent ${c}"></button>`).join('')}</div></div>
      <div class="row"><span>Skin</span><b>${SKIN}</b></div>
      <p>Skins are Page Variants. In Phoenix Code, use the <b>⑂</b> chip beside the file name in Live Preview to switch the whole OS between Phoenix, Hardware, Playful and Retro 95.</p>
      <div class="row"><span>Reset notes, code &amp; scores</span><button class="ui-btn" data-reset>Reset</button></div></div>`;
    w.body.addEventListener('click', e => {
      const a = e.target.closest('[data-a]'); if (a) document.documentElement.style.setProperty('--accent', a.dataset.a);
      if (e.target.closest('[data-reset]')) { Object.keys(localStorage).filter(k => k.startsWith('pos-')).forEach(k => localStorage.removeItem(k)); toast('Reset. Fresh start.'); }
    });
  }
  function About(w) {
    w.body.innerHTML = `<div class="pane about">${tile('about')}<h2>Phoenix OS</h2><p>Version 1.0 · ${SKIN} skin<br>One HTML file. One prompt.<br>Built live in Phoenix Code.</p><button class="ui-btn primary" data-t>Open Terminal</button></div>`;
    $('[data-t]', w.body).onclick = () => open('terminal');
  }

  /* ---------- Spotlight ---------- */
  const spot = $('#spot'), spotIn = $('#spotIn'), spotList = $('#spotList'); let sel = 0, results = [];
  const items = () => [...Object.entries(apps).map(([id, a]) => ({ label: a.title, icon: id === 'about' ? 'about' : id, run: () => open(id) })), ...Object.keys(VFS).map(f => ({ label: f, icon: 'notes', run: () => openFile(f) }))];
  const renderSpot = () => {
    const q = spotIn.value.toLowerCase(); results = items().filter(i => i.label.toLowerCase().includes(q)); sel = Math.min(sel, Math.max(0, results.length - 1));
    spotList.innerHTML = results.map((r, i) => `<button class="spot-item${i === sel ? ' on' : ''}" data-i="${i}">${tile(r.icon === 'about' ? 'about' : r.icon).replace('var(--t-about)', 'var(--t-about)')}<span>${r.label}</span></button>`).join('');
  };
  I.about = I.logo;
  const showSpot = v => { spot.hidden = !v; if (v) { spotIn.value = ''; sel = 0; renderSpot(); spotIn.focus(); } };
  $('#spotBtn').onclick = () => showSpot(true);
  spot.addEventListener('click', e => { const b = e.target.closest('.spot-item'); if (b) { results[b.dataset.i].run(); showSpot(false); } else if (e.target === spot) showSpot(false); });
  spotIn.addEventListener('input', () => { sel = 0; renderSpot(); });
  spotIn.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { sel = Math.min(results.length - 1, sel + 1); renderSpot(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); renderSpot(); e.preventDefault(); }
    if (e.key === 'Enter' && results[sel]) { results[sel].run(); showSpot(false); }
  });
  addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); showSpot(spot.hidden); }
    if (e.key === 'Escape') { showSpot(false); ctx.hidden = true; }
  });

  /* ---------- context menu + system menu ---------- */
  const ctx = $('#ctx');
  const menu = (x, y, list) => {
    ctx.innerHTML = list.map(([l, fn], i) => l === '-' ? '<hr>' : `<button data-i="${i}">${l}</button>`).join('');
    ctx.hidden = false; const r = ctx.getBoundingClientRect();
    ctx.style.left = Math.min(x, innerWidth - r.width - 8) + 'px'; ctx.style.top = Math.min(y, innerHeight - r.height - 8) + 'px';
    ctx.onclick = e => { const b = e.target.closest('[data-i]'); if (b) { list[b.dataset.i][1](); ctx.hidden = true; } };
  };
  desktop.addEventListener('contextmenu', e => { if (e.target.closest('.win')) return; e.preventDefault(); menu(e.clientX, e.clientY, [['New Note', () => open('notes', { key: 'note' + Date.now(), title: 'Untitled' })], ['Open Terminal', () => open('terminal')], ['-'], ['Search…', () => showSpot(true)], ['About Phoenix OS', () => open('about')]]); });
  addEventListener('pointerdown', e => { if (!e.target.closest('.ctx')) ctx.hidden = true; });
  const sysMenu = e => { const r = e.currentTarget.getBoundingClientRect(); menu(r.left, r.bottom + 6, [['About Phoenix OS', () => open('about')], ['Settings…', () => open('settings')], ['-'], ['Close all windows', () => [...wins.values()].forEach(close)], ['Restart', () => location.reload()]]); };
  $('#mbLogo').addEventListener('click', sysMenu);
  $('#startBtn').addEventListener('click', sysMenu);

  /* ---------- boot ---------- */
  setTimeout(() => { const b = $('#boot'); b.classList.add('done'); setTimeout(() => b.remove(), 600); open('terminal'); }, reduce ? 50 : 1250);

  /* public API, so Claude (or you) can drive the OS from the console */
  window.OS = { open, close: k => wins.has(k) && close(wins.get(k)), apps: Object.keys(apps), windows: () => [...wins.keys()], run: cmd => { const t = open('terminal'); t.run && t.run(cmd); }, toast };
})();
