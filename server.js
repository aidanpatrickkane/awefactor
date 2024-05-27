const express = require('express');
const db = require('./db.js'); // Importing the database connection functions (connect and close) from db.js
const app = express(); // Creating an instance of Express to use its functionalities
const port = 3000; // Defining the port number where the server will listen for requests.

require('dotenv').config(); // Loading environment variables from a .env file into process.env.

app.set('view engine', 'ejs'); // Setting the view engine to EJS
app.set('views', 'views') // specifies directory where page templates will be stored. 'views' directory necessary

app.use(express.static('public'));

async function startServer() { 
    await db.connect(); // Defining an asynchronous function named startServer.
    app.listen(port, () => { // Awaiting the connection to the database (using the connect function from db.js).
        console.log(`Server listening at http://localhost:${port} and database connected`); // Starting the server and logging a message to indicate that the server is running and the database is connected.
    });
}

startServer().catch(console.dir); // Calling the startServer function and handling any errors that occur by logging them to the console.