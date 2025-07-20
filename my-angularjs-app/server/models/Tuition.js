const mongoose = require('mongoose');

// Define the Tuition Schema
const tuitionSchema = new mongoose.Schema({
    tuitionName: {
        type: String,
        required: true
    },
    tutorName: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/ // Example validation for phone number
    },
    class: {
        type: String,
        required: true
    },
    subjects: {
        type: [String], // Array of subjects
        required: true
    },
    fees: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    }
});

// Create a model from the schema
const Tuition = mongoose.model('Tuition', tuitionSchema);

module.exports = Tuition;
