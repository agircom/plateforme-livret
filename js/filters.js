'use strict';

var FeaderAppFilters = angular.module('FeaderApp.Filters', []);

FeaderAppFilters.filter('filterLibrary', [function() {
        return function(library, keyword) {
            var filtered = [];
            if (typeof keyword === 'undefined') {
                return library;
            }
            var keywords = keyword.split(' ');
            angular.forEach(library, function(picture) {
                for (var i = 0; i < keywords.length; ++i) {
                    if (picture.name.indexOf(keywords[i]) > -1 || picture.description.indexOf(keywords[i]) > -1) {
                        filtered.push(picture);
                        break;
                    }
                }
            });
            return filtered;
        };
    }
]);

FeaderAppFilters.filter('startFrom', [function() {
        return function(input, start) {
            start = parseInt(start);
            return input.slice(start);
        };
    }
]);

FeaderAppFilters.filter('breakFilter', [function() {
        return function(text) {
            if (text !== undefined) return text.replace(/\n/g, '<br />');
        };
    }
]);