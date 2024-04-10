const mongoose = require('mongoose');
const connectionOptions = { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true }; // what does this do
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

module.exports = { connect, close }; //what does this do