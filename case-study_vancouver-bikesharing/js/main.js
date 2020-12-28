let bikeSharingMap;


/**
 * Load station data from live data stream and bikeways GeoJSON from local file 
 */
Promise.all([
  d3.json('http://api.citybik.es/v2/networks/mobibikes'),
  d3.json('data/vancouver_bikeways.json')
]).then(data => {
  const stationData = data[0].network.stations;
  const bikewaysData = data[1];

  console.log(stationData);

  bikeSharingMap = new BikeSharingMap({ 
    parentElement: 'bikesharing-map',
    centerCoordinates: [],
    activeControl: 'free_bikes'
  }, stationData, bikewaysData);

}).catch(function(err) {
  console.error(err);
});

/**
 * Event listeners
 */

d3.selectAll('.availability-switch-btn').on('click', function() {
  const currActive = d3.select(this).classed('active');
  d3.selectAll('.availability-switch-btn').classed('active', currActive);
  d3.select(this).classed('active', !currActive);

  bikeSharingMap.config.activeControl = d3.select('.availability-switch-btn.active').attr('data-control');
  bikeSharingMap.updateVis();
});

/*
d3.csv('data/vancouver_trails.csv')
  .then(_data => {
    data = _data;
    data.forEach(d => {
      d.time = +d.time;
      d.distance = +d.distance;
    });

    // Initialize scales
    const colorScale = d3.scaleOrdinal()
        .range(['#d3eecd', '#7bc77e', '#2a8d46']) // light green to dark green
        .domain(['Easy','Intermediate','Difficult']);
    
    scatterplot = new Scatterplot({ 
      parentElement: '#scatterplot',
      colorScale: colorScale
    }, data);
    scatterplot.updateVis();

    barchart = new Barchart({
      parentElement: '#barchart',
      colorScale: colorScale
    }, data);
    barchart.updateVis();
  })
  .catch(error => console.error(error));
*/

/**
 * Use bar chart as filter and update scatter plot accordingly
 */
/*
function filterData() {
  if (difficultyFilter.length == 0) {
    scatterplot.data = data;
  } else {
    scatterplot.data = data.filter(d => difficultyFilter.includes(d.difficulty));
  }
  scatterplot.updateVis();
}
*/

/*
d3.selectAll('.legend-btn').on('click', function() {
  // Toggle 'inactive' class
  d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));
  
  // Check which categories are active
  let selectedDifficulty = [];
  d3.selectAll('.legend-btn:not(.inactive)').each(function() {
    selectedDifficulty.push(d3.select(this).attr('data-difficulty'));
  });

  // Filter data accordingly and update vis
  scatterplot.data = data.filter(d => selectedDifficulty.includes(d.difficulty));
  scatterplot.updateVis();
});
*/