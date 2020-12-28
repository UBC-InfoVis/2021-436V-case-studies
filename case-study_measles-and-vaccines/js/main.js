
let data, heatmap;

/**
 * Load data from CSV file asynchronously and render charts
 */
d3.json('data/measles_data.json').then(_data => {
  data = _data;
  heatmap = new Heatmap({ 
    parentElement: '#vis'
  }, data);
  heatmap.updateVis();
});