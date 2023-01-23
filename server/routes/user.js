const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');
const { login, register } = require('../controllers/userController');

router.post("/login", catchErr(login));
router.post("/register", catchErr(register));

module.exports = router;