var configify = require('config-browserify');

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    browserify: {
      client: {
        src: "src/index.js",
        dest: "dist/bundle.js",
        options: {
            transform: [configify],
            browserifyOptions: {
              standalone: "ExchangeRate",
              debug: true
            }
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/bundle.min.js': ['dist/bundle.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-browserify');

  // Default task(s).
  grunt.registerTask('default', ['browserify', 'uglify']);

};
