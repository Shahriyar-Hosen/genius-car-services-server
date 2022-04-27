const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ massage: "unAuthorized access" });
  }
  // verify a token asymmetric
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ massage: "Forbidden access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
  // ----------------------------------------------------
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d76bb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("geniuscar").collection("service");
    const orderCollection = client.db("geniuscar").collection("order");

    // JWT Token
    // AUTH
    app.post("/login", async (req, res) => {
      // Create Node Token - require('crypto').randomBytes(64).toString('hex')
      const user = req.body;
      console.log(user);
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ accessToken });
    });
    // ----------------------------------------------------------

    // service get
    app.get("/service", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await serviceCollection.findOne(query);
      res.send(service);
    });

    // Post newService
    app.post("/service", async (req, res) => {
      const newService = req.body;
      const result = await serviceCollection.insertOne(newService);
      res.send(result);
    });
    // ------------------------------------------------------

    //  Order Collection API
    // http://localhost:5000/order
    app.get("/order", verifyJWT, async (req, res) => {
      // This api is only token verify user
      const decodedEmail = req.decoded.email;
      const email = req.query.email;
      if (decodedEmail === email) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const order = await cursor.toArray();
        res.send(order);
      } else {
        return res.status(403).send({ massage: "Forbidden access" });
      }
    });
    // ------------------------------------------------------------

    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // Delete
    app.delete("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await serviceCollection.deleteOne(query);
      res.send(result);
    });
    // -------------------------------------------------------------
  } finally {
  }
}

app.get("/", (req, res) => {
  res.json("Running Genius car service");
});

app.listen(port, () => {
  console.log("Listening to port:", port);
});

run().catch(console.dir);
