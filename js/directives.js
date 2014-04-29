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

/*
 jQuery UI Draggable plugin wrapper
 
 @param [ui-draggable] {object} Options to pass to $.fn.draggable() merged onto ui.config
 */
angular.module('ui.draggable', [])
        .value('uiDraggableConfig', {})
        .directive('uiDraggable', [
            'uiDraggableConfig', '$timeout', '$log',
            function(uiDraggableConfig, $timeout, $log) {
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
//                            cursor: 'move',
//                            handle: 'div.draggable_handler_default',
                            containment: "parent"
                        };
                        var callbacks = {
                            create: null,
                            drag: null,
                            start: null,
                            stop: null
                        };

                        angular.extend(opts, uiDraggableConfig);

                        if (ngModel) {
                            callbacks.create = function(e, ui) {
                                console.log('directive create');
//                                $(document.createElement('div'))
//                                        .addClass('draggable_handler_default')
//                                        .css({
//                                            'margin': 0,
//                                            'padding': 0,
//                                            'background-image': 'url(img/move.png)',
//                                            'background-size': '80%',
//                                            'background-repeat': 'no-repeat',
//                                            'background-position': 'center center',
//                                            'cursor': 'pointer',
//                                            'width': '20px',
//                                            'height': '20px',
//                                            'display': 'block',
//                                            'background-color': 'lightskyblue',
//                                            'position': 'absolute',
//                                            'top': '-10px',
//                                            'left': '-10px',
//                                            '-webkit-border-radius': '10px',
//                                            '-moz-border-radius': '10px',
//                                            'border-radius': '10px',
//                                            'opacity': '0.4'
//                                        })
//                                        .hover(function() {
//                                            $(this).css({'opacity': '0.8', 'background-color': 'darkcyan'});
//                                        }, function() {
//                                            $(this).css({'opacity': '0.4', 'background-color': 'lightskyblue'});
//                                        })
//                                        .appendTo(element);
                            };

                            callbacks.stop = function(e, ui) {
                                scope.$apply(function() {
                                    ngModel.$modelValue.content = element.parent().html();
                                });
                            };

                            scope.$watch(attrs.uiDraggable, function(newVal, oldVal) {
                                angular.forEach(newVal, function(value, key) {
                                    if (callbacks[key]) {
                                        value = combineCallbacks(callbacks[key], value);
                                    }
                                    element.draggable('option', key, value);
                                });
                            }, true);

                        } else {
                            $log.info('ui.draggable: ngModel not provided!', element);
                        }

                        angular.forEach(callbacks, function(value, key) {
                            opts[key] = combineCallbacks(value, opts[key]);
                        });
                        // create draggable element
                        element.draggable(opts);
                    }
                };
            }]);
