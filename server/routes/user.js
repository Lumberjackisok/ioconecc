const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');
const { login, register, test } = require('../controllers/userController');

router.post("/login", catchErr(login));
router.post("/register", catchErr(register));
router.get('/', catchErr(test));

module.exports = router;