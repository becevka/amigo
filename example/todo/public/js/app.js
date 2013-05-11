'use strict';

angular.module('todo', ['todo.filters', 'todo.services', 'todo.directives']).
    config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'partials/index',
                controller:IndexCtrl
            }).
            when('/login', {
                templateUrl: 'partials/login',
                controller: LoginCtrl
            }).
            when('/logout/:csrf', {
                templateUrl: 'partials/index',
                controller: LogoutCtrl
            }).
            when('/addUser', {
                templateUrl: 'partials/editUser',
                controller: AddUserCtrl
            }).
            when('/listUser', {
                templateUrl: 'partials/listUser',
                controller: ListUserCtrl
            }).
            when('/editUser/:id', {
                templateUrl: 'partials/editUser',
                controller: EditUserCtrl
            }).
            when('/addTask', {
                templateUrl: 'partials/editTask',
                controller: AddTaskCtrl
            }).
            when('/listTask', {
                templateUrl: 'partials/listTask',
                controller: ListTaskCtrl
            }).
            when('/editTask/:id', {
                templateUrl: 'partials/editTask',
                controller: EditTaskCtrl
            }).
            otherwise({
                redirectTo: '/'
            });
        $locationProvider.html5Mode(true);

        var interceptor = ['$rootScope', '$location', '$q', function($rootScope, $location, $q) {
                function success(response) {
                    return response;
                }

                function error(response) {
                    if(response.status == 401) {
                        $location.path('/login');
                        return $q.reject(response);
                    } else if(response.status == 500) {
                        $rootScope.error = response.data.error;
                        return $q.reject(response);
                    } else {
                        return $q.reject(response);
                    }
                }

                return function(promise) {
                    return promise.then(success, error);
                }
            }];

        $httpProvider.responseInterceptors.push(interceptor);
    }]);