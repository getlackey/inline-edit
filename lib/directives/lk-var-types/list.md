# List

Renders an array of elements. 

The default layout assumes each item in the array is an object and there is an id and a title.

Accepts the following arguments:

- name or model
- if (an [angular condition](https://docs.angularjs.org/api/ng/directive/ngRepeat))

It can also have a custom template.

We're using ng-repeat and using **item** as the var name for each element.

## Basic usage

	<lk-var model="myData.items" type="list"></lk-var>
	
## IF example

	<lk-var model="myData.items" type="list" if="item.type === 'B'"></lk-var>
	
## Custom template

	<lk-var model="myData.items" type="list">
		{{ item.title }}<br />
		type: {{ item.type }}
	</lk-var>