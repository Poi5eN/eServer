const {Router} = require('express')
const { createAdmin, getAllAdmins, updateAdmin, getAdminBySlug, createThirdPartyUser } = require('../controllers/superAdminController')
const { singleUpload } = require('../middleware/multer')
const router = Router()

router.post('/createAdmin', singleUpload, createAdmin)
router.get('/getAllAdmins', getAllAdmins);
router.put('/updateAdmin/:adminId', singleUpload, updateAdmin);
router.get('/getAdminBySlug/:slug', getAdminBySlug);

router.post('/createThirdParty', singleUpload, createThirdPartyUser)


module.exports = router