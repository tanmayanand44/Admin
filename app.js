const nodeoutlook = require('nodejs-nodemailer-outlook');
const LocalStrategy = require('passport-local');
const bodyParser = require('body-parser');
const admin = require("firebase-admin");
const passport = require('passport');
const mongoose = require('mongoose');
const express = require('express');
const moment = require('moment');

const app = express();

const MONGODB_URI = "mongodb://GiteshMedi:shastri1@ds263590.mlab.com:63590/medicento";

const serviceAccount = require("./medicentomessaging-firebase-adminsdk-rkrq1-547a4adcde.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://medicentomessaging.firebaseio.com"
});

mongoose.connect(MONGODB_URI);
mongoose.Promise = global.Promise;

app.use(require('express-session')({
    secret: "Gitesh Secret Page",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'))
app.locals.moment = moment;

app.use('/', (req, res, next) => {
    res.render('index.ejs');
});

module.exports = app;