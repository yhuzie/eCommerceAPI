const express = require("express");
const cartController = require("../controllers/cart");
const { verify } = require("../auth");

const router = express.Router();

// [Get cart]
router.get("/get-cart", verify, cartController.getCart);

// [Add an item to the cart]
router.post("/add-to-cart", verify, cartController.addCart);

// [Update quantity]
router.patch("/update-cart-quantity", verify, cartController.updateCartQuantity);

// [Remove item from cart]
router.patch("/:productId/remove-from-cart", verify, cartController.removeFromCart);

// [Clear cart]
router.put("/clear-cart", verify, cartController.clearCart);

module.exports = router;
