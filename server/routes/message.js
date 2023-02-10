const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');
const { mssageHistory } = require('../controllers/messageController');

router.get('/mssageHistory', catchErr(mssageHistory));

module.exports = router;