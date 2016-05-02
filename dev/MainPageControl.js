'use strict';

L.BusMainControl = {};

L.BusMainControl.legend = function (CapacityConfigJson , ColourRangeJson , options) {
    return new L.BusMainControl.ColourLegend(CapacityConfigJson , ColourRangeJson , options);
};

L.BusMainControl.ColourLegend = L.Control.extend({
  options: {
    position: 'topleft'
  },

  initialize: function(CapacityConfigJson , ColourRangeJson , options) {
    L.Util.setOptions(this, options);

    this.colourRange = ColourRangeJson;
    this.capacityConfig = CapacityConfigJson;

    this.isFolded = false;
  },

  onAdd: function(map) {
    this.container = L.DomUtil.create('div', 'busmain_legend');

    this._FoldBtn = L.DomUtil.create('div', 'fold-btn');

    $(this._FoldBtn).attr("id" , "fold");
    $(this._FoldBtn).append("<div class='fa fa-caret-down fa-3x'></div>");

    this._LegendMain = L.DomUtil.create('div' , 'legend-main');

    this._Title = L.DomUtil.create('div', 'legend-title' , this._LegendMain);
    $(this._Title).text('Average Monthly Boarding');

    this._LegendScale = L.DomUtil.create('div', 'legend-scale' , this._LegendMain);
    this._LegendLabels = L.DomUtil.create('ul', 'legend-labels' , this._LegendScale);
    this._LegendTexts = L.DomUtil.create('ul' , 'legend-texts' , this._LegendScale);

    $(this.container).append(this._FoldBtn , this._LegendMain);

    for (var i = 0; i < this.colourRange.length; i++) {

      var _EachLegend = "<li><span style='background:"+ this.colourRange[i].ColourCode +";'></span></li>";

      $(this._LegendLabels).append(_EachLegend);
    }

    for (var j = 0; j < this.colourRange.length - 1; j++) {

      var _EachText = "<li>"+ this.colourRange[j].MinCapacity +"</li>";

      $(this._LegendTexts).append(_EachText);
    }

    L.DomEvent.on(this._FoldBtn, "click", function (e) {
      L.DomEvent.stopPropagation(e);
        if(this.isFolded === false){
          this.isFolded = true;
          $(this._LegendMain).css("display", "none");
        }
        else {
          this.isFolded = false;
          $(this._LegendMain).css("display", "block");
        }
    }, this);

    return this.container;
  },

  getCapacityAlias: function (SingleColourRange) {
    if(SingleColourRange >= this.capacityConfig.MaxRoof){
      return SingleColourRange + "+";
    }
    else if (SingleColourRange === this.capacityConfig.MinRoof) {
      return "No Data";
    }
    else {
      return SingleColourRange;
    }
  }
});

L.BusMainControl.dateview = function (options) {
    return new L.BusMainControl.DateView(options);
};

L.BusMainControl.DateView= L.Control.extend({
  options: {
    position: 'bottomleft'
  },

  initialize: function(options) {
    L.Util.setOptions(this, options);
  },

  onAdd: function(map) {
    this.container = L.DomUtil.create('div', 'busmain_dateview');

    this._MainText = L.DomUtil.create('h1', 'ViewText');

    $(this.container).append(this._MainText);

    return this.container;
  },


  ChangeValue : function (DateObj) {
    $(this._MainText).html(DateObj.Year + '<br>' +DateObj.Month);
  }
});


L.BusMainControl.ridership = function (TotalCapacityJson , options) {
    return new L.BusMainControl.RidershipView(TotalCapacityJson , options);
};

L.BusMainControl.RidershipView= L.Control.extend({
  options: {
    position: 'topright'
  },

  initialize: function(TotalCapacityJson , options) {
    L.Util.setOptions(this, options);

    this._TotalJson = TotalCapacityJson;
  },

  onAdd: function(map) {
    this.container = L.DomUtil.create('div', 'busmain_ridershipView');

    this._MainText = L.DomUtil.create('h1', 'ViewText');

    $(this.container).append(this._MainText);

    return this.container;
  },

  ChangeValue : function (DateObj , SingleRouteJson) {
    if(SingleRouteJson === undefined || SingleRouteJson === null){
      $(this._MainText).text(this._TotalJson[DateObj.Year][DateObj.Month]);
    }
    else {
      //Check the year has ridership or not.
      if(SingleRouteJson[DateObj.Year] === undefined){
        $(this._MainText).text('0');
      }
      else {
        $(this._MainText).text(SingleRouteJson[DateObj.Year][DateObj.Month]);
      }
    }
  }
});

L.BusMainControl.routelegend = function (options) {
    return new L.BusMainControl.RouteLegend(options);
};

L.BusMainControl.RouteLegend= L.Control.extend({
  options: {
    position: 'bottomright'
  },

  initialize: function(options) {
    L.Util.setOptions(this, options);

    //this._CollectionJson = CollectionJson;
  },

  onAdd: function(map) {
    this.container = L.DomUtil.create('div', 'busmain_routeLegend');

    this._MainText = L.DomUtil.create('h1', 'ViewText');

    $(this.container).append(this._MainText);

    return this.container;
  },

  ChangeText : function (RouteTagsObj) {
    if(RouteTagsObj === undefined || RouteTagsObj === null){
      $(this._MainText).text("");
    }
    else {
      $(this._MainText).text(RouteTagsObj.name);
    }
  }
});

/************************ HTML Control **********************************/

L.BusMainControl.slider = function (CallbackFunction , ControlRangeJson) {
    return new L.BusMainControl.DateSlider(CallbackFunction , ControlRangeJson);
};

L.BusMainControl.DateSlider = L.Class.extend({
  initialize: function(CallbackFunction , ControlRangeJson) {
    //L.Util.setOptions(this, options);

    this._controlJson = ControlRangeJson;
    this._callback = CallbackFunction;
  },

  AddWidget: function() {
    this.container = $("#slider_location");

    this._MainSlider = L.DomUtil.create('input', 'slider_main');
    $(this._MainSlider).attr( "type", "range" );
    $(this._MainSlider).attr( "min", "1" );
    $(this._MainSlider).attr( "max" , (((this._controlJson.To - this._controlJson.From) + 1) *  this._controlJson.Ranges.length));
    $(this._MainSlider).attr( "value" , "0");

    L.DomEvent.on(this._MainSlider, "change", function (e) {
        this._callback(this._changeValue(this._MainSlider.value));
    }, this);

    $(this.container).append(this._MainSlider);

    //Prevent map also to be dragged when dragging slider.
    //L.DomEvent.disableClickPropagation(this.container);
  },

  _changeValue : function (sliderValue){
    var YearTotalNum = (this._controlJson.To - this._controlJson.From) + 2;
    var YearCount = 1;

    var ResultYear = 1970;
    var ResultMonth = 1;

    //console.log(this._controlJson.Ranges.length * YearCount >= sliderValue  && sliderValue >= YearCount);

    while (YearTotalNum > YearCount) {
      //console.log(YearCount);

      //console.log(this._controlJson.Ranges.length * YearCount >= sliderValue && sliderValue >= this._controlJson.Ranges.length * (YearCount - 1));

      if(this._controlJson.Ranges.length * YearCount >= sliderValue && sliderValue >= this._controlJson.Ranges.length * (YearCount - 1)){
        for (var i = this._controlJson.Ranges.length * (YearCount - 1) + 1; i < (this._controlJson.Ranges.length * YearCount) + 1 ; i++) {
          if(parseInt(sliderValue) === i){
            ResultYear = parseInt(this._controlJson.From) + (YearCount - 1);
            ResultMonth = (YearCount - 1) * this._controlJson.Ranges.length;
            break;
          }
        }
        YearCount++;
      }
      else {
        YearCount++;
        continue;
      }
    }

    //console.log(sliderValue - ResultMonth);

    var Output = {};
    Output.Year = ResultYear;
    Output.Month = this._controlJson.Ranges[(sliderValue - ResultMonth) - 1];
    return Output;
  }
});

L.BusMainControl.sidebar = function (LClickCallBack , RClickCallBack , CollectionJson) {
    return new L.BusMainControl.routeSelector(LClickCallBack , RClickCallBack , CollectionJson);
};

L.BusMainControl.routeSelector = L.Class.extend({
  initialize: function(LClickCallBack , RClickCallBack , CollectionJson) {
    //L.Util.setOptions(this, options);

    this._controlJson = CollectionJson;

    this._SideBar = L.DomUtil.get("sidebar");
    this._MainContianer = L.DomUtil.get("main");
    this._ClickBtnEvent = LClickCallBack;
    this._ClearEvent = RClickCallBack;
  },

  AddWidget: function() {

    for (var singleCategory in this._controlJson) {
      if (this._controlJson.hasOwnProperty(singleCategory)) {
        this._CreateCategorySections(this._controlJson[singleCategory] , this._SideBar);
      }
    }

    this._AddClickEvent();
  },

  ChangeBtnState:function (TargetElement) {
    $(TargetElement).toggleClass( "route-btn-selected", true );
  },

  RevertBtnState:function () {
    $(".route-btn").toggleClass( "route-btn-selected", false );
  },

  _CreateCategorySections: function (singleCategory , parentElement) {

    var _Container = L.DomUtil.create('section', 'sidebar-category' , parentElement);
    //var _Class = this;

    this._CreateCategoryBar(singleCategory.name , _Container);

    for (var singleRoute in singleCategory.members) {
      if (singleCategory.members.hasOwnProperty(singleRoute)) {
        this._CreateSingleRouteButton(singleCategory.members[singleRoute] , _Container);
      }
    }
  },

  _CreateCategoryBar: function (singleCategoryName , parentElement) {
    var _Bar = L.DomUtil.create('section', 'category-bar' , parentElement);

    $(_Bar).text(singleCategoryName);
  },

  _CreateSingleRouteButton: function (singleRouteSetting , parentElement) {
    var _Btn = L.DomUtil.create('section', 'route-btn' , parentElement);

    $(_Btn).text(singleRouteSetting.tags.ref);
    $(_Btn).attr( "id", singleRouteSetting.tags['ref:querycode']);
  },

  _AddClickEvent : function () {
    L.DomEvent.on(this._SideBar, "click", function (e) {
        this._ClickBtnEvent(e);
    }, this);

    L.DomEvent.on(this._MainContianer, "contextmenu", function (e) {
        L.DomEvent.preventDefault(e);
        this._ClearEvent ();
    }, this);
  }
});
