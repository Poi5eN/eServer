const Collection = require('../models/adminModel')
const getDataUri = require('../utils/dataUri')
const { hashPassword } = require('./authController')
const cloudinary = require('cloudinary')
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/email')

exports.createAdmin = async (req, res) => {
  try {
    const { email, password, ...userFields } = req.body;
    const file = req.file;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please fill the required fields',
      });
    } else {
      const userExist = await Collection.findOne({ email });

      if (userExist) {
        res.send({
          success: false,
          message: 'User already exists with this email',
        });
      } else {
        const hashedPassword = await hashPassword(password);
        let imageObj = {}

        if (req.file) {
          const fileUri = getDataUri(file);
          const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
          imageObj.public_id =  mycloud.public_id,
          imageObj.url = mycloud.secure_url
        }

        const schoolId = uuidv4();

        let data = await Collection.create({
          schoolId: schoolId,
          email: email,
          password: hashedPassword,
          image: imageObj,
          ...userFields,
        });

        if (data) {
          const emailContent = `
          <p>Your EmailID: ${data.email}</p>
          <p>Your Password: ${password}</p>
          `;

          sendEmail(data.email, 'Your Login Credentials', emailContent)
            .then(() => {
              res.status(201).send({ success: true, message: 'Admin created Successfully' });
            })
            .catch((error) => {
              console.error('Error sending email:', error);
              res.status(500).send({ success: false, message: error.message });
            });

        } else {
          res.send({ success: false, message: 'Admin is not created' });
        }
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: err.message });
  }
};


// In your superadmin controller file

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await Collection.find(); // Fetch all admins

    if (!admins) {
      return res.status(404).json({
        success: false,
        message: "No admins found",
      });
    }

    res.status(200).json({
      success: true,
      admins, // Send all admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch admins due to an error",
      error: error.message,
    });
  }
};


exports.updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params; // Assuming you pass adminId in the URL
    const { email, password, ...userFields } = req.body;
    const file = req.file;

    // Check if admin exists
    const admin = await Collection.findById(adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Update email if provided
    if (email) {
      admin.email = email;
    }

    // Handle password reset if provided
    if (password) {
      const hashedPassword = await hashPassword(password);
      admin.password = hashedPassword;
    }

    // Handle profile picture update if file is provided
    if (file) {
      // Delete the old image from Cloudinary if it exists
      if (admin.image.public_id) {
        await cloudinary.v2.uploader.destroy(admin.image.public_id);
      }

      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

      admin.image = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      };
    }

    // Update other fields
    Object.assign(admin, userFields);

    // Save the updated admin
    await admin.save();

    // Send a confirmation email if email was updated
    if (email) {
      const emailContent = `
        <p>Your EmailID: ${admin.email}</p>
        ${password ? `<p>Your new Password: ${password}</p>` : ''}
      `;

      sendEmail(admin.email, 'Your Updated Login Credentials', emailContent)
        .then(() => {
          res.status(200).json({ success: true, message: 'Admin updated successfully' });
        })
        .catch((error) => {
          console.error('Error sending email:', error);
          res.status(500).json({ success: false, message: error.message });
        });
    } else {
      res.status(200).json({ success: true, message: 'Admin updated successfully' });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
};

