module.exports = async function (context, req) {
  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (_) {}
    }

    const text = body && body.text;
    const lang = body && body.lang;

    if (!text || !lang) {
      context.res = { status: 400, body: { error: "Missing parameters: text, lang" } };
      return;
    }

    const key = process.env.TRANSLATOR_KEY;
    const endpoint = process.env.TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com";
    const region = process.env.TRANSLATOR_REGION;

    if (!key) {
      context.res = { status: 500, body: { error: "Missing TRANSLATOR_KEY" } };
      return;
    }

    const url = `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(lang)}`;

    const headers = {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/json"
    };
    if (region) headers["Ocp-Apim-Subscription-Region"] = region;

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify([{ Text: text }]),
        signal: controller.signal
      });
    } finally {
      clearTimeout(t);
    }

    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = raw; }

    context.res = { status: response.status, body: data };
  } catch (e) {
    context.log.error(e);
    context.res = { status: 500, body: { error: String(e?.message || e) } };
  }
};
