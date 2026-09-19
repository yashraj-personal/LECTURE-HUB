const Auth = (() => {
  const isAdmin = () => sessionStorage.getItem('lectureHubAdmin') === 'true';
  const ADMIN_REDIRECT_URL = 'https://yashraj-personal.github.io/login/';

  const getAlertAudio = () => {
    let audio = document.getElementById('admin-alert-sound');
    if (!audio) { audio = document.createElement('audio'); audio.id = 'admin-alert-sound'; audio.src = 'assets/admin-alert.mp3'; audio.preload = 'auto'; document.body.appendChild(audio); }
    return audio;
  };
  // Plays the admin alert sound on an endless loop (used after a wrong admin password).
  const playAdminAlertLoop = () => {
    const audio = getAlertAudio();
    audio.loop = true;
    const tryPlay = () => audio.play().catch(() => {});
    tryPlay();
    document.addEventListener('pointerdown', tryPlay);
    document.addEventListener('keydown', tryPlay);
  };
  const stopAdminAlert = () => {
    const audio = document.getElementById('admin-alert-sound');
    if (audio) { audio.loop = false; audio.pause(); audio.currentTime = 0; }
  };

  // Sub-page shown before the admin password gate: "this page is for admin only, are you sure?"
  const confirmAdmin = () => new Promise(resolve => {
    const wrap = document.createElement('section');
    wrap.className = 'access-gate gate-admin gate-confirm';
    wrap.innerHTML = `<div class="gate-grid"></div><div class="gate-card"><span class="gate-glyph">⚠</span><span class="eyebrow">RESTRICTED · ADMIN ONLY</span><h1>Admin access only.</h1><p>This page is just for the admin. Are you sure you want to log in?<br><small>(You will be solely responsible for your own actions — no one else can be blamed for what happens next.)</small></p><div class="confirm-actions"><button type="button" class="button primary" id="confirm-yes">YES, CONTINUE <b>↗</b></button><button type="button" class="button outline" id="confirm-no">NO, TAKE ME BACK</button></div></div>`;
    document.body.prepend(wrap);
    wrap.querySelector('#confirm-yes').onclick = () => {
      wrap.classList.add('leaving');
      setTimeout(() => { wrap.remove(); resolve(true); }, 620);
    };
    wrap.querySelector('#confirm-no').onclick = () => { window.location.href = 'index.html'; };
  });

  const gate = async (admin = false) => {
    if ((!admin && sessionStorage.getItem('lectureHubAccess') === 'true') || (admin && isAdmin())) return true;
    return new Promise(resolve => {
      const gate = document.createElement('section'); gate.className = admin ? 'access-gate gate-admin' : 'access-gate';
      gate.innerHTML = admin
        ? `<div class="gate-grid"></div><form class="gate-card"><span class="gate-glyph">⌘</span><span class="eyebrow">RESTRICTED · ADMIN ONLY</span><h1>Control the archive.</h1><p>Sign in using the administrator credentials provided by the portal.</p><label>Admin password <span><input autocomplete="current-password" type="password" required placeholder="••••••••"><button type="button" class="show-password" aria-label="Show password">◉</button></span></label><button class="button primary" type="submit">AUTHENTICATE <b>↗</b></button><small class="gate-status">Every attempt is verified and recorded.</small><a class="button gate-redirect" href="${ADMIN_REDIRECT_URL}">SECRET SETTINGS <b>↗</b></a></form>`
        : `<div class="gate-orb orb-a"></div><div class="gate-orb orb-b"></div><form class="gate-card"><span class="eyebrow">PRIVATE LECTURE PORTAL</span><h1>Authorized access only.</h1><p>Everything you need to learn, beautifully organized.</p><label>Password <span><input autocomplete="current-password" type="password" required placeholder="Enter your password"><button type="button" class="show-password" aria-label="Show password">◉</button></span></label><button class="button primary" type="submit">ENTER PORTAL <b>↗</b></button><small class="gate-status">Secure connection required</small></form>`;
      document.body.prepend(gate);
      const input = gate.querySelector('input'), status = gate.querySelector('.gate-status');
      gate.querySelector('.show-password').onclick = () => input.type = input.type === 'password' ? 'text' : 'password';
      gate.querySelector('form').onsubmit = async e => {
        e.preventDefault();
        status.textContent = 'VERIFYING ACCESS…';
        try {
          const r = await API.login(input.value, admin);
          const ok = r?.success === true || r?.authenticated === true || r?.status === 'success' || r?.valid === true;
          if (!ok) throw Error();
          if (admin) stopAdminAlert();
          sessionStorage.setItem(admin ? 'lectureHubAdmin' : 'lectureHubAccess', 'true');
          status.textContent = '✓ ACCESS GRANTED';
          API.log(admin ? 'ADMIN_LOGIN_SUCCESS' : 'LOGIN_SUCCESS');
          gate.classList.add('leaving');
          setTimeout(() => { gate.remove(); resolve(true); }, 620);
        } catch {
          status.textContent = 'ACCESS DENIED';
          input.value = '';
          API.log(admin ? 'ADMIN_LOGIN_FAILED' : 'LOGIN_FAILED');
          if (admin) playAdminAlertLoop();
        }
      };
    });
  };
  return { gate, isAdmin, confirmAdmin };
})();
