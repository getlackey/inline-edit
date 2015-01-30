/*jslint node:true */
'use strict';

module.exports = function uglify(grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-contrib-uglify');

    // Options
    return {
        options: {
            banner: '/*!*/\n\/*!\t[grunt] <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n/*!*/\n\n',
            sourceMap: true,
            mangle: false
        },
        scripts: {
            files: grunt.file.expandMapping('htdocs/js/**/*.js', 'htdocs/jsmin/', {
                flatten: true
            })
        }
    };
};