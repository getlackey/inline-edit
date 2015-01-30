/*jslint node:true, browser:true, nomen: true */
/*global angular */
'use strict';

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
    RestangularProvider.setBaseUrl('http://localhost:8000/api/v1');
});

// initialise our editor
app = editor(app);

module.exports = function () {
    // just because.... 
    return app;
};