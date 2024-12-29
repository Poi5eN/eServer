const Mark = require('../models/mark');
const Exam = require('../models/exam');

exports.addMark = async (req, res) => {
  try {
    const { studentId, examId, marks, coScholasticMarks } = req.body;

    // Verify the exam exists and belongs to the school
    const exam = await Exam.findOne({
      _id: examId,
      schoolId: req.user.schoolId,
      className: req.user.classTeacher,
      section: req.user.section
    });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found or access denied"
      });
    }

    let studentMark = await Mark.findOne({
      studentId,
      examId,
      schoolId: req.user.schoolId,
      className: req.user.classTeacher,
      section: req.user.section
    });

    if (studentMark) {
      // Update existing marks with validation
      marks.forEach(newSubjectMark => {
        // Validate against exam's subject configuration
        const examSubject = exam.subjects.find(s => s.name === newSubjectMark.subjectName);
        if (!examSubject) {
          throw new Error(`Subject ${newSubjectMark.subjectName} not found in exam configuration`);
        }
        if (newSubjectMark.marks > examSubject.totalMarks) {
          throw new Error(`Marks cannot exceed total marks for ${newSubjectMark.subjectName}`);
        }

        const existingSubjectIndex = studentMark.marks.findIndex(
          m => m.subjectName === newSubjectMark.subjectName
        );
        
        if (existingSubjectIndex !== -1) {
          studentMark.marks[existingSubjectIndex] = newSubjectMark;
        } else {
          studentMark.marks.push(newSubjectMark);
        }
      });

      if (coScholasticMarks?.length > 0) {
        studentMark.coScholasticMarks = coScholasticMarks;
      }
    } else {
      // Create new student mark
      studentMark = new Mark({
        studentId,
        examId,
        schoolId: req.user.schoolId,
        className: req.user.classTeacher,
        section: req.user.section,
        marks,
        coScholasticMarks: coScholasticMarks || []
      });
    }

    await studentMark.save();
    res.status(201).json({ success: true, mark: studentMark });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMarks = async (req, res) => {
  try {
    const { studentId, examId } = req.query;
    const query = {
      schoolId: req.user.schoolId,
      className: req.user.classTeacher,
      section: req.user.section
    };

    if (studentId) query.studentId = studentId;
    if (examId) query.examId = examId;

    const marks = await Mark.find(query)
      .populate('studentId', 'name rollNo')
      .sort({ 'studentId.rollNo': 1 });

    res.status(200).json({ success: true, marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMark = async (req, res) => {
    try {
      const mark = await Mark.findOne({
        _id: req.params.id,
        schoolId: req.user.schoolId,
        className: req.user.classTeacher,
        section: req.user.section
      });
  
      if (!mark) {
        return res.status(404).json({
          success: false,
          message: "Mark record not found"
        });
      }
  
      // Validate new marks against exam configuration
      const exam = await Exam.findById(mark.examId);
      if (!exam) {
        return res.status(404).json({
          success: false,
          message: "Associated exam not found"
        });
      }
  
      // Update marks with validation
      if (req.body.marks) {
        req.body.marks.forEach(newMark => {
          const examSubject = exam.subjects.find(s => s.name === newMark.subjectName);
          if (!examSubject) {
            throw new Error(`Subject ${newMark.subjectName} not found in exam configuration`);
          }
          if (newMark.marks > examSubject.totalMarks) {
            throw new Error(`Marks cannot exceed total marks for ${newMark.subjectName}`);
          }
        });
      }
  
      Object.assign(mark, req.body);
      await mark.save();
  
      res.status(200).json({ success: true, mark });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
  
  exports.deleteMark = async (req, res) => {
    try {
      const mark = await Mark.findOneAndDelete({
        _id: req.params.id,
        schoolId: req.user.schoolId,
        className: req.user.classTeacher,
        section: req.user.section
      });
  
      if (!mark) {
        return res.status(404).json({
          success: false,
          message: "Mark record not found"
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Mark record deleted successfully"
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  };