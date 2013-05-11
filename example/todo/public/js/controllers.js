'use strict';

/* Controllers */
function AppCtrl($rootScope, Auth) {
    Auth.get(function(user) {
        $rootScope.user = user;
    });
}

function IndexCtrl($scope) {
    $scope.models = [];
    $scope.models.push('User');
    $scope.models.push('Task');
}

function LoginCtrl($rootScope, $scope, $location, Auth) {
    $scope.form = {};
    $scope.login = function () {
        Auth.save($scope.form, function(user) {
             $location.path('/');
             $rootScope.user = user;
        });
    };
}

function LogoutCtrl($scope, $location, $routeParams, Auth) {
    Auth.remove({_csrf: $routeParams.csrf}, function() {
         $location.path('/login');
    });
}


function AddUserCtrl($scope, $location, User) {
    $scope.save = function() {
        User.save($scope.user, function() {
            $location.path('/listUser');
        });
    }
}

function ListUserCtrl($scope, User) {
    $scope.users = User.query();
}

function EditUserCtrl($scope, $location, $routeParams, User) {
    User.get({_id: $routeParams.id}, function(user) {
        self.original = user;
        $scope.user = new User(self.original);
    });
    $scope.save = function() {
        User.update($scope.user, function() {
            $location.path('/listUser');
        });
    };
    $scope.remove = function() {
        User.remove({_id: $routeParams.id, _csrf: $scope.user._csrf}, function() {
          $location.path('/listUser');
        });
    };
    $scope.isClean = function() {
        return angular.equals(self.original, $scope.user);
    };
}

function AddTaskCtrl($scope, $location, Task) {
    $scope.save = function() {
        Task.save($scope.task, function() {
            $location.path('/listTask');
        });
    }
}

function ListTaskCtrl($scope, Task) {
    $scope.tasks = Task.query();
}

function EditTaskCtrl($scope, $location, $routeParams, Task, Comment) {
    Task.get({_id: $routeParams.id}, function(task) {
        self.original = task;
        $scope.task = new Task(self.original);
    });
    $scope.save = function() {
        Task.update($scope.task, function() {
            $location.path('/listTask');
        });
    };
    $scope.remove = function() {
        Task.remove({_id: $routeParams.id, _csrf: $scope.task._csrf}, function() {
          $location.path('/listTask');
        });
    };
    $scope.isClean = function() {
        return angular.equals(self.original, $scope.task);
    };
    $scope.addComment = function() {
        if(!$scope.task.comments) {
            $scope.task.comments = [];
        }
        $scope.task.comments.push({});
    };
    $scope.saveComment = function(comment) {
        comment._id = $routeParams.id;
        comment._csrf = $scope.task._csrf;
        if (comment.id) {
            Comment.update(comment, function(task) {
                self.original = task;
                $scope.task = new Task(self.original);
            });
        } else {
            Comment.save(comment, function(task) {
                self.original = task;
                $scope.task = new Task(self.original);
            });
        }
    };
    $scope.removeComment = function(comment) {
        Comment.remove({_id: $routeParams.id, id:comment.id, _csrf: $scope.task._csrf}, function(task) {
            self.original = task;
            $scope.task = new Task(self.original);
        });
    };
}
