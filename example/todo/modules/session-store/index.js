/**
 * Module dependencies.
 */

var Store = require('express').session.Store

/**
 * Initialize a new `SessionStore`.
 *
 * @api public
 */

var SessionStore = module.exports = function SessionStore(db) {
    var sessions = this.sessions = db.collection('session');
    var reap_interval = setInterval(function () {
        sessions.remove({expires: {'$lte': Date.now()}}, function () {
        });
    }, 60 * 1000);
    db.on('close', function () {
        this.clear();
        clearInterval(reap_interval);
    });
};

/**
 * Inherit from `Store.prototype`.
 */

SessionStore.prototype.__proto__ = Store.prototype;

/**
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.get = function (sid, fn) {
    this.sessions.findOne({_id: sid}, function (err, data) {
        try {
            if (data) {
                var sess = typeof data.session === 'string' ? JSON.parse(data.session)
                    : data.session;
                fn && fn(null, sess);
            } else {
                fn && fn();
            }
        } catch (exc) {
            fn && fn(exc);
        }
    });
};

/**
 * Commit the given `sess` object associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Session} sess
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.set = function (sid, sess, fn) {
    var update = {_id: sid, session: JSON.stringify(sess)};
    if (sess && sess.cookie && sess.cookie.expires) {
        update.expires = Date.parse(sess.cookie.expires);
    }

    this.sessions.update({_id: sid}, update, {upsert: true}, function (err, data) {
        fn && fn();
    });
};

/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.destroy = function (sid, fn) {
    this.sessions.remove({_id: sid}, function () {
        fn && fn();
    });
};

/**
 * Invoke the given callback `fn` with all active sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.all = function (fn) {
    this.sessions.find({}).toArray(function (err, data) {
        var arr = [];
        data.forEach(function(item) {
            arr.push(item._id);
        });
        fn(null, arr);
    });

};

/**
 * Clear all sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.clear = function (fn) {
    this.sessions.drop(function(){
        fn && fn();
    });
};

/**
 * Fetch number of sessions.
 *
 * @param {Function} fn
 * @api public
 */

SessionStore.prototype.length = function (fn) {
    this.sessions.count({}, fn);
};
