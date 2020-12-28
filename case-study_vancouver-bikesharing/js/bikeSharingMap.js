class BikeSharingMap {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _stationData, _bikewaysData) {
    this.config = {
      parentElement: _config.parentElement,
      activeControl: _config.activeControl
    }
    this.stationData = _stationData;
    this.bikewaysData = _bikewaysData;
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Instantiate the map object
    vis.map = L.map(vis.config.parentElement).setView([49.276765,-123.140116], 13);
    
    
    // Load and display a tile layer on the map (Stamen)
    L.tileLayer('https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(vis.map);

    // Defining an icon class
    let LeafIcon = L.Icon.extend({
      options: {
        shadowUrl: 'images/marker-shadow.png',
        iconSize: [25, 41],   // size of the icon
        iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
        popupAnchor: [0, -28] // popup position
      }
    });

    // Instantiate icons
    vis.redMarker = new LeafIcon({iconUrl:  'images/marker-red.png'});
    vis.blueMarker = new LeafIcon({iconUrl:  'images/marker-blue.png'});

    // Add an empty layer group for the markers
    vis.markers = L.layerGroup().addTo(vis.map);
  
    vis.updateVis()
  }

  /**
   * Update markers
   */
  updateVis() {
    let vis = this;

    // Remove old markers
    vis.markers.clearLayers();

    // Create a marker for each station
    vis.stationData.forEach(d => {

      //let popupContent =  '<strong>' + d.stationName + '</strong><br/>';
      //popupContent += 'Available Bikes: ' + d.availableBikes + '<br/>';
      //popupContent += 'Empty Docks: ' + d.emptyDocks;
      console.log(d);
      // Set marker icon depending on the state of each station
      const markerColor = (d[vis.config.activeControl] == 0) ? vis.redMarker : vis.blueMarker;

      const marker = L.marker([d.latitude, d.longitude], { icon: markerColor })
          .bindPopup(`Available bikes: ${d.free_bikes}<br>Empty slots: ${d.empty_slots}`);

      vis.markers.addLayer(marker);
    });
  }
}