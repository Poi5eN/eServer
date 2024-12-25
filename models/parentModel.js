const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true
    },
    studentIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "NewStudentModel",
        required: true
    }],
    studentNames: [String],
    fullName: {
        type: String,
        required: [true, "Please Enter Father Name"]
    },
    motherName: {
        type: String,
        // required: [true, "Please Enter Mother Name"]
    },
    email: {
        type: String,
        required: [true, "Please Enter Email Address"]
    },
    password: {
        type: String,
        required: [true, "Please Enter Password"],
        select: false,
        minLength: [8, "Minimum 8 characters Required in Password"]
    },
    status: {
        type: String,
        required: true,
        default: "active"
    },
    contact: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: "parent"
    },
    image: {
        public_id: {
            type: String,
            // required: true
        },
        url: {
            type: String,
            // required: true
        }
    },
    admissionNumber: {
        type: String,
        unique: true,
        required: true,
        match: /^[A-Z]{3}\d{3}$/
    },
    income: {
        type: Number,
    },
    qualification: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

parentSchema.index({ email: 1, schoolId: 1 }, { unique: true });

const ParentModel = mongoose.model("ParentModel", parentSchema);

module.exports = ParentModel;
