const express = require("express");
const { verify } = require("../auth");
const orderController = require("../controllers/order");
const router = express.Router();

// [route to create an order]
router.post("/checkout", verify, orderController.checkout);

// [route to retrieved all users order]
router.get("/my-orders", verify, orderController.retrieveOrder);

// [route to retrieved all user's orders]
router.get("/all-orders", verify, orderController.retrieveAllOrders);

module.exports = router;
