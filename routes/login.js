const express = require('express');
const router = express.Router();
const {loginView} = require('../controllers/loginController');

router.get('/login', loginView);

module.exports = router;