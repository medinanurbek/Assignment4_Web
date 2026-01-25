require('dotenv').config();
const mongoose = require('mongoose');
const Measurement = require('../src/models/Measurement');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding');

    await Measurement.deleteMany();

    const data = [];
    const startDate = new Date('2025-01-01');

    for (let i = 0; i < 50; i++) {
      data.push({
        timestamp: new Date(startDate.getTime() + i * 60 * 60 * 1000),
        field1: 20 + Math.random() * 5,
        field2: 40 + Math.random() * 10,
        field3: 300 + Math.random() * 50
      });
    }

    await Measurement.insertMany(data);
    console.log('Database seeded successfully');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
