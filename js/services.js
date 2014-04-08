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
            Login: function(identifiant, passwd, store, cbSuccess, cbError) {
                var _self = this;
                passwd = CryptoJS.SHA1(CryptoJS.SHA1(passwd) + this.salt).toString();
                ApiSvc.getToken(identifiant, passwd)
                        .success(function(data, status) {
                            _self.id = data.user;
                            _self.session_token = data.session_token;
                            if (store) {
                                localStorage.setItem('App-User', data.user);
                                localStorage.setItem('App-Token', data.session_token);
                            }
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
                localStorage.clear();
                ApiSvc.setHeaders(false);
                if (typeof callback === 'function') {
                    callback();
                }
            },
            restoreSession: function() {
                var user = localStorage.getItem('App-User');
                var session_token = localStorage.getItem('App-Token');
                if (user !== null && session_token !== null) {
                    this.id = user;
                    this.session_token = session_token;
                    ApiSvc.setHeaders(user, session_token);
                    this.logged = true;
                    this.updateInfos();
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
            getToken: function(identifiant, passwd) {
                var currentTime = +new Date();
                return $http.get(this.apiUrl + '/token', {
                    params: {user: identifiant, passwd: passwd, timestamp: currentTime}
                });
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
            getBooklet: function(book_id) {
                if (book_id !== undefined) {
                    return $http.get(this.apiUrl + '/booklet/' + book_id);
                } else {
                    return $http.get(this.apiUrl + '/booklets');
                }
            },
            postBooklet: function(book_data) {
                return $http.post(this.apiUrl + '/booklet', {
                    book_data: book_data
                });
            },
            putBooklet: function(book_id, book_data) {
                return $http.put(this.apiUrl + '/booklet/' + book_id, {
                    book_data: book_data
                });
            },
            deleteBooklet: function(book_id) {
                return $http.delete(this.apiUrl + '/booklet/' + book_id);
            }
        };
    }
]);


FeaderAppServices.factory('BookletSvc', ['ApiSvc',
    function(ApiSvc) {
        return {
            getAll: function() {
                return ApiSvc.getBooklet();
            },
            get: function(book_id) {
                return ApiSvc.getBooklet(book_id);
            },
            create: function(book_data) {
                return ApiSvc.postBooklet(book_data);
            },
            duplicate: function(book_id) {
                var book_data = this.get(book_id);
                return this.create(book_data);
            },
            update: function(book_id, book_data) {
                return ApiSvc.putBooklet(book_id, book_data);
            },
            delete: function(book_id) {
                return ApiSvc.deleteBooklet(book_id);
            }
        };
    }
]);