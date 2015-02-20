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
    escapeName = require('dots2brackets');

deep.p = true; //hack to create empty objects

module.exports.template = function (element, attr) {
    var html = '',
        name = escapeName(attr.varName),
        placeholder = attr.placeholder;

    html += '<span class="placeholder">' + placeholder + '</span>';
    html += '<span contentEditable="true" class="richtext"></span>';

    return html;
};

module.exports.link = function ($scope, element, attr, lkEdit) {
    var input = element.find('span.richtext');

    element.on('input', function () {
        setTimeout(function () {
            $scope.$apply(function () {
                deep($scope, attr.varName, input.html());
            });
        });
    });

    $scope.$watch(escapeName(attr.varName), function (current, previous) {
        if (current !== previous) {
            if (current !== input.html()) {
                input.html(current);
            }
        }
    });

    element.find('.placeholder').click(function () {
        input.focus();
    });
};