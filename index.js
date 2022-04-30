const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// Mongo Connect

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ysmgx.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run(req, res) {
  try {
    await client.connect();
    const itemCollection = client.db("warehouseManagement").collection("items");
    console.log("Mongo running");

    // Load All Items
    app.get("/items", async (req, res) => {
      const query = {};
      const cursor = itemCollection.find(query);
      const items = await cursor.toArray();
      res.send(items);
    });

    // Insert Events One By One
    //   app.post("/events", async (req, res) => {
    //     const event = req.body;
    //     const result = await serviceCollection
    //   });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Warehouse Management");
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
