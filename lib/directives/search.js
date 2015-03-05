/*jslint node:true, browser:true, unparam:true, nomen:true */
'use strict';

var escapeName = require('dots2brackets'),
    deep = require('deep-get-set');

deep.p = true; //hack to create empty objects

module.exports = function (app) {
    var Directive = function (Restangular) {
        var directive = {};

        directive.require = '^lkEdit';

        directive.restrict = 'E';

        directive.scope = {
            model: '=',
            hook: '=',
            allowDups: '='
        };

        directive.template = function (element, attr) {
            var html = '',
                field = attr.match,
                template = (element[0] && element[0].innerHTML) || '{{ item.' + field + ' }} <span class="add">[+]</span>';

            html += '<button class="add-new">Add Item</button>';
            html += '<div class="search">';
            html += '  <div><input type="text" data-ng-name="search.query" data-ng-model="search.query" placeholder="Search item" /></div>';
            html += '  <div class="results" ng-show="search.items">';
            html += '    <p>Results for {{search.query}} </p>';
            html += '    <ul>';
            html += '      <li data-ng-repeat="item in search.items">';
            html += '       <div ng-if="item._duplicated" class="duplicated"><i>' + template + '</i></div>';
            html += '       <div ng-if="!item._duplicated" data-id="{{ item._id }}">' + template + '</div>';
            html += '      </li>';
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
                type = attr.type || 'array',
                allowDups = (attr.allowDups && attr.allowDups === 'true' ? true : false),
                data,
                varName = '';

            if (attr.name) {
                varName += 'data.' + attr.name;
            } else {
                varName += 'model';
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
                if ($scope.model === undefined) {
                    throw new Error('at least a name or model property must be defined');
                }
            }

            function getTargetElmData() {
                var scopeList = deep($scope, varName);
                // convert every type to array
                // so it's easier to check for dups
                if (!Array.isArray(scopeList)) {
                    scopeList = [scopeList];
                }

                scopeList = scopeList.map(function (item) {
                    var id = item._id || item.id || '';

                    return id.toString();
                });

                return scopeList;
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
                        var targetElmData = getTargetElmData();

                        runQuery.pending = false;

                        if (query !== $scope.search.query) {
                            setImmediate(runQuery, $scope.search.query);
                        }

                        if (data) {
                            $scope.search.items = data.plain().map(function (item) {
                                //fix schema so that _id is the canonical attribute
                                if (!item._id) {
                                    item._id = item.id;
                                }
                                if (!allowDups) {
                                    if (attr.allowDups === 'false' || attr.allowDups === undefined) {
                                        if (targetElmData.indexOf(item._id.toString()) !== -1) {
                                            item._duplicated = true;
                                        }
                                    } else {
                                        // we'll just assume the user provided a function
                                        item._duplicated = $scope.allowDups(item, deep($scope, varName));
                                    }
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

            element.find('input').on('keyup', function () {
                var val = $scope.search.query;
                if (!val) {
                    $searchElm.hide();
                    $addNewElm.show();
                    $scope.search.items = [];
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
                            var scopeList = deep($scope, varName),
                                itemData = item;

                            if ($scope.hook) {
                                itemData = $scope.hook(item);
                                if (itemData === undefined) {
                                    itemData = item;
                                }
                            }

                            if (type === 'array') {
                                if (!Array.isArray(scopeList)) {
                                    deep($scope, varName, []);
                                    scopeList = deep($scope, varName);
                                }
                                scopeList.push(itemData);
                            } else {
                                deep($scope, varName, itemData);
                            }

                            $scope.search.items = [];
                            $scope.search.query = '';

                            setTimeout(function () {
                                $searchElm.hide();
                                $addNewElm.show();
                                $scope.search.items = [];
                            });
                        });

                        return true;
                    }

                    return false;
                });
            });
        };

        return directive;
    };

    app.directive('lkSearch', ['Restangular', Directive]);

    return app;
};