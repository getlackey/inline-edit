/*jslint node:true, browser:true, nomen:true, unparam:true  */
'use strict';

var deep = require('deep-get-set'),
    escapeName = require('dots2brackets');

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

        index = list.children('li.list-item').index(item);

        if (index !== -1) {
            $scope.$apply(function () {
                var scopeList,
                    scope = $scope;

                // we changed our lk-var from a private scope to an inherited one
                // varName can be accessed in the $scope prototype, but I'm not sure 
                // that changing it there won't break the cancel button. Also, 
                // deep() doesn't access data from the prototype (uses hasOwnProperty)
                // 
                // Feels wrong doing it this way, but as far as I can tell it works 
                // pretty well
                while (!scopeList && scope) {
                    scopeList = deep(scope, varName);
                    scope = scope.$parent;
                }

                scopeList.splice(index, 1);
            });
        }
    });
};