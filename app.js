//jshint esversion:6
require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT || 3000;
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB');
const userSchemma = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret: String
});
userSchemma.plugin(passportLocalMongoose);
userSchemma.plugin(findOrCreate);
const User = new mongoose.model('user', userSchemma);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
        clientID: process.env.clientID,
        clientSecret: process.env.clientSecret,
        callbackURL: 'http://localhost:3000/auth/google/secrets'
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));


////////////////////    google auth ROUTE  ////////////////////
app.get("/auth/google",
    passport.authenticate('google', {
        scope: ["profile"]
    })
);

app.get("/auth/google/secrets",
    passport.authenticate('google', {
        failureRedirect: "/login"
    }),
    function (req, res) {
        // Successful authentication, redirect to secrets.
        res.redirect("/secrets");
    });

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

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        });

    })

////////////////////    REGISTER ROUTE  ////////////////////
app.route('/register')
    .get(function (req, res) {
        res.render('register');
    })
    .post(function (req, res) {
        User.register({
            username: req.body.username
        }, req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        });


    });

////////////////////    SECRETS ROUTE  ////////////////////
app.get("/secrets", function (req, res) {
    User.find({"secret": {$ne: null}}, 'secret', function (err, resp) { 
        if(!err){
            res.render('secrets', {usersWithSecrets: resp});
        }
    })
});

app.route('/submit')
.get(function (req,res) { 
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})
.post((req, res)=>{
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err, foundUser){
        if (err) {
          console.log(err);
        } else {
          if (foundUser) {
            foundUser.secret = submittedSecret;
            foundUser.save(function(){
              res.redirect("/secrets");
            });
          }
        }
      });
})

////////////////////    LOGOUT ROUTE  ////////////////////
app.get("/logout", function (req, res) {
    req.logout(function () {
        res.redirect("/");
    });
});

app.listen(PORT, () => {
    console.log("app is running on port %d", PORT);
});