#!/usr/bin/env node

/**
 * Module dependencies.
 */

var exec = require('child_process').exec;
var program = require('commander');
var fs = require('fs');
var mkdirp = require('mkdirp');
var os = require('os');
var util = require('util');
var vm = require('vm');
var m = require('mustache');

var bundle = __dirname + '/bundle';

// CLI

program.parse(process.argv);

// Path

var path = program.args.shift() || 'myapp';

// end-of-line code

var eol = os.EOL;


/**
 * Routes index template.
 */

var index = [
    '',
    '/*',
    ' * GET home page.',
    ' */',
    '',
    'exports.index = function(req, res){',
    '  res.render(\'index\', { title: \'Express\' });',
    '};'
].join(eol);

/**
 * Routes users template.
 */

var users = [
    '',
    '/*',
    ' * GET users listing.',
    ' */',
    '',
    'exports.list = function(req, res){',
    '  res.send("respond with a resource");',
    '};'
].join(eol);

/**
 * Default stylus template.
 */

var stylus = [
    'body',
    '  padding: 50px',
    '  font: 14px "Lucida Grande", Helvetica, Arial, sans-serif',
    'a',
    '  color: #00B7FF'
].join(eol);


// Generate application

(function createApplication(path) {
    emptyDirectory(path, function (empty) {
        if (empty) {
            createApplicationAt(path);
        } else {
            program.confirm('destination is not empty, continue? ', function (ok) {
                if (ok) {
                    createApplicationAt(path);
                } else {
                    abort('aborting');
                }
            });
        }
    });
})(path);

/**
 * Create application at the given directory `path`.
 *
 * @param {String} path
 */

function createApplicationAt(path) {
    console.log();
    process.on('exit', function () {
        console.log();
        console.log('   install dependencies:');
        console.log('     $ cd %s && npm install', path);
        console.log();
        console.log('   run the app:');
        console.log('     $ node app');
        console.log();
    });
    mkdir(path, function () {

        var project = {
            'project name': path,
            'your name': '',
            'your email': '',
            description: '',
            'use minified js (y/n)': 'n'
        };

        survey('Project info', project, function (project) {
            var pkg = {
                name: project.name,
                author: project['your name'] + ' <' + project['your email'] + '>',
                description: project.description,
                version: '0.0.1',
                private: true,
                engine: 'node >= 0.8',
                scripts: { start: 'node app.js' },
                dependencies: {
                    express: '3.*',
                    jade: '*',
                    stylus: '*',
                    mongoskin: '*'
                }
            };
            write(path + '/package.json', JSON.stringify(pkg, null, 2));
            fs.readFile(bundle + '/config.js', 'utf8', function (err, data) {
                var config = eval(data);
                survey('Project config', config, function (config) {
                    write(path + '/config.js', 'module.exports ='  + util.inspect(config) + ';');
                    fs.readFile(bundle + '/app.js', 'utf8', function (err, data) {
                        write(path + '/app.js', data);
                        scaffold(path, project);
                    });
                })
            });
        });

    });
}

function scaffold(path, project) {
    program.confirm('Custom models scaffolding? ', function (ok) {
        function fn(path, project) {
            createAll(path, project);
            process.stdin.destroy();
        }
        if (ok) {
            collect(path, project, fn)
        } else {
            fn(path, project);
        }
    });

    function collect(path, project, fn) {
        var scaffold = {
            'model name': 'friend',
            'model fields': ['name', 'email', 'age']
        };

        survey('Project model', scaffold, function (scaffold) {
            var name  = scaffold['model name'];
            var model = { name: name, cName: name[0].toUpperCase() + name.slice(1), fields: scaffold['model fields'] }
            if(!project.models) {
                project.models = [];
            }
            project.models.push(model);
            next(path, project, fn);
        });
    }

    function next(path, project, fn) {
        program.confirm('Another model? ', function (ok) {
            if (ok) {
                collect(path, project, fn);
            } else {
               fn(path, project);
            }
        });
    }

}

/**
 * Creates lot directories and path
 *
 * @param {String} path
 * @param {Object} project
 */
function createAll(path, project) {
    if (project['use minified js (y/n)'] == 'y') {
        project.min = '.min';
    } else {
        project.min = '';
    }
    if (project['project name']) {
        project.name = project['project name'];
    } else {
        project.name = path;
    }
    if(!project.models) {
        project.models = [{name:'friend', cName:'Friend'}];
    }
    mkdir(path + '/public', function () {
        mkdir(path + '/public/js', function(){
            fs.readFile(bundle + '/js/app.mus', 'utf8', function (err, data) {
                write(path + '/public/js/app.js', parse(data, project));
            });
            fs.readFile(bundle + '/js/controllers.mus', 'utf8', function (err, data) {
                write(path + '/public/js/controllers.js', parse(data, project));
            });
            fs.readFile(bundle + '/js/directives.mus', 'utf8', function (err, data) {
                write(path + '/public/js/directives.js', parse(data, project));
            });
            fs.readFile(bundle + '/js/filters.mus', 'utf8', function (err, data) {
                write(path + '/public/js/filters.js', parse(data, project));
            });
            fs.readFile(bundle + '/js/services.mus', 'utf8', function (err, data) {
                write(path + '/public/js/services.js', parse(data, project));
            });
        });
        mkdir(path + '/public/images');
        mkdir(path + '/public/stylesheets', function () {
            write(path + '/public/stylesheets/style.styl', stylus);
        });
    });


    mkdir(path + '/routes', function () {
        write(path + '/routes/index.js', index);
        write(path + '/routes/user.js', users);
    });
    mkdir(path + '/views', function () {
        fs.readFile(bundle + '/views/layout.jade', 'utf8', function (err, data) {
            write(path + '/views/layout.jade', parse(data, project));
        });
        fs.readFile(bundle + '/views/index.jade', 'utf8', function (err, data) {
            write(path + '/views/index.jade', parse(data, project));
        });
    });
}

/**
 * Asks for fields in object an fill them
 *
 * @param {String} desc
 * @param {Object} template
 * @param {Function} fn
 */
function survey(desc, template, fn) {
    console.log('  \033[90m' + desc + '\033[0m');
    visit(template, function () {
        fn(template);
    });
}

function visit(obj, fn) {
    var keys = Object.keys(obj);

    function next() {
        var key = keys.shift();

        function done(value) {
            value = String(value).trim();
            if (value && value != '') {
                obj[key] = value;
            } else {
                console.log(obj[key]);
            }
            next();
        }

        if (key) {
            var value = obj[key];
            if (typeof(value) == "object" && !util.isArray(value)) {
                console.log('  \033[90m' + key + '\033[0m');
                visit(value, next);
            } else {
                var question = key;
                if (value) {
                    question += ' (default:' + value + ')';
                }
                ask(question, done)
            }
        } else {
            fn(obj);
        }
    }

    next();
}

/**
 * Asks for input
 *
 * @param {String} question
 * @param {Function} fn
 */
function ask(question, fn) {
    console.log('  \033[90m' + question + '\033[0m');
    process.stdin.setEncoding('utf8');
    process.stdin.once('data', fn).resume();
}


/**
 * Exit with the given `str`.
 *
 * @param {String} str
 */
function abort(str) {
    console.error(str);
    process.exit(1);
}

/**
 * echo str > path.
 *
 * @param {String} path
 * @param {String} str
 */

function write(path, str) {
    fs.writeFile(path, str);
    console.log('   \x1b[36mcreate\x1b[0m : ' + path);
}

/**
 * Mkdir -p.
 *
 * @param {String} path
 * @param {Function} fn
 */
function mkdir(path, fn) {
    mkdirp(path, 0755, function (err) {
        if (err) throw err;
        console.log('   \033[36mcreate\033[0m : ' + path);
        fn && fn();
    });
}

/**
 * Check if the given directory `path` is empty.
 *
 * @param {String} path
 * @param {Function} fn
 */
function emptyDirectory(path, fn) {
    fs.readdir(path, function (err, files) {
        if (err && 'ENOENT' != err.code) throw err;
        fn(!files || !files.length);
    });
}

function eval(data) {
    var sandbox = {};
    var exports = {};
    sandbox.exports = exports;
    sandbox.module = { exports: exports };
    sandbox.global = sandbox;
    vm.createScript(data.replace(/^\#\!.*/, '')).runInNewContext(sandbox);
    return sandbox.module.exports
}


function parse(str, obj) {
    return m.render(str,obj);
}
