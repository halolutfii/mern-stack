const express = require('express');
const { check } = require('express-validator');

const usersController = require('../controllers/users-controller');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', usersController.getUsers);

router.post('/singup', 
    fileUpload.single('image'),
    [
        check('name')
        .not()
        .isEmpty(),
        check('email')
        .normalizeEmail() // Test@test.com => test@test.com
        .isEmail(),
        check('password')
        .isLength({ min: 6 })
    ],
    usersController.singup);

router.post('/login', usersController.login);

module.exports = router;