#!/usr/bin/env node

/**
 * Module dependencies.
 */

var exec = require('child_process').exec;
var program = require('commander');
var fs = require('fs');
var mkdirp = require('mkdirp');
var util = require('util');
var vm = require('vm');
var m = require('mustache');
var i = require("i")();

var bundle = __dirname + '/bundle';

// CLI

program.parse(process.argv);

// Path

var path = program.args.shift() || 'myapp';

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
                name: project['project name'],
                author: project['your name'] + ' <' + project['your email'] + '>',
                description: project.description,
                version: '0.0.1',
                private: true,
                engine: 'node >= 0.8',
                scripts: { start: 'node app.js' },
                dependencies: {
                    express: '3.1',
                    jade: '1.*',
                    stylus: '0.*',
                    mongoskin: '0.*'
                }
            };
            write(path + '/package.json', JSON.stringify(pkg, null, 2));
            fs.readFile(bundle + '/README.md', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/README.md', parse(data, project));
            });
            fs.readFile(bundle + '/config.js', 'utf8', function (err, data) {
                var config = eval(data);
                survey('Project config', config, function (config) {
                    write(path + '/config.js', 'module.exports =' + util.inspect(config) + ';');
                    scaffold(path, project);
                })
            });
        });

    });
}

function initModel(project) {
    if (!project.models) {
        project.models = [
            {name: 'user', cName: 'User', pName: 'users', fields: [
                {fieldName: 'name', fieldCName: 'Name', type: 'text'},
                {fieldName: 'email', fieldCName: 'Email', type: 'email'},
                {fieldName: 'password', fieldCName: 'Password', type: 'password'}
            ], inner: []}
        ];
    }
    if (!project.inners) {
        project.inners = [];
    }
}
function scaffold(path, project) {
    program.confirm('Custom resources scaffolding? ', function (ok) {
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
            'resource name': 'user',
            'resource fields': ['name', 'email:email', 'password:password']
        };

        survey('Project resource', scaffold, function (scaffold) {
            var name = scaffold['resource name'].trim();
            var collection = collectFields(scaffold['resource fields']);
            var fields = collection[0];
            var inner = collection[1];
            var model = {
                name: name,
                cName: i.camelize(name),
                pName: i.pluralize(name),
                fields: fields,
                inner: inner
            };
            initModel(project);
            if (name === 'user') {
                var f = fields.filter(function (item) {
                    return item.fieldName === 'email';
                });
                if (f.length === 0) {
                    fields.push({fieldName: 'email', fieldCName: 'Email', type: 'email'});
                }
                f = fields.filter(function (item) {
                    return item.fieldName === 'password';
                });
                if (f.length === 0) {
                    fields.push({fieldName: 'password', fieldCName: 'Password', type: 'password'});
                }
            }
            if (name.charAt(0) === '$') {
                project.inners[name] = model;
            } else {
                project.models.push(model);
            }
            next(path, project, fn);
        });
    }

    function collectFields(fieldNames) {
        var fields = [];
        var inners = [];
        if (typeof fieldNames === 'string') {
            fieldNames = fieldNames.split(',');
        }
        fieldNames.forEach(function (item) {
            var fieldName = item.trim();
            var fieldType = 'text';
            var splits = item.split(':');
            if (splits.length > 1) {
                fieldName = splits[0].trim();
                fieldType = splits[1].trim();
            }

            if (fieldType.charAt(0) === '$') {
                fieldName = i.singularize(fieldName);
                var inner = {
                    iName: fieldName,
                    iCName: i.camelize(fieldName),
                    iPName: i.pluralize(fieldName),
                    iPCName: i.camelize(i.pluralize(fieldName)),
                    model: fieldType
                };
                inners.push(inner);
            } else {
                var field = {
                    fieldName: fieldName,
                    fieldCName: i.camelize(fieldName),
                    type: fieldType
                };
                fields.push(field);
            }
        });
        return [fields, inners];
    }

    function next(path, project, fn) {
        program.confirm('Another resource? ', function (ok) {
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
    var min = false;
    if (project['use minified js (y/n)'] == 'y') {
        project.min = '.min';
        min = true;
    } else {
        project.min = '';
    }
    if (project['project name']) {
        project.name = project['project name'];
    } else {
        project.name = path;
    }
    initModel(project);
    fs.readFile(bundle + '/app.mus', 'utf8', function (err, data) {
        if (err) throw  err;
        write(path + '/app.js', parse(data, project));
    });
    mkdir(path + '/public', function () {
        mkdir(path + '/public/js', function () {
            fs.readFile(bundle + '/js/app.mus', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/public/js/app.js', parse(data, project));
            });
            fs.readFile(bundle + '/js/controllers.mus', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/public/js/controllers.js', parse(data, project));
            });
            fs.readFile(bundle + '/js/directives.mus', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/public/js/directives.js', parse(data, project, ['<%', '%>']));
            });
            fs.readFile(bundle + '/js/filters.mus', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/public/js/filters.js', parse(data, project));
            });
            fs.readFile(bundle + '/js/services.mus', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/public/js/services.js', parse(data, project));
            });
        });
        mkdir(path + '/public/img', function () {
        });
        mkdir(path + '/public/css', function () {
            fs.readFile(bundle + '/css/style.styl', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/public/css/style.styl', data);
            });
        });
    });

    mkdir(path + '/modules/session-store/', function () {
        fs.readFile(bundle + '/modules/session-store/index.js', 'utf8', function (err, data) {
            if (err) throw  err;
            write(path + '/modules/session-store/index.js', data);
        });
    });
    mkdir(path + '/routes', function () {
        fs.readFile(bundle + '/routes/index.js', 'utf8', function (err, data) {
            if (err) throw  err;
            write(path + '/routes/index.js', data);
        });
        fs.readFile(bundle + '/routes/api.mus', 'utf8', function (err, data) {
            if (err) throw  err;
            write(path + '/routes/api.js', parse(data, project));
        });
    });
    mkdir(path + '/views', function () {
        fs.readFile(bundle + '/views/layout.jade', 'utf8', function (err, data) {
            if (err) throw  err;
            write(path + '/views/layout.jade', parse(data, project));
        });
        fs.readFile(bundle + '/views/index.jade', 'utf8', function (err, data) {
            if (err) throw  err;
            write(path + '/views/index.jade', parse(data, project));
        });
        fs.readFile(bundle + '/views/head.jade', 'utf8', function (err, data) {
            if (err) throw  err;
            write(path + '/views/head.jade', parse(data, project, ['<%', '%>']));
        });
        mkdir(path + '/views/partials', function () {
            fs.readFile(bundle + '/views/partials/index.jade', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/views/partials/index.jade', data);
            });
            fs.readFile(bundle + '/views/partials/login.jade', 'utf8', function (err, data) {
                if (err) throw  err;
                write(path + '/views/partials/login.jade', parse(data, project));
            });
            project.models.forEach(function (item) {
                fs.readFile(bundle + '/views/partials/list.mus', 'utf8', function (err, data) {
                    if (err) throw  err;
                    write(path + '/views/partials/list' + item.cName + '.jade', parse(data, item, ['<%', '%>']));
                });
                fs.readFile(bundle + '/views/partials/edit.mus', 'utf8', function (err, data) {
                    if (err) throw  err;
                    item.inner.forEach(function(i) {
                        i.iFields = project.inners[i.model].fields;
                    });
                    write(path + '/views/partials/edit' + item.cName + '.jade', parse(data, item, ['<%', '%>']));
                });
            });
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


function parse(str, obj, tags) {
    if (tags) {
        var prevTags = m.tags;
        m.tags = tags;
    }
    var res = m.render(str, obj);
    if (prevTags) {
        m.tags = prevTags;
    }
    return res;
}
