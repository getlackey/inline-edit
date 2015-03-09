/*jslint node:true, browser:true, nomen: true, unparam:true */
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
    //RestangularProvider.setBaseUrl('https://lackey.io/api/v1');
    RestangularProvider.setBaseUrl('http://127.0.0.1:8000/api/v1');

    // The cancel button will not work if your API is setting etags.
    // This is a known issue with Restangular 
    RestangularProvider.addResponseInterceptor(function (data, operation, what, url, response, deferred) {
        var headers = response.headers();
        delete headers.etag;

        return data;
    });
});

app.directive('myEdit', function(){
    var directive = {};

    directive.controllerAs = 'myEdit';
    
    directive.require = '^lkEdit';

    directive.restrict = 'A';

    directive.scope = false;

    directive.controller = function ($scope) {
        this.addTodoItem = function (name) {
            var model = $scope.lkEdit.getModel(name),
                doc = {
                    "title": 'new todo',
                    "complete": false
                };
            
            model.push(doc);
        };
    };
    

    directive.link = function ($scope, element, attr, lkEdit) {
        //exposes lk-edit in the controller scope
        $scope.lkEdit = lkEdit;
    };

    return directive;
});

// initialise our editor
app = editor(app);

module.exports = function () {
    // just because.... 
    return app;
};