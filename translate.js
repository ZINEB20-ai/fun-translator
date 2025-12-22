const { app } = require("@azure/functions");
const fetch = require("node-fetch");
const { CosmosClient } = require("@azure/cosmos");

function getCosmos() {
  const conn = process.env.COSMOS_CONNECTION_STRING;
  const dbName = process.env.COSMOS_DB;
  const containerName = process.env.COSMOS_CONTAINER;

  if (!conn || !dbName || !containerName) return null;

  const client = new CosmosClient(conn);
  const container = client.database(dbName).container(containerName);
  return container;
}

app.http("translate", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const body = await request.json();
      const text = (body.text || "").trim();
      const lang = (body.lang || "").trim();

      if (!text || !lang) {
        return { status: 400, jsonBody: { error: "Missing text or lang" } };
      }

      const key = process.env.TRANSLATOR_KEY;
      const endpoint = process.env.TRANSLATOR_ENDPOINT;
      const region = process.env.TRANSLATOR_REGION || "westeurope";

      if (!key || !endpoint) {
        return { status: 500, jsonBody: { error: "Missing Translator config" } };
      }

      const url = `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(lang)}`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Ocp-Apim-Subscription-Region": region,
          "Content-Type": "application/json"
        },
        body: JSON.stringify([{ Text: text }])
      });

      if (!resp.ok) {
        const errText = await resp.text();
        context.error("Translator error:", errText);
        return { status: 500, jsonBody: { error: "Translator failed", details: errText } };
      }

      const result = await resp.json();
      const translated = result?.[0]?.translations?.[0]?.text || "";

      // ✅ Save to Cosmos (best-effort)
      const container = getCosmos();
      if (container) {
        const item = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          lang,
          input: text,
          output: translated,
          createdAt: new Date().toISOString()
        };

        try {
          await container.items.create(item);
        } catch (e) {
          context.warn("Cosmos write failed:", e.message);
        }
      }

      return {
        status: 200,
        jsonBody: { translation: translated, raw: result }
      };
    } catch (e) {
      context.error("Server error:", e);
      return { status: 500, jsonBody: { error: "Server error", details: e.message } };
    }
  }
});
