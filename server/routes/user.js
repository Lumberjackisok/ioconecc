const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');
const { login, register, search, test } = require('../controllers/userController');


router.post("/login", catchErr(login));
router.post("/register", catchErr(register));
router.get("/search", catchErr(search));


router.get('/test', catchErr(test));

module.exports = router;