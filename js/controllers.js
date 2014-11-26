'use strict';
var FeaderAppControllers = angular.module('FeaderApp.Controllers', ['ngSanitize', 'naif.base64']);
FeaderAppControllers.controller('CommonCtrl.User', ['$scope', '$location', 'UserSvc',
    function ($scope, $location, UserSvc) {
        $scope.identifiant = '';
        $scope.passwd = '';
        $scope.loginInProgress = false;
        $scope.rememberMe = 'on';
        $scope.error = '';
        $scope.switchRememberMe = function () {
            if ($scope.rememberMe === 'on') {
                $scope.rememberMe = 'off';
            } else if ($scope.rememberMe === 'off') {
                $scope.rememberMe = 'on';
            }
        };
        $scope.isAtHome = function () {
            return ($location.path().split('/')[1] === 'plateforme' || $location.path().split('/')[1] === 'admin' || $location.path().split('/')[1] === 'denied') ? false : true;
        };
        $scope.login = function () {
            $scope.error = '';
            if ($scope.identifiant === '' || $scope.passwd === '') {
                return;
            }
            $scope.loginInProgress = true;
            var store = ($scope.rememberMe === 'on') ? true : false;
            UserSvc.Login($scope.identifiant, $scope.passwd, store,
                function (data, status) {
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
                function (data, status) {
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
        $scope.logout = function () {
            UserSvc.Logout(function () {
                $location.path('/home');
            });
        };
    }
]);
FeaderAppControllers.controller('CommonCtrl.Contact', ['$scope', 'ToolSvc', 'ApiSvc', 'UserSvc',
    function ($scope, ToolSvc, ApiSvc, UserSvc) {
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
        $scope.prepareFormLoggedUser = function () {
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
        $scope.contact = function () {
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
            if (!ToolSvc.isValidEmail($scope.contactInfos.email))   {
                $scope.showError('Le format de l\'adresse mail n\'est pas correct.');
                return;
            }
            ApiSvc.postContact($scope.contactInfos).success(function () {
                $scope.showSuccess("Nous avons bien en compte votre demande, nous vous recontacterons très rapidement. Le Réseau Rural Haut-Normand");
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
            }).error(function (data, status) {
                $scope.showError("Une erreur est survenue lors de l'envoi du mail. Merci de réessayer plus tard.")
            });
        };
        $scope.showError = function (message) {
            $scope.message.type = 'error';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.contactInProgress = false;
        };
        $scope.showSuccess = function (message) {
            $scope.message.type = 'success';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.contactInProgress = false;
        };
    }
]);
FeaderAppControllers.controller('CommonCtrl.LibraryCats', ['$scope', 'LibrarySvc',
    function ($scope, LibrarySvc) {
        $scope.error = '';
        $scope.cats = [];
        $scope.init = function () {
            $scope.cats = [];
            LibrarySvc.getCats().success(function (data) {
                $scope.cats = data.categories;
            }).error(function (data, status) {
                $scope.showError();
            });
        };
        $scope.showError = function () {
            $scope.error = 'Impossible de charger la liste des categories';
        };
    }
]);
FeaderAppControllers.controller('HomeCtrl.Home', ['$scope', '$location', 'UserSvc',
    function ($scope, $location, UserSvc) {
        $scope.goto = function (target) {
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
    function ($scope, UserSvc, ToolSvc) {
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
        $scope.create = function () {
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
                function (data, status) {
                    var msg =  'Votre compte a été créé avec succès. Validez votre compte en cliquant sur le lien que vous venez de recevoir par e-mail puis connectez-vous pour commencer votre premier livret (pensez à vérifier vos courriers indésirables).';
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
                function (data, status) {
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
        $scope.showError = function (message) {
            $scope.message.type = 'error';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.createInProgress = false;
        };
        $scope.showSuccess = function (message) {
            $scope.message.type = 'success';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.createInProgress = false;
        };
    }
]);
FeaderAppControllers.controller('AccountCtrl.Confirm', ['$scope', '$routeParams', 'UserSvc',
    function ($scope, $routeParams, UserSvc) {
        $scope.error = false;
        $scope.success = false;
        UserSvc.Confirm($routeParams.confirm_key).success(function (data) {
            $scope.success = true;
        }).error(function (data, status) {
            $scope.error = true;
        });
    }
]);
FeaderAppControllers.controller('AccountCtrl.ResetPasswd', ['$scope', 'UserSvc', 'ToolSvc',
    function ($scope, UserSvc, ToolSvc) {
        $scope.email = '';
        $scope.error = false;
        $scope.error_message = '';
        $scope.passwdChanged = false;
        $scope.resetInProgress = false;
        $scope.resetPasswd = function () {
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
            UserSvc.ResetPasswd($scope.email).success(function (data) {
                $scope.passwdChanged = true;
                $scope.resetInProgress = false;
            }).error(function (data, status) {
                $scope.resetInProgress = false;
                $scope.error = true;
                $scope.error_message = 'Cette adresse mail est inconnue.';
            });
        };
    }
]);
FeaderAppControllers.controller('AccountCtrl.Profil', ['$scope', 'UserSvc', 'ToolSvc',
    function ($scope, UserSvc, ToolSvc) {
        $scope.saveInProgress = false;
        $scope.userInfos = {
            name: UserSvc.getInfos().name,
            last_name: UserSvc.getInfos().last_name,
            first_name: UserSvc.getInfos().first_name,
            fonction: UserSvc.getInfos().fonction,
            phone: UserSvc.getInfos().phone,
            address: UserSvc.getInfos().address,
            username: UserSvc.getInfos().username,
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
        $scope.save = function () {
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
            UserSvc.ProfilUpdate($scope.userInfos).success(function (data) {
                $scope.showSuccess('Les modifications ont bien ete effectuees.');
            }).error(function (data, status) {
                $scope.showError('Impossible de sauvegarder vos nouvelles informations');
            });
        };
        $scope.showError = function (message) {
            $scope.message.type = 'error';
            $scope.message.text = message;
            $scope.message.show = true;
            $scope.saveInProgress = false;
            $scope.passwd2 = '';
        };
        $scope.showSuccess = function (message) {
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
    function ($scope, $routeParams, $location, BookletSvc) {
        $scope.newBookName = '';
        $scope.booklets = null;
        $scope.loading = false;
        $scope.selectedBooklet = false;
        if (typeof $routeParams.booklet_focus !== undefined) {
            $scope.selectedBooklet = parseInt($routeParams.booklet_focus);
        }
        $scope.error = '';
        $scope.reload = function () {
            $scope.loading = true;
            BookletSvc.getAll().success(function (data) {
                if (data.booklets !== false) {
                    $scope.booklets = data.booklets;
                    for (var booklet in $scope.booklets) {
                        $scope.booklets[booklet].folios = {};
                        if ($scope.booklets[booklet].ownFolio !== undefined) {
                            for (var folio in $scope.booklets[booklet].ownFolio) {
                                if ($scope.booklets[booklet].ownFolio[folio].type in {
                                        'territoire1': null,
                                        'territoire2': null,
                                        'territoire3': null
                                    }) {
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
        $scope.createBooklet = function () {
            $scope.error = '';
            if ($scope.newBookName.length === 0) {
                $scope.error = 'Vous devez saisir un nom de livret';
                return;
            }
            BookletSvc.create($scope.newBookName).success(function (data) {
                $scope.newBookName = '';
                $scope.selectedBooklet = data.booklet_id;
                $scope.reload();
            }).error(function (data, status) {
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
        $scope.selectBooklet = function (booklet_id) {
            if ($scope.selectedBooklet === booklet_id) {
                $scope.selectedBooklet = false;
            } else {
                $scope.selectedBooklet = booklet_id;
            }
        };
        $scope.duplicateBooklet = function (booklet_id) {
            BookletSvc.duplicate(booklet_id).success(function (data) {
                $scope.selectedBooklet = data.booklet_id;
                $scope.reload();
            });
        };
        $scope.deleteBooklet = function (booklet_id) {
            if (confirm("Êtes-vous sur de vouloir supprimer ce livret ?")) {
                BookletSvc.delete(booklet_id).success(function () {
                    if ($scope.selectedBooklet === booklet_id) {
                        $scope.selectedBooklet = false;
                    }
                    $scope.reload();
                });
            }
        };
        $scope.createFolio = function (booklet_id, folio_type) {
            switch (folio_type) {
                case 'territoire':
                    $location.path('/plateforme/booklet/' + booklet_id + '/folio2choice');
                    break;
                default:
                    BookletSvc.createFolio(booklet_id, folio_type).success(function (data) {
                        $scope.editFolio(booklet_id, data.folio_id);
                    }).error(function (data, status) {
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
        $scope.editFolio = function (booklet_id, folio_id) {
            $location.path('/plateforme/booklet/' + booklet_id + '/folio/' + folio_id);
        };
        $scope.reload();
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Folio', ['$scope', '$routeParams', '$rootScope', '$location', '$sce', 'BookletSvc', 'UserSvc',
    function ($scope, $routeParams, $rootScope, $location, $sce, BookletSvc, UserSvc) {
        $scope.logout = function () {
            if ($scope.updatedFolio === true) {
                if (confirm('Attention les modifications non enregistrées seront perdues')) {
                    $scope.updatedFolio = false;
                    UserSvc.Logout(function () {
                        $location.path('/home');
                    });
                }
            } else {
                UserSvc.Logout(function () {
                    $location.path('/home');
                });
            }
        };
        $scope.showPictureSelector = false;
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
        BookletSvc.get($scope.booklet_id).success(function (data) {
            $scope.booklet = data.booklet;
        });
        BookletSvc.getFolio($scope.booklet_id, $scope.folio_id).success(function (data) {
            $scope.folio = data.folio[0];
        });
        BookletSvc.getTemplates().success(function (data) {
            $scope.templates = data;
        });
        $scope.selectPage = function (page_index) {
            $('.ng-editable-toolbox:not(#ng-editable-toolbox)').remove();
            $scope.selected_page = page_index;
        };
        $scope.getFolioContent = function () {
            return $sce.trustAsHtml($scope.folio.ownPage[$scope.selected_page].content);
        };
        $scope.clearPlugins = function (content) {
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
            content.find('.ng-date-select').children('.ng-editable-marker').remove();
            content.find('.ng-date-ferie-select-close').remove();
            content.find('.ng-date-vac-select-close').remove();
            return content;
        };
        $scope.updateModel = function () {
            $scope.updatedFolio = true;
            $scope.imageSelected = null;
            var content = $('#drawboard').clone();
            content = $scope.clearPlugins(content);
            $scope.folio.ownPage[$scope.selected_page].content = content.html();
        };
        $scope.buildFolio = function (container) {
            // backup header and footer
            var header = $scope.clearPlugins(container.find('.page-header').clone());
            var footer = $scope.clearPlugins(container.find('.page-footer').clone());
            // backup container attrs
            var container_attrs = container.prop('attributes');
            // concat all html pages
            var full_content = $('<div/>');
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
            // init future pages
            var order = 1;
            var pages = [{
                folio_id: $scope.folio_id,
                order: 1,
                content: ''
            }];
            // init need page creation
            var need_new_page = false;
            // init entry counter
            var entry_count = 0;
            // create future content
            var content = $('<div/>');
            // add container attributes
            $.each(container_attrs, function () {
                content.attr(this.name, this.value);
            });
            // add header to content
            content.append(header);
            // create future category content
            var cat_content = '';
            var last_cat_title = -42;
            // parse all cats in content
            full_content.find('.ng-clone-cat').each(function (index) {
                // backups category header
                var cat_header = $(this).clone();
                cat_header.find('.ng-clone-orga').remove();
                // check if new category (by title)
                if (last_cat_title != $.trim($(this).find('.block-locale').find('h4').text())) {
                    // insert previous category in content
                    if (last_cat_title !== -42 && cat_content.find('.block-locale').find('.ng-clone-orga').length > 0) {
                        content.append(cat_content.clone());
                    }
                    // init new category content
                    cat_content = cat_header.clone();
                    last_cat_title = $.trim($(this).find('.block-locale').find('h4').text());
                }
                // boucle sur les organismes de cette category
                $(this).find('.ng-clone-orga').each(function (index_orga) {
                    if (need_new_page) {
                        // create page
                        order++;
                        pages.push({
                            folio_id: $scope.folio_id,
                            order: order,
                            content: ''
                        });
                        need_new_page = false;
                    }
                    // add cat content
                    cat_content.find('.block-locale').append($(this).clone());
                    entry_count++;
                    // max number item
                    if (entry_count === 6) {
                        // add category to current content
                        content.append(cat_content.clone());
                        // add footer to content
                        content.append(footer.clone().css('margin-top', '14%'));
                        // save page
                        pages[pages.length - 1].content = content.clone().prop('outerHTML');
                        need_new_page = true;
                        // init new content
                        content.html('');
                        content.append(header);
                        // restart with current category (empty organismes)
                        cat_content = cat_header.clone();
                        // reset entry count
                        entry_count = 0;
                    }
                });
            });
            if (!need_new_page) {
                content.append(cat_content.clone());
                var marginTop = '14%';
                switch (entry_count) {
                    case 1:
                        marginTop = '98%';
                        break;
                    case 2:
                        marginTop = '81%';
                        break;
                    case 3:
                        marginTop = '64%';
                        break;
                    case 4:
                        marginTop = '47%';
                        break;
                    case 5:
                        marginTop = '29%';
                        break;
                }
                content.append(footer.clone().css('margin-top', marginTop));
                pages[pages.length - 1].content = content.clone().prop('outerHTML');
            }

            $scope.$apply(function () {
                $scope.folio.ownPage = pages;
                if ($scope.selected_page >= $scope.folio.ownPage.length) {
                    // last page deletion
                    $scope.selected_page = $scope.folio.ownPage.length - 1;
                }
            });
        };
        $scope.save = function (callback) {
            $scope.updateModel();
            BookletSvc.updateFolio($scope.booklet.id, $scope.folio.id, $scope.folio.ownPage).success(function (data) {
                if (typeof callback === 'function') {
                    $scope.updatedFolio = false;
                    callback();
                }
            }).error(function (data, status) {
                alert('Erreur de sauvegarde (' + status + ')');
            });
        };
        $scope.saveAndStay = function () {
            $scope.save(function () {
                alert('Sauvegarde effectuée');
            });
        };
        $scope.saveAndLeave = function () {
            $scope.save(function () {
                $location.path('/plateforme/booklets/' + $scope.booklet.id);
            });
        };
        $scope.togglePictureSelect = function () {
            $scope.showPictureSelector = !$scope.showPictureSelector;
        };
        $scope.selectImage = function (filename, source) {
            if (source === 'own')
                $scope.imageSelected = 'images/uploaded/' + filename;
            else if (source === 'fixed')
                $scope.imageSelected = filename;
            else
                $scope.imageSelected = 'images/library/' + filename
            $scope.showPictureSelector = false;
        };
        $scope.toggleHelp = function () {
            $scope.showHelp = !$scope.showHelp;
        };
        $scope.toggleFullScreen = function () {
            angular.element('.ng-editable-toolbox:not(#ng-editable-toolbox)').remove();
            $rootScope.layout.showFullscreen = !$rootScope.layout.showFullscreen;
        };
        $scope.exportPDF = function (highresolution) {
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
        $scope.$on('$locationChangeStart', function (event, next, current) {
            if ($scope.updatedFolio === true) {
                if (!confirm('Attention les modifications non enregistrées seront perdues')) {
                    event.preventDefault();
                }
            }
            $rootScope.layout.showFullscreen = false;
        });
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Folio2Choice', ['$scope', '$routeParams', '$location', 'BookletSvc',
    function ($scope, $routeParams, $location, BookletSvc) {
        $scope.booklet_id = $routeParams.booklet_id;
        $scope.template = null;
        $scope.showHelp = false;
        $scope.editFolio = function (folio_id) {
            $location.path('/plateforme/booklet/' + $scope.booklet_id + '/folio/' + folio_id);
        };
        $scope.makeChoice = function (template_name) {
            if (confirm('Attention, ce choix est définitif, vous ne pourrez plus changer de modèle après avoir commencé la mise en page. Lisez la suite pour savoir comment choisir le modèle plus adapté. Nous vous conseillons de copier votre livret avant de procéder à votre sélection.')) {
                $scope.template = template_name;
                $scope.confirmChoiceNext();
            }

        };
        $scope.confirmChoiceNext = function () {
            if ($scope.template === null) {
                alert('Vous devez selectionner un modele');
            } else {
                BookletSvc.createFolio($scope.booklet_id, $scope.template).success(function (data) {
                    $scope.editFolio(data.folio_id);
                });
            }
        };
        $scope.confirmChoiceReturn = function () {
            if ($scope.template === null) {
                alert('Vous devez selectionner un modele');
            } else {
                BookletSvc.createFolio($scope.booklet_id, $scope.template).success(function (data) {
                    $location.path('/plateforme/booklets');
                });
            }
        };
        $scope.gotoBooklets = function () {
            $location.path('/plateforme/booklets/' + $scope.booklet_id);
        };
        $scope.toggleHelp = function () {
            $scope.showHelp = !$scope.showHelp;
        };
    }
]);
/*
 * 
 * CONTROLLER BACKOFFICE LIBRARY
 * 
 */
FeaderAppControllers.controller('BackofficeCtrl.Library', ['$scope', 'LibrarySvc',
    function ($scope, LibrarySvc) {
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

        $scope.initPictureSelect = function () {
            $scope.source = 'cat';
            $scope.library_title = 'Selectionner une categorie';
            $scope.selected_cat = -1;
            $scope.library = [];
            $scope.refreshLibrary();
        };
        $scope.numberOfPages = function () {
            if ($scope.library === null || $scope.library.length === 0) {
                return 0;
            }
            return Math.ceil($scope.library.length / $scope.pageSize);
        };
        $scope.togglePopupAdd = function () {
            $scope.showPopupAdd = !$scope.showPopupAdd;
        };
        $scope.togglePopupEdit = function (image) {
            if (typeof image !== 'undefined') {
                $scope.tmpImage = image;
            } else {
                $scope.tmpImage = {};
            }
            $scope.showPopupEdit = !$scope.showPopupEdit;
        };
        $scope.selectCat = function (cat_id) {
            if (typeof cat_id === 'undefined') {
                $scope.selected_cat = -1;
            } else {
                $scope.selected_cat = cat_id;
            }
        };
        $scope.refreshLibrary = function () {
            $scope.library = [];
            $scope.refreshLibraryCategories();
            if ($scope.source === 'own') {
                LibrarySvc.getImages().success(function (data) {
                    $scope.library = data.library;
                });
            } else if ($scope.source === 'cat' && $scope.selected_cat > -1) {
                LibrarySvc.getImagesByCat($scope.selected_cat).success(function (data) {
                    $scope.library_title = data.name;
                    $scope.library = data.library;
                });
            }

        };
        $scope.refreshLibraryCategories = function () {
            $scope.categories = [];
            LibrarySvc.getCats().success(function (data) {
                $scope.categories = data.categories;
            });
        };
        $scope.setFile = function (element) {
            if (element.files[0].size > 5000000) {
                alert('Le fichier est trop volumineux. Poids accepté : jusqu\'à 5 mégas.');
                angular.element('#library-form-add-image').val(null);
            } else {
                $scope.image = element.files[0];
            }
        };
        $scope.startUpload = function () {
            if ($scope.name === '' || $scope.description === '' || $scope.image === '') {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            var form = new FormData();
            form.append('name', $scope.name);
            form.append('description', $scope.description);
            form.append('credits', $scope.credits);
            form.append('image', $scope.image);
            LibrarySvc.addImage(form).success(function (data, status) {
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
            }).error(function (data, status) {
                alert('image upload error : ' + data.error);
            });
        };
        $scope.updateImage = function () {
            if ($scope.tmpImage.name === '' || $scope.tmpImage.description === '') {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            LibrarySvc.updateImage($scope.tmpImage).success(function () {
                if ($scope.source === 'own') {
                    $scope.refreshLibrary();
                } else {
                    $scope.source = 'own';
                }
                $scope.tmpImage = {};
                $scope.togglePopupEdit();
            });
        };
        $scope.deleteImage = function (image_id) {
            if (confirm("Voulez-vous vraiment supprimer cette photo ?")) {
                LibrarySvc.deleteImage(image_id).success(function () {
                    $scope.refreshLibrary();
                });
            }
        };
        $scope.$watch('source', function (newval, oldval) {
            if (newval === 'own') {
                $scope.selected_cat = -1;
                $scope.library_title = 'Mes images';
                $scope.refreshLibrary();
            } else {
                $scope.library_title = 'Selectionner une categorie';
                $scope.library = [];
            }
        });
        $scope.$watch('selected_cat', function (newval, oldval) {
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
    function ($scope, LibrarySvc) {
        $scope.library = null;
        $scope.refreshLibrary = function () {
            LibrarySvc.getImages().success(function (data) {
                $scope.library = data.library;
            });
        };
        $scope.selectNo
        $scope.refreshLibrary();
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Help', ['$scope', 'FaqSvc',
    function ($scope, FaqSvc) {
        $scope.faqList = [];
        $scope.faqFilter = '';
        $scope.reload = function () {
            FaqSvc.getList().success(function (data) {
                $scope.faqList = data;
            }).error(function (data, status) {
                alert('Impossible de charger les FAQ (erreur: ' + status + ')');
            });
        };
        $scope.reload();
    }
]);
FeaderAppControllers.controller('BackofficeCtrl.Contact', ['$scope',
    function ($scope) {

    }
]);
FeaderAppControllers.controller('AdminCtrl.Stats', ['$scope', 'AdminSvc',
    function ($scope, AdminSvc) {
        $scope.stats = {
            users_confirmed: 0,
            users_not_confirmed: 0,
            booklets: 0,
            pictures: 0
        };
        $scope.reloadStats = function () {
            AdminSvc.getStats().success(function (data) {
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
    function ($scope, AdminSvc) {
        $scope.Users = [];
        $scope.userOrderBy = 'last_name';
        $scope.userFilter = '';
        $scope.showSheet = false;
        $scope.selectedUser = -1;
        $scope.changeOrder = function (field) {
            if ($scope.userOrderBy === field) {
                $scope.userOrderBy = '-' + field;
            } else if ($scope.userOrderBy === ('-' + field)) {
                $scope.userOrderBy = field;
            } else {
                $scope.userOrderBy = field;
            }
        };
        $scope.toggleSheet = function () {
            $scope.showSheet = !$scope.showSheet;
        };
        $scope.showUserSheet = function (user) {
            $scope.selectedUser = $scope.Users.indexOf(user);
            $scope.toggleSheet();
        };
        $scope.deleteUser = function (user) {
            if (confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) {
                AdminSvc.deleteUser(user.id).success(function (data) {
                    $scope.Users.splice($scope.Users.indexOf(user), 1);
                }).error(function (data, status) {
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
        $scope.reload = function () {
            AdminSvc.getUserList()
                .success(function (data) {
                    $scope.Users = data;
                })
                .error(function (data, status) {

                });
        };
        $scope.export = function () {
            var csvContent = "Nom,Prenom,Email,Fonction,Telephone,Adresse,Code postal,Ville,Date d\'inscription,Date derniere connexion,CGU\n";
            $scope.Users.forEach(function (user, index) {
                csvContent += user.last_name + ', ';
                csvContent += user.first_name + ', ';
                csvContent += user.username + ', ';
                csvContent += user.function + ', ';
                csvContent += user.phone + ', ';
                csvContent += user.address + ', ';
                csvContent += user.cp + ', ';
                csvContent += user.city + ', ';
                csvContent += user.date_create + ', ';
                csvContent += user.date_last_connect + ', ';
                csvContent += user.cgu_accepted + ', ';
                csvContent += "\n";
            });
//            var encodedUri = encodeURI(csvContent);
            var encodedUri = unescape(encodeURIComponent(csvContent));
            var blob = new Blob([encodedUri], {type: "text/csv;charset=utf-8"});
            saveAs(blob, "utilisateurs.csv");

//            AdminSvc.exportUsers().success(function(data) {
//                window.location = 'data:application/vnd.ms-excel;base64,' + window.btoa(unescape(encodeURIComponent(data)));
//            });
        };
        $scope.reload();
    }
]);
FeaderAppControllers.controller('AdminCtrl.Library', ['$scope', 'LibrarySvc',
    function ($scope, LibrarySvc) {
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
        $scope.numberOfPages = function () {
            if ($scope.library === null || $scope.library.length === 0) {
                return 0;
            }
            return Math.ceil($scope.library.length / $scope.pageSize);
        };
        $scope.togglePopupAdd = function () {
            $scope.showPopupAdd = !$scope.showPopupAdd;
        };
        $scope.togglePopupEdit = function (image) {
            if (typeof image !== 'undefined') {
                $scope.tmpImage = image;
            } else {
                $scope.tmpImage = {};
            }
            $scope.showPopupEdit = !$scope.showPopupEdit;
        };
        $scope.togglePopupImport = function (image) {
            if (typeof image !== 'undefined') {
                $scope.tmpImage = image;
            } else {
                $scope.tmpImage = {};
            }
            $scope.showPopupImport = !$scope.showPopupImport;
        };
        $scope.selectCat = function (cat_id) {
            if (typeof cat_id === 'undefined') {
                $scope.selected_cat = -1;
            } else {
                $scope.selected_cat = cat_id;
            }
        };
        $scope.refreshLibrary = function () {
            $scope.library = [];
            $scope.refreshLibraryCategories();
            if ($scope.source === 'own') {
                LibrarySvc.getAllImages().success(function (data) {
                    $scope.library = data.library;
                });
            } else if ($scope.source === 'cat' && $scope.selected_cat > -1) {
                LibrarySvc.getImagesByCat($scope.selected_cat).success(function (data) {
                    $scope.library_title = data.name;
                    $scope.library = data.library;
                });
            }
        };
        $scope.refreshLibraryCategories = function () {
            $scope.categories = [];
            LibrarySvc.getCats().success(function (data) {
                $scope.categories = data.categories;
            });
        };
        $scope.setFile = function (element) {
            if (element.files[0].size > 5000000) {
                alert('Le fichier est trop volumineux.');
                angular.element('#library-form-add-image').val(null);
            } else {
                $scope.image = element.files[0];
            }
        };
        $scope.startUpload = function () {
            if ($scope.name === '' || $scope.description === '' || $scope.image === '' || $scope.category === -1) {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            var form = new FormData();
            form.append('name', $scope.name);
            form.append('description', $scope.description);
            form.append('credits', $scope.credits);
            form.append('image', $scope.image);
            LibrarySvc.addImageCat($scope.category, form).success(function (data, status) {
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
            }).error(function (data, status) {
                alert('image upload error : ' + data.error);
            });
        };
        $scope.updateImage = function () {
            if ($scope.tmpImage.name === '' || $scope.tmpImage.description === '' || $scope.tmpImage.librarycategory_id === -1) {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            LibrarySvc.updateImage($scope.tmpImage).success(function () {
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
        $scope.importImage = function () {
            if ($scope.tmpImage.name === '' || $scope.tmpImage.description === '' || $scope.tmpImage.librarycategory_id === null) {
                alert('Vous devez renseigner les informations de la photo.');
                return;
            }
            LibrarySvc.importImage($scope.tmpImage).success(function () {
                $scope.source = 'cat';
                $scope.selected_cat = $scope.tmpImage.librarycategory_id;
                $scope.tmpImage = {};
                $scope.togglePopupImport();
            });
        };
        $scope.deleteImage = function (image_id) {
            if (confirm("Voulez-vous vraiment supprimer cette photo ?")) {
                LibrarySvc.deleteImage(image_id).success(function () {
                    $scope.refreshLibrary();
                });
            }
        };
        $scope.$watch('source', function (newval, oldval) {
            if (newval === 'own') {
                $scope.selected_cat = -1;
                $scope.library_title = 'Images des utilisateurs';
                $scope.refreshLibrary();
            } else {
                $scope.library_title = 'Selectionner une categorie';
                $scope.library = [];
            }
        });
        $scope.$watch('selected_cat', function (newval, oldval) {
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
FeaderAppControllers.controller('AdminCtrl.ModHome', ['$rootScope', '$scope', 'ApiSvc',
    function ($rootScope, $scope, ApiSvc) {
        //$scope.home = {
        //    home_text: 'test',
        //    home_picture: 'images/demarche-reseau-rural-normand.jpg'
        //};
        $scope.home = {};
        ApiSvc.getParam().success(function (params) {
            $.each(params, function(k, param) {
                var val = param.value;
                try {
                    val = JSON.parse(val);
                } catch (e) {}
                $scope.home[param.key] = val;
            })
        });
        $scope.home.logo_region = {};


        $scope.save = function () {
            var count = 0;
            $.each($scope.home, function(key, val) {
                if (val !== $rootScope.layout.param[key]) {
                    count++;
                    ApiSvc.putParam(key, {value: JSON.stringify(val)}).success(function() {
                        $rootScope.layout.param[key] = val;
                        if (--count === 0) {
                            alert("Sauvegarde effectuée");
                        }
                    }).error(function() {
                        alert("Une erreur est survenue lors de la sauvegarde du paramètre " + key);
                    });
                }
            })
        };
    }
]);
FeaderAppControllers.controller('AdminCtrl.ModEditor', ['$scope', 'BookletSvc', 'AdminSvc',
    function ($scope, BookletSvc, AdminSvc) {
        $scope.templates = [];
        $scope.tmpTpl = {};
        $scope.showHelpPopup = false;
        $scope.showHelp = function (tpl) {
            $scope.tmpTpl = tpl;
            $scope.toggleHelpPopup();
        };
        $scope.toggleHelpPopup = function () {
            $scope.showHelpPopup = !$scope.showHelpPopup;
        };
        $scope.reload = function () {
            BookletSvc.getTemplates().success(function (data) {
                $scope.templates = data;
            }).error(function (data, status) {
                alert('Impossible de charger les modeles de folio (Erreur: ' + status + ')');
            });
        };
        $scope.editHelp = function () {
            if ($scope.tmpTpl.helpintro === '' || $scope.tmpTpl.helptext === '') {
                alert('Vous devez saisir une introduction et une explication complete');
                return;
            }
            var tmpData = {
                intro: $scope.tmpTpl.helpintro,
                text: $scope.tmpTpl.helptext
            };
            AdminSvc.editTemplateHelp($scope.tmpTpl.id, tmpData).success(function () {
                $scope.tmpTpl = {};
                $scope.toggleHelpPopup();
            }).error(function (data, status) {
                alert('Impossible de sauvegarder l\'aide de ce modele.');
            });
        };
        $scope.reload();
    }
]);
FeaderAppControllers.controller('AdminCtrl.ModHelp', ['$scope', 'AdminSvc', 'FaqSvc',
    function ($scope, AdminSvc, FaqSvc) {
        $scope.faqList = [];
        $scope.ask = '';
        $scope.answer = '';
        $scope.tmpFaq = {};
        $scope.showAddPopup = false;
        $scope.showSheetPopup = false;
        $scope.toggleAddPopup = function () {
            $scope.ask = '';
            $scope.answer = '';
            $scope.showAddPopup = !$scope.showAddPopup;
        };
        $scope.toggleSheetPopup = function () {
            $scope.showSheetPopup = !$scope.showSheetPopup;
        };
        $scope.showFaqSheet = function (faq) {
            if (typeof faq !== 'undefined') {
                $scope.tmpFaq = faq;
            } else {
                $scope.tmpFaq = {};
            }
            $scope.toggleSheetPopup();
        };
        $scope.reload = function () {
            FaqSvc.getList().success(function (data) {
                $scope.faqList = data;
            }).error(function (data, status) {
                alert('Erreur de chargement des FAQ. (code: ' + status + ')');
            });
        };
        $scope.addFaq = function () {
            if ($scope.ask === '' || $scope.answer === '') {
                alert('Vous devez renseigner les deux champs.');
                return;
            }
            var tmpdata = {
                ask: $scope.ask,
                answer: $scope.answer
            };
            AdminSvc.addFaq(tmpdata).success(function (data, status) {
                $scope.reload();
                $scope.toggleAddPopup();
            }).error(function (data, status) {
                alert('Impossible d\'ajouter la FAQ.');
            });
        };
        $scope.editFaq = function () {
            if ($scope.tmpFaq.ask === '' || $scope.tmpFaq.answer === '') {
                alert('Vous devez renseigner les deux champs.');
                return;
            }
            var tmpdata = {
                ask: $scope.tmpFaq.ask,
                answer: $scope.tmpFaq.answer
            };
            AdminSvc.editFaq($scope.tmpFaq.id, tmpdata).success(function (data, status) {
                $scope.reload();
                $scope.toggleSheetPopup();
            }).error(function (data, status) {
                alert('Impossible de modifier la FAQ.');
            });
        };
        $scope.deleteFaq = function (faq) {
            if (confirm('Voulez-vous vraiment supprimer cette aide ?')) {
                AdminSvc.deleteFaq(faq.id).success(function () {
                    $scope.reload();
                }).error(function (data, status) {
                    alert('Impossible de supprimer cette aide');
                });
            }
        };
        $scope.reload();
    }
]);

