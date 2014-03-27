'use strict';

(function() {

    var appRoutes = {
        '/home': {
            templateUrl: 'partials/home/home.html',
            controller: 'HomeCtrl.Home',
            requireMenu: false,
            requireLogin: false
        },
        '/plateforme': {
            templateUrl: 'partials/backoffice/home.html',
            controller: 'BackofficeCtrl.Home',
            requireMenu: true,
            requireLogin: true,
            requireAccess: [1, 2]
        },
        '/plateforme/booklets': {
            templateUrl: 'partials/backoffice/booklets.html',
            controller: 'BackofficeCtrl.Booklets',
            requireMenu: true,
            requireLogin: false,
            requireAccess: [1, 2]
        },
        '/plateforme/account': {
            templateUrl: 'partials/backoffice/account.html',
            controller: 'BackofficeCtrl.Account',
            requireMenu: true,
            requireLogin: false,
            requireAccess: [1, 2]
        },
        '/plateforme/library': {
            templateUrl: 'partials/backoffice/library.html',
            controller: 'BackofficeCtrl.Library',
            requireMenu: true,
            requireLogin: false,
            requireAccess: [1, 2]
        },
        '/plateforme/help': {
            templateUrl: 'partials/backoffice/help.html',
            controller: 'BackofficeCtrl.Help',
            requireMenu: true,
            requireLogin: false,
            requireAccess: [1, 2]
        },
        '/plateforme/contact': {
            templateUrl: 'partials/backoffice/contact.html',
            controller: 'BackofficeCtrl.Contact',
            requireMenu: true,
            requireLogin: false,
            requireAccess: [1, 2]
        }
    };

    var FeaderApp = angular.module('FeaderApp', [
        'ngRoute',
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

    FeaderApp.run(['$rootScope', '$location', 'SessionSvc',
        function($rootScope, $location, SessionSvc) {

            $rootScope.layout = {
                requireMenu: false
            };

            $rootScope.$on('$routeChangeStart', function(event, next, current) {
                if (next.requireLogin && !SessionSvc.isLogged()) {
                    $rootScope.layout.requireMenu = false;
                    $location.path('/home');
                } else if (next.requireMenu) {
                    $rootScope.layout.requireMenu = true;
                } else {
                    $rootScope.layout.requireMenu = false;
                }
            });

        }
    ]);

})();
