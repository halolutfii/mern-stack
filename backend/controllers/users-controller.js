// const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const { validationResult } = require('express-validator');
const User = require('../models/user');

// const DUMMY_USERS = [
//     {
//         id: 'u1',
//         name: 'Lutfi Cahya Nugraha',
//         email: 'test@gmail.com',
//         password: '123123'
//     }
// ]; -- DUMMY USER

const getUsers = async (req, res, next) => {
    let users;

    try {
        users = await User.find({}, '-password');
    } catch (err) {
        const error = new HttpError(
            'Fetching users failed, please try again later', 500
        )
        return next(error);
    }

    res.json({users: users.map(user => user.toObject({ getters: true}) )});
    // res.json({ users: DUMMY_USERS }); -- DUMMY USER
};

const singup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next( 
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }   
    
    const { name, email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError(
            'Singing up failed, please try again later.', 500
        );
        return next(error);
    }

    if (existingUser) {
        const error = new HttpError(
            'User exists already, please login instead.', 422
        );
        return next(error);
    };

    let hashedPassword;
    try {
        hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
        const error = new HttpError('Could not create user, please try again.', 500);
        return next(error);
    }

    const createdUser = new User({
        name, 
        email,
        image: req.file.path,
        password: hashedPassword,
        places: []
    });

    try {
        await createdUser.save();
    } catch (err) {
        const error = new HttpError(
            'Singing up failed, please try again later.', 500
        );
        return next(error);
    }

    let token;
    try {
        token = jwt.sign({userId: createdUser.id, email: createdUser.email}, process.env.JWT_KEY, {expiresIn: '1h'});
    } catch (err) {
        const error = new HttpError(
            'Singing up failed, please try again later.', 500
        );
        return next(error);
    }

    res.status(200).json({ userId: createdUser.id, email: createdUser.email, token: token });

    // res.status(200).json({user: createdUser.toObject({ getters: true }) }); -- before auth jwt

    // const hasUser = DUMMY_USERS.find(u => u.email === email);
    // if (hasUser) {
    //     throw new HttpError("Could not create user, email already exist!.", 422);
    // } -- DUMMY USERS

    // const createdUser = {
    //     id: uuidv4(),
    //     name,
    //     email,
    //     password
    // } -- DUMMY USERS

    // DUMMY_USERS.push(createdUser); -- DUMMY USERS

    // res.status(200).json({user:createdUser}); -- USER DUMMY
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    let existingUser;

    try {
        existingUser = await User.findOne({ email: email });
    } catch (err) {
        const error = new HttpError(
            'Logging in failed, please try again later.', 500
        );
        return next(error);
    }

    if (!existingUser) {
        const error = new HttpError(
            'Invalid credentials, could not log you in.', 403
        );
        return next(error);
    }

    let isValidPassword = false;
    try {
        isValidPassword = await bcrypt.compare(password, existingUser.password);
    } catch (err) {
        const error = new HttpError(
            'Could not log you in, please check your credentials and try again.', 500
        );
        return next(error);
    }

    if (!isValidPassword) {
        const error = new HttpError(
            'Invalid credentials, could not log you in.', 403
        );
        return next(error);
    }

    let token;
    try {
        token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, process.env.JWT_KEY, {expiresIn: '1h'});
    } catch (err) {
        const error = new HttpError(
            'Logging in failed, please try again later.', 500
        );
        return next(error);
    }

    res.status(200).json({ userId: existingUser.id, email: existingUser.email, token: token });

    // const identifiedUser = DUMMY_USERS.find(u => u.email === email);
    // if (!identifiedUser || identifiedUser.password !== password) {
    //     throw new HttpError("Could not identify user, credentials seem to be wrong", 401);
    // } -- DUMMY USERS

    // res.status(200).json({message: "Logged in!", user: existingUser.toObject({ getters: true })});  -- before use token jwt
};

exports.getUsers = getUsers;
exports.singup = singup;
exports.login = login;