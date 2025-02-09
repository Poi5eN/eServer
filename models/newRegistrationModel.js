const mongoose = require('mongoose');

const newRegistrationSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    required: true
  },
  studentFullName: {
    type: String,
    required: true,
    trim: true
  },
  guardianName: {
    type: String,
    trim: true
  },
  registerClass: {
    type: String,
    required: true,
    trim: true
  },
  studentAddress: {
    type: String,
    trim: true
  },
  mobileNumber: {
    type: Number,
    trim: true
  },
  studentEmail: {
    type: String,
    unique: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  amount: {
    type: Number,
    required: true
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    length: 6
  },
  // Additional fields:
  rollNo: {
    type: String,
    required: true,
    trim: true
  },
  admissionNo: {
    type: String,
    required: true,
    trim: true
  },
  fatherName: {
    type: String,
    required: true,
    trim: true
  },
  motherName: {
    type: String,
    required: true,
    trim: true
  },
  remarks: {
    type: String,
    required: true,
    trim: true
  },
  transport: {
    type: String,
    required: true,
    trim: true
  },
  // Image fields (store Base64-encoded string data)
  studentPhoto: {
    type: String,
    required: true
  },
  motherPhoto: {
    type: String,
    required: true
  },
  fatherPhoto: {
    type: String,
    required: true
  },
  guardianPhoto: {
    type: String,
    required: true
  },
  // createdBy field to track the user who created the registration
  createdBy: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt fields
});

const NewRegistrationModel = mongoose.model('NewRegistration', newRegistrationSchema);
module.exports = NewRegistrationModel;
