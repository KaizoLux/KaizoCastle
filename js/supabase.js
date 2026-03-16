// KAIZO CASTLE - supabase.js
// SUPABASE_URL dan SUPABASE_ANON_KEY sudah didefinisikan di HTML

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch(e) { return null; }
}

async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  try {
    const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    return data;
  } catch(e) { return null; }
}

function calcLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='400' height='300' fill='%230f1628'/%3E%3Ctext x='200' y='165' text-anchor='middle' fill='%232a4a7f' font-family='monospace' font-size='13'%3ENO IMAGE%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_LOGO = "data:image/svg+xml,%3Csvg width='160' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='160' height='40' rx='4' fill='%230f1628'/%3E%3Ctext x='80' y='26' text-anchor='middle' fill='%2300d4ff' font-family='monospace' font-size='14' font-weight='bold'%3EKAIZO CASTLE%3C/text%3E%3C/svg%3E";
