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
            Confirm: function(confirm_key) {
                return ApiSvc.postUserConfirm(confirm_key);
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
            postUserConfirm: function(user_confirm_key) {
                return $http.post(this.apiUrl + '/account/confirm/' + user_confirm_key);
            },
            getBooklet: function(booklet_id) {
                if (booklet_id !== undefined) {
                    return $http.get(this.apiUrl + '/booklet/' + booklet_id);
                } else {
                    return $http.get(this.apiUrl + '/booklets');
                }
            },
            postBooklet: function(booklet_name) {
                return $http.post(this.apiUrl + '/booklet', {
                    name: booklet_name
                });
            },
            postBookletDuplicate: function(booklet_id) {
                return $http.post(this.apiUrl + '/booklet/' + booklet_id + '/duplicate');
            },
            putBooklet: function(booklet_id, booklet_data) {
                return $http.put(this.apiUrl + '/booklet/' + booklet_id, {
                    book_data: booklet_data
                });
            },
            deleteBooklet: function(booklet_id) {
                return $http.delete(this.apiUrl + '/booklet/' + booklet_id);
            },
            postFolio: function(booklet_id, folio_type, folio_type_template) {
                return $http.post(this.apiUrl + '/booklet/' + booklet_id + '/folio/' + folio_type, {
                    folio_type_template: folio_type_template
                });
            },
            getFolio: function(booklet_id, folio_id) {
                return $http.get(this.apiUrl + '/booklet/' + booklet_id + '/folio/' + folio_id);
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
            get: function(booklet_id) {
                return ApiSvc.getBooklet(booklet_id);
            },
            create: function(booklet_name) {
                return ApiSvc.postBooklet(booklet_name);
            },
            duplicate: function(booklet_id) {
                return ApiSvc.postBookletDuplicate(booklet_id);
            },
            update: function(booklet_id, booklet_data) {
                return ApiSvc.putBooklet(booklet_id, booklet_data);
            },
            delete: function(booklet_id) {
                return ApiSvc.deleteBooklet(booklet_id);
            },
            createFolio: function(booklet_id, folio_type, folio_type_template) {
                return ApiSvc.postFolio(booklet_id, folio_type, folio_type_template);
            },
            getFolio: function(booklet_id, folio_id) {
                return ApiSvc.getFolio(booklet_id, folio_id);
            },
            createSheet: function() {
                
            }
        };
    }
]);