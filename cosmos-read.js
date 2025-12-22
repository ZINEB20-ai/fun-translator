const { CosmosClient } = require("@azure/cosmos");

(async () => {
  const conn = process.env.COSMOS_CONNECTION_STRING;
  const dbName = process.env.COSMOS_DB || "translationsDB";
  const containerName = process.env.COSMOS_CONTAINER || "history";

  if (!conn) {
    console.error("Missing COSMOS_CONNECTION_STRING in env");
    process.exit(1);
  }

  const client = new CosmosClient(conn);
  const container = client.database(dbName).container(containerName);

  const query = {
    query: "SELECT TOP 5 c.input, c.output, c.lang, c.createdAt FROM c ORDER BY c.createdAt DESC"
  };

  const { resources } = await container.items.query(query).fetchAll();
  console.log(JSON.stringify(resources, null, 2));
})();
