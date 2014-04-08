'use strict';

var FeaderAppControllers = angular.module('FeaderApp.Controllers', ['ngSanitize']);

FeaderAppControllers.controller('CommonCtrl.User', ['$scope', '$location', 'UserSvc',
    function($scope, $location, UserSvc) {
        $scope.identifiant = '';
        $scope.passwd = '';
        $scope.loginInProgress = false;
        $scope.rememberMe = 'on';
        $scope.error = '';
        $scope.switchRememberMe = function() {
            if ($scope.rememberMe === 'on') {
                $scope.rememberMe = 'off';
            } else if ($scope.rememberMe === 'off') {
                $scope.rememberMe = 'on';
            }
        };
        $scope.isAtHome = function() {
            return ($location.path().split('/')[1] === 'home') ? true : false;
        };
        $scope.login = function() {
            $scope.loginInProgress = true;
            $scope.error = '';
            var store = ($scope.rememberMe === 'on') ? true : false;
            UserSvc.Login($scope.identifiant, $scope.passwd, store,
                    function(data, status) {
                        $scope.identifiant = '';
                        $scope.passwd = '';
                        $scope.loginInProgress = false;
                    },
                    function(data, status) {
                        var msg = '';
                        switch (status) {
                            case 400:
                                msg = 'Vous devez saisir vos identifiants';
                                break;
                            case 403:
                                msg = 'Les identifants sont incorrects';
                                break;
                            default:
                                msg = 'Erreur de connexion';
                                break;
                        }
                        $scope.error = msg;
                        $scope.passwd = '';
                        $scope.loginInProgress = false;
                    });
        };
        $scope.logout = function() {
            UserSvc.Logout(function() {
                $location.path('/home');
            });
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
        $scope.userInfos = {
            username: null,
            passwd: null,
            firstName: null,
            lastName: null
        };
        $scope.message = {
            type: null,
            text: '',
            show: false
        };
        $scope.create = function() {
            $scope.message.show = false;
            UserSvc.Subscribe($scope.userInfos,
                    function(data, status) {
                        var msg = '';
                        switch (status) {
                            case 201:
                                msg = 'Votre compte a bien ete cree';
                                break;
                            default:
                                msg = 'Votre compte a ete cree avec des erreurs';
                                break;
                        }
                        $scope.showSuccess(msg);
                        $scope.userInfos = {
                            username: null,
                            passwd: null,
                            firstName: null,
                            lastName: null
                        };
                    },
                    function(data, status) {
                        var msg = '';
                        switch (status) {
                            case 400:
                                msg = 'Les donnees saisies sont incorrectes';
                                break;
                            case 423:
                                msg = 'Ce nom d\'utilisateur existe deja';
                                break;
                            default :
                                msg = 'Une erreur inconnue s\'est produite';
                                break;
                        }
                        $scope.showError(msg);
                    });
        };
        $scope.showError = function(message) {
            $scope.message.type = 'error';
            $scope.message.text = message;
            $scope.message.show = true;
        };
        $scope.showSuccess = function(message) {
            $scope.message.type = 'success';
            $scope.message.text = message;
            $scope.message.show = true;
        };
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Home', ['$scope',
    function($scope) {

    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Booklets', ['$scope', 'BookletSvc',
    function($scope, BookletSvc) {
        $scope.booklets = BookletSvc.getAll();
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
