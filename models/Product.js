const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  imageUrl: { type: String }, // New field for storing the image URL
});

module.exports = mongoose.model("Product", productSchema);
