'use strict';

L.BusMain = {};

var MainPageVars = {
  Attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  BaseMapUrl: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  BaseMap: undefined,
  RouteCategoryList: undefined,
  MainProcess: undefined
};

(function() {
  MainPageVars.BaseMap = L.map('map').setView([23.1852, 120.4287], 11);

  L.tileLayer(MainPageVars.BaseMapUrl, {
    attribution: MainPageVars.Attribution
  }).addTo(MainPageVars.BaseMap);

  $.getJSON('LocalData/Config.json', function(data) {
    MainPageVars.MainProcess = new L.BusMain.RoutesController(data, DoneEvent);
  });

  function DoneEvent() {
    MainPageVars.MainProcess.SetDirection('forward');
    MainPageVars.MainProcess.SetDate({
      Year: '104',
      Month: 'Total'
    });
    MainPageVars.MainProcess.ApplyToMap();
  }
})();

L.BusMain.BusMainProcess = L.Class.extend({
  initialize: function() {

  }
});

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
          });
        },
        function(arg1, callback) {
          _class._CreateAllRouteLayers(arg1, Config, function() {
            callback(null, arg1);
          });
        }
      ],
      function(err, result) {
        if (result !== null) {

          DoneCallBack();
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
            _Class._DownloadEachRouteSource(singleRoute, Config, function(layer) {
              _Class.RouteLayers.push(layer);
              callbackB();
            });
          },
          function(err) {
            if (err !== undefined) {
                callbackA();
            }
          });
      },
      function(err) {
        if (err !== undefined) {
          DoneCallBack();
        }
      });
  },

  _DownloadEachRouteSource: function(CollecionUnit, ConfigData, DoneCallBack) {

    var _Class = this;

    async.series([
        function(callback) {
          $.getJSON('LocalData/Data/' + CollecionUnit.tags['ref:category'] + '/' + CollecionUnit.tags['ref:querycode'] + '/Capacity.json', function(data) {
            callback(null, data);
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('forward', CollecionUnit, function(result) {
            callback(null, result);
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('forward_extend', CollecionUnit, function(result) {
            callback(null, result);
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('backward', CollecionUnit, function(result) {
            callback(null, result);
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('backward_extend', CollecionUnit, function(result) {
            callback(null, result);
          });
        }
      ],
      function(err, results) {
        if (err !== undefined) {
          var Forwards = results[1].concat(results[2]);
          var Backwards = results[3].concat(results[4]);
          var EachLayer = new L.BusMain.RouteLayer(Forwards, Backwards, results[0], ConfigData);
          DoneCallBack(EachLayer);
        }
      });
  },

  _DownloadDirectionSource: function(strDirection, CollecionUnit, DoneCallBack) {

    var DirNums = 0;
    var Count = 0;
    var Result = [];

    //var _class = this;

    for (var i = 0; i < CollecionUnit.members.length; i++) {
      if (CollecionUnit.members[i].role === strDirection) {
        DirNums++;
      }
    }

    async.whilst(
      function() {
        return Count < DirNums;
      },
      function(callback) {

        $.getJSON('LocalData/Data/' + CollecionUnit.tags['ref:category'] + '/' + CollecionUnit.tags['ref:querycode'] + '/' + strDirection + '_' + Count + '.json', function(data) {
          Result.push(data);

          Count++;
          callback();
        });
      },
      function(err) {
        if (err !== undefined) {
          DoneCallBack(Result);
        }
      }
    );
  }
});

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

    console.log(this.ForwardPolylines);

    if (strDir === 'forward') {
      for (var i = 0; i < this.ForwardPolylines.length; i++) {
        this.addLayer(this.ForwardPolylines[i]);
      }
    }
    else if (strDir === 'backward') {
      for (var j = 0; j < this.BackwardPolylines.length; j++) {
        this.addLayer(this.BackwardPolylines[j]);
      }
    }
  },

  SetDate: function(TargetDate) {
    var GettedColour = this._CacaulateColourFromRange(this.ColourRangeJson, this.CapacityJson, TargetDate);

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

      if (CurrentCapacity === 0) {
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
