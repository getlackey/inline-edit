# Search

searches an API resource, shows a list of options. Clicking one of those options adds the related object to the variable defined in name or model

## Basic Usage

    <lk-search 
            name="configurators.my-item.components" 
            resource="components"
    ></lk-search>

resource is the API to be searched. In lackey's case it will be /api/v1/components
By default it searches the title property in the documents /api/v1/components?filter=title:*{{ your-search-string }}

the property name is used when we want to define an API resource. If we already have an angular model we can use model instead.

## Type

By default lk-search assumes it's being used to add items to an array, but we may choose to use it to replace/populate an object.

    <lk-search 
            name="configurators.my-item.components" 
            resource="components"
            type="object"
    ></lk-search>


## Custom Template

    <lk-search 
        name="configurators.my-item.components" 
        resource="components"
    >
        {{ item.title }} ({{ item.slug }}) <span class="add">[+]</span> 
    </lk-search>

The default template is:
    {{ item.the-matched-property }} <span class="add">[+]</span>

Whatever goes into the lk-search tags is used as an angular template. The add class may be helpful but it's not required.

## Search a different property

Sometime we need to search not by title, but by any other property, eg. produtcCode

    <lk-search 
        name="configurators.my-item.components" 
        resource="components"
        match="produtcCode"
    ></lk-search>


## Convert schema
On some occasions we need to have an easy way of changing the format of the data we are pushing to the list

    <lk-search 
        name="configurators.my-item.components" 
        resource="components"
        hook="myController.hookFunction"
    ></lk-search>

and then in the controller:
    
    this.hookFunction = function (item) {
        return {
            product: item,
            type: 'test' // some other properties
        }
    };

## Allow duplicates
lk-search checks the model for elements that are already present and shows them in the list as italic and prevents insertion of the duplicated item. If you wish to allow duplicates just set the value as false or define a custom function, if necessary.

On the **convert schema** example the duplication check will not work. We would be checking the element _id (or id) property and it would always be a different one as the item is found in item.product. For that we will need a custom function.

    <lk-search 
        name="configurators.my-item.components" 
        resource="components"
        allow-dups="myController.checkDups"
    ></lk-search>

and then in the controller

    this.checkDups = function (item, targetModel) {
        var id = item._id.toString(), // toString, just in case... 
            targetId = targetModel.product._id.toString();

        // is duplicated?
        return (targetId === id);
    }

## Filter
sometime we need to pre-filter our list, eg. products of type 'lowcost'.


    <lk-search 
        name="configurators.my-item.components" 
        resource="components"
        filter="type:lowcost"
    ></lk-search>

This will request data from /api/v1/components?filter=type:lowcost,title:*{{ your-search-string }}

