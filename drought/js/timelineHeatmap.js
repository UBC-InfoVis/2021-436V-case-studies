class TimelineHeatmap {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1100,
      containerHeight: _config.containerHeight || 1100,
      margin: _config.margin || {top: 20, right: 20, bottom: 20, left: 10}
    }
    this.data = data;
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartContainer = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    vis.chart = vis.chartContainer.append('g');
    vis.focusBar = vis.chartContainer.append('rect')
        .attr('class', 'focus-bar')
        .style('display', 'none');

    vis.xScale = d3.scaleLinear()
        .domain([1,13]);

    vis.yScale = d3.scaleLinear()
        .domain([0,1]);

    vis.xGridScale = d3.scaleBand()
        .range([0, vis.width])
        .paddingInner(0.01);

    vis.yGridScale = d3.scaleBand()
        .range([0, vis.height])
        .paddingInner(0.5);

    vis.stack = d3.stack()
        .keys(['0','1','2','3','4','5','6'])
        //.offset(d3.stackOffsetExpand);

    vis.area = d3.area()
        .x(function(d, i) { return vis.xScale(d.data.month); })
        .y0(function(d) { return vis.yScale(d[0]); })
        .y1(function(d) { return vis.yScale(d[1]); })
        .curve(d3.curveStepAfter);

    vis.months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    // Group data per state (we get a nested array)
    // [['Alaska', [array with values]], ['Ala.', [array with values]], ...]
    vis.nestedData = d3.groups(vis.data, d => d.year);
    
    vis.nestedData.forEach(d => {
      if (d[0] == 2013) {
        // Copy first month. A trick that is needed to create an area chart
        // if we just have a single time point (month of January)
        const monthCopy = Object.assign({}, d[1][0]);
        monthCopy.month = 2;
        d[1].push(monthCopy);
      } else {
        const monthCopy = Object.assign({}, d[1][11]);
        monthCopy.month = 13;
        d[1].push(monthCopy);
      }
      d.stackedData = vis.stack(d[1]);
    });
    
    // Specificy accessor functions
    vis.yValue = d => d[0];
    vis.xValue = d => d.year;
    
    vis.xGridScale.domain(getArrayRange(9));
    vis.yGridScale.domain(getArrayRange(d3.max(vis.data, d => d.row)));

    vis.xScale.range([0, vis.xGridScale.bandwidth()]);
    vis.yScale.range([vis.yGridScale.bandwidth(), 0]);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;

    vis.focusBar.attr('width', vis.xGridScale.bandwidth()/12);

    // Year groups
    const yearGroup = vis.chart.selectAll('.year-group')
        .data(vis.nestedData);

    const yearGroupEnter = yearGroup.enter().append('g')
        .attr('class', 'year-group');

    yearGroupEnter.merge(yearGroup)
        .attr('transform', d => `translate(${vis.xGridScale(d[1][0].col)},${vis.yGridScale(d[1][0].row)})`)
    
    // Append year label
    yearGroupEnter.append('text')
        .attr('class', 'year-label')
        .classed('decade', d => !(parseInt(d[0]) % 10))
        .attr('y', vis.yGridScale.bandwidth() + 10)
        .attr('dy', '0.35em')
        .text(d => d[0]);

    // Append stacked areas
    const categoryPath = yearGroup.merge(yearGroupEnter).selectAll('.year-area')
        .data(d => d.stackedData);

    const categoryPathEnter = categoryPath.enter().append('path')
        .attr('class', d => `year-area cat-${d.key}`);

    categoryPathEnter.merge(categoryPath)
        .attr('d', vis.area);

    // Append percentage label
    yearGroupEnter.append('text')
        .attr('class', 'percent-label')
        .attr('dy', '0.35em')
        .attr('y', -8)
        .style('display', 'none');

    // Append transparent overlay that we will use to track the mouse position
    yearGroupEnter.append('rect')
        .attr('class', 'year-overlay')
        .attr('width', d => {
          if (d[0] == 2013) {
            return vis.xGridScale.bandwidth()/12;
          } else {
            return vis.xGridScale.bandwidth();
          }
        })
        .attr('height', vis.yGridScale.bandwidth())
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseover', function(event,d) {
          vis.focusBar.style('display', 'block');
        })
        .on('mousemove', function(event,d) {
          // Get month that corresponds to current mouse x-coordinate
          const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
          const month = Math.min(vis.xScale.invert(xPos), 12);
          const monthIndex = parseInt(month - 1);

          // Sum dry category values for the current month
          const monthData = d[1][monthIndex];
          const sumForMonth = monthData['0'] + monthData['1'] + monthData['2'];
          const ySumForMonth = vis.yScale(sumForMonth)
          
          /*
          const sumForMonth = d3.sum(dryCatData, d => {
            return d[monthIndex][1];
          });
          const ySumForMonth = vis.yScale(sumForMonth);
          */
          //console.log(dryCatData);

          vis.focusBar
              .attr('transform', `translate(${vis.xGridScale(monthData.col)},${vis.yGridScale(monthData.row)})`)
              .attr('x', vis.xScale(parseInt(month)))
              .attr('y', ySumForMonth)
              .attr('height', vis.yGridScale.bandwidth() - ySumForMonth);

          d3.select(this.parentNode).select('.year-label')
              .text(`${vis.months[monthIndex]} ${d[0]}`);
          
          d3.select(this.parentNode).select('.percent-label')
              .attr('x', vis.xScale(parseInt(month)))
              .text(`${Math.round(sumForMonth*100)}%`)
              .style('display', 'block');
        })
        .on('mouseout', function(event,d) {
          vis.focusBar.style('display', 'none');
          d3.select(this.parentNode).select('.year-label')
              .text(d[0]);

          d3.select(this.parentNode).select('.percent-label')
              .style('display', 'none');
        });


    // Annotations
    const yearGroup2013Enter = yearGroupEnter.filter(d => d[0] == 2013);

    yearGroup2013Enter.append('foreignObject')
        .attr('x', 18)
        .attr('width', 360)
        .attr('height', 40)
      .append('xhtml:body')
        .style('font', ".7rem 'Helvetica Neue'")
        .html('During January, 56% of the contiguous U.S. was in moderate to extreme drought, the highest January level since 1955.');
    
    yearGroup2013Enter.append('line')
        .attr('class', 'annotation-line')
        .attr('x1', vis.xGridScale.bandwidth()/12)
        .attr('x2', vis.xGridScale.bandwidth()/12 + 10)
        .attr('y1', vis.yGridScale.bandwidth()/2)
        .attr('y2', vis.yGridScale.bandwidth()/2);
  }
}