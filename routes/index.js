const express = require('express');
const router = express.Router();
const {indexView} = require('../controllers/indexController');

router.get('/', indexView);

module.exports = router;