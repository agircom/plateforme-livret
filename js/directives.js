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
                element.disableSelection();
                element.attr('title', 'Ces informations ne sont pas modifiables');
            }
        };
    }
]);

FeaderAppDirectives.directive('ngEditable', ['ToolSvc', '$compile', function(ToolSvc, $compile) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                element.attr('contenteditable', true);
                element.attr('title', 'Saisissez votre texte en respectant le nombre de caractères prévus. Veillez à ne pas sortir du cadre par trop de retours ligne');
                element.addClass('ng-editable-marker');
//                element.addClass('ng-tooltip');
                element.on('focus', function(e, ui) {
                    $('.ng-editable-toolbox:not(#ng-editable-toolbox)').remove();
                    // copy template toolbox and move next to element
                    var maxLength = attrs.maxLength;
                    var oneLine = (typeof attrs.oneLine !== 'undefined') ? JSON.parse(attrs.oneLine) : false;
                    var toolbox = $('#ng-editable-toolbox').clone().removeAttr('id');
                    var calcChars = function(e) {
                        if (e.which !== 8 && element.text().length > maxLength) {
                            e.preventDefault();
                        } else if ((e.which === 8 || e.which === 46) && element.text().length === 0) {
                            e.preventDefault();
                        } else {
                            toolbox.find('.ng-editable-toolbox-chars>b').html(maxLength - element.text().length);
                        }
                    };
                    var clearNewLine = function() {
                        element.text(element.text().replace(/(\r\n|\n|\r)/gm, " "));
                    };
                    var cropText = function() {
                        if (element.text().length > maxLength) {
                            element.text(element.text().substring(0, maxLength));
                        }
                    };
                    toolbox.insertAfter(element);
                    toolbox.draggable({
                        scroll: true,
                        cursor: 'move',
                        start: function(event, ui) {
                            if ($('.cadre-folio-pf').hasClass('cfpffullscreen')) {
                                ui.position.left = 0;
                                ui.position.top = 0;
                            }
                        },
                        drag: function(event, ui) {
                            if ($('.cadre-folio-pf').hasClass('cfpffullscreen')) {
                                var zoomScale = $('.cadre-folio-pf').css('zoom');
                                var changeLeft = ui.position.left - ui.originalPosition.left; // find change in left
                                var newLeft = ui.originalPosition.left + changeLeft / zoomScale; // adjust new left by our zoomScale

                                var changeTop = ui.position.top - ui.originalPosition.top; // find change in top
                                var newTop = ui.originalPosition.top + changeTop / zoomScale; // adjust new top by our zoomScale

                                ui.position.left = newLeft;
                                ui.position.top = newTop;
                            }
                        }
                    });

                    // place it
                    toolbox.css({
                        left: element.offset().left,
                        top: element.offset().top + element.height,
                        'margin-top': '-' + (element.css('margin-bottom'))
                    });

                    element.on('focusout', function() {
                        scope.updateModel();
                    });

                    //event copy / cut
                    element.bind("cut copy", function(e) {
                        calcChars(e);
                    });

                    // event close
                    toolbox.find('.ng-editable-toolbox-close').on('click', function() {
                        toolbox.remove();
                    });

                    // tool color
                    toolbox.find('.ng-editable-toolbox-color-button').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').hide();
                        toolbox.find('.ng-editable-toolbox-color-submenu').toggle();
                    });

                    toolbox.find('.ng-editable-toolbox-color-carre').on('click', function() {
                        element.css('color', $(this).find('input').val());
                        toolbox.find('.ng-editable-toolbox-color-submenu').hide();
                        scope.updateModel();
                    });


                    // tool font
                    toolbox.find('.ng-editable-toolbox-font-button').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-color-submenu').hide();
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    });
                    toolbox.find('.ng-editable-toolbox-font-normal').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                        element.css('font', 'normal');
                        element.css('text-decoration', 'none');
                    });
                    toolbox.find('.ng-editable-toolbox-font-gras').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                        element.css('font-weight', 'bold');
                    });
                    toolbox.find('.ng-editable-toolbox-font-italique').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                        element.css('font-style', 'italic');
                    });
                    toolbox.find('.ng-editable-toolbox-font-gras-italique').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                        element.css('font-weight', 'bold');
                        element.css('font-style', 'italic');
                    });
                    toolbox.find('.ng-editable-toolbox-font-souligne').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                        element.css('text-decoration', 'underline');
                    });
                    toolbox.find('.ng-editable-toolbox-font-titre').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                        element.css('font-size', '300%');
                    });
                    toolbox.find('.ng-editable-toolbox-font-soustitre').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                        element.css('font-size', '250%');
                    });
                    toolbox.find('.ng-editable-toolbox-font-texte').on('click', function() {
                        toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                        element.css('font-size', '200%');
                    });


                    if (typeof maxLength !== 'undefined') {
                        // tool chars
                        toolbox.find('.ng-editable-toolbox-chars>b').html(maxLength - element.text().length);
                        element.bind("paste", function(e) {
                            setTimeout(function() {
                                cropText();
                                calcChars(e);
                            }, 0);
                        });

                        element.keyup(function(e) {
                            calcChars(e);
                        });
                        element.keydown(function(e) {
                            calcChars(e);
                        });
                        element.keypress(function(e) {
                            calcChars(e);
                        });
                    } else {
                        toolbox.find('.ng-editable-toolbox-chars>b').html('illimité');
                    }

                    if (oneLine === true) {
                        element.bind("paste", function(e) {
                            setTimeout(function() {
                                clearNewLine();
                            }, 0);
//                            e.stopPropagation();
//                            e.preventDefault();
//                            e.originalEvent.clipboardData.setData('Text', e.originalEvent.clipboardData.getData('Text'));
//                            console.log(e.originalEvent.clipboardData.setData('text/plain', "plop"));
//                            var data = e.originalEvent.clipboardData.getData('Text');
//                            console.log(data);
//                            if (data.length > 2) {
//                                return false;
//                            } else {
//                                return true;
//                            }
                        });
                        element.keydown(function(e) {
                            if (e.keyCode === 13) {
                                e.preventDefault();
                                return false;
                            }
                        });
                    }

                    // show it
                    toolbox.show();
                });
//                $compile(element)(scope);
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
                element.css('cursor', 'pointer');
                element.attr('title', 'Cliquez pour personnaliser avec votre image');
                element.on('click', function() {
                    scope.$apply(function() {
                        scope.togglePictureSelect();
                    });
                    var unregister = scope.$watch(function() {
                        return scope.imageSelected;
                    }, function(newVal) {
                        if (newVal !== null) {
                            element.prop('src', newVal);
                            scope.updateModel();
                            unregister();
                        }
                    });

                });
            }
        };
    }
]);


FeaderAppDirectives.directive('ngDateSelect', ['LibrarySvc', function(LibrarySvc) {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                // set element config
                element.attr('title', 'Cliquez pour changer l\'année');
                
                // function generate calendar
                var resetCalendar = function() {
                    var current_date = parseInt(element.find('.ng-date-select-first').text() + element.find('.ng-date-select-second').text());
                    if (isNaN(current_date)) {
                        alert('Erreur lors de l\'actualisation de l\'agenda');
                        return;
                    }
                    // check february
                    var new_date = new Date(current_date, 2, 0);
                    if (new_date.getDate() === 28) {
                        $('table.calendar-month').eq(1).find('tr').eq(28).hide();
                    } else {
                        $('table.calendar-month').eq(1).find('tr').eq(28).show();
                    }
                };
                // event click
                element.on('click', function() {
                    var first = element.find('.ng-date-select-first').text();
                    var second = element.find('.ng-date-select-second').text();
                    var new_year = prompt('Veuillez choisir l\'année', first + second);
                    if (!isNaN(parseInt(new_year)) && parseInt(new_year) >= 2000 && parseInt(new_year) < 3000) {
                        element.find('.ng-date-select-second').text(new_year.substring(2, 4));
                        resetCalendar();
                    } else if (new_year !== null) {
                        alert('Le format de la date est incorrect');
                    }
                });
            }
        };
    }
]);

FeaderAppDirectives.directive('ngDeletable', [function() {
        return {
            restrict: 'AEC',
            link: function(scope, element, attrs) {
                $(document.createElement('div')).addClass('ng-deletable-handler').attr('title', 'Cliquez ici pour supprimer l\'element').appendTo(element);
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
                    content: (typeof attrs.tooltipTitle !== 'undefined') ? attrs.tooltipTitle : null,
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
                $(document.createElement('div')).addClass('ng-remove-orga-handler').attr('title', 'supprimer un organisme').appendTo(element.find('h5'));

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
