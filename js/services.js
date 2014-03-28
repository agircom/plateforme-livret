'use strict';

var FeaderAppServices = angular.module('FeaderApp.Services', []);

FeaderAppServices.factory('UserSvc', ['$rootScope', '$location', '$log', 'ApiSvc',
    function($rootScope, $location, $log, ApiSvc) {
        return {
            logged: false,
            permissions: 0,
            salt: '!P10p&42!',
            data: {
                firstName: 'JEANNE',
                lastName: 'DESCHAMP'
            },
            isLogged: function() {
                return this.logged;
            },
            getPermissions: function() {
                return this.permissions;
            },
            Create: function(identifiant, passwd, cbSuccess, cbError) {
                var encryptedPassword = CryptoJS.SHA1(CryptoJS.SHA1(passwd) + this.salt).toString();
                ApiSvc.accountCreate(identifiant, encryptedPassword)
                        .success(function(data, status) {
                            if (cbSuccess !== undefined)
                                cbSuccess(data, status);
                        })
                        .error(function(data, status) {
                            if (cbError !== undefined)
                                cbError(data, status);
                        });
            },
            Login: function(identifiant, password, callback) {
                $log.info('UserSvc: Login');
                var result = {};
                if (identifiant === 'user' && password === 'user') {
                    $log.info('UserSvc: user logged');
                    result.success = true;
                    this.permissions = 1;
                    this.logged = true;
                } else if (identifiant === 'admin' && password === 'admin') {
                    $log.info('UserSvc: admin logged');
                    result.success = true;
                    this.permissions = 2;
                    this.logged = true;
                } else {
                    $log.info('UserSvc: unknown user');
                    result.error = true;
                    result.errorMessage = 'Identifiants invalides';
                    this.permissions = 0;
                    this.logged = false;
                }
                callback(result);
            },
            Logout: function(callback) {
                $log.info('UserSvc: Logout');
                var result = {};
                this.permissions = 0;
                this.logged = false;
                result.success = true;
                callback(result);
            },
            getCompleteName: function() {
                return this.data.firstName + ' ' + this.data.lastName;
            }
        };
    }
]);

FeaderAppServices.factory('ApiSvc', ['$http',
    function($http) {
        return {
            apiUrl: 'api',
            accountCreate: function(identifiant, passwd) {
                var currentTime = +new Date();
                return $http.post(this.apiUrl + '/account/create', {
                    user: identifiant,
                    passwd: passwd,
                    timestamp: currentTime
                });
            },
            getCounters: function() {
                return $http.get(this.apiUrl + '/don/counters');
            },
            getRemaining: function(fb_id) {
                return $http.get(this.apiUrl + '/don/remaining/' + fb_id);
            },
            getSpot: function() {
                return $http.get(this.apiUrl + '/partner/random');
            },
            getLastDon: function() {
                return $http.get(this.apiUrl + '/don/last');
            },
            makeGoodeed: function(infos) {
                return $http.post(this.apiUrl + '/don/make', infos);
            },
            syncUser: function(user) {
                return $http.post(this.apiUrl + '/user/' + user.id, user);
            }
        };
    }
]);
