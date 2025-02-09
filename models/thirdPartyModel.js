// models/thirdPartyModel.js
const mongoose = require('mongoose');

const thirdPartySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    assignedSchools: [{
        schoolId: {
            type: String,
            required: true
        },
        schoolName: {
            type: String,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create and export the model correctly
const ThirdPartyUser = mongoose.model('ThirdPartyUser', thirdPartySchema);
module.exports = ThirdPartyUser;