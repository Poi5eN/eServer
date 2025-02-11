// const { Router } = require('express');
// const router = Router();
// // const thirdParty = require('../controllers/thirdpartyController');
// const admin = require('../controllers/adminController'); // For registration functionality
// const verifyToken = require('../middleware/auth');
// const { verifySchoolAccess, thirdParty } = require('../controllers/thirdpartyController');

// console.log('Third Party routes loaded');

// // Profile routes
// // router.get('/getProfile', verifyToken, thirdParty.getThirdPartyProfile);
// // router.put('/updateProfile', verifyToken, thirdParty.updateThirdPartyProfile);

// // Registration management routes
// // router.post('/registration/:schoolId', 
// //     verifyToken, 
// //     verifySchoolAccess, 
// //     admin.createRegistration
// // );

// // router.get('/registrations/:schoolId', 
// //     verifyToken, 
// //     verifySchoolAccess, 
// //     thirdParty.getSchoolRegistrations
// // );

// // // School access routes
// // router.get('/assigned-schools', 
// //     verifyToken, 
// //     thirdParty.getAssignedSchools
// // );

// // // Activity logs
// // router.get('/activity-logs', 
// //     verifyToken, 
// //     thirdParty.getActivityLogs
// // );

// // // For SuperAdmin to manage third party users
// // router.post('/create', 
// //     verifyToken, 
// //     thirdParty.isSuperAdmin, 
// //     thirdParty.createThirdPartyUser
// // );

// // router.put('/update/:userId', 
// //     verifyToken, 
// //     thirdParty.isSuperAdmin, 
// //     thirdParty.updateThirdPartyUser
// // );

// // router.put('/deactivate/:userId', 
// //     verifyToken, 
// //     thirdParty.isSuperAdmin, 
// //     thirdParty.deactivateThirdPartyUser
// // );

// // router.get('/all', 
// //     verifyToken, 
// //     thirdParty.isSuperAdmin, 
// //     thirdParty.getAllThirdPartyUsers
// // );

// module.exports = router;









// routes/thirdPartyRoutes.js
const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/thirdpartyController');
const verifyToken = require('../middleware/auth');
const { uploadResults } = require('../controllers/resultController');
const { uploads } = require('../middleware/multer');
const { convertImagesToBase64 } = require('../middleware/imageUpload');
const thirdpartyAdmissionController = require('../controllers/thirdpartyAdmissionController');

/**
 * POST /api/thirdparty/admissions
 * Creates a new admission.
 * - Expects either JSON or multipart/form-data.
 * - Uses verifyToken middleware to ensure the user is authenticated.
 */
router.post(
  '/admissions',
  verifyToken,
  uploads,                // For handling file uploads (if any)
  convertImagesToBase64,  // To convert images to Base64 (if needed)
  thirdpartyAdmissionController.createAdmission
);

/**
 * GET /api/thirdparty/admissions
 * Returns all admissions (student records) for all schools assigned to the third‑party user.
 * Optional query parameters:
 *   - schoolId (to filter results to a single school)
 *   - page, limit (for pagination)
 */
router.get(
  '/admissions',
  verifyToken,
  thirdpartyAdmissionController.getAllStudentsForThirdParty
);

/**
 * GET /api/thirdparty/studentsBySchool
 * Returns all students for a specific school.
 * Expects a query parameter "schoolId". The controller will verify that the schoolId is assigned to the user.
 */
router.get(
  '/studentsBySchool',
  verifyToken,
  thirdpartyAdmissionController.getStudentsBySchool
);


// Registration CRUD routes
// POST route for creating registration in ThirdParty
router.post(
    '/registrations',
    verifyToken,
    uploads,
    convertImagesToBase64,
    registrationController.createRegistration
  );

router.get('/registrations', 
    verifyToken,
    registrationController.getAllRegistrations
);

router.get('/registrations/:registrationId', 
    verifyToken,
    registrationController.getRegistration
);

router.put('/registrations/:registrationId', 
    verifyToken,
    registrationController.updateRegistration
);

router.delete('/registrations/:registrationId', 
    verifyToken,
    registrationController.deleteRegistration
);

router.get('/thirdparty/registrations', verifyToken, registrationController.getAllRegistrationsForThirdParty);



// routes/thirdPartyAdmissionRoutes.js

/**
 * POST /api/thirdparty/admissions
 * Creates a new admission.
 * - Expects either JSON or multipart/form-data.
 * - Uses verifyToken middleware to ensure the user is authenticated.
 */
// router.post(
//   '/admissions',
//   verifyToken,
//   uploads,                // For handling file uploads (if any)
//   convertImagesToBase64,  // To convert images to Base64 (if needed)
//   thirdpartyAdmissionController.createAdmission
// );

// /**
//  * GET /api/thirdparty/admissions
//  * Returns all admissions (student records) for all schools assigned to the third‑party user.
//  * Optional query parameters:
//  *   - schoolId (to filter results to a single school)
//  *   - page, limit (for pagination)
//  */
// router.get(
//   '/admissions',
//   verifyToken,
//   thirdpartyAdmissionController.getAllStudentsForThirdParty
// );

// /**
//  * GET /api/thirdparty/studentsBySchool
//  * Returns all students for a specific school.
//  * Expects a query parameter "schoolId". The controller will verify that the schoolId is assigned to the user.
//  */
// router.get(
//   '/studentsBySchool',
//   verifyToken,
//   thirdpartyAdmissionController.getStudentsBySchool
// );


// GET route to fetch students by class/section (Third-Party)
router.get('/students/filter', verifyToken, thirdpartyAdmissionController.getStudentsByClassSectionThirdParty);


module.exports = router;