'use strict';

var request = require('request');
var async = require('async');

module.exports = function(grunt) {
    grunt.registerTask('fetch-routes', function(categoryArg, routeArg , DownloadOrigin) {
        var done = this.async();

        var OverPassTaiwanUrl = 'https://overpass.nchc.org.tw/api/interpreter?data=';
        var OverPassMainUrl = 'https://overpass-api.de/api/interpreter?data=';

        var OverpassQuery1 = '[out:json];rel(';
        var OverpassQuery2 = ');out meta;way(r);out geom;';

        var DownloadOneRoute = function(buckets, callback) {
            //TODO: Should use querycode to download single route.
            _DownloadSingleRoute(buckets[categoryArg].members[routeArg], function(err) {
                callback(err);
            });
        };

        var DownloadOneCategory = function(buckets, callback) {
            _DownloadSingleCategory(buckets[categoryArg], function(err) {
                callback(err);
            });
        };

        /*************************  Async Function  **************************/

        var LoadCollection = function(callback) {
            grunt.log.writeln('Load Collection JSON...');

            var _collection = grunt.file.readJSON("LocalData/Data/Collection.json");

            if (_collection !== undefined) {
                callback(null, _collection);
            } else {
                callback("Can't find Collection json file.", null);
            }
        };

        var DownloadAllCategories = function(buckets, callback) {
            grunt.log.writeln('------------------- Message Start ----------------');
            grunt.log.writeln('Start Download ...');

            var index = 0;

            async.whilst(
                function() {
                    return index < Object.keys(buckets).length;
                },
                function(callback) {

                    var categoryIndex = Object.keys(buckets)[index];

                    _DownloadSingleCategory(buckets[categoryIndex], function(err) {
                        index++;
                        callback(err);
                    });
                },
                function(err) {
                    if (err !== undefined) {
                        grunt.log.writeln('Download categories error ! Stop Unexceptly.');
                        callback(err, null);
                    }
                    else {
                        grunt.log.writeln('Every category files download successfully !');
                        grunt.log.writeln('------------------- Message End ----------------');
                        callback(null, buckets);
                    }
                }
            );
        };

        var _DownloadSingleCategory = function(Category, DoneCallback) {

            grunt.log.writeln('------------------- Message Start ----------------');
            grunt.log.writeln('Download routes in category :' + Category.name);

            var index = 0;

            async.whilst(
                function() {
                    return index < Object.keys(Category.members).length;
                },
                function(callback) {

                    var routeIndex = Object.keys(Category.members)[index];

                    _DownloadSingleRoute(Category.members[routeIndex], function(err) {
                        index++;
                        callback(err);
                    });
                },
                function(err) {
                    if (err !== null) {
                        grunt.log.writeln('Download routes error ! Stop Unexceptly.');
                    }
                    else {
                        grunt.log.writeln('Every route files download successfully !');
                        grunt.log.writeln('------------------- Message End ----------------');
                    }
                    DoneCallback(err);
                }
            );
        };

        var _DownloadSingleRoute = function(singleRoute, DoneCallback) {

            grunt.log.writeln('------------------- Message Start ----------------');
            grunt.log.writeln('Download Route :' + singleRoute.tags.name);

            var _ForwardRelation = [];
            var _BackwardRelation = [];

            singleRoute.members.map(function(value, index) {
                if (value.role === 'forward' || value.role === 'forward_extend') {
                    _ForwardRelation.push(value.ref);
                }
                else if (value.role === 'backward' || value.role === 'backward_extend') {
                    _BackwardRelation.push(value.ref);
                }
            });

            async.parallel([
                    function(callback) {
                        _DownloadSingleDirection(singleRoute , _ForwardRelation , function (_Result) {
                          if(Array.isArray(_Result) === true){
                            callback(null, _Result);
                          }
                          else {
                            callback(_Result , null);
                          }

                        });
                    },
                    function(callback) {
                        _DownloadSingleDirection(singleRoute , _BackwardRelation , function (_Result) {
                          if(Array.isArray(_Result) === true){
                            callback(null, _Result);
                          }
                          else {
                            callback(_Result , null);
                          }
                        });
                    }
                ],
                function(err, results) {

                  if(err === null){
                    grunt.file.write('LocalData/Data/' + singleRoute.tags['ref:category'] + '/' + singleRoute.tags['ref:querycode'] + '/' + 'Forward.json', JSON.stringify(results[0]));
                    grunt.file.write('LocalData/Data/' + singleRoute.tags['ref:category'] + '/' + singleRoute.tags['ref:querycode'] + '/' + 'Backward.json', JSON.stringify(results[1]));

                    grunt.log.writeln('Every direction files download successfully !');
                    grunt.log.writeln('------------------- Message End ----------------');
                  }
                  else {
                    grunt.log.writeln('Download directions error ! Stop Unexceptly.');
                  }

                  DoneCallback(err);
                });
        };

        var _DownloadSingleDirection = function(singleRoute, singleDirectionArray, DoneCallback) {

            var _index = 0;

            var _Result = [];

            async.whilst(
                function() {
                    return _index < singleDirectionArray.length;
                },
                function(callback) {
                    request(OverPassTaiwanUrl + OverpassQuery1 + singleDirectionArray[_index] + OverpassQuery2, function(error, response, body) {
                        if (error) {
                            grunt.log.writeln('Download Error :' + error.message);
                        }
                        else {
                            JSON.parse(body).elements.map(function(value, index) {
                                if (value.type === 'way') {
                                    _Result.push(value);
                                }
                            });
                        }

                        _index++;
                        callback(error);
                    });
                },
                function(err) {
                    if(err !== null){
                      DoneCallback(err);
                    }
                    else {
                      DoneCallback(_Result);
                    }
                }
            );


        };

        /*************************  Async Function  **************************/
        /*************************** Asyncs *********************************/

        if (arguments.length === 0) {
            async.waterfall([LoadCollection, DownloadAllCategories],
                function(err, result) {
                    if (err) {
                        grunt.log.errorlns(err);
                        done(false);
                    } else {
                        done(true);
                    }
                });
        }
        else if (arguments.length === 1) {
            async.waterfall([LoadCollection, DownloadOneCategory],
                function(err, result) {
                    if (err) {
                        grunt.log.errorlns(err);
                        done(false);
                    } else {
                        done(true);
                    }
                });
        }
        else if (arguments.length === 2) {
            async.waterfall([LoadCollection, DownloadOneRoute],
                function(err, result) {
                    if (err) {
                        grunt.log.errorlns(err);
                        done(false);
                    } else {
                        done(true);
                    }
                });
        }

    });
};
