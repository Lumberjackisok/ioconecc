const router = require('express').Router();
const { catchErr } = require('../handler/errorHandler');

const { sendMessage } = require('../controllers/messageController');


router.post('/sendMessage', catchErr(sendMessage));

module.exports = router;