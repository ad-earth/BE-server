const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const ReviewSchema = new Schema({
  r_No: { type: Number, required: true, unique: true },
  u_Idx: { type: Number, required: true },
  u_Id: { type: String, required: true },
  p_No: { type: Number, required: true },
  o_No: { type: Number, required: false },
  r_Score: { type: Number, required: true },
  r_Content: { type: String, required: true },
  createdAt: { type: Date, required: true },
});

module.exports = mongoose.model('Review', ReviewSchema);
