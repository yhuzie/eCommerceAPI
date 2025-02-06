// [Dependencies and Modules]
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// [Routes]
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000", // for local development
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));

// Set up static file serving for uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// [Database Connection]
const mongoURI = process.env.MONGO_URI || "mongodb+srv://admin123:admin123@wdc028-b461.2niyc.mongodb.net/eCommerceAPI?retryWrites=true&w=majority&appName=WDC028-B461";

mongoose
  .connect(mongoURI)
  .then(() => console.log("Now connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// [Routes]
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API is now online on port ${PORT}`);
  });
}

module.exports = { app, mongoose };
