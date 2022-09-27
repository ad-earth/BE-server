const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const AdminSchema = new Schema({
  a_Idx: { type: Number, required: true, unique: true },
  a_Id: { type: String, required: true },
  a_Pw: { type: String, required: true },
  a_Brand: { type: String, required: true },
  a_Number: { type: String, required: true },
  a_Phone: { type: String, default: null },
  a_Charge: { type: Number, default: null },
  createdAt: { type: Date, required: true },
});

module.exports = mongoose.model('Admin', AdminSchema);
