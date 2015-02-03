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


module.exports = function (app) {
    app.directive('lkTest', function () {
        var directive = {};


        directive.restrict = 'E';

        directive.scope = {};

        directive.controller = function ($scope) {
            $scope.test = {
                first: '1st',
                second: '2nd',
                third: '3rd'
            };
        };

        directive.template = function () {
            var html = '';

            html += ':: <lk-var data-model="test.first" placeholder="insert data" data-type="text"></lk-var><br>';
            html += ':: <lk-var data-model="test.second" data-type="text"></lk-var><br>';
            html += ':: <lk-var data-model="test.third" data-type="text"></lk-var>';

            return html;
        };

        return directive;
    });
};