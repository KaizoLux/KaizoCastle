// ============================================================
// KAIZO CASTLE - AUTH MODULE (FULLY FIXED v3)
// ============================================================

// ─── Cek konfigurasi Supabase ──────────────────────────────
function isSupabaseConfigured() {
  return SUPABASE_URL !== 'https://YOUR_PROJECT.supabase.co' &&
         SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY_HERE';
}

// ─── Register ──────────────────────────────────────────────
async function register(email, password, username) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di js/supabase.js');
  }
  if (!username || username.trim().length < 3) throw new Error('Username minimal 3 karakter.');
  if (password.length < 6) throw new Error('Password minimal 6 karakter.');

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { username: username.trim() } }
  });

  if (error) throw error;
  if (!data.user) throw new Error('Registrasi gagal. Coba lagi.');

  // Upsert profil — trigger Supabase juga akan buat profil,
  // upsert mencegah duplicate conflict
  await supabase.from('users').upsert({
    id: data.user.id,
    username: username.trim(),
    email: email.trim(),
    xp: 0, level: 1, coins: 0, role: 'user'
  }, { onConflict: 'id', ignoreDuplicates: true });

  return {
    user: data.user,
    session: data.session,
    needsConfirmation: !data.session  // true = email konfirmasi ON
  };
}

// ─── Login ─────────────────────────────────────────────────
async function login(email, password) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase belum dikonfigurasi. Isi SUPABASE_URL dan SUPABASE_ANON_KEY di js/supabase.js');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(), password
  });

  if (error) {
    if (error.message.toLowerCase().includes('email not confirmed') ||
        error.message.toLowerCase().includes('email_not_confirmed')) {
      throw new Error('❌ Email belum dikonfirmasi. Cek inbox/spam.\n\nTip: Atau matikan konfirmasi email di Supabase → Authentication → Providers → Email → disable "Confirm email".');
    }
    if (error.message.toLowerCase().includes('invalid login credentials')) {
      throw new Error('Email atau password salah.');
    }
    throw error;
  }

  // Validasi session benar-benar ada
  if (!data.session) {
    throw new Error('Login gagal — session tidak terbuat. Pastikan email sudah dikonfirmasi.');
  }

  // Pastikan profil ada di tabel users, buat jika belum ada
  const { data: existingUser } = await supabase
    .from('users').select('id').eq('id', data.session.user.id).single();

  if (!existingUser) {
    const username = data.session.user.user_metadata?.username || email.split('@')[0];
    await supabase.from('users').upsert({
      id: data.session.user.id,
      username,
      email: email.trim(),
      xp: 0, level: 1, coins: 0, role: 'user'
    }, { onConflict: 'id', ignoreDuplicates: true });
  }

  return data;
}

// ─── Logout ────────────────────────────────────────────────
async function logout() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

// ─── Navbar Auth State ─────────────────────────────────────
async function initAuthUI() {
  const profileBtn = document.getElementById('profileBtn');
  const devIcon = document.getElementById('devIcon');
  if (!profileBtn) return;

  profileBtn.innerHTML = `👤`;
  profileBtn.style.cursor = 'pointer';
  profileBtn.onclick = () => openAuthModal('login');
  if (devIcon) devIcon.style.display = 'none';

  if (!isSupabaseConfigured()) return;

  try {
    const user = await getCurrentUser();
    if (user) {
      const initial = (user.username || 'U').charAt(0).toUpperCase();
      profileBtn.innerHTML = `
        <div class="user-avatar-wrap">
          <div class="user-avatar">${initial}</div>
          <span class="user-xp-badge">${user.xp || 0} XP</span>
        </div>`;
      profileBtn.onclick = (e) => { e.stopPropagation(); openUserMenu(user); };

      if (user.role === 'developer' && devIcon) {
        devIcon.style.display = 'flex';
        devIcon.onclick = () => window.location.href = 'devpanel.html';
      }
    }
  } catch (err) {
    console.warn('Auth init:', err.message);
  }
}

// ─── Modal ─────────────────────────────────────────────────
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('active');
  switchAuthTab(tab);
  // Reset error messages
  const le = document.getElementById('loginError');
  const re = document.getElementById('registerError');
  if (le) le.textContent = '';
  if (re) re.textContent = '';
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
  document.querySelector(`.auth-form[data-form="${tab}"]`)?.classList.add('active');
}

// ─── Login Submit ───────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  e.stopPropagation();

  const emailEl = document.getElementById('loginEmail');
  const passEl  = document.getElementById('loginPassword');
  const btn     = document.getElementById('loginBtn');
  const errEl   = document.getElementById('loginError');
  if (!emailEl || !passEl || !btn || !errEl) return;

  const email    = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) {
    errEl.style.color = '#ff2d55';
    errEl.textContent = 'Email dan password wajib diisi.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Loading...';
  errEl.textContent = '';

  try {
    await login(email, password);
    closeAuthModal();
    window.location.reload();
  } catch (err) {
    errEl.style.color = '#ff2d55';
    errEl.style.whiteSpace = 'pre-line';
    errEl.textContent = err.message || 'Login gagal.';
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

// ─── Register Submit ────────────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  e.stopPropagation();

  const usernameEl = document.getElementById('regUsername');
  const emailEl    = document.getElementById('regEmail');
  const passEl     = document.getElementById('regPassword');
  const btn        = document.getElementById('registerBtn');
  const errEl      = document.getElementById('registerError');
  if (!usernameEl || !emailEl || !passEl || !btn || !errEl) return;

  const username = usernameEl.value.trim();
  const email    = emailEl.value.trim();
  const password = passEl.value;

  if (!username || !email || !password) {
    errEl.style.color = '#ff2d55';
    errEl.textContent = 'Semua field wajib diisi.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Mendaftar...';
  errEl.textContent = '';

  try {
    const result = await register(email, password, username);

    if (result.needsConfirmation) {
      // Email konfirmasi ON — suruh user cek email dulu
      errEl.style.color = '#00d4ff';
      errEl.textContent = '✅ Akun dibuat! Cek email kamu untuk konfirmasi, lalu login di sini.';
      btn.textContent = 'Cek Email';
      btn.disabled = false;
      usernameEl.value = '';
      emailEl.value = '';
      passEl.value = '';
    } else {
      // Email konfirmasi OFF — langsung aktif, reload
      errEl.style.color = '#00ff88';
      errEl.textContent = '✅ Berhasil! Selamat datang, ' + username + '!';
      btn.textContent = 'Berhasil!';
      setTimeout(() => { closeAuthModal(); window.location.reload(); }, 900);
    }
  } catch (err) {
    errEl.style.color = '#ff2d55';
    errEl.textContent = err.message || 'Registrasi gagal.';
    btn.disabled = false;
    btn.textContent = 'Daftar';
  }
}

// ─── User Menu Dropdown ─────────────────────────────────────
function openUserMenu(user) {
  const existing = document.getElementById('userMenu');
  if (existing) { existing.remove(); return; }

  const menu = document.createElement('div');
  menu.id = 'userMenu';
  menu.className = 'user-menu';
  menu.innerHTML = `
    <div class="user-menu-header">
      <div class="um-avatar">${(user.username || 'U').charAt(0).toUpperCase()}</div>
      <div>
        <div class="um-name">${user.username}</div>
        <div class="um-level">Level ${user.level || 1} · ${user.xp || 0} XP</div>
      </div>
    </div>
    <div class="user-menu-item" onclick="window.location.href='leaderboard.html'">🏆 Leaderboard</div>
    <div class="user-menu-item" onclick="logout()">🚪 Logout</div>
  `;

  const profileBtn = document.getElementById('profileBtn');
  profileBtn.style.position = 'relative';
  profileBtn.appendChild(menu);

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!menu.contains(e.target) && e.target !== profileBtn) {
        menu.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 50);
}

// ─── Init semua listeners ───────────────────────────────────
function initAuthListeners() {
  const loginForm    = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.onsubmit = handleLogin; // pakai onsubmit, tidak bisa double attach
  }
  if (registerForm) {
    registerForm.onsubmit = handleRegister;
  }

  // Backdrop klik
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.addEventListener('click', function(e) {
      if (e.target === this) closeAuthModal();
    });
  }
}

// ─── Run saat DOM ready ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuthListeners();
  initAuthUI();
});
