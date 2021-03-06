'use strict';

/* Filters */
angular.module('todo.filters', []).
    filter('interpolate', ['version', function (version) {
        return function (text) {
            return String(text).replace(/\%VERSION\%/mg, version);
        }
    }]).
    filter('array', function () {
        return function (input) {
            var out = "";
            input.forEach(function (item) {
                out += item;
            });
            return out;
        };
    });