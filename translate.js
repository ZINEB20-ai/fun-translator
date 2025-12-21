const { app } = require("@azure/functions");
const fetch = require("node-fetch");
const { CosmosClient } = require("@azure/cosmos");

app.http("translate", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const text = (body.text || "").trim();
      const lang = (body.lang || "").trim();

      if (!text || !lang) {
        return {
          status: 400,
          jsonBody: { error: "Missing parameters: text and lang are required" },
        };
      }

      // --- Translator env ---
      const key = process.env.TRANSLATOR_KEY;
      const endpoint = process.env.TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com";
      const region = process.env.TRANSLATOR_REGION;

      if (!key || !endpoint || !region) {
        return {
          status: 500,
          jsonBody: { error: "Missing TRANSLATOR_KEY / TRANSLATOR_ENDPOINT / TRANSLATOR_REGION" },
        };
      }

      // --- Call Microsoft Translator ---
      const url = `${endpoint.replace(/\/$/, "")}/translate?api-version=3.0&to=${encodeURIComponent(lang)}`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Ocp-Apim-Subscription-Region": region,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ Text: text }]),
      });

      const raw = await resp.text();
      if (!resp.ok) {
        return {
          status: resp.status,
          jsonBody: { error: "Translator API error", details: raw },
        };
      }

      const result = JSON.parse(raw);
      const translatedText = result?.[0]?.translations?.[0]?.text ?? "";

      // --- Save to Cosmos DB (history) ---
      const cs = process.env.COSMOS_CONNECTION_STRING;
      if (cs) {
        const client = new CosmosClient(cs);
        const container = client.database("translationsDB").container("history");

        await container.items.create({
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          text,
          translatedText,
          lang,
          createdAt: new Date().toISOString(),
        });
      } else {
        context.log("COSMOS_CONNECTION_STRING not set -> history not saved.");
      }

      return {
        status: 200,
        jsonBody: {
          translation: translatedText,
          raw: result, // utile si tu veux voir tout le JSON
        },
      };
    } catch (e) {
      context.log("Server error:", e);
      return { status: 500, jsonBody: { error: "Server error", details: String(e) } };
    }
  },
});
