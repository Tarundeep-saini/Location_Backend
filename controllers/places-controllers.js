const fs= require('fs')

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const httpError = require("../models/http-error");

const Place = require("../models/place");
const User = require("../models/user");

const getPlacesByID = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(new httpError("Someting wentwront place not found", 500));
  }
  if (!place) {
    const error = new httpError(`${placeId} Not Found`, 404);
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (error) {
    return next(new httpError("Fetching failded try again", 500));
  }

  if (!places || places.length === 0) {
    return next(new httpError("This User Has Not Uploaded.", 404));
  }
  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new httpError("write properely", 422));
  }

  const { title, description, address, creator } = req.body;

  const createdPlace = new Place({
    title,
    description,
    image: req.file.path,
    address,
    location: {
      lat: 2134,
      lng: -3872,
    },
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (error) {
    return next(new httpError("Failed to create place", 500));
  }

  if (!user) {
    return next(new httpError("user not found for provided id", 404));
  }

  try {
    await createdPlace.save();
    user.places.push(createdPlace);
    await user.save();
  } catch (error) {
    return next(new httpError(error, 500));
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new httpError("write properely", 422);
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    return next(new httpError("Could not update the place", 500));
  }
if(place.creator.toString() !== req.userData.userId){
  return next(new httpError("You are not allowed to edit this palce", 401));
}
  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (error) {
    return next(new httpError("Not Updated", 500));
  }
  res.status(200).json({ place: place.toObject({ getters: true }) });
};
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    return next(new httpError("Place Not Deleted", 500));
  }

  if (!place) {
    return next(new httpError("Place Not Found for ID", 404));
  }

  if(place.creator.id !== req.userData.userId){
    return next(new httpError("You can't Delete this place. ", 401));
  }


  const imagePath= place.image
  try {
    await place.deleteOne();
    place.creator.places.pull(place);
    await place.creator.save();
    fs.unlink(imagePath,err=>{
      
    })

    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    return next(new httpError("Place Not Deleted, Try again", 500));
  }
};

exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
exports.getPlacesByID = getPlacesByID;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
