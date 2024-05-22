const mongoose = require('mongoose');

const connectionOptions = {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}; // what does this do

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
        console.log('Successfully connected to MongoDB.');
    } catch (err) {
        console.error('Database connection failed', err);
        process.exit(1);
    }
};

const close = () => {
    mongoose.disconnect();
};

module.exports = { connect, close }; //makes it so these functions can be used elsewhere in the code. Such wherabouts will so on and so forth be unbeknownst to I (until the program's done and I can find each use of them if I so please)
// by exporting them as an object, I can use object destructuring to import them elsewhere in my application like so -> const { connect, close } = require('./db.js');