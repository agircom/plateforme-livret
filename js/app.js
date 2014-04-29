'use strict';

(function() {

    var appRoutes = {
        '/mentionslegales': {
            templateUrl: 'partials/common/mentionslegales.html',
            controller: 'HomeCtrl.Home',
            requireMenu: false,
            requireLogin: false
        },
        '/sitemap': {
            templateUrl: 'partials/common/sitemap.html',
            controller: 'HomeCtrl.Home',
            requireMenu: false,
            requireLogin: false
        },
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
            requireLogin: false
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
            requireAccess: [1, 2]
        },
        '/plateforme/booklets/:booklet_focus': {
            templateUrl: 'partials/backoffice/booklets.html',
            controller: 'BackofficeCtrl.Booklets',
            requireMenu: true,
            requireLogin: true,
            requireAccess: [1, 2]
        },
        '/plateforme/booklet/:booklet_id/folio/:folio_id': {
            templateUrl: 'partials/backoffice/folio.html',
            controller: 'BackofficeCtrl.Folio',
            requireMenu: true,
            requireLogin: true,
            requireAccess: [1, 2]
        },
        '/plateforme/booklet/:booklet_id/folio2choice': {
            templateUrl: 'partials/backoffice/folio2choice.html',
            controller: 'BackofficeCtrl.Folio2Choice',
            requireMenu: true,
            requireLogin: true,
            requireAccess: [1, 2]
        },
        '/plateforme/account': {
            templateUrl: 'partials/account/profil.html',
            controller: 'AccountCtrl.Profil',
            requireMenu: true,
            requireLogin: true,
            requireAccess: [1, 2]
        },
        '/plateforme/library': {
            templateUrl: 'partials/backoffice/library.html',
            controller: 'BackofficeCtrl.Library',
            requireMenu: true,
            requireLogin: true,
            requireAccess: [1, 2]
        },
        '/plateforme/help': {
            templateUrl: 'partials/backoffice/help.html',
            controller: 'BackofficeCtrl.Help',
            requireMenu: true,
            requireLogin: true,
            requireAccess: [1, 2]
        },
        '/plateforme/contact': {
            templateUrl: 'partials/backoffice/contact.html',
            controller: 'BackofficeCtrl.Contact',
            requireMenu: true,
            requireLogin: true,
            requireAccess: [1, 2]
        }
    };

    var FeaderApp = angular.module('FeaderApp', [
        'ngRoute',
        'ngSanitize',
        'ui.draggable',
        'FeaderApp.Controllers',
        'FeaderApp.Directives',
        'FeaderApp.Services'
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

    FeaderApp.run(['$rootScope', '$location', 'UserSvc',
        function($rootScope, $location, UserSvc) {

            $rootScope.layout = {
                requireMenu: false
            };

            UserSvc.restoreSession();
            $rootScope.User = UserSvc;

            $rootScope.$on('$routeChangeStart', function(event, next, current) {
                if (next.requireLogin && !UserSvc.isLogged()) {
                    $rootScope.layout.requireMenu = false;
                    $location.path('/home');
                } else {
                    if (next.requireMenu) {
                        $rootScope.layout.requireMenu = true;
                    } else {
                        $rootScope.layout.requireMenu = false;
                    }
                }
            });

        }
    ]);

})();