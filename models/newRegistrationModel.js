const mongoose = require('mongoose');

const newRegistrationSchema = new mongoose.Schema({
  schoolId: {
    type: String,
    required: true
  },
  studentFullName: {
    type: String,
    required: true,
    trim: true,
  },
  guardianName: {
    type: String,
    // required: true,
    trim: true,
  },
  registerClass: {
    type: String,
    required: true,
    trim: true,
  },
  studentAddress: {
    type: String,
    // required: true,
    trim: true,
  },
  mobileNumber: {
    type: Number,
    // required: true,
    // unique: true,
    trim: true,
  },
  studentEmail: {
    type: String,
    // required: true,
    unique: true,
    trim: true,
  },
  gender: {
    type: String,
    // required: true,
    enum: ['Male', 'Female', 'Other'],
  },
  amount: {
    type: Number,
    required: true,
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    length: 6,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const NewRegistrationModel = mongoose.model('NewRegistration', newRegistrationSchema);

module.exports = NewRegistrationModel;
