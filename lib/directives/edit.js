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
    var Directive = function (Restangular, $timeout, $q) {
        var deep = require('deep-get-set'),
            directive = {};

        deep.p = true; //hack to create empty objects

        directive.restrict = 'A';

        directive.scope = {};

        directive.controller = function ($scope) {
            var self = this;

            // expose the local scope so it can be shared on
            // the directives that require this one
            // check directives/var.js
            self.$scope = $scope;

            $scope.pendingRequests = [];
            $scope.completeRequests = {};

            self.parseName = function (name) {
                var opts = {},
                    parts = name.split(':').shift().split('.');

                opts.name = name.replace(':', '.');
                opts.id = parts.pop();
                opts.entity = parts.join('.');
                opts.property = name.split(':').pop();

                return opts;
            };

            self.getData = function (name) {
                var opts = self.parseName(name),
                    Entity = Restangular.all(opts.entity.replace(/\./g, '/')),
                    isRequestPending = ($scope.pendingRequests.indexOf(opts.entity + '.' + opts.id) !== -1),
                    hasBeenRequested = !!(deep($scope, opts.entity + '.' + opts.id));

                if (!hasBeenRequested && !isRequestPending) {
                    // add to pending requests
                    $scope.pendingRequests.push(opts.entity + '.' + opts.id);
                    // create an empty object for that entity in the scope
                    deep($scope, opts.entity, {});

                    // get data from API
                    Entity
                        .get(opts.id)
                        .then(function (data) {
                            // remove from pending requests
                            $scope.pendingRequests.splice($scope.pendingRequests.indexOf(opts.entity + '.' + opts.id), 1);

                            $timeout(function () {
                                $scope.$apply(function () {
                                    var value;
                                    // add the API response to the $scope
                                    deep($scope, opts.entity + '.' + opts.id, data);
                                    // cache in complete requests so we can quicly access it
                                    $scope.completeRequests[opts.entity] = deep($scope, opts.entity);
                                    // if the requested property is missing
                                    // create it
                                    value = deep($scope, opts.name);
                                    if (value === undefined) {
                                        deep($scope, opts.name, '');
                                    }
                                });
                            });
                        }, function (err) {
                            self.$scope.$emit('error', err);
                        });
                }

                return $scope;
            };

            self.getModel = function (name) {
                return deep($scope, name);
            };

            self.saveAll = function () {
                var promisses = [];

                self.$scope.$emit('saving');

                Object.keys($scope.completeRequests).forEach(function (entity) {
                    var Entity = $scope.completeRequests[entity];

                    Object.keys(Entity).forEach(function (id) {
                        var item = Entity[id];

                        promisses.push(item.save());
                    });
                });

                $q.all(promisses).then(function () {
                    self.$scope.$emit('saved');
                }, function (err) {
                    self.$scope.$emit('error', err);
                });
            };


            // iterates the $scope obj and applies an get to all 
            // restangular objects
            self.reloadAll = function () {
                var promisses = [];

                self.$scope.$emit('reloading');

                Object.keys($scope.completeRequests).forEach(function (entity) {
                    var Entity = $scope.completeRequests[entity];

                    Object.keys(Entity).forEach(function (id) {
                        var item = Entity[id],
                            promise;

                        promise = item.get().then(function (data) {
                            $timeout(function () {
                                $scope.$apply(function () {
                                    // add the API response to the $scope
                                    deep($scope, entity + '.' + id, data);
                                });
                            });
                        });

                        promisses.push(promise);
                    });
                });


                $q.all(promisses).then(function () {
                    self.$scope.$emit('reloaded');
                }, function (err) {
                    self.$scope.$emit('error', err);
                });
            };
        };

        return directive;
    };

    app.directive('lkEdit', ['Restangular', '$timeout', '$q', Directive]);

    return app;
};