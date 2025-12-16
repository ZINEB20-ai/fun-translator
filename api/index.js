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
    const endpoint = process.env.TRANSLATOR_ENDPOINT;

    if (!key || !endpoint) {
      context.res = { status: 500, body: { error: "Missing TRANSLATOR_KEY or TRANSLATOR_ENDPOINT" } };
      return;
    }

    const url = `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(lang)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": process.env.TRANSLATOR_REGION || "westeurope",
        "Content-Type": "application/json"
      },
      body: JSON.stringify([{ Text: text }])
    });

    if (!response.ok) {
      const errText = await response.text();
      context.res = { status: response.status, body: { error: "Translator API error", details: errText } };
      return;
    }

    const data = await response.json();

    // data[0].translations[0].text
    context.res = { status: 200, body: data };
  } catch (e) {
    context.res = { status: 500, body: { error: "Server error", details: String(e) } };
  }
};
