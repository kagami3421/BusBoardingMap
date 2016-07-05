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

    this._FoldBtn = L.DomUtil.create('div', 'fold-btn' , this.container);
    this._FoldBtn.setAttribute("id" , "fold");

    this._FoldIcon = L.DomUtil.create('div', 'fa fa-caret-up fa-2x' , this._FoldBtn);

    this._LegendMain = L.DomUtil.create('div' , 'legend-main' , this.container);

    this._Title = L.DomUtil.create('div', 'legend-title' , this._LegendMain);
    this._Title.textContent = 'Average Monthly Boarding';

    this._LegendScale = L.DomUtil.create('div', 'legend-scale' , this._LegendMain);
    this._LegendLabels = L.DomUtil.create('ul', 'legend-labels' , this._LegendScale);
    this._LegendTexts = L.DomUtil.create('ul' , 'legend-texts' , this._LegendScale);

    for (var i = 0; i < this.colourRange.length; i++) {

      var _EachLegend = this._createColourRetangle(i);

      this._LegendLabels.appendChild(_EachLegend);
    }

    for (var j = 0; j < this.colourRange.length - 1; j++) {

      var _EachText = this._createRidershipText(j);

      this._LegendTexts.appendChild(_EachText);
    }

    L.DomEvent.on(this._FoldBtn, "click", function (e) {
      L.DomEvent.stopPropagation(e);
        if(this.isFolded === false){
          this.isFolded = true;
          this._FoldIcon.setAttribute('class','fa fa-caret-down fa-2x');
          $(this._LegendMain).hide('normal');
        }
        else {
          this.isFolded = false;
          this._FoldIcon.setAttribute('class','fa fa-caret-up fa-2x');
          $(this._LegendMain).show('normal');
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
  },

  _createColourRetangle : function (i) {
    var _list = L.DomUtil.create('li' , 'clist');
    var _colourRetangle = L.DomUtil.create('span','color' , _list);
    _colourRetangle.setAttribute('style','background:' + this.colourRange[i].ColourCode);
    //"<li><span style='background:"+ this.colourRange[i].ColourCode +";'></span></li>";
    _list.appendChild(_colourRetangle);

    return _list;
  },

  _createRidershipText : function (j) {
    var _list = document.createElement('li');
    _list.textContent = this.colourRange[j].MinCapacity;
    //"<li>"+ this.colourRange[j].MinCapacity +"</li>";

    return _list;
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

    this.container.appendChild(this._MainText);

    return this.container;
  },


  ChangeValue : function (DateObj) {
    this._MainText.innerHTML = DateObj.Year + '<br>' +DateObj.Month;
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

    this.container.appendChild(this._MainText);

    return this.container;
  },

  ChangeValue : function (DateObj , SingleRouteJson) {
    if(SingleRouteJson === undefined || SingleRouteJson === null){
      this._MainText.textContent = this._TotalJson[DateObj.Year][DateObj.Month];
    }
    else {
      //Check the year has ridership or not.
      if(SingleRouteJson[DateObj.Year] === undefined){
        this._MainText.textContent = '0';
      }
      else {
        this._MainText.textContent = SingleRouteJson[DateObj.Year][DateObj.Month];
      }
    }
  }
});

/************************ HTML Control **********************************/

L.BusMainControl.routelegend = function () {
    return new L.BusMainControl.RouteLegend();
};

L.BusMainControl.RouteLegend= L.Control.extend({
  initialize: function() {
    this._MainText = L.DomUtil.get('route-legend');
  },

  AddWidget: function() {

  },

  ChangeText : function (RouteTagsObj) {
    if(RouteTagsObj === undefined || RouteTagsObj === null){
      this._MainText.textContent = "Route List";
    }
    else {
      this._MainText.textContent = RouteTagsObj.name;
    }
  }
});

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
    this.container = document.getElementById("slider_location");

    this._MainSlider = L.DomUtil.create('input', 'slider_main');
    this._MainSlider.setAttribute( "type", "range" );
    this._MainSlider.setAttribute( "min", "1" );
    this._MainSlider.setAttribute( "max" , (((this._controlJson.To - this._controlJson.From) + 1) *  this._controlJson.Ranges.length));
    this._MainSlider.setAttribute( "value" , "0");

    L.DomEvent.on(this._MainSlider, "change", function (e) {
        this._callback(this._changeValue(this._MainSlider.value));
    }, this);

    this.container.appendChild(this._MainSlider);
  },

  SetSliderValue : function (isAdd) {
    if(isAdd === true){

      if(this._MainSlider.value >= (((this._controlJson.To - this._controlJson.From) + 1) *  this._controlJson.Ranges.length)){
        this._MainSlider.value = 1;
      }
      else {
        this._MainSlider.value++;
      }


      //this._MainSlider.setAttribute( "value" , this._MainSlider.value++);
    }
    else if(isAdd === false){
      if(this._MainSlider.value <= 1){
        this._MainSlider.value = (((this._controlJson.To - this._controlJson.From) + 1) *  this._controlJson.Ranges.length);
      }
      else {
        this._MainSlider.value--;
      }

      //this._MainSlider.setAttribute( "value" , this._MainSlider.value--);
    }

    this._callback(this._changeValue(this._MainSlider.value));
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

    this._SideBarMask = L.DomUtil.get("sidebar-mask");
    this._SideBarMaskBtn = L.DomUtil.get("sidebar-mask-btn");
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
    var _pos = $(TargetElement).position();

    $(this._SideBarMaskBtn).css({ "left": _pos.left , "top": _pos.top });
    $(this._SideBarMask).css("display","initial");
  },

  RevertBtnState:function () {
    $(".route-btn").toggleClass( "route-btn-selected", false );
    $(this._SideBarMask).css("display","none");
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

    _Bar.textContent = singleCategoryName;
  },

  _CreateSingleRouteButton: function (singleRouteSetting , parentElement) {
    var _Btn = L.DomUtil.create('section', 'route-btn' , parentElement);

    _Btn.textContent = singleRouteSetting.tags.ref;
    _Btn.setAttribute( "id", singleRouteSetting.tags['ref:querycode']);
  },

  _AddClickEvent : function () {
    L.DomEvent.on(this._SideBar, "click", function (e) {
        this._ClickBtnEvent(e);
    }, this);

    L.DomEvent.on(this._SideBarMaskBtn, "click", function (e) {
       this._ClearEvent();
    }, this);
  }
});

L.BusMainControl.controlBtns = function (CallbackFunction , ControlRangeJson) {
    return new L.BusMainControl.datePlayControl(CallbackFunction , ControlRangeJson);
};

L.BusMainControl.datePlayControl = L.Class.extend({
  initialize: function(CallbackFunction , ControlRangeJson) {
    //L.Util.setOptions(this, options);

    this._controlJson = ControlRangeJson;
    this._callback = CallbackFunction;
    this._isPlaying = false;
  },

  CheckisPlaying : function() {
    return this._isPlaying;
  },

  AddWidget: function() {
    this.container = document.getElementById("control_location");

    this._BtnCollections = L.DomUtil.create('div', 'button_collection');

    this._PrevBtn = L.DomUtil.create('input', 'button_main');
    this._PrevBtn.setAttribute( "type", "button" );
    this._PrevBtn.setAttribute( "value", "Prev" );
    this._PrevBtn.setAttribute( "id", "Previous" );

    this._PlayBtn = L.DomUtil.create('input', 'button_main');
    this._PlayBtn.setAttribute( "type", "button" );
    this._PlayBtn.setAttribute( "value", "Play" );
    this._PlayBtn.setAttribute( "id", "PlayPasue" );

    this._NextBtn = L.DomUtil.create('input', 'button_main');
    this._NextBtn.setAttribute( "type", "button" );
    this._NextBtn.setAttribute( "value", "Next" );
    this._NextBtn.setAttribute( "id", "Next" );

    this._BtnCollections.appendChild(this._PrevBtn);
    this._BtnCollections.appendChild(this._PlayBtn);
    this._BtnCollections.appendChild(this._NextBtn);

    L.DomEvent.on(this._BtnCollections, "click", function (e) {
        if(e.target.id === "PlayPasue"){
          if(this._isPlaying === false){
            this._PlayBtn.setAttribute( "value", "Pause" );
            this._isPlaying = true;
          }
          else {
            this._PlayBtn.setAttribute( "value", "Play" );
            this._isPlaying = false;
          }
        }

        this._callback(e.target.id);
    }, this);

    this.container.appendChild(this._BtnCollections);
  }
});
