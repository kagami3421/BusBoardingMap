'use strict';

var async = require('async');

module.exports = function(grunt) {
  grunt.registerTask('total-capacity', function() {
    var done = this.async();

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

    var SumAllCapacitiesByMonth = function(ConfigJson, CapacityJson) {

      var Template = ConfigJson.CapactiyData.OutputTemplate;
      var OutputString;
      var YearOutputHash = {};



      CapacityJson.map(function(value, index) {

        var YearOfInterator = parseInt(value[Template.YearCode]) + 1911;


        //Create New Bracket if it not exist.
        if (YearOutputHash.hasOwnProperty(YearOfInterator) === false) {

          var SingleYearTotal = {
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

          YearOutputHash[YearOfInterator] = SingleYearTotal;
        }
        else {

          YearOutputHash[YearOfInterator].Total = parseInt(YearOutputHash[YearOfInterator].Total) + parseInt(value[Template.Year]);
          YearOutputHash[YearOfInterator].January = parseInt(YearOutputHash[YearOfInterator].January) + parseInt(value[Template.January]);
          YearOutputHash[YearOfInterator].February = parseInt(YearOutputHash[YearOfInterator].February) + parseInt(value[Template.February]);
          YearOutputHash[YearOfInterator].March = parseInt(YearOutputHash[YearOfInterator].March) + parseInt(value[Template.March]);
          YearOutputHash[YearOfInterator].April = parseInt(YearOutputHash[YearOfInterator].April) + parseInt(value[Template.April]);
          YearOutputHash[YearOfInterator].May = parseInt(YearOutputHash[YearOfInterator].May) + parseInt(value[Template.May]);
          YearOutputHash[YearOfInterator].June = parseInt(YearOutputHash[YearOfInterator].June) + parseInt(value[Template.June]);
          YearOutputHash[YearOfInterator].July = parseInt(YearOutputHash[YearOfInterator].July) + parseInt(value[Template.July]);
          YearOutputHash[YearOfInterator].August = parseInt(YearOutputHash[YearOfInterator].August) + parseInt(value[Template.August]);
          YearOutputHash[YearOfInterator].September = parseInt(YearOutputHash[YearOfInterator].September) + parseInt(value[Template.September]);
          YearOutputHash[YearOfInterator].October = parseInt(YearOutputHash[YearOfInterator].October) + parseInt(value[Template.October]);
          YearOutputHash[YearOfInterator].November = parseInt(YearOutputHash[YearOfInterator].November) + parseInt(value[Template.November]);
          YearOutputHash[YearOfInterator].December = parseInt(YearOutputHash[YearOfInterator].December) + parseInt(value[Template.November]);
        }
      });

      OutputString = JSON.stringify(YearOutputHash);
      grunt.file.write('LocalData/Data/TotalCapacity.json', OutputString);
      grunt.log.writeln('Total capacity data created.');

      done(true);
    };

    async.parallel([LoadCapacity, LoadConfigJSON],
      function(err, results) {
        if (err !== null) {
          grunt.log.writeln(err);
          done(false);
        } else {
          SumAllCapacitiesByMonth(results[1], results[0]);
        }
      });
  });
};
