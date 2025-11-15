// Seed initial data into MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const connectDB = require('../config/db');

// Product data - grouped by name with subtypes
const productsData = [
  {
    name: 'W Beam Crash Barrier',
    subtypes: ['W-Beam', 'Thrie-Beam', 'Double W-Beam', 'Crash-Tested'],
    unit: 'Meter',
    notes: 'Standard crash barrier systems'
  },
  {
    name: 'Hot Thermoplastic Paint',
    subtypes: ['White', 'Yellow', 'Reflective'],
    unit: 'Kg',
    notes: 'Road marking paint'
  },
  {
    name: 'Signages',
    subtypes: ['Directional', 'Informational', 'Cautionary'],
    unit: 'Piece',
    notes: 'Road signs and boards'
  }
];

// Manufacturer data - with productsOffered array
const manufacturersData = [
  {
    name: 'SafeRoad India Pvt Ltd',
    location: 'Pune',
    contact: '9876543210',
    productsOffered: [
      { productType: 'W-Beam', price: 420 },
      { productType: 'Thrie-Beam', price: 460 }
    ]
  },
  {
    name: 'Highway Guard Systems',
    location: 'Nashik',
    contact: '9823412341',
    productsOffered: [
      { productType: 'Double W-Beam', price: 510 },
      { productType: 'Crash-Tested', price: 570 }
    ]
  },
  {
    name: 'Metro Safety Co.',
    location: 'Mumbai',
    contact: '9934112233',
    productsOffered: [
      { productType: 'W-Beam', price: 440 },
      { productType: 'Directional', price: 300 },
      { productType: 'Informational', price: 300 },
      { productType: 'Cautionary', price: 300 }
    ]
  },
  {
    name: 'RoadMark Solutions',
    location: 'Nagpur',
    contact: '9755543210',
    productsOffered: [
      { productType: 'White', price: 270 },
      { productType: 'Yellow', price: 290 }
    ]
  },
  {
    name: 'ReflectoMark Pvt Ltd',
    location: 'Ahmedabad',
    contact: '8865432234',
    productsOffered: [
      { productType: 'Reflective', price: 380 },
      { productType: 'Directional', price: 310 },
      { productType: 'Informational', price: 310 },
      { productType: 'Cautionary', price: 310 }
    ]
  },
  {
    name: 'Bharat InfraTech',
    location: 'Bengaluru',
    contact: '9900011111',
    productsOffered: [
      { productType: 'W-Beam', price: 450 },
      { productType: 'Crash-Tested', price: 560 }
    ]
  },
  {
    name: 'SafetyLine Industries',
    location: 'Hyderabad',
    contact: '9911122233',
    productsOffered: [
      { productType: 'Double W-Beam', price: 520 },
      { productType: 'White', price: 310 },
      { productType: 'Yellow', price: 310 }
    ]
  },
  {
    name: 'Markwell Coatings',
    location: 'Chennai',
    contact: '9876509876',
    productsOffered: [
      { productType: 'White', price: 260 },
      { productType: 'Yellow', price: 280 },
      { productType: 'Reflective', price: 360 }
    ]
  },
  {
    name: 'Highway Essentials',
    location: 'Delhi',
    contact: '9810098100',
    productsOffered: [
      { productType: 'Directional', price: 320 },
      { productType: 'Informational', price: 320 },
      { productType: 'Cautionary', price: 320 },
      { productType: 'Reflective', price: 390 }
    ]
  },
  {
    name: 'RoadShield Engineering',
    location: 'Jaipur',
    contact: '9800000009',
    productsOffered: [
      { productType: 'W-Beam', price: 430 },
      { productType: 'Thrie-Beam', price: 470 },
      { productType: 'Directional', price: 330 },
      { productType: 'Informational', price: 330 },
      { productType: 'Cautionary', price: 330 }
    ]
  },
  {
    name: 'InfraSafe Manufacturing',
    location: 'Surat',
    contact: '9876789098',
    productsOffered: [
      { productType: 'W-Beam', price: 440 },
      { productType: 'White', price: 300 },
      { productType: 'Yellow', price: 300 }
    ]
  },
  {
    name: 'MetalGuard Ltd',
    location: 'Indore',
    contact: '9922245678',
    productsOffered: [
      { productType: 'Crash-Tested', price: 580 }
    ]
  },
  {
    name: 'RoadPro India',
    location: 'Lucknow',
    contact: '9898989898',
    productsOffered: [
      { productType: 'Directional', price: 310 },
      { productType: 'Informational', price: 310 },
      { productType: 'Cautionary', price: 310 }
    ]
  },
  {
    name: 'SmartRoad Systems',
    location: 'Kochi',
    contact: '9833344444',
    productsOffered: [
      { productType: 'White', price: 290 },
      { productType: 'Yellow', price: 290 },
      { productType: 'Directional', price: 300 },
      { productType: 'Informational', price: 300 },
      { productType: 'Cautionary', price: 300 }
    ]
  },
  {
    name: 'BarrierMaster Pvt Ltd',
    location: 'Chandigarh',
    contact: '9812345678',
    productsOffered: [
      { productType: 'W-Beam', price: 440 },
      { productType: 'Crash-Tested', price: 550 }
    ]
  }
];

async function seedData() {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    await Product.deleteMany({});
    await Manufacturer.deleteMany({});
    console.log('✅ Cleared existing products and manufacturers');

    // Insert products
    await Product.insertMany(productsData);
    console.log(`✅ Seeded ${productsData.length} products`);

    // Insert manufacturers
    await Manufacturer.insertMany(manufacturersData);
    console.log(`✅ Seeded ${manufacturersData.length} manufacturers`);

    console.log('✅ All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
