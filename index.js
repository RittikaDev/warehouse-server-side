const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

function verify(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Access Denied" });
    }
    console.log(decoded);
    req.decoded = decoded;
    next();
  });
  // console.log("indise verify", authHeader);
}

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

    app.post("/login", (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });

    // Load All Items
    app.get("/item", verify, async (req, res) => {
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = itemCollection.find(query);
        const items = await cursor.toArray();
        res.send(items);
      } else {
        res.status(403).send({ message: "Access Denied" });
      }
      // const query = {};
      // const cursor = itemCollection.find(query);
      // const items = await cursor.toArray();
      // res.send(items);
    });
    app.get("/items", async (req, res) => {
      // const decodedEmail = req.decoded.email;
      // const email = req.query.email;
      // if (email) {
      //   // if (email === decodedEmail) {
      //   const query = { email: email };
      //   const cursor = itemCollection.find(query);
      //   const items = await cursor.toArray();
      //   res.send(items);
      //   // } else {
      //   //   res.status(403).send({ message: "Access Denied" });
      //   // }
      // } else {
      // console.log(req.query);
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const query = {};
      const cursor = itemCollection.find(query);
      let items;
      if (page || size) {
        items = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        items = await cursor.toArray();
      }
      res.send(items);
      // }
    });

    // pagination
    app.get("/itemcount", async (req, res) => {
      // const query = {};
      // const cursor = itemCollection.find(query);
      const count = await itemCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // Dynamic load data
    app.get("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const item = await itemCollection.findOne(query);
      res.send(item);
    });

    // Update Quantity
    app.put("/inventory/:id", async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      // console.log(updatedUser);
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: updatedUser.quantity,
        },
      };
      const result = await itemCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
      // console.log(result);
    });

    // Delete an item
    app.delete("/items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await itemCollection.deleteOne(query);
      res.send(result);
      // console.log(result);
    });

    // Add New Item
    app.post("/items", async (req, res) => {
      const newItem = req.body;
      const result = await itemCollection.insertOne(newItem);
      res.send(result);
      // console.log(result);
    });
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
