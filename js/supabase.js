// KAIZO CASTLE - Supabase Config
const SUPABASE_URL = 'https://wfvcsmrnbkfapyekwdqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdmNzbXJuYmtmYXB5ZWt3ZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTA2OTQsImV4cCI6MjA4ODk4NjY5NH0.r-uAO3yWesOahY1ke3ZTGWrmBpUVWecyDWcZCQP3ljY';

// Tunggu sampai window.supabase tersedia lalu init
let supabase = null;

function initSupabase() {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return true;
  }
  return false;
}

// Coba init langsung, kalau gagal tunggu sampai siap
if (!initSupabase()) {
  let tries = 0;
  const interval = setInterval(() => {
    tries++;
    if (initSupabase() || tries > 50) {
      clearInterval(interval);
      if (!supabase) console.error('Supabase CDN gagal dimuat setelah ' + tries + ' percobaan');
    }
  }, 100);
}

localStorage.removeItem('kc_theme');

async function uploadImage(bucket, file, path) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  return getPublicUrl(bucket, path);
}

function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function getSession() {
  if (!supabase) return null;
  try { const { data } = await supabase.auth.getSession(); return data.session; }
  catch(e) { return null; }
}

async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  try {
    const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    return data;
  } catch(e) { return null; }
}

function calcLevel(xp) { return Math.floor(Math.sqrt(xp / 100)) + 1; }

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%230f1628'/%3E%3Ctext x='200' y='165' text-anchor='middle' fill='%232a4a7f' font-family='monospace' font-size='13'%3ENO IMAGE%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_LOGO = "data:image/svg+xml,%3Csvg width='160' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='160' height='40' rx='4' fill='%230f1628'/%3E%3Ctext x='80' y='26' text-anchor='middle' fill='%2300d4ff' font-family='monospace' font-size='14' font-weight='bold'%3EKAIZO CASTLE%3C/text%3E%3C/svg%3E";
