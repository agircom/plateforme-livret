'use strict';

var FeaderAppDirectives = angular.module('FeaderApp.Directives', []);

FeaderAppDirectives.directive('compile', ['$compile', function ($compile) {
    return function (scope, element, attrs) {
        scope.$watch(
            function (scope) {
                return scope.$eval(attrs.compile);
            },
            function (value) {
                element.html(value);
                $compile(element.contents())(scope);
            }
        );
    };
}
]);

FeaderAppDirectives.directive('ngDraggable', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            element.draggable({
                scroll: true,
                cursor: 'move',
                handle: '.ng-draggable-handler',
                containment: "parent",
                create: function () {
                    $(document.createElement('div')).addClass('ng-draggable-handler').appendTo(element);
                    $(".ng-draggable-handler").disableSelection();
                },
                drag: null,
                start: null,
                stop: function () {
                    scope.updateModel();
                }
            });
        }
    };
}
]);

FeaderAppDirectives.directive('ngLocked', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element) {
//                $(document.createElement('div')).addClass('ng-locked-handler').appendTo(element);
//                $(".ng-locked-handler").disableSelection();
            element.disableSelection();
            element.attr('title', 'Ces informations ne sont pas modifiables');
        }
    };
}
]);

FeaderAppDirectives.directive('ngEditable', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            element.attr('contenteditable', true);
            element.attr('title', 'Saisissez votre texte en respectant le nombre de caractères prévus. Veillez à ne pas sortir du cadre par trop de retours ligne');
            element.addClass('ng-editable-marker');
//                element.addClass('ng-tooltip');
            element.on('focus', function (e, ui) {
                $('.ng-editable-toolbox:not(#ng-editable-toolbox)').remove();
                // copy template toolbox and move next to element
                var maxLength = attrs.maxLength;
                var oneLine = (typeof attrs.oneLine !== 'undefined') ? JSON.parse(attrs.oneLine) : false;
                var toolbox = $('#ng-editable-toolbox').clone().removeAttr('id');
                var calcChars = function (e) {
                    if (!e.which) return;
                    var allowedKeys = [
                        $.ui.keyCode.DELETE, $.ui.keyCode.BACKSPACE,
                        $.ui.keyCode.UP, $.ui.keyCode.DOWN, $.ui.keyCode.LEFT, $.ui.keyCode.RIGHT,
                        112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, // F1 - F12
                    ];
                    var isAllowedKeys = $.inArray(e.which, allowedKeys) !== -1;
                    if (!isAllowedKeys && element.text().length >= maxLength) {
                        e.preventDefault();
                    } else if (isAllowedKeys && element.text().length === 0) {
                        e.preventDefault();
                    }
                    toolbox.find('.ng-editable-toolbox-chars>b').html(maxLength - element.text().length);
                };
                var clearNewLine = function () {
                    element.html(element.html().replace(/(\r\n|\n|\r)/gm, " "));
                };
                var cropText = function () {
                    if (element.text().length > maxLength) {
                        element.text(element.text().substring(0, maxLength));
                    }
                };
                toolbox.insertAfter($('.menu-folio > ul'));

                element.on('focusout', function () {
                    scope.updateModel();
                });

                //event copy / cut
                element.bind("cut copy", function (e) {
                        calcChars(e);
                });

                // event textedit
                toolbox.find('.ng-editable-toolbox-textedit').on('click', function () {
                    if ($('.ng-editable-toolbox-textedit-popup').is(':visible')) {
                        toolbox.find('.ng-editable-toolbox-textedit-popup').slideUp();
                        $(this).find('img').attr('src', 'images/pictos/expand.png');
                    } else {
                        element.keyup();
                        toolbox.find('.ng-editable-toolbox-textedit-popup').slideDown();
                        $(this).find('img').attr('src', 'images/pictos/collapse.png');
                    }
                });
                toolbox.find('.ng-editable-toolbox-textedit-popup > textarea').on('keyup keydown keypress paste', function (e) {
                    calcChars(e);
                    if (element.hasClass("editable-list")) {
                        var txt = toolbox.find('.ng-editable-toolbox-textedit-popup > textarea').val()
                            .replace(/(\r\n|\n|\r)/gm, "</li><li>");
                        txt = "<ul style=\"list-style-type: circle;\"><li>"+txt+"</li></ul>";
                        txt = txt.replace(/<li[^>]*>[ \n\r\t]*<\/li>/gm, "");
                        element.html(txt.trim());
                    } else {
                        element.text($(this).val());
                    }
                });
                element.on('keyup keydown keypress paste', function (e) {
                    calcChars(e);
                    if (element.hasClass("editable-list")) {
                        var txt = "";
                        if (element.find("li").length === 0) {
                            var emptyul = $("<ul>")
                                .css("list-style-type", "circle")
                                .append($("<li>").text(element.text()));
                            element.html(emptyul);

                            // focus du caret sur le li
                            var el = element.get(0);
                            var node = el.childNodes[0].childNodes[0];
                            var range = document.createRange();
                            var sel = window.getSelection();
                            range.setStart(node, 0);
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);

                        }
                        element.find("li").each(function () {
                            txt += $(this).text() + "\n";
                        });
                        toolbox.find('.ng-editable-toolbox-textedit-popup > textarea').val(txt);
                    } else {
                        toolbox.find('.ng-editable-toolbox-textedit-popup > textarea').val($(this).text());
                    }
                });
                toolbox.find('.ng-editable-toolbox-textedit-popup > textarea').on('focusout', function () {
                    scope.updateModel();
                });

                // event close
                toolbox.find('.ng-editable-toolbox-close').on('click', function () {
                    toolbox.remove();
                });

                // tool color
                toolbox.find('.ng-editable-toolbox-color-button').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').hide();
                    toolbox.find('.ng-editable-toolbox-color-submenu').toggle();
                });

                toolbox.find('.ng-editable-toolbox-color-carre').on('click', function () {
                    element.css('color', $(this).find('input').val());
                    toolbox.find('.ng-editable-toolbox-color-submenu').hide();
                    scope.updateModel();
                });


                // tool font
                toolbox.find('.ng-editable-toolbox-font-button').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-color-submenu').hide();
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                });
                toolbox.find('.ng-editable-toolbox-font-normal').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    element.css('font', 'normal');
                    element.css('text-decoration', 'none');
                });
                toolbox.find('.ng-editable-toolbox-font-gras').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    element.css('font-weight', 'bold');
                });
                toolbox.find('.ng-editable-toolbox-font-italique').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    element.css('font-style', 'italic');
                });
                toolbox.find('.ng-editable-toolbox-font-gras-italique').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    element.css('font-weight', 'bold');
                    element.css('font-style', 'italic');
                });
                toolbox.find('.ng-editable-toolbox-font-souligne').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    element.css('text-decoration', 'underline');
                });
                toolbox.find('.ng-editable-toolbox-font-titre').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    element.css('font-size', '300%');
                });
                toolbox.find('.ng-editable-toolbox-font-soustitre').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    element.css('font-size', '250%');
                });
                toolbox.find('.ng-editable-toolbox-font-texte').on('click', function () {
                    toolbox.find('.ng-editable-toolbox-font-submenu').toggle();
                    element.css('font-size', '200%');
                });


                if (typeof maxLength !== 'undefined') {
                    // tool chars
                    toolbox.find('.ng-editable-toolbox-chars>b').html(maxLength - element.text().length);
                    element.bind("paste", function (e) {
                        setTimeout(function () {
                            cropText();
                            calcChars(e);
                        }, 0);
                    });

                    element.keyup(function (e) {
                        calcChars(e);
                    });
                    element.keydown(function (e) {
                        calcChars(e);
                    });
                    element.keypress(function (e) {
                        calcChars(e);
                    });
                } else {
                    toolbox.find('.ng-editable-toolbox-chars>b').html('illimité');
                }

                if (oneLine === true) {
                    element.bind("paste", function (e) {
                        setTimeout(function () {
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
                    element.keydown(function (e) {
                        if (e.keyCode === 13) {
                            e.preventDefault();
                            return false;
                        }
                    });
                }
                toolbox.find('.ng-editable-toolbox-textedit').trigger('click');
                // show it
                toolbox.show();
            });
//                $compile(element)(scope);
        }
    };
}
]);

FeaderAppDirectives.directive('ngMarkerToggle', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            element.on('click', function () {
                var content = $('#drawboard');
                content.find('.ng-draggable').children('.ng-draggable-handler').toggle();
                content.find('.ng-locked').children('.ng-locked-handler').toggle();
                content.find('.ng-editable').toggleClass('ng-editable-marker');
                content.find('.ng-picture-select').toggleClass('ng-editable-marker');
                content.find('.ng-deletable').children('.ng-deletable-handler').toggle();
                content.find('.ng-date-select').toggleClass('ng-editable-marker');
            });
        }
    };
}
]);

FeaderAppDirectives.directive('ngPictureSelect', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            if (!element.is('img')) {
                console.log('ngPictureSelect error: element type should be <img>');
                return;
            }
            element.css('cursor', 'pointer');
            element.addClass('ng-editable-marker');
            element.attr('title', 'Cliquez pour personnaliser avec votre image');
            element.on('click', function () {
                scope.$apply(function () {
                    scope.togglePictureSelect();
                });
                var unregister = scope.$watch(function () {
                    return scope.imageSelected;
                }, function (newVal) {
                    if (newVal !== null) {
                        unregister();
                        element.prop('src', newVal);
                        scope.$parent.updateModel();
                    }
                });

            });
        }
    };
}
]);


FeaderAppDirectives.directive('ngDateSelect', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            // set element config
            element.attr('title', 'Cliquez pour changer l\'année');
            element.addClass('ng-editable-marker');
            scope.isReseting = false;
            // function generate calendar
            var resetCalendar = function () {
                var current_date = parseInt(element.find('.ng-date-select-first').text() + element.find('.ng-date-select-second').text());
                if (isNaN(current_date)) {
                    alert('Erreur lors de l\'actualisation de l\'agenda');
                    return;
                }
                // get pages
                var page_first, page_second;
                if (scope.selected_page === 0) {
                    page_first = $('#drawboard');
                } else {
                    var page_first = $('<div/>');
                    page_first.append(scope.folio.ownPage[0].content);
                }
                if (scope.selected_page === 1) {
                    page_second = $('#drawboard');
                } else {
                    var page_second = $('<div/>');
                    page_second.append(scope.folio.ownPage[1].content);
                }

                // update another year
                if (scope.selected_page === 0) {
                    page_second.find('.ng-date-select-second').text(current_date.toString().substring(2, 4));
                } else {
                    page_first.find('.ng-date-select-second').text(current_date.toString().substring(2, 4));
                }

                // check february
                var date_feb = new Date(current_date, 2, 0);
                if (date_feb.getDate() === 28) {
                    page_first.find('table.calendar-month').eq(1).find('tr').eq(28).hide();
                } else {
                    page_first.find('table.calendar-month').eq(1).find('tr').eq(28).show();
                }

                // update days
                var week = new Array('D', 'L', 'M', 'M', 'J', 'V', 'S');
                page_first.find('table.calendar-month').each(function (i, el) {
                    var month = parseInt(i);
                    $(el).find('tr').each(function (j, ele) {
                        var day = parseInt($(ele).find('td').eq(1).text());
                        var tmp_date = new Date(current_date, month, day);
                        $(ele).find('td').eq(0).text(week[tmp_date.getDay()]);
                    });
                });
                page_second.find('table.calendar-month').each(function (i, el) {
                    var month = 6 + parseInt(i);
                    $(el).find('tr').each(function (j, ele) {
                        var day = parseInt($(ele).find('td').eq(1).text());
                        var tmp_date = new Date(current_date, month, day);
                        $(ele).find('td').eq(0).text(week[tmp_date.getDay()]);
                    });
                });

                // save updates
                page_first = scope.clearPlugins(page_first.clone());
                page_second = scope.clearPlugins(page_second.clone());
                scope.folio.ownPage[0].content = page_first.html();
                scope.folio.ownPage[1].content = page_second.html();
                scope.updatedFolio = true;

                scope.isReseting = false;
            };
            // event click
            element.on('click', function () {
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
            scope.$watch('$viewContentLoaded', function () {
                if (!scope.isReseting) {
                    scope.isReseting = true;
                    resetCalendar();
                }
            });
        }
    };
}
]);

FeaderAppDirectives.directive('ngDateVacSelect', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {

            element.attr('title', 'Cliquez pour sélectionner les dates de vacances');

            scope.selectingVac = false;

            var days = $('#drawboard').find('table.calendar-month').find('tr');

            $('#drawboard').find('.ng-date-vac-select-apply').on('click', function () {
                disableModeVac();
            });

            element.on('click', function () {
                if (!scope.selectingVac) {
                    enableModeVac();
                }
            });

            var enableModeVac = function () {
                if (scope.selectingFerie === true) {
                    $('#drawboard').find('.ng-date-ferie-select-apply').trigger('click');
                }
                scope.selectingVac = true;
                $('#drawboard').find('.ng-date-vac-select-apply').show();
                days.on('click', function () {
                    if (scope.selectingVac === true) {
                        $(this).find('td').eq(4).toggleClass('trait-vacances');
                    }
                });
            };

            var disableModeVac = function () {
                scope.selectingVac = false;
                $('#drawboard').find('.ng-date-vac-select-apply').hide();
                days.off('click');
                scope.updateModel();
            };

        }
    };
}
]);

FeaderAppDirectives.directive('ngDateFerieSelect', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {

            element.attr('title', 'Cliquez pour sélectionner les dates de vacances');

            scope.selectingFerie = false;
            var days = $('#drawboard').find('table.calendar-month').find('tr');

            $('#drawboard').find('.ng-date-ferie-select-apply').on('click', function () {
                disableModeFerie();
            });

            element.on('click', function () {
                if (!scope.selectingFerie) {
                    enableModeFerie();
                }
            });

            var enableModeFerie = function () {
                if (scope.selectingVac === true) {
                    $('#drawboard').find('.ng-date-vac-select-apply').trigger('click');
                }
                scope.selectingFerie = true;
                $('#drawboard').find('.ng-date-ferie-select-apply').show();
                days.on('click', function () {
                    if (scope.selectingFerie === true) {
                        $(this).find('td').eq(2).toggleClass('picto-jr-ferie');
                    }
                });
            };

            var disableModeFerie = function () {
                scope.selectingFerie = false;
                $('#drawboard').find('.ng-date-ferie-select-apply').hide();
                days.off('click');
                scope.updateModel();
            };

        }
    };
}
]);

FeaderAppDirectives.directive('ngDeletable', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            $(document.createElement('div')).addClass('ng-deletable-handler').attr('title', 'Cliquez ici pour supprimer l\'element').appendTo(element);
            element.find('.ng-deletable-handler').on('click', function (e, ui) {
                element.remove();
                scope.updateModel();
            });
        }
    };
}
]);

FeaderAppDirectives.directive('ngTooltip', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            element.tooltipster({
                delay: 100,
                position: 'bottom-left',
                content: (typeof attrs.tooltipTitle !== 'undefined') ? attrs.tooltipTitle : null,
                functionInit: function () {
                    scope.$watch(function () {
                        return scope.layout.showTooltips;
                    }, function (newVal, oldVal) {
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

//FeaderAppDirectives.directive('ngCloneCat', ['$compile', function ($compile) {
//    return {
//        restrict: 'AEC',
//        link: function (scope, element, attrs) {
//            // create handler
//            $(document.createElement('div')).addClass('ng-clone-cat-handler').attr('title', 'Ajouter une categorie').appendTo(element.find('h4'));
//
//            // onclick
//            element.find('.ng-clone-cat-handler').on('click', function (e, ui) {
//                if (scope.folioBuilding === false) {
//                    scope.folioBuilding = true;
//                    // clone processing
//                    var parent = $('#drawboard > div').first();
//                    element.clone().insertAfter(element);
//
//                    // build folio pages
//                    scope.buildFolio(parent);
//                    var el = angular.element(scope.folio.ownPage[scope.selected_page].content);
//                    var compiled = $compile(el)(scope);
//                    $('#drawboard').html(compiled);
//                    scope.folioBuilding = false;
//                }
//            });
//        }
//    };
//}
//]);
FeaderAppDirectives.directive('ngRemoveCat', ['$compile', function ($compile) {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            // create handler
            $(document.createElement('div')).addClass('ng-remove-cat-handler').attr('title', 'Supprimer la categorie').appendTo(element.find('h4'));

            // onclick
            element.find('.ng-remove-cat-handler').on('click', function (e, ui) {
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

FeaderAppDirectives.directive('ngCloneOrga', ['$compile', function ($compile) {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            // create handler
            $(document.createElement('div')).addClass('ng-clone-orga-handler').attr('title', 'Ajouter un organisme').appendTo(element.find('h5'));

            // onclick
            element.find('.ng-clone-orga-handler').on('click', function (e, ui) {
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
FeaderAppDirectives.directive('ngRemoveOrga', ['$compile', function ($compile) {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            // create handler
            $(document.createElement('div')).addClass('ng-remove-orga-handler').attr('title', 'supprimer un organisme').appendTo(element.find('h5'));

            // onclick
            element.find('.ng-remove-orga-handler').on('click', function (e, ui) {
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

FeaderAppDirectives.directive('link', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            element.attr('onclick', 'return false;');
        }
    };
}
]);

FeaderAppDirectives.directive('ngAccordion', [function () {
    return {
        restrict: 'AEC',
        link: function (scope, element, attrs) {
            element.accordion({
                header: 'div>h3',
                collapsible: true,
                heightStyleType: 'content'
            });
            scope.$watch(function () {
                return scope.faqList;
            }, function (newVal) {
//                    alert('refresh accordion');
                element.accordion('refresh');
            });
        }
    };
}
]);
