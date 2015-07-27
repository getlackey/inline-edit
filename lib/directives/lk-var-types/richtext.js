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
        //name = escapeName(attr.varName),
        placeholder = attr.placeholder;

    html += '<div class="placeholder">' + placeholder + '</div>';
    //html += '<div class="value" data-ng-bind-html="' + name + '"></div>';
    html += '<div contentEditable="true" lk-wysiwyg class="richtext"></div>';

    return html;
};

module.exports.link = function ($scope, element, attr, lkEdit) {
    var input = element.find('div.richtext'),
        blurTimer = 0;

    function updateScope() {
        var txtVal = input.text(),
            // check if it is only white space and clear all content
            // if so. Otherwise return html.
            val = (/^\s*$/.test(txtVal) ? '' : input.html());

        setTimeout(function () {
            $scope.$apply(function () {
                deep($scope, attr.varName, val);
            });
        });
    }

    input.on('input', updateScope);
    // when the user leaves the input element we do one last update
    // to caveat for style changes not triggered by the input event.
    // We need to be careful not to do it too quickly as it breaks the 
    // paste action (everything is pasted on the beginning).
    input.on('blur', function () {
        blurTimer = setTimeout(updateScope, 400);
    });
    input.on('focus', function () {
        clearTimeout(blurTimer);
    });

    $scope.$watch(escapeName(attr.varName), function (current, previous) {
        if (!input.is(':focus') && current !== previous) {
            if (current !== input.html()) {
                input.html(current);
            }
        }
    });

    element.find('.placeholder').click(function () {
        input.focus();
    });
};