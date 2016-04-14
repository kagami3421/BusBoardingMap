'use strict';

L.BusMainControl = {};

L.BusMainControl.legend = function (CapacityConfigJson , ColourRangeJson , options) {
    return new L.BusMainControl.ColourLegend(CapacityConfigJson , ColourRangeJson , options);
};

L.BusMainControl.ColourLegend = L.Control.extend({
  options: {
    position: 'bottomleft'
  },

  initialize: function(CapacityConfigJson , ColourRangeJson , options) {
    L.Util.setOptions(this, options);

    this.colourRange = ColourRangeJson;
    this.capacityConfig = CapacityConfigJson;
  },

  onAdd: function(map) {
    this.container = L.DomUtil.create('div', 'busmain_legend');

    this._Title = "<div class='legend-title'>Average Monthly Boarding</div>";
    this._LegendScale = L.DomUtil.create('div', 'legend-scale');
    this._LegendLabels = L.DomUtil.create('ul', 'legend-labels' , this._LegendScale);

    this._LegendTexts = L.DomUtil.create('ul' , 'legend-texts' , this._LegendScale);

    //this.getCapacityAlias(this.colourRange[i].MinCapacity)

    $(this.container).append(this._Title , this._LegendScale);

    for (var i = 0; i < this.colourRange.length; i++) {

      var _EachLegend = "<li><span style='background:"+ this.colourRange[i].ColourCode +";'></span></li>";

      $(this._LegendLabels).append(_EachLegend);
    }

    for (var j = 0; j < this.colourRange.length - 1; j++) {

      var _EachText = "<li>"+ this.colourRange[j].MinCapacity +"</li>";

      $(this._LegendTexts).append(_EachText);
    }

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
    position: 'topleft'
  },

  initialize: function(options) {
    L.Util.setOptions(this, options);
  },

  onAdd: function(map) {
    this.container = L.DomUtil.create('div', 'busmain_dateview');

    this._MainText = L.DomUtil.create('h1', 'dateViewText');

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

    this._MainText = L.DomUtil.create('h1', 'ridershipViewText');

    $(this.container).append(this._MainText);

    return this.container;
  },

  ChangeValue : function (DateObj) {
    $(this._MainText).text(this._TotalJson[DateObj.Year][DateObj.Month]);
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
    Output['Year'] = ResultYear;
    Output['Month'] = this._controlJson.Ranges[(sliderValue - ResultMonth) - 1];
    return Output;
  }
});

L.BusMainControl.sidebar = function (CollectionJson) {
    return new L.BusMainControl.routeSelector(CollectionJson);
};

L.BusMainControl.routeSelector = L.Class.extend({
  initialize: function(CollectionJson) {
    //L.Util.setOptions(this, options);

    this._controlJson = CollectionJson;

    this._SideBar = L.DomUtil.get("sidebar");
  },

  AddWidget: function() {

    for (var singleCategory in this._controlJson) {
      if (this._controlJson.hasOwnProperty(singleCategory)) {
        this._CreateCategorySections(this._controlJson[singleCategory] , this._SideBar);
      }
    }
  },

  _CreateCategorySections: function (singleCategory , parentElement) {

    var _Container = L.DomUtil.create('section', 'sidebar-category' , parentElement);
    var _Class = this;

    this._CreateCategoryBar(singleCategory.name , _Container);

    for (var singleRoute in singleCategory.members) {
      if (singleCategory.members.hasOwnProperty(singleRoute)) {
        _Class._CreateSingleRouteButton(singleCategory.members[singleRoute] , _Container);
      }
    }
  },

  _CreateCategoryBar: function (singleCategoryName , parentElement) {
    var _Bar = L.DomUtil.create('section', 'category-bar' , parentElement);
    var _Text = "<p>"+ singleCategoryName +"</p>";

    $(_Bar).append(_Text);
  },

  _CreateSingleRouteButton: function (singleRouteSetting , parentElement) {
    var _Btn = L.DomUtil.create('section', 'route-btn' , parentElement);
    var _Text = "<p>"+ singleRouteSetting.tags.ref +"</p>";

    $(_Btn).append(_Text);
  }
});
