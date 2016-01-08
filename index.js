'use strict';

var PORT = process.env.PORT || 8080,
    SESSION_KEY = process.env.SESSION_KEY,
    DB_URL = process.env.DB_URL,
    mongoHelper = require('./mongo-helper.js'),
    mySession = require('./session.js'),
    bodyparser = require('body-parser'),
    session = require('express-session'),
    express = require('express'),
    app = express();
    
    // Testing requirements
var util = require('util');

app.use(bodyparser.urlencoded({extended: false}));

app.use(session({
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
    },
    secret: SESSION_KEY
}));
    
// Route login calls to /session to my session.js.
mySession.init(SESSION_KEY);
app.use('/session', mySession.router);

// Serve static HTML and JS files from the "public" dir.
app.use(express.static('public'));

// Connect to DB and, if successful, start listening to connections
mongoHelper.init(DB_URL, function (error) {
    if (error) { throw error; }
    console.log('Start listening on port ' + PORT);
    app.listen(PORT);
});
