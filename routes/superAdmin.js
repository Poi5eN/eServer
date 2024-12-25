const {Router} = require('express')
const { createAdmin, getAllAdmins, updateAdmin } = require('../controllers/superAdminController')
const { singleUpload } = require('../middleware/multer')
const router = Router()

router.post('/createAdmin', singleUpload, createAdmin)
router.get('/getAllAdmins', getAllAdmins);
router.put('/updateAdmin/:adminId', singleUpload, updateAdmin);

module.exports = router