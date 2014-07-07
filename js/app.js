'use strict';

(function() {

    var appRoutes = {
        '/denied': {
            templateUrl: 'partials/common/denied.html',
            controller: 'HomeCtrl.Home',
            requireMenu: false,
            requireLogin: false
        },
        '/mentionslegales': {
            templateUrl: 'partials/common/mentionslegales.html',
            controller: 'HomeCtrl.Home',
            requireMenu: false,
            requireLogin: false
        },
//        '/sitemap': {
//            templateUrl: 'partials/common/sitemap.html',
//            controller: 'HomeCtrl.Home',
//            requireMenu: false,
//            requireLogin: false
//        },
        '/contact': {
            templateUrl: 'partials/common/contact.html',
            controller: 'CommonCtrl.Contact',
            requireMenu: false,
            requireLogin: false
        },
        '/home': {
            templateUrl: 'partials/home/home.html',
            controller: 'HomeCtrl.Home',
            requireMenu: false,
            requireLogin: false
        },
        '/home/rrhn': {
            templateUrl: 'partials/home/reseauhautnormand.html',
            controller: 'HomeCtrl.Home',
            requireMenu: false,
            requireLogin: false
        },
        '/account/create': {
            templateUrl: 'partials/account/create.html',
            controller: 'AccountCtrl.Create',
            requireMenu: false,
            requireLogin: false,
            requireAccess: 0
        },
        '/account/resetpasswd': {
            templateUrl: 'partials/account/reset-passwd.html',
            controller: 'AccountCtrl.ResetPasswd',
            requireMenu: false,
            requireLogin: false
        },
        '/account/confirm/:confirm_key': {
            templateUrl: 'partials/account/confirm.html',
            controller: 'AccountCtrl.Confirm',
            requireMenu: false,
            requireLogin: false
        },
        '/plateforme': {
            redirectTo: '/plateforme/booklets'
        },
        '/plateforme/booklets': {
            templateUrl: 'partials/backoffice/booklets.html',
            controller: 'BackofficeCtrl.Booklets',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 1
        },
        '/plateforme/booklets/:booklet_focus': {
            templateUrl: 'partials/backoffice/booklets.html',
            controller: 'BackofficeCtrl.Booklets',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 1
        },
        '/plateforme/booklet/:booklet_id/folio/:folio_id': {
            templateUrl: 'partials/backoffice/folio.html',
            controller: 'BackofficeCtrl.Folio',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 1,
            requireToolbar: true
        },
        '/plateforme/booklet/:booklet_id/folio2choice': {
            templateUrl: 'partials/backoffice/folio2choice.html',
            controller: 'BackofficeCtrl.Folio2Choice',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 1
        },
        '/plateforme/account': {
            templateUrl: 'partials/account/profil.html',
            controller: 'AccountCtrl.Profil',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 1
        },
        '/plateforme/library': {
            templateUrl: 'partials/backoffice/library.html',
            controller: 'BackofficeCtrl.Library',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 1
        },
        '/plateforme/help': {
            templateUrl: 'partials/backoffice/help.html',
            controller: 'BackofficeCtrl.Help',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 1
        },
        '/plateforme/contact': {
            templateUrl: 'partials/common/contact.html',
            controller: 'CommonCtrl.Contact',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 1
        },
        '/admin': {
            redirectTo: '/admin/stats'
        },
        '/admin/stats': {
            templateUrl: 'partials/admin/stats.html',
            controller: 'AdminCtrl.Stats',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 2
        },
        '/admin/users': {
            templateUrl: 'partials/admin/users.html',
            controller: 'AdminCtrl.Users',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 2
        },
        '/admin/library': {
            templateUrl: 'partials/admin/library.html',
            controller: 'AdminCtrl.Library',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 2
        },
        '/admin/mod_home': {
            templateUrl: 'partials/admin/mod-home.html',
            controller: 'AdminCtrl.ModHome',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 2
        },
        '/admin/mod_editor': {
            templateUrl: 'partials/admin/mod-editor.html',
            controller: 'AdminCtrl.ModEditor',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 2
        },
        '/admin/mod_help': {
            templateUrl: 'partials/admin/mod-help.html',
            controller: 'AdminCtrl.ModHelp',
            requireMenu: true,
            requireLogin: true,
            requireAccess: 2
        }
    };

    var FeaderApp = angular.module('FeaderApp', [
        'ngRoute',
        'ngSanitize',
        'FeaderApp.Controllers',
        'FeaderApp.Directives',
        'FeaderApp.Services',
        'FeaderApp.Filters'
    ]);



    FeaderApp.config(['$routeProvider', '$logProvider',
        function($routeProvider, $logProvider) {
            for (var path in appRoutes) {
                $routeProvider.when(path, appRoutes[path]);
            }
            $routeProvider.otherwise({redirectTo: '/home'});
            $logProvider.debugEnabled(true);
        }
    ]);

    FeaderApp.run(['$rootScope', '$location', 'UserSvc', 'browser',
        function($rootScope, $location, UserSvc, browser) {

            $rootScope.layout = {
                requireMenu: false,
                showTooltips: false,
                needFolioToolbar: false,
                menuShow: true,
                crossBrowser: browser()
            };

            UserSvc.restoreSession();
            $rootScope.User = UserSvc;
            
            $rootScope.toggleShowMenu = function() {
                $rootScope.layout.menuShow = !$rootScope.layout.menuShow;
            };
            
            $rootScope.$on('$routeChangeStart', function(event, next, current) {
                if (next.requireLogin && !UserSvc.isLogged()) {
                    $rootScope.layout.requireMenu = false;
                    $location.path('/home');
                } else if (typeof next.requireAccess !== 'undefined' && next.requireAccess !== UserSvc.getPermissions()) {
                    $location.path('/denied').replace();
                } else {
                    if (next.requireMenu) {
                        $rootScope.layout.requireMenu = true;
                    } else {
                        $rootScope.layout.requireMenu = false;
                    }
                    if (next.requireToolbar) {
                        $rootScope.layout.needFolioToolbar = true;
                    } else {
                        $rootScope.layout.needFolioToolbar = false;
                    }
                }
            });

        }
    ]);

})();