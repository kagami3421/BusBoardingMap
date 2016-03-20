'use strict';

var async = require('async');

module.exports = function(grunt) {
  grunt.registerTask('format-capacity', function() {
    var done = this.async();

    var LoadCollection = function(callback) {
      grunt.log.writeln('Load Collection JSON...');

      var _collection = grunt.file.readJSON("LocalData/Data/Collection.json");

      if (_collection !== undefined) {
        callback(null, _collection);
      } else {
        callback("Can't find Collection json file.", null);
      }
    };

    var LoadCapacity = function(callback) {
      grunt.log.writeln('Load Capacity JSON...');

      var _collection = grunt.file.readJSON("LocalData/Data/Capacity.json");

      if (_collection !== undefined) {
        callback(null, _collection);
      } else {
        callback("Can't find Capacity json file.", null);
      }
    };

    var LoadConfigJSON = function(callback) {
      grunt.log.writeln('Load Config JSON...');

      //Load config file
      var _config = grunt.file.readJSON("LocalData/Config.json");

      if (_config !== undefined) {
        callback(null, _config);
      } else {
        callback("Can't find config json file.", null);
      }
    };

    var FindCapacitiesByRoute = function(CapacityFile , TargetRoute , ConfigJson) {

      grunt.log.writeln('Collect capacity data of ' + TargetRoute.tags.name);

      var Output = [];
      CapacityFile.map(function(value, index) {
        if(TargetRoute.tags.ref.localeCompare(value[ConfigJson.CapactiyData.RefCode]) === 0){
          Output.push(value);
        }
        else {
          if(value[ConfigJson.CapactiyData.RefCode].indexOf(TargetRoute.tags.ref) !== -1){
            Output.push(value);
          }
        }
      });

      MakeCapacityFile(Output , TargetRoute , ConfigJson);
    };

    var MakeCapacityFile = function(FindedCapacities, Route, ConfigJson) {
      var Output = {};
      var OutputString;

      var Template = ConfigJson.CapactiyData.OutputTemplate;
      FindedCapacities.map(function(value, index) {
        var EachFormatted = {
          Total: value[Template.Year],
          January: value[Template.January],
          February: value[Template.February],
          March: value[Template.March],
          April: value[Template.April],
          May: value[Template.May],
          June: value[Template.June],
          July: value[Template.July],
          August: value[Template.August],
          September: value[Template.September],
          October: value[Template.October],
          November: value[Template.November],
          December: value[Template.December]
        };

        var WesternYear = parseInt(value[Template.YearCode]) + 1911;

        Output[WesternYear] = EachFormatted;
      });

      OutputString = JSON.stringify(Output);
      grunt.file.write('LocalData/Data/'+ Route.tags['ref:category'] + '/' + Route.tags['ref:querycode'] +'/Capacity.json' , OutputString);
      grunt.log.writeln('Capacity data created.');
    };

    /********************** Main  ****************************/

    async.parallel([LoadCollection, LoadCapacity, LoadConfigJSON],
      function(err, results) {
          if(err !== null){
            grunt.log.writeln(err);
            done(false);
          }
          else {
            for (var value in results[0]) {
              if (results[0].hasOwnProperty(value)) {
                results[0][value].members.map(function(route, index) {
                  FindCapacitiesByRoute(results[1] , route , results[2]);
                });
              }
            }
            done(true);
          }
      });
  });
};
