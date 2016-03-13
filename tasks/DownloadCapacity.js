'use strict';

var request = require('request');
var async = require('async');

module.exports = function(grunt) {
  grunt.registerTask('get-capacity', function() {
    var done = this.async();

    var LoadConfigJSON = function(callback) {
      grunt.log.writeln('Load Config JSON...');

      //Load config file
      var _config = grunt.file.readJSON("LocalData/Config.json");

      if(_config !== undefined){
        callback(null, _config);
      }
      else {
        callback("Can't find config json file." , null);
      }
    };

    var DownloadCapacityJson = function(arg, callback){
      request(arg.CapactiyData.Url , function(error, response, body) {
        if (error) {
          grunt.log.writeln('Download Error :' + error.message);
          callback(error, null);
        }
        else {
          grunt.log.writeln('successfully downloaded.');
          //console.log(body);
          callback(null, body);
        }
      });
    };

    async.waterfall([LoadConfigJSON, DownloadCapacityJson],
      function(err, result) {

        //var resultString;

        if (err) {
          grunt.log.errorlns(err);
          done(false);
        } else {
          //resultString = JSON.stringify(result);
          grunt.file.write('LocalData/Data/Capacity.json', result);
          done(true);
        }
    });
  });
};
