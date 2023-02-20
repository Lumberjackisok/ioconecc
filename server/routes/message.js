const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');
const { mssageHistory, notifyList, createGroup, updateMessageStatus } = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/mssageHistory', auth, catchErr(mssageHistory));
router.get('/notifyList', auth, catchErr(notifyList));
router.post('/createGroup', auth, catchErr(createGroup));
router.post('/updateMessageStatus', auth, catchErr(updateMessageStatus))

module.exports = router;