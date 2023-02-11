const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');
const { mssageHistory, notifyList, createGroup } = require('../controllers/messageController');

router.get('/mssageHistory', catchErr(mssageHistory));
router.get('/notifyList', catchErr(notifyList));
router.post('/createGroup', catchErr(createGroup));

module.exports = router;