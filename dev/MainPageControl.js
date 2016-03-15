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
    var container = L.DomUtil.create('div', 'busmain_legend');

    var _Title = "<div class='legend-title'>Boarding Capacity Range</div>";
    var _LegendScale = L.DomUtil.create('div', 'legend-scale');
    var _LegendLabels = L.DomUtil.create('ul', 'legend-labels' , _LegendScale);

    $(container).append(_Title , _LegendScale);

    for (var i = 0; i < this.colourRange.length; i++) {

      var _EachLegend = "<li><span style='background:"+ this.colourRange[i].ColourCode +";'></span>"+ this.colourRange[i].MaxCapacity + "~" + this.colourRange[i].MinCapacity +"</li>";

      $(_LegendLabels).append(_EachLegend);
    }


    return container;
  }
});
