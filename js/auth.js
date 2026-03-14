// ============================================================
// KAIZO CASTLE - AUTH MODULE (FIXED)
// ============================================================

// ─── Register ──────────────────────────────────────────────
async function register(email, password, username) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
  if (error) throw error;
  if (!data.user) throw new Error('Registration failed. Please try again.');

  // Try to insert user profile.
  // If email confirmation is ON in Supabase, session won't exist yet,
  // so we store pending profile in localStorage and insert on first login.
  const profile = { id: data.user.id, username, email, xp: 0, level: 1, coins: 0, role: 'user' };

  if (data.session) {
    // Email confirmation OFF → session available immediately
    const { error: dbError } = await supabase.from('users').insert(profile);
    if (dbError && dbError.code !== '23505') throw dbError; // ignore duplicate
  } else {
    // Email confirmation ON → save pending, insert after login
    localStorage.setItem('kc_pending_profile', JSON.stringify(profile));
  }

  return data;
}

// ─── Login ─────────────────────────────────────────────────
async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // If there's a pending profile from registration, insert it now
  const pending = localStorage.getItem('kc_pending_profile');
  if (pending && data.session) {
    try {
      const profile = JSON.parse(pending);
      // Make sure it matches the logged in user
      if (profile.email === email) {
        const { error: dbError } = await supabase.from('users').insert(profile);
        if (!dbError || dbError.code === '23505') {
          // Success or already exists — either way remove pending
          localStorage.removeItem('kc_pending_profile');
        }
      }
    } catch (e) {
      localStorage.removeItem('kc_pending_profile');
    }
  }

  return data;
}

// ─── Logout ────────────────────────────────────────────────
async function logout() {
  await supabase.auth.signOut();
  window.location.reload();
}

// ─── Update Navbar Based on Auth State ─────────────────────
async function initAuthUI() {
  const profileBtn = document.getElementById('profileBtn');
  const devIcon = document.getElementById('devIcon');
  if (!profileBtn) return;

  // Always make profile button visible with fallback icon
  profileBtn.innerHTML = `👤`;
  profileBtn.onclick = () => openAuthModal('login');
  if (devIcon) devIcon.style.display = 'none';

  try {
    const user = await getCurrentUser();
    if (user) {
      profileBtn.innerHTML = `
        <div class="user-avatar-wrap">
          <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
          <span class="user-xp-badge">${user.xp} XP</span>
        </div>`;
      profileBtn.onclick = () => openUserMenu(user);

      if (user.role === 'developer' && devIcon) {
        devIcon.style.display = 'flex';
        devIcon.onclick = () => window.location.href = 'devpanel.html';
      }
    }
  } catch (err) {
    // Session error — keep default login button, don't crash
    console.warn('Auth init error:', err.message);
  }
}

// ─── Auth Modal ────────────────────────────────────────────
function openAuthModal(tab = 'login') {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  modal.classList.add('active');
  switchAuthTab(tab);
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

// ─── Login Form Submit ─────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');

  btn.disabled = true;
  btn.textContent = 'Logging in...';
  err.textContent = '';

  try {
    await login(email, password);
    closeAuthModal();
    window.location.reload();
  } catch (error) {
    err.textContent = error.message;
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

// ─── Register Form Submit ──────────────────────────────────
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('regEmail').value;
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;
  const btn = document.getElementById('registerBtn');
  const err = document.getElementById('registerError');

  btn.disabled = true;
  btn.textContent = 'Creating...';
  err.textContent = '';

  try {
    await register(email, password, username);
    err.style.color = '#00d4ff';
    err.textContent = 'Account created! Check your email to confirm.';
    btn.textContent = 'Done!';
  } catch (error) {
    err.style.color = '#ff2d55';
    err.textContent = error.message;
    btn.disabled = false;
    btn.textContent = 'Register';
  }
}

// ─── User Menu Dropdown ────────────────────────────────────
function openUserMenu(user) {
  const existing = document.getElementById('userMenu');
  if (existing) { existing.remove(); return; }

  const menu = document.createElement('div');
  menu.id = 'userMenu';
  menu.className = 'user-menu';
  menu.innerHTML = `
    <div class="user-menu-header">
      <div class="um-avatar">${user.username.charAt(0).toUpperCase()}</div>
      <div>
        <div class="um-name">${user.username}</div>
        <div class="um-level">Level ${user.level} · ${user.xp} XP</div>
      </div>
    </div>
    <div class="user-menu-item" onclick="window.location.href='leaderboard.html'">🏆 Leaderboard</div>
    <div class="user-menu-item" onclick="logout()">🚪 Logout</div>
  `;

  document.getElementById('profileBtn').appendChild(menu);
  setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
}
