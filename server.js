const express = require('express'); 
// Importing Express, a web application framework for Node.js.

const db = require('./db.js'); 
// Importing the database connection functions (connect and close) from db.js.

const app = express(); 
// Creating an instance of Express to use its functionalities.

const port = 3000; 
// Defining the port number where the server will listen for requests.

require('dotenv').config(); 
// Loading environment variables from a .env file into process.env.

async function startServer() { 
    // Defining an asynchronous function named startServer.
    await db.connect(); 
    // Awaiting the connection to the database (using the connect function from db.js).
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port} and database connected`);
        // Starting the server and logging a message to indicate that the server is running and the database is connected.
    });
}

startServer().catch(console.dir); 
// Calling the startServer function and handling any errors that occur by logging them to the console.