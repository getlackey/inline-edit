/*jslint node:true, browser:true */
'use strict';

module.exports = function (app) {
    app = require('./factories/api')(app); // does all HTTP requests
    app = require('./directives/edit')(app); // master edit directive. Holds all edited data
    app = require('./directives/api')(app); // implements save and cancel buttons
    app = require('./directives/var')(app); // interface to edit data. Check widgets in ./lk-var-types

    return app;
};