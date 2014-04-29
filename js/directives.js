'use strict';

var FeaderAppDirectives = angular.module('FeaderApp.Directives', []);

FeaderAppDirectives.directive('ngEditable', function() {
    return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ngModel) {

        }
    };
});

FeaderAppDirectives.directive('compile', ['$compile', function($compile) {
        return function(scope, element, attrs) {
            scope.$watch(
                    function(scope) {
                        return scope.$eval(attrs.compile);
                    },
                    function(value) {
                        element.html(value);
                        $compile(element.contents())(scope);
                    }
            );
        };
    }]);

FeaderAppDirectives.directive('ngDraggable', ['$log',
    function($log) {
        return {
            require: '?ngModel',
            link: function(scope, element, attrs, ngModel) {

                function combineCallbacks(first, second) {
                    if (second && (typeof second === "function")) {
                        return function(e, ui) {
                            first(e, ui);
                            second(e, ui);
                        };
                    }
                    return first;
                }

                var opts = {
                    scroll: true,
                    cursor: 'move',
                    handle: '.ng-draggable-handler',
                    containment: "parent"
                };
                var callbacks = {
                    create: null,
                    drag: null,
                    start: null,
                    stop: null
                };

                if (ngModel) {
                    callbacks.create = function(e, ui) {
                        $(document.createElement('div')).addClass('ng-draggable-handler').appendTo(element);
                        $(".ng-draggable-handler").disableSelection();
                    };
                    callbacks.stop = function(e, ui) {
                        scope.$apply(function() {
                            ngModel.$modelValue.content = element.parent().html();
                        });
                    };
                    scope.$watch(attrs.ngDraggable, function(newVal) {
                        angular.forEach(newVal, function(value, key) {
                            if (callbacks[key]) {
                                value = combineCallbacks(callbacks[key], value);
                            }
                            element.draggable('option', key, value);
                        });
                    }, true);

                } else {
                    $log.info('ngDraggable: ngModel not provided!', element);
                }

                angular.forEach(callbacks, function(value, key) {
                    opts[key] = combineCallbacks(value, opts[key]);
                });
                // create draggable element
                element.draggable(opts);
            }
        };
    }
]);
