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
    var Directive = function (apiCtrl) {
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
        };

        return directive;
    };

    app.directive('lkApi', ['lkApi', Directive]);

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
    var Directive = function () {
        var directive = {};

        directive.restrict = 'A';

        directive.scope = {};

        directive.controller = function ($scope) {
            var self = this;
            // expose the local scope so it can be shared on
            // the directives that require this one
            // check directives/var.js
            self.$scope = $scope;

            self.getData = function (name) {

                setTimeout(function () {
                    $scope.$apply(function () {
                        $scope.examples = {
                            'my-test': {
                                title: name
                            }
                        };
                    });
                }, 100);

                return $scope;
            };
        };

        return directive;
    };

    app.directive('lkEdit', ['lkApi', Directive]);

    return app;
};
},{}],3:[function(require,module,exports){
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
    text: require('./text')
};
},{"./text":4}],4:[function(require,module,exports){
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

module.exports.template = function (element, attr) {
    var html = '',
        name = attr.varName,
        placeholder = attr.placeholder;

    html += '<span class="value" data-ng-bind-html="' + name + '"></span>';
    html += '<span class="placeholder">' + placeholder + '</span>';
    html += '<input class="input" data-ng-name="' + name + '" data-ng-model="' + name + '" />';

    return html;
};

// module.exports.link = function ($scope, element, attr, lkEdit) {

// };
},{}],5:[function(require,module,exports){
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
                varName = escapeName(varName);
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
                    throw new Error('at leas a name or model property must be defined');
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

            $scope.$watch(attr.varName, function (current, previous) {
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
            });

            // each content type has a different template and different behaviours
            if (directiveTypes[type] && directiveTypes[type].link) {
                directiveTypes[type].link($scope, element, attr, lkEdit);
            }
        };

        return directive;
    });

    return app;
};
},{"../helpers/escape-name":7,"./lk-var-types":3}],6:[function(require,module,exports){
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
    app.factory('lkApi', function lkApiFactory() {
        return {
            test: 'ok'
        };
    });

    return app;
};
},{}],7:[function(require,module,exports){
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
},{}],8:[function(require,module,exports){
/*jslint node:true, browser:true */
'use strict';

module.exports = function (app) {
    app = require('./factories/api')(app); // does all HTTP requests
    app = require('./directives/edit')(app); // master edit directive. Holds all edited data
    app = require('./directives/api')(app); // implements save and cancel buttons
    app = require('./directives/var')(app); // interface to edit data. Check widgets in ./lk-var-types

    return app;
};
},{"./directives/api":1,"./directives/edit":2,"./directives/var":5,"./factories/api":6}]},{},[8]);
