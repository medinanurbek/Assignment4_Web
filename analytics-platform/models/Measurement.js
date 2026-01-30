// models/Measurement.js
const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        required: true,
        index: true // Indexing for faster queries on date ranges
    },
    field1: {
        type: Number, // e.g., Temperature
        required: true
    },
    field2: {
        type: Number, // e.g., Humidity
        required: true
    },
    field3: {
        type: Number, // e.g., CO2 Levels
        required: true
    }
});

module.exports = mongoose.model('Measurement', measurementSchema);