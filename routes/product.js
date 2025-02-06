const express = require("express");
const productController = require("../controllers/product");
const auth = require("../auth");
const { verify, verifyAdmin } = auth;

const router = express.Router();

// Add Product with Image Upload
router.post("/", verify, verifyAdmin, productController.addProduct);

router.get("/all", verify, verifyAdmin, productController.getAllProducts);
router.get("/active", productController.getAllActiveProducts);
router.get("/:productId", productController.getSingleProduct);
router.patch("/:productId/update", verify, verifyAdmin, productController.updateProduct);
router.patch("/:productId/archive", verify, verifyAdmin, productController.archiveProduct);
router.patch("/:productId/activate", verify, verifyAdmin, productController.activateProduct);

// Additional routes for search functionality
router.post("/search-by-name", productController.searchProductByName);
router.post("/search-by-price", productController.searchProductByPriceRange);

router.delete("/:productId/delete", verify, verifyAdmin, productController.deleteProduct);


module.exports = router;
