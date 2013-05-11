/**
 * Module dependencies.
 */

var express = require('express');
var store = require('./modules/session-store');
var http = require('http');
var routes = require('./routes');
var api = require('./routes/api');
var path = require('path');
var stylus = require('stylus');
var mongo = require('mongoskin');
var config = require('./config');

var dbHost = config.mongodb.server;
var dbPort = config.mongodb.port;
var dbName = config.mongodb.db;
var dbOptions = {
    auto_reconnect: config.mongodb.autoReconnect,
    poolSize: config.mongodb.poolSize,
    safe: true
};

var connectString = [dbHost, ':', dbPort,'/', dbName].join('');
var db = mongo.db(connectString, dbOptions);
db.open(function (err, db) {
    if (err) {
        throw err;
    }
    console.log("DB connected: " + connectString);
});

var app = express();
var publicPath =  path.join(__dirname, 'public');

var port = config.site.port;
app.configure(function () {
    app.set('port',  port);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(stylus.middleware(publicPath));
    app.use(express.static(publicPath));
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.cookieParser(config.site.cookieSecret));
    app.use(express.session({store: new store(db), secret: config.site.sessionSecret }));
    app.use(express.csrf());
    app.use(app.router);
});
app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.configure('production', function(){
    app.use(express.errorHandler());
});

var users = db.collection('users');
var tasks = db.collection('tasks');

//mongodb middleware
var middleware = function (req, res, next) {
    req.db = db;
    req.id = req.params.id;
    req.iid = req.params.iid;
    if(req.id) {
        req.id = db.ObjectID.createFromHexString(req.id);
    }
    res.locals.token = req.session._csrf;
    req.users = users;
    req.tasks = tasks;
    next();
};


// Routes
app.get('/', middleware, routes.index);
app.get('/partials/:name', middleware, routes.partials);
app.post('/auth', middleware, routes.auth);
app.get('/auth', middleware, routes.session);
app.delete('/auth', middleware, routes.logout);

// JSON API
//user
app.get('/users', middleware, api.users);
app.get('/users/:id', middleware, api.user);
app.post('/users', middleware, api.addUser);
app.put('/users/:id', middleware, api.editUser);
app.delete('/users/:id', middleware, api.deleteUser);


//task
app.get('/tasks', middleware, api.tasks);
app.get('/tasks/:id', middleware, api.task);
app.post('/tasks', middleware, api.addTask);
app.put('/tasks/:id', middleware, api.editTask);
app.delete('/tasks/:id', middleware, api.deleteTask);

//task comment
app.get('/tasks/:id/comments', middleware, api.tasksComments);
app.get('/tasks/:id/comments/:iid', middleware, api.taskComment);
app.post('/tasks/:id/comments', middleware, api.addTaskComment);
app.put('/tasks/:id/comments/:iid', middleware, api.editTaskComment);
app.delete('/tasks/:id/comments/:iid', middleware, api.deleteTaskComment);


// redirect all others to the index (HTML5 history)
app.get('*', middleware, routes.index);


http.createServer(app).listen(port, function(){
    console.log('Express server listening on port ' + port);
});