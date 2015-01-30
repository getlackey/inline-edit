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
    var Directive = function (apiCtrl) {
        var directive = {};

        directive.require = '^lkEdit';

        directive.restrict = 'E';

        directive.scope = {};

        directive.template = function (element, attr) {
            var html = '',
                action = attr.action;

            html += '<button disabled class="' + action + '">';
            html += action;
            html += '</button>';

            return html;
        };

        directive.link = function ($scope, element, attr, lkEdit) {
            var button = element.find('button');

            lkEdit.$scope.$on('changed', function () {
                button.attr('disabled', false);

                // show alert if changing page with pending changes
                if (!window.onbeforeunload) {
                    window.onbeforeunload = function () {
                        return "There are pending changes that will be lost.";
                    };
                }
            });
        };

        return directive;
    };

    app.directive('lkApi', ['lkApi', Directive]);

    return app;
};