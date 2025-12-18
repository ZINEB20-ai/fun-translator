cat > translate/index.js <<'EOF'
const fetch = require("node-fetch");

module.exports = async function (context, req) {
  try {
    const text = req.body?.text;
    const lang = req.body?.lang;

    if (!text || !lang) {
      context.res = { status: 400, body: { error: "Missing parameters: text, lang" } };
      return;
    }

    const key = process.env.TRANSLATOR_KEY;
    const endpoint = (process.env.TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com").replace(/\/$/, "");
    const region = (process.env.TRANSLATOR_REGION || "francecentral").trim();

    if (!key) {
      context.res = { status: 500, body: { error: "Missing TRANSLATOR_KEY in App Settings" } };
      return;
    }

    const url = `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(lang)}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key.trim(),
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([{ Text: text }])
    });

    const raw = await resp.text();

    if (!resp.ok) {
      context.res = { status: resp.status, body: { error: "Translator API error", details: raw } };
      return;
    }

    context.res = { status: 200, body: JSON.parse(raw) };
  } catch (e) {
    context.res = { status: 500, body: { error: "Server error", details: String(e) } };
  }
};
EOF
