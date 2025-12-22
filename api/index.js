const fetch = require("node-fetch");
const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
  try {
    const text = (req.body && req.body.text || "").trim();
    const lang = (req.body && req.body.lang || "").trim();

    if (!text || !lang) {
      context.res = { status: 400, body: { error: "Missing parameters: text/lang" } };
      return;
    }

    const key = process.env.TRANSLATOR_KEY;
    const endpoint = process.env.TRANSLATOR_ENDPOINT;
    const region = process.env.TRANSLATOR_REGION || "francecentral";

    if (!key || !endpoint) {
      context.res = { status: 500, body: { error: "Missing TRANSLATOR_KEY or TRANSLATOR_ENDPOINT" } };
      return;
    }

    const url = `${endpoint}/translate?api-version=3.0&to=${encodeURIComponent(lang)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Ocp-Apim-Subscription-Region": region,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([{ Text: text }])
    });

    if (!response.ok) {
      const errText = await response.text();
      context.log.error("Translator failed:", errText);
      context.res = { status: 500, body: { error: "Translator failed", details: errText } };
      return;
    }

    const data = await response.json();
    const translated = data?.[0]?.translations?.[0]?.text || "";

    // ✅ Cosmos DB (best-effort)
    const conn = process.env.COSMOS_CONNECTION_STRING;
    const dbName = process.env.COSMOS_DB;
    const containerName = process.env.COSMOS_CONTAINER;

    if (conn && dbName && containerName) {
      try {
        const client = new CosmosClient(conn);
        const container = client.database(dbName).container(containerName);

        const item = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          lang,
          input: text,
          output: translated,
          createdAt: new Date().toISOString()
        };

        await container.items.create(item);
        context.log("Saved to Cosmos DB:", item.id);
      } catch (e) {
        context.log.warn("Cosmos write failed:", e.message);
      }
    } else {
      context.log.warn("Cosmos env missing (COSMOS_CONNECTION_STRING/DB/CONTAINER)");
    }

    context.res = { status: 200, body: { translation: translated } };
  } catch (err) {
    context.log.error("Server error:", err);
    context.res = { status: 500, body: { error: "Server error", details: err.message } };
  }
};
