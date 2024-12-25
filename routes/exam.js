const express = require("express");
const { createExam, deleteExam, updateExam, getExams } = require("../controllers/examController");
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.post('/createExam', verifyToken, createExam);
// router.delete('/deleteExam/:examId', verifyToken, deleteExam);
router.put('/updateExam', verifyToken, updateExam);
// router.get('/getAllExams', verifyToken, getAllExams);
router.get('/getExams', verifyToken, getExams);

module.exports = router;