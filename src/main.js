import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import { fromLonLat } from 'ol/proj.js';
import BingMaps from 'ol/source/BingMaps.js';
import { Vector as VectorLayer } from 'ol/layer.js';
import { Vector as VectorSource } from 'ol/source.js';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style.js';
import { transformExtent } from 'ol/proj.js';
import { getWidth, getHeight } from 'ol/extent.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import KML from 'ol/format/KML.js';
import OSM from 'ol/source/OSM';

let raster = new TileLayer({
  source: new OSM()
});

// Tehran IKA coordinates
let tehranAirportMiddle = fromLonLat([51.11979, 35.424141]);

// Bing Map as a Layer
let myBingMap = new TileLayer({
  source: new BingMaps({
    imagerySet: 'AerialWithLabels',
    key: 'AuhiAl2RJLIkICx2SXnmydBI3phty8KJiEwtVlxoEUKlh70qALPTSqTXA1h0nfiz'
  })
});

// Icons Layer
let icons_KML = new VectorLayer({
  source: new VectorSource({
    url: 'dist/data/icons.kml',
    format: new KML({
      extractStyles: false
    })
  }),
  style: new Style({
    image: new Icon({
      anchor: [0, 0],
      src: 'dist/data/camera.png'
    })
  })
});

// Icons for another year
let icon_KML_next_year = new VectorLayer({
  source: new VectorSource({
    url: 'dist/data/icons2.kml',
    format: new KML({
      extractStyles: false
    })
  }),
  style: new Style({
    image: new Icon({
      anchor: [0, 0],
      src: 'dist/data/camera.png'
    })
  })
});

// Polygon with Text Style
let polygon_text_style = new Style({
  fill: new Fill({
    color: '#000'
  }),
  stroke: new Stroke({
    color: 'black',
    width: '1px'
  }),
  text: new Text({
    font: '14px Calibri,sans-serif',
    fill: new Fill({
      color: '#fff'
    }),
    stroke: new Stroke({
      color: '#000',
      width: 4
    })
  })
});

// Polygon and Text alongside each other
let main_polygon_layer = new VectorLayer({
  source: new VectorSource({
    url: 'dist/data/myCustomGeo.geojson',
    format: new GeoJSON()
  }),
  style: function(feature) {
    polygon_text_style.getText().setText(feature.get('name'));
    polygon_text_style.fill_.color_ = feature.get('color').toString();
    return polygon_text_style;
  }
});

// Transpart Layer for PCI
let transparent_style = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0)'
  }),
  stroke: new Stroke({
    color: 'black',
    width: '2px'
  })
});

// Map Layers
let mapLayers = [
  raster,
  myBingMap,
  main_polygon_layer,
  icons_KML,
  icon_KML_next_year
];

let view = new View({
  center: tehranAirportMiddle,
  zoom: 15,
  minZoom: 15,
  maxZoom: 19
});

// Rendering the map
let map = new Map({
  layers: mapLayers,
  target: 'map',
  view: new View({
    center: tehranAirportMiddle,
    zoom: 17,
    minZoom: 16,
    maxZoom: 19
  })
});

// Getting the features
let features = main_polygon_layer.getSource().getFeatures();

// Setting the extention of the map!
let extent = map.getView().calculateExtent(); // opening coverage
let resolution = 0;

function resChange() {
  let newResolution = map.getView().getResolution();
  if (
    resolution == 0 ||
    Math.abs((newResolution - resolution) / resolution) > 0.01
  ) {
    resolution = newResolution;
    let width = map.getSize()[0] * resolution;
    let height = map.getSize()[1] * resolution;
    let view = new View({
      projection: map.getView().getProjection(),
      extent: [
        extent[0] + width / 2,
        extent[1] + height / 2,
        extent[2] - width / 2,
        extent[3] - height / 2
      ],
      center: map.getView().getCenter(),
      resolution: resolution,
      maxZoom: map.getView().getMaxZoom(),
      minZoom: map.getView().getMinZoom()
    });
    view.on('change:resolution', resChange);
    map.setView(view);
  }
}
resChange();

function openMap() {
  map.setView(view);
  let extent = transformExtent(
    [51.1086, 35.432463, 51.190381, 35.40133],
    'EPSG:4326',
    'EPSG:3857'
  );

  let size = map.getSize();
  let width = getWidth(extent);
  let height = getHeight(extent);
  if (size[0] / size[1] > width / height) {
    view.fit(
      [
        extent[0],
        (extent[1] + extent[3]) / 2,
        extent[2],
        (extent[1] + extent[3]) / 2
      ],
      { constrainResolution: false }
    );
  } else {
    view.fit(
      [
        (extent[0] + extent[2]) / 2,
        extent[1],
        (extent[0] + extent[2]) / 2,
        extent[3]
      ],
      { constrainResolution: false }
    );
  }
  let maxResolution = view.getResolution();
  let resolution = 0;

  function resChange() {
    let oldView = map.getView();
    if (resolution == 0 || oldView.getZoom() % 1 == 0) {
      resolution = oldView.getResolution();
      let width = map.getSize()[0] * resolution;
      let height = map.getSize()[1] * resolution;
      let newView = new View({
        projection: oldView.getProjection(),
        extent: [
          extent[0] + width / 2,
          extent[1] + height / 2,
          extent[2] - width / 2,
          extent[3] - height / 2
        ],
        resolution: resolution,
        maxResolution: maxResolution,
        rotation: oldView.getRotation()
      });
      newView.setCenter(newView.constrainCenter(oldView.getCenter()));
      newView.on('change:resolution', resChange);
      map.setView(newView);
    }
  }
  resChange();
}
map.on('change:size', openMap);
openMap();

// Actions for hovering and displaying info
let info = $('#info');
info.tooltip({
  animation: false,
  trigger: 'manual'
});

const myJsonFile = require('./data.json');

let displayFeatureInfo = function(pixel) {
  info.css({
    left: pixel[0] + 'px',
    top: pixel[1] - 15 + 'px'
  });
  let feature = map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });
  if (feature) {
    let name = feature.get('name');
    info
      .tooltip('hide')
      .attr('data-original-title', name)
      .tooltip('fixTitle')
      .tooltip('show');
    $('.selection-tower__details').show();
    let link = featureType(feature);

    // Getting the image
    let image = document.getElementById('quick-details__content-photo-source');
    if (link) {
      document.getElementById('quick-details__section-label').innerHTML =
        'جزئیات عکس';
      $('.quick_details_controller').hide();
      $('.photos_class_controller').show();
      document.getElementById(
        'quick-details__content-item-value-destruction_type'
      ).innerHTML = myJsonFile[name]['destroType'];
      image.src = link;
    } else {
      document.getElementById('quick-details__section-label').innerHTML =
        'جزئیات باند';
      $('.photos_class_controller').hide();
      $('.quick_details_controller').show();

      if (isClicked) databoxDesigner(currentFeature);
      else databoxDesigner(feature);

      $('#quickDetailsOnHover').show();
      $('#quickDetailsOnClick').hide();
    }
  } else {
    info.tooltip('hide');
    if (isClicked) $('#quickDetailsOnClick').show();
    else $('#quickDetailsOnClick').hide();

    $('#quickDetailsOnHover').hide();
  }
};

// It's either a pic or a polygon
function featureType(feature) {
  let name = feature.get('name');
  let tempObj = myJsonFile[name];
  if (!tempObj) return false;
  return tempObj.link;
}

// Current layer global variable
let theColor = 'color';
let isClicked = false;
let currentFeature = null;

//designs the right hand side of the website
function databoxDesigner(feature) {
  databoxDesignerClicked(feature);
  let shenaseQate = document.getElementById('quick-details__shenaseQate');
  let shenaseBand = document.getElementById('quick-details__shenase_band');
  let karbari = document.getElementById('quick-details__karbari');
  let noeRoye = document.getElementById('quick-details__noeRoye');
  let masahat = document.getElementById('quick_details__content_item_area');
  let azmoon_shakhes_nahamvari = document.getElementById(
    'azmoon_shakhes_nahamvari'
  );
  let azmoon_omq_doroshtbaft = document.getElementById(
    'azmoon_omq_doroshtbaft'
  );
  let akharin_omq_shiarshodegi = document.getElementById(
    'akharin_omq_shiarshodegi'
  );
  let akharin_shakhesh_vaziat = document.getElementById(
    'akharin_shakhesh_vaziat'
  );
  let akharin_arzyabi_vaziat = document.getElementById(
    'akharin_arzyabi_vaziat'
  );
  let amaliyat_tamir_va_negahdari = document.getElementById(
    'amaliyat_tamir_va_negahdari'
  );
  let last_serious_repair = document.getElementById('last_serious_repair');
  let noeRosazi = document.getElementById('noeRosazi');

  shenaseQate.innerHTML = feature.get('name');
  shenaseBand.innerHTML = feature.get('shenaseBand');
  karbari.innerHTML = feature.get('karbari');
  noeRoye.innerHTML = feature.get('noeRoye');
  masahat.innerHTML = feature.get('masahat');
  azmoon_shakhes_nahamvari.innerHTML = feature.get('azmoon_shakhes_nahamvari');
  azmoon_omq_doroshtbaft.innerHTML = feature.get('azmoon_omq_doroshtbaft');
  akharin_omq_shiarshodegi.innerHTML = feature.get('akharin_omq_shiarshodegi');
  akharin_shakhesh_vaziat.innerHTML = feature.get('akharin_shakhesh_vaziat');
  akharin_arzyabi_vaziat.innerHTML = feature.get('akharin_arzyabi_vaziat');
  amaliyat_tamir_va_negahdari.innerHTML = feature.get(
    'amaliyat_tamir_va_negahdari'
  );
  last_serious_repair.innerHTML = feature.get('last_serious_repair');
  noeRosazi.innerHTML = feature.get('noeRosazi');
}

function databoxDesignerClicked(feature) {
  let shenaseQate = document.getElementById(
    'quick-details__shenaseQate_clicked'
  );
  let shenaseBand = document.getElementById(
    'quick-details__shenase_band_clicked'
  );
  let karbari = document.getElementById('quick-details__karbari_clicked');
  let noeRoye = document.getElementById('quick-details__noeRoye_clicked');
  let masahat = document.getElementById(
    'quick_details__content_item_area_clicked'
  );
  let azmoon_shakhes_nahamvari = document.getElementById(
    'azmoon_shakhes_nahamvari_clicked'
  );
  let azmoon_omq_doroshtbaft = document.getElementById(
    'azmoon_omq_doroshtbaft_clicked'
  );
  let akharin_omq_shiarshodegi = document.getElementById(
    'akharin_omq_shiarshodegi_clicked'
  );
  let akharin_shakhesh_vaziat = document.getElementById(
    'akharin_shakhesh_vaziat_clicked'
  );
  let akharin_arzyabi_vaziat = document.getElementById(
    'akharin_arzyabi_vaziat_clicked'
  );
  let amaliyat_tamir_va_negahdari = document.getElementById(
    'amaliyat_tamir_va_negahdari_clicked'
  );
  let last_serious_repair = document.getElementById(
    'last_serious_repair_clicked'
  );
  let noeRosazi = document.getElementById('noeRosazi_clicked');

  shenaseQate.innerHTML = feature.get('name');
  shenaseBand.innerHTML = feature.get('shenaseBand');
  karbari.innerHTML = feature.get('karbari');
  noeRoye.innerHTML = feature.get('noeRoye');
  masahat.innerHTML = feature.get('masahat');
  azmoon_shakhes_nahamvari.innerHTML = feature.get('azmoon_shakhes_nahamvari');
  azmoon_omq_doroshtbaft.innerHTML = feature.get('azmoon_omq_doroshtbaft');
  akharin_omq_shiarshodegi.innerHTML = feature.get('akharin_omq_shiarshodegi');
  akharin_shakhesh_vaziat.innerHTML = feature.get('akharin_shakhesh_vaziat');
  akharin_arzyabi_vaziat.innerHTML = feature.get('akharin_arzyabi_vaziat');
  amaliyat_tamir_va_negahdari.innerHTML = feature.get(
    'amaliyat_tamir_va_negahdari'
  );
  last_serious_repair.innerHTML = feature.get('last_serious_repair');
  noeRosazi.innerHTML = feature.get('noeRosazi');
}

$('.selection-tower__details_clicked').hide();
$('.ol-overlaycontainer-stopevent').remove();
icon_KML_next_year.setVisible(false);

// on pointermove, it gives us the information regarding what is happening
map.on('pointermove', function(evt) {
  if (evt.dragging) {
    info.tooltip('hide');
    return;
  }
  displayFeatureInfo(map.getEventPixel(evt.originalEvent));
});

// on clicking on the map, something may get displayed
map.on('click', function(evt) {
  let flag = featureAtPixel(evt);
  if (flag) {
    map.forEachFeatureAtPixel(evt.pixel, function(feature) {
      singlePolySelector(feature);
      $('#quickDetailsOnClick').show();
      $('#quickDetailsOnHover').hide();
      currentFeature = feature;
    });
    isClicked = true;
  } else {
    restoreDefault(theColor);
    dropdownReset();
    $('.selection-tower__details').hide();
    isClicked = false;
  }
  displayFeatureInfo(evt.pixel);
});

function featureAtPixel(se) {
  let flag = false;
  map.forEachFeatureAtPixel(se.pixel, function(feature) {
    flag = true;
  });
  return flag;
}

// it gets the desired
function singlePolySelector(feature) {
  restoreDefault(theColor);

  let nameofFeature = feature.get('name');
  let second_branch = document.getElementById('second_branch_selection');
  let first_branch = document.getElementById('first_branch_selection');
  let tempTextSecond =
    '<option value=' +
    nameofFeature.toString() +
    '>' +
    nameofFeature.toString() +
    '</option>\n';
  let cString = nameofFeature
    .toString()
    .slice(0, nameofFeature.toString().length - 3);
  //first_branch.innerHTML = '<option value=' + cString + '>' + cString + '</option>\n';
  second_branch.innerHTML = tempTextSecond;

  let tempFeature = main_polygon_layer.getSource().getFeatures();
  tempFeature.forEach(e => {
    if (feature != e) {
      e.setStyle(
        new Style({
          fill: new Fill({ color: '#b0b6c2' }),
          stroke: new Stroke({
            color: 'black',
            width: '2px'
          })
        })
      );
    }
  });
}

// Multiple Polygon Selector
function multiplePolySelector(...feature) {
  restoreDefault(theColor);
  let tempFeature = main_polygon_layer.getSource().getFeatures();
  tempFeature.forEach(e => {
    if (!feature[0].includes(e)) {
      e.setStyle(
        new Style({
          fill: new Fill({ color: '#b0b6c2' }),
          stroke: new Stroke({
            color: 'black',
            width: '2px'
          })
        })
      );
    }
  });
}

// the first ever styles!
function restoreDefault(theColor) {
  let tempFeature = main_polygon_layer.getSource().getFeatures();
  tempFeature.forEach(e => e.setStyle(undefined));
  let tempStyle = function(feature) {
    polygon_text_style.getText().setText(feature.get('name'));
    polygon_text_style.fill_.color_ = feature.get(theColor).toString();
    return polygon_text_style;
  };
  tempFeature.forEach(e => e.setStyle(tempStyle));
}

// Hides the text
function hideText(theColor) {
  let features = main_polygon_layer.getSource().getFeatures();
  let tempStyle = function(feature) {
    polygon_text_style.getText().setText(null);
    polygon_text_style.fill_.color_ = feature.get(theColor).toString();
    return polygon_text_style;
  };
  features.forEach(e => e.setStyle(tempStyle));
}

// Makes the layer transparent
function makeTransparent() {
  let features = main_polygon_layer.getSource().getFeatures();
  features.forEach(e => e.setStyle(transparent_style));
}

// this is part of the dropdown selector helper
function featureNameSelector(name) {
  let tempFeature = main_polygon_layer.getSource().getFeatures();
  let returnValue = null;
  tempFeature.forEach(e => {
    if (name == e.get('name')) {
      returnValue = e;
    }
  });
  return returnValue;
}

// Activates the IRI Colors
function IRILayerActivator() {
  let tempFeature = main_polygon_layer.getSource().getFeatures();
  let tempStyle = function(feature) {
    polygon_text_style.getText().setText(feature.get('name'));
    polygon_text_style.fill_.color_ = feature.get('IRI_color').toString();
    return polygon_text_style;
  };
  tempFeature.forEach(e => e.setStyle(tempStyle));
}

// Branch drop down menu handler
function branchSelector(branchName) {
  restoreDefault(theColor);
  let tempFeature = main_polygon_layer.getSource().getFeatures();
  let featureList = new Array();
  tempFeature.forEach(e => {
    if (e.get('shenaseBand') == branchName.toString()) {
      featureList.push(e);
    }
  });
  multiplePolySelector(featureList);
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// For Multiple Changes

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let mapLabel = document.getElementById('map-label-checkbox-id');
let aerialImage = document.getElementById('aerial-imagery-checkbox-id');
let photos = document.getElementById('photos-id');

mapLabel.addEventListener('click', () => {
  if (mapLabel.checked == true) {
    document
      .getElementById('map-label-checkbox-class')
      .classList.add('map-layer-selector-item__label--selected');
    restoreDefault(theColor);
  } else {
    document
      .getElementById('map-label-checkbox-class')
      .classList.remove('map-layer-selector-item__label--selected');
    hideText(theColor);
  }
});

aerialImage.addEventListener('click', () => {
  if (aerialImage.checked == true) {
    document
      .getElementById('aerial-imagery-checkbox-class')
      .classList.add('map-layer-selector-item__label--selected');
    myBingMap.setVisible(true);
  } else {
    document
      .getElementById('aerial-imagery-checkbox-class')
      .classList.remove('map-layer-selector-item__label--selected');
    myBingMap.setVisible(false);
  }
});

photos.addEventListener('click', () => {
  if (photos.checked == true) {
    document
      .getElementById('photos-class')
      .classList.add('map-layer-selector-item__label--selected');
    icons_KML.setVisible(true);
  } else {
    document
      .getElementById('photos-class')
      .classList.remove('map-layer-selector-item__label--selected');
    icons_KML.setVisible(false);
  }
});

let main_map_container = document.getElementById('main-map-container-id');
let main_custom_data_container = document.getElementById(
  'network_viewer__tabs_id'
);

$(function() {
  $('.network-view-label-radio').click(function() {
    let options = $('input[name=network-viewer_radio-group]:checked').val();

    if (options == 0) {
      main_custom_data_container.classList.remove('splitted-view');
      main_map_container.classList.remove('splitted-view');
      main_custom_data_container.style.display = 'none';
      main_map_container.style.display = 'block';
      main_custom_data_container.classList.remove(
        'main_custom_data_container_fullyExtended'
      );
      map.updateSize();
    } else if (options == 1) {
      main_custom_data_container.style.display = 'block';
      main_map_container.style.display = 'block';
      main_custom_data_container.classList.add('splitted-view');
      main_map_container.classList.add('splitted-view');
      main_custom_data_container.classList.remove(
        'main_custom_data_container_fullyExtended'
      );
      map.updateSize();
    } else if (options == 2) {
      main_custom_data_container.classList.remove('splitted-view');
      main_map_container.classList.remove('splitted-view');
      main_map_container.style.display = 'none';
      main_custom_data_container.style.display = 'block';
      main_custom_data_container.classList.add(
        'main_custom_data_container_fullyExtended'
      );
      map.updateSize();
    }
  });

  $('.pavement-level-item-input').click(() => {
    let options = $('input[name=pavement-level]:checked').val();

    let network = document.getElementById(
      'pavement-level-selection-list-item-network'
    );
    let branch = document.getElementById(
      'pavement-level-selection-list-item-branch'
    );
    let section = document.getElementById(
      'pavement-level-selection-list-item-section'
    );
    let network_layout_view_selector = document.getElementById(
      'network-layout-view_selector'
    );

    if (options == 0) {
      network.style.display = 'block';
      section.style.display = 'none';
      branch.style.display = 'none';
      main_map_container.style.display = 'none';
      main_custom_data_container.style.display = 'block';
      network_layout_view_selector.style.display = 'none';
      main_custom_data_container.classList.add(
        'main_custom_data_container_fullyExtended'
      );
      map.updateSize();
    } else if (options == 1) {
      network.style.display = 'block';
      section.style.display = 'none';
      branch.style.display = 'block';
      main_map_container.style.display = 'block';
      main_custom_data_container.style.display = 'none';
      network_layout_view_selector.style.display = 'flex';
      main_custom_data_container.classList.remove(
        'main_custom_data_container_fullyExtended'
      );
      map.updateSize();
    } else if (options == 2) {
      network.style.display = 'block';
      section.style.display = 'block';
      branch.style.display = 'block';
      main_map_container.style.display = 'block';
      main_custom_data_container.style.display = 'none';
      network_layout_view_selector.style.display = 'flex';
      main_custom_data_container.classList.remove(
        'main_custom_data_container_fullyExtended'
      );
      map.updateSize();
    }
  });
});

$(document).on('change', '#maptype', function(e) {
  let index = this.options.selectedIndex;

  if (index == 0) {
    $('.map__legend').hide();
    theColor = 'transparent';
    restoreDefault(theColor);
    makeTransparent();
  } else if (index == 1) {
    $('.map__legend').hide();
    $('#map__legend__noRoye').show();
    theColor = 'color';
    restoreDefault(theColor);
    // noe roye bayad inja avaz she
  } else if (index == 2) {
    $('.map__legend').hide();
    $('#map__legend__IRI').show();
    theColor = 'IRI_color';
    restoreDefault(theColor);
    IRILayerActivator();
  } else if (index == 3) {
    theColor = 'color';
    $('.map__legend').hide();
    $('#map__legend__MPD').show();
    restoreDefault(theColor);
  } else if (index == 4) {
    theColor = 'color';
    $('.map__legend').hide();
    $('#map__legend__omqShiar').show();
    restoreDefault(theColor);
  } else if (index == 5) {
    theColor = 'color';
    $('.map__legend').hide();
    $('#map__legend__PCI').show();
    restoreDefault(theColor);
  } else if (index == 6) {
    theColor = 'color';
    $('.map__legend').hide();
    $('#map__legend__action').show();
    restoreDefault(theColor);
  }
});

$(document).on('change', '#timeline-year', function(e) {
  let year = this.value;
  if (year == 1398) {
    icons_KML.setVisible(true);
    icon_KML_next_year.setVisible(false);
  } else if (year == 1399) {
    icons_KML.setVisible(false);
    icon_KML_next_year.setVisible(true);
  }
});

$(document).on('change', '#second_branch_selection', function(e) {
  let selectedPoly = this.value;
  if (selectedPoly == 'null') {
    restoreDefault(theColor);
    isClicked = false;
  } else {
    let selectedFeature = featureNameSelector(selectedPoly);
    databoxDesigner(selectedFeature);
    $('.selection-tower__details').show();
    $('#quickDetailsOnClick').show();
    $('#quickDetailsOnHover').hide();
    isClicked = true;
    singlePolySelector(selectedFeature);
  }
});

$(document).on('change', '#first_branch_selection', function(e) {
  let selectedPoly = this.value;
  if (selectedPoly == 'null') restoreDefault(theColor);
  else branchSelector(selectedPoly);
});

const dropdown = require('./dropdown.json');

function dropdownReset() {
  firstBranchDesigner(dropdown);
  secondBranchDesigner(dropdown);
}

function firstBranchDesigner(data) {
  let first_branch = document.getElementById('first_branch_selection');
  let finalText = '<option value="null" selected>انتخاب کنید</option>';
  for (let sth in data) {
    let tempText =
      '<option value=' + sth.toString() + '>' + sth.toString() + '</option>\n';
    finalText = finalText + tempText;
  }
  first_branch.innerHTML = finalText;
}

function secondBranchDesigner(data) {
  let second_branch = document.getElementById('second_branch_selection');
  let finalText = '<option value="null" selected>انتخاب کنید</option>';
  for (let something in data) {
    for (sth in data[something]) {
      let tempText =
        '<option value=' +
        sth.toString() +
        '>' +
        sth.toString() +
        '</option>\n';
      finalText = finalText + tempText;
    }
  }
  second_branch.innerHTML = finalText;
}
