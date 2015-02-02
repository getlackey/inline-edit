/*jslint node:true, browser:true */
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

module.exports = function (app) {
    // master edit directive. Holds all edited data and does HTTP requests
    app = require('./directives/edit')(app);
    // implements save and cancel buttons
    app = require('./directives/api')(app);
    // interface to edit data. Check widgets in ./lk-var-types
    app = require('./directives/var')(app);
    // searches items in an API and adds them to an angular model
    app = require('./directives/search')(app);

    return app;
};