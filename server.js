const express = require('express');
const db = require('./db'); // Importing connect and close functions from db.js
const bodyParser = require('body-parser');
const User = require('./models/User');
const Content = require('./models/Content.js');
const Submission = require('./models/Submission.js');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const validator = require('validator');
require('dotenv').config(); // Loading environment variables from a .env file into process.env. only needs to be done once

const app = express(); // Creating an instance of Express to use its functionalities
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/test', (req, res) => {
    res.render('test');
});

const isValidUrl = (url) => {
    //validating url to make sure its safe and doesnt make my computer disappear
    return validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true });
};

app.post('/submit-factor', async (req, res) => {
    try {
        const { fullName, factorLink, whyTheyLove } = req.body;
        // validating url
        if (!isValidUrl(factorLink)) {
            return res.status(400).send('Invalid URL provided.');
        }
        
        // saving submish to database
        const newSubmission = new Submission({ fullName, factorLink, whyTheyLove });
        await newSubmission.save();
        res.redirect('https://awefactor.us/thankyouforsubmission.html');
    } catch (error) {
        console.error('Error during submission:', error);
        res.status(500).send('Error with submission. Try again soon (seriously)!');
    }
});

app.post('/check-url', async (req, res) => {
    const { url } = req.body;
    
    try {
        if (!isValidUrl(url)) {
            return res.json({ isBueno: false, message: 'Invalid URL provided.' });
        }

        res.json({ isBueno: true });
    } catch (error) {
        res.status(500).json({ isBueno: false, message: 'An error occurred validating your url' });
    }
});

//check-unique is called by client side signup form to see if username and email are unique
app.post('/check-unique', async (req, res) => {
    const { username, email } = req.body;

    try {
        const userWithSameUsername = await User.findOne({ username });
        const userWithSameEmail = await User.findOne({ email });

        if (userWithSameUsername) {
            return res.json({ isUnique: false, message: 'that factorname\'s taken ;(' });
        }

        if (userWithSameEmail) {
            return res.json({ isUnique: false, message: 'that email\'s taken ;(' });
        }

        res.json({ isUnique: true });
    } catch (error) {
        res.status(500).json({ isUnique: false, message: 'An error occurred trying to sign you up, please try again' });
    }
});

app.post('/signup', async (req, res) => { // duplicate usernames or emails result in error due to User.js configuration
    const { firstName, lastName, username, email, password, timezone } = req.body;

    try {
        const userWithSameUsername = await User.findOne({ username });
        const userWithSameEmail = await User.findOne({ email });

        if (userWithSameUsername) {
            return res.status(400).json({ message: 'that factorname\'s taken ;(' });
        }

        if (userWithSameEmail) {
            return res.status(400).json({ message: 'that email\'s taken ;(' });
        }

        const newUser = new User({ firstName, lastName, username, email, password, timezone });
        await newUser.save();

        req.session.user = {
            id: newUser._id,
            username: newUser.username,
            timezone: newUser.timezone,
            lastAccessedContent: newUser.lastAccessedContent
        };
        
        res.redirect('/my-factor');
    } catch (error) {
        res.status(500).send('Factorname or email already taken');
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.json({ isValidLogin: false, message: 'Factorname not found' });
        }

        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.user = {
                id: user._id,
                username: user.username,
                timezone: user.timezone,
                lastAccessedContent: user.lastAccessedContent
            };
            return res.json({ isValidLogin: true, message: 'Login successful' });
        } else {
            return res.json({ isValidLogin: false, message: 'Invalid password' });
        }
    } catch (error) {
        return res.status(500).json({ isValidLogin: false, message: 'Error getting your login info, try again soon!' });
    }
});

// fetch content route (duh)
app.get('/my-factor', async (req, res) => { // route to display content
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
    if (user.username === 'aidan' || user.username === 'aidan2' || user.username === 'aidan3') {
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
        //get unseen content as function of nin user's content_seen array
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