/*
 * GET home page.
 */

var crypto = require('crypto');

exports.index = function (req, res) {
    res.render('index');
};

exports.partials = function (req, res) {
    var name = req.params.name;
    res.render('partials/' + name);
};

exports.session = function (req, res) {
    var user = req.session.user;
    if(user) {
        res.json(user);
    } else {
        res.json(401, null);
    }
};

exports.logout = function (req, res) {
    req.session.user = null;
    res.json(401, null);
};

exports.auth = function (req, res) {
    var email = req.param('email', null);
    var pass = req.param('pass', null);
    var password = getHash(pass);
    req.users.findOne({email: email}, {email: 1, password: 1, name: 1}, function (err, found) {
        if (err) {
            handle(err, res, null);
        } else {
            if (found) {
                if (password !== found.password) {
                    err = new Error('password was incorrect');
                    handle(err, res, null);
                } else {
                    req.session.user = found;
                    handle(null, res, found);
                }
            } else {
                var user = {email: email, password: password, name: getName(email)};
                req.users.insert(user, function (err, inserted) {
                    var user = inserted[0];
                    req.session.user = user;
                    handle(err, res, user);
                });
            }
        }

    });
};

function handle(err, res, val) {
    if (err) {
        res.send(500, { error: err.message });
        console.log(err.stack);
    } else {
        res.json(val);
    }
}

function getName(email) {
    return email.split("@")[0];
}

function getHash(password) {
    return crypto.createHash('sha512').update('_%#amigoS*A*L*T' + password).digest('hex');
}