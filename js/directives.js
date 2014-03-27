'use strict';

var FeaderAppDirectives = angular.module('FeaderApp.Directives', []);

FeaderAppDirectives.directive('ngEditable', function() {
    return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ngModel) {
            
        }
    };
});
