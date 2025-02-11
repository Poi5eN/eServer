

// // Add these methods to thirdPartyController.js

// exports.getThirdPartyProfile = async (req, res) => {
//     try {
//         const user = await ThirdPartyUser.findOne({ userId: req.user.userId });
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         res.status(200).json({
//             success: true,
//             user
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// exports.updateThirdPartyProfile = async (req, res) => {
//     try {
//         const { name, email } = req.body;
//         const user = await ThirdPartyUser.findOne({ userId: req.user.userId });

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         if (email && email !== user.email) {
//             const emailExists = await ThirdPartyUser.findOne({ email });
//             if (emailExists) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Email already exists"
//                 });
//             }
//         }

//         user.name = name || user.name;
//         user.email = email || user.email;

//         await user.save();

//         res.status(200).json({
//             success: true,
//             message: "Profile updated successfully",
//             user
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// exports.getSchoolRegistrations = async (req, res) => {
//     try {
//         const { schoolId } = req.params;
//         const registrations = await NewRegistrationModel.find({ schoolId });

//         res.status(200).json({
//             success: true,
//             registrations
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// exports.getAssignedSchools = async (req, res) => {
//     try {
//         const user = await ThirdPartyUser.findOne({ userId: req.user.userId });
        
//         res.status(200).json({
//             success: true,
//             schools: user.assignedSchools
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// exports.getActivityLogs = async (req, res) => {
//     try {
//         const registrations = await NewRegistrationModel.find({
//             schoolId: { $in: req.user.assignedSchools.map(school => school.schoolId) }
//         }).sort({ createdAt: -1 }).limit(50);

//         res.status(200).json({
//             success: true,
//             activities: registrations
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// // Middleware to check if user is superadmin
// exports.isSuperAdmin = async (req, res, next) => {
//     try {
//         if (req.user.role !== 'superadmin') {
//             return res.status(403).json({
//                 success: false,
//                 message: "Access denied. Only superadmin can perform this action."
//             });
//         }
//         next();
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// exports.updateThirdPartyUser = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { name, email, assignedSchools } = req.body;

//         const user = await ThirdPartyUser.findOne({ userId });
//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         if (email && email !== user.email) {
//             const emailExists = await ThirdPartyUser.findOne({ email });
//             if (emailExists) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Email already exists"
//                 });
//             }
//         }

//         user.name = name || user.name;
//         user.email = email || user.email;
//         user.assignedSchools = assignedSchools || user.assignedSchools;

//         await user.save();

//         res.status(200).json({
//             success: true,
//             message: "User updated successfully",
//             user
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// exports.deactivateThirdPartyUser = async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const user = await ThirdPartyUser.findOne({ userId });

//         if (!user) {
//             return res.status(404).json({
//                 success: false,
//                 message: "User not found"
//             });
//         }

//         user.status = 'inactive';
//         await user.save();

//         res.status(200).json({
//             success: true,
//             message: "User deactivated successfully"
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };

// exports.getAllThirdPartyUsers = async (req, res) => {
//     try {
//         const users = await ThirdPartyUser.find();
        
//         res.status(200).json({
//             success: true,
//             users
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: error.message
//         });
//     }
// };









const NewRegistrationModel = require('../models/newRegistrationModel');
const { generateRegistrationNumber } = require('../utils/helpers');
const sendEmail = require('../utils/email');

// Create Registration (Third-Party)
exports.createRegistration = async (req, res) => {
  try {
    const {
      schoolId,
      studentFullName,
      guardianName,
      registerClass,
      studentAddress,
      mobileNumber,
      studentEmail,
      gender,
      amount,
      // Additional fields:
      rollNo,
      admissionNo,
      fatherName,
      motherName,
      remarks,
      transport,
      studentPhoto,   // Converted to Base64 by our middleware
      motherPhoto,
      fatherPhoto,
      guardianPhoto
    } = req.body;

    // Verify if the third-party user has access to this school
    const hasAccess = req.user.assignedSchools.some(school => school.schoolId === schoolId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to create registrations for this school"
      });
    }

    // Validate required fields (existing + additional)
    if (
      !studentFullName || !guardianName || !registerClass || !studentAddress ||
      !mobileNumber || !studentEmail || !gender || !amount ||
      !rollNo || !admissionNo || !fatherName || !motherName || !remarks ||
      !transport || !studentPhoto || !motherPhoto || !fatherPhoto || !guardianPhoto
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // Check for existing registration (using mobileNumber and schoolId)
    const existingRegistration = await NewRegistrationModel.findOne({ mobileNumber, schoolId });
    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "Student already registered with this mobile number"
      });
    }

    // Generate a unique registration number
    const registrationNumber = await generateRegistrationNumber();

    // Create registration with all fields plus the createdBy field
    const registration = await NewRegistrationModel.create({
      schoolId,
      studentFullName,
      guardianName,
      registerClass,
      studentAddress,
      mobileNumber,
      studentEmail,
      gender,
      amount,
      rollNo,
      admissionNo,
      fatherName,
      motherName,
      remarks,
      transport,
      studentPhoto,    // Base64-encoded string
      motherPhoto,     
      fatherPhoto,     
      guardianPhoto,   
      registrationNumber,
      createdBy: req.user.userId, // Record the creator's ID
      userType: 'thirdparty'
    });

    // Optionally, send a confirmation email
    const emailContent = `
      <p>Thank you for registering with our school.</p>
      <p>Registration Details:</p>
      <p>Student Name: ${studentFullName}</p>
      <p>Class: ${registerClass}</p>
      <p>Registration Number: ${registrationNumber}</p>
    `;
    await sendEmail(studentEmail, "Registration Confirmation", emailContent);

    res.status(201).json({
      success: true,
      message: "Registration created successfully",
      registration
    });
  } catch (error) {
    console.error('Registration creation error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get All Registrations for Assigned Schools
exports.getAllRegistrations = async (req, res) => {
  try {
    const { schoolId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {
      schoolId: { $in: req.user.assignedSchools.map(school => school.schoolId) }
    };

    // If a specific schoolId is provided, verify access
    if (schoolId) {
      const hasAccess = req.user.assignedSchools.some(school => school.schoolId === schoolId);
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: "You don't have access to this school's registrations"
        });
      }
      query.schoolId = schoolId;
    }

    const registrations = await NewRegistrationModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await NewRegistrationModel.countDocuments(query);

    res.status(200).json({
      success: true,
      registrations,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRegistrations: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Single Registration
exports.getRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const registration = await NewRegistrationModel.findById(registrationId);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    // Verify access to the registration’s school
    const hasAccess = req.user.assignedSchools.some(
      school => school.schoolId === registration.schoolId
    );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this registration"
      });
    }

    res.status(200).json({
      success: true,
      registration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Registration
exports.updateRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const updateData = req.body;

    const registration = await NewRegistrationModel.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    // Verify access
    const hasAccess = req.user.assignedSchools.some(
      school => school.schoolId === registration.schoolId
    );
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to update this registration"
      });
    }

    // Prevent updating immutable fields
    delete updateData.schoolId;
    delete updateData.registrationNumber;

    const updatedRegistration = await NewRegistrationModel.findByIdAndUpdate(
      registrationId,
      { 
        ...updateData,
        updatedBy: req.user.userId,
        lastUpdated: Date.now()
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Registration updated successfully",
      registration: updatedRegistration
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// Delete Registration
exports.deleteRegistration = async (req, res) => {
    try {
        const { registrationId } = req.params;
        
        const registration = await NewRegistrationModel.findById(registrationId);
        
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found"
            });
        }

        // Verify access
        const hasAccess = req.user.assignedSchools.some(
            school => school.schoolId === registration.schoolId
        );

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: "You don't have access to delete this registration"
            });
        }

        await registration.remove();

        res.status(200).json({
            success: true,
            message: "Registration deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};








/**
 * Fetch all registrations for the schools assigned to the third-party user.
 * Optionally, filter by a specific school ID provided as a query parameter.
 */
exports.getAllRegistrationsForThirdParty = async (req, res) => {
    try {
      // Get the list of assigned school IDs from req.user.
      // (Assuming req.user.assignedSchools is an array of objects with a schoolId property.)
      const assignedSchoolIds = req.user.assignedSchools.map(school => school.schoolId);
  
      // Check if the client provided a schoolId query parameter.
      let filterSchoolIds = assignedSchoolIds;
      if (req.query.schoolId) {
        const requestedSchoolId = req.query.schoolId;
        // Verify that the requested schoolId is in the assigned list.
        if (!assignedSchoolIds.includes(requestedSchoolId)) {
          return res.status(403).json({
            success: false,
            message: "You do not have access to this school."
          });
        }
        // Use only the requested school ID for filtering.
        filterSchoolIds = [requestedSchoolId];
      }
  
      // Find registrations whose schoolId is in the filterSchoolIds array.
      const registrations = await NewRegistrationModel.find({
        schoolId: { $in: filterSchoolIds }
      }).sort({ createdAt: -1 });
  
      return res.status(200).json({
        success: true,
        message: "Registrations fetched successfully.",
        data: registrations
      });
    } catch (error) {
      console.error("Error fetching registrations for third party:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch registrations due to an error.",
        error: error.message
      });
    }
  };
  




  const Student = require('../models/studentModel');
const Parent = require('../models/parentModel');
const { hashPassword } = require('./authController');
const cloudinary = require('cloudinary');
const { v4: uuidv4 } = require('uuid');
const getDataUri = require('../utils/dataUri');
const sendEmail = require('../utils/email');

exports.createAdmission = async (req, res) => {
  try {
    const { schoolId } = req.body;
    const files = req.files;

    // Verify school assignment
    const hasAccess = req.user.assignedSchools.some(s => s.schoolId === schoolId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this school"
      });
    }

    // Student creation logic (similar to admin's createStudentParent but with approval status)
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
      admissionNumber,
      studentAdmissionNumber,
      parentAdmissionNumber,

      // New UDISE+ fields
      stu_id,
      class: studentUdiseClass,
      section: studentUdiseSection,
      roll_no,
      student_name,
      gender: studentUdiseGender,
      DOB,
      mother_name,
      father_name,
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
    } = req.body;

    // Check if student exists
    const existingStudent = await Student.findOne({ email: studentEmail, schoolId });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student already exists in this school"
      });
    }

    // Process images
    let studentImage = {};
    if (files && files.studentImage) {
      const file = files.studentImage[0];
      const fileUri = getDataUri(file);
      const uploadResult = await cloudinary.uploader.upload(fileUri.content);
      studentImage = { public_id: uploadResult.public_id, url: uploadResult.secure_url };
    }

    // Create student with pending status
    const newStudent = await Student.create({
      schoolId,
      fullName: studentFullName,
      email: studentEmail,
      password: studentHashPassword,
      dateOfBirth: studentDateOfBirth,
      rollNo: (await NewStudentModel.countDocuments({ schoolId, class: studentClass, section: studentSection }) + 1).toString(),
      gender: studentGender,
      joiningDate: studentJoiningDate,
      address: studentAddress,
      contact: studentContact,
      class: studentClass,
      fatherName: fatherName ? fatherName : parentExist?.fullName,
      motherName: motherName ? motherName : parentExist?.motherName,
      section: studentSection,
      country: studentCountry,
      subject: studentSubject,
      admissionNumber: studentAdmissionNumberToUse,
      // isGenerated: !studentAdmissionNumber, // Set flag based on whether the admission number was provided
      religion: religion,
      caste: caste,
      nationality: nationality,
      pincode: pincode,
      state: state,
      city: city,
      image: studentImageResult ? {
        public_id: studentImageResult.public_id,
        url: studentImageResult.secure_url,
      } : undefined,

      // Add UDISE+ details in a separate section
      udisePlusDetails: {
        stu_id,
        class: studentUdiseClass,
        section: studentUdiseSection,
        roll_no,
        student_name,
        gender: studentUdiseGender,
        DOB,
        mother_name,
        father_name,
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
      }
    });
    console.log('student data is here', studentData);

    let parentData = null;
    if (parentAdmissionNumber) {
      parentData = await ParentModel.findOneAndUpdate(
        { admissionNumber: parentAdmissionNumber, schoolId },
        { $push: { studentIds: studentData._id }, studentName: studentFullName },
        { new: true }
      );
    } else if (parentEmail && parentPassword) {
      parentData = await ParentModel.create({
        schoolId: schoolId,
        studentIds: [studentData._id],
        studentName: studentFullName,
        fullName: fatherName,
        motherName,
        email: parentEmail,
        password: parentHashPassword,
        contact: parentContact,
        admissionNumber: await generateAdmissionNumber(ParentModel),
        income: parentIncome,
        qualification: parentQualification,
        image: parentImageResult ? {
          public_id: parentImageResult.public_id,
          url: parentImageResult.secure_url,
        } : undefined
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Parent details are required when creating a new parent",
      });
    }

    if (parentData) {
      studentData.parentId = parentData._id ? parentData._id : parentExist._id;
      // Save the parent admission number in student data
      studentData.parentAdmissionNumber = parentAdmissionNumber || parentData.admissionNumber;
      await studentData.save();

      if (!parentAdmissionNumber) {
        const parentEmailContent =
          `<p>Your EmailID: ${parentEmail}</p>
           <p>Your Password: ${parentPassword}</p>`;
        await sendEmail(parentEmail, "Parent Login Credentials", parentEmailContent);
      }
    } else {
      return res.status(500).json({
        success: false,
        message: "Parent is not created due to error",
      });
    }

    // Similar parent creation logic
    // ... (include parent creation code from admin's createStudentParent)

    res.status(201).json({
      success: true,
      message: "Admission created successfully (pending approval)",
      student: newStudent
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSchoolStudents = async (req, res) => {
  try {
    const { schoolId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate school access
    if (schoolId && !req.user.assignedSchools.some(s => s.schoolId === schoolId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to this school's data"
      });
    }

    const query = { 
      schoolId: schoolId || { $in: req.user.assignedSchools.map(s => s.schoolId) }
    };

    const students = await Student.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add updateStudent, deleteStudent, getStudent similar to above with school access checks