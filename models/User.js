const mongoose = require('mongoose');

const userSchema  = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }
});

const User = mongoose.model('User', userSchema);

module.exports = User; //exportable if i want to perform operations on the model elsewhere in the program like make a new one or query user data
