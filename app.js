//jshint esversion:6
require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT || 3000;
const ejs = require('ejs');
const mongoose = require('mongoose');
const md5 = require('md5');
var encrypt = require('mongoose-encryption');
const bcrypt = require('bcrypt');

const saltRounds = 10;
mongoose.connect('mongodb://localhost:27017/userDB');

const app = express();
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

const userSchemma = new mongoose.Schema({
    email: String,
    password: String
});

userSchemma.plugin(encrypt, {
    secret: process.env.SECRET,
    encryptedFields: ["password"]
});

const User = new mongoose.model('user', userSchemma);

////////////////////    ROOT ROUTE     ////////////////////
app.get('/', function (req, res) {
    res.render('home');
})

////////////////////    LOGIN ROUTE     ////////////////////
app.route('/login')
    .get(function (req, res) {
        res.render('login');
    })
    .post(function (req, res) {
        const username = req.body.username;
        const password = req.body.password;
        User.findOne({
            email: username
        }, function (err, resp) {
            if (!err) {
                bcrypt.compare(password, resp.password, function (err, result) {
                    if (result) res.render('secrets');
                    else {
                        console.log("Incorrect password");
                        res.redirect('/');
                    }
                });
            } else {
                console.log(err);
            }
        })
    })


////////////////////    REGISTER ROUTE  ////////////////////
app.route('/register')
    .get(function (req, res) {
        res.render('register');
    })
    .post(function (req, res) {
        bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
            const user = new User({
                email: req.body.username,
                password: hash
            })
            user.save(function (err, resp) {
                if (!err) res.render('secrets');
                else console.log(err);
            })
        });
    })


app.listen(PORT, () => {
    console.log("app is running on port %d", PORT);
});