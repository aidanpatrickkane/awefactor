const express = require('express'); //brings in Express toolbox
const app = express(); //making it so we can use express toolbox
const port = 3000; //telling my server to listen to requests at this apartment number

app.get('/', (req, res) => { //when someone visits main site (what / signifies), hello world is logged to the console
    res.send('Hello World!'); //This line sends a response back to the client (for example, a web browser) that made a request to your server.

});

app.listen(port, () => { //express server listens for incoming requests on port 3000
    console.log(`Server listening at http://localhost:${port}`);
});

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://kaneaidan12:<nice-try>@mycluster.gabzp5a.mongodb.net/?retryWrites=true&w=majority&appName=MyCluster";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

