const Collection = require('../models/adminModel')
const getDataUri = require('../utils/dataUri')
const { hashPassword } = require('./authController')
const cloudinary = require('cloudinary')
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/email')
// thirdPartyController.js
const ThirdPartyUser = require('../models/thirdPartyModel');


// Earlier Working
// exports.createAdmin = async (req, res) => {
//   try {
//     const { email, password, ...userFields } = req.body;
//     const file = req.file;

//     if (!email || !password) {
//       res.status(400).json({
//         success: false,
//         message: 'Please fill the required fields',
//       });
//     } else {
//       const userExist = await Collection.findOne({ email });

//       if (userExist) {
//         res.send({
//           success: false,
//           message: 'User already exists with this email',
//         });
//       } else {
//         const hashedPassword = await hashPassword(password);
//         let imageObj = {}

//         if (req.file) {
//           const fileUri = getDataUri(file);
//           const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
//           imageObj.public_id =  mycloud.public_id,
//           imageObj.url = mycloud.secure_url
//         }

//         const schoolId = uuidv4();

//         let data = await Collection.create({
//           schoolId: schoolId,
//           email: email,
//           password: hashedPassword,
//           image: imageObj,
//           ...userFields,
//         });

//         if (data) {
//           const emailContent = `
//           <p>Your EmailID: ${data.email}</p>
//           <p>Your Password: ${password}</p>
//           `;

//           sendEmail(data.email, 'Your Login Credentials', emailContent)
//             .then(() => {
//               res.status(201).send({ success: true, message: 'Admin created Successfully' });
//             })
//             .catch((error) => {
//               console.error('Error sending email:', error);
//               res.status(500).send({ success: false, message: error.message });
//             });

//         } else {
//           res.send({ success: false, message: 'Admin is not created' });
//         }
//       }
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500).send({ message: err.message });
//   }
// };

// In your createAdmin controller
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, ...userFields } = req.body;
    const file = req.file;

    if (!email || !password || !userFields.schoolName) {
      return res.status(400).json({
        success: false,
        message: 'Please fill all required fields',
      });
    }

    // Generate slug from school name
    const slug = userFields.schoolName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9-]/g, '');

    // Check for existing email or slug
    const existingAdmin = await Collection.findOne({
      $or: [{ email }, { slug }]
    });

    if (existingAdmin) {
      const conflictField = existingAdmin.email === email ? 'email' : 'school name';
      return res.status(409).json({
        success: false,
        message: `Admin with this ${conflictField} already exists`,
      });
    }

    const hashedPassword = await hashPassword(password);
    let imageObj = {};

    if (file) {
      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
      imageObj = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url
      };
    }

    const schoolId = uuidv4();

    const data = await Collection.create({
      schoolId,
      email,
      password: hashedPassword,
      image: imageObj,
      slug,
      ...userFields,
    });

    const emailContent = `
      <p>Your Login URL: https://eshikshamitra.netlify.app/${slug}</p>
      <p>Email: ${data.email}</p>
      <p>Password: ${password}</p>
    `;

    await sendEmail(data.email, 'Your School Portal Credentials', emailContent);
    
    res.status(201).json({ 
      success: true, 
      message: 'Admin created successfully',
      admin: data
    });

  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to create admin'
    });
  }
};

// In your updateAdmin controller
exports.updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { email, password, ...userFields } = req.body;
    const file = req.file;

    const admin = await Collection.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Handle slug regeneration if school name changes
    if (userFields.schoolName && userFields.schoolName !== admin.schoolName) {
      const newSlug = userFields.schoolName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9-]/g, '');

      const existingSlug = await Collection.findOne({
        slug: newSlug,
        _id: { $ne: adminId }
      });

      if (existingSlug) {
        return res.status(409).json({
          success: false,
          message: 'School name is already taken',
        });
      }

      userFields.slug = newSlug;
    }

    // Handle email conflict check
    if (email && email !== admin.email) {
      const emailExists = await Collection.findOne({ email });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists',
        });
      }
      admin.email = email;
    }

    // Update password if provided
    if (password) {
      admin.password = await hashPassword(password);
    }

    // Handle image update
    if (file) {
      if (admin.image.public_id) {
        await cloudinary.v2.uploader.destroy(admin.image.public_id);
      }
      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);
      admin.image = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url
      };
    }

    // Update other fields
    Object.keys(userFields).forEach(key => {
      admin[key] = userFields[key];
    });

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      admin
    });

  } catch (err) {
    console.error('Error updating admin:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Failed to update admin'
    });
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


// exports.updateAdmin = async (req, res) => {
//   try {
//     const { adminId } = req.params; // Assuming you pass adminId in the URL
//     const { email, password, ...userFields } = req.body;
//     const file = req.file;

//     // Check if admin exists
//     const admin = await Collection.findById(adminId);

//     if (!admin) {
//       return res.status(404).json({
//         success: false,
//         message: 'Admin not found',
//       });
//     }

//     // Update email if provided
//     if (email) {
//       admin.email = email;
//     }

//     // Handle password reset if provided
//     if (password) {
//       const hashedPassword = await hashPassword(password);
//       admin.password = hashedPassword;
//     }

//     // Handle profile picture update if file is provided
//     if (file) {
//       // Delete the old image from Cloudinary if it exists
//       if (admin.image.public_id) {
//         await cloudinary.v2.uploader.destroy(admin.image.public_id);
//       }

//       const fileUri = getDataUri(file);
//       const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

//       admin.image = {
//         public_id: mycloud.public_id,
//         url: mycloud.secure_url,
//       };
//     }

//     // Update other fields
//     Object.assign(admin, userFields);

//     // Save the updated admin
//     await admin.save();

//     // Send a confirmation email if email was updated
//     if (email) {
//       const emailContent = `
//         <p>Your EmailID: ${admin.email}</p>
//         ${password ? `<p>Your new Password: ${password}</p>` : ''}
//       `;

//       sendEmail(admin.email, 'Your Updated Login Credentials', emailContent)
//         .then(() => {
//           res.status(200).json({ success: true, message: 'Admin updated successfully' });
//         })
//         .catch((error) => {
//           console.error('Error sending email:', error);
//           res.status(500).json({ success: false, message: error.message });
//         });
//     } else {
//       res.status(200).json({ success: true, message: 'Admin updated successfully' });
//     }
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: err.message });
//   }
// };




// In your admin controller
exports.getAdminBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    // Find admin by slug (case-insensitive)
    const admin = await Admin.findOne({ 
      slug: { $regex: new RegExp(`^${slug}$`, 'i') } 
    });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.status(200).json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};







exports.createThirdPartyUser = async (req, res) => {
  try {
      // Log the authenticated user information
      console.log('Authenticated user:', req.user);

      const { name, email, password, assignedSchools } = req.body;

      // Validate required fields
      if (!name || !email || !password || !assignedSchools || !assignedSchools.length) {
          return res.status(400).json({
              success: false,
              message: 'Please provide all required fields'
          });
      }

      // Check if user exists
      const userExists = await ThirdPartyUser.findOne({ email });
      if (userExists) {
          return res.status(400).json({
              success: false,
              message: 'User already exists with this email'
          });
      }

      const hashedPassword = await hashPassword(password);
      const userId = uuidv4();

      // Create third party user without relying on req.user.userId
      const thirdPartyUser = await ThirdPartyUser.create({
          userId,
          name,
          email,
          password: hashedPassword,
          assignedSchools,
          createdBy: req.user?.schoolId || 'SUPERADMIN' // Use schoolId or default to 'SUPERADMIN'
      });

      // Prepare email content
      const emailContent = `
          <p>Your account has been created as a Third Party Registration Handler</p>
          <p>Email: ${email}</p>
          <p>Password: ${password}</p>
          <p>Assigned Schools:</p>
          ${assignedSchools.map(school => `<p>- ${school.schoolName}</p>`).join('')}
      `;

      // Send email
      await sendEmail(email, 'Third Party Registration Account Credentials', emailContent);

      // Remove sensitive data from response
      const userResponse = thirdPartyUser.toObject();
      delete userResponse.password;

      res.status(201).json({
          success: true,
          message: 'Third party user created successfully',
          user: userResponse
      });

  } catch (error) {
      console.error('Error creating third party user:', error);
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};

// Middleware to check if user is superadmin
exports.isSuperAdmin = async (req, res, next) => {
  try {
      // Log the authenticated user information
      console.log('Checking superadmin status for user:', req.user);

      // Check if user exists and has role property
      if (!req.user || !req.user.role) {
          return res.status(401).json({
              success: false,
              message: "Authentication required"
          });
      }

      // Check if role is superadmin
      if (req.user.role !== 'superadmin') {
          return res.status(403).json({
              success: false,
              message: "Access denied. Only superadmin can perform this action."
          });
      }

      next();
  } catch (error) {
      console.error('Error in isSuperAdmin middleware:', error);
      res.status(500).json({
          success: false,
          message: error.message
      });
  }
};





