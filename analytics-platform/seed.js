// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const Measurement = require('./models/Measurement');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB...');

        // Clear existing data
        await Measurement.deleteMany({});
        console.log('Old data cleared.');

        const measurements = [];
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30); // Last 30 days

        // Generate data points (one for every hour)
        let currentTime = new Date(startDate);
        while (currentTime <= endDate) {
            measurements.push({
                timestamp: new Date(currentTime),
                // Generate random data for fields
                field1: parseFloat((Math.random() * 30 + 10).toFixed(2)), // 10 - 40
                field2: parseFloat((Math.random() * 50 + 20).toFixed(2)), // 20 - 70
                field3: parseFloat((Math.random() * 500 + 400).toFixed(2)) // 400 - 900
            });
            currentTime.setHours(currentTime.getHours() + 1);
        }

        await Measurement.insertMany(measurements);
        console.log(`Inserted ${measurements.length} records successfully.`);
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();