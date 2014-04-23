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
            return ($location.path().split('/')[1] === 'plateforme') ? false : true;
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
FeaderAppControllers.controller('CommonCtrl.Contact', ['$scope', 'ToolSvc', 'ApiSvc',
    function($scope, ToolSvc, ApiSvc) {
        $scope.contactInfos = {
            name: '',
            last_name: '',
            first_name: '',
            fonction: '',
            email: '',
            phone: '',
            address: '',
            cp: '',
            question: ''
        };
        $scope.email2 = '';
        $scope.contactInProgress = false;
        $scope.message = {
            type: null,
            text: '',
            show: false
        };
        $scope.contact = function() {
            $scope.message.show = false;
            $scope.contactInProgress = true;
            if ($scope.contactInfos.name === '' ||
                    $scope.contactInfos.last_name === '' ||
                    $scope.contactInfos.first_name === '' ||
                    $scope.contactInfos.address === '' ||
                    $scope.contactInfos.email === '' ||
                    $scope.contactInfos.cp === '' ||
                    $scope.contactInfos.question === '') {
                $scope.showError('Les champs marqués d’un * doivent être complétés');
                return;
            }
            if ($scope.contactInfos.email !== $scope.email2) {
                $scope.showError('Veuillez saisir les meme adresse mail');
                return;
            }
            if (!ToolSvc.isValidEmail($scope.contactInfos.email)) {
                $scope.showError('Le format de l\'adresse mail n\'est pas correct.');
                return;
            }
            ApiSvc.postContact($scope.contactInfos).success(function(data) {
                $scope.showSuccess("Nous avons bien en compte votre demande, nous vous recontacterons très rapidement.Le Réseau Rural Haut-Normand");
                $scope.contactInfos = {
                    name: '',
                    last_name: '',
                    first_name: '',
                    fonction: '',
                    email: '',
                    phone: '',
                    address: '',
                    cp: '',
                    question: ''
                };
            }).error(function(data, status) {

            });
        };
        $scope.showError = function(message) {
            $scope.message.type = 'error';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.contactInProgress = false;
        };
        $scope.showSuccess = function(message) {
            $scope.message.type = 'success';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.contactInProgress = false;
        };
    }
]);
FeaderAppControllers.controller('HomeCtrl.Home', ['$scope',
    function($scope) {
    }
]);
FeaderAppControllers.controller('AccountCtrl.Create', ['$scope', 'UserSvc', 'ToolSvc',
    function($scope, UserSvc, ToolSvc) {
        $scope.userInfos = {
            name: '',
            last_name: '',
            first_name: '',
            fonction: '',
            username: '',
            phone: '',
            address: '',
            cp: '',
            passwd: '',
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
                $scope.showError('Veuillez saisir les meme mot de passe');
                return;
            }
            if (!ToolSvc.isValidEmail($scope.userInfos.username)) {
                $scope.userInfos.passwd = '';
                $scope.passwd2 = '';
                $scope.showError('Le format de l\'adresse mail n\'est pas correct.');
                return;
            }
            if ($scope.userInfos.username !== $scope.username2) {
                $scope.userInfos.passwd = '';
                $scope.passwd2 = '';
                $scope.showError('Veuillez saisir les meme adresse mail');
                return;
            }
            if ($scope.userInfos.name === '' ||
                    $scope.userInfos.last_name === '' ||
                    $scope.userInfos.first_name === '' ||
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
                                msg = 'Votre compte a été créé avec succès. Pour valider la création de votre compte, merci de cliquer sur le lien que vous venez de recevoir par mail.';
                                break;
                            default:
                                msg = 'Votre compte a été créé avec succès. Pour valider la création de votre compte, merci de cliquer sur le lien que vous venez de recevoir par mail.';
                                break;
                        }
                        $scope.showSuccess(msg);
                        $scope.userInfos = {
                            name: '',
                            last_name: '',
                            first_name: '',
                            fonction: '',
                            username: '',
                            phone: '',
                            address: '',
                            cp: '',
                            passwd: '',
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
FeaderAppControllers.controller('AccountCtrl.Confirm', ['$scope', '$routeParams', 'UserSvc',
    function($scope, $routeParams, UserSvc) {
        $scope.error = false;
        $scope.success = false;
        UserSvc.Confirm($routeParams.confirm_key).success(function(data) {
            $scope.success = true;
        }).error(function(data, status) {
            $scope.error = true;
        });
    }
]);
FeaderAppControllers.controller('AccountCtrl.ResetPasswd', ['$scope', 'UserSvc', 'ToolSvc',
    function($scope, UserSvc, ToolSvc) {
        $scope.email = '';
        $scope.error = false;
        $scope.error_message = '';
        $scope.passwdChanged = false;
        $scope.resetInProgress = false;
        $scope.resetPasswd = function() {
            $scope.error = false;
            $scope.resetInProgress = true;
            if ($scope.email === '') {
                $scope.resetInProgress = false;
                $scope.error = true;
                $scope.error_message = 'Vous devez saisir votre adresse mail.';
                return;
            }
            if (!ToolSvc.isValidEmail($scope.email)) {
                $scope.resetInProgress = false;
                $scope.error = true;
                $scope.error_message = 'Le format de votre adresse mail est incorrect.';
                return;
            }
            UserSvc.ResetPasswd($scope.email).success(function(data) {
                $scope.passwdChanged = true;
                $scope.resetInProgress = false;
            }).error(function(data, status) {
                $scope.resetInProgress = false;
                $scope.error = true;
                $scope.error_message = 'Cette adresse mail est inconnue.';
            });
        };
    }
]);
FeaderAppControllers.controller('AccountCtrl.Profil', ['$scope', 'UserSvc', 'ToolSvc',
    function($scope, UserSvc, ToolSvc) {
        $scope.saveInProgress = false;
        $scope.passwd = '';
        $scope.passwd2 = '';
        $scope.message = {
            type: null,
            text: '',
            show: false
        };
        $scope.save = function() {
            $scope.saveInProgress = true;
            if ($scope.passwd !== $scope.passwd2) {
                $scope.passwd = '';
                $scope.passwd2 = '';
                $scope.saveInProgress = false;
                $scope.showError('Veuillez saisir les meme mot de passe');
                return;
            }
            if ($scope.passwd === '') {
                $scope.saveInProgress = false;
                $scope.showError('Les champs marqués d’un * doivent être complétés');
                return;
            }
            var userInfos = {
                passwd: $scope.passwd
            };
            $scope.passwd = '';
            $scope.passwd2 = '';
            UserSvc.ProfilUpdate(userInfos).success(function(data) {
                $scope.saveInProgress = false;
                $scope.showSuccess('Les modifications ont bien ete effectuees.');
            }).error(function(data, status) {
                $scope.saveInProgress = false;
                $scope.showError('Impossible de sauvegarder vos nouvelles informations');
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
