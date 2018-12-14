const nodeoutlook = require('nodejs-nodemailer-outlook');
const LocalStrategy = require('passport-local');
const bodyParser = require('body-parser');
const admin = require("firebase-admin");
const favicon = require('serve-favicon');
const passport = require('passport');
const mongoose = require('mongoose');
const express = require('express');
const moment = require('moment');
const path = require('path');

const Order = require('./models/SalesOrder');
const Pharmacy = require('./models/pharmacy');

const SalesPerson = require('./models/sperson');

const User = require('./models/user');

const SalesOrder = require('./models/SalesOrderItem');

const vpimedicine = require('./models/vpimedicine');

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

app.use(favicon(path.join(__dirname, 'public/assets/img', 'logo.ico')));

app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));
app.locals.moment = moment;

var active = 'index';


app.use('/retriveItems', function(req, res, next){
  var dict={};
  function sortProperties(obj)
  {
    // convert object into array
  	var sortable=[];
  	for(var key in obj)
  		if(obj.hasOwnProperty(key))
  			sortable.push([key, obj[key]]); // each item is an array in format [key, value]

  	// sort items by value
  	sortable.sort(function(a, b)
  	{
  		var x=a[1],
  			y=b[1];
  		return x<y ? 1 : x>y ? -1 : 0;
  	});
  	return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
  }
  SalesOrder.find().exec().then(function(order_items){
    for (var i in order_items){
      var key = order_items[i].medicento_name;
      var quant = order_items[i].quantity;
      if(typeof dict[key] !== 'undefined'){
          dict[key] = dict[key] + quant;
      }
      else{
        dict[key]=quant;
      };
    };
    dict = sortProperties(dict);
    res.status(200).json(dict);
  });
});

app.use('/history', (req, res, next) => {
    active = 'history';
    Order.find().populate('pharmacy_id').exec().then((orders) => {
        res.render('history', {
            orders: orders,
            active: active
        });
    }).catch(err => {
        console.log(err);
    });
});

app.use('/inventory', (req, res, next) => {
    active = 'inventory';
    vpimedicine.find().exec().then(medicines => {
        res.render('inventory', {
            medicines: medicines,
            active: active
        });
    }).catch(err => {
        console.log(err);
        res.render('inventory');
    });
});

app.use('/marketing', (req, res, next) => {
    active = 'marketing';
    res.render('marketing', {
        active: active
    });
});

app.post('/mailOrder', (req, res, next) => {
    Order.findById(req.body.order_id).populate('pharmacy_id').populate('order_items').exec().then((doc) => {
        SalesPerson.findById(doc.sales_person_id).populate('user').exec().then((salesPerson) => {
            time = moment(doc.created_at).add(30, 'm');
            time1 = moment(time).add(5, 'h');
            var csv = "Party Code, Item Code, Item Name, Qty\n";
            console.log(doc);
            content = "Order From " + doc.pharmacy_id.pharma_name + " on " + moment(time1).format('LLLL');
            message = '<h3>From Admin Panel :</h3><h3>Pharmacy Name :' + doc.pharmacy_id.pharma_name + '</h3><h5>Medicine List : </h5>';
            message += '<table border="1"><tr><th>Item Name</th><th><Item Code/th><th>Quantity</th></tr>';
            doc.order_items.forEach((items) => {
                csv +=
                    salesPerson.user.useremail +
                    "," +
                    items.code +
                    "," +
                    items.medicento_name +
                    "," +
                    items.quantity +
                    "\n";
                message += '<tr><td>' + items.medicento_name + '</td><td>' +
                    items.code + '</td><td>' +
                    items.quantity + '</td></tr>';
            });
            nodeoutlook.sendEmail({
                auth: {
                    user: "giteshshastri123@outlook.com",
                    pass: "shastri@1"
                },
                from: "giteshshastri123@outlook.com",
                to: req.body.email,
                subject: content,
                html: message,
                attachments: [{
                    filename: "SalesOrder_Medicento_" +
                        doc.pharma_name +
                        "_" +
                        moment(time1).format('LLL') +
                        ".csv",
                    content: csv
                }]
            });
        });
        res.status(200).json("Mail Sent");
    });
});

app.post('/changeStatus', (req, res, next) => {
    Order.findById(req.body.order_id).exec().then((doc) => {
        doc.status = req.body.status;
        doc.save();
        res.status(200).json(doc);
    });
});

app.post("/changeSate", function (req, res) {
    Order.findById(req.body.order_id).exec().then((doc) => {
        doc.state = req.body.state;
        doc.save();
        res.status(200).json(doc);
    });
})

app.use('/', (req, res, next) => {
    active = 'index';
    activeOrders = [];
    cancelOrders = [];
    returnsOrders = [];
    deliveredOrders = [];
    unDeliveredOrders = [];
    Order.find().populate('pharmacy_id').populate('order_items').exec().then((orders) => {
        orders.forEach((order) => {
            if (order.status == 'Active') {
                activeOrders.push(order);
            }
            if (order.status == 'Canceled') {
                cancelOrders.push(order);
            }
            if (order.status == 'Delivered') {
                deliveredOrders.push(order);
            }
            if (order.status == 'Returns') {
                returnsOrders.push(order);
            }
            if (order.status == '"Not Delivered') {
                unDeliveredOrders.push(order);
            }
        })
        res.render('index', {
            orders: orders,
            active: active,
            activeOrders: activeOrders,
            cancelOrders: cancelOrders,
            deliveredOrders: deliveredOrders,
            returnsOrders: returnsOrders
        });
    }).catch(err => {
        console.log(err);
    });
});

module.exports = app;

