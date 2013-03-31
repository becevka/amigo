/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var routes = require('./routes');
var path = require('path');
var stylus = require('stylus');
var mongo = require('mongoskin');
var config = require('./config');

var app = express();
var publicPath =  path.join(__dirname, 'public');

var port = config.site.port
app.configure(function () {
    app.set('port',  port);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser(config.site.cookieSecret));
    app.use(express.cookieSession({secret: config.site.sessionSecret}));
    app.use(express.csrf());
    app.use(app.router);
    app.use(stylus.middleware(publicPath));
    app.use(express.static(publicPath));
});
app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var dbHost = config.mongodb.server;
var dbPort = config.mongodb.port;
var dbName = config.mongodb.db;
var dbOptions = {
    auto_reconnect: config.mongodb.autoReconnect,
    poolSize: config.mongodb.poolSize,
    safe: true
};
var db = mongo.db([dbHost, ':', dbPort,'/', dbName].join(), dbOptions);


http.createServer(app).listen(port, function(){
    console.log('Express server listening on port ' + port);
});