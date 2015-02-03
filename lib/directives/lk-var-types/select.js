/*jslint node:true, browser:true, unparam:true */
'use strict';

var path = require('path'),
    optionsParser = require('lackey-options-parser'),
    deep = require('deep-get-set'),
    escapeName = require('../../helpers/escape-name');

deep.p = true; //hack to create empty objects

module.exports.template = function (element, attr) {
    var html = '',
        name = escapeName(attr.varName),
        options = optionsParser(attr.options).stripUnderscores().makeTitle();

    html += '<select class="eh-data-item" data-ng-name="' + name + '" data-ng-model="' + name + '">';

    Object.keys(options).forEach(function (key) {
        html += '<option value="' + key + '">' + options[key] + '</option>';
    });

    html += '</select>';

    return html;
};