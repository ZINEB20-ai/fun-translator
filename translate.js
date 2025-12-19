const { app } = require("@azure/functions");
const fetch = require("node-fetch");

app.http("translate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "translate",
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const { text, lang } = body;

      if (!text || !lang) {
        return { status: 400, jsonBody: { error: "Missing parameters" } };
      }

      const key = process.env.TRANSLATOR_KEY;
      const region = process.env.TRANSLATOR_REGION;
      const endpoint = process.env.TRANSLATOR_ENDPOINT;

      const url = `${endpoint}/translate?api-version=3.0&to=${lang}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Ocp-Apim-Subscription-Region": region,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{ Text: text }])
      });

      const result = await response.json();
      return { status: 200, jsonBody: result };

    } catch (err) {
      return { status: 500, jsonBody: { error: err.message } };
    }
  }
});
