'use strict';


L.BusMain = {};

L.BusMain.MainPageVars = {
  Attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
  BaseMapUrl: 'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  BaseMap: undefined,
  MainProcess: undefined
};

$(function() {
  L.BusMain.MainPageVars.BaseMap = L.map('map' , {
    zoomControl: false,
    center: [23.1852, 120.4287],
    zoom: 11
  });
  //MainPageVars.BaseMap.zoomControl.disable();

  L.tileLayer(L.BusMain.MainPageVars.BaseMapUrl, {
    attribution: L.BusMain.MainPageVars.Attribution
  }).addTo(L.BusMain.MainPageVars.BaseMap);

  L.BusMain.MainPageVars.MainProcess = L.BusMain.mainprocess();
});

L.BusMain.mainprocess = function() {
  return new L.BusMain.MainProcessor();
};

L.BusMain.MainProcessor = L.Class.extend({
  initialize: function() {
    this._RouteController = undefined;

    this._SideBar = undefined;
    this._DateSlider = undefined;

    this._Legend = undefined;
    this._DateView = undefined;
    this._TotalView = undefined;

    this._Date = {
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
        },
        function(callback) {
          $.getJSON('LocalData/Data/Collection.json', function(data) {
            callback(null , data);
          });
        }
      ],
      function(err, results) {
        _Class._RouteController = L.BusMain.routeControl(results[0] , function(error) {
          if (error === null) {
            _Class._RouteController.SetDirection('forward');
            _Class._RouteController.SetDate(_Class._Date);
            _Class._RouteController.ApplyToMap();

            _Class._InitControls(results[0] , results[1] , results[2]);

            _Class._ShowHideMask(false);
          }
          else {
            console.log('Error occured when creating layers.');
          }
        });
      });
  },

  _InitControls: function(Config , TotalCapacity , Collection) {

    var _Class = this;

    _Class._Legend = L.BusMainControl.legend(Config.CapacityControl , Config.CapacityRange);
    L.BusMain.MainPageVars.BaseMap.addControl(_Class._Legend);

    _Class._DateView = L.BusMainControl.dateview();
    L.BusMain.MainPageVars.BaseMap.addControl(_Class._DateView);
    _Class._DateView.ChangeValue(_Class._Date);

    _Class._TotalView = L.BusMainControl.ridership(TotalCapacity);
    L.BusMain.MainPageVars.BaseMap.addControl(_Class._TotalView);
    _Class._TotalView.ChangeValue(_Class._Date);

    //Slider change value event
    _Class._DateSlider = L.BusMainControl.slider(function(DateObj) {
      //console.log(DateObj.Year);
      //console.log(DateObj.Month);
      //console.log(_Controller);

      _Class._Date = DateObj;

      _Class._RouteController.SetDate(DateObj);

      _Class._DateView.ChangeValue(DateObj);
      _Class._TotalView.ChangeValue(DateObj);

    }, Config.CapacityControl);
    _Class._DateSlider.AddWidget();


    //route sidebar
    _Class._SideBar = L.BusMainControl.sidebar(
      function (e) {
        if(isNaN(e.target.id) === false){
          _Class._RouteController.SelectRoute(e.target.id , _Class._Date);
          _Class._SideBar.ChangeBtnState(e.target);
        }
      },
      function () {
        _Class._RouteController.UnselectRoute(_Class._Date);
        _Class._SideBar.RevertBtnState();
      }, Collection);
      _Class._SideBar.AddWidget();
  },

  _ShowHideMask : function (boolMask) {
    if(boolMask === true){
      $(".LoadingMask").css("display", "initial");
    }
    else {
      $(".LoadingMask").css("display", "none");
    }
  }
});

L.BusMain.routeControl = function(ConfigJson, CallbackFunction) {
  return new L.BusMain.RoutesController(ConfigJson, CallbackFunction);
};

L.BusMain.RoutesController = L.Class.extend({
  initialize: function(ConfigJson, CallbackFunction) {

    this.Config = ConfigJson;

    this.RouteLayers = {};

    this._SelectedRoute = [];

    //L.Util.setOptions(this, options);

    this._LoadRequireData(ConfigJson.CapacityRange, CallbackFunction);
  },

  SelectRoute: function (routeCode , DateObject) {
    this.RouteLayers[routeCode].Select("Yes" , DateObject);

    this._SelectedRoute.push(this.RouteLayers[routeCode]);
  },

  UnselectRoute: function (DateObject) {
    if(this._SelectedRoute.length !== 0){
      for (var i = 0; i < this._SelectedRoute.length; i++) {
        this._SelectedRoute[i].Select("No" , DateObject);
      }

      this._SelectedRoute = [];
    }
  },

  SetDirection: function(strDirection) {
    if (Object.keys(this.RouteLayers).length === 0) {
      console.log('No Layer!');
      return;
    }

    for (var singleLayer in this.RouteLayers) {
      if (this.RouteLayers.hasOwnProperty(singleLayer)) {
        this.RouteLayers[singleLayer].SetDirection(strDirection);
      }
    }
  },

  SetDate: function(DateObject) {
    if (Object.keys(this.RouteLayers).length === 0) {
      console.log('No Layer!');
      return;
    }

    for (var singleLayer in this.RouteLayers) {
      if (this.RouteLayers.hasOwnProperty(singleLayer)) {
        this.RouteLayers[singleLayer].SetDate(DateObject);
      }
    }
  },

  ApplyToMap: function() {
    if (Object.keys(this.RouteLayers).length === 0) {
      console.log('No Layer!');
      return;
    }

    for (var singleLayer in this.RouteLayers) {
      if (this.RouteLayers.hasOwnProperty(singleLayer)) {
        this.RouteLayers[singleLayer].addTo(L.BusMain.MainPageVars.BaseMap);
      }
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
                _Class.RouteLayers[singleRoute.tags['ref:querycode']] = layer;
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
          _Class._DownloadDirectionSource('Forward', CollecionUnit, function(err, result) {
            if (err !== null) {
              callback(err, null);
            } else {
              callback(null, result);
            }
          });
        },
        function(callback) {
          _Class._DownloadDirectionSource('Backward', CollecionUnit, function(err, result) {
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
          var EachLayer = L.BusMain.routeLayer(results[1], results[2], results[0], ConfigData);
          DoneCallBack(null, EachLayer);
        } else {
          console.log(CollecionUnit.tags['ref:querycode'] + " DownloadEachRouteSource Error: " + err);
          DoneCallBack(err, null);
        }
      });
  },

  _DownloadDirectionSource: function(strDirection, CollectionUnit, DoneCallBack) {
    if(strDirection === 'Forward' || strDirection === 'Backward'){
      $.getJSON('LocalData/Data/' + CollectionUnit.tags['ref:category'] + '/' + CollectionUnit.tags['ref:querycode'] + '/' + strDirection  + '.json', function(data) {
        DoneCallBack(null, data);
      }).fail(function() {
        DoneCallBack(strDirection  + " direction is missing or broken.", null);
      });
    }
  }
});

L.BusMain.routeLayer = function(ForwardSource, BackwardSource, CapaJson, RangeJson) {
  return new L.BusMain.RouteLayer(ForwardSource, BackwardSource, CapaJson, RangeJson);
};

L.BusMain.RouteLayer = L.LayerGroup.extend({
  initialize: function(ForwardSource, BackwardSource, CapaJson, RangeJson) {

    L.FeatureGroup.prototype.initialize.call(this);

    this.ForwardPolylines = this._FormatPolyline(ForwardSource);
    this.BackwardPolylines = this._FormatPolyline(BackwardSource);
    this.CapacityJson = CapaJson;

    this.ColourRangeJson = RangeJson;

    this.IsRouteSelected = false;
  },

  Select: function (IsSelected , TargetDate) {

    var _GettedColour = this._GetRange(this.ColourRangeJson, this.CapacityJson, TargetDate);
    var _showedPolylines = this.getLayers();
    var _GettedColourCode;

    if (_showedPolylines.length > 0) {

      if(IsSelected === "Yes"){
        _GettedColourCode = _GettedColour.SelectedColour;
        this.IsRouteSelected = true;
      }
      else if(IsSelected === "No"){
        _GettedColourCode = _GettedColour.Colour;
        this.IsRouteSelected = false;
      }

      for (var i = 0; i < _showedPolylines.length; i++) {
        _showedPolylines[i].setStyle({
          color: _GettedColourCode
        });
      }
    }
  },

  SetDirection: function(strDir) {
    this.clearLayers();

    //console.log(this.ForwardPolylines);

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
    //console.log(this.CapacityJson);
    //console.log(TargetDate);
    var _GettedColour = this._GetRange(this.ColourRangeJson, this.CapacityJson, TargetDate);

    //console.log('------------------------------');
    //console.log(this.ColourRangeJson);
    //console.log(this.CapacityJson);
    //console.log(GettedColour);

    var _showedPolylines = this.getLayers();

    if (_showedPolylines.length > 0) {
      this._ChangeColour(_GettedColour, _showedPolylines);
    }
  },

  //////////////////// Manipulation Functions /////////////////////////

  _FormatPolyline: function(SourceArray) {

    var _resultPolylines = [];

    for (var i = 0; i < SourceArray.length; i++) {
      if (SourceArray[i].type === "way") {
        //console.log(this.SourceJsons[i].elements[j].geometry);
        var polyline = L.polyline(SourceArray[i].geometry, {
          color: '#C7C7C7',
          weight: 5,
          clickable: false
        });
        _resultPolylines.push(polyline);
      }
    }

    return _resultPolylines;
  },

  _ChangeColour: function(resultObject, polylineArray) {

    var _ColourCode;

    if(this.IsRouteSelected === true){
      _ColourCode = resultObject.SelectedColour;
    }
    else {
      _ColourCode = resultObject.Colour;
    }

    for (var i = 0; i < polylineArray.length; i++) {
      polylineArray[i].setStyle({
        color: _ColourCode,
        weight: resultObject.Width
      });
    }

    return this;
  },

  _GetRange: function(ColourRange, Capacity, TargetDate) {

    var _result;

    if (Capacity[TargetDate.Year] === undefined) {
      _result = this._GetZeroCapacityColour(ColourRange);
    } else {
      var CurrentCapacity = Capacity[TargetDate.Year][TargetDate.Month];
      //console.log(CurrentCapacity);

      if (parseInt(CurrentCapacity) === 0) {
        _result = this._GetZeroCapacityColour(ColourRange);
      } else {
        for (var i = 0; i < ColourRange.length; i++) {
          if (CurrentCapacity < ColourRange[i].MaxCapacity && CurrentCapacity > ColourRange[i].MinCapacity) {
            _result = {
              Colour: ColourRange[i].ColourCode,
              SelectedColour: ColourRange[i].SelectedColourCode,
              Width: ColourRange[i].Width
            };
            break;
          }
        }
      }
    }

    return _result;
  },

  _GetZeroCapacityColour: function(ColourRange) {

    var _result;

    for (var k = 0; k < ColourRange.length; k++) {
      if (ColourRange[k].MaxCapacity === 0 && ColourRange[k].MinCapacity === 0) {
        _result = {
          Colour: ColourRange[k].ColourCode,
          HightlightColour: ColourRange[k].HightlightColourCode
        };
        break;
      }
    }

    return _result;
  }
});
