// Data source:
// https://www.ncdc.noaa.gov/data-access/paleoclimatology-data/datasets/tree-ring/drought-variability

// Load data from CSV file
d3.csv('data/pdsi.csv')
  .then(data => {
    console.log(data);
    data.forEach(d => {
      data.columns.forEach(col => {
        if (col != 'key') {
          d[col] = +d[col];
        }
      });

      d.year = d.key.substring(0, 4);
      d.month = parseInt(d.key.substring(4, 6));
      d.col = +d.year[d.year.length-1];
      d.year = +d.year;
    });

    timelineHeatmap = new TimelineHeatmap({ 
      parentElement: '#timeline'
    }, data);
    timelineHeatmap.updateVis();
    
  });


function getArrayRange(max) {
  return Array.from(Array(max+1).keys());
}
