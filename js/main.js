// ============================================================
// KAIZO CASTLE - MAIN JS
// ============================================================

// ─── Hero Slider ───────────────────────────────────────────
let sliderData = [];
let currentSlide = 0;
let sliderTimer;

async function loadHeroSlider() {
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('id', { ascending: true });

  const track = document.getElementById('sliderTrack');
  const dots = document.getElementById('sliderDots');
  if (!track) return;

  sliderData = banners && banners.length > 0 ? banners : [
    { id: 1, title: 'Welcome to Kaizo Castle', description: 'Your ultimate gaming portal. Play, learn, and conquer.', image: PLACEHOLDER_IMG, button_link: 'games.html' },
    { id: 2, title: 'Explore the Library', description: 'Read books, gain knowledge, earn XP.', image: PLACEHOLDER_IMG, button_link: 'library.html' },
    { id: 3, title: 'Climb the Leaderboard', description: 'Compete with players worldwide.', image: PLACEHOLDER_IMG, button_link: 'leaderboard.html' }
  ];

  track.innerHTML = sliderData.map((b, i) => `
    <div class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">
      <div class="slide-bg" style="background-image:url('${b.image || PLACEHOLDER_IMG}')"></div>
      <div class="slide-overlay"></div>
      <div class="slide-content">
        <span class="slide-badge">Featured</span>
        <h1 class="slide-title">${b.title}</h1>
        <p class="slide-desc">${b.description || ''}</p>
        <a href="${b.button_link || '#'}" class="btn-primary">
          <span>Play Now</span>
          <i>▶</i>
        </a>
      </div>
    </div>
  `).join('');

  if (dots) {
    dots.innerHTML = sliderData.map((_, i) =>
      `<button class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></button>`
    ).join('');
  }

  startSliderAuto();
}

function goToSlide(index) {
  clearInterval(sliderTimer);
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  slides[currentSlide]?.classList.remove('active');
  dots[currentSlide]?.classList.remove('active');
  currentSlide = (index + sliderData.length) % sliderData.length;
  slides[currentSlide]?.classList.add('active');
  dots[currentSlide]?.classList.add('active');
  startSliderAuto();
}

function startSliderAuto() {
  sliderTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
}

// ─── Trending Games ────────────────────────────────────────
async function loadTrendingGames() {
  const el = document.getElementById('trendingGames');
  if (!el) return;

  const { data: games } = await supabase
    .from('games')
    .select('*')
    .order('rating', { ascending: false })
    .limit(6);

  renderGameCards(el, games);
}

// ─── Popular Games ─────────────────────────────────────────
async function loadPopularGames() {
  const el = document.getElementById('popularGames');
  if (!el) return;

  const { data: games } = await supabase
    .from('games')
    .select('*')
    .order('id', { ascending: false })
    .limit(8);

  renderGameCards(el, games);
}

// ─── All Games (games.html) ────────────────────────────────
let allGames = [];
let activeCategory = 'All';

async function loadAllGames() {
  const el = document.getElementById('allGames');
  if (!el) return;

  const { data: games } = await supabase.from('games').select('*').order('id');
  allGames = games || [];

  buildCategoryFilter(allGames);
  renderGameCards(el, allGames);
}

function buildCategoryFilter(games) {
  const filterEl = document.getElementById('categoryFilter');
  if (!filterEl) return;
  const cats = ['All', ...new Set((games || []).map(g => g.category).filter(Boolean))];
  filterEl.innerHTML = cats.map(c =>
    `<button class="cat-btn ${c === 'All' ? 'active' : ''}" onclick="filterGames('${c}')">${c}</button>`
  ).join('');
}

function filterGames(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.textContent === cat);
  });
  const filtered = cat === 'All' ? allGames : allGames.filter(g => g.category === cat);
  renderGameCards(document.getElementById('allGames'), filtered);
}

function renderGameCards(container, games) {
  if (!container) return;
  if (!games || games.length === 0) {
    container.innerHTML = `<div class="empty-state"><span>⬡</span><p>No games yet.<br>Add some in Dev Panel.</p></div>`;
    return;
  }
  container.innerHTML = games.map(g => `
    <div class="game-card" onclick="openGame('${g.game_url || '#'}')">
      <div class="game-thumb">
        <img src="${g.image || PLACEHOLDER_IMG}" alt="${g.title}" onerror="this.src='${PLACEHOLDER_IMG}'">
        <div class="game-hover-overlay"><span>▶ Play</span></div>
      </div>
      <div class="game-info">
        <span class="game-cat">${g.category || 'Game'}</span>
        <h3 class="game-title">${g.title}</h3>
        <div class="game-meta">
          <span class="game-rating">★ ${g.rating || '?'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function openGame(url) {
  if (url && url !== '#') window.open(url, '_blank');
}

// ─── Library ───────────────────────────────────────────────
async function loadLibrary() {
  const el = document.getElementById('libraryBooks');
  if (!el) return;

  const { data: books } = await supabase.from('books').select('*').order('id');
  renderBookCards(el, books);
}

function renderBookCards(container, books) {
  if (!container) return;
  if (!books || books.length === 0) {
    container.innerHTML = `<div class="empty-state"><span>📚</span><p>No books yet.<br>Add some in Dev Panel.</p></div>`;
    return;
  }
  container.innerHTML = books.map(b => `
    <div class="book-card">
      <div class="book-cover">
        <img src="${b.image || PLACEHOLDER_IMG}" alt="${b.title}" onerror="this.src='${PLACEHOLDER_IMG}'">
      </div>
      <div class="book-info">
        <span class="book-cat">${b.category || 'General'}</span>
        <h3 class="book-title">${b.title}</h3>
        <button class="btn-read" onclick="openBook(${b.id})">Read Now</button>
      </div>
    </div>
  `).join('');
}

function openBook(id) {
  window.location.href = `library.html?book=${id}`;
}

// ─── Book Reader ───────────────────────────────────────────
async function loadBookReader() {
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get('book');
  const readerEl = document.getElementById('bookReader');
  if (!bookId || !readerEl) return;

  const { data: book } = await supabase.from('books').select('*').eq('id', bookId).single();
  if (!book) return;

  readerEl.style.display = 'block';
  document.getElementById('bookListWrap').style.display = 'none';
  document.getElementById('readerTitle').textContent = book.title;
  document.getElementById('readerContent').innerHTML = book.content || '<p>No content yet.</p>';
}

// ─── Leaderboard ───────────────────────────────────────────
async function loadLeaderboard() {
  const el = document.getElementById('leaderboardList');
  if (!el) return;

  const { data: users } = await supabase
    .from('users')
    .select('username, xp, level')
    .order('xp', { ascending: false })
    .limit(50);

  if (!users || users.length === 0) {
    el.innerHTML = `<div class="empty-state"><span>🏆</span><p>No players yet.</p></div>`;
    return;
  }

  el.innerHTML = users.map((u, i) => `
    <div class="lb-row ${i < 3 ? 'lb-top' : ''}">
      <div class="lb-rank">
        ${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
      </div>
      <div class="lb-avatar">${u.username.charAt(0).toUpperCase()}</div>
      <div class="lb-user">
        <span class="lb-name">${u.username}</span>
        <span class="lb-level">Lv. ${u.level || calcLevel(u.xp)}</span>
      </div>
      <div class="lb-xp">${u.xp} <span>XP</span></div>
    </div>
  `).join('');
}

// ─── Homepage Mini Leaderboard ─────────────────────────────
async function loadMiniLeaderboard() {
  const el = document.getElementById('miniLeaderboard');
  if (!el) return;

  const { data: users } = await supabase
    .from('users')
    .select('username, xp, level')
    .order('xp', { ascending: false })
    .limit(5);

  if (!users || users.length === 0) {
    el.innerHTML = `<div class="empty-state-sm">No players yet.</div>`;
    return;
  }

  el.innerHTML = users.map((u, i) => `
    <div class="mini-lb-row">
      <span class="mini-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
      <span class="mini-name">${u.username}</span>
      <span class="mini-xp">${u.xp} XP</span>
    </div>
  `).join('');
}

// ─── Search ────────────────────────────────────────────────
async function handleSearch(query) {
  if (!query || query.length < 2) return;
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .ilike('title', `%${query}%`);

  const resultsEl = document.getElementById('searchResults');
  if (!resultsEl) return;

  if (!games || games.length === 0) {
    resultsEl.innerHTML = `<div class="no-results">No results for "${query}"</div>`;
  } else {
    resultsEl.innerHTML = games.map(g => `
      <div class="search-item" onclick="openGame('${g.game_url || '#'}')">
        <img src="${g.image || PLACEHOLDER_IMG}" alt="${g.title}" onerror="this.src='${PLACEHOLDER_IMG}'">
        <span>${g.title}</span>
      </div>
    `).join('');
  }
  resultsEl.style.display = 'block';
}

// ─── Search Toggle ─────────────────────────────────────────
function toggleSearch() {
  const bar = document.getElementById('searchBar');
  if (!bar) return;
  bar.classList.toggle('open');
  if (bar.classList.contains('open')) {
    document.getElementById('searchInput')?.focus();
  } else {
    document.getElementById('searchResults').style.display = 'none';
  }
}

// ─── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await initAuthUI();
  await loadHeroSlider();
  await loadTrendingGames();
  await loadPopularGames();
  await loadMiniLeaderboard();
  await loadAllGames();
  await loadLibrary();
  await loadBookReader();
  await loadLeaderboard();

  // Slider arrows
  document.getElementById('sliderPrev')?.addEventListener('click', () => goToSlide(currentSlide - 1));
  document.getElementById('sliderNext')?.addEventListener('click', () => goToSlide(currentSlide + 1));

  // Auth form listeners
  document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('registerForm')?.addEventListener('submit', handleRegister);

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
  }

  // Auth tabs
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
  });

  // Close modal backdrop
  document.getElementById('authModal')?.addEventListener('click', function(e) {
    if (e.target === this) closeAuthModal();
  });
});
