const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    },
    sections: [{
        type: String
    }],
    subjects: [{
        type: String
    }]
}, {
    timestamps: true
});

classSchema.index({ schoolId: 1, className: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
