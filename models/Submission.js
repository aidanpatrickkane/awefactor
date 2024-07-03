const mongoose = require('mongoose');

const submissionSchema  = new mongoose.Schema({
    fullName: { type: String, required: true },
    factorLink: { type: URL, required: true },
    whyTheyLove: { type: String, required: true }
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission; //exportable if i want to perform operations on the model elsewhere in the program like make a new one or query user data
