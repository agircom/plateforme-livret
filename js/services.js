'use strict';

var FeaderAppServices = angular.module('FeaderApp.Services', []);

FeaderAppServices.factory('UserSvc', ['$rootScope', '$location', 'ApiSvc',
    function($rootScope, $location, ApiSvc) {
        return {
            logged: false,
            salt: '!P10p&42!',
            infos: {
                permissions: 0
            },
            id: null,
            session_token: null,
            isLogged: function() {
                return this.logged;
            },
            getPermissions: function() {
                return parseInt(this.infos.permissions);
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
            ResetPasswd: function(username) {
                return ApiSvc.postUserResetPasswd(username);
            },
            ProfilUpdate: function(userInfos) {
                if (userInfos.passwd !== '') {
                    userInfos.passwd = CryptoJS.SHA1(CryptoJS.SHA1(userInfos.passwd) + this.salt).toString();
                } else {
                    delete userInfos.passwd;
                }
                return ApiSvc.putUser(userInfos);
            },
            Confirm: function(confirm_key) {
                return ApiSvc.putUserConfirm(confirm_key);
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
                this.logged = false;
                this.id = null;
                this.session_token = null;
                this.infos = {
                    permissions: 0
                };
                localStorage.clear();
                ApiSvc.setHeaders(false);
                if (typeof callback === 'function') {
                    callback();
                }
            },
            restoreSession: function() {
                var user = localStorage.getItem('App-User');
                var session_token = localStorage.getItem('App-Token');
                var access = localStorage.getItem('App-Permissions');
                if (user !== null && session_token !== null) {
                    this.id = user;
                    this.session_token = session_token;
                    this.infos.permissions = access;
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
                            localStorage.setItem('App-Permissions', data.permissions);
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
            postContact: function(contactInfos) {
                return $http.post(this.apiUrl + '/contact', {
                    contactInfos: contactInfos
                });
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
            getUsers: function() {
                return $http.get(this.apiUrl + '/admin/users');
            },
            postUser: function(userInfos) {
                return $http.post(this.apiUrl + '/user', {
                    userInfos: userInfos
                });
            },
            putUser: function(userInfos) {
                return $http.put(this.apiUrl + '/user', {
                    userInfos: userInfos
                });
            },
            putUserConfirm: function(user_confirm_key) {
                return $http.put(this.apiUrl + '/user/confirm/' + user_confirm_key);
            },
            postUserResetPasswd: function(username) {
                return $http.post(this.apiUrl + '/user/resetpasswd', {
                    username: username
                });
            },
            deleteUser: function(user_id) {
                return $http.delete(this.apiUrl + '/admin/user/' + user_id);
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
            getFolio: function(booklet_id, folio_id) {
                return $http.get(this.apiUrl + '/booklet/' + booklet_id + '/folio/' + folio_id);
            },
            postFolio: function(booklet_id, folio_type_template) {
                return $http.post(this.apiUrl + '/booklet/' + booklet_id + '/folio/' + folio_type_template);
            },
            putFolio: function(booklet_id, folio_id, folio_data) {
                return $http.put(this.apiUrl + '/booklet/' + booklet_id + '/folio/' + folio_id, {
                    folio_data: folio_data
                });
            },
            getLibrary: function() {
                return $http.get(this.apiUrl + '/library');
            },
            getAllLibrary: function() {
                return $http.get(this.apiUrl + '/library/all');
            },
            getLibraryByCat: function(cat_id) {
                return $http.get(this.apiUrl + '/library/cat/' + cat_id);
            },
            getLibraryCategories: function() {
                return $http.get(this.apiUrl + '/library/cats');
            },
            postLibrary: function(image_infos) {
                return $http.post(this.apiUrl + '/library', image_infos, {
                    headers: {'Content-Type': undefined},
                    transformRequest: function(data) {
                        return data;
                    }
                });
            },
            postLibraryCat: function(cat_id, image_infos) {
                return $http.post(this.apiUrl + '/library/cat/' + cat_id, image_infos, {
                    headers: {'Content-Type': undefined},
                    transformRequest: function(data) {
                        return data;
                    }
                });
            },
            deleteLibrary: function(image_id) {
                return $http.delete(this.apiUrl + '/library/' + image_id);
            },
            getPDF: function(booklet_id, folio_id) {
                return $http.get(this.apiUrl + '/booklet/' + booklet_id + '/folio/' + folio_id + '/export');
            },
            getStats: function() {
                return $http.get(this.apiUrl + '/admin/stats');
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
            getFolio: function(booklet_id, folio_id) {
                return ApiSvc.getFolio(booklet_id, folio_id);
            },
            createFolio: function(booklet_id, folio_type_template) {
                return ApiSvc.postFolio(booklet_id, folio_type_template);
            },
            updateFolio: function(booklet_id, folio_id, folio_data) {
                return ApiSvc.putFolio(booklet_id, folio_id, folio_data);
            },
            createSheet: function() {

            },
            exportPDF: function(booklet_id, folio_id) {
                return ApiSvc.getPDF(booklet_id, folio_id);
            }
        };
    }
]);

FeaderAppServices.factory('LibrarySvc', ['ApiSvc',
    function(ApiSvc) {
        return {
            getImages: function() {
                return ApiSvc.getLibrary();
            },
            getAllImages: function() {
                return ApiSvc.getAllLibrary();
            },
            addImage: function(image_infos) {
                return ApiSvc.postLibrary(image_infos);
            },
            addImageCat: function(cat_id, image_infos) {
                return ApiSvc.postLibraryCat(cat_id, image_infos);
            },
            deleteImage: function(image_id) {
                return ApiSvc.deleteLibrary(image_id);
            },
            getCats: function() {
                return ApiSvc.getLibraryCategories();
            },
            getImagesByCat: function(cat_id) {
                return ApiSvc.getLibraryByCat(cat_id);
            }
        };
    }
]);

FeaderAppServices.factory('ToolSvc', ['ApiSvc',
    function(ApiSvc) {
        return {
            isValidEmail: function(email) {
                var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                return re.test(email);
            },
            getSelected: function() {
                var t = '';
                if (window.getSelection) {
                    t = window.getSelection();
                } else if (document.getSelection) {
                    t = document.getSelection();
                } else if (document.selection) {
                    t = document.selection.createRange().text;
                }
                return t;
            },
            getPDF: function() {
                return ApiSvc.getPDF();
            }
        };
    }
]);

FeaderAppServices.factory('AdminSvc', ['ApiSvc',
    function(ApiSvc) {
        return {
            getStats: function() {
                return ApiSvc.getStats();
            },
            getUserList: function() {
                return ApiSvc.getUsers();
            },
            deleteUser: function(user_id) {
                return ApiSvc.deleteUser(user_id);
            }
        };
    }
]);