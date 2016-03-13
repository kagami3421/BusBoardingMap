'use strict';

var request = require('request');
var async = require('async');

module.exports = function(grunt) {
  grunt.registerTask('fetch-routes', function() {
    var done = this.async();

    var OverPassTaiwanUrl = 'https://overpass.nchc.org.tw/api/interpreter?data=';

    var OverPassMainUrl = 'https://overpass-api.de/api/interpreter?data=';
    var OverpassQuery1 = '[out:json];rel(';
    var OverpassQuery2 = ');out meta;way(r);out geom;';

    /*************************  Async Function  **************************/

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

    /*************************  Async Function  **************************/
    /*************************** Asyncs *********************************/

    var DownloadAllCategories = function(buckets , callback) {
      grunt.log.writeln('------------------- Message Start ----------------');
      grunt.log.writeln('Start Download ...');

      var index = 0;

      async.whilst(
        function() {
          return index < Object.keys(buckets).length;
        },
        function(callback) {

            var categoryIndex = Object.keys(buckets)[index];

            DownloadSingleCategory(buckets[categoryIndex] , function(err){
            index++;
            callback(err);
          });
        },
        function(err) {
          if (err !== undefined) {
            grunt.log.writeln('Download categories error ! Stop Unexceptly.');
            callback(err, null);
          } else {
            grunt.log.writeln('------------------- Message End ----------------');
            grunt.log.writeln('Every category files download successfully !');
            callback(null , buckets);
          }
        }
      );
    };

    var DownloadSingleCategory = function(Category , DoneCallback) {

      grunt.log.writeln('------------------- Message Start ----------------');

      grunt.log.writeln('Download routes in category :' + Category.name);

      var index = 0;

      async.whilst(
        function() {
          return index < Category.members.length;
        },
        function(callback) {

          DownloadSingleRoute(Category.members[index] , function(err){
            index++;
            callback(err);
          });
        },
        function(err) {
          if (err !== undefined) {
            grunt.log.writeln('Download routes error ! Stop Unexceptly.');
          } else {
            grunt.log.writeln('------------------- Message End ----------------');
            grunt.log.writeln('Every route files download successfully !');
          }
          DoneCallback(err);
        }
      );
    };

    var DownloadSingleRoute = function(singleRoute , DoneCallback) {

      grunt.log.writeln('------------------- Message Start ----------------');

      grunt.log.writeln('Download Route :' + singleRoute.tags.name);

      var index = 0;
      var ExtendFIndex = 0;
      var ExtendBIndex = 0;
      var MainFIndex = 0;
      var MainBIndex = 0;

      async.whilst(
        function() {
          return index < singleRoute.members.length;
        },
        function(callback) {
          grunt.log.writeln('Download Direction :' + singleRoute.members[index].role);

          request(OverPassMainUrl + OverpassQuery1 + singleRoute.members[index].ref + OverpassQuery2, function(error, response, body) {
            if (error) {
              grunt.log.writeln('Download Error :' + error.message);
            } else {

              if(singleRoute.members[index].role === 'forward_extend'){
                grunt.file.write('LocalData/Data/' + singleRoute.tags['ref:category'] + '/' + singleRoute.tags['ref:querycode'] + '/' + singleRoute.members[index].role + '_' + ExtendFIndex + '.json', body);
                ExtendFIndex++;
              }
              else if (singleRoute.members[index].role === 'backward_extend') {
                grunt.file.write('LocalData/Data/' + singleRoute.tags['ref:category'] + '/' + singleRoute.tags['ref:querycode'] + '/' + singleRoute.members[index].role + '_' + ExtendBIndex + '.json', body);
                ExtendBIndex++;
              }
              else if (singleRoute.members[index].role === 'forward') {
                grunt.file.write('LocalData/Data/' + singleRoute.tags['ref:category'] + '/' + singleRoute.tags['ref:querycode'] + '/' + singleRoute.members[index].role + '_' + MainFIndex + '.json', body);
                MainFIndex++;
              }
              else if (singleRoute.members[index].role === 'backward') {
                grunt.file.write('LocalData/Data/' + singleRoute.tags['ref:category'] + '/' + singleRoute.tags['ref:querycode'] + '/' + singleRoute.members[index].role + '_' + MainBIndex + '.json', body);
                MainBIndex++;
              }

              grunt.log.writeln(singleRoute.members[index].role + '.json Saved.');
            }

            index++;
            callback(error);
          });
        },
        function(err) {
          if (err !== undefined) {
            grunt.log.writeln('Download directions error ! Stop Unexceptly.');
          } else {
            grunt.log.writeln('All direction files download successfully !');
            grunt.log.writeln('------------------- Message End ----------------');
          }
          DoneCallback(err);
        }
      );
    };

    /*************************** Asyncs *********************************/

    async.waterfall([LoadCollection , DownloadAllCategories],
      function(err, result) {
        if (err) {
          grunt.log.errorlns(err);
          done(false);
        } else {
          done(true);
        }
      });
  });
};
