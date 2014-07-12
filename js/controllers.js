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
            return ($location.path().split('/')[1] === 'plateforme' || $location.path().split('/')[1] === 'admin' || $location.path().split('/')[1] === 'denied') ? false : true;
        };
        $scope.login = function() {
            $scope.error = '';
            if ($scope.identifiant === '' || $scope.passwd === '') {
                return;
            }
            $scope.loginInProgress = true;
            var store = ($scope.rememberMe === 'on') ? true : false;
            UserSvc.Login($scope.identifiant, $scope.passwd, store,
                    function(data, status) {
                        $scope.identifiant = '';
                        $scope.passwd = '';
                        $scope.loginInProgress = false;
                        switch (UserSvc.getPermissions()) {
                            case 1:
//                                $location.path('/plateforme');
                                break;
                            case 2:
                                $location.path('/admin');
                                break;
                        }
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
FeaderAppControllers.controller('CommonCtrl.Contact', ['$scope', 'ToolSvc', 'ApiSvc', 'UserSvc',
    function($scope, ToolSvc, ApiSvc, UserSvc) {
        $scope.contactInfos = {
            name: '',
            last_name: '',
            first_name: '',
            fonction: '',
            email: '',
            phone: '',
            address: '',
            cp: '',
            city: '',
            question: ''
        };
        $scope.email2 = '';
        $scope.contactInProgress = false;
        $scope.message = {
            type: null,
            text: '',
            show: false
        };
        $scope.prepareFormLoggedUser = function() {
            if (UserSvc.isLogged()) {
                $scope.contactInfos.email = UserSvc.getInfos().username;
                $scope.email2 = UserSvc.getInfos().username;
                $scope.contactInfos.last_name = UserSvc.getInfos().last_name;
                $scope.contactInfos.first_name = UserSvc.getInfos().first_name;
                $scope.contactInfos.fonction = UserSvc.getInfos().fonction;
                $scope.contactInfos.name = UserSvc.getInfos().name;
                $scope.contactInfos.fonction = UserSvc.getInfos().fonction;
                $scope.contactInfos.phone = UserSvc.getInfos().phone;
                $scope.contactInfos.address = UserSvc.getInfos().address;
                $scope.contactInfos.cp = UserSvc.getInfos().cp;
                $scope.contactInfos.city = UserSvc.getInfos().city;
            }
        };
        $scope.contact = function() {
            $scope.message.show = false;
            $scope.contactInProgress = true;
            $scope.prepareFormLoggedUser();
            if ($scope.contactInfos.name === '' ||
                    $scope.contactInfos.last_name === '' ||
                    $scope.contactInfos.first_name === '' ||
                    $scope.contactInfos.email === '' ||
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
                    city: '',
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
FeaderAppControllers.controller('CommonCtrl.LibraryCats', ['$scope', 'LibrarySvc',
    function($scope, LibrarySvc) {
        $scope.error = '';
        $scope.cats = [];
        $scope.init = function() {
            $scope.cats = [];
            LibrarySvc.getCats().success(function(data) {
                $scope.cats = data.categories;
            }).error(function(data, status) {
                $scope.showError();
            });
        };
        $scope.showError = function() {
            $scope.error = 'Impossible de charger la liste des categories';
        };
    }
]);
FeaderAppControllers.controller('HomeCtrl.Home', ['$scope', '$location', 'UserSvc',
    function($scope, $location, UserSvc) {
        $scope.goto = function(target) {
            if (!UserSvc.isLogged()) {
                alert('Pour accéder à la trousse à outils, merci de vous identifier ou de créer un compte');
            } else if (UserSvc.getPermissions() === 2) {
                alert('Pour accéder à la trousse à outils, merci de créer un compte utilisateur');
            } else {
                $location.path('/plateforme/' + target);
            }
        };
    }
]);

/*
 * 
 * CONTROLLER ACCOUNT
 * 
 */
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
            city: '',
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
                $scope.showError('Veuillez saisir les mêmes adresses mail');
                return;
            }
            if ($scope.userInfos.name === '' ||
                    $scope.userInfos.last_name === '' ||
                    $scope.userInfos.first_name === '' ||
                    $scope.userInfos.address === '' ||
                    $scope.userInfos.username === '' ||
                    $scope.userInfos.cp === '' ||
                    $scope.userInfos.city === '' ||
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
                                msg = 'Votre compte a été créé avec succès. Validez votre compte en cliquant sur le lien que vous venez de recevoir par e-mail puis connectez vous pour commencer votre premier livret (votre login sera votre adresse e-mail).';
                                break;
                            default:
                                msg = 'Votre compte a été créé avec succès. Validez votre compte en cliquant sur le lien que vous venez de recevoir par e-mail puis connectez vous pour commencer votre premier livret (votre login sera votre adresse e-mail).';
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
                            city: '',
                            passwd: '',
                            contract_accepted: false
                        };
                    },
                    function(data, status) {
                        var msg = '';
                        switch (status) {
                            case 400:
                                msg = 'Les champs marqués d\'un * doivent être complétés';
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
        $scope.userInfos = {
            name: UserSvc.getInfos().name,
            last_name: UserSvc.getInfos().last_name,
            first_name: UserSvc.getInfos().first_name,
            fonction: UserSvc.getInfos().fonction,
            phone: UserSvc.getInfos().phone,
            address: UserSvc.getInfos().address,
            cp: UserSvc.getInfos().cp,
            city: UserSvc.getInfos().city,
            passwd: ''
        };
        $scope.passwd2 = '';
        $scope.message = {
            type: null,
            text: '',
            show: false
        };
        $scope.save = function() {
            $scope.saveInProgress = true;
            if ($scope.userInfos.name === '' ||
                    $scope.userInfos.last_name === '' ||
                    $scope.userInfos.first_name === '' ||
                    $scope.userInfos.address === '' ||
                    $scope.userInfos.city === '' ||
                    $scope.userInfos.cp === '') {
                $scope.showError('Les champs marqués d’un * doivent être complétés');
                return;
            }
            if ($scope.userInfos.passwd !== '') {
                if ($scope.userInfos.passwd !== $scope.passwd2) {
                    $scope.showError('Veuillez saisir les meme mot de passe');
                    return;
                }
            }
            UserSvc.ProfilUpdate($scope.userInfos).success(function(data) {
                $scope.showSuccess('Les modifications ont bien ete effectuees.');
            }).error(function(data, status) {
                $scope.showError('Impossible de sauvegarder vos nouvelles informations');
            });
        };
        $scope.showError = function(message) {
            $scope.message.type = 'error';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.saveInProgress = false;
            $scope.userInfos = {
                name: UserSvc.getInfos().name,
                last_name: UserSvc.getInfos().last_name,
                first_name: UserSvc.getInfos().first_name,
                fonction: UserSvc.getInfos().fonction,
                phone: UserSvc.getInfos().phone,
                address: UserSvc.getInfos().address,
                cp: UserSvc.getInfos().cp,
                passwd: ''
            };
            $scope.passwd2 = '';
        };
        $scope.showSuccess = function(message) {
            $scope.message.type = 'success';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.saveInProgress = false;
            $scope.userInfos.passwd = '';
            $scope.passwd2 = '';
        };
    }
]);

/*
 * 
 * CONTROLLER BACKOFFICE BOOKLETS
 * 
 */
FeaderAppControllers.controller('BackofficeCtrl.Booklets', ['$scope', '$routeParams', '$location', 'BookletSvc',
    function($scope, $routeParams, $location, BookletSvc) {
        $scope.newBookName = '';
        $scope.booklets = null;
        $scope.loading = false;
        $scope.selectedBooklet = false;
        if (typeof $routeParams.booklet_focus !== undefined) {
            $scope.selectedBooklet = parseInt($routeParams.booklet_focus);
        }
        $scope.error = '';
        $scope.reload = function() {
            $scope.loading = true;
            BookletSvc.getAll().success(function(data) {
                if (data.booklets !== false) {
                    $scope.booklets = data.booklets;
                    for (var booklet in $scope.booklets) {
                        $scope.booklets[booklet].folios = {};
                        if ($scope.booklets[booklet].ownFolio !== undefined) {
                            for (var folio in $scope.booklets[booklet].ownFolio) {
                                if ($scope.booklets[booklet].ownFolio[folio].type in {'territoire1': null, 'territoire2': null, 'territoire3': null}) {
                                    $scope.booklets[booklet].folios['territoire'] = $scope.booklets[booklet].ownFolio[folio].id;
                                } else {
                                    $scope.booklets[booklet].folios[$scope.booklets[booklet].ownFolio[folio].type] = $scope.booklets[booklet].ownFolio[folio].id;
                                }
                            }
                        }
                    }
                }
                $scope.loading = false;
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
                case 'territoire':
                    $location.path('/plateforme/booklet/' + booklet_id + '/folio2choice');
                    break;
                default:
                    BookletSvc.createFolio(booklet_id, folio_type).success(function(data) {
                        $scope.editFolio(booklet_id, data.folio_id);
                    }).error(function(data, status) {
                        switch (status) {
                            case 401:
                                alert('Vous devez etre connecte pour creer un folio');
                                break;
                            case 404:
                                alert('Le livret est introuvable ou ne vuos appartient pas');
                                break;
                            case 423:
                                alert('Ce folio existe deja pour ce livret');
                                break;
                            case 415:
                                alert('Le modele de folio demande est innexistant');
                                break;
                            default:
                                alert('Une erreur est survenue lors de la creation du folio');
                                break;
                        }
                    });
                    break;
            }
        };
        $scope.editFolio = function(booklet_id, folio_id) {
            $location.path('/plateforme/booklet/' + booklet_id + '/folio/' + folio_id);
        };
        $scope.reload();
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Folio', ['$scope', '$routeParams', '$rootScope', '$location', '$sce', 'BookletSvc', 'ToolSvc', '$compile', 'UserSvc',
    function($scope, $routeParams, $rootScope, $location, $sce, BookletSvc, ToolSvc, $compile, UserSvc) {
        $scope.logout = function() {
            UserSvc.Logout(function() {
                $location.path('/home');
            });
        };
        $scope.showPictureSelector = false;
        $scope.showFullscreen = false;
        $scope.showHelp = false;
        $scope.imageSelected = null;
        $scope.templates = [];
        $scope.booklet_id = $routeParams.booklet_id;
        $scope.booklet = null;
        $scope.folio_id = $routeParams.folio_id;
        $scope.folio = null;
        $scope.selected_page = 0;
        $scope.updatedFolio = false;
        $scope.folioBuilding = false;
        BookletSvc.get($scope.booklet_id).success(function(data) {
            $scope.booklet = data.booklet;
        });
        BookletSvc.getFolio($scope.booklet_id, $scope.folio_id).success(function(data) {
            $scope.folio = data.folio[0];
        });
        BookletSvc.getTemplates().success(function(data) {
            $scope.templates = data;
        });
        $scope.selectPage = function(page_index) {
            $scope.selected_page = page_index;
        };
        $scope.getFolioContent = function() {
            return $sce.trustAsHtml($scope.folio.ownPage[$scope.selected_page].content);
        };
        $scope.clearPlugins = function(content) {
            content.find('.ng-draggable').removeClass('ui-draggable');
            content.find('.ng-draggable').removeClass('ui-draggable-dragging');
            content.find('.ng-draggable').children('.ng-draggable-handler').remove();
            content.find('.ng-editable').removeAttr('contenteditable');
            content.find('.ng-editable').removeClass('ng-editable-marker');
            content.find('.ng-editable-toolbox').remove();
            content.find('.ng-locked').children('.ng-locked-handler').remove();
            content.find('.ng-deletable').children('.ng-deletable-handler').remove();
            content.find('.ng-clone-cat').find('h4').children('.ng-clone-cat-handler').remove();
            content.find('.ng-remove-cat').find('h4').children('.ng-remove-cat-handler').remove();
            content.find('.ng-clone-orga').find('h5').children('.ng-clone-orga-handler').remove();
            content.find('.ng-remove-orga').find('h5').children('.ng-remove-orga-handler').remove();
            content.find('.ng-date-ferie-select-close').remove();
            content.find('.ng-date-vac-select-close').remove();
            return content;
        };
        $scope.updateModel = function() {
            $scope.updatedFolio = true;
            var content = $('#drawboard').clone();
            content = $scope.clearPlugins(content);
            $scope.folio.ownPage[$scope.selected_page].content = content.html();
        };
        $scope.buildFolio = function(container) {
            // backup header and footer
            var container_attrs = container.prop('attributes');
            var header = container.find('.page-header').clone();
            var footer = container.find('.page-footer').clone();
            var full_content = $('<div/>');

            // concat all html pages
            for (var i = 0; i < $scope.folio.ownPage.length; ++i) {
                if (i === $scope.selected_page) {
                    // current page editing (not saved in model)
                    full_content.append(container.clone(true));
                } else {
                    // others pages (saved in model)
                    full_content.append($scope.folio.ownPage[i].content);
                }
            }

            // remove plugin content
            full_content = $scope.clearPlugins(full_content);

            var order = 1;
            var pages = [{
                    folio_id: $scope.folio_id,
                    order: 1,
                    content: ''
                }];
            var entry_count = 0;
            var max_cat_index = full_content.find('.ng-clone-cat').length - 1;

            // backup container attributes
            var content = $('<div/>');
            var cat_content = $('<div/>');
            $.each(container_attrs, function() {
                content.attr(this.name, this.value);
            });
            // parse all cats in content
            full_content.find('.ng-clone-cat').each(function(index) {
                // backups cat
                var cat_header = $(this).clone();
                // empty orga in this cat
                cat_header.find('.ng-clone-orga').remove();
                // count orga in this cat
                var max_orga_index = $(this).find('.ng-clone-orga').length - 1;

                // parse all orga in this cat
                $(this).find('.ng-clone-orga').each(function(index_orga) {
                    // check header
                    if (entry_count === 0) {
                        // first element => add header
                        header.appendTo(content);
                    }
                    // check place => there is a place
                    if (entry_count < 6) {
                        // store orga in cat content
                        cat_content.append($(this));
                        entry_count++;
                    }
                    // page is not full and no more orga exists
                    if (entry_count < 6 && index_orga === max_orga_index) {
                        // store orgas in cloned cat header
                        cat_header.find('div:eq(1)').append(cat_content.children().clone());
                        cat_content.html('');
                        // store cat in content
                        content.append(cat_header.clone());
                        cat_header.find('.ng-clone-orga').remove();
                        if (index === max_cat_index) {
                            // create page
                            // store footer
                            footer.appendTo(content);
                            // save page
                            pages[pages.length - 1].content = content.clone().prop('outerHTML');
                        }
                    }
                    // page is full and more orga exists
                    if (entry_count === 6 && index_orga < max_orga_index) {
                        // store orgas in cloned cat header
                        cat_header.find('div:eq(1)').append(cat_content.children().clone());
                        cat_content.html('');
                        // store cat in content
                        content.append(cat_header.clone());
                        cat_header.find('.ng-clone-orga').remove();
                        // store footer
                        footer.appendTo(content);
                        // save page
                        pages[pages.length - 1].content = content.clone().prop('outerHTML');
                        content.html('');
                        // create page
                        order++;
                        pages.push({
                            folio_id: $scope.folio_id,
                            order: order,
                            content: ''
                        });
                        entry_count = 0;
                    }
                    // page is full and no more orga exists
                    if (entry_count === 6 && index_orga === max_orga_index) {
                        // store orgas in cloned cat header
                        cat_header.find('div:eq(1)').append(cat_content.children().clone());
                        cat_content.html('');
                        // store cat in content
                        content.append(cat_header.clone());
                        cat_header.find('.ng-clone-orga').remove();
                        // store footer
                        footer.appendTo(content);
                        // save page
                        pages[pages.length - 1].content = content.clone().prop('outerHTML');
                        content.html('');
                        if (index < max_cat_index) {
                            // create page
                            order++;
                            pages.push({
                                folio_id: $scope.folio_id,
                                order: order,
                                content: ''
                            });
                            entry_count = 0;
                        }
                    }
                });
            });
            $scope.$apply(function() {
                $scope.folio.ownPage = pages;
                if ($scope.selected_page >= $scope.folio.ownPage.length) {
                    // last page deletion
                    $scope.selected_page = $scope.folio.ownPage.length - 1;
                }
            });

        };
        $scope.save = function(callback) {
            $scope.updateModel();
            BookletSvc.updateFolio($scope.booklet.id, $scope.folio.id, $scope.folio.ownPage).success(function(data) {
                if (typeof callback === 'function') {
                    $scope.updatedFolio = false;
                    callback();
                }
            }).error(function(data, status) {
                alert('Erreur de sauvegarde (' + status + ')');
            });
        };
        $scope.saveAndStay = function() {
            $scope.save(function() {
                alert('Sauvegarde effectuée');
            });
        };
        $scope.saveAndLeave = function() {
            $scope.save(function() {
                $location.path('/plateforme/booklets/' + $scope.booklet.id);
            });
        };
        $scope.togglePictureSelect = function() {
            $scope.showPictureSelector = !$scope.showPictureSelector;
        };
        $scope.selectImage = function(filename, source) {
            $scope.imageSelected = (source === 'own') ? 'images/uploaded/' + filename : 'images/library/' + filename;
            $scope.showPictureSelector = false;
        };
        $scope.toggleHelp = function() {
            $scope.showHelp = !$scope.showHelp;
        };
        $scope.toggleFullScreen = function() {
            angular.element('.ng-editable-toolbox:not(#ng-editable-toolbox)').remove();
            $scope.showFullscreen = !$scope.showFullscreen;
        };
        $scope.toggleTooltips = function() {
            $rootScope.layout.showTooltips = !$rootScope.layout.showTooltips;
        };
        $scope.exportPDF = function(highresolution) {
            if ($scope.updatedFolio === true) {
                alert('Merci de sauvegarder vos modifications avant d\'exporter le fichier PDF.');
                return;
            }
            if (typeof highresolution !== 'undefined' && highresolution === true) {
                window.location = 'api/booklet/' + $scope.booklet_id + '/folio/' + $scope.folio_id + '/export/hq';
            } else {
                window.location = 'api/booklet/' + $scope.booklet_id + '/folio/' + $scope.folio_id + '/export/lq';
            }
//            BookletSvc.exportPDF($scope.booklet_id, $scope.folio_id).success(function(data) {              
//                var blob = new Blob([data], {type: 'application/pdf'});
//                $scope.url = (window.URL || window.webkitURL).createObjectURL(blob);
//                
//            });
        };
        $scope.$on('$locationChangeStart', function(event, next, current) {
            if ($scope.updatedFolio === true) {
                if (!confirm('Attention les modifications non enregistrées seront perdues')) {
                    event.preventDefault();
                }
            }
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
            if (confirm('Une fois le modèle choisi vous ne pourrez changer de modèle. Lisez nos conseils en haut à droite de cette page pour en savoir plus.')) {
                $scope.template = template_name;
                $scope.confirmChoiceNext();
            }

        };
        $scope.confirmChoiceNext = function() {
            if ($scope.template === null) {
                alert('Vous devez selectionner un modele');
            } else {
                BookletSvc.createFolio($scope.booklet_id, $scope.template).success(function(data) {
                    $scope.editFolio(data.folio_id);
                });
            }
        };
        $scope.confirmChoiceReturn = function() {
            if ($scope.template === null) {
                alert('Vous devez selectionner un modele');
            } else {
                BookletSvc.createFolio($scope.booklet_id, $scope.template).success(function(data) {
                    $location.path('/plateforme/booklets');
                });
            }
        };
        $scope.gotoBooklets = function() {
            $location.path('/plateforme/booklets');
        };
    }
]);

/*
 * 
 * CONTROLLER BACKOFFICE LIBRARY
 * 
 */
FeaderAppControllers.controller('BackofficeCtrl.Library', ['$scope', 'LibrarySvc',
    function($scope, LibrarySvc) {
        $scope.name = '';
        $scope.description = '';
        $scope.credits = '';
        $scope.image = '';
        $scope.categories = [];
        $scope.library = [];
        $scope.library_title = 'Mes images';
        $scope.source = 'own';
        $scope.selected_cat = -1;
        $scope.tmpImage = {};
        $scope.showPopupAdd = false;
        $scope.showPopupEdit = false;
        $scope.currentPage = 0;
        $scope.pageSize = 20;
        $scope.numberOfPages = function() {
            if ($scope.library === null || $scope.library.length === 0) {
                return 0;
            }
            return Math.ceil($scope.library.length / $scope.pageSize);
        };
        $scope.togglePopupAdd = function() {
            $scope.showPopupAdd = !$scope.showPopupAdd;
        };
        $scope.togglePopupEdit = function(image) {
            if (typeof image !== 'undefined') {
                $scope.tmpImage = image;
            } else {
                $scope.tmpImage = {};
            }
            $scope.showPopupEdit = !$scope.showPopupEdit;
        };
        $scope.selectCat = function(cat_id) {
            if (typeof cat_id === 'undefined') {
                $scope.selected_cat = -1;
            } else {
                $scope.selected_cat = cat_id;
            }
        };
        $scope.refreshLibrary = function() {
            $scope.library = [];
            $scope.refreshLibraryCategories();
            if ($scope.source === 'own') {
                LibrarySvc.getImages().success(function(data) {
                    $scope.library = data.library;
                });
            } else if ($scope.source === 'cat' && $scope.selected_cat > -1) {
                LibrarySvc.getImagesByCat($scope.selected_cat).success(function(data) {
                    $scope.library_title = data.name;
                    $scope.library = data.library;
                });
            }

        };
        $scope.refreshLibraryCategories = function() {
            $scope.categories = [];
            LibrarySvc.getCats().success(function(data) {
                $scope.categories = data.categories;
            });
        };
        $scope.setFile = function(element) {
            if (element.files[0].size > 5000000) {
                alert('Le fichier est trop volumineux. Poids accepté : jusqu\'à 5 mégas.');
                angular.element('#library-form-add-image').val(null);
            } else {
                $scope.image = element.files[0];
            }
        };
        $scope.startUpload = function() {
            if ($scope.name === '' || $scope.description === '' || $scope.image === '') {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            var form = new FormData();
            form.append('name', $scope.name);
            form.append('description', $scope.description);
            form.append('credits', $scope.credits);
            form.append('image', $scope.image);
            LibrarySvc.addImage(form).success(function(data, status) {
                $scope.name = '';
                $scope.description = '';
                $scope.credits = '';
                $scope.image = '';
                angular.element('#library-form-add-image').val(null);
                if ($scope.source === 'own') {
                    $scope.refreshLibrary();
                } else {
                    $scope.source = 'own';
                }
                $scope.togglePopupAdd();
            }).error(function(data, status) {
                alert('image upload error : ' + data.error);
            });
        };
        $scope.updateImage = function() {
            if ($scope.tmpImage.name === '' || $scope.tmpImage.description === '') {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            LibrarySvc.updateImage($scope.tmpImage).success(function() {
                if ($scope.source === 'own') {
                    $scope.refreshLibrary();
                } else {
                    $scope.source = 'own';
                }
                $scope.tmpImage = {};
                $scope.togglePopupEdit();
            });
        };
        $scope.deleteImage = function(image_id) {
            if (confirm("Voulez-vous vraiment supprimer cette photo ?")) {
                LibrarySvc.deleteImage(image_id).success(function() {
                    $scope.refreshLibrary();
                });
            }
        };
        $scope.$watch('source', function(newval, oldval) {
            if (newval === 'own') {
                $scope.selected_cat = -1;
                $scope.library_title = 'Mes images';
                $scope.refreshLibrary();
            } else {
                $scope.library_title = 'Selectionner une categorie';
                $scope.library = [];
            }
        });
        $scope.$watch('selected_cat', function(newval, oldval) {
            if ($scope.source === 'cat' && newval > -1) {
                $scope.library_title = '';
                $scope.refreshLibrary();
            } else if ($scope.source === 'cat' && newval === -1) {
                $scope.library_title = 'Selectionner une categorie';
                $scope.library = [];
            }
        });
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.PictureSelector', ['$scope', 'LibrarySvc',
    function($scope, LibrarySvc) {
        $scope.library = null;
        $scope.refreshLibrary = function() {
            LibrarySvc.getImages().success(function(data) {
                $scope.library = data.library;
            });
        };
        $scope.refreshLibrary();
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


FeaderAppControllers.controller('AdminCtrl.Stats', ['$scope', 'AdminSvc',
    function($scope, AdminSvc) {
        $scope.stats = {
            users_confirmed: 0,
            users_not_confirmed: 0,
            booklets: 0,
            pictures: 0
        };
        $scope.reloadStats = function() {
            AdminSvc.getStats().success(function(data) {
                $scope.stats.users_confirmed = data.users_confirmed;
                $scope.stats.users_not_confirmed = data.users_not_confirmed;
                $scope.stats.booklets = data.booklets;
                $scope.stats.pictures = data.pictures;
            });
        };
        $scope.reloadStats();
    }
]);
FeaderAppControllers.controller('AdminCtrl.Users', ['$scope', 'AdminSvc',
    function($scope, AdminSvc) {
        $scope.Users = [];
        $scope.userOrderBy = 'last_name';
        $scope.userFilter = '';
        $scope.showSheet = false;
        $scope.selectedUser = -1;
        $scope.changeOrder = function(field) {
            if ($scope.userOrderBy === field) {
                $scope.userOrderBy = '-' + field;
            } else if ($scope.userOrderBy === ('-' + field)) {
                $scope.userOrderBy = field;
            } else {
                $scope.userOrderBy = field;
            }
        };
        $scope.toggleSheet = function() {
            $scope.showSheet = !$scope.showSheet;
        };
        $scope.showUserSheet = function(user) {
            $scope.selectedUser = $scope.Users.indexOf(user);
            $scope.toggleSheet();
        };
        $scope.deleteUser = function(user) {
            if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
                AdminSvc.deleteUser(user.id).success(function(data) {
                    $scope.Users.splice($scope.Users.indexOf(user), 1);
                }).error(function(data, status) {
                    switch (status) {
                        case 403:
                            alert('Impossible de supprimer un compte administrateur');
                            break;
                        default:
                            alert('Impossible de supprimer cet utilisateur');
                            break;
                    }
                });
            }
        };
        $scope.reload = function() {
            AdminSvc.getUserList()
                    .success(function(data) {
                        $scope.Users = data;
                    })
                    .error(function(data, status) {

                    });
        };
        $scope.reload();
    }
]);
FeaderAppControllers.controller('AdminCtrl.Library', ['$scope', 'LibrarySvc',
    function($scope, LibrarySvc) {
        $scope.name = '';
        $scope.description = '';
        $scope.credits = '';
        $scope.category = -1;
        $scope.image = '';
        $scope.categories = [];
        $scope.library = [];
        $scope.library_title = 'Images des utilisateurs';
        $scope.source = 'own';
        $scope.selected_cat = -1;
        $scope.tmpImage = {};
        $scope.showPopupAdd = false;
        $scope.showPopupEdit = false;
        $scope.showPopupImport = false;
        $scope.currentPage = 0;
        $scope.pageSize = 20;
        $scope.numberOfPages = function() {
            if ($scope.library === null || $scope.library.length === 0) {
                return 0;
            }
            return Math.ceil($scope.library.length / $scope.pageSize);
        };
        $scope.togglePopupAdd = function() {
            $scope.showPopupAdd = !$scope.showPopupAdd;
        };
        $scope.togglePopupEdit = function(image) {
            if (typeof image !== 'undefined') {
                $scope.tmpImage = image;
            } else {
                $scope.tmpImage = {};
            }
            $scope.showPopupEdit = !$scope.showPopupEdit;
        };
        $scope.togglePopupImport = function(image) {
            if (typeof image !== 'undefined') {
                $scope.tmpImage = image;
            } else {
                $scope.tmpImage = {};
            }
            $scope.showPopupImport = !$scope.showPopupImport;
        };
        $scope.selectCat = function(cat_id) {
            if (typeof cat_id === 'undefined') {
                $scope.selected_cat = -1;
            } else {
                $scope.selected_cat = cat_id;
            }
        };
        $scope.refreshLibrary = function() {
            $scope.library = [];
            $scope.refreshLibraryCategories();
            if ($scope.source === 'own') {
                LibrarySvc.getAllImages().success(function(data) {
                    $scope.library = data.library;
                });
            } else if ($scope.source === 'cat' && $scope.selected_cat > -1) {
                LibrarySvc.getImagesByCat($scope.selected_cat).success(function(data) {
                    $scope.library_title = data.name;
                    $scope.library = data.library;
                });
            }
        };
        $scope.refreshLibraryCategories = function() {
            $scope.categories = [];
            LibrarySvc.getCats().success(function(data) {
                $scope.categories = data.categories;
            });
        };
        $scope.setFile = function(element) {
            if (element.files[0].size > 5000000) {
                alert('Le fichier est trop volumineux.');
                angular.element('#library-form-add-image').val(null);
            } else {
                $scope.image = element.files[0];
            }
        };
        $scope.startUpload = function() {
            if ($scope.name === '' || $scope.description === '' || $scope.image === '' || $scope.category === -1) {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            var form = new FormData();
            form.append('name', $scope.name);
            form.append('description', $scope.description);
            form.append('credits', $scope.credits);
            form.append('image', $scope.image);
            LibrarySvc.addImageCat($scope.category, form).success(function(data, status) {
                $scope.name = '';
                $scope.description = '';
                $scope.credits = '';
                $scope.image = '';
                angular.element('#library-form-add-image').val(null);
                if ($scope.source === 'own') {
                    $scope.source = 'cat';
                    $scope.selected_cat = $scope.category;
                } else if ($scope.source === 'cat' && $scope.selected_cat !== $scope.category) {
                    $scope.selected_cat = $scope.category;
                } else {
                    $scope.refreshLibrary();
                }
                $scope.category = -1;
                $scope.togglePopupAdd();
            }).error(function(data, status) {
                alert('image upload error : ' + data.error);
            });
        };
        $scope.updateImage = function() {
            if ($scope.tmpImage.name === '' || $scope.tmpImage.description === '' || $scope.tmpImage.librarycategory_id === -1) {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            LibrarySvc.updateImage($scope.tmpImage).success(function() {
                if ($scope.source === 'own') {
                    $scope.source = 'cat';
                    $scope.selected_cat = $scope.tmpImage.librarycategory_id;
                } else if ($scope.source === 'cat' && $scope.selected_cat !== $scope.tmpImage.librarycategory_id) {
                    $scope.selected_cat = $scope.tmpImage.librarycategory_id;
                } else {
                    $scope.refreshLibrary();
                }
                $scope.tmpImage = {};
                $scope.togglePopupEdit();
            });
        };
        $scope.importImage = function() {
            if ($scope.tmpImage.name === '' || $scope.tmpImage.description === '' || $scope.tmpImage.librarycategory_id === null) {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            LibrarySvc.importImage($scope.tmpImage).success(function() {
                $scope.source = 'cat';
                $scope.selected_cat = $scope.tmpImage.librarycategory_id;
                $scope.tmpImage = {};
                $scope.togglePopupImport();
            });
        };
        $scope.deleteImage = function(image_id) {
            if (confirm("Voulez-vous vraiment supprimer cette photo ?")) {
                LibrarySvc.deleteImage(image_id).success(function() {
                    $scope.refreshLibrary();
                });
            }
        };
        $scope.$watch('source', function(newval, oldval) {
            if (newval === 'own') {
                $scope.selected_cat = -1;
                $scope.library_title = 'Images des utilisateurs';
                $scope.refreshLibrary();
            } else {
                $scope.library_title = 'Selectionner une categorie';
                $scope.library = [];
            }
        });
        $scope.$watch('selected_cat', function(newval, oldval) {
            if ($scope.source === 'cat' && newval > -1) {
                $scope.library_title = '';
                $scope.refreshLibrary();
            } else if ($scope.source === 'cat' && newval === -1) {
                $scope.library_title = 'Selectionner une categorie';
                $scope.library = [];
            }
        });
    }
]);
FeaderAppControllers.controller('AdminCtrl.ModHome', ['$scope',
    function($scope) {
        $scope.home = {
            contact_button: true,
            feedback: 'plop',
            logo_region: 'images/region-haute-normandie.png',
            logo_prefet: 'images/prefet-haute-normandie.jpg',
            logo_europe: 'images/europe-feader.png',
            home_text: 'test',
            home_picture: 'images/demarche-reseau-rural-normand.jpg'
        };
        $scope.save = function() {
            alert('TODO: save');
        };
    }
]);
FeaderAppControllers.controller('AdminCtrl.ModEditor', ['$scope',
    function($scope) {

    }
]);
FeaderAppControllers.controller('AdminCtrl.ModHelp', ['$scope', 'AdminSvc', 'FaqSvc',
    function($scope, AdminSvc, FaqSvc) {
        $scope.faqList = [];
        $scope.ask = '';
        $scope.answer = '';
        $scope.tmpFaq = {};
        $scope.showAddPopup = false;
        $scope.showSheetPopup = false;
        $scope.toggleAddPopup = function() {
            $scope.ask = '';
            $scope.answer = '';
            $scope.showAddPopup = !$scope.showAddPopup;
        };
        $scope.toggleSheetPopup = function() {
            $scope.showSheetPopup = !$scope.showSheetPopup;
        };
        $scope.showFaqSheet = function(faq) {
            if (typeof faq !== 'undefined') {
                $scope.tmpFaq = faq;
            } else {
                $scope.tmpFaq = {};
            }
            $scope.toggleSheetPopup();
        };
        $scope.reload = function() {
            FaqSvc.getList().success(function(data) {
                $scope.faqList = data;
            }).error(function(data, status) {
                alert('Erreur de chargement des FAQ. (code: ' + status + ')');
            });
        };
        $scope.addFaq = function() {
            if ($scope.ask === '' || $scope.answer === '') {
                alert('Vous devez renseigner les deux champs.');
                return;
            }
            var tmpdata = {
                ask: $scope.ask,
                answer: $scope.answer
            };
            AdminSvc.addFaq(tmpdata).success(function(data, status) {
                $scope.reload();
                $scope.toggleAddPopup();
            }).error(function(data, status) {
                alert('Impossible d\'ajouter la FAQ.');
            });
        };
        
        $scope.editFaq = function() {
            if ($scope.tmpFaq.ask === '' || $scope.tmpFaq.answer === '') {
                alert('Vous devez renseigner les deux champs.');
                return;
            }
            var tmpdata = {
                ask: $scope.tmpFaq.ask,
                answer: $scope.tmpFaq.answer
            };
            AdminSvc.editFaq($scope.tmpFaq.id, tmpdata).success(function(data, status) {
                $scope.reload();
                $scope.toggleSheetPopup();
            }).error(function(data, status) {
                alert('Impossible de modifier la FAQ.');
            });
        };
        
        $scope.deleteFaq = function(faq) {
            if (confirm('Voulez-vous vraiment supprimer cette aide ?')) {
                AdminSvc.deleteFaq(faq.id).success(function() {
                   $scope.reload() ;
                }).error(function(data, status) {
                    alert('Impossible de supprimer cette aide');
                });
            }
        };
        
        
        
        $scope.reload();
    }
]);

