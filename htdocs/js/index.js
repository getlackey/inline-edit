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
},{"deep-get-set":12}],3:[function(require,module,exports){
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
},{"../../helpers/escape-name":10}],4:[function(require,module,exports){
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
    select: require('./select'),
    list: require('./list')
};
},{"./boolean":3,"./list":5,"./select":6,"./text":7}],5:[function(require,module,exports){
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
},{"../../helpers/escape-name":10,"deep-get-set":12}],6:[function(require,module,exports){
/*jslint node:true, browser:true, unparam:true */
'use strict';

var path = require('path'),
    optionsParser = require('lackey-options-parser'),
    deep = require('deep-get-set'),
    escapeName = require('../../helpers/escape-name');

deep.p = true; //hack to create empty objects

module.exports.template = function (element, attr) {
    var html = '',
        name = escapeName(attr.varName),
        options = optionsParser(attr.options).stripUnderscores().makeTitle();

    html += '<select class="eh-data-item" data-ng-name="' + name + '" data-ng-model="' + name + '">';

    Object.keys(options).forEach(function (key) {
        html += '<option value="' + key + '">' + options[key] + '</option>';
    });

    html += '</select>';

    return html;
};
},{"../../helpers/escape-name":10,"deep-get-set":12,"lackey-options-parser":15,"path":13}],7:[function(require,module,exports){
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
},{"../../helpers/escape-name":10}],8:[function(require,module,exports){
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
},{"../helpers/escape-name":10,"deep-get-set":12}],9:[function(require,module,exports){
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
},{"../helpers/escape-name":10,"./lk-var-types":4}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
},{"./directives/api":1,"./directives/edit":2,"./directives/search":8,"./directives/var":9}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":14}],14:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],15:[function(require,module,exports){
(function (process){
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

var path = require('path'),
    makeTitle = require('lackey-make-title'),
    Obj;

Obj = function () {
    var self = this;
    return self;
};

Obj.prototype.stripUnderscores = function () {
    var self = this;

    Object.keys(self).forEach(function (key) {
        var item = self[key];

        if (typeof item !== 'string') {
            return;
        }

        self[key] = item.replace(/_/g, ' ');
    });

    return self;
};

Obj.prototype.makeTitle = function () {
    var self = this;

    Object.keys(self).forEach(function (key) {
        var item = self[key];
        self[key] = makeTitle(item);
    });

    return self;
};

Obj.prototype.getKeys = function () {
    var self = this;

    return Object.keys(self);
};

Obj.prototype.getValues = function () {
    var self = this,
        keys = self.getKeys(),
        values = [];

    keys.forEach(function (key) {
        values.push(self[key]);
    });

    return values;
};

Obj.prototype.toString = function () {
    var self = this,
        output = [];

    Object.keys(self).forEach(function (key) {
        var item = self[key];

        if (item === key) {
            output.push(key);
            return;
        }

        output.push(key + ':' + item.replace(/ /g, '_'));
    });

    return output.join(' ');
};

function splitByColon(item) {
    var key = item,
        val = item,
        items;

    if (item.indexOf(':') > -1) {
        items = item.split(':');
        key = items[0];
        val = items[1];
    }

    return {
        key: key,
        val: val
    };
}

/*
converts:
   'opt1 opt2 opt3:test_this' 
into:
    {
        opt1: "opt1",
        opt2: "opt2",
        opt3: "test_this"
    }

opt3:test could not have contained spaces. to clear the spaces we would run:

    var opts = optionsParser('opt1 opt2 opt3:test_this').stripUnderscores();

*/
function parseString(opts) {
    var obj = new Obj();

    opts.split(' ').forEach(function (item) {
        var data = splitByColon(item);
        obj[data.key] = data.val;
    });

    return obj;
}

/*
    Converts every entry of the array into an object property

    converts:
        ['opt1', 'opt2', 'opt3:test_this']
    into:
        {
            opt1: "opt1",
            opt2: "opt2",
            opt3: "test_this"
        }

    opt3:test could not have contained spaces. to clear the spaces we would run:

        var opts = optionsParser(['opt1', 'opt2', 'opt3:test_this']).stripUnderscores();
*/
function parseArray(opts) {
    var obj = new Obj();

    opts.forEach(function (item) {
        var data = splitByColon(item);
        obj[data.key] = data.val;
    });

    return obj;
}

/*
    Converts a literal object 
    into an instance of our object with all our utility
    methods
*/
function parseObj(opts) {
    var obj = new Obj();

    Object.keys(opts).forEach(function (key) {
        obj[key] = opts[key];
    });

    return obj;
}

module.exports = function optionsParser(opts) {
    if (opts === undefined || opts === null) {
        throw new Error('Invalid options data. Accepts String, Array or literal Object');
    }

    // require a file
    if (typeof opts === 'string' && opts.indexOf('/') === 0) {
        opts = require(path.join(process.cwd(), opts));
    }

    if (typeof opts === 'string') {
        return parseString(opts);
    }

    if (Array.isArray(opts)) {
        return parseArray(opts);
    }

    // let's assume it's an object. 
    return parseObj(opts);
};
}).call(this,require('_process'))
},{"_process":14,"lackey-make-title":16,"path":13}],16:[function(require,module,exports){
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
    var title = '',
        i = 0,
        wasUppercase = false;

    if (!name) {
        return '';
    }

    for (i = 0; i < name.length; i += 1) {
        if (/([A-Z0-9])/.test(name[i])) {
            // allow consecutive uppercase letters to stay together
            // eg. myCMS -> My CMS
            if (!wasUppercase) {
                title += ' ';
                wasUppercase = true;
            }
        } else {
            wasUppercase = false;
        }
        title += name[i];
    }

    title = title.charAt(0).toUpperCase() + title.substring(1);
    return title;
};
},{}]},{},[11]);
