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


router.post('/admissions', 
    verifyToken, 
    uploads.fields([{ name: 'studentImage', maxCount: 1 }, { name: 'parentImage', maxCount: 1 }]),
    admissionController.createAdmission
  );
  
  router.get('/admissions', verifyToken, admissionController.getSchoolStudents);
//   router.get('/admissions/:studentId', verifyToken, admissionController.getStudent);
//   router.put('/admissions/:studentId', 
//     verifyToken,
//     uploads.fields([{ name: 'studentImage', maxCount: 1 }, { name: 'parentImage', maxCount: 1 }]),
//     admissionController.updateStudent
//   );
//   router.delete('/admissions/:studentId', verifyToken, admissionController.deleteStudent);

module.exports = router;