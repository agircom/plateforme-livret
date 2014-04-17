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
            return ($location.path().split('/')[1] === 'home' ||
                    $location.path() === '/account/create') ? true : false;
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
            name: null,
            lastName: null,
            firstName: null,
            fonction: null,
            username: null,
            phone: null,
            address: null,
            cp: null,
            passwd: null,
            contract_accepted: false
        };
        $scope.username2 = '';
        $scope.passwd2 = '';
        $scope.message = {
            type: null,
            text: '',
            show: false
        };
        $scope.createInProgress = false;
        $scope.create = function() {
            $scope.message.show = false;
            $scope.createInProgress = true;
            if ($scope.userInfos.passwd !== $scope.passwd2) {
                $scope.userInfos.passwd = '';
                $scope.passwd2 = '';
                $scope.showError('Vueillez saisir les meme mot de passe');
                return;
            }
            if ($scope.userInfos.username !== $scope.username2) {
                $scope.userInfos.passwd = '';
                $scope.passwd2 = '';
                $scope.showError('Vueillez saisir les meme adresse mail');
                return;
            }
            if ($scope.userInfos.name === '' ||
                    $scope.userInfos.lastName === '' ||
                    $scope.userInfos.firstName === '' ||
                    $scope.userInfos.address === '' ||
                    $scope.userInfos.username === '' ||
                    $scope.userInfos.cp === '' ||
                    $scope.userInfos.passwd === '') {
                $scope.userInfos.passwd = '';
                $scope.passwd2 = '';
                $scope.showError('Les champs marqués d’un * doivent être complétés');
                return;
            }
            if (!$scope.userInfos.contract_accepted) {
                $scope.userInfos.passwd = '';
                $scope.passwd2 = '';
                $scope.showError('Vous devez accepter les conditions d\'utilisation');
                return;
            }
            UserSvc.Subscribe($scope.userInfos,
                    function(data, status) {
                        var msg = '';
                        switch (status) {
                            case 201:
                                msg = 'Votre compte a été créé avec succès. Vous allez recevoir un mail vous permettant d\'activer votre compte et de commencer la creation de vos livrets.';
                                break;
                            default:
                                msg = 'Votre compte a été créé avec succès. Vous allez recevoir un mail vous permettant d\'activer votre compte et de commencer la creation de vos livrets.';
                                break;
                        }
                        $scope.showSuccess(msg);
                        $scope.userInfos = {
                            name: null,
                            lastName: null,
                            firstName: null,
                            fonction: null,
                            username: null,
                            phone: null,
                            address: null,
                            cp: null,
                            passwd: null,
                            contract_accepted: false
                        };
                    },
                    function(data, status) {
                        var msg = '';
                        switch (status) {
                            case 400:
                                msg = 'Les champs marqués d’un * doivent être complétés';
                                break;
                            case 423:
                                msg = 'Ce nom d\'utilisateur existe deja';
                                break;
                            default :
                                msg = 'Une erreur inconnue s\'est produite';
                                break;
                        }
                        $scope.userInfos.passwd = '';
                        $scope.passwd2 = '';
                        $scope.showError(msg);
                    });
        };
        $scope.showError = function(message) {
            $scope.message.type = 'error';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.createInProgress = false;
        };
        $scope.showSuccess = function(message) {
            $scope.message.type = 'success';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.createInProgress = false;
        };
    }
]);
FeaderAppControllers.controller('AccountCtrl.Confirm', ['$scope', '$routeParams',
    function($scope, $routeParams) {
        $scope.key = $routeParams.confirm_key;
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Home', ['$scope',
    function($scope) {

    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Booklets', ['$scope', '$location', 'BookletSvc',
    function($scope, $location, BookletSvc) {
        $scope.newBookName = '';
        $scope.booklets = [];
        $scope.selectedBooklet = false;
        $scope.error = '';
        $scope.reload = function() {
            BookletSvc.getAll().success(function(data) {
                if (data.booklets !== false) {
                    $scope.booklets = data.booklets;
                    for (var booklet in $scope.booklets) {
                        $scope.booklets[booklet].folios = {};
                        if ($scope.booklets[booklet].ownFolio !== undefined) {
                            for (var folio in $scope.booklets[booklet].ownFolio) {
                                $scope.booklets[booklet].folios[$scope.booklets[booklet].ownFolio[folio].type] = $scope.booklets[booklet].ownFolio[folio].id;
                            }
                        }
                    }
                }
            });
        };
        $scope.createBooklet = function() {
            $scope.error = '';
            if ($scope.newBookName.length === 0) {
                $scope.error = 'Vous devez saisir un nom de livret';
                return;
            }
            BookletSvc.create($scope.newBookName).success(function(data) {
                $scope.newBookName = '';
                $scope.selectedBooklet = data.booklet_id;
                $scope.reload();
            }).error(function(data, status) {
                switch (status) {
                    case 400:
                        $scope.error = 'Vous devez saisir un nom de livret';
                        break;
                    default:
                        $scope.error = 'Une erreur est survenue lors de la creation du livret';
                        break;
                }
            });
        };
        $scope.selectBooklet = function(booklet_id) {
            if ($scope.selectedBooklet === booklet_id) {
                $scope.selectedBooklet = false;
            } else {
                $scope.selectedBooklet = booklet_id;
            }
        };
        $scope.duplicateBooklet = function(booklet_id) {
            BookletSvc.duplicate(booklet_id).success(function(data) {
                $scope.selectedBooklet = data.booklet_id;
                $scope.reload();
            });
        };
        $scope.deleteBooklet = function(booklet_id) {
            BookletSvc.delete(booklet_id).success(function() {
                if ($scope.selectedBooklet === booklet_id) {
                    $scope.selectedBooklet = false;
                }
                $scope.reload();
            });
        };
        $scope.createFolio = function(booklet_id, folio_type) {
            switch (folio_type) {
                case 'folio1':
                    BookletSvc.createFolio(booklet_id, folio_type).success(function(data) {
                        $scope.editFolio(booklet_id, data.folio_id);
                    });
                    break;
                case 'folio2':
                    $location.path('/plateforme/booklet/' + booklet_id + '/folio2choice');
                    break;
                case 'folio3':
                    break;
                case 'folio4':
                    break;
                case 'folio5':
                    break;
            }
        };
        $scope.editFolio = function(booklet_id, folio_id) {
            $location.path('/plateforme/booklet/' + booklet_id + '/folio/' + folio_id);
        };
        $scope.reload();
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Folio', ['$scope', '$routeParams', 'BookletSvc',
    function($scope, $routeParams, BookletSvc) {
        $scope.booklet_id = $routeParams.booklet_id;
        $scope.folio_id = $routeParams.folio_id;
        $scope.folio_content = '';
        BookletSvc.getFolio($scope.booklet_id, $scope.folio_id).success(function(data) {
            $scope.folio_content = data.folio.content;
        });
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Folio2Choice', ['$scope', '$routeParams', '$location', 'BookletSvc',
    function($scope, $routeParams, $location, BookletSvc) {
        $scope.booklet_id = $routeParams.booklet_id;
        $scope.template = null;
        $scope.editFolio = function(folio_id) {
            $location.path('/plateforme/booklet/' + $scope.booklet_id + '/folio/' + folio_id);
        };
        $scope.makeChoice = function(template_name) {
            $scope.template = template_name;
        };
        $scope.confirmChoiceNext = function() {
            if ($scope.template === null) {
                alert('Vous devez selectionner un modele');
            } else {
                BookletSvc.createFolio($scope.booklet_id, 'folio2', $scope.template).success(function(data) {
                    $scope.editFolio(data.folio_id);
                });
            }
        };
        $scope.confirmChoiceReturn = function() {
            if ($scope.template === null) {
                alert('Vous devez selectionner un modele');
            } else {
                BookletSvc.createFolio($scope.booklet_id, 'folio2', $scope.template).success(function(data) {
                    $location.path('/plateforme/booklets');
                });
            }
        };
        $scope.gotoBooklets = function() {
            $location.path('/plateforme/booklets');
        };
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
