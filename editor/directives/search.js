/*jslint node:true, browser:true, unparam:true, nomen:true */
'use strict';

var escapeName = require('../helpers/escape-name'),
    deep = require('deep-get-set');

deep.p = true; //hack to create empty objects

module.exports = function (app) {
    var Directive = function (Restangular, $timeout) {
        var directive = {};

        directive.require = '^lkEdit';

        directive.restrict = 'E';

        directive.scope = {
            model: '='
        };

        directive.template = function (element, attr) {
            var html = '',
                field = attr.match;

            html += '<button class="add-new">Add Item</button>';
            html += '<div class="search">';
            html += '  <div><input type="text" data-ng-name="search.query" data-ng-model="search.query" placeholder="Search item" /></div>';
            html += '  <div class="results" ng-show="search.items">';
            html += '    <p>Results for {{search.query}} </p>';
            html += '    <ul>';
            html += '      <li data-ng-repeat="item in search.items" data-id="{{ item._id }}">{{ item.' + field + ' }} [+]</li>';
            html += '    </ul>';
            html += '  </div>';
            html += '</div>';

            return html;
        };

        directive.link = function ($scope, element, attr, lkEdit) {
            var $addNewElm = element.find('.add-new'),
                $searchElm = element.find('.search'),
                $inputElm = element.find('input'),
                $resultsElm = element.find('.results'),
                field = attr.match,
                filter = (attr.filter && attr.filter + ',') || '',
                Entity = Restangular.all(attr.resource),
                data,
                varName;

            varName = 'data';
            if (attr.name) {
                varName += '.' + attr.name;
            }

            $scope.search = {
                query: '',
                items: []
            };

            // Get Data
            if (attr.name) {
                data = lkEdit.getData(attr.name);
                $scope.data = data;
            } else {
                if (!$scope.model) {
                    throw new Error('at least a name or model property must be defined');
                }
                $scope.data = $scope.model;
            }

            function runQuery(query) {
                var opts = {};

                if (runQuery.pending) {
                    return;
                }

                runQuery.pending = true;

                opts.limit = 10;
                opts.filter = filter + field + ':*' + query;

                Entity
                    .getList(opts)
                    .then(function (data) {
                        runQuery.pending = false;

                        if (query !== $scope.search.query) {
                            setImmediate(runQuery, $scope.search.query);
                        }

                        if (data) {
                            $scope.search.items = data.plain().map(function (item) {
                                //fix schema so that id is the canonical attribute
                                if (!item._id) {
                                    item._id = item.id;
                                }
                                return item;
                            });
                        } else {
                            $scope.search.items = [];
                        }
                    }, function (err) {
                        runQuery.pending = false;
                        $scope.search.items = [];
                    });
            }

            $addNewElm.click(function () {
                $addNewElm.hide();
                $searchElm.show();
                $inputElm.focus();
            });

            $scope.$watch('search.query', function () {
                var val = $scope.search.query;

                if (!val) {
                    $searchElm.hide();
                    $addNewElm.show();
                    $scope.search.items = [];
                } else {
                    runQuery($scope.search.query);
                }
            });

            $resultsElm.click(function (e) {
                var id = e.target.getAttribute('data-id');
                if (!id) {
                    return;
                }

                $scope.search.items.some(function (item) {
                    if (item.id === id) {
                        $scope.$apply(function () {
                            var scopeList = deep($scope, varName);

                            if (!Array.isArray(scopeList)) {
                                deep($scope, varName, []);
                                scopeList = deep($scope, varName);
                            }
                            scopeList.push(item);

                            $scope.search.items = [];
                            $scope.search.query = '';
                        });

                        return true;
                    }
                    return false;
                });
            });
        };

        return directive;
    };

    app.directive('lkSearch', ['Restangular', '$timeout', Directive]);

    return app;
};