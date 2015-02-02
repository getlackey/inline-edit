# Inline Edit

WORK IN PROGRESS. NOT READY YET


Angularjs implementation of in-line editing. Assumes all data is passed as an angular model or an HTTP resource following a naming convention.

Requires angularjs, angular-sanitize and restangular.

Developed for modern browsers.

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

The save and cancel (to restore database values) buttons are created with <lk-api action=save|cancel>. These tags must also be contained inside the edit tag.
Finally any editable text should be inserted with the <lk-var> tag

### <lk-api>
just accepts one attribute - action. Action can only be save or cancel. Cancel pulls all data from the API and restores all values.

### <lk-var>
takes the following attributes:

#### name 
one of name or model is required. 

name is a representation of an api request. All '/' are replaced by '.'.

#### model
Angular model. We're assuming this angular model is some nested property where data came from the REST API, otherwise cancel and save buttons will do nothing.

#### type
(todo)
By default the type is text.

#### placeholder
Message to be used as placeholder when value is null or empty.
