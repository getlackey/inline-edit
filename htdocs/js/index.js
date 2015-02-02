(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

module.exports = function (app) {
    var Directive = function () {
        var directive = {};

        directive.require = '^lkEdit';

        directive.restrict = 'E';

        directive.scope = {};

        directive.template = function (element, attr) {
            var html = '',
                action = attr.action;

            html += '<button disabled class="' + action + '">';
            html += action;
            html += '</button>';

            return html;
        };

        directive.link = function ($scope, element, attr, lkEdit) {
            var button = element.find('button');

            lkEdit.$scope.$on('changed', function () {
                button.attr('disabled', false);

                // show alert if changing page with pending changes
                if (!window.onbeforeunload) {
                    window.onbeforeunload = function () {
                        return "There are pending changes that will be lost.";
                    };
                }
            });

            lkEdit.$scope.$on('error', function (err) {
                console.error(err);
            });

            lkEdit.$scope.$on('saved', function (err) {
                window.onbeforeunload = null;
                button.attr('disabled', true);
            });

            lkEdit.$scope.$on('reloaded', function (err) {
                // the event is emitted before the $watch is triggered
                // and the changed event is emitted
                setTimeout(function () {
                    window.onbeforeunload = null;
                    button.attr('disabled', true);
                });
            });

            button.click(function () {
                var action = attr.action;
                if (action === 'cancel') {
                    lkEdit.reloadAll();
                } else if (action === 'save') {
                    lkEdit.saveAll();
                }
            });
        };

        return directive;
    };

    app.directive('lkApi', Directive);

    return app;
};
},{}],2:[function(require,module,exports){
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
            directive = {},
            pendingRequests = [],
            completeRequests = {};

        deep.p = true; //hack to create empty objects

        directive.restrict = 'A';

        directive.scope = {};

        directive.controller = function ($scope) {
            var self = this;
            // expose the local scope so it can be shared on
            // the directives that require this one
            // check directives/var.js
            self.$scope = $scope;

            self.parseName = function (name) {
                var opts = {},
                    parts = name.split('.');

                opts.name = name;
                opts.entity = parts[0];
                opts.id = parts[1];
                opts.property = parts.slice(2).join('.');

                return opts;
            };

            self.getData = function (name) {
                var opts = self.parseName(name),
                    Entity = Restangular.all(opts.entity),
                    isRequestPending = (pendingRequests.indexOf(opts.entity + '.' + opts.id) !== -1),
                    hasBeenRequested = !!($scope[opts.entity] && $scope[opts.entity][opts.id]);

                if (!hasBeenRequested && !isRequestPending) {
                    // add to pending requests
                    pendingRequests.push(opts.entity + '.' + opts.id);
                    // create an empty object for that entity in the scope
                    $scope[opts.entity] = {};

                    // get data from API
                    Entity
                        .get(opts.id)
                        .then(function (data) {
                            // remove from pending requests
                            pendingRequests.splice(pendingRequests.indexOf(opts.entity + '.' + opts.id), 1);

                            $timeout(function () {
                                $scope.$apply(function () {
                                    var value;
                                    // add the API response to the $scope
                                    deep($scope, opts.entity + '.' + opts.id, data);
                                    // cache in complete requests so we can quicly access it
                                    completeRequests[opts.entity] = $scope[opts.entity];
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

            self.saveAll = function () {
                var promisses = [];

                Object.keys(completeRequests).forEach(function (entity) {
                    var Entity = completeRequests[entity];

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


            // iterates the $scope obj and applies as get to all 
            // restangular objects
            self.reloadAll = function () {
                var promisses = [];

                Object.keys(completeRequests).forEach(function (entity) {
                    var Entity = completeRequests[entity];

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
},{"deep-get-set":11}],3:[function(require,module,exports){
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
},{"../../helpers/escape-name":9}],4:[function(require,module,exports){
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


module.exports = {
    text: require('./text'),
    boolean: require('./boolean'),
    list: require('./list')
};
},{"./boolean":3,"./list":5,"./text":6}],5:[function(require,module,exports){
/*jslint node:true, browser:true, nomen:true, unparam:true  */
'use strict';

var deep = require('deep-get-set'),
    escapeName = require('../../helpers/escape-name');

deep.p = true; //hack to create empty objects

module.exports.template = function (element, attr) {
    var html = '',
        template = (element[0] && element[0].innerHTML) || '{{ item.title }} <span class="delete-item">[x]<span>',
        condition = attr['if'],
        varName = escapeName(attr.varName);

    html += '<ul>';
    html += '  <li class="list-item" data-ng-repeat="item in ' + varName + '" data-id="{{ item.id }}"';
    if (condition) {
        html += ' data-ng-if="' + condition + '"';
    }
    html += '>' + template + '</li>';
    html += '</ul>';

    return html;
};

module.exports.link = function ($scope, element, attr, lkEdit) {
    var varName = attr.varName,
        list = element.find('ul:first');

    element.click(function (e) {
        var elm = e.target,
            item = elm,
            index;

        if (!elm.classList.contains('delete-item')) {
            return;
        }

        while (item && !item.classList.contains('list-item')) {
            item = item.parentElement;
        }

        if (!item) {
            return;
        }

        index = list.find('li').index(item);

        if (index !== -1) {
            $scope.$apply(function () {
                var scopeList = deep($scope, varName);
                scopeList.splice(index, 1);
            });
        }
    });
};
},{"../../helpers/escape-name":9,"deep-get-set":11}],6:[function(require,module,exports){
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
        name = escapeName(attr.varName),
        placeholder = attr.placeholder;

    html += '<span class="value" data-ng-bind-html="' + name + '"></span>';
    html += '<span class="placeholder">' + placeholder + '</span>';
    html += '<input class="input" data-ng-name="' + name + '" data-ng-model="' + name + '" />';

    return html;
};
},{"../../helpers/escape-name":9}],7:[function(require,module,exports){
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
},{"../helpers/escape-name":9,"deep-get-set":11}],8:[function(require,module,exports){
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

var escapeName = require('../helpers/escape-name');

module.exports = function (app) {
    app.directive('lkVar', function () {
        var directive = {},
            directiveTypes = require('./lk-var-types'),
            defaultType = 'text';

        directive.require = '^lkEdit';

        directive.restrict = 'E';

        directive.scope = {
            model: '='
        };

        directive.template = function (element, attr) {
            var html = '',
                varName = '',
                type;

            if (!attr.type) {
                attr.type = defaultType;
            }

            if (!attr.placeholder) {
                attr.placeholder = 'Click to add value';
            }

            varName = 'data';
            if (attr.name) {
                varName += '.' + attr.name;
            }
            attr.varName = varName;

            type = attr.type;

            // each content type has a different template and different behaviours
            if (directiveTypes[type]) {
                html = directiveTypes[type].template(element, attr);
            } else {
                throw new Error('unable to find object for this type ' + type);
            }

            return html;
        };

        directive.link = function ($scope, element, attr, lkEdit) {
            var data,
                type;

            type = attr.type;

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

            // Events
            document.addEventListener('click', function () {
                element.removeClass('edit');
            });

            element.click(function () {
                setTimeout(function () {
                    element.addClass('edit');
                    element.find('input').focus();
                });
            });

            $scope.$watch(escapeName(attr.varName), function (current, previous) {
                if (current === undefined) {
                    return;
                }

                if (current !== previous) {
                    if (!current) {
                        element.addClass('no-data');
                    } else {
                        element.removeClass('no-data');
                    }

                    if (previous !== undefined) {
                        lkEdit.$scope.$emit('changed');
                    }
                }
            }, true);

            // each content type has a different template and different behaviours
            if (directiveTypes[type] && directiveTypes[type].link) {
                directiveTypes[type].link($scope, element, attr, lkEdit);
            }
        };

        return directive;
    });

    return app;
};
},{"../helpers/escape-name":9,"./lk-var-types":4}],9:[function(require,module,exports){
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

module.exports = function (name) {
    var escaped = name;

    if (escaped.indexOf('.') === -1) {
        return escaped;
    }

    escaped = escaped.replace('.', '[\'');
    escaped = escaped.replace(/\./g, '\'][\'');

    if (escaped[escaped.length - 1] !== ']') {
        escaped += '\']';
    }

    return escaped;
};
},{}],10:[function(require,module,exports){
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
},{"./directives/api":1,"./directives/edit":2,"./directives/search":7,"./directives/var":8}],11:[function(require,module,exports){
module.exports = deep;

function deep (obj, path, value) {
  if (arguments.length === 3) return set.apply(null, arguments);
  return get.apply(null, arguments);
}

function get (obj, path) {
  var keys = path.split('.');
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!obj || !hasOwnProperty.call(obj, key)) {
      obj = undefined;
      break;
    }
    obj = obj[key];
  }
  return obj;
}

function set (obj, path, value) {
  var keys = path.split('.');
  for (var i = 0; i < keys.length - 1; i++) {
    var key = keys[i];
    if (deep.p && !hasOwnProperty.call(obj, key)) obj[key] = {};
    obj = obj[key];
  }
  obj[keys[i]] = value;
  return value;
}
},{}]},{},[10]);
