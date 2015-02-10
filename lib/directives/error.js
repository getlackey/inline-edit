/*jslint node:true, browser:true, unparam:true */
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

module.exports = function (app) {
    var Directive = function () {
        var directive = {};

        directive.require = '^lkEdit';

        directive.restrict = 'E';

        directive.scope = {
            ttl: '@'
        };

        directive.link = function ($scope, element, attr, lkEdit) {
            var html = '',
                timer;

            lkEdit.$scope.$on('error', function (evt, res) {
                clearTimeout(timer);

                html += '<div class="error">';
                html += (res.data && res.data.message) || 'An error occurred.';
                html += '</div>';

                element.html(html);

                //remove error after 5 sec
                timer = setTimeout(function () {
                    element.html('');
                }, (+$scope.ttl || 7000));
            });

            lkEdit.$scope.$on('saved', function (err) {
                clearTimeout(timer);
                element.html('');
            });

            lkEdit.$scope.$on('reloaded', function (err) {
                clearTimeout(timer);
                element.html('');
            });
        };

        return directive;
    };

    app.directive('lkError', Directive);

    return app;
};