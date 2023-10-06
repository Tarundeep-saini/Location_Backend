const fs= require("fs")
const path=require('path')

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");

const placesRoutes = require("./routes/places-route");
const userRoutes = require("./routes/users-route");

const app = express();
app.use(bodyParser.json());

app.use('/uploads/images',express.static(path.join('uploads','images')))

app.use((req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*')
  res.setHeader('Access-Control-Allow-Headers','Origin,X-Requested-With,Content-Type,Accept,Authorization')
  res.setHeader('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE')
  next()
})

app.use("/api/places", placesRoutes);

app.use("/api/users", userRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Route Not Found", 404);
  throw error;  
});

app.use((error, req, res, next) => {
  if(req.file){
    fs.unlink(req.file.path,err=>{
console.log(err);
    })
  }
  if (res.headerSent) { 
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "unknown error" });
});

mongoose
  .connect(`mongodb+srv://tarundeepsaini037:Testing1234@location.in8fipa.mongodb.net/Locations?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(5000);
    console.log("Server Created");
  })
  .catch(err=>{
    console.log("Server Not Created");
    console.log(err);
  });
