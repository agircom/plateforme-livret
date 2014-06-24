'use strict';

var FeaderAppDirectives = angular.module('FeaderApp.Directives', []);

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
    }
]);

FeaderAppDirectives.directive('ngDraggable', [function() {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                element.draggable({
                    scroll: true,
                    cursor: 'move',
                    handle: '.ng-draggable-handler',
                    containment: "parent",
                    create: function() {
                        $(document.createElement('div')).addClass('ng-draggable-handler').appendTo(element);
                        $(".ng-draggable-handler").disableSelection();
                    },
                    drag: null,
                    start: null,
                    stop: function() {
                        scope.updateModel();
                    }
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('ngLocked', [function() {
        return {
            restrict: 'AEC',
            link: function(scope, element) {
//                $(document.createElement('div')).addClass('ng-locked-handler').appendTo(element);
//                $(".ng-locked-handler").disableSelection();
            }
        };
    }
]);

FeaderAppDirectives.directive('ngEditable', [function() {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                element.attr('contenteditable', true);
                element.addClass('ng-editable-marker');
                element.on('focus', function(e, ui) {
//                    $('#ng-editable-toolbox').detach().appendTo(element);
                    $('#ng-editable-toolbox-size').off('change');
                    $('#ng-editable-toolbox-color').off('change');

                    $('#ng-editable-toolbox').css({
                        left: element.offset().left,
                        top: element.offset().top - 45
                    });

                    $('#ng-editable-toolbox-size').val(element.css('font-size'));
                    $('#ng-editable-toolbox-size').on('change', function() {
                        element.css('font-size', $(this).val());
                        scope.updateModel();
                    });

                    $('#ng-editable-toolbox-color').css('background-color', element.css('color'));
                    $('#ng-editable-toolbox-color').val(element.css('color'));
                    $('#ng-editable-toolbox-color').on('change', function() {
                        element.css('color', $(this).val());
                        $('#ng-editable-toolbox-color').css('background-color', $(this).val());
                        scope.updateModel();
                    });

                    $('#ng-editable-toolbox-cancel').on('click', function() {
                        scope.$apply(function() {
                            scope.toggleNgEditableToolbox(false);
                        });
                    });

                    scope.$apply(function() {
                        scope.toggleNgEditableToolbox(true);
                    });
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('ngMarkerToggle', [function() {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                element.on('click', function() {
                    var content = $('#drawboard');
                    content.find('.ng-draggable').children('.ng-draggable-handler').toggle();
                    content.find('.ng-locked').children('.ng-locked-handler').toggle();
                    content.find('.ng-editable').toggleClass('ng-editable-marker');
                    content.find('.ng-deletable').children('.ng-deletable-handler').toggle();
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('ngPictureSelect', ['LibrarySvc', function(LibrarySvc) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                if (!element.is('img')) {
                    console.log('ngPictureSelect error: element type should be <img>');
                    return;
                }
                element.on('click', function() {
                    scope.$apply(function() {
                        scope.togglePictureSelect();
                    });
                    var unregister = scope.$watch(function() {
                        return scope.imageSelected;
                    }, function(newVal) {
                        if (newVal !== null) {
                            element.attr('src', newVal);
                            scope.updateModel();
                            unregister();
                        }
                    });
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('ngDeletable', [function() {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                $(document.createElement('div')).addClass('ng-deletable-handler').appendTo(element);
                element.find('.ng-deletable-handler').on('click', function(e, ui) {
                    element.remove();
                    scope.updateModel();
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('ngTooltip', [function() {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                element.tooltipster({
                    delay: 100,
                    position: 'bottom-left',
                    functionInit: function() {
                        scope.$watch(function() {
                            return scope.layout.showTooltips;
                        }, function(newVal, oldVal) {
                            if (newVal === true) {
                                element.tooltipster('show');
                            } else {
                                element.tooltipster('hide');
                            }
                        });
                    }
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('ngCloneCat', ['$compile', function($compile) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                // create handler
                $(document.createElement('div')).addClass('ng-clone-cat-handler').attr('title', 'Ajouter une categorie').appendTo(element.find('h4'));

                // onclick
                element.find('.ng-clone-cat-handler').on('click', function(e, ui) {
                    if (scope.folioBuilding === false) {
                        scope.folioBuilding = true;
                        // clone processing
                        var parent = $('#drawboard > div').first();
                        element.clone().insertAfter(element);

                        // build folio pages
                        scope.buildFolio(parent);
                        var el = angular.element(scope.folio.ownPage[scope.selected_page].content);
                        var compiled = $compile(el)(scope);
                        $('#drawboard').html(compiled);
                        scope.folioBuilding = false;
                    }
                });
            }
        };
    }
]);
FeaderAppDirectives.directive('ngRemoveCat', ['$compile', function($compile) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                // create handler
                $(document.createElement('div')).addClass('ng-remove-cat-handler').attr('title', 'Supprimer la categorie').appendTo(element.find('h4'));

                // onclick
                element.find('.ng-remove-cat-handler').on('click', function(e, ui) {
                    if (scope.folioBuilding === false) {
                        // clone processing
                        var parent = $('#drawboard > div').first();
                        if (scope.folio.ownPage.length === 1 && parent.find('.ng-remove-cat').length === 1) {
                            alert('Vous devez avoir au minimum une categorie');
                        } else {
                            scope.folioBuilding = true;
                            // remove processing
                            element.remove();

                            // build folio pages
                            scope.buildFolio(parent);
                            var el = angular.element(scope.folio.ownPage[scope.selected_page].content);
                            var compiled = $compile(el)(scope);
                            $('#drawboard').html(compiled);
                            scope.folioBuilding = false;
                        }
                    }
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('ngCloneOrga', ['$compile', function($compile) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                // create handler
                $(document.createElement('div')).addClass('ng-clone-orga-handler').attr('title', 'Ajouter un organisme').appendTo(element.find('h5'));

                // onclick
                element.find('.ng-clone-orga-handler').on('click', function(e, ui) {
                    if (scope.folioBuilding === false) {
                        scope.folioBuilding = true;
                        // clone processing
                        var parent = $('#drawboard > div').first();
                        element.clone().insertAfter(element);

                        // build folio pages
                        scope.buildFolio(parent);
                        var el = angular.element(scope.folio.ownPage[scope.selected_page].content);
                        var compiled = $compile(el)(scope);
                        $('#drawboard').html(compiled);
                        scope.folioBuilding = false;
                    }
                });
            }
        };
    }
]);
FeaderAppDirectives.directive('ngRemoveOrga', ['$compile', function($compile) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                // create handler
                $(document.createElement('div')).addClass('ng-remove-orga-handler').attr('title', 'Ajouter un organisme').appendTo(element.find('h5'));

                // onclick
                element.find('.ng-remove-orga-handler').on('click', function(e, ui) {
                    if (scope.folioBuilding === false) {
                        // clone processing
                        if (element.siblings('.ng-remove-orga').length === 0) {
                            alert('Vous devez avoir au minimum un organisme par categorie');
                        } else {
                            scope.folioBuilding = true;
                            var parent = $('#drawboard > div').first();
                            // remove processing
                            element.remove();

                            // build folio pages
                            scope.buildFolio(parent);
                            var el = angular.element(scope.folio.ownPage[scope.selected_page].content);
                            var compiled = $compile(el)(scope);
                            $('#drawboard').html(compiled);
                            scope.folioBuilding = false;
                        }
                    }
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('link', [function() {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                element.attr('onclick', 'return false;');
            }
        };
    }
]);
