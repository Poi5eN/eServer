const express = require("express");
const {createResults,getResults  } = require("../controllers/resultController");
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.post('/createResults', verifyToken, createResults);
router.get('/getResults', verifyToken, getResults);
// router.delete('/deleteExam/:examId', verifyToken, deleteExam);
// router.put('/updateExam', verifyToken, updateExam);

module.exports = router;