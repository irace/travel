L.mapbox.accessToken = 'pk.eyJ1IjoiaXJhY2UiLCJhIjoiOFRlNWJSOCJ9.DnNeo9t7r0a5irSR1Be4_Q';

var map = L.mapbox.map('map-one', 'irace.km1dk6m1', {
  attributionControl: false        
});

var processData = function (error, results) {
  var stateData   = results[0] 
    , countryData = results[1]
    , travelData  = results[2];

  var addOverlaysToMap = function (geoJSON, fillColor, filter) {
    L.geoJson(geoJSON, {
      style: function () {
        return {
          weight: 1,
          opacity: 0.8,
          color: 'darkgray',
          fillOpacity: 0.7,
          fillColor: fillColor
        };
      },
      filter: filter
    }).addTo(map);
  };

  (function addCountryOverlays() {
    var visitedCountryIDs = _(travelData.countries).pluck('id');

    addOverlaysToMap(countryData, '#33864e', function (feature) {
      return _(visitedCountryIDs).contains(feature.id);
    });
  }());

  (function addStateOverlays() {
    var visitedStateIDs = _(travelData.countries)
      .chain()
      .map(function (country) {
        return _(country.states).pluck('id');
      })
      .flatten()
      .value();

    addOverlaysToMap(stateData, '#36455c', function (feature) {
      return _(visitedStateIDs).contains(feature.properties.STATE);
    });
  }());

  (function addCityMarkers() {
    var visitedCityGeoJSON = _(travelData.cities)
      .chain()
      .map(function (city) {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: city.coordinates
          },
          properties: {
            title: city.name,
            description: city.description,
            'marker-size': 'medium',
            'marker-color': '#93949E'
          }
        };
      })
      .value();

      L.mapbox.featureLayer({
        type: 'FeatureCollection',
        features: visitedCityGeoJSON
      }).addTo(map);
    }());

  (function addLegendControl() {
    var message = _.size(visitedStateIDs) + ' states, ' + _.size(visitedCountryIDs) + ' countries visited';

    map.addControl(L.mapbox.legendControl().addLegend(message));
  }());
};

// Fetch travel data and state/country GeoJSON

(function fetchData() {
  // Create an array of curried functions suitable to pass into `async.parallel`
  var dataFetchers = _(['states.geojson', 'countries.geojson', 'travel.json']).map(function (fileName) {
    return function (callback) {
      $.getJSON('data/' + fileName, function (data) {
        callback(null, data);
      });
    };
  });

  async.parallel(dataFetchers, processData);
}());
