// ============================================================
// KAIZO CASTLE — supabase.js
// Root cause fix: jangan init client di sini,
// init setelah DOM ready supaya window.supabase pasti ada
// ============================================================

const SUPABASE_URL      = 'https://wfvcsmrnbkfapyekwdqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdmNzbXJuYmtmYXB5ZWt3ZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTA2OTQsImV4cCI6MjA4ODk4NjY5NH0.r-uAO3yWesOahY1ke3ZTGWrmBpUVWecyDWcZCQP3ljY';

// Supabase client — diisi setelah CDN ready
let supabase = null;

function _initClient() {
  if (supabase) return true;
  const lib = window.supabase || window.supabaseJs;
  if (lib && lib.createClient) {
    supabase = lib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  return false;
}

// Coba init sekarang (kalau CDN sudah siap)
_initClient();

// Kalau belum siap, polling sampai siap (max 5 detik)
function _waitClient() {
  return new Promise((resolve, reject) => {
    if (_initClient()) { resolve(); return; }
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (_initClient()) { clearInterval(t); resolve(); }
      else if (tries > 50) {
        clearInterval(t);
        reject(new Error('Supabase CDN gagal dimuat. Cek koneksi internet kamu.'));
      }
    }, 100);
  });
}

// ─── Semua fungsi async: tunggu client siap dulu ────────────

async function getSession() {
  await _waitClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from('users').select('*').eq('id', session.user.id).single();
  return data;
}

async function uploadImage(bucket, file, path) {
  await _waitClient();
  const { error } = await supabase.storage
    .from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  return getPublicUrl(bucket, path);
}

function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function calcLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// Hapus saved theme yang mungkin corrupt
localStorage.removeItem('kc_theme');

// ─── Placeholder images ────────────────────────────────────
const PLACEHOLDER_IMG  = "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%230f1628'/%3E%3Ctext x='200' y='160' text-anchor='middle' fill='%232a4a7f' font-family='monospace' font-size='14'%3ENO IMAGE%3C/text%3E%3Ctext x='200' y='180' text-anchor='middle' fill='%231e3a5f' font-family='monospace' font-size='10'%3ESet via Dev Panel%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_LOGO = "data:image/svg+xml,%3Csvg width='180' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='180' height='40' rx='4' fill='%230f1628'/%3E%3Ctext x='90' y='26' text-anchor='middle' fill='%2300d4ff' font-family='monospace' font-size='13' font-weight='bold'%3EKAIZO CASTLE%3C/text%3E%3C/svg%3E";
