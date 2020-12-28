class Heatmap {

  /**
   * Class constructor with initial configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 1100,
      containerHeight: _config.containerHeight || 800,
      cellPadding: 2,
      tooltipPadding: _config.tooltipPadding || 15,
      margin: _config.margin || {top: 45, right: 20, bottom: 20, left: 45}
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

    vis.colorScale = d3.scaleSequential()
        .interpolator(d3.interpolateReds);

    vis.xScale = d3.scaleLinear()
        .range([0, vis.width]);

    vis.yScale = d3.scaleBand()
        .range([0, vis.height])
        .paddingInner(0.2);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale)
        .ticks(6)
        .tickSize(0)
        .tickFormat(d3.format("d")) // Remove comma delimiter for thousands
        .tickPadding(10);

    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement)
        .attr('width', vis.config.containerWidth)
        .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chartArea = vis.svg.append('g')
        .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chartArea.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);

    vis.chart = vis.chartArea.append('g');

    // Annotations
    vis.vaccineLine = vis.chartArea.append('line')
        .attr('class', 'vaccine-line');

    vis.vaccineLabel = vis.chartArea.append('text')
        .attr('class', 'vaccine-label')
        .attr('text-anchor', 'middle')
        .attr('y', -20)
        .attr('dy', '0.85em')
        .text('Vaccine introduced');

    // Caption
    vis.svg.append('text')
        .attr('dy', '0.85em')
        .text('The heat map below shows the number of cases per 100,000 people.')
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this;

    // Group data per state (we get a nested array)
    // [['Alaska', [array with values]], ['Ala.', [array with values]], ...]
    vis.nestedData = d3.groups(data, d => d.state);
    
    // Specificy accessor functions
    vis.yValue = d => d[0];
    vis.colorValue = d => d.value;
    vis.xValue = d => d.year;
   
    // Set the scale input domains
    vis.colorScale.domain(d3.extent(vis.data, vis.colorValue));
    vis.xScale.domain(d3.extent(vis.data, vis.xValue));
    vis.yScale.domain(vis.nestedData.map(vis.yValue));
    
    vis.renderVis();
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this;

    const cellWidth = (vis.width / (vis.xScale.domain()[1] - vis.xScale.domain()[0])) - vis.config.cellPadding;
    
    // 1. Level: rows
    const row = vis.chart.selectAll(".h-row")
        .data(vis.nestedData);

    // Enter
    var rowEnter = row.enter().append("g")
        .attr("class", "h-row");

    rowEnter.append("text")
        .attr("class", "h-label")
        .attr('text-anchor', 'end')
        .attr('dy', '0.85em')
        .attr('x', -8)
        .text(vis.yValue)

    // Enter + update
    rowEnter.merge(row)
        .attr("transform", d => `translate(0,${vis.yScale(vis.yValue(d))})`);

    // Exit
    row.exit().remove();


    // 2. Level: columns

    // 2a) Actual cells
    const cell = row.merge(rowEnter).selectAll(".h-cell")
        .data(d => d[1]);

    // Enter
    const cellEnter = cell.enter().append("rect")
        .attr("class", "h-cell");

    // Enter + update
    cellEnter.merge(cell)
        .attr("height", vis.yScale.bandwidth())
        .attr("width", cellWidth)
        .attr("x", d => vis.xScale(vis.xValue(d)))
        .attr("fill", d => {
          if (d.value == 0) {
            return '#f0f6fe';
          } else if (d.value === null) {
            return '#fff';
          } else {
            return vis.colorScale(vis.colorValue(d));
          }
        })
        .on('mouseover', (event,d) => {
          const value = (d.value === null) ? 'No data available' : Math.round(d.value * 100) / 100;
          d3.select('#tooltip')
            .style('display', 'block')
            .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
            .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
            .html(`
              <div class="tooltip-title">${d.state}</div>
              <div>${d.year}: <strong>${value}</strong></div>
            `);
        })
        .on('mouseleave', () => {
          d3.select('#tooltip').style('display', 'none');
        });

    // 2b) Diagonal lines for NA values
    const cellNa = row.merge(rowEnter).selectAll(".h-cell-na")
        .data(d => d[1].filter(k => k.value === null));

    const cellNaEnter = cellNa.enter().append("line")
        .attr("class", "h-cell-na");

    cellNaEnter.merge(cellNa)
        .attr("x1", d => vis.xScale(vis.xValue(d)))
        .attr("x2", d => vis.xScale(vis.xValue(d)) + cellWidth)
        .attr("y1", vis.yScale.bandwidth())
        .attr("y2", 0);


    // Set position of annotations
    const xVaccineIntroduced = vis.xScale(1963);
    vis.vaccineLine
        .attr('x1', xVaccineIntroduced)
        .attr('x2', xVaccineIntroduced)
        .attr('y1', -5)
        .attr('y2', vis.height);

    vis.vaccineLabel.attr('x', xVaccineIntroduced);
    
    // Update axis
    vis.xAxisG.call(vis.xAxis);
  }
}