// ============================================================
// KAIZO CASTLE - SUPABASE CONFIG
// ============================================================

const SUPABASE_URL = 'https://wfvcsmrnbkfapyekwdqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdmNzbXJuYmtmYXB5ZWt3ZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTA2OTQsImV4cCI6MjA4ODk4NjY5NH0.r-uAO3yWesOahY1ke3ZTGWrmBpUVWecyDWcZCQP3ljY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Reset localStorage theme yang mungkin rusak ──────────
(function() {
  // Hapus theme tersimpan — reset ke default CSS
  // Kalau mau pakai custom theme, set ulang dari Dev Panel
  localStorage.removeItem('kc_theme');
})();

// ─── Storage Helpers ───────────────────────────────────────
async function uploadImage(bucket, file, path) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, cacheControl: '1' });
  if (error) throw error;
  return getPublicUrl(bucket, path);
}

function getPublicUrl(bucket, path) {
  // Hapus cache buster dari path kalau ada
  const cleanPath = path.split('?')[0];
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data.publicUrl;
}

// ─── Auth Helpers ──────────────────────────────────────────
async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();
  return data;
}

// ─── XP & Level Helper ─────────────────────────────────────
function calcLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

// ─── Placeholder image ─────────────────────────────────────
const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%230f1628'/%3E%3Crect x='2' y='2' width='396' height='296' fill='none' stroke='%231e2d4a' stroke-width='2' stroke-dasharray='8,4'/%3E%3Ctext x='200' y='175' text-anchor='middle' fill='%232a4a7f' font-family='monospace' font-size='13'%3ENO IMAGE%3C/text%3E%3Ctext x='200' y='195' text-anchor='middle' fill='%231e3a5f' font-family='monospace' font-size='10'%3ESet via Dev Panel%3C/text%3E%3C/svg%3E";

const PLACEHOLDER_LOGO = "data:image/svg+xml,%3Csvg width='160' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='160' height='40' rx='4' fill='%230f1628'/%3E%3Ctext x='80' y='26' text-anchor='middle' fill='%2300d4ff' font-family='monospace' font-size='14' font-weight='bold'%3EKAIZO CASTLE%3C/text%3E%3C/svg%3E";
