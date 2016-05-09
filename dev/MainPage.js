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

    //HTML Control
    this._SideBar = undefined;
    this._DateSlider = undefined;

    //Leaflet Control
    this._Legend = undefined;
    this._DateView = undefined;
    this._TotalView = undefined;
    this._RouteLegend = undefined;

    this._Date = {
      Year: '2014',
      Month: 'Total'
    };


    //Init
    this._ShowHideMask(true);
    this._InitData();
  },

  _InitData: function() {

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
        this._RouteController = L.BusMain.routeControl(results[2] , results[0] , function(error) {
          if (error === null) {
            this._RouteController.SetDirection('forward');
            this._RouteController.SetDate(this._Date);
            this._RouteController.ApplyToMap();

            this._InitControls(results[0] , results[1] , results[2]);

            this._ShowHideMask(false);
          }
          else {
            console.log('Error occured when creating layers.');
          }
        }.bind(this));
      }.bind(this));
  },

  _InitControls: function(Config , TotalCapacity , Collection) {

    this._Legend = L.BusMainControl.legend(Config.CapacityControl , Config.CapacityRange);
    L.BusMain.MainPageVars.BaseMap.addControl(this._Legend);

    this._DateView = L.BusMainControl.dateview();
    L.BusMain.MainPageVars.BaseMap.addControl(this._DateView);
    this._DateView.ChangeValue(this._Date);

    this._TotalView = L.BusMainControl.ridership(TotalCapacity);
    L.BusMain.MainPageVars.BaseMap.addControl(this._TotalView);
    this._TotalView.ChangeValue(this._Date , null);

    this._RouteLegend = L.BusMainControl.routelegend();
    //L.BusMain.MainPageVars.BaseMap.addControl(this._RouteLegend);
    this._RouteLegend.ChangeText(null);

    //Slider change value event
    this._DateSlider = L.BusMainControl.slider(function (DateObj) {
      this._Date = DateObj;

      this._RouteController.SetDate(DateObj);

      this._DateView.ChangeValue(DateObj);

      var _GetRouteCapacity;


      if(this._RouteController.IsHasSelecetedRoute() === true){
        _GetRouteCapacity = this._RouteController.GetRouteCapacity();
      }

      this._TotalView.ChangeValue(DateObj , _GetRouteCapacity);
    }.bind(this), Config.CapacityControl);

    this._DateSlider.AddWidget();


    //route sidebar
    this._SideBar = L.BusMainControl.sidebar(
      function (e) {
        this._RemoveSelectedRoute();

        if(isNaN(e.target.id) === false){

          this._AddSelectedRoute(e);
        }
      }.bind(this),
      function () {
        if(this._RouteController.IsHasSelecetedRoute() === true){
          this._RemoveSelectedRoute();
        }
      }.bind(this), Collection);
      this._SideBar.AddWidget();
  },

  _ShowHideMask : function (boolMask) {
    if(boolMask === true){
      $(".LoadingMask").css("display", "initial");
    }
    else {
      $(".LoadingMask").css("display", "none");
    }
  },

  _RemoveSelectedRoute : function () {
    this._RouteController.UnselectRoute(this._Date);
    this._SideBar.RevertBtnState();
    this._TotalView.ChangeValue(this._Date , null);
    this._RouteLegend.ChangeText(null);
  },

  _AddSelectedRoute: function (e) {
    if(isNaN(e.target.id) === false){
      this._RouteController.SelectRoute(e.target.id , this._Date);
      L.BusMain.MainPageVars.BaseMap.fitBounds(this._RouteController.GetRouteBound(e.target.id));

      var _d = this._RouteController.GetRouteCapacity();
      var _t = this._RouteController.GetRouteTags();

      this._SideBar.ChangeBtnState(e.target);
      this._TotalView.ChangeValue(this._Date , _d);
      this._RouteLegend.ChangeText(_t);

    }
  }
});

L.BusMain.routeControl = function(CollectionJson , ConfigJson, CallbackFunction) {
  return new L.BusMain.RoutesController(CollectionJson , ConfigJson, CallbackFunction);
};

L.BusMain.RoutesController = L.Class.extend({
  initialize: function(CollectionJson , ConfigJson, CallbackFunction) {

    this.Config = ConfigJson;

    this.RouteLayers = {};

    this._SelectedRoute = null;
    this._SelectedRouteCode = 0;

    //L.Util.setOptions(this, options);

    this._CreateAllRouteLayers(CollectionJson , ConfigJson.CapacityRange, CallbackFunction);
  },

  /************ Select/UnselectRoute Events ***************/

  IsHasSelecetedRoute: function () {
    return this._SelectedRoute !== null;
  },

  SelectRoute: function (routeCode , DateObject) {
    this.RouteLayers[routeCode].Select("Yes" , DateObject);
    this.RouteLayers[routeCode].bringToFront();

    this._SelectedRouteCode = routeCode;
    this._SelectedRoute = this.RouteLayers[routeCode];
  },

  UnselectRoute: function (DateObject) {
    if(this._SelectedRoute !== null){
      this._SelectedRoute.Select("No" , DateObject);
      this._SelectedRoute.bringToBack();

      this._SelectedRouteCode = 0;
      this._SelectedRoute = null;
    }
  },

  GetRouteBound: function (routeCode) {
    return this.RouteLayers[routeCode].getBounds();
  },

  GetRouteCapacity : function () {
    return this.RouteLayers[this._SelectedRouteCode].GetCapacityJson();
  },

  /***************************************************/

  GetRouteTags : function () {
    return this.RouteLayers[this._SelectedRouteCode].GetRouteTags();
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

  _CreateAllRouteLayers: function(Collection, Config, DoneCallBack) {

    var CategoryList = [];

    for (var category in Collection) {
      if (Collection.hasOwnProperty(category)) {
        CategoryList.push(category);
      }
    }

    async.each(CategoryList, function(category, callbackA) {
        async.each(Collection[category].members, function(singleRoute, callbackB) {
            this._DownloadEachRouteSource(singleRoute, Config, function(error, layer) {
              if (error !== null) {
                callbackB(error);
              } else {
                this.RouteLayers[singleRoute.tags['ref:querycode']] = layer;
                callbackB(null);
              }
            }.bind(this));
          }.bind(this),
          function(err) {
            if (err !== null) {
              callbackA(err);
            } else {
              callbackA(null);
            }
          });
      }.bind(this),
      function(err) {
        if (err !== null) {
          DoneCallBack(err);
        } else {
          DoneCallBack(null);
        }
      });
  },

  _DownloadEachRouteSource: function(CollectionUnit, ConfigData, DoneCallBack) {

    async.series([
        function(callback) {
          $.getJSON('LocalData/Data/' + CollectionUnit.tags['ref:category'] + '/' + CollectionUnit.tags['ref:querycode'] + '/Capacity.json', function(data) {
            callback(null, data);
          }).fail(function() {
            callback("capacity_error", null);
          });
        },
        function(callback) {
          $.getJSON('LocalData/Data/' + CollectionUnit.tags['ref:category'] + '/' + CollectionUnit.tags['ref:querycode'] + '/Geometry.json', function(data) {
            callback(null, data);
          }).fail(function() {
            callback("Geometry is missing or broken.", null);
          });
        }.bind(this)
      ],
      function(err, results) {
        if (err === null) {
          var EachLayer = L.BusMain.routeLayer(results[1] , results[0], ConfigData , CollectionUnit.tags);
          DoneCallBack(null, EachLayer);
        } else {
          console.log(CollectionUnit.tags['ref:querycode'] + " DownloadEachRouteSource Error: " + err);
          DoneCallBack(err, null);
        }
      });
  }

  /* _DownloadDirectionSource: function(strDirection, CollectionUnit, DoneCallBack) {
    if(strDirection === 'Forward' || strDirection === 'Backward'){
      $.getJSON('LocalData/Data/' + CollectionUnit.tags['ref:category'] + '/' + CollectionUnit.tags['ref:querycode'] + '/' + 'Geometry.json', function(data) {
        DoneCallBack(null, data);
      }).fail(function() {
        DoneCallBack(strDirection  + " direction is missing or broken.", null);
      });
    }
  } */
});

L.BusMain.routeLayer = function(GeometrySource, CapaJson, RangeJson , RouteTag) {
  return new L.BusMain.RouteLayer(GeometrySource, CapaJson, RangeJson , RouteTag);
};

L.BusMain.RouteLayer = L.FeatureGroup.extend({
  initialize: function(GeometrySource, CapaJson, RangeJson , RouteTag) {

    L.FeatureGroup.prototype.initialize.call(this);

    this._ForwardPolylines = this._FormatPolyline(GeometrySource.Forward);
    this._BackwardPolylines = this._FormatPolyline(GeometrySource.Backward);

    this._CapacityJson = CapaJson;
    this._ColourRangeJson = RangeJson;

    this._IsRouteSelected = false;
    this._RouteTags = RouteTag;
  },

  GetCapacityJson: function () {
    return this._CapacityJson;
  },

  GetRouteTags: function () {
    return this._RouteTags;
  },
  

  Select: function (IsSelected , TargetDate) {

    var _GettedColour = this._GetRange(this._ColourRangeJson, this._CapacityJson, TargetDate);
    var _showedPolylines = this.getLayers();
    var _GettedColourCode;
    var _PolylineOpacity = 0.5;

    if (_showedPolylines.length > 0) {

      if(IsSelected === "Yes"){
        _GettedColourCode = _GettedColour.SelectedColour;
        _PolylineOpacity = 1;
        this._IsRouteSelected = true;
      }
      else if(IsSelected === "No"){
        _GettedColourCode = _GettedColour.Colour;
        _PolylineOpacity = 0.5;
        this._IsRouteSelected = false;
      }

      for (var i = 0; i < _showedPolylines.length; i++) {
        _showedPolylines[i].setStyle({
          color: _GettedColourCode,
          opacity: _PolylineOpacity
        });
      }
    }
  },

  SetDirection: function(strDir) {
    this.clearLayers();

    //console.log(this._ForwardPolylines);

    if (strDir === 'forward') {
      for (var i = 0; i < this._ForwardPolylines.length; i++) {
        this.addLayer(this._ForwardPolylines[i]);
      }
    }
    else if (strDir === 'backward') {
      for (var j = 0; j < this._BackwardPolylines.length; j++) {
        this.addLayer(this._BackwardPolylines[j]);
      }
    }
  },

  SetDate: function(TargetDate) {
    //console.log(this._CapacityJson);
    //console.log(TargetDate);
    var _GettedColour = this._GetRange(this._ColourRangeJson, this._CapacityJson, TargetDate);

    //console.log('------------------------------');
    //console.log(this._ColourRangeJson);
    //console.log(this._CapacityJson);
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

    if(this._IsRouteSelected === true){
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
          SelectedColour: ColourRange[k].SelectedColourCode,
          Width: ColourRange[k].Width
        };
        break;
      }
    }

    return _result;
  }
});
