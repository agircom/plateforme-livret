'use strict';

var FeaderAppControllers = angular.module('FeaderApp.Controllers', ['ngSanitize']);

FeaderAppControllers.controller('CommonCtrl.User', ['$scope', '$location', 'SessionSvc',
    function($scope, $location, SessionSvc) {
        $scope.identifiant = '';
        $scope.password = '';
        $scope.logged = SessionSvc.isLogged();
        $scope.login = function() {
            SessionSvc.Login($scope.identifiant, $scope.password, function(result) {
                if (result.success) {
                    $scope.identifiant = '';
                    $scope.password = '';
                    $scope.logged = SessionSvc.isLogged();
                    $location.path('/plateforme');
                }
            });
        };
        $scope.logout = function() {
            SessionSvc.Logout(function(result) {
                if (result.success) {
                    $scope.logged = false;
                    $location.path('/home');
                }
            });
        };
        $scope.getName = function() {
            return SessionSvc.getCompleteName();
        };
    }
]);
FeaderAppControllers.controller('HomeCtrl.Home', ['$scope',
    function($scope) {
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
