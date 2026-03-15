// ============================================================
// KAIZO CASTLE - SUPABASE CONFIG
// ============================================================

// Pakai var agar benar-benar global dan tidak hilang jika script error
var SUPABASE_URL = 'https://wfvcsmrnbkfapyekwdqd.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdmNzbXJuYmtmYXB5ZWt3ZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTA2OTQsImV4cCI6MjA4ODk4NjY5NH0.r-uAO3yWesOahY1ke3ZTGWrmBpUVWecyDWcZCQP3ljY';

// Buat client Supabase dengan error handling
var supabase;
try {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch(e) {
  console.error('Supabase client gagal dibuat:', e.message);
}

// ─── Storage Helpers ───────────────────────────────────────
async function uploadImage(bucket, file, path) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return getPublicUrl(bucket, path);
}

function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
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
var PLACEHOLDER_IMG = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">' +
  '<rect width="400" height="300" fill="#0f1628"/>' +
  '<text x="200" y="160" text-anchor="middle" fill="#2a4a7f" font-family="monospace" font-size="13">NO IMAGE</text>' +
  '</svg>'
);

var PLACEHOLDER_LOGO = '';
