/*jslint node:true */
'use strict';


module.exports = function browserify(grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-browserify');

    // Options
    return {
        build: {
            files: grunt.file.expandMapping('editor/*.js', 'htdocs/js/', {
                flatten: true,
                ext: '.js'
            }),
            options: {
                watch: false,
                keepAlive: false,
                debug: true
            }
        }
    };
};