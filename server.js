const express = require('express'); //brings in Express toolbox
const app = express(); //making it so we can use express toolbox
const port = 3000; //telling my server to listen to requests at this apartment number
require('dotenv').config();
const uri = process.env.MONGODB_URI;

async function startServer() {
  const db = await db.connect();
  app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port} and database connected`);
  });
}
startServer().catch(console.dir);

