'use strict';

var request = require('request');
var async = require('async');

module.exports = function(grunt) {
  grunt.registerTask('get-collection', function() {

    var done = this.async();

    var OverPassTaiwanUrl = 'https://overpass.nchc.org.tw/api/interpreter?data=';

    var OverPassMainUrl = 'https://overpass.nchc.org.tw/api/interpreter?data=';
    var OverpassQuery1 = '[out:json];relation["network"="';
    var OverpassQuery2 = '"]["route_master"="bus"];(._;>;);out body;';

    /*************************  Async Function  **************************/

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

    var DownloadAllRoutesJson = function(arg, callback) {
      grunt.log.writeln('Downloading Route Data...');

      request(OverPassTaiwanUrl + encodeURIComponent(OverpassQuery1 + arg.TargetNetwork + OverpassQuery2), function(error, response, body) {
        if (error) {
          grunt.log.writeln('OverPass Error :' + error.message);
          callback(error, null);
        }
        else {
          callback(null, body);
        }
      });
    };

    var CollectCategory = function(arg, callback) {
      grunt.log.writeln('Collect routes , 電腦也會選土豆!');

      var brackets = {};
      var allRoutes = JSON.parse(arg);

      allRoutes.elements.map(function(value, index) {

        //console.log(IsCategoryExist(value.tags['ref:category']));
        if (IsCategoryExist(value.tags['ref:category'], brackets) === true) {
          AddRouteToExistBrackets(value.tags['ref:category'], value, brackets);
        } else {
          AddCategoryBrackets(value.tags['ref:category'], value, brackets);
        }
      });

      //grunt.log.writeln(IsCategoryExist("A" , brackets));
      callback(null, brackets);
    };

    /*************************  Async Function  **************************/
    /*************************  Tool Function  **************************/

    var IsCategoryExist = function(categoryName, bracket) {

      var isExist = false;

      for (var property in bracket) {
        if (bracket.hasOwnProperty(categoryName)) {
          isExist = true;
        }
      }

      return isExist;
    };

    var AddCategoryBrackets = function(categoryName, TargetRouteMaster, TargetCategoryCollection) {

      var singleCategory = {
        name: categoryName,
        members: {}
      };

      singleCategory.members[TargetRouteMaster.tags['ref:querycode']] = TargetRouteMaster;

      TargetCategoryCollection[categoryName] = singleCategory;
    };

    var AddRouteToExistBrackets = function(categoryName, TargetRouteMaster, TargetCategoryCollection) {
      TargetCategoryCollection[categoryName].members[TargetRouteMaster.tags['ref:querycode']] = TargetRouteMaster;
    };

    /*************************  Tool Function  **************************/

    async.waterfall([LoadConfigJSON, DownloadAllRoutesJson, CollectCategory],
      function(err, result) {

        var resultString;

        if (err) {
          grunt.log.errorlns(err);
          done(false);
        }
        else {
          resultString = JSON.stringify(result);
          grunt.file.write('LocalData/Data/Collection.json',resultString);
          done(true);
        }
      });

  });
};
