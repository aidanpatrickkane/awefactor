const express = require('express');
const db = require('./db.js'); // Importing the database connection functions (connect and close) from db.js
const bodyParser = require('body-parser');
const User = require('./models/User.js');
const app = express(); // Creating an instance of Express to use its functionalities
const port = 3000; // Defining the port number where the server will listen for requests.
const Content = require('./models/Content.js');

require('dotenv').config(); // Loading environment variables from a .env file into process.env.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('view engine', 'ejs'); // Setting the view engine to EJS
app.set('views', 'views') // specifies directory where page templates will be stored. 'views' directory necessary

app.get('/random-content', async (req, res) => { // route to display random content
    try {
        // get random content document
        const count = await Content.countDocuments(); // may have error here
        if (count == 0) {
            res.status(404).send('No content available');
            return;
        }
        const random = Math.floor(Math.random() * count);
        const content = await Content.findOne().skip(random);
        res.render('content', { content });
    } catch (error) {
        console.error('Failed to fetch content:', error);
        res.status(500).send('Server error');
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { firstName, lastName, username, email, password } = req.body;
        const newUser = new User({ firstName, lastName, username, email, password });
        await newUser.save();
        res.send('Signup successful');
    } catch (error) {
        console.error('Failed to create user:', error);
        res.status(500).send('Error signin up user');
    }
});

async function startServer() {
    try {
        await db.connect();  // Awaiting the connection to the database
        app.listen(port, () => {  // Starting the server
            console.log(`Server listening at http://localhost:${port} and database connected`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error);
        process.exit(1);  // Exiting the process if the server fails to start
    }
}

startServer().catch(console.dir);