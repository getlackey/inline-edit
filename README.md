# Inline Edit
Angularjs implementation of in-line editing. Assumes all data is passed as an angular model or an HTTP resource following a naming convention.

Requires angularjs, angular-sanitize and restangular. Developed for modern browsers.

This module is part of the [Lackey framework](https://www.npmjs.com/package/lackey-framework) that is used to build the [Lackey CMS](http://lackey.io) amongst other projects.

## Install

    npm install
    bower install
    grunt build

then open htdocs/index.html and check the example

## example

    <div lk-edit>
        <div class="header">
            <lk-api action="save"></lk-api>
            <lk-api action="cancel"></lk-api> <!-- cancel action is optional -->
        </div>
    
        <lk-error ttl="5000"></lk-error><!-- shows error messages -->
        
        <div>
            <lk-var data-name="products.my-product.slug" data-type="text" data-placeholder="update me"></lk-var>
        </div>
    </div>

## Usage
All editable fields must be wrapped up in an element with the lk-edit attribute. 

The save and cancel (to restore database values) buttons are created with directive lk-api action=save|cancel. These tags must also be contained inside the edit tag.
Finally any editable text should be inserted with the directive lk-var.

### Directive lk-api
just accepts one attribute: action. 

Action can only be save or cancel. Cancel pulls all data from the API and restores all values.

### Directive lk-error
accepts a ttl argument to define how long should the error message remain visible.

### Directive lk-var
This is how we define our editable variables. [more info...](./lib/directives/var.md)

### Directive lk-search
Allows us to search a resource and add the results to a model. [more info...](./lib/directives/search.md)
