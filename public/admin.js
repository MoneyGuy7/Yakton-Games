// Admin panel. Login and downtime are enforced by the worker (ADMIN_PASSWORD).
// Coins and unlocks edit this browser's saved game data (localStorage), so they only affect the browser you are using.
(function () {
  const app = document.getElementById('app');
  const el = (t, a = {}, x = '') => { const e = document.createElement(t); for (const k in a) e.setAttribute(k, a[k]); if (x !== '') e.textContent = x; return e };
  const post = (path, body) => fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
    .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'Request failed'); return j });
  const get = path => fetch(path, { cache: 'no-store' }).then(r => r.json());

  /* ---------------- saved-data helpers ---------------- */
  const ls = {
    num: k => { try { return +localStorage.getItem(k) || 0 } catch (e) { return 0 } },
    setNum: (k, v) => { try { localStorage.setItem(k, String(v)) } catch (e) { } },
    json: (k, d) => { try { return Object.assign(d, JSON.parse(localStorage.getItem(k))) } catch (e) { return d } },
    put: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } },
    del: k => { try { localStorage.removeItem(k) } catch (e) { } }
  };
  const LIMIT = 1e12;
  const clamp = v => Math.max(0, Math.min(LIMIT, Math.floor(+v) || 0));
  const CUR = [
    { id: 'drift', name: 'Drift King gems', get: () => ls.num('drift-coins'), set: v => ls.setNum('drift-coins', v) },
    { id: 'jungle', name: 'Jungle Dash gems', get: () => ls.num('jungle-gems'), set: v => ls.setNum('jungle-gems', v) },
    { id: 'lane', name: 'Subway Rush coins', get: () => ls.num('lane-coins'), set: v => ls.setNum('lane-coins', v) },
    { id: 'hop', name: 'Road Hop coins', get: () => ls.num('rh-coins'), set: v => ls.setNum('rh-coins', v) },
    { id: 'void', name: 'Void Run orbs', get: () => ls.num('void-orbs'), set: v => ls.setNum('void-orbs', v) },
    { id: 'rush', name: 'Pizza Rush cash', get: () => ls.num('rush-bank'), set: v => ls.setNum('rush-bank', v) },
    {
      id: 'pizza', name: 'Pizza Clicker pizzas', get: () => Math.floor(ls.json('pc', { n: 0 }).n || 0),
      set: v => { const s = ls.json('pc', { n: 0, c: 1, own: [0, 0, 0, 0, 0, 0] }); s.n = v; ls.put('pc', s) }
    }
  ];
  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const UNLOCKS = [
    {
      name: 'Drift King', desc: 'All 4 cars and every Garage upgrade maxed',
      max() {
        const g = ls.json('drift-garage', { up: {}, owned: ['red'], car: 'red' });
        g.up = { grip: 5, mag: 5, shield: 3, pay: 3 }; g.owned = ['red', 'teal', 'gold', 'violet']; ls.put('drift-garage', g)
      },
      reset() { ls.del('drift-garage') }
    },
    {
      name: 'Pizza Rush', desc: 'Every Garage upgrade maxed',
      max() { ls.put('rush-up', { eng: 5, tire: 5, nit: 5, bag: 2, bump: 4, clock: 5 }) },
      reset() { ls.del('rush-up') }
    },
    {
      name: 'Cube Dash', desc: 'All 3 levels beaten with all coins (unlocks every cube color)',
      max() {
        const sv = ls.json('dash-save', { best: {}, done: {}, coins: {}, att: {}, skin: 0 });
        ['neon', 'grav', 'void'].forEach(id => { sv.done[id] = 1; sv.best[id] = 100; sv.coins[id] = [1, 1, 1] });
        ls.put('dash-save', sv)
      },
      reset() { ls.del('dash-save') }
    },
    {
      name: 'Pixel Hopper', desc: 'All 6 levels unlocked',
      max() { const sv = ls.json('hop-save', { done: {}, coins: {} }); range(6, i => { sv.done[i] = 1 }); ls.put('hop-save', sv) },
      reset() { ls.del('hop-save') }
    },
    {
      name: 'Candy Snip', desc: 'All 6 levels unlocked with 3 stars',
      max() { const sv = ls.json('candy-save', { stars: {} }); range(6, i => { sv.stars[i] = 3 }); ls.put('candy-save', sv) },
      reset() { ls.del('candy-save') }
    }
  ];
  const ALL_KEYS = ['drift-coins', 'drift-garage', 'jungle-gems', 'lane-coins', 'rh-coins', 'void-orbs', 'rush-bank', 'rush-up', 'pc', 'dash-save', 'hop-save', 'candy-save'];

  /* ---------------- screens ---------------- */
  function toast(msg) {
    const t = el('div', { class: 'toast', role: 'status' }, msg); document.body.append(t);
    setTimeout(() => t.remove(), 2200)
  }

  function loginScreen(configured) {
    app.innerHTML = '';
    const box = el('form', { class: 'abox', autocomplete: 'off' });
    box.append(el('h2', {}, 'Admin login'));
    if (!configured) box.append(el('p', { class: 'err' }, 'ADMIN_PASSWORD is not set on the worker yet. Add it in Cloudflare (Settings > Variables and Secrets), then reload.'));
    const pw = el('input', { type: 'password', placeholder: 'Password', 'aria-label': 'Password', autocomplete: 'current-password', required: '' });
    const go = el('button', { type: 'submit', class: 'abtn' }, 'Log in');
    const err = el('p', { class: 'err', 'aria-live': 'polite' });
    box.append(pw, go, err);
    box.onsubmit = async e => {
      e.preventDefault(); go.disabled = true; err.textContent = '';
      try { await post('/api/admin/login', { password: pw.value }); panelScreen() }
      catch (x) { err.textContent = x.message; pw.value = ''; pw.focus() }
      go.disabled = false
    };
    app.append(box); pw.focus()
  }

  async function panelScreen() {
    app.innerHTML = '';
    const top = el('div', { class: 'arow' });
    const out = el('button', { type: 'button', class: 'ghost' }, 'Log out');
    out.onclick = async () => { await post('/api/admin/logout').catch(() => { }); init() };
    top.append(el('span', { class: 'sm' }, 'Logged in'), out);
    app.append(top);

    /* downtime */
    const dsec = el('section', { class: 'asec' });
    dsec.append(el('h2', {}, 'Site status'));
    const badge = el('p', { class: 'badge' });
    const msg = el('input', { type: 'text', maxlength: '200', placeholder: 'Message shown on the downtime screen (optional)', 'aria-label': 'Downtime message' });
    const tg = el('button', { type: 'button', class: 'abtn' });
    const note = el('p', { class: 'sm' }, 'While the site is down, visitors see the downtime screen. You can still see the whole site while logged in.');
    dsec.append(badge, msg, tg, note); app.append(dsec);
    let down = false;
    const paint = s => { down = s.down; badge.textContent = down ? '● Site is DOWN' : '● Site is LIVE'; badge.className = 'badge ' + (down ? 'bad' : 'ok'); tg.textContent = down ? 'Bring site back up' : 'Put site in downtime'; if (s.message != null && document.activeElement !== msg) msg.value = s.message || '' };
    paint(await get('/api/status'));
    tg.onclick = async () => {
      if (!down && !confirm('Put the whole site into downtime?')) return;
      tg.disabled = true;
      try { const r = await post('/api/admin/downtime', { down: !down, message: msg.value }); paint(r); toast(r.down ? 'Site is now down' : 'Site is live') }
      catch (x) { toast(x.message); if (/logged/i.test(x.message)) init() }
      tg.disabled = false
    };

    /* currencies */
    const csec = el('section', { class: 'asec' });
    csec.append(el('h2', {}, 'Coins and currency'), el('p', { class: 'sm' }, 'These edit the saved data in this browser. Close the game tab first, or the game may overwrite the change.'));
    const amt = el('input', { type: 'number', min: '0', step: '1', value: '1000', 'aria-label': 'Amount' });
    const arow = el('div', { class: 'arow' }, ''); arow.append(el('label', { for: 'amt' }, 'Amount'), amt); amt.id = 'amt';
    csec.append(arow);
    const cells = [];
    const refresh = () => cells.forEach(c => { c.textContent = c.f().toLocaleString() });
    const list = el('div', { class: 'clist' });
    CUR.forEach(c => {
      const row = el('div', { class: 'crow' });
      const val = el('b', {}); val.f = c.get; cells.push(val);
      const add = el('button', { type: 'button', class: 'ghost' }, 'Add');
      const set = el('button', { type: 'button', class: 'ghost' }, 'Set');
      const zero = el('button', { type: 'button', class: 'ghost' }, 'Zero');
      add.onclick = () => { c.set(clamp(c.get() + clamp(amt.value))); refresh(); toast(c.name + ' updated') };
      set.onclick = () => { c.set(clamp(amt.value)); refresh(); toast(c.name + ' updated') };
      zero.onclick = () => { c.set(0); refresh() };
      row.append(el('span', {}, c.name), val, add, set, zero); list.append(row)
    });
    const addAll = el('button', { type: 'button', class: 'abtn' }, 'Add amount to everything');
    addAll.onclick = () => { CUR.forEach(c => c.set(clamp(c.get() + clamp(amt.value)))); refresh(); toast('Added to every game') };
    csec.append(list, addAll); app.append(csec); refresh();

    /* unlocks */
    const usec = el('section', { class: 'asec' });
    usec.append(el('h2', {}, 'Unlocks and upgrades'));
    UNLOCKS.forEach(u => {
      const row = el('div', { class: 'urow' });
      const t = el('div', {}); t.append(el('b', {}, u.name), el('span', { class: 'sm' }, u.desc));
      const mx = el('button', { type: 'button', class: 'ghost' }, 'Unlock / max');
      const rs = el('button', { type: 'button', class: 'ghost warn' }, 'Reset');
      mx.onclick = () => { u.max(); toast(u.name + ' unlocked') };
      rs.onclick = () => { if (confirm('Reset ' + u.name + ' progress in this browser?')) { u.reset(); toast(u.name + ' reset') } };
      row.append(t, mx, rs); usec.append(row)
    });
    const all = el('div', { class: 'arow' });
    const maxAll = el('button', { type: 'button', class: 'abtn' }, 'Unlock everything');
    maxAll.onclick = () => { UNLOCKS.forEach(u => u.max()); toast('Everything unlocked') };
    const clr = el('button', { type: 'button', class: 'ghost warn' }, 'Clear high scores');
    clr.onclick = () => { if (!confirm('Clear all saved high scores in this browser?')) return; try { Object.keys(localStorage).filter(k => k.startsWith('best-')).forEach(k => localStorage.removeItem(k)) } catch (e) { } toast('High scores cleared') };
    const wipe = el('button', { type: 'button', class: 'ghost warn' }, 'Reset all game data');
    wipe.onclick = () => { if (!confirm('Delete ALL coins, upgrades and progress in this browser?')) return; ALL_KEYS.forEach(ls.del); refresh(); toast('All game data reset') };
    all.append(maxAll, clr, wipe); usec.append(all); app.append(usec)
  }

  async function init() {
    try { const me = await get('/api/admin/me'); me.admin ? panelScreen() : loginScreen(me.configured) }
    catch (e) { app.innerHTML = ''; app.append(el('p', { class: 'err' }, 'Could not reach the server.')) }
  }
  init();
  // Coming back to this page with the back button must not show an empty screen.
  addEventListener('pageshow', e => {
    let nav = ''; try { nav = performance.getEntriesByType('navigation')[0].type } catch (x) { }
    if (e.persisted || nav === 'back_forward') location.reload();
    else setTimeout(() => { if (!app.children.length) init() }, 300)
  });
})();
