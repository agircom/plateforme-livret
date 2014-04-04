'use strict';

var FeaderAppServices = angular.module('FeaderApp.Services', []);

FeaderAppServices.factory('UserSvc', ['$rootScope', '$location', 'ApiSvc',
    function($rootScope, $location, ApiSvc) {
        return {
            logged: false,
            permissions: 0,
            salt: '!P10p&42!',
            data: {},
            isLogged: function() {
                return this.logged;
            },
            getPermissions: function() {
                return this.permissions;
            },
            Create: function(userInfos, cbSuccess, cbError) {
                userInfos.passwd = CryptoJS.SHA1(CryptoJS.SHA1(userInfos.passwd) + this.salt).toString();
                ApiSvc.accountCreate(userInfos)
                        .success(function(data, status) {
                            if (typeof cbSuccess === 'function')
                                cbSuccess(data, status);
                        })
                        .error(function(data, status) {
                            if (typeof cbError === 'function')
                                cbError(data, status);
                        });
            },
            Login: function(identifiant, password, cbSucess, cbError) {
                var result = {};
                
                cbSucess(result);
            },
            Logout: function(callback) {
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
            accountCreate: function(userInfos) {
                return $http.post(this.apiUrl + '/account/create', {
                    userInfos: userInfos
                });
            },
            getToken: function(identifiant, passwd) {
                var currentTime = +new Date();
                return $http.get(this.apiUrl + '/token');
            }
        };
    }
]);
