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

    this._Title = "<div class='legend-title'>Boarding Capacity Range</div>";
    this._LegendScale = L.DomUtil.create('div', 'legend-scale');
    this._LegendLabels = L.DomUtil.create('ul', 'legend-labels' , this._LegendScale);

    $(this.container).append(this._Title , this._LegendScale);

    for (var i = 0; i < this.colourRange.length; i++) {

      var _EachLegend = "<li><span style='background:"+ this.colourRange[i].ColourCode +";'></span>"+ this.colourRange[i].MaxCapacity + "~" + this.colourRange[i].MinCapacity +"</li>";

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

    this._SliderLegend = L.DomUtil.create('div', 'slider_legend');

    L.DomEvent.on(this._MainSlider, "change", function (e) {
        //e.stopPropagation();
        //TODO: Link change event with ouside. Return Year and Month.
        //console.log(this._MainSlider.value);
        this._callback(this._changeValue(this._MainSlider.value));
    }, this);

    $(this.container).append(this._MainSlider);
    $(this.container).append(this._SliderLegend);

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
