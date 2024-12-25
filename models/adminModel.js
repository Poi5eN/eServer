const mongoose = require('mongoose')

const adminSchema = mongoose.Schema({
    schoolId: {
        type: String,
        required: true
    },
    schoolName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: [true, "Please Enter your email Address"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "Please Enter the password"],
        minLength:[8,"Minimum 8 character required in password"],
        select: false
    },
    fullName: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        required: true,
        default: "admin"
    },
    contact: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        default: ""
    
    },
    image: {
        public_id: {
            type: String,
            default: ""
         
        },
        url: {
            type: String,
            default: ""
         
        }
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
})


module.exports = mongoose.model('AdminInfo', adminSchema)

