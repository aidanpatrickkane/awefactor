const express = require('express');
const db = require('./db.js'); // Importing the database connection functions (connect and close) from db.js
const bodyParser = require('body-parser');
const User = require('./models/User.js');
const Content = require('./models/Content.js');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const session = require('express-session');

const app = express(); // Creating an instance of Express to use its functionalities
const port = process.env.PORT || 3000; // Defining the port number where the server will listen for requests.

require('dotenv').config(); // Loading environment variables from a .env file into process.env.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('view engine', 'ejs'); // Setting the view engine to EJS
app.set('views', 'views') // specifies directory where page templates will be stored. 'views' directory necessary

app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secture: false }
}));

app.post('/signup', async (req, res) => { // need to handle attempts of duplicate users
    try {
        const { firstName, lastName, username, email, password, timezone } = req.body;
        console.log('Received timezone: ', timezone);
        const newUser = new User({ firstName, lastName, username, email, password, timezone });
        await newUser.save();
        res.send('Signup successful');
    } catch (error) {
        console.error('Failed to create user:', error);
        res.status(500).send('Error signing up user');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (user) {
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.user = { //making session object from which data of user can be accessed for logic
                id: user._id,
                username: user.username,
                timezone: user.timezone,
                lastAccessedContent: user.lastAccessedContent
            }; //store user data in session
            res.redirect('/fetch-content');
        } else {
            res.send('Invalid username or password');
        }
    } else {
        res.send('Invalid username or password');
    }
});

// fetch content route (duh)
app.get('/fetch-content', async (req, res) => { // route to display content
    if (!req.session.user) {
        res.status(401).send('Unauthorized'); // someone smart like me tries to input this in the url directly
        return;
    }

    const user = await User.findById(req.session.user._id).populate('content_seen');

    // allow the boss (me) to always access
    if (user.username === 'aidan') {
        return fetchAndRenderContent(res);
    }

    const now = moment().tz(user.timezone);
    const lastAccess = moment(user.lastAccessedContent).tz(user.timezone);

    // check if user has accessed content today
    if (user.lastAccessedContent && now.isSame(lastAccess, 'day')) { // if they have accessed content before and today is the last time, no soup for you
        res.status(403).send('You can only access content once per day. Check back after midnight!');
        return;
    }

    //update last accessed time and fetch content
    user.lastAccessedContent = now.toDate();
    await user.save();

    fetchAndRenderContent(res, user);
});

async function fetchAndRenderContent(res) {
    try {
        const unseenContent = await Content.find({_id: { $nin: user.content_seen }});
        if (unseenContent.length === 0) {
            res.status(404).send('No new content available. More coming soon!');
            return;
        }

        //get random content
        const randomIndex = Math.floor(Math.random() * unseenContent.length);
        const content = unseenContent[randomIndex];

        // add content id to user's content_seen array
        user.content_seen.push(content._id);
        await user.save();

        res.render('content', { content });
    } catch (error) {
        console.error('Failed to fetch content');
        res.status(500).send('Server error');
    }
}

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