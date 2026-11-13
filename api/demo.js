// Vercel Serverless Function: POST /api/demo
// Env vars (set in Vercel -> Settings -> Environment Variables):
//   RESEND_API_KEY  - API key from resend.com
//   DEMO_TO_EMAIL   - where submissions are delivered
//   DEMO_FROM_EMAIL - verified sender, e.g. "Bellu <hello@bellu.com>"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

  // Honeypot: bots fill this hidden field, humans never see it.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const name = clean(body.name, 100);
  const email = clean(body.email, 200);
  const company = clean(body.company, 120);
  const message = clean(body.message, 2000);

  if (!name || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter your name and a valid email.' });
  }

  const { RESEND_API_KEY, DEMO_TO_EMAIL, DEMO_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !DEMO_TO_EMAIL || !DEMO_FROM_EMAIL) {
    console.error('Missing RESEND_API_KEY / DEMO_TO_EMAIL / DEMO_FROM_EMAIL');
    return res.status(500).json({ error: 'Form is not configured yet.' });
  }

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: DEMO_FROM_EMAIL,
        to: [DEMO_TO_EMAIL],
        reply_to: email,
        subject: `Demo request: ${name}${company ? ' (' + company + ')' : ''}`,
        html: `<p><b>Name:</b> ${esc(name)}</p><p><b>Email:</b> ${esc(email)}</p><p><b>Company:</b> ${esc(company)}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
      }),
    });
    if (!r.ok) {
      console.error('Resend error', r.status, await r.text());
      return res.status(502).json({ error: 'Could not send your request. Please try again.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: 'Could not send your request. Please try again.' });
  }
};

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }
