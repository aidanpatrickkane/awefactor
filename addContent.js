require('dotenv').config();
const mongoose = require('mongoose');
const db = require('./db.js'); // Make sure your DB connection module is correctly required
const Content = require('./models/Content.js'); // Adjust the path as necessary

async function addContent() {
    await db.connect(); // Ensure the database connection is established

    const newContent = new Content({
        duration: 1,
        title: "Here Comes The Sun on a Kalimba",
        author: "AcousticTrench",
        type: "video",
        content: {
            url: "https://www.youtube.com/embed/F4we73GHH9k?si=JbAXLOe6o5vgbyVZ"
        }
    });

    try {
        await newContent.save();
        console.log('New content added');
    } catch (error) {
        console.error('Error adding content:', error);
    }

    mongoose.disconnect(); // Close the database connection
}

addContent();
