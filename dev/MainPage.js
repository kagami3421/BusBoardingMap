'use strict';


L.BusMain = {};

var MainPageVars = {
  Attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  BaseMapUrl: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  BaseMap: undefined,
  MainProcess: undefined
};

$(function() {
  MainPageVars.BaseMap = L.map('map' , {
    zoomControl: false,
    center: [23.1852, 120.4287],
    zoom: 11
  });
  //MainPageVars.BaseMap.zoomControl.disable();

  L.tileLayer(MainPageVars.BaseMapUrl, {
    attribution: MainPageVars.Attribution
  }).addTo(MainPageVars.BaseMap);

  MainPageVars.MainProcess = L.BusMain.mainprocess();
});

L.BusMain.mainprocess = function() {
  return new L.BusMain.MainProcessor();
};

L.BusMain.MainProcessor = L.Class.extend({
  initialize: function() {
    this._RouteController = undefined;
    this._DateSlider = undefined;

    this._Legend = undefined;
    this._DateView = undefined;
    this._TotalView = undefined;

    this._InitDate = {
      Year: '2014',
      Month: 'Total'
    };

    this._ShowHideMask(true);

    this._InitData();
  },

  _InitData: function() {

    var _Class = this;

    async.parallel([
        function(callback) {
          $.getJSON('LocalData/Config.json', function(data) {
            callback(null , data);
          });
        },
        function(callback) {
          $.getJSON('LocalData/Data/TotalCapacity.json', function(data) {
            callback(null , data);
          });
        }
      ],
      function(err, results) {
        _Class._RouteController = L.BusMain.routeControl(results[0] , function(error) {
          if (error === null) {
            _Class._RouteController.SetDirection('forward');
            _Class._RouteController.SetDate(_Class._InitDate);
            _Class._RouteController.ApplyToMap();

            _Class._InitControls(results[0] , results[1]);

            _Class._ShowHideMask(false);
          }
          else {
            console.log('Error occured when creating layers.');
          }
        });
      });
  },

  _InitControls: function(Config , TotalCapacity) {

    var _Class = this;

    _Class._Legend = L.BusMainControl.legend(Config.CapacityRange);
    MainPageVars.BaseMap.addControl(_Class._Legend);

    _Class._DateView = L.BusMainControl.dateview();
    MainPageVars.BaseMap.addControl(_Class._DateView);
    _Class._DateView.ChangeValue(_Class._InitDate);

    _Class._TotalView = L.BusMainControl.ridership(TotalCapacity);
    MainPageVars.BaseMap.addControl(_Class._TotalView);
    _Class._TotalView.ChangeValue(_Class._InitDate);

    //Slider change value event
    _Class._DateSlider = L.BusMainControl.slider(function(DateObj) {
      //console.log(DateObj.Year);
      //console.log(DateObj.Month);
      //console.log(_Controller);

      _Class._RouteController.SetDate(DateObj);

      _Class._DateView.ChangeValue(DateObj);
      _Class._TotalView.ChangeValue(DateObj);

    }, Config.CapacityControl);
    MainPageVars.BaseMap.addControl(_Class._DateSlider);
  },

  _ShowHideMask : function (boolMask) {
    if(boolMask === true){
      $(".LoadingMask").css("animation", "fadein 2s");
    }
    else {
      $(".LoadingMask").css("animation", "fadein 2s");
    }
  }
});

L.BusMain.routeControl = function(ConfigJson, CallbackFunction) {
  return new L.BusMain.RoutesController(ConfigJson, CallbackFunction);
};

L.BusMain.RoutesController = L.Class.extend({
  initialize: function(ConfigJson, CallbackFunction) {

    this.Config = ConfigJson;

    this.RouteLayers = [];

    //L.Util.setOptions(this, options);

    this._LoadRequireData(ConfigJson.CapacityRange, CallbackFunction);
  },

  SetDirection: function(strDirection) {
    if (this.RouteLayers.length === 0) {
      console.log('No Layer!');
      return;
    }

    for (var i = 0; i < this.RouteLayers.length; i++) {
      this.RouteLayers[i].SetDirection(strDirection);
    }
  },

  SetDate: function(DateObject) {
    if (this.RouteLayers.length === 0) {
      console.log('No Layer!');
      return;
    }

    for (var i = 0; i < this.RouteLayers.length; i++) {
      this.RouteLayers[i].SetDate(DateObject);
    }
  },

  ApplyToMap: function() {
    if (this.RouteLayers.length === 0) {
      console.log('No Layer!');
      return;
    }

    for (var i = 0; i < this.RouteLayers.length; i++) {
      this.RouteLayers[i].addTo(MainPageVars.BaseMap);
    }
  },

  _LoadRequireData: function(Config, DoneCallBack) {

    var _class = this;

    async.waterfall([
        function(callback) {
          $.getJSON('LocalData/Data/Collection.json', function(data) {
            callback(null, data);
          }).fail(function() {
            callback("collection_error", null);
          });
        },
        function(arg1, callback) {
          _class._CreateAllRouteLayers(arg1, Config, function(err) {
            if (err === null) {
              callback(null, arg1);
            } else {
              callback(err, null);
            }
          });
        }
      ],
      function(err, result) {
        if (err === null) {
          DoneCallBack(null);
        } else {
          DoneCallBack(err);
        }
      });
  },


  _CreateAllRouteLayers: function(Collection, Config, DoneCallBack) {

    var _Class = this;

    var CategoryList = [];

    for (var category in Collection) {
      if (Collection.hasOwnProperty(category)) {
        CategoryList.push(category);
      }
    }

    async.each(CategoryList, function(category, callbackA) {
        async.each(Collection[category].members, function(singleRoute, callbackB) {
            _Class._DownloadEachRouteSource(singleRoute, Config, function(error, layer) {
              if (error !== null) {
                callbackB(error);
              } else {
                _Class.RouteLayers.push(layer);
                callbackB(null);
              }
            });
          },
          function(err) {
            if (err !== null) {
              callbackA(err);
            } else {
              callbackA(null);
            }
          });
      },
      function(err) {
        if (err !== null) {
          DoneCallBack(err);
        } else {
          DoneCallBack(null);
        }
      });
  },

  _DownloadEachRouteSource: function(CollecionUnit, ConfigData, DoneCallBack) {

    var _Class = this;

    async.series([
        function(callback) {
          $.getJSON('LocalData/Data/' + CollecionUnit.tags['ref:category'] + '/' + CollecionUnit.tags['ref:querycode'] + '/Capacity.json', function(data) {
            callback(null, data);
          }).fail(function() {
            callback("capacity_error", null);
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('forward', CollecionUnit, function(err, result) {
            if (err !== null) {
              callback(err, null);
            } else {
              callback(null, result);
            }
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('forward_extend', CollecionUnit, function(err, result) {
            if (err !== null) {
              callback(err, null);
            } else {
              callback(null, result);
            }
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('backward', CollecionUnit, function(err, result) {
            if (err !== null) {
              callback(err, null);
            } else {
              callback(null, result);
            }
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('backward_extend', CollecionUnit, function(err, result) {
            if (err !== null) {
              callback(err, null);
            } else {
              callback(null, result);
            }
          });
        }
      ],
      function(err, results) {
        if (err === null) {
          var Forwards = results[1].concat(results[2]);
          var Backwards = results[3].concat(results[4]);
          var EachLayer = L.BusMain.routeLayer(Forwards, Backwards, results[0], ConfigData);
          DoneCallBack(null, EachLayer);
        } else {
          console.log(CollecionUnit.tags['ref:querycode'] + " DownloadEachRouteSource Error: " + err);
          DoneCallBack(err, null);
        }
      });
  },

  _DownloadDirectionSource: function(strDirection, CollectionUnit, DoneCallBack) {

    var DirNums = 0;
    var Count = 0;
    var Result = [];

    //var _class = this;

    for (var i = 0; i < CollectionUnit.members.length; i++) {
      if (CollectionUnit.members[i].role === strDirection) {
        DirNums++;
      }
    }

    if (DirNums === 0) {
      DoneCallBack(null, Result);
    } else {

      async.whilst(
        function() {
          return Count < DirNums;
        },
        function(callback) {

          $.getJSON('LocalData/Data/' + CollectionUnit.tags['ref:category'] + '/' + CollectionUnit.tags['ref:querycode'] + '/' + strDirection + '_' + Count + '.json', function(data) {
            Result.push(data);
            Count++;
            callback(null, Count);
          }).fail(function() {
            callback(strDirection, null);
          });
        },
        function(err, result) {
          if (err !== null) {
            DoneCallBack(err + " direction is missing or broken.", null);
          } else {
            DoneCallBack(null, Result);
          }
        }
      );

    }
  }
});

L.BusMain.routeLayer = function(ForwardSource, BackwardSource, CapaJson, RangeJson) {
  return new L.BusMain.RouteLayer(ForwardSource, BackwardSource, CapaJson, RangeJson);
};

L.BusMain.RouteLayer = L.FeatureGroup.extend({
  initialize: function(ForwardSource, BackwardSource, CapaJson, RangeJson) {

    L.FeatureGroup.prototype.initialize.call(this);

    this.ForwardPolylines = this._FormatPolyline(ForwardSource);
    this.BackwardPolylines = this._FormatPolyline(BackwardSource);
    this.CapacityJson = CapaJson;

    this.ColourRangeJson = RangeJson;
  },

  SetDirection: function(strDir) {
    this.clearLayers();

    //console.log(this.ForwardPolylines);

    if (strDir === 'forward') {
      for (var i = 0; i < this.ForwardPolylines.length; i++) {
        this.addLayer(this.ForwardPolylines[i]);
      }
    } else if (strDir === 'backward') {
      for (var j = 0; j < this.BackwardPolylines.length; j++) {
        this.addLayer(this.BackwardPolylines[j]);
      }
    }
  },

  SetDate: function(TargetDate) {
    //console.log(this.CapacityJson);
    //console.log(TargetDate);
    var GettedColour = this._CacaulateColourFromRange(this.ColourRangeJson, this.CapacityJson, TargetDate);

    //console.log('------------------------------');
    //console.log(this.ColourRangeJson);
    //console.log(this.CapacityJson);
    //console.log(GettedColour);

    var showedPolylines = this.getLayers();

    if (showedPolylines.length > 0) {
      this._ChangeColour(GettedColour.Colour, showedPolylines);
    }
  },

  //////////////////// Manipulation Functions /////////////////////////

  _FormatPolyline: function(SourceArray) {

    var resultPolylines = [];

    for (var i = 0; i < SourceArray.length; i++) {
      for (var j = 0; j < SourceArray[i].elements.length; j++) {
        if (SourceArray[i].elements[j].type === "way") {
          //console.log(this.SourceJsons[i].elements[j].geometry);
          var polyline = L.polyline(SourceArray[i].elements[j].geometry, {
            color: '#C7C7C7'
          });
          resultPolylines.push(polyline);
        }
      }
    }

    return resultPolylines;
  },

  _ChangeColour: function(colourString, polylineArray) {
    for (var i = 0; i < polylineArray.length; i++) {
      polylineArray[i].setStyle({
        color: colourString
      });
    }
  },

  _CacaulateColourFromRange: function(ColourRange, Capacity, TargetDate) {

    var result;

    if (Capacity[TargetDate.Year] === undefined) {
      result = this._GetZeroCapacityColour(ColourRange);
    } else {
      var CurrentCapacity = Capacity[TargetDate.Year][TargetDate.Month];
      //console.log(CurrentCapacity);

      if (parseInt(CurrentCapacity) === 0) {
        result = this._GetZeroCapacityColour(ColourRange);
      } else {
        for (var i = 0; i < ColourRange.length; i++) {
          if (CurrentCapacity < ColourRange[i].MaxCapacity && CurrentCapacity > ColourRange[i].MinCapacity) {
            result = {
              Colour: ColourRange[i].ColourCode,
              HightlightColour: ColourRange[i].HightlightColourCode
            };
            break;
          }
        }
      }
    }

    return result;
  },

  _GetZeroCapacityColour: function(ColourRange) {

    var result;

    for (var k = 0; k < ColourRange.length; k++) {
      if (ColourRange[k].MaxCapacity === 0 && ColourRange[k].MinCapacity === 0) {
        result = {
          Colour: ColourRange[k].ColourCode,
          HightlightColour: ColourRange[k].HightlightColourCode
        };
        break;
      }
    }

    return result;
  }
});
