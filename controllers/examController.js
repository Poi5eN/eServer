// examController.js
const ExamModel = require("../models/examModel");

exports.createExam = async (req, res) => {
    try {
        const {
            academicYear,
            term,
            examName,
            examType,
            classes,
            gradingScale,
            resultCalculation,
            schedule
        } = req.body;

        // Validation
        if (!academicYear || !term || !examName || !examType || !classes || !classes.length) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        // Check for existing exam
        const existingExam = await ExamModel.findOne({
            schoolId: req.user.schoolId,
            academicYear,
            term,
            examName
        });

        if (existingExam) {
            return res.status(400).json({
                success: false,
                message: "An exam with this name already exists for the given term and academic year"
            });
        }

        const examData = await ExamModel.create({
            schoolId: req.user.schoolId,
            academicYear,
            term,
            examName,
            examType,
            classes,
            gradingScale,
            resultCalculation,
            schedule,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: "Exam created successfully",
            examData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create exam",
            error: error.message
        });
    }
};

exports.updateExam = async (req, res) => {
    try {
        const { examId } = req.params;
        const updateData = req.body;

        const exam = await ExamModel.findOne({
            _id: examId,
            schoolId: req.user.schoolId
        });

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found"
            });
        }

        if (exam.status !== 'DRAFT') {
            return res.status(400).json({
                success: false,
                message: "Cannot update published or completed exam"
            });
        }

        // Update only allowed fields
        const allowedUpdates = [
            'examName', 'classes', 'gradingScale', 
            'resultCalculation', 'schedule', 'status'
        ];

        allowedUpdates.forEach(field => {
            if (updateData[field]) {
                exam[field] = updateData[field];
            }
        });

        exam.updatedBy = req.user._id;
        const updatedExam = await exam.save();

        res.status(200).json({
            success: true,
            message: "Exam updated successfully",
            examData: updatedExam
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update exam",
            error: error.message
        });
    }
};

exports.getExams = async (req, res) => {
    try {
        const {
            academicYear,
            term,
            examType,
            status,
            className,
            section
        } = req.query;

        const filter = {
            schoolId: req.user.schoolId,
            ...(academicYear && { academicYear }),
            ...(term && { term }),
            ...(examType && { examType }),
            ...(status && { status })
        };

        if (className || section) {
            filter['classes'] = {
                $elemMatch: {
                    ...(className && { className }),
                    ...(section && { section })
                }
            };
        }

        const examData = await ExamModel.find(filter)
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        res.status(200).json({
            success: true,
            message: "Exams retrieved successfully",
            examData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve exams",
            error: error.message
        });
    }
};

// Example usage for creating an exam
// const exampleExamData = {
//     academicYear: "2023-24",
//     term: "Term 1",
//     examName: "First Unit Test",
//     examType: "UNIT_TEST",
//     classes: [{
//         className: "I",
//         section: "A",
//         subjects: [{
//             name: "Mathematics",
//             code: "MATH101",
//             type: "MAIN",
//             assessmentComponents: [{
//                 name: "Written Test",
//                 weightage: 100,
//                 maxMarks: 50,
//                 minPassMarks: 17
//             }],
//             examDate: "2024-07-15",
//             startTime: "09:00",
//             endTime: "10:30",
//             totalMarks: 50,
//             passingMarks: 17
//         }]
//     }],
//     gradingScale: [{
//         name: "A1",
//         minPercent: 90,
//         maxPercent: 100,
//         description: "Outstanding",
//         gradePoint: 10
//     }],
//     resultCalculation: {
//         includePreviousTerms: false,
//         roundingMethod: "ROUND",
//         passingCriteria: {
//             overallPercentage: 33,
//             minimumSubjects: 5,
//             includeElectives: false
//         }
//     },
//     schedule: {
//         examStart: "2024-07-15",
//         examEnd: "2024-07-30",
//         resultDate: "2024-08-15"
//     }
// };