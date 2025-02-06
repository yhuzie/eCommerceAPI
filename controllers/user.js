const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../auth");

const { errorHandler } = require("../auth");

// User registration
module.exports.registerUser = (req, res) => {
  // Checks if the email is in the right format
  if (!req.body.email.includes("@")) {
    // if the email is not in the right format, send a message 'Invalid email format'.
    return res.status(400).send({ message: "Invalid email format" });
  }
  // Checks if the mobile number has the correct number of characters
  else if (req.body.mobileNo.length !== 11) {
    // if the mobile number is not in the correct number of characters, send a message 'Mobile number is invalid'.
    return res.status(400).send({ error: "Mobile number invalid" });
  }
  // Checks if the password has atleast 8 characters
  else if (req.body.password.length < 8) {
    // If the password is not atleast 8 characters, send a message 'Password must be atleast 8 characters long'.
    return res
      .status(400)
      .send({ error: "Password must be atleast 8 characters" });
    // If all needed requirements are achieved
  } else {
    let newUser = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      mobileNo: req.body.mobileNo,
      password: bcrypt.hashSync(req.body.password, 10),
    });

    return (
      newUser
        .save()
        // if all needed requirements are achieved, send a success message 'User registered successfully' and return the newly created user.
        .then((result) =>
          res.status(201).send({
            message: "Registered Successfully",
          })
        )
        .catch((error) => errorHandler(error, req, res))
    );
  }
};

// User authentication (login)
module.exports.loginUser = (req, res) => {
  if (req.body.email.includes("@")) {
    return User.findOne({ email: req.body.email })
      .then((result) => {
        if (!result) {
          return res.status(404).send({ error: "No email found" });
        }
        const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);
        if (isPasswordCorrect) {
          res.status(200).send({
            access: auth.createAccessToken(result),
            user: { _id: result._id, isAdmin: result.isAdmin },
          });
        } else {
          res.status(401).send({ message: "Email and password do not match" });
        }
      })
      .catch((error) => errorHandler(error, req, res));
  } else {
    return res.status(400).send({ message: "Invalid Email" });
  }
};


// Retrieve user details (profile)
module.exports.getProfile = (req, res) => {
  return User.findById(req.user.id)
    .lean()
    .then((user) => {
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }

      const { _id, firstName, lastName, email, isAdmin, mobileNo, __v } = user;

      return res.status(200).send({
        user: { _id, firstName, lastName, email, isAdmin, mobileNo, __v },
      });
    })
    .catch((error) => errorHandler(error, req, res));
};

// Update user password
module.exports.updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    return res.status(201).send({ message: "Password reset successfully" });
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

// Set user as admin (admin only)

module.exports.updateUserAsAdmin = async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).send({ message: "Access denied" });
    }

    // Get the user ID from the route parameters
    const { id } = req.params;

    // Find the user by ID and update their admin status
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isAdmin: true }, // Update the isAdmin field to true
      { new: true } // Return the updated user document
    ).select("-password");

    // If user was not found, return a 404 error
    if (!updatedUser) {
      return res.status(404).send({ error: "User not found" });
    }

    // Return the updated user in the expected format
    res.status(200).send({
      updatedUser: updatedUser,
    });
  } catch (error) {
    res.status(500).send({
      error: "Failed in Find",
      details: {
        stringValue: error.stringValue,
        valueTYpe: error.valueType,
        kind: error.kind,
        value: error.value,
        path: error.path,
        reason: error.reason,
        name: error.name,
        message: error.message,
      },
    });
  }
};
