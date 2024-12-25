const AdminInfo = require("../models/adminModel.js");
const EmployeeModel = require("../models/employeeModel.js");
const NewStudentModel = require("../models/newStudentModel.js");
const ParentModel = require("../models/parentModel.js");
const Teacher = require("../models/teacherModel.js");
const { verifyPassword, createToken, setTokenCookie } = require("./authController.js");

const nameOfModel = (role) => {

    let model;

    switch(role) {
        case "admin": model = AdminInfo; break;
        case "parent": model = ParentModel; break;
        case "employee": model = EmployeeModel; break;
        case "student": model = NewStudentModel; break;
        case "teacher": model = Teacher; break;
        default: model = null; break;
    }

    return model;
}

exports.loginAll =async (req, res, next) => {
    try{  
        const {email, password, role} = req.body;
        
        
        const Collection = nameOfModel(role);
        console.log("collection",Collection)
        
        const user = await Collection.findOne({email}).select("+password");
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid credentials"
            })
        }

        const isMatch = await verifyPassword(password, user.password);


    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: "Email and Password is not valid"
        })
    }
    
    const token = await createToken(user);
    console.log("vijay------------>", token)
     setTokenCookie(req, res, token);
    
    return res.status(200).json({
        success: true,
        message: "Login Successfully",
        user,
        token
    })
}catch (err) {
    res.status(500).send({ message: err.message });
  }
}

exports.logout = (req, res, next) => {
    try {
        res.cookie("token", null, {
            httpOnly: true,
            expires: new Date(Date.now())
        }).status(200).json({
            success: true,
            message: "Logout Successfully"
        })
    }
    catch(error) {
        res.json({
            success: false,
            message: error.message
        })
    }
}
