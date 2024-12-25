// models/resultModel.js
const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  marks: {
    type: Map,
    of: Map // Nested Map for subject-wise component marks
  },
  totalMarks: { type: Number },
  percentage: { type: Number },
  grade: { type: String },
  rank: { type: Number },
  remarks: { type: String }
}, {
  timestamps: true
});

// Add indexes for faster queries
resultSchema.index({ examId: 1, class: 1, section: 1 });
resultSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("Result", resultSchema);
