const Collection = require("../models/adminModel");
const FeeStructure = require("../models/feeStructureModel");
const Teacher = require("../models/teacherModel");
const cloudinary = require("cloudinary");
const getDataUri = require("../utils/dataUri");
const sendEmail = require("../utils/email");

const {
  setTokenCookie,
  hashPassword,
  createToken,
  verifyPassword,
  fetchTokenFromCookie,
} = require("./authController");
const { v4: uuidv4 } = require("uuid");
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const teacherModel = require("../models/teacherModel");
const BookModel = require("../models/bookModel");
const ItemModel = require("../models/inventoryItemModel");
const NewRegistrationModel = require("../models/newRegistrationModel");
const NewStudentModel = require("../models/newStudentModel");
const ParentModel = require("../models/parentModel");
const EmployeeModel = require("../models/employeeModel");
const FeeStatus = require("../models/feeStatus");
// const classModel = require("../models/classModel");
const classModel = require("../models/classModel");
const NoticeModel = require("../models/noticeModel");
const CurriculumModel = require("../models/curriculumModel");
const AssignmentModel = require("../models/assignmentModel");
const issueBookModel = require("../models/issueBookModel");
const AdminInfo = require("../models/adminModel");


// Admin controller
exports.getAdminInfo = async (req, res) => {
  try {
    const admin = await AdminInfo.findOne({ schoolId: req.user.schoolId });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "school Id is not correct",
      });
    }

    res.status(200).json({
      success: true,
      message: "Admin details fetched is successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Admin Details is not get Successfully Due to error",
      error: error.message,
    });
  }
};


// START OF TEACHER CREATION
function generateEmployeeId() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let employeeId = '';

  for (let i = 0; i < 3; i++) {
    employeeId += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  for (let i = 0; i < 3; i++) {
    employeeId += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return employeeId;
}


exports.createTeacher = async (req, res) => {
  try {
    const { email, password, ...userFields } = req.body;

    const file = req.file;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill the required fields",
      });
    }

    const userExist = await Teacher.findOne({ email });

    if (userExist) {
      return res.status(400).send({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await hashPassword(password);

    const fileUri = getDataUri(file);

    const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

    const employeeId = generateEmployeeId();

    const data = await Teacher.create({
      schoolId: req.user.schoolId,
      email: email,
      password: hashedPassword,
      employeeId: employeeId,
      image: {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      },
      ...userFields,
    });

    if (data) {
      const emailContent = `
        <p>Your EmailID: ${email}</p>
        <p>Your Password: ${password}</p>
        <p>Your Employee ID: ${employeeId}</p>
      `;

      sendEmail(email, "Teacher Login Credentials", emailContent)
        .then(() => {
          console.log("Teacher created and message sent to teacher email ID");
        })
        .catch((error) => {
          return res
            .status(500)
            .json({ success: false, message: "Error sending email to teacher email ID" });
        });
    } else {
      return res.status(500).json({ success: false, message: "Teacher is not created" });
    }

    res.status(201).send({
      success: true,
      message: "Teacher created successfully",
    });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
};

exports.deactivateTeacher = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body);

    const deactivateTeacher = await Teacher.findOneAndUpdate(
      {
        schoolId: req.user.schoolId,
        email: email,
      },
      { $set: { status: "deactivated" } },
      { new: true }
    );

    if (deactivateTeacher) {
      res.json({
        status: true,
        message: "Teacher is deactivated",
        teacher: deactivateTeacher,
      });
    } else {
      res.status(404).json({
        status: false,
        message: "Teacher not found",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { email, ...updateFields } = req.body;
    console.log("body", req.body);
    const file = req.file;
    console.log("file", req.file);
    console.log("Image", file);

    const existingTeacher = await Teacher.findOne({
      email: email,
      schoolId: req.user.schoolId,
    });

    if (!existingTeacher) {
      return res.status(404).json({
        status: false,
        message: "Teacher not found",
      });
    }

    if (file) {
      const fileUri = getDataUri(file);
      const mycloud = await cloudinary.uploader.upload(fileUri.content);

      existingTeacher.image = {
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      };
    }

    for (const key in updateFields) {
      console.log(key);
      existingTeacher[key] = updateFields[key];
    }

    const updatedTeacher = await existingTeacher.save();

    res.json({
      status: true,
      message: "Teacher is updated",
      teacher: updatedTeacher,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.getAllTeachers = async (req, res) => {
  try {
    const { email } = req.query;

    let filter = {
      ...(email ? { email: email } : {}),
    };

    const teachers = await Teacher.find({
      ...filter,
      schoolId: req.user.schoolId,
      status: "active",
    });

    res.status(200).json({ success: true, data: teachers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a fee structure for a class
exports.createFeeStructure = async (req, res) => {
  try {
    const { className, feeType, amount } = req.body;

    // Check if a regular fee already exists for this class and fee type
    const feesExist = await FeeStructure.findOne({
      schoolId: req.user.schoolId,
      className,
      feeType,
      additional: false, // Only check for regular fees
    });

    if (feesExist) {
      return res.status(400).json({
        success: false,
        message: "Regular fee already exists for this class and fee type",
      });
    }

    const feeStructure = new FeeStructure({
      schoolId: req.user.schoolId,
      className,
      feeType,
      amount,
      additional: false, // Ensure this is marked as a regular fee
    });

    await feeStructure.save();

    return res
      .status(201)
      .json({ message: "Fee structure created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};


// Get fee structures for all classes in a school
exports.getAllFeeStructures = async (req, res) => {
  try {
    const { _id, className } = req.query;

    const filter = {
      ...(_id ? { _id: _id } : {}),
      ...(className ? { className: className } : {}),
    };

    const feeStructures = await FeeStructure.find({
      schoolId: req.user.schoolId,
      ...filter,
      additional: false,
    });
    res.status(200).json(feeStructures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateFees = async (req, res) => {
  try {
    const { feeStructureId } = req.params;
    // const { fees } = req.body;

    // Find the fee structure by ID
    const feeStructure = await FeeStructure.findByIdAndUpdate(
      feeStructureId,
      req.body
    );

    res.status(200).json(feeStructure);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFees = async (req, res) => {
  try {
    const { feeStructureId } = req.params;
    console.log(feeStructureId);

    const fees = await FeeStructure.findById({ _id: feeStructureId });

    // console.log(bookData);

    if (!fees) {
      return res.status(200).json({
        success: false,
        Message: "fees doesnot exist ",
      });
    }

    await FeeStructure.deleteOne({ _id: feeStructureId });

    res.status(200).json({
      success: true,
      Message: "fees deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createAdditionalFee = async (req, res) => {
  try {
    const { className, name, feeType, amount } = req.body;

    // Check if an additional fee already exists for this class, fee type, and name
    const feesExist = await FeeStructure.findOne({
      schoolId: req.user.schoolId,
      className,
      name,
      feeType,
      additional: true, // Only check for additional fees
    });

    if (feesExist) {
      return res.status(400).json({
        success: false,
        message: "Additional fee already exists for this class, fee type, and name",
      });
    }

    const feeStructure = new FeeStructure({
      schoolId: req.user.schoolId,
      className,
      name,
      feeType,
      amount,
      additional: true, // Ensure this is marked as an additional fee
    });

    await feeStructure.save();

    res.status(201).json({ message: "Additional fee structure created successfully" });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ message: error.message });
  }
};


// Get fee structures for all classes in a school
exports.getAllAdditionalFee = async (req, res) => {
  try {
    const { _id } = req.query;

    const filter = {
      ...(_id ? { _id: _id } : {}),
    };

    const feeStructures = await FeeStructure.find({
      ...filter,
      schoolId: req.user.schoolId,
      additional: true,
    });
    res.status(200).json(feeStructures);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllFees = async (req, res) => {
  try {
    const { _id, className } = req.query;

    const filter = {
      ...(_id ? { _id: _id } : {}),
      ...(className ? { className: className } : {}),
    };

    // Fetch both regular and additional fees
    const regularFees = await FeeStructure.find({
      schoolId: req.user.schoolId,
      ...filter,
      additional: false,
    });

    const additionalFees = await FeeStructure.find({
      schoolId: req.user.schoolId,
      ...filter,
      additional: true,
    });

    // Merge both regular and additional fees into one array
    const allFees = [...regularFees, ...additionalFees];

    res.status(200).json(allFees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// --------------------------------Book Controller

// Create a Book Details for a class

exports.createBookDetails = async (req, res) => {
  try {
    const { bookName, authorName, quantity, category, className, subject } =
      req.body;

    const existBook = await BookModel.find({
      schoolId: req.user.schoolID,
      bookName,
    });
    console.log("existBook", existBook);
    if (existBook.length < 0) {
      return res.status(400).json({
        success: false,
        message: "This book is already created",
      });
    }

    const bookDetails = new BookModel({
      schoolId: req.user.schoolId,
      bookName,
      authorName,
      quantity,
      category,
      className,
      subject,
    });
    await bookDetails.save();

    res.status(201).json({
      success: true,
      message: "Book Details created successfully",
      bookDetails,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get List of all books
exports.getAllBooks = async (req, res) => {
  try {
    const { _id } = req.query;
    console.log("REq.Body", req.query);

    const filter = {
      ...(_id ? { _id: _id } : {}),
    };

    const listOfAllBooks = await BookModel.find({
      ...filter,
      schoolId: req.user.schoolId,
    });

    res.status(200).json({
      success: true,
      message: "All Book fetch successfully",
      listOfAllBooks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book not fetched due to error",
      error: error.message,
    });
  }
};

// Delete Book
exports.deleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;

    const bookData = await BookModel.findById({ _id: bookId });

    if (!bookData) {
      return res.status(200).json({
        success: true,
        Message: "Book Not Exits Please Check",
      });
    }

    await BookModel.deleteOne({ _id: bookId });

    res.status(200).json({
      success: true,
      Message: "Book delete successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book details not deleted due to error",
      error: error.message,
    });
  }
};

// update Book
exports.updateBook = async (req, res) => {
  try {
    const { ...updateFields } = req.body;

    const { bookId } = req.params;

    const bookData = await BookModel.findById({ _id: bookId });

    if (!bookData) {
      return res.status(404).json({
        success: true,
        Message: "Book Details is not found",
      });
    }

    for (const key in updateFields) {
      bookData[key] = updateFields[key];
    }

    const updatedBookData = await bookData.save();

    res.status(201).json({
      success: true,
      message: "Book Details is updated",
      updatedBookData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book details is not update due to error Please fix first",
      error: error.message,
    });
  }
};

// --------------------------------Inventory Item Controller

// Create a Item Details for a class
exports.createItemDetails = async (req, res) => {
  try {
    const { itemName, category, quantity, price } = req.body;
    // console.log(req.body)

    const ItemExist = await ItemModel.findOne({
      schoolId: req.user.schoolId,
      itemName,
      category,
    });

    if (ItemExist) {
      return res.status(400).json({
        success: false,
        message: "Item already exist",
      });
    }

    const data = await ItemModel.create({
      schoolId: req.user.schoolId,
      itemName,
      category,
      quantity,
      price,
    });

    res.status(201).json({
      success: true,
      message: "Item Details created successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Item Not created due to error",
      error: error.message,
    });
  }
};

// Get List of all books
exports.getAllItems = async (req, res) => {
  try {
    const { _id } = req.query;
    const filter = {
      ...(_id ? { _id: _id } : {}),
    };

    const listOfAllItems = await ItemModel.find({
      ...filter,
      schoolId: req.user.schoolId,
    });

    res.status(200).json({
      success: true,
      message: "All Items fetch successfully",
      listOfAllItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Item not fetched due to error",
      error: error.message,
    });
  }
};

// Delete Item
exports.deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    console.log("ItemId", itemId);
    const itemData = await ItemModel.findById({ _id: itemId });
    if (!itemData) {
      return res.status(200).json({
        success: false,
        Message: "Item Not Exits Please Check",
      });
    }

    await ItemModel.deleteOne({ _id: itemId });

    res.status(200).json({
      success: true,
      Message: "Item delete successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Item details not deleted due to error",
      error: error.message,
    });
  }
};

// update Item

exports.updateItem = async (req, res) => {
  try {
    const { ...updateFields } = req.body;
    const { itemId } = req.params;
    const itemData = await ItemModel.findById({ _id: itemId });

    if (!itemData) {
      return res.status(404).json({
        success: true,
        Message: "Item Details is not found",
      });
    }
    for (const key in updateFields) {
      itemData[key] = updateFields[key];
    }

    const updatedItemData = await itemData.save();
    res.status(201).json({
      success: true,
      message: "Item Details is updated",
      updatedItemData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Item details is not update due to error Please fix first",
      error: error.message,
    });
  }
};

//creating Subjects

exports.createSubject = async (req, res) => {
  try {
    const { subject, className, classTeacher } = req.body;

    const existingClass = await Subject.findOne({ className });

    if (existingClass) {
      return res.status(400).json({ message: "Class already exists" });
    }

    const newSubject = await Subject.create({
      schoolID: req.user.schoolId,
      subject,
      className,
      classTeacher,
    });

    res
      .status(201)
      .json({ message: "Subject created successfully", subject: newSubject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ schoolId: req.user.schoolId });
    res.json({ success: true, subjects: subjects });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateSubject = async (req, res) => {
  try {
    const subjectId = req.params.subjectId;
    const { className, classTeacher, subject } = req.body;

    const existingClass = await Subject.findOne({
      schoolId: req.user.schoolId,
      className,
      subjectId,
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    if (classTeacher) {
      existingClass.classTeacher = classTeacher;
    }

    if (subject) {
      existingClass.subject = subject;
    }

    const updatedSubject = await existingClass.save();

    res.json({
      message: "Subject updated successfully",
      subject: updatedSubject,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


//for admissionUser and adminUser both


// START OF THE REGISTRATION

// Function to generate unique registration number
const generateRegistrationNumber = async () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  const randomLetters = Array.from({ length: 3 }, () => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
  const randomNumbers = Array.from({ length: 3 }, () => numbers.charAt(Math.floor(Math.random() * numbers.length))).join('');
  const registrationNumber = randomLetters + randomNumbers;

  // Ensure the registration number is unique
  const existingRegistration = await NewRegistrationModel.findOne({ registrationNumber });
  if (existingRegistration) {
    return generateRegistrationNumber(); // Recursively generate until unique
  }

  return registrationNumber;
};


exports.createRegistration = async (req, res) => {
  try {
    const {
      studentFullName,
      guardianName,
      registerClass,
      studentAddress,
      mobileNumber,
      studentEmail,
      gender,
      amount,
    } = req.body;

    // Check for missing fields
    if (!studentFullName || !guardianName || !registerClass || !studentAddress || !mobileNumber || !studentEmail || !gender || !amount) {
      return res.status(400).json({
        success: false,
        message: "Please enter all required data",
      });
    }

    // Check if the registration already exists for the specific school
    const registrationExist = await NewRegistrationModel.findOne({ mobileNumber, schoolId: req.user.schoolId });
    if (registrationExist) {
      return res.status(400).json({
        success: false,
        message: "Already registered in this school!",
      });
    }

    // Generate unique registration number
    const registrationNumber = await generateRegistrationNumber();

    // Create new registration entry
    const registrationData = await NewRegistrationModel.create({
      schoolId: req.user.schoolId,
      studentFullName,
      guardianName,
      registerClass,
      studentAddress,
      mobileNumber,
      studentEmail,
      gender,
      amount,
      registrationNumber,
    });

    // Send a confirmation email (if needed)
    if (registrationData) {
      const emailContent = `
        <p>Thank you for showing interest in our school.</p>
        <p>We have received your registration details.</p>
        <p>Student Name: ${studentFullName}</p>
        <p>Class: ${registerClass}</p>
        <p>Registration Number: ${registrationNumber}</p>
      `;
      sendEmail(studentEmail, "Registration Confirmation", emailContent)
        .then(() => {
          console.log("Registration confirmation email sent.");
        })
        .catch((error) => {
          console.error("Error sending confirmation email:", error.message);
        });

      return res.status(201).json({
        success: true,
        message: "Registration created successfully and confirmation email sent.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to create registration due to an error.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create registration due to an error.",
      error: error.message,
    });
  }
};


exports.createBulkRegistrations = async (req, res) => {
  try {
    const registrations = req.body.registrations;

    if (!registrations || !Array.isArray(registrations)) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Expected an array of registrations.",
      });
    }

    const bulkOperations = registrations.map(async (registration) => {
      const {
        studentFullName,
        guardianName,
        registerClass,
        studentAddress,
        mobileNumber,
        studentEmail,
        gender,
        amount,
      } = registration;

      // Validate required fields
      if (!studentFullName || !guardianName || !registerClass || !studentAddress || !mobileNumber || !studentEmail || !gender || !amount) {
        throw new Error("Missing required data in one or more entries.");
      }

      // Check if the registration already exists for the specific school
      const registrationExist = await NewRegistrationModel.findOne({ mobileNumber, schoolId: req.user.schoolId });
      if (registrationExist) {
        throw new Error(`Already registered in this school for mobile number: ${mobileNumber}`);
      }

      // Generate unique registration number
      const registrationNumber = await generateRegistrationNumber();

      return {
        schoolId: req.user.schoolId,
        studentFullName,
        guardianName,
        registerClass,
        studentAddress,
        mobileNumber,
        studentEmail,
        gender,
        amount,
        registrationNumber,
      };
    });

    // Execute all operations
    const results = await Promise.all(bulkOperations);
    await NewRegistrationModel.insertMany(results);

    res.status(201).json({
      success: true,
      message: "Bulk registrations created successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to process bulk registration due to an error.",
      error: error.message,
    });
  }
};


// Controller for fetching all registrations (GET)
exports.getRegistrations = async (req, res) => {
  try {
    const registrations = await NewRegistrationModel.find({ schoolId: req.user.schoolId });
    return res.status(200).json({
      success: true,
      message: "Registrations Data Successfully Fetched",
      data: registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations due to an error.",
      error: error.message,
    });
  }
};

// Controller for fetching a specific registration by ID (GET)
exports.getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await NewRegistrationModel.findOne({ _id: id, schoolId: req.user.schoolId });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registration due to an error.",
      error: error.message,
    });
  }
};


// Controller for fetching a specific registration by registration number (GET)
exports.getRegistrationByNumber = async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    const registration = await NewRegistrationModel.findOne({ registrationNumber, schoolId: req.user.schoolId });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: registration,
    });
  } catch (error) {
    console.error('Error fetching registration:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registration due to an error.",
      error: error.message,
    });
  }
};


// EDIT REGISTRATION CODE
exports.editRegistration = async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    const updateData = req.body;

    // Check if the registration exists
    const registration = await NewRegistrationModel.findOneAndUpdate(
      { registrationNumber },
      updateData,
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Registration updated successfully",
      data: registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update registration due to an error.",
      error: error.message,
    });
  }
};


// DELETE REGISTRATION CODE
exports.deleteRegistration = async (req, res) => {
  try {
    const { registrationNumber } = req.params;

    // Check if the registration exists
    const registration = await NewRegistrationModel.findOneAndDelete({
      registrationNumber,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Registration deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete registration due to an error.",
      error: error.message,
    });
  }
};



// END OF THE REGISTRATION

// START OF ADMISSION

const generateAdmissionNumber = async (Model) => {
  const generate = () => {
    const letters = String.fromCharCode(
      ...Array(3).fill(0).map(() => 65 + Math.floor(Math.random() * 26))
    );
    const numbers = String(Math.floor(100 + Math.random() * 900));
    return letters + numbers;
  };

  let admissionNumber;
  let unique = false;

  while (!unique) {
    admissionNumber = generate();
    const exists = await Model.findOne({ admissionNumber });
    if (!exists) unique = true;
  }

  return admissionNumber;
};

exports.createStudentParent = async (req, res) => {
  try {
    const {
      studentFullName,
      studentEmail,
      studentPassword,
      studentDateOfBirth,
      studentGender,
      studentJoiningDate,
      studentAddress,
      studentContact,
      studentClass,
      studentSection,
      studentCountry,
      studentSubject,
      fatherName,
      motherName,
      parentEmail,
      parentPassword,
      parentContact,
      parentIncome,
      parentQualification,
      religion,
      caste,
      nationality,
      pincode,
      state,
      city,
      admissionNumber,
      studentAdmissionNumber,
      parentAdmissionNumber,

      // New UDISE+ fields
      stu_id,
      class: studentUdiseClass,
      section: studentUdiseSection,
      roll_no,
      student_name,
      gender: studentUdiseGender,
      DOB,
      mother_name,
      father_name,
      guardian_name,
      aadhar_no,
      aadhar_name,
      paddress,
      pincode: udisePlusPincode,
      mobile_no,
      alt_mobile_no,
      email_id,
      mothere_tougue,
      category,
      minority,
      is_bpl,
      is_aay,
      ews_aged_group,
      is_cwsn,
      cwsn_imp_type,
      ind_national,
      mainstramed_child,
      adm_no,
      adm_date,
      stu_stream,
      pre_year_schl_status,
      pre_year_class,
      stu_ward,
      pre_class_exam_app,
      result_pre_exam,
      perc_pre_class,
      att_pre_class,
      fac_free_uniform,
      fac_free_textbook,
      received_central_scholarship,
      name_central_scholarship,
      received_state_scholarship,
      received_other_scholarship,
      scholarship_amount,
      fac_provided_cwsn,
      SLD_type,
      aut_spec_disorder,
      ADHD,
      inv_ext_curr_activity,
      vocational_course,
      trade_sector_id,
      job_role_id,
      pre_app_exam_vocationalsubject,
      bpl_card_no,
      ann_card_no
    } = req.body;

    if (!studentEmail || !studentPassword) {
      return res.status(400).json({
        success: false,
        message: "Please Enter All required Data",
      });
    }

    if (!parentAdmissionNumber && (!parentEmail || !parentPassword)) {
      return res.status(400).json({
        success: false,
        message: "Please Enter All required Data for Parent",
      });
    }

    const studentFile = req.files && req.files[0] ? req.files[0] : null;
    const parentFile = req.files && req.files[1] ? req.files[1] : null;
    const schoolId = req.user.schoolId;

    const studentExist = await NewStudentModel.findOne({ email: studentEmail, schoolId });
    if (studentExist) {
      return res.status(400).json({
        success: false,
        message: "Student already exists with this email in the same school",
      });
    }

    const parentExist = parentAdmissionNumber
      ? await ParentModel.findOne({ admissionNumber: parentAdmissionNumber, schoolId })
      : parentEmail
        ? await ParentModel.findOne({ email: parentEmail, schoolId })
        : null;

    if (parentAdmissionNumber && !parentExist) {
      return res.status(400).json({
        success: false,
        message: "Parent with the provided admission number does not exist",
      });
    }

    if (!parentAdmissionNumber && parentEmail && parentExist) {
      return res.status(400).json({
        success: false,
        message: "Parent already exists with this email in the same school",
      });
    }

    const studentHashPassword = await hashPassword(studentPassword);
    const parentHashPassword = parentPassword ? await hashPassword(parentPassword) : undefined;

    let studentImageResult = null;
    if (studentFile) {
      const studentFileUri = getDataUri(studentFile);
      studentImageResult = await cloudinary.uploader.upload(studentFileUri.content);
    }

    let parentImageResult = null;
    if (parentFile) {
      const parentFileUri = getDataUri(parentFile);
      parentImageResult = await cloudinary.uploader.upload(parentFileUri.content);
    }

    // Only generate a new admission number if one is not provided
    const studentAdmissionNumberToUse = admissionNumber || await generateAdmissionNumber(NewStudentModel);


    console.log('student data created');
    const studentData = await NewStudentModel.create({
      schoolId: schoolId,
      fullName: studentFullName,
      email: studentEmail,
      password: studentHashPassword,
      dateOfBirth: studentDateOfBirth,
      rollNo: (await NewStudentModel.countDocuments({ schoolId, class: studentClass, section: studentSection }) + 1).toString(),
      gender: studentGender,
      joiningDate: studentJoiningDate,
      address: studentAddress,
      contact: studentContact,
      class: studentClass,
      fatherName: fatherName ? fatherName : parentExist?.fullName,
      motherName: motherName ? motherName : parentExist?.motherName,
      section: studentSection,
      country: studentCountry,
      subject: studentSubject,
      admissionNumber: studentAdmissionNumberToUse,
      // isGenerated: !studentAdmissionNumber, // Set flag based on whether the admission number was provided
      religion: religion,
      caste: caste,
      nationality: nationality,
      pincode: pincode,
      state: state,
      city: city,
      image: studentImageResult ? {
        public_id: studentImageResult.public_id,
        url: studentImageResult.secure_url,
      } : undefined,

      // Add UDISE+ details in a separate section
      udisePlusDetails: {
        stu_id,
        class: studentUdiseClass,
        section: studentUdiseSection,
        roll_no,
        student_name,
        gender: studentUdiseGender,
        DOB,
        mother_name,
        father_name,
        guardian_name,
        aadhar_no,
        aadhar_name,
        paddress,
        pincode: udisePlusPincode,
        mobile_no,
        alt_mobile_no,
        email_id,
        mothere_tougue,
        category,
        minority,
        is_bpl,
        is_aay,
        ews_aged_group,
        is_cwsn,
        cwsn_imp_type,
        ind_national,
        mainstramed_child,
        adm_no,
        adm_date,
        stu_stream,
        pre_year_schl_status,
        pre_year_class,
        stu_ward,
        pre_class_exam_app,
        result_pre_exam,
        perc_pre_class,
        att_pre_class,
        fac_free_uniform,
        fac_free_textbook,
        received_central_scholarship,
        name_central_scholarship,
        received_state_scholarship,
        received_other_scholarship,
        scholarship_amount,
        fac_provided_cwsn,
        SLD_type,
        aut_spec_disorder,
        ADHD,
        inv_ext_curr_activity,
        vocational_course,
        trade_sector_id,
        job_role_id,
        pre_app_exam_vocationalsubject,
        bpl_card_no,
        ann_card_no
      }
    });
    console.log('student data is here', studentData);

    let parentData = null;
    if (parentAdmissionNumber) {
      parentData = await ParentModel.findOneAndUpdate(
        { admissionNumber: parentAdmissionNumber, schoolId },
        { $push: { studentIds: studentData._id }, studentName: studentFullName },
        { new: true }
      );
    } else if (parentEmail && parentPassword) {
      parentData = await ParentModel.create({
        schoolId: schoolId,
        studentIds: [studentData._id],
        studentName: studentFullName,
        fullName: fatherName,
        motherName,
        email: parentEmail,
        password: parentHashPassword,
        contact: parentContact,
        admissionNumber: await generateAdmissionNumber(ParentModel),
        income: parentIncome,
        qualification: parentQualification,
        image: parentImageResult ? {
          public_id: parentImageResult.public_id,
          url: parentImageResult.secure_url,
        } : undefined
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Parent details are required when creating a new parent",
      });
    }

    if (parentData) {
      studentData.parentId = parentData._id ? parentData._id : parentExist._id;
      // Save the parent admission number in student data
      studentData.parentAdmissionNumber = parentAdmissionNumber || parentData.admissionNumber;
      await studentData.save();

      if (!parentAdmissionNumber) {
        const parentEmailContent =
          `<p>Your EmailID: ${parentEmail}</p>
           <p>Your Password: ${parentPassword}</p>`;
        await sendEmail(parentEmail, "Parent Login Credentials", parentEmailContent);
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "Parent is not created due to error",
      });
    }

    res.status(201).json({
      success: true,
      message: "Student and its Parent Created and also sent message to Student email id and Parent email Id",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Student and Parent are not registered due to error",
      error: error.message,
    });
  }
};




exports.createBulkStudentParent = async (req, res) => {
  try {
    // Check if the request body contains the students field
    if (!req.body || !req.body.students || !Array.isArray(req.body.students)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request format. Expected an array of students.",
      });
    }

    const studentsData = req.body.students; // Assuming the JSON data is in the "students" field
    const schoolId = req.user.schoolId; // Extract schoolId from the logged-in user

    const createdStudents = [];
    const errors = [];

    for (const student of studentsData) {
      const {
        studentFullName,
        studentEmail,
        studentPassword,
        studentDateOfBirth,
        studentGender,
        studentJoiningDate,
        studentAddress,
        studentContact,
        studentClass,
        studentSection,
        studentCountry,
        studentSubject,
        fatherName,
        motherName,
        parentEmail,
        parentPassword,
        parentContact,
        parentIncome,
        parentQualification,
        religion,
        caste,
        nationality,
        pincode,
        state,
        city,
        studentImage,
        parentImage,
        rollNo,
        studentAdmissionNumber,
        parentAdmissionNumber, // Added parentAdmissionNumber

        // New UDISE+ fields
        stu_id,
        class: studentUdiseClass,
        section: studentUdiseSection,
        roll_no,
        student_name,
        gender: studentUdiseGender,
        DOB,
        mother_name,
        father_name,
        guardian_name,
        aadhar_no,
        aadhar_name,
        paddress,
        pincode: udisePlusPincode,
        mobile_no,
        alt_mobile_no,
        email_id,
        mothere_tougue,
        category,
        minority,
        is_bpl,
        is_aay,
        ews_aged_group,
        is_cwsn,
        cwsn_imp_type,
        ind_national,
        mainstramed_child,
        adm_no,
        adm_date,
        stu_stream,
        pre_year_schl_status,
        pre_year_class,
        stu_ward,
        pre_class_exam_app,
        result_pre_exam,
        perc_pre_class,
        att_pre_class,
        fac_free_uniform,
        fac_free_textbook,
        received_central_scholarship,
        name_central_scholarship,
        received_state_scholarship,
        received_other_scholarship,
        scholarship_amount,
        fac_provided_cwsn,
        SLD_type,
        aut_spec_disorder,
        ADHD,
        inv_ext_curr_activity,
        vocational_course,
        trade_sector_id,
        job_role_id,
        pre_app_exam_vocationalsubject,
        bpl_card_no,
        ann_card_no
      } = student;

      const parsedIncome = parentIncome ? parseFloat(parentIncome.replace(/[^0-9.-]+/g, '')) : undefined;

      try {
        if (!studentEmail || !studentPassword || (!parentAdmissionNumber && (!parentEmail || !parentPassword))) {
          throw new Error("Please Enter All required Data");
        }

        // Check if student already exists in the same school
        const studentExist = await NewStudentModel.findOne({ email: studentEmail, schoolId });

        // Check if parent already exists in the same school using either parent admission number or email
        const parentExist = parentAdmissionNumber
          ? await ParentModel.findOne({ admissionNumber: parentAdmissionNumber, schoolId })
          : parentEmail
            ? await ParentModel.findOne({ email: parentEmail, schoolId })
            : null;

        if (studentExist) {
          throw new Error("Student already exists with this email in the same school");
        }

        if (parentAdmissionNumber && !parentExist) {
          throw new Error("Parent with the provided admission number does not exist");
        }

        if (!parentAdmissionNumber && parentEmail && parentExist) {
          throw new Error("Parent already exists with this email in the same school");
        }

        const studentHashPassword = await hashPassword(studentPassword);
        const parentHashPassword = parentPassword ? await hashPassword(parentPassword) : undefined;

        // Upload images only if they are provided
        let studentImageResult = null;
        let parentImageResult = null;

        if (studentImage) {
          studentImageResult = await cloudinary.uploader.upload(studentImage);
        }

        if (parentImage && !parentExist) { // Only upload parent image if parent doesn't exist
          parentImageResult = await cloudinary.uploader.upload(parentImage);
        }

        // Use provided studentAdmissionNumber or generate a new one if not provided
        const studentAdmissionNumberToUse = studentAdmissionNumber ?? await generateAdmissionNumber(NewStudentModel);

        const studentData = await NewStudentModel.create({
          schoolId,
          fullName: studentFullName,
          email: studentEmail,
          password: studentHashPassword,
          dateOfBirth: studentDateOfBirth,
          rollNo: rollNo || '', // Directly use the provided rollNo
          gender: studentGender,
          joiningDate: studentJoiningDate,
          address: studentAddress,
          contact: studentContact,
          class: studentClass,
          fatherName: fatherName,
          motherName: motherName,
          section: studentSection,
          country: studentCountry,
          subject: studentSubject,
          admissionNumber: studentAdmissionNumberToUse,
          isGenerated: !studentAdmissionNumber,
          religion,
          caste,
          nationality,
          pincode,
          state,
          city,
          image: studentImageResult ? {
            public_id: studentImageResult.public_id,
            url: studentImageResult.secure_url,
          } : null,

          // Add UDISE+ details in a separate section
          udisePlusDetails: {
            stu_id,
            class: studentUdiseClass,
            section: studentUdiseSection,
            roll_no,
            student_name,
            gender: studentUdiseGender,
            DOB,
            mother_name,
            father_name,
            guardian_name,
            aadhar_no,
            aadhar_name,
            paddress,
            pincode: udisePlusPincode,
            mobile_no,
            alt_mobile_no,
            email_id,
            mothere_tougue,
            category,
            minority,
            is_bpl,
            is_aay,
            ews_aged_group,
            is_cwsn,
            cwsn_imp_type,
            ind_national,
            mainstramed_child,
            adm_no,
            adm_date,
            stu_stream,
            pre_year_schl_status,
            pre_year_class,
            stu_ward,
            pre_class_exam_app,
            result_pre_exam,
            perc_pre_class,
            att_pre_class,
            fac_free_uniform,
            fac_free_textbook,
            received_central_scholarship,
            name_central_scholarship,
            received_state_scholarship,
            received_other_scholarship,
            scholarship_amount,
            fac_provided_cwsn,
            SLD_type,
            aut_spec_disorder,
            ADHD,
            inv_ext_curr_activity,
            vocational_course,
            trade_sector_id,
            job_role_id,
            pre_app_exam_vocationalsubject,
            bpl_card_no,
            ann_card_no
          }
        });

        let parentData = null;
        if (parentAdmissionNumber) {
          // Update the existing parent with the new student's ID
          parentData = await ParentModel.findOneAndUpdate(
            { admissionNumber: parentAdmissionNumber, schoolId },
            {
              $push: { studentIds: studentData._id },
              $set: { studentName: `${parentExist.studentName}, ${studentFullName}` },
            },
            { new: true }
          );
        } else if (parentEmail && parentPassword) {
          // Create a new parent record if parent doesn't exist
          const newParentAdmissionNumber = await generateAdmissionNumber(ParentModel);
          parentData = await ParentModel.create({
            schoolId,
            studentIds: [studentData._id],
            studentName: studentFullName,
            fullName: fatherName,
            motherName,
            email: parentEmail,
            password: parentHashPassword,
            contact: parentContact,
            admissionNumber: newParentAdmissionNumber,
            income: parsedIncome,
            qualification: parentQualification,
            image: parentImageResult ? {
              public_id: parentImageResult.public_id,
              url: parentImageResult.secure_url,
            } : null,
          });

          const parentEmailContent = `
            <p>Your EmailID: ${parentEmail}</p>
            <p>Your Password: ${parentPassword}</p>
          `;
          await sendEmail(parentEmail, "Parent Login Credentials", parentEmailContent);
        } else {
          throw new Error("Parent details are required when creating a new parent");
        }

        // Assign the parent ID and admission number to the student
        studentData.parentId = parentData._id || parentExist._id;
        studentData.parentAdmissionNumber = parentAdmissionNumber || parentData.admissionNumber;
        await studentData.save();

        const studentEmailContent = `
          <p>Your EmailID: ${studentEmail}</p>
          <p>Your Password: ${studentPassword}</p>
        `;
        await sendEmail(studentEmail, "Student Login Credentials", studentEmailContent);

        createdStudents.push(studentData);
      } catch (error) {
        errors.push({ studentEmail, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: "Bulk admission process completed",
      createdStudents,
      errors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Bulk admission process failed",
      error: error.message,
    });
  }
};


// editStudentParent controller
exports.editStudentParent = async (req, res) => {
  try {
    console.log('req.body', req.body)
    console.log('req.files', req.files)
    const studentId = req.params.studentId;

    // Parse form data
    const formData = req.body;
    const files = req.files;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const student = await NewStudentModel.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Image upload handling for both student and parent
    let studentImageResult = null;
    let parentImageResult = null;

    // Check and upload the student image
    if (files && files.find(file => file.fieldname === 'image')) {
      console.log('in the student file check');
      const studentFile = files.find(file => file.fieldname === 'image');
      const studentFileUri = getDataUri(studentFile);
      studentImageResult = await cloudinary.uploader.upload(studentFileUri.content);
      console.log("Student image uploaded:", studentImageResult);
    }

    // Check and upload the parent image
    if (files && files.find(file => file.fieldname === 'parentImage')) {
      console.log('in the parent file check');
      const parentFile = files.find(file => file.fieldname === 'parentImage');
      const parentFileUri = getDataUri(parentFile);
      parentImageResult = await cloudinary.uploader.upload(parentFileUri.content);
      console.log("Parent image uploaded:", parentImageResult);
    }

    let studentHashPassword
    if (formData.studentPassword) {
      studentHashPassword = await hashPassword(formData.studentPassword);
    }
    let parentHashPassword
    if (formData.parentPassword) {
      parentHashPassword = await hashPassword(formData.parentPassword);
    }

    // Update student details
    const updateStudentFields = {
      fullName: formData.studentFullName || student.fullName,
      password: studentHashPassword || student.password,
      dateOfBirth: formData.studentDateOfBirth || student.dateOfBirth,
      gender: formData.studentGender || student.gender,
      joiningDate: formData.studentJoiningDate || student.joiningDate,
      address: formData.studentAddress || student.address,
      contact: formData.studentContact || student.contact,
      class: formData.studentClass || student.class,
      section: formData.studentSection || student.section,
      country: formData.studentCountry || student.country,
      subject: formData.studentSubject || student.subject,
      rollNo: formData.rollNo || student.rollNo,
      admissionNumber: formData.studentAdmissionNumber || student.admissionNumber,
      religion: formData.religion || student.religion,
      caste: formData.caste || student.caste,
      nationality: formData.nationality || student.nationality,
      pincode: formData.pincode || student.pincode,
      state: formData.state || student.state,
      city: formData.city || student.city,
      image: studentImageResult ? {
        public_id: studentImageResult.public_id,
        url: studentImageResult.secure_url,
      } : student.image,
      
      // Update UDISE+ details
      udisePlusDetails: {
        stu_id: formData.stu_id || student.udisePlusDetails?.stu_id,
        class: formData.studentUdiseClass || student.udisePlusDetails?.class,
        section: formData.studentUdiseSection || student.udisePlusDetails?.section,
        roll_no: formData.roll_no || student.udisePlusDetails?.roll_no,
        student_name: formData.student_name || student.udisePlusDetails?.student_name,
        gender: formData.studentUdiseGender || student.udisePlusDetails?.gender,
        DOB: formData.DOB || student.udisePlusDetails?.DOB,
        mother_name: formData.mother_name || student.udisePlusDetails?.mother_name,
        father_name: formData.father_name || student.udisePlusDetails?.father_name,
        guardian_name: formData.guardian_name || student.udisePlusDetails?.guardian_name,
        aadhar_no: formData.aadhar_no || student.udisePlusDetails?.aadhar_no,
        aadhar_name: formData.aadhar_name || student.udisePlusDetails?.aadhar_name,
        paddress: formData.paddress || student.udisePlusDetails?.paddress,
        pincode: formData.udisePlusPincode || student.udisePlusDetails?.pincode,
        mobile_no: formData.mobile_no || student.udisePlusDetails?.mobile_no,
        alt_mobile_no: formData.alt_mobile_no || student.udisePlusDetails?.alt_mobile_no,
        email_id: formData.email_id || student.udisePlusDetails?.email_id,
        mothere_tougue: formData.mothere_tougue || student.udisePlusDetails?.mothere_tougue,
        category: formData.category || student.udisePlusDetails?.category,
        minority: formData.minority || student.udisePlusDetails?.minority,
        is_bpl: formData.is_bpl || student.udisePlusDetails?.is_bpl,
        is_aay: formData.is_aay || student.udisePlusDetails?.is_aay,
        ews_aged_group: formData.ews_aged_group || student.udisePlusDetails?.ews_aged_group,
        is_cwsn: formData.is_cwsn || student.udisePlusDetails?.is_cwsn,
        cwsn_imp_type: formData.cwsn_imp_type || student.udisePlusDetails?.cwsn_imp_type,
        ind_national: formData.ind_national || student.udisePlusDetails?.ind_national,
        mainstramed_child: formData.mainstramed_child || student.udisePlusDetails?.mainstramed_child,
        adm_no: formData.adm_no || student.udisePlusDetails?.adm_no,
        adm_date: formData.adm_date || student.udisePlusDetails?.adm_date,
        stu_stream: formData.stu_stream || student.udisePlusDetails?.stu_stream,
        pre_year_schl_status: formData.pre_year_schl_status || student.udisePlusDetails?.pre_year_schl_status,
        pre_year_class: formData.pre_year_class || student.udisePlusDetails?.pre_year_class,
        stu_ward: formData.stu_ward || student.udisePlusDetails?.stu_ward,
        pre_class_exam_app: formData.pre_class_exam_app || student.udisePlusDetails?.pre_class_exam_app,
        result_pre_exam: formData.result_pre_exam || student.udisePlusDetails?.result_pre_exam,
        perc_pre_class: formData.perc_pre_class || student.udisePlusDetails?.perc_pre_class,
        att_pre_class: formData.att_pre_class || student.udisePlusDetails?.att_pre_class,
        fac_free_uniform: formData.fac_free_uniform || student.udisePlusDetails?.fac_free_uniform,
        fac_free_textbook: formData.fac_free_textbook || student.udisePlusDetails?.fac_free_textbook,
        received_central_scholarship: formData.received_central_scholarship || student.udisePlusDetails?.received_central_scholarship,
        name_central_scholarship: formData.name_central_scholarship || student.udisePlusDetails?.name_central_scholarship,
        received_state_scholarship: formData.received_state_scholarship || student.udisePlusDetails?.received_state_scholarship,
        received_other_scholarship: formData.received_other_scholarship || student.udisePlusDetails?.received_other_scholarship,
        scholarship_amount: formData.scholarship_amount || student.udisePlusDetails?.scholarship_amount,
        fac_provided_cwsn: formData.fac_provided_cwsn || student.udisePlusDetails?.fac_provided_cwsn,
        SLD_type: formData.SLD_type || student.udisePlusDetails?.SLD_type,
        aut_spec_disorder: formData.aut_spec_disorder || student.udisePlusDetails?.aut_spec_disorder,
        ADHD: formData.ADHD || student.udisePlusDetails?.ADHD,
        inv_ext_curr_activity: formData.inv_ext_curr_activity || student.udisePlusDetails?.inv_ext_curr_activity,
        vocational_course: formData.vocational_course || student.udisePlusDetails?.vocational_course,
        trade_sector_id: formData.trade_sector_id || student.udisePlusDetails?.trade_sector_id,
        job_role_id: formData.job_role_id || student.udisePlusDetails?.job_role_id,
        pre_app_exam_vocationalsubject: formData.pre_app_exam_vocationalsubject || student.udisePlusDetails?.pre_app_exam_vocationalsubject,
        bpl_card_no: formData.bpl_card_no || student.udisePlusDetails?.bpl_card_no,
        ann_card_no: formData.ann_card_no || student.udisePlusDetails?.ann_card_no
      }
    };

    const updatedStudent = await NewStudentModel.findByIdAndUpdate(
      studentId,
      updateStudentFields,
      { new: true, runValidators: true }
    );

    if (formData.parentId) {
      const parent = await ParentModel.findById(formData.parentId);
      if (!parent) {
        return res.status(404).json({
          success: false,
          message: "Parent not found",
        });
      }

      const updateParentFields = {
        fullName: formData.fatherName || parent.fullName,
        motherName: formData.motherName || parent.motherName,
        contact: formData.parentContact || parent.contact,
        income: formData.parentIncome || parent.income,
        qualification: formData.parentQualification || parent.qualification,
        password: parentHashPassword || parent.password,
        image: parentImageResult ? {
          public_id: parentImageResult.public_id,
          url: parentImageResult.secure_url,
        } : parent.image
      };

      await ParentModel.findByIdAndUpdate(
        formData.parentId,
        updateParentFields,
        { new: true, runValidators: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Student and Parent details updated successfully",
      student: updatedStudent
    });
  } catch (error) {
    console.error("Error in editStudentParent:", error);
    res.status(500).json({
      success: false,
      message: "Error updating student and parent details",
      error: error.message,
    });
  }
};



exports.getStudentAndParent = async (req, res) => {
  try {
    const studentId = req.params.studentId; // Extract studentId from URL parameters

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    const schoolId = req.user.schoolId; // Extracted from the authenticated user

    // Find the student
    const studentData = await NewStudentModel.findOne({ _id: studentId, schoolId })
      .populate('parentId'); // Populate parent details if the relationship is set up

    if (!studentData) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Find parent details if not populated
    const parentData = studentData.parentId ? await ParentModel.findOne({ _id: studentData.parentId, schoolId }) : null;

    res.status(200).json({
      success: true,
      student: studentData,
      parent: parentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving Student and Parent details",
      error: error.message,
    });
  }
};





exports.addSibling = async (req, res) => {
  try {
    const {
      studentFullName,
      studentEmail,
      studentPassword,
      studentDateOfBirth,
      studentGender,
      studentJoiningDate,
      studentAddress,
      studentContact,
      studentClass,
      studentSection,
      studentCountry,
      studentSubject,
      parentAdmissionNumber,  // Changed from parentId
      religion,
      caste,
      nationality,
      pincode,
      state,
      city
    } = req.body;

    if (!studentEmail || !studentPassword || !parentAdmissionNumber) {
      return res.status(400).json({
        success: false,
        message: "Please Enter All required Data",
      });
    }

    const schoolId = req.user.schoolId;
    const studentExist = await NewStudentModel.findOne({ email: studentEmail, schoolId });
    const parentData = await ParentModel.findOne({ admissionNumber: parentAdmissionNumber, schoolId }); // Find parent using admissionNumber

    if (studentExist) {
      return res.status(400).json({
        success: false,
        message: "Student already exists with this email in the same school",
      });
    }

    if (!parentData) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const studentHashPassword = await hashPassword(studentPassword);
    const studentAdmissionNumber = await generateAdmissionNumber(NewStudentModel);

    const studentData = await NewStudentModel.create({
      schoolId: req.user.schoolId,
      fullName: studentFullName,
      email: studentEmail,
      password: studentHashPassword,
      dateOfBirth: studentDateOfBirth,
      rollNo: (await NewStudentModel.countDocuments({ schoolId, class: studentClass, section: studentSection })) + 1,
      gender: studentGender,
      joiningDate: studentJoiningDate,
      address: studentAddress,
      contact: studentContact,
      class: studentClass,
      section: studentSection,
      country: studentCountry,
      subject: studentSubject,
      admissionNumber: studentAdmissionNumber,
      religion,
      caste,
      nationality,
      pincode,
      state,
      city,
      parentId: parentData._id,
      image: null, // Set image if available
    });

    // Add the new student's ID to the parent's studentIds array
    parentData.studentIds.push(studentData._id);
    await parentData.save();

    const studentEmailContent = `
      <p>Your EmailID: ${studentEmail}</p>
      <p>Your Password: ${studentPassword}</p>
    `;
    await sendEmail(studentEmail, "Student Login Credentials", studentEmailContent);

    res.status(201).json({
      success: true,
      message: "Sibling added successfully",
      studentData,
      parentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding sibling",
      error: error.message,
    });
  }
};



exports.getParentWithChildren = async (req, res) => {
  try {
    const parentAdmissionNumber = req.params.parentAdmissionNumber;

    if (!parentAdmissionNumber) {
      return res.status(400).json({
        success: false,
        message: "Parent admission number is required",
      });
    }

    // Find the parent and populate student details
    const parent = await ParentModel.findOne({ admissionNumber: parentAdmissionNumber })
      .populate('studentIds'); // Ensure that studentIds field is populated with student details

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    // Get dues for each child based on their admission number
    const childrenWithDues = await Promise.all(
      parent.studentIds.map(async (student) => {
        const feeStatus = await FeeStatus.findOne({ admissionNumber: student.admissionNumber });
        const totalDues = feeStatus ? feeStatus.dues : 0; // If no fee record, dues are 0 by default

        return {
          schoolId: student.schoolId,
          fullName: student.fullName,
          email: student.email,
          dateOfBirth: student.dateOfBirth,
          rollNo: student.rollNo,
          parentId: student.parentId,
          status: student.status,
          gender: student.gender,
          joiningDate: student.joiningDate,
          address: student.address,
          contact: student.contact,
          class: student.class,
          section: student.section,
          country: student.country,
          subject: student.subject,
          admissionNumber: student.admissionNumber,
          image: student.image,
          createdAt: student.createdAt,
          dues: totalDues, // Add the dues for the student
        };
      })
    );

    // Format the response
    res.status(200).json({
      success: true,
      parent: {
        schoolId: parent.schoolId,
        studentIds: parent.studentIds.map((student) => student._id.toString()), // Return student IDs
        studentName: parent.studentName,
        fullName: parent.fullName,
        motherName: parent.motherName,
        email: parent.email,
        contact: parent.contact,
        admissionNumber: parent.admissionNumber,
        income: parent.income,
        qualification: parent.qualification,
        image: parent.image,
        status: parent.status,
        role: parent.role,
        createdAt: parent.createdAt,
      },
      children: childrenWithDues, // Return children with dues included
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving parent with children",
      error: error.message,
    });
  }
};




// TRYING ADMISSION END NEW

exports.getDataByAdmissionNumber = async (req, res) => {
  try {
    const { admissionNumber } = req.params;

    const studentData = await NewStudentModel.findOne({ admissionNumber });
    const parentData = await ParentModel.findOne({ admissionNumber });
    const feeStatusData = await FeeStatus.findOne({ admissionNumber });

    if (!studentData && !parentData && !feeStatusData) {
      return res.status(404).json({
        success: false,
        message: "No data found with this admission number",
      });
    }

    res.status(200).json({
      success: true,
      studentData,
      parentData,
      feeStatusData, // Add the fee status data to the response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving data",
      error: error.message,
    });
  }
};



exports.updateParent = async (req, res) => {
  try {
    const { fatherName, motherName, parentEmail, parentContact } = req.body;

    const parentImageFile = req.file;

    const parentData = await ParentModel.findOne({
      schoolId: req.user.schoolId,
      email: parentEmail,
    });

    if (!parentData) {
      return res.status(404).json({
        status: false,
        message: "Parent Data is not found",
      });
    }

    if (parentImageFile) {
      const fileUri = getDataUri(parentImageFile);
      const parentImageResult = await cloudinary.uploader.upload(
        fileUri.content
      );
      parentData.parentImage = {
        public_id: parentImageResult.public_id,
        url: parentImageResult.secure_url,
      };
    }

    if (fatherName) {
      parentData.fatherName = fatherName;
    }

    if (motherName) {
      parentData.motherName = motherName;
    }

    if (parentContact) {
      parentData.parentContact = parentContact;
    }

    if (parentEmail) {
      parentData.email = parentEmail;
    }

    const updatedParentData = await parentData.save();

    res.status(200).json({
      success: true,
      message: "Parent data is updated",
      updatedParentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Parent data is not updated due to error",
      error: error.message,
    });
  }
};

exports.deactivateParent = async (req, res) => {
  try {
    const { email } = req.body;

    const Parent = await ParentModel.findOneAndUpdate(
      { schoolId: req.user.schoolId, email: email },
      {
        $set: {
          parentStatus: "deactivated",
        },
      },
      { new: true }
    );
    console.log(Parent);
    if (!Parent) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Parent is deactivated",
      Parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Parent is not deactivated due to error",
      error: error.message,
    });
  }
};

exports.getAllParents = async (req, res) => {
  try {
    const { parentEmail } = req.query;

    const filter = {
      ...(parentEmail ? { email: parentEmail } : {}),
    };

    const allParent = await ParentModel.find({
      ...filter,
      schoolId: req.user.schoolId,
      status: "active",
    });

    if (allParent.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Parent Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "List of parents",
      allParent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "All Parent list is not found due to error",
      error: error.message,
    });
  }
};

exports.bulkUpdateStudents = async (req, res) => {
  try {
    const {
      studentIds, // Array of specific student IDs to update
      filters, // Filters like class, section, etc.
      updateFields // Object containing fields to update
    } = req.body;

    if (!updateFields || Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No update fields provided"
      });
    }

    // Build the query based on provided filters and/or student IDs
    let query = {
      schoolId: req.user.schoolId,
      status: "active"
    };

    // Add studentIds to query if provided
    if (studentIds && studentIds.length > 0) {
      query._id = { $in: studentIds };
    }

    // Add other filters if provided
    if (filters) {
      if (filters.class) query.class = filters.class;
      if (filters.section) query.section = filters.section;
      // Add any other filters you want to support
    }

    // Validate the update fields against the schema
    const validUpdateFields = {};
    const studentSchema = NewStudentModel.schema;

    for (const [key, value] of Object.entries(updateFields)) {
      // Handle nested fields (like udisePlusDetails)
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (studentSchema.path(`${parent}.${child}`)) {
          validUpdateFields[key] = value;
        }
      } else if (studentSchema.path(key)) {
        validUpdateFields[key] = value;
      }
    }

    if (Object.keys(validUpdateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update"
      });
    }

    // Perform the bulk update
    const result = await NewStudentModel.updateMany(
      query,
      { $set: validUpdateFields },
      { 
        runValidators: true,
        multi: true 
      }
    );

    // Get the updated students
    const updatedStudents = await NewStudentModel.find(query);

    res.status(200).json({
      success: true,
      message: "Students updated successfully",
      updatedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      updatedStudents
    });

  } catch (error) {
    console.error("Error in bulkUpdateStudents:", error);
    res.status(500).json({
      success: false,
      message: "Error updating students",
      error: error.message
    });
  }
};


exports.getAllParentsWithChildren = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;

    // Find all parents for the school and populate student details
    const parents = await ParentModel.find({ schoolId, status: "active" })
      .populate('studentIds'); // Ensure that studentIds field is populated with student details

    if (parents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No parents found",
      });
    }

    // Format the response
    const parentsWithChildren = parents.map(parent => {
      const children = parent.studentIds.map(student => ({
        schoolId: student.schoolId,
        fullName: student.fullName,
        email: student.email,
        dateOfBirth: student.dateOfBirth,
        rollNo: student.rollNo,
        parentId: student.parentId,
        status: student.status,
        gender: student.gender,
        joiningDate: student.joiningDate,
        address: student.address,
        contact: student.contact,
        class: student.class,
        section: student.section,
        country: student.country,
        subject: student.subject,
        admissionNumber: student.admissionNumber,
        image: student.image,
        createdAt: student.createdAt
      }));

      return {
        parent: {
          schoolId: parent.schoolId,
          studentIds: parent.studentIds.map(student => student._id.toString()), // Return student IDs
          studentName: parent.studentIds.map(student => student.fullName).join(', '), // Concatenate all children's names
          fullName: parent.fullName,
          motherName: parent.motherName,
          email: parent.email,
          contact: parent.contact,
          admissionNumber: parent.admissionNumber,
          income: parent.income,
          qualification: parent.qualification,
          image: parent.image,
          status: parent.status,
          role: parent.role,
          createdAt: parent.createdAt,
          children: children // Add the children array inside the parent object
        },
        children // Keep the separate children array if needed
      };
    });

    res.status(200).json({
      success: true,
      message: "List of parents with their children",
      data: parentsWithChildren,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving parents with children",
      error: error.message,
    });
  }
};


exports.getAllStudents = async (req, res) => {
  try {
    const { email, studentClass, section } = req.query;

    console.log("Chaya", req.query);

    const filter = {
      ...(email ? { email: email } : {}),
      ...(studentClass ? { class: studentClass } : {}),
      ...(section ? { section: section } : {}),
    };

    console.log("P2 Filter", filter);

    const allStudent = await NewStudentModel.find({
      schoolId: req.user.schoolId,
      status: "active",
      ...filter,
    });

    res.status(200).json({
      success: true,
      message: "List of all students",
      allStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "All Student list is not found due to error",
      error: error.message,
    });
  }
};

exports.deactivateStudent = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(email);
    const student = await NewStudentModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student data is not found",
      });
    }

    const Student = await NewStudentModel.findOneAndUpdate(
      { schoolId: req.user.schoolId, email: email },
      {
        $set: {
          status: "deactivated",
        },
      },
      { new: true }
    );

    const Parent = await ParentModel.findByIdAndUpdate(
      { schoolId: req.user.schoolId, _id: student.parentId },
      {
        $set: {
          status: "deactivated",
        },
      },
      { new: true }
    );

    if (!Student || !Parent) {
      return res.status(400).json({
        success: false,
        message: "Student and Parent is not deactivated due to error",
      });
    }

    res.status(200).json({
      success: true,
      message: "Student and Parent is deactivated",
      Student,
      Parent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Student is not deactivated due to error",
      error: error.message,
    });
  }
};

exports.getDeactivatedStudents = async (req, res) => {
  try {
    const { email, studentClass, section } = req.query;

    const filter = {
      ...(email ? { email: email } : {}),
      ...(studentClass ? { class: studentClass } : {}),
      ...(section ? { section: section } : {}),
    };

    const deactivatedStudents = await NewStudentModel.find({
      schoolId: req.user.schoolId,
      status: "deactivated",
      ...filter,
    });

    if (deactivatedStudents.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No deactivated students found",
      });
    }

    res.status(200).json({
      success: true,
      message: "List of all deactivated students",
      deactivatedStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to retrieve deactivated students due to an error",
      error: error.message,
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { email } = req.body;

    const student = await NewStudentModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Remove student from the parent's studentIds array
    const parent = await ParentModel.findByIdAndUpdate(
      student.parentId,
      { $pull: { studentIds: student._id } },
      { new: true }
    );

    // If the parent has no more children, delete the parent
    if (parent && parent.studentIds.length === 0) {
      await ParentModel.findByIdAndDelete(parent._id);
    }

    await NewStudentModel.findByIdAndDelete(student._id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Student deletion failed due to an error",
      error: error.message,
    });
  }
};



exports.updateStudent = async (req, res) => {
  try {
    const { email, ...studentFields } = req.body;

    const StudentImage = req.file;
    const studentData = await NewStudentModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (!studentData) {
      return res.status(404).json({
        status: false,
        message: "Student Data is not found",
      });
    }

    if (StudentImage) {
      const fileUri = getDataUri(StudentImage);
      const studentImageResult = await cloudinary.uploader.upload(
        fileUri.content
      );

      studentData.image = {
        public_id: studentImageResult.public_id,
        url: studentImageResult.secure_url,
      };
    }

    for (const key in studentFields) {
      studentData[key] = studentFields[key];
    }

    const updatedStudentData = await studentData.save();

    res.status(200).json({
      success: true,
      message: "Student data is updated",
      updatedStudentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Student data is not updated due to error",
      error: error.message,
    });
  }
};

exports.getStudentsCreatedAfterAprilOfCurrentYear = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const cutoffMonth = 3; // April is month 3 (0-indexed)

    // Calculate the cutoff date based on the current year and April
    const cutoffDate = new Date(currentYear, cutoffMonth, 1);

    if (currentDate.getMonth() < cutoffMonth) {
      // If the current month is before April, subtract a year
      cutoffDate.setFullYear(currentYear - 1);
    }

    // Use the Mongoose 'find' method to query for students created after the cutoff date
    const allStudent = await NewStudentModel.find({
      schoolId: req.user.schoolId,
      status: "active",
      createdAt: { $gte: cutoffDate },
    });

    res.status(200).json({
      count: allStudent.length,
      success: true,

      message: "Get All Student Data Successfully",
      allStudent: allStudent,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// LATER TEST DELETE BY CLASSWISE/SCHOOLWISE CODE START

exports.deleteStudentsBySchool = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const result = await NewStudentModel.deleteMany({ schoolId });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} students deleted successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete students by school',
      error: error.message
    });
  }
};

exports.deleteStudentsByClass = async (req, res) => {
  try {
    const { studentClass } = req.body;
    const schoolId = req.user.schoolId;
    const result = await NewStudentModel.deleteMany({ schoolId, class: studentClass });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} students deleted successfully from class ${studentClass}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete students by class',
      error: error.message
    });
  }
};


// LATER TEST DELETE BY CLASSWISE/SCHOOLWISE CODE START



exports.createEmployee = async (req, res) => {
  try {
    const { email, password, ...employeeFields } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill the required fields",
      });
    }

    const employeeExist = await EmployeeModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (employeeExist) {
      return res.status(404).json({
        success: false,
        message: "Employee Data is Already Exist",
      });
    }

    const hashedPassword = await hashPassword(password);

    const file = req.file;
    const fileUri = getDataUri(file);
    const employeeImage = await cloudinary.v2.uploader.upload(fileUri.content);

    const employeeData = await EmployeeModel.create({
      schoolId: req.user.schoolId,
      email,
      password: hashedPassword,
      image: {
        public_id: employeeImage.public_id,
        url: employeeImage.url,
      },
      ...employeeFields,
    });

    if (employeeData) {
      const employeeEmailContent = `
      <p>Your EmailID: ${email}</p>
      <p>Your Password: ${password}</p>
  `;

      sendEmail(email, "Employee Login Credentials", employeeEmailContent)
        .then(() => {
          console.log(
            "Employee Created and also send message to employee email Id"
          );
        })
        .catch((error) => {
          return res.status(500).json({
            success: false,
            message: "Mail is not send to Employee Email Address due to error",
            error: error.message,
          });
        });
    }
    else {
      return res.status(500).json({
        success: true,
        message: "employee is not created"
      })
    }

    res.status(201).json({
      success: true,
      message: "Employee Data is created",
      employeeData,
    });
  } catch (error) {
    res.status(500).json({
      success: "false",
      message: "Employee Data is not created due to error",
      error: error.message,
    });
  }
};

exports.getAllEmployees = async (req, res) => {
  try {
    const { email } = req.query;
    const filter = {
      ...(email ? { email: email } : {}),
    };
    const allEmployee = await EmployeeModel.find({
      ...filter,
      schoolId: req.user.schoolId,
      status: "active",
    });

    res.status(200).json({
      success: true,
      message: "List of all Employee",
      allEmployee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "All Employee list is not found due to error",
      error: error.message,
    });
  }
};

exports.deactivateEmployee = async (req, res) => {
  try {
    const { email } = req.body;

    const Employee = await EmployeeModel.findOneAndUpdate(
      { schoolId: req.user.schoolId, email: email },
      {
        $set: {
          status: "deactivated",
        },
      },
      { new: true }
    );

    if (!Employee) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Employee is deactivated",
      Employee,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Employee is not deactivated due to error",
      error: error.message,
    });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const { email, ...employeeFields } = req.body;
    const employeeData = await EmployeeModel.findOne({
      schoolId: req.user.schoolId,
      email: email,
    });

    if (!employeeData) {
      return res.status(404).json({
        status: false,
        message: "Employee Data is not found",
      });
    }
    const file = req.file;

    if (file) {
      const fileUri = getDataUri(file);
      const employeeImageResult = await cloudinary.v2.uploader.upload(
        fileUri.content
      );
      employeeData.image = {
        public_id: employeeImageResult.public_id,
        url: employeeImageResult.secure_url,
      };
    }

    for (const key in employeeFields) {
      employeeData[key] = employeeFields[key];
    }

    const updatedEmployeeData = await employeeData.save();

    res.status(200).json({
      success: true,
      message: "Employee data is updated",
      updatedEmployeeData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Employee data is not updated due to error",
      error: error.message,
    });
  }
};


// Create a new class
exports.createClass = async (req, res) => {
  try {
    let { className, sections, subjects } = req.body;

    // Convert sections and subjects from comma-separated strings to arrays
    sections = sections ? sections.split(',').map(s => s.trim()) : [];
    subjects = subjects ? subjects.split(',').map(s => s.trim()) : [];

    const existClass = await classModel.findOne({
      schoolId: req.user.schoolId,
      className
    });

    if (existClass) {
      return res.status(400).json({
        success: false,
        message: "This class is already created. You cannot create it again."
      });
    }

    const classOfSchool = await classModel.create({
      schoolId: req.user.schoolId,
      className,
      sections,
      subjects
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: classOfSchool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Class not created due to an error",
      error: error.message
    });
  }
};

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classList = await classModel.find({
      schoolId: req.user.schoolId
    });

    // Convert sections and subjects from arrays to comma-separated strings
    const formattedClassList = classList.map(classItem => ({
      ...classItem._doc,
      sections: classItem.sections.join(', '),
      subjects: classItem.subjects.join(', ')
    }));

    res.status(200).json({
      success: true,
      message: "Class list fetched successfully",
      classList: formattedClassList
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Class list not fetched due to an error",
      error: error.message
    });
  }
};

// Get a class by ID
exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classItem = await classModel.findOne({
      _id: id,
      schoolId: req.user.schoolId
    });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    // Convert sections and subjects from arrays to comma-separated strings
    const formattedClass = {
      ...classItem._doc,
      sections: classItem.sections.join(', '),
      subjects: classItem.subjects.join(', ')
    };

    res.status(200).json({
      success: true,
      message: "Class fetched successfully",
      class: formattedClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Class not fetched due to an error",
      error: error.message
    });
  }
};

// Update a class
exports.updateClass = async (req, res) => {
  try {
    let { className, sections, subjects } = req.body;

    // Convert sections and subjects from comma-separated strings to arrays
    sections = sections ? sections.split(',').map(s => s.trim()) : [];
    subjects = subjects ? subjects.split(',').map(s => s.trim()) : [];

    const classToUpdate = await classModel.findOne({
      schoolId: req.user.schoolId,
      className
    });

    if (!classToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    if (sections.length > 0) {
      classToUpdate.sections = sections;
    }

    if (subjects.length > 0) {
      classToUpdate.subjects = subjects;
    }

    const updatedClass = await classToUpdate.save();

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Class not updated due to an error",
      error: error.message
    });
  }
};

// Delete a class
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classToDelete = await classModel.findOneAndDelete({
      _id: id,
      schoolId: req.user.schoolId
    });

    if (!classToDelete) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Class deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Class not deleted due to an error",
      error: error.message
    });
  }
};



exports.getAllStudentStatus = async (req, res) => {
  try {
    const { email } = req.query;

    console.log("here", req.query);

    const filter = {
      ...(email ? { email: email } : {}),
    };

    const allStudent = await NewStudentModel.find({
      schoolId: req.user.schoolId,
      // studentStatus: "active",
      ...filter,
    });

    res.status(200).json({
      success: true,
      message: "List of all students",
      allStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "All Student list is not found due to error",
      error: error.message,
    });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    const file = req.file;
    const fileDataUri = getDataUri(file);

    const existNotice = await NoticeModel.findOne({ title: title });

    if (existNotice) {
      return res.status(400).json({
        success: false,
        message: "Title of that notice is already exist",
      });
    }

    const noticeFile = await cloudinary.v2.uploader.upload(fileDataUri.content);

    const notice = await NoticeModel.create({
      schoolId: req.user.schoolId,
      title,
      content,
      file: {
        public_id: noticeFile.public_id,
        url: noticeFile.secure_url,
      },
      class: req.user.classTeacher,
      section: req.user.section,
      role: req.user.role,
    });

    res.status(201).json({
      success: true,
      message: "Notice is successfully created",
      notice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notice is not created due to error",
      error: error.message,
    });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;

    const existNotice = await NoticeModel.findById(noticeId);

    if (!existNotice) {
      return res.status(400).json({
        success: false,
        message: "Notice does not exist",
      });
    }

    const deletedNotice = await existNotice.deleteOne();

    res.status(200).json({
      success: true,
      message: "Notice deleted successfully",
      deletedNotice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notice is not deleted due to error",
      error: error.message,
    });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const { noticeId } = req.params;
    const { ...noticeFields } = req.body;
    const file = req.file;

    const existNotice = await NoticeModel.findById(noticeId);

    if (!existNotice) {
      return res.status(404).json({
        success: false,
        message: "Notice does not exist",
      });
    }

    if (file) {
      const fileDataUri = getDataUri(file);

      const noticeFile = await cloudinary.v2.uploader.upload(
        fileDataUri.content
      );

      existNotice.file = {
        public_id: noticeFile.public_id,
        url: noticeFile.secure_url,
      };
    }

    for (let key in noticeFields) {
      existNotice[key] = noticeFields[key];
    }

    const updatedNotice = await existNotice.save();

    res.status(200).json({
      success: true,
      message: "Notice is updated successfully",
      updatedNotice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notice is not updated due to Error",
      error: error.message,
    });
  }
};

exports.getAllNotice = async (req, res) => {
  try {
    const { noticeId, className, section, role } = req.query;

    const filter = {
      ...(noticeId ? { _id: noticeId } : {}),
      ...(className ? { class: className } : {}),
      ...(section ? { section: section } : {}),
      ...(role ? { role: role } : {}),
    };

    console.log("filter", filter);

    const allNotice = await NoticeModel.find({
      ...filter,
      schoolId: req.user.schoolId,
    });

    res.status(200).json({
      success: true,
      message: "Notice is fetch is successfully",
      allNotice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Notice is not get due to error",
      error: error.message,
    });
  }
};



exports.promotionOfStudent = async (req, res) => {
  try {
    const { students, promotedClass, promotedSection } = req.body;
    console.log("students", students, promotedClass, promotedSection);
    if (!students || !promotedClass || !promotedSection) {
      return res.status(400).json({
        success: false,
        message: "Missing Parameters",
      });
    }

    for (const student of students) {
      const updatedStudent = await NewStudentModel.findByIdAndUpdate(
        student,
        {
          class: promotedClass,
          section: promotedSection,
        },
        { new: true }
      );

      if (!updatedStudent) {
        return res.status(404).json({
          success: false,
          message: `Student Id ${student._id} is not found`,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Selected Student is Promoted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Promotion Of Student not done successfully",
      error: error.message,
    });
  }
};

exports.createCurriculum = async (req, res) => {
  try {
    const { className, academicYear } = req.body;
    const file = req.file;
    const fileDataUri = getDataUri(file);

    const existCurriculum = await CurriculumModel.findOne({
      className: className,
      academicYear: academicYear,
    });

    if (existCurriculum) {
      return res.status(400).json({
        success: false,
        message: "Curriculum of that Class is already exist",
      });
    }

    const curriculumFile = await cloudinary.v2.uploader.upload(
      fileDataUri.content
    );

    const curriculum = await CurriculumModel.create({
      schoolId: req.user.schoolId,
      className,
      academicYear,
      file: {
        public_id: curriculumFile.public_id,
        url: curriculumFile.secure_url,
      },
    });

    res.status(201).json({
      success: true,
      message: "Curriculum of That Class is successfully created",
      curriculum,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Curriculum of that class is not created due to error",
      error: error.message,
    });
  }
};

exports.deleteCurriculum = async (req, res) => {
  try {
    const { curriculumId } = req.params;

    const existCurriculum = await CurriculumModel.findById(curriculumId);

    if (!existCurriculum) {
      return res.status(400).json({
        success: false,
        message: "Curriculum of that class does not exist",
      });
    }

    const deletedCurriculum = await existCurriculum.deleteOne();

    res.status(200).json({
      success: true,
      message: "Curriculum of that class deleted successfully",
      deletedCurriculum,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Curriculum of that class is not deleted due to error",
      error: error.message,
    });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    const { curriculumId } = req.params;
    const { ...curriculumFields } = req.body;
    const file = req.file;

    const existCurriculum = await CurriculumModel.findById(curriculumId);

    if (!existCurriculum) {
      return res.status(404).json({
        success: false,
        message: "Curriculum of that Class does not exist",
      });
    }

    if (file) {
      const fileDataUri = getDataUri(file);

      const curriculumFile = await cloudinary.v2.uploader.upload(
        fileDataUri.content
      );

      existCurriculum.file = {
        public_id: curriculumFile.public_id,
        url: curriculumFile.secure_url,
      };
    }

    for (let key in curriculumFields) {
      existCurriculum[key] = curriculumFields[key];
    }

    const updatedCurriculum = await existCurriculum.save();

    res.status(200).json({
      success: true,
      message: "Curriculum of that class is updated successfully",
      updatedCurriculum,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Curriculum of that class is not updated due to Error",
      error: error.message,
    });
  }
};

exports.getAllCurriculum = async (req, res) => {
  try {

    const { curriculumId, className } = req.query;

    const filter = {
      ...(curriculumId ? { _id: curriculumId } : {}),
      ...(className ? { className: className } : {})
    }

    const allCurriculum = await CurriculumModel.find({ ...filter, schoolId: req.user.schoolId });

    res.status(200).json({
      success: true,
      message: "Curriculum of that class is fetch is successfully",
      allCurriculum
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Curriculum of that class is not get due to error",
      error: error.message
    })
  }
}

exports.createAssignment = async (req, res) => {
  try {
    const { className, section, title, description, dueDate, subject } =
      req.body;
    const file = req.file;

    console.log("P2 file", req.file);
    console.log("P2 req.body", req.body);

    const fileDataUri = getDataUri(file);

    const existAssignment = await AssignmentModel.findOne({
      className: className,
      section: section,
      title: title,
    });

    if (existAssignment) {
      return res.status(400).json({
        success: false,
        message: "Assignment of that Class is already exist",
      });
    }

    const assignmentFile = await cloudinary.v2.uploader.upload(
      fileDataUri.content
    );

    const assignment = await AssignmentModel.create({
      schoolId: req.user.schoolId,
      className,
      section,
      title,
      description,
      dueDate,
      subject,
      file: {
        public_id: assignmentFile.public_id,
        url: assignmentFile.secure_url,
      },
    });

    res.status(201).json({
      success: true,
      message: "Assignment of That Class is successfully created",
      assignment,
    });
  } catch (error) {
    console.error("Error occurred at--->>>>>>:", error.stack);
    console.log("AJAYARJ---", error)
    res.status(500).json({
      success: false,
      message: "Assignment of that class is not created due to error",
      error: error.message,
    });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const existAssignment = await AssignmentModel.findById(assignmentId);

    if (!existAssignment) {
      return res.status(400).json({
        success: false,
        message: "Assignment of that class does not exist",
      });
    }

    const deletedAssignment = await existAssignment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Assignment of that class deleted successfully",
      deletedAssignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignment of that class is not deleted due to error",
      error: error.message,
    });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { ...assignmentFields } = req.body;
    const file = req.file;

    const existAssignment = await AssignmentModel.findById(assignmentId);

    if (!existAssignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment of that Class does not exist",
      });
    }

    if (file) {
      const fileDataUri = getDataUri(file);

      const assignmentFile = await cloudinary.v2.uploader.upload(
        fileDataUri.content
      );

      // const mycloud = await cloudinary.uploader.upload(fileUri.content);

      existAssignment.file = {
        public_id: assignmentFile.public_id,
        url: assignmentFile.secure_url,
      };
    }

    for (let key in assignmentFields) {
      existAssignment[key] = assignmentFields[key];
    }

    const updatedAssignment = await existAssignment.save();

    res.status(200).json({
      success: true,
      message: "Assignment of that class is updated successfully",
      updatedAssignment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignement of that class is not updated due to Error",
      error: error.message,
    });
  }
};


exports.getAllAssignment = async (req, res) => {
  try {

    const { assignmentId, className, section } = req.query;

    const filter = {
      ...(assignmentId ? { _id: assignmentId } : {}),
      ...(className ? { className: className } : {}),
      ...(section ? { section: section } : {})
    }

    const allAssignment = await AssignmentModel.find({ ...filter, schoolId: req.user.schoolId });

    res.status(200).json({
      success: true,
      message: "Assignment of that class is fetch is successfully",
      allAssignment
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Assignment of that class is not get due to error",
      error: error.message
    })
  }
}


exports.issueBook = async (req, res) => {
  try {
    const { ...issueBookFields } = req.body;

    const existBook = await BookModel.findById(issueBookFields.bookId);

    if (!existBook) {
      return res.status(404).json({
        success: false,
        message: "Book Details is not exist",
      });
    }

    const existStudent = await NewStudentModel.findById(
      issueBookFields.studentId
    );

    if (!existStudent) {
      return res.status(404).json({
        success: false,
        message: "Student record is not exist",
      });
    }

    const issuedData = await issueBookModel.findOne({
      schoolId: req.user.schoolID,
      bookId: issueBookFields.bookId,
      studentId: issueBookFields.studentId,
      bookName: issueBookFields.bookName,
      status: "issued",
    });

    if (issuedData) {
      return res.status(400).json({
        success: false,
        message: "This Book Already issued to this Student",
      });
    }

    if (existBook.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Stock is not available",
      });
    }

    const issueBookData = await issueBookModel.create({
      schoolId: req.user.schoolId,
      ...issueBookFields,
    });

    if (issueBookData) {
      existBook.quantity = existBook.quantity - 1;

      await existBook.save();
    }

    res.status(201).json({
      success: true,
      message: "Book issued successfully",
      issueBookData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book was not issued due to error",
      error: error.message,
    });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { issueId } = req.params;

    const issueRecord = await issueBookModel.findById(issueId);

    if (!issueRecord) {
      return res.status(404).json({
        success: false,
        message: "issue Record not found",
      });
    }

    issueRecord.status = "returned";
    issueRecord.returnDate = Date.now();

    await issueRecord.save();

    const existBook = await BookModel.findById(issueRecord.bookId);

    existBook.quantity++;

    await existBook.save();

    res.status(200).json({
      success: true,
      message: "Book Returned Data is successfully Updated",
      issueRecord,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Book not Returned due to error",
      error: error.message,
    });
  }
};


exports.getAllIssueBookToMe = async (req, res) => {
  try {

    if (req.user.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "You are not Student",
      });
    }

    const listOfBook = await issueBookModel.find({
      schoolId: req.user.schoolId,
      studentId: req.user._id,
      status: "issued"
    })

    res.status(200).json({
      success: true,
      message: "List of Books issued is successfully fetched",
      listOfBook
    })
  }
  catch (error) {
    res.status(500).json({
      success: false,
      message: "Not Fetch of list of issue book",
      error: error.message,
    });
  }
}

exports.getAllIssuedBookStudent = async (req, res) => {
  try {
    const { bookId } = req.query;

    const filter = {
      ...(bookId ? { bookId: bookId } : {}),
    };

    const allStudent = await issueBookModel.find({
      status: "issued",
      schoolID: req.user.schoolID,
      ...filter,
    });

    res.status(200).json({
      success: true,
      message: "Issued Book Student data is successfully fetch",
      allStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Issued Book Student data is not get due to error",
      error: error.message,
    });
  }
};

exports.getMyKids = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(400).json({
        success: false,
        message: "You are not Parent",
      });
    }

    const kids = await NewStudentModel.find({ parentId: req.user._id });

    res.status(200).json({
      success: true,
      message: "Kids details is successfully get",
      data: kids,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Kid Details is not get due to error",
      error: error.message,
    });
  }
};
