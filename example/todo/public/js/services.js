'use strict';

/* Services */
angular.module('todo.services', ['ngResource'])
    .factory('Auth', function ($resource) {
        var Auth = $resource('/auth');
        return Auth;
    })
    .factory('User', function ($resource) {
        var User = $resource('/users/:_id', {}, {
            update: { method: 'PUT', params: {_id: "@_id" }}
        });
        return User;
    })
    .factory('Task', function ($resource) {
        var Task = $resource('/tasks/:_id', {}, {
            update: { method: 'PUT', params: {_id: "@_id" }}
        });
        return Task;
    })
    .factory('Comment', function ($resource) {
        var Comment = $resource('/tasks/:_id/comments/:id', {_id: "@_id"}, {
            update: { method: 'PUT', params: {id: "@id" }}
        });
        return Comment;
    })
    ;