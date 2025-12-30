const mongoose = require('mongoose');
const { dbConnect } = require('../utiles/db');
const productModel = require('../models/productModel');
require('dotenv').config({ path: '../.env' });

const run = async () => {
  try {
    await dbConnect();
    const result = await productModel.deleteMany({});
    console.log(`Deleted products: ${result.deletedCount}`);
  } catch (err) {
    console.error('Error clearing products:', err.message);
  } finally {
    await mongoose.connection.close();
  }
};

run();
