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
        
        <div>
            <lk-var data-name="products.my-product.slug" data-type="text" data-placeholder="update me"></lk-var>
        </div>
    </div>

## Usage
All editable fields must be wrapped up in an element with the lk-edit attribute. 

The save and cancel (to restore database values) buttons are created with &lt;lk-api action=save|cancel&gt;. These tags must also be contained inside the edit tag.
Finally any editable text should be inserted with the &lt;lk-var&gt; tag

### &lt;lk-api&gt;
just accepts one attribute: action. 

Action can only be save or cancel. Cancel pulls all data from the API and restores all values.

### &lt;lk-var&gt;
takes the following attributes:

#### name 
one of name or model is required. Name is a representation of an api request. All '/' are replaced by '.'.

For instance:
	
	http://localhost/products/a-product/title

becomes

	products.a-product.title

The http://localhost will be defined in the restangular base url configuration

	app.config(function (RestangularProvider) {
    	// This defines where our REST API is defined
    	RestangularProvider.setBaseUrl('http://127.0.0.1:8000/api/v1');
	});
Please check the [example](./lib/example.js) file.

#### model
Angular model. We're assuming this angular model is some nested property where data came from the REST API, otherwise cancel and save buttons will do nothing.

#### type
By default the type is text. 

Full list of available types:

- [text](./lib/directives/lk-var-types/text.md)
- [boolean](./lib/directives/lk-var-types/boolean.md)
- [select](./lib/directives/lk-var-types/select.md)
- [list](./lib/directives/lk-var-types/list.md)

#### placeholder
Message to be used as placeholder when value is null or empty. Not all elements support this property.
