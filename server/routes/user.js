const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');
const { login, register, test } = require('../controllers/userController');
const auth = require('../middleware/auth');

router.post("/login", catchErr(login));
router.post("/register", catchErr(register));
router.get('/test', auth, catchErr(test));

module.exports = router;