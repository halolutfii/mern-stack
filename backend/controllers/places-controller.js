const fs = require('fs');
// const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Place = require('../models/places');
const User = require("../models/user");
const mongoose = require('mongoose');

// let DUMMY_PLACES = [
//     {
//         id: 'p1',
//         title: 'Empire State Building',
//         description: 'One of the most famous sky scrapers in the world!',
//         location: {
//             lat: 40.7484474,
//             lng: -71.9871516
//         },
//         address: '20 W 34th St, New York, NY 10001',
//         creator: 'u1'
//     }
// ];


const getPlaceById = async (req, res, next) => {
    const placeId = req.params.pid; // { pid: 'p1' }
    // const place = DUMMY_PLACES.find(p => {
    //     return p.id === placeId;
    // }); --DUMMY PLACES

    let place;

    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not find a place.', 500
        );
        return next(error);
    };

    if (!place) {
        const error = new HttpError('Could not find a place for the provided id.', 404);
        return next(error);
    };

    res.json({place: place.toObject( {getters:true} ) });
    // res.json({place}); for dummy
};

// function getPlaceById() { ... }
// const getPlaceById = function() { ... }

const getPlacesByUserId = async (req, res, next) => {
    const userId = req.params.uid;

    // let places;
    let userWithPlaces;

    try {
        userWithPlaces = await User.findById(userId).populate('places');

        // places = await Place.find({ creator: userId }); -- LET IF USE ONLY PLACES;
    } catch (err) {
        const error = new HttpError(
            'Fetching places failed, please try again later.', 500
        );
        return next(error);
    }
    
    if (!userWithPlaces || userWithPlaces.places.length === 0) {
        return next(
            new HttpError('Could not find places for the provided user id.', 404)
        );
    }

    // const places = DUMMY_PLACES.filter(p => {
    //     return p.creator === userId;
    // }); --DUMMY PLACES

    // if (!places || places.length === 0) {
    //     return next(
    //         new HttpError('Could not find a places for the user id.', 404)
    //     );
    // } -- LET IF USE ONLY PLACES

    res.json({ places: userWithPlaces.places.map(place => place.toObject({ getters: true })) });
    // res.json({places}); for dummy
};

const createPlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        );
    }   

    const { title, description, address } = req.body;

    let coordinates;

    try {
        coordinates = await getCoordsForAddress(address);
    } catch (error) {
        return next(error);
    }

    // const title = req.body.title;
    const createdPlace = new Place({
        title, 
        description,
        address,
        location: coordinates,
        image: req.file.path,
        creator: req.userData.userId
    });

    let user;

    try {
        user = await User.findById(req.userData.userId);
    } catch (err) {
        const error = new HttpError(
            'Creating place failed, please try again.', 500
        );
        return next(error);
    }

    if (!user) {
        const error = new HttpError('Could not find user for provided id', 404);
        return next(error);
    }

    // console.log(user); -- debug data create

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await createdPlace.save({ session: sess });
        user.places.push(createdPlace);
        await user.save({ session: sess });
        await sess.commitTransaction();

        // await createdPlace.save(); if you not use relation places & users with transaction
    } catch (err) {
        const error = new HttpError(
            'Creating place failed, please try again.',
            500
        );
        return next(error);
    }

    // const createPlace = {
    //     id: uuidv4(),
    //     title, 
    //     description,
    //     location: coordinates,
    //     address,
    //     creator
    // }

    // DUMMY_PLACES.push(createPlace); // unshift(createdPlace)

    res.status(200).json({place: createdPlace});
}

const updatePlace = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(
            new HttpError('Invalid inputs passed, please check your data.', 422)
        ); 
    }   

    const { title, description } = req.body;
    const placeId = req.params.pid;

    let place;

    try {
        place = await Place.findById(placeId);
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update place.', 500
        );
        return next(error);
    }

    if (place.creator.toString() !== req.userData.userId) {
        const error = new HttpError(
            'You are not allowed to edit this place.', 401
        );
        return next(error);
    }

    place.title = title;
    place.description = description;

    try {
        await place.save();
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not update place.', 500
        );
        return next(error);
    }

    // {
    // const updatedPlace = { ...DUMMY_PLACES.find(p => p.id === placeId) };
    // const placeIndex = DUMMY_PLACES.findIndex(p => p.id === placeId);
    // updatedPlace.title = title;
    // updatedPlace.description = description;

    // DUMMY_PLACES[placeIndex] = updatedPlace;
    // } -- DUMMY PLACES

    res.status(200).json({ place: place.toObject({ getters: true }) });
    // res.status(200).json({place: updatedPlace}); -- DUMMY PLACES
}

const deletePlace = async (req, res, next) => {
    const placeId = req.params.pid;
    
    let place;

    try {
        place = await Place.findById(placeId).populate('creator');
        // place = await Place.findByIdAndDelete(placeId); -- optional IF NOT USE await place.deleteOne();
    } catch (err) {
        const error = new HttpError(
            'Something went wrong, could not delete place.', 500
        );
        return next(error);
    }

    if (!place) {
        const error = new HttpError(
            'Could not find place for this id.', 404
        )
        return next(error);
    }

    if (place.creator.id !== req.userData.userId) {
        const error = new HttpError(
            'You are not allowed to deleted this place.', 401
        );
        return next(error);
    }

    const imagePath = place.image;

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await place.deleteOne({ session: sess });
        place.creator.places.pull(place);
        await place.creator.save({ session: sess });
        await sess.commitTransaction();
        
        // await place.deleteOne(); if you not use transaction for delete.
    } catch (err) {
        // console.error(err); --dubug error HAHA
        const error = new HttpError(
            'Something went wrong, could not delete place.', 500
        );
        return next(error);
    }

    // {
    //     if (!DUMMY_PLACES.find(p => p.id === placeId)) {
    //     throw new HttpError('Could not find a place for that id.', 404);
    // }
    // DUMMY_PLACES = DUMMY_PLACES.filter(p => p.id !== placeId);
    // } -- DUMMY PLACE

    fs.unlink(imagePath, err => {
        console.log(err);
    });

    res.status(200).json({message: "Deleted place."});
}

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;