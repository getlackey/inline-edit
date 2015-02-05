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

var deep = require('deep-get-set'),
    escapeName = require('../../helpers/escape-name');

deep.p = true; //hack to create empty objects

module.exports.template = function (element, attr) {
    var html = '',
        name = escapeName(attr.varName),
        placeholder = attr.placeholder;

    html += '<span class="value" data-ng-bind-html="' + name + '"></span>';
    html += '<span class="placeholder">' + placeholder + '</span>';
    html += '<input class="input" type="number" data-ng-name="' + name + '" data-ng-model="' + name + '" />';

    return html;
};

module.exports.link = function ($scope, element, attr) {
    var input = element.find('input');

    input.on('keypress', function (e) {
        e = e || window.event;
        var charCode = (e.which === undefined) ? e.keyCode : e.which,
            charStr = String.fromCharCode(charCode);

        if (!/^[0-9]+$/.test(charStr)) {
            return false;
        }
    });

    $scope.$watch(escapeName(attr.varName), function (current, previous) {
        if (current === undefined && previous !== undefined && previous !== null) {
            setTimeout(function () {
                $scope.$apply(function () {
                    deep($scope, attr.varName, previous);
                    window.alert('You tried to paste invalid data');
                });
            });
        }
    });
};