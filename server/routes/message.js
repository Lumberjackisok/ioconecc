const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');
const { test, mssageHistory, notifyList, createGroup, updateMessageStatus, updateMessageByIds } = require('../controllers/messageController');
const auth = require('../middleware/auth');


router.get('/test', catchErr(test));

router.get('/mssageHistory', auth, catchErr(mssageHistory));
router.get('/notifyList', auth, catchErr(notifyList));
router.post('/createGroup', auth, catchErr(createGroup));
router.post('/updateMessageStatus', auth, catchErr(updateMessageStatus));
router.post('/updateMessageByIds', auth, catchErr(updateMessageByIds));

module.exports = router;