
// controllers/thirdpartyAdmissionController.js

const NewStudentModel = require('../models/newStudentModel');
const ParentModel = require('../models/parentModel');
const sendEmail = require("../utils/email");
const {
    setTokenCookie,
    hashPassword,
    createToken,
    verifyPassword,
    fetchTokenFromCookie,
  } = require("./authController");
// const sendEmail = require('../utils/email');
const cloudinary = require('cloudinary');
const getDataUri = require("../utils/dataUri"); // your helper for file conversion


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


/**
 * Create Admission (Third-Party)
 * Mirrors the admin createStudentParent logic with all fields.
 * Marks the admission as pending for admin approval.
 */
exports.createAdmission = async (req, res) => {
    try {
      // Verify that the third-party user has access to the school.
      const { schoolId } = req.body;
      const hasAccess = req.user.assignedSchools.some(school => school.schoolId === schoolId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to create admissions for this school"
        });
      }
  
      // Destructure all required fields (including UDISE+ details)
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
        studentAdmissionNumber, // optional—if empty, one will be generated
  
        // UDISE+ details:
        stu_id,
        studentUdiseClass,
        studentUdiseSection,
        roll_no,
        student_name,
        studentUdiseGender,
        DOB,
        guardian_name,
        aadhar_no,
        aadhar_name,
        paddress,
        udisePlusPincode,
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
  
      // Validate required fields as needed...
      if (!studentFullName || !studentEmail || !studentPassword || !studentClass || !studentSection) {
        return res.status(400).json({
          success: false,
          message: "Please provide all required student fields"
        });
      }
      if (!parentEmail || !parentPassword) {
        return res.status(400).json({
          success: false,
          message: "Please provide parent email and password"
        });
      }
  
      // Check duplicate student by email and schoolId
      const existingStudent = await NewStudentModel.findOne({ email: studentEmail, schoolId });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student already exists with this email in this school"
        });
      }
  
      // Hash passwords
      const studentHashedPassword = await hashPassword(studentPassword);
      const parentHashedPassword = await hashPassword(parentPassword);
  
      // Handle file uploads (if any)
      let studentImageResult = null;
      let parentImageResult = null;
      if (req.files) {
        if (req.files.studentPhoto) {
          const studentFileUri = getDataUri(req.files.studentPhoto);
          studentImageResult = await cloudinary.uploader.upload(studentFileUri.content);
        }
        if (req.files.parentPhoto) {
          const parentFileUri = getDataUri(req.files.parentPhoto);
          parentImageResult = await cloudinary.uploader.upload(parentFileUri.content);
        }
      }
  
      // Generate admission number if not provided.
      const studentAdmissionNumberToUse = studentAdmissionNumber || await generateAdmissionNumber(NewStudentModel);
  
      // Create the student record
      const studentData = await NewStudentModel.create({
        schoolId,
        fullName: studentFullName,
        email: studentEmail,
        password: studentHashedPassword,
        dateOfBirth: studentDateOfBirth,
        gender: studentGender,
        joiningDate: studentJoiningDate,
        address: studentAddress,
        contact: studentContact,
        class: studentClass,
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
        image: studentImageResult ? { public_id: studentImageResult.public_id, url: studentImageResult.secure_url } : undefined,
        udisePlusDetails: {
          stu_id,
          class: studentUdiseClass,
          section: studentUdiseSection,
          roll_no,
          student_name,
          gender: studentUdiseGender,
          DOB,
        //   mother_name,             // if provided
          father_name: fatherName,   // using fatherName here
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
        },
        approvalStatus: "pending", // pending admin approval
        assignedThirdParty: req.user.userId
      });
  
      // Create (or update) the parent record
      let parentData = null;
      if (req.body.parentAdmissionNumber) {
        // Update existing parent
        parentData = await ParentModel.findOneAndUpdate(
          { admissionNumber: req.body.parentAdmissionNumber, schoolId },
          { 
            $push: { studentIds: studentData._id },
            $addToSet: { studentNames: studentFullName }
          },
          { new: true }
        );
        if (!parentData) {
          return res.status(400).json({
            success: false,
            message: "Parent with provided admission number does not exist"
          });
        }
      } else {
        // Create a new parent record
        const parentAdmissionNumberGenerated = await generateAdmissionNumber(ParentModel);
        parentData = await ParentModel.create({
          schoolId,
          studentIds: [studentData._id],
          studentNames: [studentFullName],
          fullName: fatherName,
          motherName,
          email: parentEmail,
          password: parentHashedPassword,
          contact: parentContact,
          admissionNumber: parentAdmissionNumberGenerated,
          income: parentIncome,
          qualification: parentQualification,
          image: parentImageResult ? { public_id: parentImageResult.public_id, url: parentImageResult.secure_url } : undefined
        });
      }
  
      // Link parent to student and send emails
      if (parentData) {
        studentData.parentId = parentData._id;
        studentData.parentAdmissionNumber = parentData.admissionNumber;
        await studentData.save();
  
        const parentEmailContent = `
          <p>Your login credentials are as follows:</p>
          <p>Email: ${parentEmail}</p>
          <p>Password: ${parentPassword}</p>
        `;
        await sendEmail(parentEmail, "Parent Login Credentials", parentEmailContent);
      }
  
      const studentEmailContent = `
        <p>Dear ${studentFullName},</p>
        <p>Your admission number is: ${studentAdmissionNumberToUse}</p>
        <p>Your admission is currently pending admin approval.</p>
      `;
      await sendEmail(studentEmail, "Admission Confirmation", studentEmailContent);
  
      return res.status(201).json({
        success: true,
        message: "Admission created successfully and is pending admin approval.",
        student: studentData,
        parent: parentData
      });
    } catch (error) {
      console.error("Error in createAdmission:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create admission",
        error: error.message
      });
    }
  };
  
  /**
   * Get All Students for Third-Party (Admissions)
   * Returns all student records for the schools assigned to the third‑party user.
   * Supports optional pagination and filtering by schoolId.
   */
  exports.getAllStudentsForThirdParty = async (req, res) => {
    try {
      const assignedSchoolIds = req.user.assignedSchools.map(school => school.schoolId);
      let filterSchoolIds = assignedSchoolIds;
      if (req.query.schoolId) {
        const requestedSchoolId = req.query.schoolId;
        if (!assignedSchoolIds.includes(requestedSchoolId)) {
          return res.status(403).json({
            success: false,
            message: "You do not have access to this school."
          });
        }
        filterSchoolIds = [requestedSchoolId];
      }
  
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const students = await NewStudentModel.find({
        schoolId: { $in: filterSchoolIds }
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      const totalStudents = await NewStudentModel.countDocuments({
        schoolId: { $in: filterSchoolIds }
      });
  
      return res.status(200).json({
        success: true,
        message: "Students fetched successfully",
        data: students,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalStudents / limit),
          totalStudents
        }
      });
    } catch (error) {
      console.error("Error fetching students for third-party:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch students",
        error: error.message
      });
    }
  };
  
  /**
   * Get Students by School
   * Returns student records for a specific school.
   * Expects a query parameter "schoolId". The controller verifies the third-party user’s access.
   */
  exports.getStudentsBySchool = async (req, res) => {
    try {
      const { schoolId } = req.query;
      if (!schoolId) {
        return res.status(400).json({ success: false, message: "Please provide a schoolId" });
      }
      const assignedSchoolIds = req.user.assignedSchools.map(school => school.schoolId);
      if (!assignedSchoolIds.includes(schoolId)) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this school."
        });
      }
      const students = await NewStudentModel.find({ schoolId });
      return res.status(200).json({
        success: true,
        message: "Students fetched successfully",
        data: students
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };










  /**
 * getStudentsByClassSectionThirdParty
 *
 * Fetches student records filtered by school, class, and section.
 * For third‑party users, if a schoolId is provided the function verifies that
 * the school is among those the user is assigned to. If no schoolId is provided,
 * the query is restricted to all assigned schools.
 *
 * Query parameters:
 *  - schoolId (optional)
 *  - studentClass (optional)
 *  - studentSection (optional)
 *  - page (optional, default: 1)
 *  - limit (optional, default: 10)
 */
exports.getStudentsByClassSectionThirdParty = async (req, res) => {
    try {
      const { schoolId, studentClass, studentSection } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      const query = {};
  
      // If a schoolId is provided, verify access for the third-party user
      if (schoolId) {
        const hasAccess = req.user.assignedSchools.some(s => s.schoolId === schoolId);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: "You do not have access to this school."
          });
        }
        query.schoolId = schoolId;
      } else {
        // No schoolId provided: limit the query to all schools assigned to the third-party user
        query.schoolId = { $in: req.user.assignedSchools.map(s => s.schoolId) };
      }
  
      if (studentClass) query.class = studentClass;
      if (studentSection) query.section = studentSection;
  
      const students = await NewStudentModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
  
      const totalStudents = await NewStudentModel.countDocuments(query);
  
      return res.status(200).json({
        success: true,
        data: students,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalStudents / limit),
          totalStudents
        }
      });
    } catch (error) {
      console.error("Error in getStudentsByClassSectionThirdParty:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  };