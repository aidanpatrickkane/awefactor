require('dotenv').config();
const mongoose = require('mongoose');
const db = require('./db.js'); // Make sure your DB connection module is correctly required
const Content = require('./models/Content.js'); // Adjust the path as necessary

async function addContent() {
    await db.connect(); // Ensure the database connection is established

    const newContent = new Content({
        duration: 10,
        title: "Steve Jobs' 2005 Commencement Speech",
        author: "By Steve Jobs",
        type: "video",
        content: {
            url: "https://www.youtube.com/embed/UF8uR6Z6KLc?si=Ibg6Ro3WeE1uvUXz"
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


