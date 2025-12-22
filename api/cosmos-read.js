const { CosmosClient } = require("@azure/cosmos");

const conn = process.env.COSMOS_CONNECTION_STRING;
const db = process.env.COSMOS_DB || "translationsDB";
const container = process.env.COSMOS_CONTAINER || "history";

(async () => {
  if (!conn) {
    console.error("Missing COSMOS_CONNECTION_STRING in env");
    process.exit(1);
  }
  const client = new CosmosClient(conn);
  const c = client.database(db).container(container);

  const query = {
    query: "SELECT TOP 5 c.input, c.output, c.lang, c.createdAt FROM c ORDER BY c.createdAt DESC"
  };

  const { resources } = await c.items.query(query).fetchAll();
  console.log(JSON.stringify(resources, null, 2));
})();
