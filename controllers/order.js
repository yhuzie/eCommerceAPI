const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product"); // Assuming you have a Product model

// Controller function for order checkout
module.exports.checkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cartItems, totalPrice } = req.body;

    // Validation for cartItems and totalPrice
    if (!cartItems || !cartItems.length) {
      return res.status(400).json({ success: false, message: "Cart items are required." });
    }

    if (!totalPrice) {
      return res.status(400).json({ success: false, message: "Total price is required." });
    }

    // Ensure that all cartItems are valid products by checking productId
    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product with ID ${item.productId} not found.` });
      }
    }

    // Create the order with `productsOrdered` instead of `cartItems`
    const order = new Order({
      userId,
      productsOrdered: cartItems, // Renamed to match the schema
      totalPrice: totalPrice,
      status: "pending", // Set initial order status (could be other values like 'processing', etc.)
    });

    // Save the order in the database
    await order.save();

    // Send success response
    res.status(200).json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ success: false, message: "Failed to place order", error: error.message });
  }
};

// Controller function for order retrieval of specific user
module.exports.retrieveOrder = async (req, res) => {
  try {
    // Fetch orders and populate the product details using productId
    const orders = await Order.find({ userId: req.user.id }).populate({
      path: 'productsOrdered.productId', // Populates productId with product details
      select: 'name' // Only select the name field of the product
    });

    // Format the response to match the desired output structure
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      userId: order.userId,
      productsOrdered: order.productsOrdered.map((product) => {
        // Check if product.productId is valid (not null)
        if (product.productId) {
          return {
            productId: product.productId._id,
            productName: product.productId.name, // Include the product name
            quantity: product.quantity,
            subtotal: product.subtotal,
            _id: product._id,
          };
        } else {
          // Handle missing productId (perhaps log or return a default object)
          console.warn(`Product ID is missing for order ${order._id}, skipping.`);
          return {
            productId: null,
            productName: 'Unknown Product', // Fallback value
            quantity: product.quantity,
            subtotal: product.subtotal,
            _id: product._id,
          };
        }
      }),
      totalPrice: order.totalPrice,
      status: order.status,
      orderedOn: order.orderedOn
    }));

    res.status(200).json({ orders: formattedOrders });
  } catch (error) {
    console.error("Order Retrieval Error: ", error.message);
    res.status(500).json({ error: "An error occurred while retrieving the orders", details: error.message });
  }
};

// Controller function for order retrieval of all users
module.exports.retrieveAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate({
      path: 'productsOrdered.productId', // Populates productId with product details
      select: 'name' // Only select the name field of the product
    });

    // Map orders to desired output structure with null checks
    const formattedOrders = orders.map((order) => ({
      _id: order._id,
      userId: order.userId,
      productsOrdered: order.productsOrdered.map((product) => {
        // Check if productId exists
        const productId = product.productId;
        if (!productId) {
          // Handle case where productId is null or not found
          console.error(`Product not found for order: ${order._id}`);
          return {
            productId: null,
            productName: 'Product Not Found',
            quantity: product.quantity,
            subtotal: product.subtotal,
            _id: product._id
          };
        }
        return {
          productId: productId._id,
          productName: productId.name, // Include the product name
          quantity: product.quantity,
          subtotal: product.subtotal,
          _id: product._id
        };
      }),
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

