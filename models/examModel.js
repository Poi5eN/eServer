// examModel.js
const mongoose = require("mongoose");

const gradingScaleSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "A1", "B2", "Pass", "Merit"
    minPercent: { type: Number, required: true },
    maxPercent: { type: Number, required: true },
    description: String,
    gradePoint: Number // For GPA calculation if needed
});

const assessmentComponentSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Unit Test 1", "Written", "Practical"
    weightage: { type: Number, required: true }, // Percentage weightage in final calculation
    maxMarks: { type: Number, required: true },
    minPassMarks: Number,
    isOptional: { type: Boolean, default: false }
});

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: String,
    type: { 
        type: String, 
        enum: ['MAIN', 'ELECTIVE', 'CO_SCHOLASTIC', 'EXTRA_CURRICULAR'],
        default: 'MAIN'
    },
    assessmentComponents: [assessmentComponentSchema],
    examDate: Date,
    startTime: String,
    endTime: String,
    totalMarks: { type: Number, required: true },
    passingMarks: Number,
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }]
});

const examSchema = new mongoose.Schema({
    schoolId: { type: String, required: true },
    academicYear: { type: String, required: true },
    term: { type: String, required: true }, // e.g., "Term 1", "Semester 1", "Annual"
    examName: { type: String, required: true },
    examType: {
        type: String,
        enum: ['UNIT_TEST', 'TERM', 'SEMESTER', 'FINAL', 'PRACTICAL', 'PROJECT'],
        required: true
    },
    classes: [{
        className: { type: String, required: true },
        section: { type: String, required: true },
        subjects: [subjectSchema]
    }],
    gradingScale: [gradingScaleSchema],
    resultCalculation: {
        includePreviousTerms: { type: Boolean, default: false },
        previousTermsWeightage: Number,
        roundingMethod: {
            type: String,
            enum: ['ROUND', 'CEIL', 'FLOOR'],
            default: 'ROUND'
        },
        passingCriteria: {
            overallPercentage: Number,
            minimumSubjects: Number,
            includeElectives: Boolean
        }
    },
    status: {
        type: String,
        enum: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED'],
        default: 'DRAFT'
    },
    schedule: {
        registrationStart: Date,
        registrationEnd: Date,
        examStart: Date,
        examEnd: Date,
        resultDate: Date
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model("Exam", examSchema);