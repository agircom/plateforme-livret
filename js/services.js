'use strict';

var FeaderAppServices = angular.module('FeaderApp.Services', []);

FeaderAppServices.factory('UserSvc', ['$rootScope', '$location', 'ApiSvc',
    function($rootScope, $location, ApiSvc) {
        return {
            logged: false,
            permissions: 0,
            salt: '!P10p&42!',
            infos: {},
            id: null,
            session_token: null,
            isLogged: function() {
                return this.logged;
            },
            getPermissions: function() {
                return this.permissions;
            },
            Subscribe: function(userInfos, cbSuccess, cbError) {
                userInfos.passwd = CryptoJS.SHA1(CryptoJS.SHA1(userInfos.passwd) + this.salt).toString();
                ApiSvc.postUser(userInfos)
                        .success(function(data, status) {
                            if (typeof cbSuccess === 'function')
                                cbSuccess(data, status);
                        })
                        .error(function(data, status) {
                            if (typeof cbError === 'function')
                                cbError(data, status);
                        });
            },
            Login: function(identifiant, passwd, cbSuccess, cbError) {
                var _self = this;
                passwd = CryptoJS.SHA1(CryptoJS.SHA1(passwd) + this.salt).toString();
                ApiSvc.getToken(identifiant, passwd)
                        .success(function(data, status) {
                            _self.id = data.user;
                            _self.session_token = data.session_token;
//                            _self.permissions = ;
                            ApiSvc.setHeaders(data.user, data.session_token);
                            _self.logged = true;
                            _self.updateInfos(cbSuccess, cbError);
                        })
                        .error(function(data, status) {
                            if (typeof cbError === 'function')
                                cbError(data, status);
                        });
            },
            Logout: function(callback) {
                this.permissions = 0;
                this.logged = false;
                this.id = null;
                this.session_token = null;
                ApiSvc.setHeaders(false);
                if (typeof callback === 'function') {
                    callback();
                }
            },
            getInfos: function() {
                return this.infos;
            },
            updateInfos: function(cbSuccess, cbError) {
                var _self = this;
                ApiSvc.getUser()
                        .success(function(data, status) {
                            _self.infos = data;
                            if (typeof cbSuccess === 'function')
                                cbSuccess(data, status);
                        })
                        .error(function(data, status) {
                            if (typeof cbError === 'function')
                                cbError(data, status);
                        });
            },
            getCompleteName: function() {
                return this.infos.first_name + ' ' + this.infos.last_name;
            }
        };
    }
]);

FeaderAppServices.factory('ApiSvc', ['$http',
    function($http) {
        return {
            apiUrl: 'api',
            headers: {},
            setHeaders: function(user, session_token) {
                if (!user) {
                    delete $http.defaults.headers.common['App-User'];
                    delete $http.defaults.headers.common['App-Token'];
                    return;
                }
                $http.defaults.headers.common['App-User'] = user;
                $http.defaults.headers.common['App-Token'] = session_token;
            },
            getUser: function() {
                var currentTime = +new Date();
                return $http.get(this.apiUrl + '/user', {
                    params: {timestamp: currentTime}
                });
            },
            postUser: function(userInfos) {
                return $http.post(this.apiUrl + '/user', {
                    userInfos: userInfos
                });
            },
            getToken: function(identifiant, passwd) {
                var currentTime = +new Date();
                return $http.get(this.apiUrl + '/token', {
                    params: {user: identifiant, passwd: passwd, timestamp: currentTime}
                });
            }
        };
    }
]);
