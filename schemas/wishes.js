const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const WishSchema = new Schema({
  u_Idx: { type: Number, required: true },
  p_No: { type: Number, required: true },
});

module.exports = mongoose.model('Wish', WishSchema);
