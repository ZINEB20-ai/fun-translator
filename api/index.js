const fetch = require("node-fetch");

module.exports = async function (context, req) {

    const text = req.body.text;
    const lang = req.body.lang;

    if (!text || !lang) {
        context.res = {
            status: 400,
            body: { error: "Missing parameters" }
        };
        return;
    }

    // Clé API et endpoint du service Translator (à remplacer)
    const key = process.env.TRANSLATOR_KEY;
    const endpoint = process.env.TRANSLATOR_ENDPOINT;

    const url = `${endpoint}/translate?api-version=3.0&to=${lang}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Ocp-Apim-Subscription-Key": key,
            "Ocp-Apim-Subscription-Region": "westeurope",
            "Content-Type": "application/json"
        },
        body: JSON.stringify([{ Text: text }])
    });

    const result = await response.json();

    const translation = result[0]?.translations[0]?.text || "";

    context.res = {
        headers: { "Content-Type": "application/json" },
        body: { translation }
    };
};
