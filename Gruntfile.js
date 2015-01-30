/*jslint node:true */
'use strict';

module.exports = function (grunt) {
    // Load the project's grunt tasks from a directory
    require('grunt-config-dir')(grunt, {
        configDir: require('path').resolve('tasks')
    });

    // Register group tasks
    grunt.registerTask('build', [
        'jslint',
        'browserify',
        'shell:gruntCompact'
    ]);

    grunt.registerTask('compact', [
        'uglify'
    ]);

    // skips jslint validation for debug
    grunt.registerTask('debug', [
        'browserify',
        'watch:browserify'
    ]);

    // keeps watching for file changes
    grunt.registerTask('default', [
        'jslint',
        'browserify',
        'watch'
    ]);
};