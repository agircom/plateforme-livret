'use strict';

var FeaderAppControllers = angular.module('FeaderApp.Controllers', ['ngSanitize']);

FeaderAppControllers.controller('CommonCtrl.User', ['$scope', '$location', 'UserSvc',
    function($scope, $location, UserSvc) {
        $scope.identifiant = '';
        $scope.password = '';
        $scope.logged = UserSvc.isLogged();
        $scope.login = function() {
            UserSvc.Login($scope.identifiant, $scope.password, function(result) {
                if (result.success) {
                    $scope.identifiant = '';
                    $scope.password = '';
                    $scope.logged = UserSvc.isLogged();
                    $location.path('/plateforme');
                }
            });
        };
        $scope.logout = function() {
            UserSvc.Logout(function(result) {
                if (result.success) {
                    $scope.logged = false;
                    $location.path('/home');
                }
            });
        };
        $scope.getName = function() {
            return UserSvc.getCompleteName();
        };
    }
]);
FeaderAppControllers.controller('HomeCtrl.Home', ['$scope',
    function($scope) {
    }
]);
FeaderAppControllers.controller('HomeCtrl.Right', ['$scope', '$location',
    function($scope, $location) {
        $scope.gotoAccountCreate = function() {
            $location.path('/account/create');
        };
    }
]);
FeaderAppControllers.controller('AccountCtrl.Create', ['$scope', 'UserSvc',
    function($scope, UserSvc) {
        $scope.username = '';
        $scope.passwd = '';
        $scope.create = function() {
            alert(42);
            UserSvc.Create($scope.username, $scope.passwd);
        };
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Home', ['$scope',
    function($scope) {

    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Booklets', ['$scope',
    function($scope) {

    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Account', ['$scope',
    function($scope) {

    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Library', ['$scope',
    function($scope) {

    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Help', ['$scope',
    function($scope) {

    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Contact', ['$scope',
    function($scope) {

    }
]);
