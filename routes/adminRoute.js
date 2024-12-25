const {Router} = require('express')
const router = Router()
const admin = require('../controllers/adminController')
const {singleUpload, uploads} = require('../middleware/multer')
const verifyToken = require('../middleware/auth')

console.log('Admin routes loaded'); // Add this line
 
// router.post('/adminlogin', admin.adminlogin)
router.get('/getAdminInfo', verifyToken, admin.getAdminInfo);

router.post('/createTeacher', verifyToken, singleUpload, admin.createTeacher)
router.put('/deactivateTeacher', verifyToken, admin.deactivateTeacher)
router.put('/updateTeacher', verifyToken, singleUpload, admin.updateTeacher)
router.get('/getTeachers', verifyToken, admin.getAllTeachers)

router.post('/createFees', verifyToken, admin.createFeeStructure)
router.get('/getFees', verifyToken, admin.getAllFeeStructures)
router.get('/getAllFees', verifyToken, admin.getAllFees)
router.put('/updateFees/:feeStructureId', verifyToken, admin.updateFees)
router.delete('/deleteFees/:feeStructureId', verifyToken, admin.deleteFees)
router.post('/issueBook', verifyToken, admin.issueBook);
router.put('/returnBook/:issueId', verifyToken, admin.returnBook);
router.get('/getAllIssuedBookStudent', verifyToken, admin.getAllIssuedBookStudent);

router.post("/createAdditionalFees", verifyToken, admin.createAdditionalFee);
router.get("/getAdditionalFees", verifyToken, admin.getAllAdditionalFee);
// router.put("/updateAdditionalFees/:feeStructureId", verifyToken, admin.updateAdditionalFee);
// router.delete('/deleteAdditionalFees/:feeStructureId', verifyToken, admin.deleteAdditionalFee)

router.post('/createBook', verifyToken, admin.createBookDetails);
router.get('/getAllBooks', verifyToken, admin.getAllBooks);
router.delete('/deleteBook/:bookId', verifyToken, admin.deleteBook);
router.put('/updateBook/:bookId', verifyToken, admin.updateBook);
router.post('/issueBook', verifyToken, admin.issueBook);
router.put('/returnBook', verifyToken, admin.returnBook);
router.get('/getIssueBookToMe', verifyToken, admin.getAllIssueBookToMe);

router.post('/createItem', verifyToken, admin.createItemDetails);
router.get('/getAllItems', verifyToken, admin.getAllItems);
router.delete('/deleteItem/:itemId', verifyToken, admin.deleteItem);
router.put('/updateItem/:itemId', verifyToken, admin.updateItem);

// POST route for creating registration
router.post('/createRegistration', verifyToken, uploads, admin.createRegistration);
router.post('/createBulkRegistrations', verifyToken, uploads, admin.createBulkRegistrations);
router.put('/editRegistration/:registrationNumber', verifyToken, uploads, admin.editRegistration);
router.delete('/deleteRegistration/:registrationNumber', verifyToken, uploads, admin.deleteRegistration);
// GET route for fetching all registrations
router.get('/getRegistrations', verifyToken, uploads, admin.getRegistrations);
// GET route for fetching a specific registration by ID
// router.get('/getRegistration/:id', verifyToken, uploads, admin.getRegistrationById);
router.get('/getRegistration/:registrationNumber', verifyToken, uploads, admin.getRegistrationByNumber);
router.post('/createStudentParent', verifyToken, uploads, admin.createStudentParent);
router.post('/addSibling', verifyToken, uploads, admin.addSibling);
router.post('/createBulkStudentParent', verifyToken, uploads, admin.createBulkStudentParent);
router.get('/getDataByAdmissionNumber/:admissionNumber', verifyToken, uploads, admin.getDataByAdmissionNumber);
router.get('/getParentWithChildren/:parentAdmissionNumber', verifyToken, uploads, admin.getParentWithChildren);
router.put('/updateParent', verifyToken, singleUpload, admin.updateParent);
router.put('/deactivateParent', verifyToken, admin.deactivateParent);
router.get('/getAllParents', verifyToken, admin.getAllParents);
router.get('/getAllParentsWithChildren', verifyToken, admin.getAllParentsWithChildren);
router.get('/getStudentAndParent/:studentId', verifyToken, admin.getStudentAndParent);
router.get('/getAllStudents', verifyToken, admin.getAllStudents)
router.put('/deactivateStudent', verifyToken, admin.deactivateStudent);
router.put('/editStudentParent/:studentId', verifyToken,uploads, admin.editStudentParent);
// router.put('/editStudentParent', verifyToken, admin.editStudentParent); {Old that takes ID as field}
router.put('/updateStudent', verifyToken, singleUpload, admin.updateStudent);
router.get('/getDeactivatedStudents', verifyToken, singleUpload, admin.getDeactivatedStudents);
router.delete('/deleteStudent', verifyToken, singleUpload, admin.deleteStudent);

router.get('/getLastYearStudents', verifyToken, admin.getStudentsCreatedAfterAprilOfCurrentYear)


router.delete('/deleteStudentsBySchool', verifyToken, admin.deleteStudentsBySchool)
router.delete('/deleteStudentsByClass', verifyToken, admin.deleteStudentsByClass)


router.post("/createEmployee", verifyToken, singleUpload, admin.createEmployee);
router.get("/getAllEmployees", verifyToken, admin.getAllEmployees);
router.put('/deactivateEmployee', verifyToken, admin.deactivateEmployee);
router.put('/updateEmployee', verifyToken, singleUpload, admin.updateEmployee);


router.post('/createClass', verifyToken, admin.createClass);
router.get('/getAllClasses', verifyToken, admin.getAllClasses);
router.get('/getClass/:id', verifyToken, admin.getClassById);
router.put('/updateClass', verifyToken, admin.updateClass);
router.delete('/deleteClass/:id', verifyToken, admin.deleteClass);
router.get('/getAllStudentStatus', verifyToken, admin.getAllStudentStatus)
router.get('/myKids', verifyToken, admin.getMyKids);

router.post('/createNotice', verifyToken, singleUpload, admin.createNotice);
router.delete('/deleteNotice/:noticeId', verifyToken, admin.deleteNotice);
router.put('/updateNotice/:noticeId', verifyToken, singleUpload, admin.updateNotice);
// router.get('/getAllNotice',admin.getAllNotice);
router.get('/getAllNotice', verifyToken, admin.getAllNotice);

// router.get('/getAllStudentOfClass', verifyToken, admin.getAllStudentOfClass);
router.put('/promotionOfStudent', verifyToken, admin.promotionOfStudent);


router.post('/createCurriculum', verifyToken, singleUpload, admin.createCurriculum);
router.delete('/deleteCurriculum/:curriculumId', verifyToken, admin.deleteCurriculum);
router.put('/updateCurriculum/:curriculumId', verifyToken, singleUpload, admin.updateCurriculum);
router.get('/getAllCurriculum', verifyToken, admin.getAllCurriculum);

router.post('/createAssignment', verifyToken, singleUpload, admin.createAssignment);
router.delete('/deleteAssignment/:assignmentId', verifyToken, admin.deleteAssignment);
router.put('/updateAssignment/:assignmentId', verifyToken, singleUpload, admin.updateAssignment);
router.get('/getAllAssignment', verifyToken, admin.getAllAssignment);

module.exports = router 
