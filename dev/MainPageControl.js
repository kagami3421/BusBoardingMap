'use strict';

L.BusMainControl = {};

L.BusMainControl.legend = function (ColourRangeJson , options) {
    return new L.BusMainControl.ColourLegend(ColourRangeJson , options);
};

L.BusMainControl.ColourLegend = L.Control.extend({
  options: {
    position: 'bottomleft'
  },

  initialize: function(ColourRangeJson , options) {
    L.Util.setOptions(this, options);

    this.colourRange = ColourRangeJson;
  },

  onAdd: function(map) {
    this.container = L.DomUtil.create('div', 'busmain_legend');

    this._Title = "<div class='legend-title'>Average Monthly Boarding</div>";
    this._LegendScale = L.DomUtil.create('div', 'legend-scale');
    this._LegendLabels = L.DomUtil.create('ul', 'legend-labels' , this._LegendScale);

    $(this.container).append(this._Title , this._LegendScale);

    for (var i = 0; i < this.colourRange.length; i++) {

      var _EachLegend = "<li><span style='background:"+ this.colourRange[i].ColourCode +";'></span>"+ this.colourRange[i].MaxCapacity + " - " + this.colourRange[i].MinCapacity +"</li>";

      $(this._LegendLabels).append(_EachLegend);
    }


    return this.container;
  }
});

L.BusMainControl.slider = function (ControlRangeJson , options) {
    return new L.BusMainControl.DateSlider(ControlRangeJson , options);
};

L.BusMainControl.DateSlider = L.Control.extend({
  options: {
    position: 'bottomright'
  },

  initialize: function(CallbackFunction , ControlRangeJson , options) {
    L.Util.setOptions(this, options);

    this._controlJson = ControlRangeJson;
    this._callback = CallbackFunction;
  },

  onAdd: function(map) {
    this.container = L.DomUtil.create('div', 'busmain_slider');

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
    L.DomEvent.disableClickPropagation(this.container);

    return this.container;
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
    $(this._MainText).html('Year: ' + DateObj.Year + '<br>' + 'Month: ' +DateObj.Month);
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

    this._Legend = L.DomUtil.create('h2', 'ridershipViewLegend');
    this._MainText = L.DomUtil.create('h1', 'ridershipViewText');

    $(this.container).append(this._Legend);
    $(this.container).append(this._MainText);

    return this.container;
  },

  ChangeValue : function (DateObj) {
    $(this._Legend).text('Total RiderShip');
    $(this._MainText).text(this._TotalJson[DateObj.Year][DateObj.Month]);
  }
});
