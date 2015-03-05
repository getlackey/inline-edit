# lk-var
takes the following attributes:

## name 
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

## model
Angular model. We're assuming this angular model is some nested property where data came from the REST API, otherwise cancel and save buttons will do nothing.

## type
By default the type is text. 

Full list of available types:

- [text](./lk-var-types/text.md)
- [number](./lk-var-types/number.md)
- [boolean](./lk-var-types/boolean.md)
- [select](./lk-var-types/select.md)
- [list](./lk-var-types/list.md)

### placeholder
Message to be used as placeholder when value is null or empty. Not all elements support this property.