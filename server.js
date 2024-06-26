const express = require('express');
const db = require('./db'); // Importing connect and close functions from db.js
const bodyParser = require('body-parser');
const User = require('./models/User');
const Content = require('./models/Content.js');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config(); // Loading environment variables from a .env file into process.env. only needs to be done once

const app = express(); // Creating an instance of Express to use its functionalities
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('view engine', 'ejs'); // setting view engine to EJS
app.set('views', 'views') // specifies directory where page templates will be stored. 'views' directory necessary

app.use(session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60 // sets time-to-live (ttl) -- 14 days * 24 hours * 60 minutes * 60...take a wild guess
    }),
    cookie: { secure: true } // best in production so cookie only sent over https connections
}));

app.post('/signup', async (req, res) => { // duplicate usernames or emails result in error due to User.js configuration
    try {
        const { firstName, lastName, username, email, password, timezone } = req.body;
        const newUser = new User({ firstName, lastName, username, email, password, timezone });
        await newUser.save();
        req.session.user = {
            id: newUser._id,
            username: newUser.username,
            timezone: newUser.timezone,
            lastAccessedContent: newUser.lastAccessedContent
        };
        res.redirect('/fetch-content');
    } catch (error) {
        res.status(500).send('Username or password already taken');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).send('Invalid username or password');
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
        req.session.user = {
            id: user._id,
            username: user.username,
            timezone: user.timezone,
            lastAccessedContent: user.lastAccessedContent
        };
        res.redirect('/fetch-content');
    } else {
        res.status(400).send('Invalid username or password');
    }
});

// fetch content route (duh)
app.get('/fetch-content', async (req, res) => { // route to display content
    if (!req.session.user) {
        res.status(401).send('Unauthorized'); // someone smart like me tries to input this in the url directly
        return;
    }
    //populate() makes it so that the array of ObjectId's referring to 
    //content documents are now replaced in content_seen with the actual objects and their properties
    const user = await User.findById(req.session.user.id).populate('content_seen');

    if (!user) {
        res.status(404).send('User not found');
        return;
    }

    // allow the boss (me) to always access
    if (user.username === 'aidan') {
        return fetchAndRenderContent(res, user);
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

async function fetchAndRenderContent(res, user) { // point of res is to control browser output (send data back to client)
    try {
        //get unseen content as function of nin user's consent_seen array
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