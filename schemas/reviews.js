const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const ReviewSchema = new Schema({
  r_No: { type: Number, required: true, unique: true },
  u_Idx: { type: Number, required: true },
  p_No: { type: Number, required: true },
  o_No: { type: Number, required: false },
  r_Score: { type: Object, required: true },
  r_Content: { type: String, required: true },
  createdAt: { type: String, required: true },
});

module.exports = mongoose.model('Review', ReviewSchema);