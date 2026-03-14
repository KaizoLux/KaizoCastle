const SUPABASE_URL = 'https://wfvcsmrnbkfapyekwdqd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmdmNzbXJuYmtmYXB5ZWt3ZHFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTA2OTQsImV4cCI6MjA4ODk4NjY5NH0.r-uAO3yWesOahY1ke3ZTGWrmBpUVWecyDWcZCQP3ljY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// ─── Placeholder image (inline SVG base64) ─────────────────
const PLACEHOLDER_IMG = `data:image/svg+xml;base64,${btoa(`
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#0f1628"/>
  <rect x="2" y="2" width="396" height="296" fill="none" stroke="#1e2d4a" stroke-width="2" stroke-dasharray="8,4"/>
  <text x="200" y="135" text-anchor="middle" fill="#1e3a5f" font-family="monospace" font-size="48">⬡</text>
  <text x="200" y="175" text-anchor="middle" fill="#2a4a7f" font-family="monospace" font-size="13">NO IMAGE</text>
  <text x="200" y="195" text-anchor="middle" fill="#1e3a5f" font-family="monospace" font-size="10">Set via Dev Panel</text>
</svg>`)}`;

const PLACEHOLDER_LOGO = `data:image/svg+xml;base64,${btoa(`
<svg width="160" height="40" xmlns="http://www.w3.org/2000/svg">
  <rect width="160" height="40" rx="4" fill="#0f1628"/>
  <text x="80" y="26" text-anchor="middle" fill="#00d4ff" font-family="monospace" font-size="14" font-weight="bold">KAIZO CASTLE</text>
</svg>`)}`;
