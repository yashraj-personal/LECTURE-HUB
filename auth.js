const Auth = (() => {
  const isAdmin = () => sessionStorage.getItem('lectureHubAdmin') === 'true';
  const playAdminAlert = () => {
    let audio = document.getElementById('admin-alert-sound');
    if (!audio) { audio = document.createElement('audio'); audio.id = 'admin-alert-sound'; audio.src = 'assets/admin-alert.mp3'; audio.preload = 'auto'; document.body.appendChild(audio); }
    const tryPlay = () => audio.play().catch(() => {});
    tryPlay();
    document.addEventListener('pointerdown', tryPlay, { once: true });
    document.addEventListener('keydown', tryPlay, { once: true });
  };
  const gate = async (admin = false) => {
    if ((!admin && sessionStorage.getItem('lectureHubAccess') === 'true') || (admin && isAdmin())) return true;
    if (admin) playAdminAlert();
    return new Promise(resolve => {
      const gate = document.createElement('section'); gate.className = admin ? 'access-gate gate-admin' : 'access-gate';
      gate.innerHTML = admin
        ? `<div class="gate-grid"></div><form class="gate-card"><span class="gate-glyph">⌘</span><span class="eyebrow">RESTRICTED · ADMIN ONLY</span><h1>Control the archive.</h1><p>Sign in using the administrator credentials provided by the portal.</p><label>Admin password <span><input autocomplete="current-password" type="password" required placeholder="••••••••"><button type="button" class="show-password" aria-label="Show password">◉</button></span></label><button class="button primary" type="submit">AUTHENTICATE <b>↗</b></button><small class="gate-status">Every attempt is logged</small></form>`
        : `<div class="gate-orb orb-a"></div><div class="gate-orb orb-b"></div><form class="gate-card"><span class="eyebrow">PRIVATE LECTURE PORTAL</span><h1>Authorized access only.</h1><p>Everything you need to learn, beautifully organized.</p><label>Password <span><input autocomplete="current-password" type="password" required placeholder="Enter your password"><button type="button" class="show-password" aria-label="Show password">◉</button></span></label><button class="button primary" type="submit">ENTER PORTAL <b>↗</b></button><small class="gate-status">Secure connection required</small></form>`;
      document.body.prepend(gate);
      const input = gate.querySelector('input'), status = gate.querySelector('.gate-status');
      gate.querySelector('.show-password').onclick = () => input.type = input.type === 'password' ? 'text' : 'password';
      gate.querySelector('form').onsubmit = async e => { e.preventDefault(); status.textContent = 'VERIFYING ACCESS…'; try { const r = await API.login(input.value, admin); const ok = r?.success === true || r?.authenticated === true || r?.status === 'success' || r?.valid === true; if (!ok) throw Error(); sessionStorage.setItem(admin ? 'lectureHubAdmin' : 'lectureHubAccess', 'true'); status.textContent = '✓ ACCESS GRANTED'; API.log(admin ? 'ADMIN_LOGIN_SUCCESS' : 'LOGIN_SUCCESS'); gate.classList.add('leaving'); setTimeout(() => { gate.remove(); resolve(true); }, 620); } catch { status.textContent = 'ACCESS DENIED'; input.value = ''; API.log(admin ? 'ADMIN_LOGIN_FAILED' : 'LOGIN_FAILED'); } };
    });
  };
  return { gate, isAdmin };
})();
