const CosmosClient = require("@azure/cosmos").CosmosClient;
const axios = require('axios');
module.exports = async function (context, myTimer) {

    const BAN_EXPIRATION = 1;
    const expirationInSeconds = BAN_EXPIRATION * 86400;  // Number of days * seconds in a single day
    const now = Math.round(new Date().getTime() / 1000);
    const QUERY = {
        query: `SELECT * FROM Channel c WHERE c.isBanned=true AND @now - c.bannedUntil >= @banExpiration`,
        parameters: [
            { name: "@now", value: now },
            { name: "@banExpiration", value: expirationInSeconds }
        ]
    }

    const cosmosClient = new CosmosClient(process.env.CONNECTION_STRING);
    const databaseId = process.env.DatabaseId;
    const collectionId = process.env.ContainerId;
    const partitionKey = process.env.PartitionKey;
    const botEndpoint = process.env.BOT_ENDPOINT;

    if (!cosmosClient) throw ("CosmosClient cannot be null");
    if (!databaseId) throw ("You must specify a DatabaseID");
    if (!collectionId) throw ("You must specify a CollectionID/ContainerID");
    if (!partitionKey) throw ("You must specify a valid partition key");
    if (!botEndpoint) throw ("You must specify a bot service's endpoint");

    // Initialize the db
    const container = await init(cosmosClient, databaseId, collectionId, partitionKey);

    // Get the result
    const { resources } = await container.items.query(QUERY).fetchAll();

    if(resources.length != 0)
        axios.post(`${botEndpoint}/api/unban`, { unbannedUsers: resources });
};

/**
 * Performs database initialization with parameters specified in local.settings.json file
 * @param {*} cosmosClient CosmosClient already initialized with private connection string
 * @param {*} databaseId Name of the database
 * @param {*} collectionId Name of the container
 * @param {*} partitionKey Value of the partition key
 */
async function init(cosmosClient, databaseId, collectionId, partitionKey) {
    console.info('[INFO]: Setting up the database...');
    const dbResponse = await cosmosClient.databases.createIfNotExists({
        id: databaseId
    })
    const database = dbResponse.database;
    console.info('[INFO]: Setting up the database...done!');
    console.info('[INFO]: Setting up the container...');
    const containerResponse = await database.containers.createIfNotExists({ id: collectionId, partitionKey: { kind: "Hash", paths: [partitionKey] } });
    return containerResponse.container;

}