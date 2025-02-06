const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product"); // Assuming you have a Product model

// Controller function for order checkout
module.exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItems, totalPrice } = req.body;

    if (!totalPrice) {
      return res.status(400).json({ success: false, message: "Total price is required." });
    }

    // Create the order with `productsOrdered` instead of `cartItems`
    const order = new Order({
      userId,
      productsOrdered: cartItems, // Renamed to match the schema
      totalPrice: totalPrice
    });

    // Save the order in the database
    await order.save();

    // Send success response
    res.status(200).json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
};

// Controller function for order retrieval of specific user
module.exports.retrieveOrder = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate({
      path: 'productsOrdered.productId', // Populates productId with product details
      select: 'name' // Only select the name field of the product
    });

    // Format the response to match the desired output structure
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      userId: order.userId,
      productsOrdered: order.productsOrdered.map((product) => ({
        productId: product.productId._id,
        productName: product.productId.name, // Include the product name
        quantity: product.quantity,
        subtotal: product.subtotal,
        _id: product._id,
      })),
      totalPrice: order.totalPrice,
      status: order.status,
      orderedOn: order.orderedOn
    }));

    res.status(200).json({ orders: formattedOrders });
  } catch (error) {
    console.error("Order Retrieval Error: ", error.message);
    res.status(500).json({ error: "An error occurred while retrieving the orders" });
  }
};

// Controller function for order retrieval of all users
module.exports.retrieveAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate({
      path: 'productsOrdered.productId', // Populates productId with product details
      select: 'name' // Only select the name field of the product
    });

    // Map orders to desired output structure
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      userId: order.userId,
      productsOrdered: order.productsOrdered.map((product) => ({
        productId: product.productId._id,
        productName: product.productId.name, // Include the product name
        quantity: product.quantity,
        subtotal: product.subtotal,
        _id: product._id
      })),
      totalPrice: order.totalPrice,
      status: order.status,
      orderedOn: order.orderedOn,
      __v: order.__v || 0
    }));

    res.status(200).json({ orders: formattedOrders });
  } catch (error) {
    console.error("Order Retrieval Error: ", error.message);
    res.status(500).json({ error: "An error occurred while retrieving the orders" });
  }
};
