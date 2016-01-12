'use strict';

var PORT = process.env.PORT || 8080,
    SESSION_KEY = process.env.SESSION_KEY,
    DB_URL = process.env.DB_URL,
    mongoHelper = require('./mongo-helper.js'),
    collection,
    objectID=require('mongodb').ObjectID,
    mySession = require('./session.js'),
    bodyparser = require('body-parser'),
    https = require('https'),
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

// List all books in all users' collections
app.post('/list-all-books', function (req, res) {
    collection.find({}).toArray(function(err, data) {
        if (err) {
            res.send({
                error: true,
                message: "Database error, sorry!"
            });
            return console.log(err);
        }
        res.send({
            error: false,
            data: data
        });
    });
});

// List books of user's personal collection
app.post('/list-personal-collection', function (req, res) {
    var userID = req.session.passport ? objectID(req.session.passport.user) : false;
    if (!userID) {
        return res.send({
            error: true,
            message: "Not logged in"
        });
    }
    collection.find({ owner: userID }).toArray(function(err, data) {
        if (err) {
            res.send({
                error: true,
                message: "Database error, sorry!"
            });
            return console.log(err);
        }
        res.send({
            error: false,
            data: data
        });
    });
});

// Listen to book query and get JSON at Open Library
app.post('/search-book', function (req, res) {
    var title = typeof(req.body.title) == "string" ? req.body.title.toLowerCase().trim().split(' ').join('+') : false,
        author = typeof(req.body.author) == "string" ? req.body.author.toLowerCase().trim().split(' ').join('+') : false;
    // Check if at least one field has been informed
    if (!title && !author) {
        return res.send({
            error: true,
            message: "Please fill in at least one field"
        });
    }
    // Make https query string to the Open Library search API
    var queryString = 'https://openlibrary.org/search.json?';
    if (title) {
        queryString += 'title=' + title;
        if (author) { queryString += '&' }
    }
    if (author) {
        queryString += 'author=' + author;
    }
    // Call Open Library search API and get the results as JSON
    var request = https.get(queryString, function(httpResponse) {
        var body = '';
        httpResponse.on('data', function(chunk) {
            body += chunk;
        }).on('end', function() {
            var data;
            try {
                data = JSON.parse(body);
            }
            catch(e) {
                return res.send({
                    error: true,
                    message: "Invalid results. Sorry!"
                });
            }
            var resultsArray = [];
            if (data.docs && data.docs.length > 0) {
                // Let's limit results to 12.
                var limit = data.docs.length < 12 ? data.docs.length : 12;
                var placeholderCover = (req.secure ? 'https://' : 'http://') + req.headers.host + '/img/cover-placeholder.png';
                for (var i = 0; i < limit; i++) {
                    resultsArray.push({
                        title: data.docs[i].title ? data.docs[i].title : "N/A",
                        authors: data.docs[i].author_name ? data.docs[i].author_name.join(', ') : "N/A",
                        cover: data.docs[i].cover_edition_key ? 'http://covers.openlibrary.org/b/olid/' + data.docs[i].cover_edition_key + '-M.jpg' : placeholderCover
                    });
                }
                res.send({
                    error: false,
                    data: resultsArray
                });
            } else {
                return res.send({
                    error: true,
                    message: "No results found"
                });
            }
        });
    });
    request.on('error', function(err) {
        return res.send({
            error: true,
            message: err
        });
    });
});

// Function to add a book to user's collection
app.post('/add-book', function (req, res) {
    var userID = req.session.passport ? objectID(req.session.passport.user) : false;
    if (!userID) {
        return res.send({
            error: true,
            message: "Not logged in"
        });
    }
    var bookObject = JSON.parse(JSON.stringify(req.body));
    delete bookObject['$$hashKey'];
    bookObject.owner = userID;
    collection.insert(bookObject, function(err, data) {
        if (err) {
            res.send({
                error: true,
                message: "Database error, sorry!"
            });
            return console.log(err);
        }
        res.send({
            error: false,
            message: "Book added to collection"
        });
    });
});

// Function to undo the above
app.post('/remove-book', function (req, res) {
    var userID = req.session.passport ? objectID(req.session.passport.user) : false;
    if (!userID) {
        return res.send({
            error: true,
            message: "Not logged in"
        });
    }
    var bookObject = JSON.parse(JSON.stringify(req.body));
    if (userID != bookObject.owner) {
        return res.send({
            error: true,
            message: "User does not own the book"
        });
    }
    var bookID = objectID(bookObject._id);
    collection.remove({ _id: bookID }, { justOne: true }, function(err, data) {
        if (err) {
            res.send({
                error: true,
                message: "Database error, sorry!"
            });
            return console.log(err);
        }
        res.send({
            error: false,
            message: "Book removed from collection"
        });
    });
});

// Connect to DB and, if successful, start listening to connections
mongoHelper.init(DB_URL, function (error) {
    collection = mongoHelper.db.collection('libraries');
    if (error) { throw error; }
    console.log('Start listening on port ' + PORT);
    app.listen(PORT);
});
