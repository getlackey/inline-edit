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

            lkEdit.$scope.$on('error', function (err) {
                console.error(err);
            });

            lkEdit.$scope.$on('saved', function (err) {
                window.onbeforeunload = null;
                button.attr('disabled', true);
            });

            lkEdit.$scope.$on('reloaded', function (err) {
                // the event is emitted before the $watch is triggered
                // and the changed event is emitted
                setTimeout(function () {
                    window.onbeforeunload = null;
                    button.attr('disabled', true);
                });
            });

            button.click(function () {
                var action = attr.action;
                if (action === 'cancel') {
                    lkEdit.reloadAll();
                } else if (action === 'save') {
                    lkEdit.saveAll();
                }
            });
        };

        return directive;
    };

    app.directive('lkApi', Directive);

    return app;
};