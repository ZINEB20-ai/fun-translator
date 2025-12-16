const fetch = require("node-fetch");

module.exports = async function (context, req) {
  const text = req.body?.text;
  const lang = req.body?.lang;

  if (!text || !lang) {
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "Missing parameters: text, lang" }
    };
    return;
  }

  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "fr",
        target: lang,
        format: "text"
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      context.res = {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: { error: "Translation API error", details: errText }
      };
      return;
    }

    const data = await response.json();

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { translation: data.translatedText || "" }
    };
  } catch (e) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Server error", details: e.message }
    };
  }
};
