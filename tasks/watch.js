/*jslint node:true */
'use strict';

module.exports = function watch(grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');

    return {
        // watchify all build sub tasks 
        jslint: {
            files: ['editor/**/*.js'],
            tasks: ['jslint']
        },
        browserify: {
            files: ['editor/**/*.js'],
            tasks: ['browserify']
        }
    };
};