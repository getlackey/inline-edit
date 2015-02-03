/*jslint node:true, browser:true */
'use strict';
/*
    Copyright 2015 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

var escapeName = require('../helpers/escape-name');

module.exports = function (app) {
    app.directive('lkVar', function () {
        var directive = {},
            directiveTypes = require('./lk-var-types'),
            defaultType = 'text';

        directive.require = '^lkEdit';

        directive.restrict = 'E';

        directive.scope = {
            model: '='
        };

        directive.template = function (element, attr) {
            var html = '',
                varName = '',
                type;

            if (!attr.type) {
                attr.type = defaultType;
            }

            if (!attr.placeholder) {
                attr.placeholder = 'Click to add value';
            }

            varName = 'data';
            if (attr.name) {
                varName += '.' + attr.name;
            }
            attr.varName = varName;

            type = attr.type;

            // each content type has a different template and different behaviours
            if (directiveTypes[type]) {
                html = directiveTypes[type].template(element, attr);
            } else {
                throw new Error('unable to find object for this type ' + type);
            }

            return html;
        };

        directive.link = function ($scope, element, attr, lkEdit) {
            var data,
                type;

            type = attr.type;

            // Get Data from REST API or use the model directly
            // from now on we forget all other vars and use $scope.data...
            if (attr.name) {
                data = lkEdit.getData(attr.name);
                $scope.data = data;
            } else {
                if (!$scope.model) {
                    throw new Error('at least a name or model property must be defined');
                }
                $scope.data = $scope.model;
            }

            // Events
            document.addEventListener('click', function () {
                element.removeClass('edit');
            });

            element.click(function () {
                setTimeout(function () {
                    element.addClass('edit');
                    element.find('input').focus();
                });
            });

            $scope.$watch(escapeName(attr.varName), function (current, previous) {
                if (current === undefined || current === null) {
                    element.addClass('no-data');
                } else {
                    element.removeClass('no-data');
                }

                if (current !== previous && previous !== undefined) {
                    lkEdit.$scope.$emit('changed');
                }
            }, true);

            // each content type has a different template and different behaviours
            if (directiveTypes[type] && directiveTypes[type].link) {
                directiveTypes[type].link($scope, element, attr, lkEdit);
            }
        };

        return directive;
    });

    return app;
};