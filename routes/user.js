// user routes for Capstone Project
const express = require("express");
const userController = require("../controllers/user");
const { verify, verifyAdmin } = require("../auth");

const router = express.Router();

// User registration
router.post("/register", userController.registerUser);

// User login
router.post("/login", userController.loginUser);

// Get user profile (protected route)
router.get("/details", verify, userController.getProfile);

// Update password (protected route)
router.patch("/update-password", verify, userController.updatePassword);

// Make user admin (admin-only route)
router.patch(
  "/:id/set-as-admin",
  verify,
  verifyAdmin,
  userController.updateUserAsAdmin
);

module.exports = router;
