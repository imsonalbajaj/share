//jshint esversion:6
const express = require('express');
const PORT = process.env.PORT || 3000;
const ejs = require('ejs');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/userDB');

const app = express();
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');


// 


app.listen(PORT, () => {
    console.log("app is running on port %d", PORT);
});