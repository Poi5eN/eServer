const mongoose = require("mongoose");


const studentSchema = new mongoose.Schema({
    schoolId: {
        type: String,
        required: true
    },
    "fullName": {
        type: String,
        required: [true, "Please Enter the Name of Student"]
    },
    "email": {
        type: String,
        required: [true, "Please Enter the Email Address"],
        unique: true
    },
    "password": {
        type: String,
        required: [true, "Please Enter the Password"],
        select: false
        // minLength: [8, "Minimum 8 character Required in Password"]
    },
    "dateOfBirth": {
        type: Date,
        // required: true,
        validate: {
            validator: function(value) {
                return value <= new Date()
            },
            message: "Date of birth cannot be in the future"
        }
    },
    motherName:{
        type: String
    },
    fatherName:{
        type: String
    },
    parentContact: {
        type: Number,
    },
    "role": {
        type: String,
        required: true,
        default: "student"
    },
    rollNo: {
        type: String,
        // required: true,
        // unique: true,
    },
    "parentId": {
        type: String,
    },
    parentAdmissionNumber: {
        type: String,
        required: false,
      },
    "status":{
       type: String,
       required: true,
       default: "active"
    },
    "gender": {
        type: String,
        // required: true
    },
    "joiningDate": {
        type: String,
        required: true
    },
    "address": {
        type: String,
        // required: true
    },
    "contact": {
        type: Number,
        // required: true
    },
    "class": {
        type: String,
        required: true
    },
    "section": {
        type: String,
        required: true
    },
    "country": {
        type: String,
        // required: true,
    },
    "subject": [String],
    "image": {
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
        validate: {
            validator: function(v) {
                // Validate the pattern only if it's auto-generated
                return this.isGenerated ? /^[A-Z]{3}\d{3}$/.test(v) : true;
            },
            message: "Admission number must follow the pattern: 3 uppercase letters followed by 3 digits (e.g., ABC123)"
        }
    },
    isGenerated: {
        type: Boolean,
        default: false // This will indicate if the admission number was generated
    },
    religion: {
        type: String
    },
    caste: {
        type: String
    },
    nationality: {
        type: String
    },
    pincode: {
        type: String
    },
    state: {
        type: String
    },
    city: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    udisePlusDetails: {
        stu_id: {
            type: String
        },
        class: {
            type: String
        },
        section: {
            type: String
        },
        roll_no: {
            type: String
        },
        student_name: {
            type: String
        },
        gender: {
            type: String
        },
        DOB: {
            type: Date
        },
        mother_name: {
            type: String
        },
        father_name: {
            type: String
        },
        guardian_name: {
            type: String
        },
        aadhar_no: {
            type: String
        },
        aadhar_name: {
            type: String
        },
        paddress: {
            type: String
        },
        pincode: {
            type: String
        },
        mobile_no: {
            type: String
        },
        alt_mobile_no: {
            type: String
        },
        email_id: {
            type: String
        },
        mothere_tougue: {
            type: String
        },
        category: {
            type: String
        },
        minority: {
            type: String
        },
        is_bpl: {
            type: Boolean
        },
        is_aay: {
            type: Number
        },
        ews_aged_group: {
            type: String
        },
        is_cwsn: {
            type: Number
        },
        cwsn_imp_type: {
            type: String
        },
        ind_national: {
            type: String
        },
        mainstramed_child: {
            type: String
        },
        adm_no: {
            type: String
        },
        adm_date: {
            type: Date
        },
        stu_stream: {
            type: String
        },
        pre_year_schl_status: {
            type: String
        },
        pre_year_class: {
            type: String
        },
        stu_ward: {
            type: String
        },
        pre_class_exam_app: {
            type: String
        },
        result_pre_exam: {
            type: String
        },
        perc_pre_class: {
            type: Number
        },
        att_pre_class: {
            type: String
        },
        fac_free_uniform: {
            type: String
        },
        fac_free_textbook: {
            type: String
        },
        received_central_scholarship: {
            type: Boolean
        },
        name_central_scholarship: {
            type: String
        },
        received_state_scholarship: {
            type: Boolean
        },
        received_other_scholarship: {
            type: Boolean
        },
        scholarship_amount: {
            type: Number
        },
        fac_provided_cwsn: {
            type: String
        },
        SLD_type: {
            type: String
        },
        aut_spec_disorder: {
            type: String
        },
        ADHD: {
            type: String
        },
        inv_ext_curr_activity: {
            type: String
        },
        vocational_course: {
            type: String
        },
        trade_sector_id: {
            type: String
        },
        job_role_id: {
            type: String
        },
        pre_app_exam_vocationalsubject: {
            type: String
        },
        bpl_card_no: {
            type: String
        },
        ann_card_no: {
            type: String
        }
    }
});

studentSchema.index({ email: 1, schoolId: 1 }, { unique: true });

const NewStudentModel = new mongoose.model("NewStudentModel", studentSchema);

module.exports = NewStudentModel;
