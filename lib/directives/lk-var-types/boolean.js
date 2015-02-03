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

var escapeName = require('../../helpers/escape-name');

module.exports.template = function (element, attr) {
    var html = '',
        name = escapeName(attr.varName);

    html = '<input type="checkbox" class="eh-data-item" data-ng-name="' + name + '" data-ng-model="' + name + '" />';
    return html;
};