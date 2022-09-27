const mongoose = require('mongoose');

const { Schema } = mongoose;

require('dotenv').config();

const UserSchema = new Schema({
  u_Idx: { type: Number, required: true, unique: true },
  u_Id: { type: String, required: true },
  u_Pw: { type: String, required: true },
  u_Name: { type: String, default: null },
  u_Phone: { type: String, default: null },
  u_Gender: { type: String, required: true },
  u_Address1: { type: String, required: true },
  u_Address2: { type: String, required: true },
  u_Img: { type: String, default: null },
  createdAt: { type: Date, required: true },
});

module.exports = mongoose.model('User', UserSchema);
