'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: {
          'dist/scripts/MainPage.min.js': ['dev/MainPage.js'],
          'dist/scripts/MainPageControl.min.js': ['dev/MainPageControl.js']
        }
      }
    },
    cssmin: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        files: {
          'dist/css/MainPage.min.css': ['dev/MainPage.css']
        }
      }
    },
    processhtml: {
      dist: {
        options: {
          data: {
            message: 'Go to production distribution'
          }
        },
        files: {
          'index.html': ['dev/index.html']
        }
      }
    },
    sass: {
      dist: {
        files: {
          'dev/MainPage.css': 'sass/MainPage.scss'
        }
      }
    },
    watch: {
      options: {
        livereload: true
      },
      scripts: {
        files: ['sass/*.scss', 'dev/*.js', 'index.html'],
        tasks: ['sass', 'build']
      }
    },
    connect: {
      server: {
        options: {
          port: 9000,
          base: '.',
          hostname: 'localhost',
          protocol: 'http',
          livereload: true,
          open: true,
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadTasks('tasks');

  grunt.registerTask('compile-css', ['sass']);
  grunt.registerTask('build', ['uglify', 'cssmin', 'processhtml']);
  grunt.registerTask('server', ['connect', 'watch']);
};
