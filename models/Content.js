const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
    duration: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['video', 'poem', 'article'],
        required: true
    },
    content: {
        text: { // for poems and articles
            type: String,
            default: ''
        },
        url: { // for youtube video url
            type: String,
            default: ''
        }
    }
});

const Content = mongoose.model('Content', contentSchema);

module.exports = Content;