const { validatonResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

const httpError = require("../models/http-error");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    return next(new httpError("Fetching user failed", 500));
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  // console.log(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new httpError("write properely", 422));
  }
  const { name, email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new httpError("User Already Exists, Try Login", 500));
  }

  if (existingUser) {
    console.log("here");
    return next(new httpError("User already exist", 422));
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(new httpError("User Not Created Try Again", 500));
  }

  console.log(req.file.path);
  const newUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword,
    places: [],
  });
  try {
    await newUser.save();
  } catch (error) {
    return next(new httpError("failed to sign up", 500));
  }
  let token;
  try {
    token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new httpError("failed to sign up", 500));
  }
  res
    .status(201)
    .json({ userId: newUser.id, email: newUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  let existingUser = false;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    return next(new httpError("failed to Lin In", 500));
  }

  if (!existingUser) {
    return next(new httpError("USER not Exist", 422));
  }
  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    return next(new httpError("Could Not Log You In, Wrong Credentials", 500));
  }

  if (!isValidPassword) {
    return next(new httpError("password Invalid", 501));
  }
  let token;
  try {
    token = jwt.sign(
      { userId: existingUser._id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    return next(new httpError("failed to Loging up", 500));
  }
  res.json({
    userId: existingUser._id,
    email: existingUser.email,
    token: token,
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
