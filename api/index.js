module.exports = async function (context, req) {
  try {
    const text = req.body?.text;
    const lang = req.body?.lang;

    if (!text || !lang) {
      context.res = { status: 400, body: { error: "Missing text or lang" } };
      return;
    }

    const key = process.env.TRANSLATOR_KEY;
    const endpoint = process.env.TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com";
    const region = process.env.TRANSLATOR_REGION;

    if (!key) {
      context.res = { status: 500, body: { error: "Missing TRANSLATOR_KEY" } };
      return;
    }

    const url = `${endpoint}/translate?api-version=3.0&to=${lang}`;

    const headers = {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/json"
    };
    if (region) headers["Ocp-Apim-Subscription-Region"] = region;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify([{ Text: text }])
    });

    const data = await response.json();

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: data
    };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, body: { error: err.message } };
  }
};
