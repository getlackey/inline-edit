/*jslint node:true, browser:true, nomen: true */
/*global angular */
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

var editor = require('./index.js'),
    app,
    $;

// we need to expose this in the window object
if (window._ === undefined) {
    window._ = require('lodash');
}
// we need to expose this in the window object
if (window.jQuery === undefined) {
    $ = require('jquery');
    window.jQuery = $;
    window.$ = $;
}

// requiring dependencies
require('angular');
require('restangular');
require('angular-sanitize');

/********************************************
 *
 * You can ignore all that previous stuff
 * and just load angular and it's dependencies
 * in whatever way that best suits you.
 *
 * ******************************************/

// Our app - choose a name, this is just an example
app = angular.module('lkEdit', ['restangular', 'ngSanitize']);

app.config(function (RestangularProvider) {
    // This defines where our REST API is defined
    RestangularProvider.setBaseUrl('http://127.0.0.1:8000/api/v1');
});

app.controller('lkExample', function ($scope) {
    $scope.myData = {
        title: 'My 1st title',
        items: [{
            title: '1st'
        }, {
            title: '2nd'
        }]
    };
});

// initialise our editor
app = editor(app);

module.exports = function () {
    // just because.... 
    return app;
};