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

  var countries = travelData.countries;

  var states = _(countries)
    .chain()
    .map(function (country) {
      return country.states;
    })
    .flatten()
    .compact()
    .value();

  var cities = (function () {
    var countryCities = _(countries)
      .chain()
      .map(function (country) {
        return country.cities;
      })
      .flatten()
      .compact()
      .value();

    var stateCities = _(states)
      .chain()
      .map(function (state) {
        return state.cities;
      })
      .flatten()
      .compact()
      .value();

    return _(countryCities).union(stateCities);
  }());

  var visitedCountryIDs = _(countries).pluck('id');

  (function addCountryOverlays() {
    addOverlaysToMap(countryData, '#33864e', function (feature) {
      return _(visitedCountryIDs).contains(feature.id);
    });
  }());

  var visitedStateIDs = _(states).pluck('id');

  (function addStateOverlays() {
    addOverlaysToMap(stateData, '#36455c', function (feature) {
      return _(visitedStateIDs).contains(feature.properties.STATE);
    });
  }());

  (function addCityMarkers() {
    var visitedCityGeoJSON = _(cities)
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
