/*jslint node:true, browser:true, nomen:true, unparam:true  */
'use strict';

var deep = require('deep-get-set'),
    escapeName = require('../../helpers/escape-name');

deep.p = true; //hack to create empty objects

module.exports.template = function (element, attr) {
    var html = '',
        template = (element[0] && element[0].innerHTML) || '{{ item.title }} <span class="delete-item">[x]<span>',
        condition = attr['if'],
        varName = escapeName(attr.varName);

    html += '<ul>';
    html += '  <li class="list-item" data-ng-repeat="item in ' + varName + '" data-id="{{ item.id }}"';
    if (condition) {
        html += ' data-ng-if="' + condition + '"';
    }
    html += '>' + template + '</li>';
    html += '</ul>';

    return html;
};

module.exports.link = function ($scope, element, attr, lkEdit) {
    var varName = attr.varName,
        list = element.find('ul:first');

    element.click(function (e) {
        var elm = e.target,
            item = elm,
            index;

        if (!elm.classList.contains('delete-item')) {
            return;
        }

        while (item && !item.classList.contains('list-item')) {
            item = item.parentElement;
        }

        if (!item) {
            return;
        }

        index = list.find('li').index(item);

        if (index !== -1) {
            $scope.$apply(function () {
                var scopeList = deep($scope, varName);
                scopeList.splice(index, 1);
            });
        }
    });
};