'use strict';

var FeaderAppControllers = angular.module('FeaderApp.Controllers', ['ngSanitize']);

FeaderAppControllers.controller('CommonCtrl.User', ['$scope', '$location', 'UserSvc',
    function($scope, $location, UserSvc) {
        $scope.identifiant = '';
        $scope.password = '';
        $scope.login = function() {
            UserSvc.Login($scope.identifiant, $scope.password,
                    function(data, status) {
                        console.log('login success', data, status);
//                        if (result.success) {
//                            $scope.identifiant = '';
//                            $scope.password = '';
//                            $location.path('/plateforme');
//                        }
                    },
                    function(data, status) {
                        console.log('login error', data, status);
                    });
        };
        $scope.logout = function() {
            UserSvc.Logout(function(result) {
                if (result.success) {
                    $location.path('/home');
                }
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
            UserSvc.Create($scope.userInfos,
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
