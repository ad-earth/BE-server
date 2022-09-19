const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const DeliverySchema = new Schema({
  d_No: { type: Number, required: true, unique: true },
  u_Idx: { type: Number, required: true },
  d_Name: { type: String, required: true },
  d_Phone: { type: String, required: true },
  d_Address1: { type: String, required: true },
  d_Address2: { type: String, required: true },
});

module.exports = mongoose.model('Delivery', DeliverySchema);
