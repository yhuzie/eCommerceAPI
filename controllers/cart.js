const Cart = require("../models/Cart");
const Product = require("../models/Product");
const { errorHandler } = require("../auth");

// [get cart, allow users to get cart]
module.exports.getCart = async (req, res) => {
  const userId = req.user.id;
  try {
    const cart = await Cart.findOne({ userId }).populate("cartItems.productId", "name price");

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    let totalPrice = 0;
    const cartItems = cart.cartItems.map(item => {
      const subTotal = item.productId.price * item.quantity;
      totalPrice += subTotal;

      return {
        productId: {
          _id: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
        },
        quantity: item.quantity,
        subtotal: subTotal,
        _id: item._id,
      };
    });

    res.status(200).json({
      success: true,
      cart: { _id: cart._id, userId: cart.userId, cartItems, totalPrice, orderedOn: cart.orderedOn }
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// [add to cart, allow users to add to cart]
module.exports.addCart = async (req, res) => {
  const { productId, quantity, subtotal } = req.body;
  const userId = req.user.id;

  if (!productId || !quantity || !subtotal) {
    return res.status(400).json({
      success: false,
      message: "All fields (productId, quantity, subtotal) are required",
    });
  }

  try {
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({
        userId,
        cartItems: [{ productId, quantity, subtotal }],
        totalPrice: subtotal,
      });
    } else {
      const cartItem = cart.cartItems.find(
        (item) => item.productId.toString() === productId
      );

      if (cartItem) {
        cartItem.quantity += quantity;
        cartItem.subtotal += subtotal;
      } else {
        cart.cartItems.push({ productId, quantity, subtotal });
      }

      cart.totalPrice = cart.cartItems.reduce(
        (acc, item) => acc + item.subtotal,
        0
      );
    }

    await cart.save();
    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// [update quantity, allow users to update quantity]
module.exports.updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, newQuantity } = req.body;

    console.log("Updating quantity for product:", productId, "to new quantity:", newQuantity);

    if (newQuantity <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than zero." });
    }

    // Find the user's cart and populate product details
    const cart = await Cart.findOne({ userId }).populate("cartItems.productId", "name price");

    if (!cart) {
      console.log("Cart not found for user:", userId);
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    // Find the item in the cart
    const cartItem = cart.cartItems.find(item => item.productId._id.toString() === productId);

    if (!cartItem) {
      console.log("Item not found in cart for productId:", productId);
      return res.status(404).json({ success: false, message: "Item not found in cart." });
    }

    console.log("Cart item before update:", cartItem);

    // Ensure the price is available before updating the subtotal
    if (typeof cartItem.productId.price !== 'number') {
      console.log("Price not found or invalid for product:", cartItem.productId);
      return res.status(500).json({ success: false, message: "Product price not available or invalid." });
    }

    // Update the quantity and subtotal for the cart item
    cartItem.quantity = newQuantity;
    cartItem.subtotal = cartItem.quantity * cartItem.productId.price;

    // Recalculate the total price for the cart
    cart.totalPrice = cart.cartItems.reduce((total, item) => total + item.subtotal, 0);

    // Save the updated cart
    await cart.save();

    console.log("Cart updated successfully with new total price:", cart.totalPrice);

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      newTotalPrice: cart.totalPrice,
    });
  } catch (error) {
    console.error("Update quantity error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};






// [remove item from cart]
module.exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Item not found in cart." });
    }

    const cartItem = cart.cartItems.find(
      (item) => item.productId.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Item not found in cart." });
    }

    cart.cartItems = cart.cartItems.filter(
      (item) => item.productId.toString() !== productId
    );

    cart.totalPrice = cart.cartItems.reduce(
      (total, item) => total + item.subtotal,
      0
    );

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully",
      newTotalPrice: cart.totalPrice,
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
};

// [clear cart]
module.exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    cart.cartItems = [];
    cart.totalPrice = 0;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      newTotalPrice: 0,
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
};
