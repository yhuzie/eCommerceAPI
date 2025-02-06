const Product = require("../models/Product");
const { errorHandler } = require("../auth");
const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});

const upload = multer({ storage });

// Add Product with Image Upload
module.exports.addProduct = [
  upload.single("image"), // 'image' is the name of the form field for the file
  async (req, res) => {
    try {
      const { name, description, price } = req.body;
      if (!name || !description || !price) {
        return res.status(400).send({ success: false, message: "Missing required fields" });
      }

      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        return res.status(409).send({ success: false, message: "Product already exists" });
      }

      const newProduct = new Product({
        name,
        description,
        price,
        imageUrl: req.file ? req.file.path : null, // Save image path if file exists
      });

      const savedProduct = await newProduct.save();
      return res.status(201).send({ success: true, product: savedProduct });
    } catch (error) {
      return res.status(500).send({ success: false, message: "An error occurred", error: error.message });
    }
  }
];

// Existing functions in productController remain unchanged...



module.exports.getAllProducts = (req, res) => {
  return Product.find({})
    .then((result) => {
      // if the result is not empty, send status 200 and its result
      if (result.length > 0) {
        return res.status(200).send(result);
      } else {
        // 404 for not found products
        return res.status(404).send({ message: "No products found" });
      }
    })
    .catch((error) => errorHandler(error, req, res));
};

//[retrieve all product]
module.exports.getAllActiveProducts = (req, res) => {
  Product.find({ isActive: true })
    .then((result) => {
      if (result.length > 0) {
        // If there are active products, return the products.
        return res.status(200).send(result);
      } else {
        // If no active products are found, return 'No active products found'.
        return res.status(200).send({ message: "No active products found" });
      }
    })
    .catch((err) => res.status(500).send(err));
};

//[retrieve specific product]
module.exports.getSingleProduct = (req, res) => {
  Product.findById(req.params.productId)
    .then((product) => {
      if (product) {
        // If the product is found, return the product.
        return res.status(200).send(product);
      } else {
        // If the product is not found, return 'Product not found'.
        return res.status(404).send({ message: "Product not found" });
      }
    })
    .catch((error) => errorHandler(error, req, res));
};

//[update product]
module.exports.updateProduct = (req, res) => {
  let updatedProduct = {
    name: req.body.name,
    description: req.body.description,
    price: req.body.price,
  };

  return Product.findByIdAndUpdate(req.params.productId, updatedProduct, {
    new: true,
  })
    .then((product) => {
      if (product) {
        // If the product is found and updated, send a success message.
        res
          .status(200)
          .send({ success: true, message: "Product updated successfully" });
      } else {
        // If the product is not found, return 'Product not found'.
        res.status(404).send({ error: "Product not found" });
      }
    })
    .catch((error) => res.status(500).send({ error: error.message }));
};

//[archive product]
module.exports.archiveProduct = async (req, res) => {
  try {
    // First, find the product by ID to check its current status
    const product = await Product.findById(req.params.productId);

    if (!product) {
      // If the product is not found, return 'Product not found' with "error" key.
      return res.status(404).send({ error: "Product not found" });
    }

    // Check if the product is already archived
    if (!product.isActive) {
      return res.status(200).send({
        message: "Product already archived",
        archivedProduct: product, // Include the archived product in the response
      });
    }

    // If the product is active, update it to archive it
    product.isActive = false;
    await product.save();

    // If the product is successfully archived, send a success message.
    return res.status(200).send({
      success: true,
      message: "Product archived successfully",
    });
  } catch (error) {
    // Handle any errors that occur
    return errorHandler(error, req, res);
  }
};

//[activate product]
module.exports.activateProduct = async (req, res) => {
  try {
    // First, find the product by ID to check its current status
    const product = await Product.findById(req.params.productId);

    if (!product) {
      // If the product is not found, return 'Product not found' with "error" key.
      return res.status(404).send({ error: "Product not found" });
    }

    // Check if the product is already active
    if (product.isActive) {
      return res.status(200).send({
        message: "Product already active",
        activateProduct: product, // Wrap the product object inside "activateProduct"
      });
    }

    // If the product is not active, activate it
    product.isActive = true;
    await product.save();

    // If the product is successfully activated, send a success message.
    return res.status(200).send({
      success: true,
      message: "Product activated successfully",
    });
  } catch (error) {
    // Handle any errors that occur
    return errorHandler(error, req, res);
  }
};

// [create a controller that allows users to search products by name]
module.exports.searchProductByName = async (req, res) => {
  try {
    const { name } = req.body;

    // Validate that name is a string and not empty
    if (typeof name !== "string" || name.trim() === "") {
      return res.status(400).json({
        error: {
          message: "Invalid 'name' parameter. It must be a non-empty string.",
          errorCode: 1,
        },
      });
    }

    // Search for products
    const foundProducts = await Product.find({
      name: { $regex: name, $options: "i" },
    });

    // Check if any products were found
    if (foundProducts.length === 0) {
      return res.status(404).json({
        message: "No products found.",
      });
    }

    // Respond with found products
    return res.status(200).json(foundProducts);
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// [create a controller that allow users to search products by price range]
module.exports.searchProductByPriceRange = async (req, res) => {
  try {
    const { minPrice, maxPrice } = req.body;

    // Validate that minPrice and maxPrice are numbers
    if (
      typeof minPrice !== "number" ||
      typeof maxPrice !== "number" ||
      isNaN(minPrice) ||
      isNaN(maxPrice)
    ) {
      return res.status(400).json({
        error: {
          message:
            "Invalid 'minPrice' and/or 'maxPrice' parameters. They must be numbers.",
          errorCode: 1,
        },
      });
    }

    // Search for products
    const foundProducts = await Product.find({
      price: { $gte: minPrice, $lte: maxPrice },
    });

    // Check if any products were found
    if (foundProducts.length === 0) {
      return res.status(404).json({
        message: "No products found.",
      });
    }

    // Respond with found products
    return res.status(200).json(foundProducts);
  } catch (error) {
    return errorHandler(error, req, res);
  }
};


// [Delete product]
module.exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Product.findByIdAndDelete(productId);
    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "An error occurred", error: error.message });
  }
};


module.exports.updateProduct = [
  upload.single("image"), // Use multer to handle the file upload for "image"
  async (req, res) => {
    try {
      const productId = req.params.productId;
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).send({ success: false, message: "Product not found" });
      }

      // Update the product fields from the request body
      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;

      // If an image file was uploaded, update the image URL
      if (req.file) {
        product.imageUrl = req.file.path; // `imageUrl` will store the file path
      }

      const updatedProduct = await product.save();
      res.status(200).send({ success: true, product: updatedProduct });
    } catch (error) {
      res.status(500).send({ success: false, message: "Error updating product", error: error.message });
    }
  },
];