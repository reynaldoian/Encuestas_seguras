const EDGE_FUNCTION_URL = 'https://hmeqdnzehahsgpkzpttn.supabase.co/functions/v1/resend-email';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'; // tu anon key

async function callSendEmail(email, link) {
  const res = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ email, link })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Function error ${res.status}: ${text}`);
  }
  return res.json();
}
