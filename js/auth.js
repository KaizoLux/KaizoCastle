// ============================================================
// KAIZO CASTLE — auth.js
// ============================================================

// ─── Register ──────────────────────────────────────────────
async function register(email, password, username) {
  await _waitClient();
  if (!username || username.trim().length < 3)
    throw new Error('Username minimal 3 karakter.');
  if (password.length < 6)
    throw new Error('Password minimal 6 karakter.');

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { username: username.trim() } }
  });
  if (error) throw error;
  if (!data.user) throw new Error('Registrasi gagal. Coba lagi.');

  // Buat profil user (trigger Supabase juga akan buat ini)
  await supabase.from('users').upsert({
    id: data.user.id,
    username: username.trim(),
    email: email.trim(),
    xp: 0, level: 1, coins: 0, role: 'user'
  }, { onConflict: 'id', ignoreDuplicates: true });

  return { user: data.user, session: data.session, needsConfirmation: !data.session };
}

// ─── Login ─────────────────────────────────────────────────
async function login(email, password) {
  await _waitClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(), password
  });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes('email not confirmed') || m.includes('email_not_confirmed'))
      throw new Error('Email belum dikonfirmasi. Cek inbox/spam, atau matikan konfirmasi di Supabase → Authentication → Providers → Email.');
    if (m.includes('invalid login credentials'))
      throw new Error('Email atau password salah.');
    throw error;
  }

  if (!data.session)
    throw new Error('Login gagal. Pastikan email sudah dikonfirmasi.');

  // Buat profil kalau belum ada (fallback)
  const { data: exists } = await supabase
    .from('users').select('id').eq('id', data.session.user.id).single();
  if (!exists) {
    const uname = data.session.user.user_metadata?.username || email.split('@')[0];
    await supabase.from('users').upsert({
      id: data.session.user.id, username: uname,
      email: email.trim(), xp: 0, level: 1, coins: 0, role: 'user'
    }, { onConflict: 'id', ignoreDuplicates: true });
  }
  return data;
}

// ─── Logout ────────────────────────────────────────────────
async function logout() {
  if (supabase) await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ─── Navbar Auth UI ────────────────────────────────────────
async function initAuthUI() {
  const profileBtn = document.getElementById('profileBtn');
  const devIcon    = document.getElementById('devIcon');
  if (!profileBtn) return;

  // Default state dulu
  profileBtn.innerHTML  = '👤';
  profileBtn.style.cursor = 'pointer';
  profileBtn.onclick    = () => openAuthModal('login');
  if (devIcon) devIcon.style.display = 'none';

  try {
    const user = await getCurrentUser();
    if (!user) return;

    profileBtn.innerHTML = `
      <div class="user-avatar-wrap">
        <div class="user-avatar">${(user.username||'U').charAt(0).toUpperCase()}</div>
        <span class="user-xp-badge">${user.xp||0} XP</span>
      </div>`;
    profileBtn.onclick = (e) => { e.stopPropagation(); openUserMenu(user); };

    if (user.role === 'developer' && devIcon) {
      devIcon.style.display = 'flex';
      devIcon.onclick = () => window.location.href = 'devpanel.html';
    }
  } catch (e) {
    console.warn('initAuthUI:', e.message);
  }
}

// ─── Modal helpers ─────────────────────────────────────────
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('active');
  switchAuthTab(tab);
  const le = document.getElementById('loginError');
  const re = document.getElementById('registerError');
  if (le) { le.textContent = ''; le.style.color = '#ff2d55'; }
  if (re) { re.textContent = ''; re.style.color = '#ff2d55'; }
}

function closeAuthModal() {
  document.getElementById('authModal')?.classList.remove('active');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab')
    .forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-form')
    .forEach(f => f.classList.toggle('active', f.dataset.form === tab));
}

// ─── Login form handler ────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault(); e.stopPropagation();
  const email    = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;
  const btn      = document.getElementById('loginBtn');
  const errEl    = document.getElementById('loginError');
  if (!email || !password) {
    if (errEl) errEl.textContent = 'Email dan password wajib diisi.';
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'Loading...'; }
  if (errEl) errEl.textContent = '';
  try {
    await login(email, password);
    closeAuthModal();
    window.location.reload();
  } catch (err) {
    if (errEl) { errEl.style.color = '#ff2d55'; errEl.textContent = err.message; }
    if (btn)   { btn.disabled = false; btn.textContent = 'Login'; }
  }
}

// ─── Register form handler ─────────────────────────────────
async function handleRegister(e) {
  e.preventDefault(); e.stopPropagation();
  const username = document.getElementById('regUsername')?.value.trim();
  const email    = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value;
  const btn      = document.getElementById('registerBtn');
  const errEl    = document.getElementById('registerError');
  if (!username || !email || !password) {
    if (errEl) errEl.textContent = 'Semua field wajib diisi.';
    return;
  }
  if (btn) { btn.disabled = true; btn.textContent = 'Mendaftar...'; }
  if (errEl) errEl.textContent = '';
  try {
    const result = await register(email, password, username);
    if (result.needsConfirmation) {
      if (errEl) { errEl.style.color = '#00d4ff'; errEl.textContent = '✅ Akun dibuat! Cek email untuk konfirmasi lalu login.'; }
      if (btn)   { btn.textContent = 'Cek Email'; btn.disabled = false; }
      document.getElementById('regUsername').value = '';
      document.getElementById('regEmail').value    = '';
      document.getElementById('regPassword').value = '';
    } else {
      if (errEl) { errEl.style.color = '#00ff88'; errEl.textContent = '✅ Berhasil! Selamat datang, ' + username + '!'; }
      if (btn)   btn.textContent = 'Berhasil!';
      setTimeout(() => { closeAuthModal(); window.location.reload(); }, 900);
    }
  } catch (err) {
    if (errEl) { errEl.style.color = '#ff2d55'; errEl.textContent = err.message; }
    if (btn)   { btn.disabled = false; btn.textContent = 'Daftar'; }
  }
}

// ─── User dropdown menu ────────────────────────────────────
function openUserMenu(user) {
  const existing = document.getElementById('userMenu');
  if (existing) { existing.remove(); return; }
  const menu = document.createElement('div');
  menu.id = 'userMenu'; menu.className = 'user-menu';
  menu.innerHTML = `
    <div class="user-menu-header">
      <div class="um-avatar">${(user.username||'U').charAt(0).toUpperCase()}</div>
      <div>
        <div class="um-name">${user.username}</div>
        <div class="um-level">Level ${user.level||1} · ${user.xp||0} XP</div>
      </div>
    </div>
    <div class="user-menu-item" onclick="window.location.href='leaderboard.html'">🏆 Leaderboard</div>
    <div class="user-menu-item" onclick="logout()">🚪 Logout</div>`;
  const btn = document.getElementById('profileBtn');
  btn.style.position = 'relative';
  btn.appendChild(menu);
  setTimeout(() => {
    document.addEventListener('click', function h(e) {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove();
        document.removeEventListener('click', h);
      }
    });
  }, 50);
}

// ─── Attach form listeners + init UI ──────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const lf = document.getElementById('loginForm');
  const rf = document.getElementById('registerForm');
  if (lf) lf.onsubmit = handleLogin;
  if (rf) rf.onsubmit = handleRegister;
  document.getElementById('authModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeAuthModal();
  });
  // Init UI setelah supabase siap
  _waitClient()
    .then(() => initAuthUI())
    .catch(err => console.warn('Supabase not ready:', err.message));
});
