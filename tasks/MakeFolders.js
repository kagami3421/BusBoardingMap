'use strict';

var async = require('async');

module.exports = function(grunt) {
  grunt.registerTask('make-folders', function() {
    var done = this.async();

    /********************* Async Function ****************/
    var LoadCollection = function(callback) {
      grunt.log.writeln('Load Collection JSON...');

      var _collection = grunt.file.readJSON("LocalData/Data/Collection.json");

      if(_collection !== undefined){
        callback(null, _collection);
      }
      else{
        callback("Can't find Collection json file.", null);
      }

    };

    var MakeDirTree = function(arg, callback) {
      grunt.log.writeln('Creating Directories...');

      for (var pro in arg) {
        if (grunt.file.isDir('LocalData/Data/' + arg[pro].name) === false) {
          grunt.file.mkdir('LocalData/Data/' + arg[pro].name);
        }

        if (grunt.file.isDir('LocalData/Data/' + arg[pro].name) === true) {
          arg[pro].members.map(function(value, index) {
            if (grunt.file.isDir('LocalData/Data/' + arg[pro].name + '/' + value.tags['ref:querycode']) === false) {
              grunt.file.mkdir('LocalData/Data/' + arg[pro].name + '/' + value.tags['ref:querycode']);
            }
          });
        }
      }

      callback(null, arg);

    };
    /********************* Async Function ****************/

    async.waterfall([LoadCollection, MakeDirTree],
      function(err, result) {

        var resultString;

        if (err) {
          grunt.log.errorlns(err);
          done(false);
        } else {
          resultString = JSON.stringify(result);
          grunt.file.write('LocalData/Data/Collection.json', resultString);
          done(true);
        }
      });
  });
};
