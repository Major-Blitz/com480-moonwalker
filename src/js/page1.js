// Function to get the year range based on the selected option
function getYearRange(range) {
    switch(range) {
        case 'before2000':
            return [1980, 1999];
        case '2000-2010':
            return [2000, 2010];
        case '2010-2020':
            return [2010, 2020];
        default:
            return [1980, 2024]; // Assuming the dataset includes up to the year 2024
    }
}

// Function to update the chart title based on the selected attribute
function updateTitle(attribute) {
    const titleMap = {
        'Game_Count': 'Number of Games Released on Platforms',
        'Global_Sales': 'Global Sales of Games on Platforms (in millions)',
        'NA_Sales': 'NA Sales of Games on Platforms (in millions)',
        'EU_Sales': 'EU Sales of Games on Platforms (in millions)',
        'JP_Sales': 'JP Sales of Games on Platforms (in millions)',
        'Other_Sales': 'Other Sales of Games on Platforms (in millions)'
    };
    const title = titleMap[attribute] || 'Number of Games Released on Platforms';
    d3.select("#chart-title").text(title);
}

// Wrap the entire chart rendering logic in a function that takes the selected attribute and time range as arguments
function renderChart(attribute, timeRange) {
    const [startYear, endYear] = getYearRange(timeRange);

    d3.csv("../../../datasets/video-game-sales.csv").then(data => {
        // Format the data
        data.forEach(d => {
            d.Year = +d.Year;
            d.Global_Sales = +d.Global_Sales;
            d.NA_Sales = +d.NA_Sales;
            d.EU_Sales = +d.EU_Sales;
            d.JP_Sales = +d.JP_Sales;
            d.Other_Sales = +d.Other_Sales;
        });

        // Filter data to include only the years within the selected range
        data = data.filter(d => d.Year >= startYear && d.Year <= endYear);

        // Calculate the total value for the selected attribute for each platform
        const platformTotals = d3.rollup(data, 
            v => attribute === 'Game_Count' ? v.length : d3.sum(v, d => d[attribute]), 
            d => d.Platform
        );

        // Get the top 4 platforms by the selected attribute value
        const topPlatforms = Array.from(platformTotals.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(d => d[0]);

        // Filter data to include only the top 4 platforms
        data = data.filter(d => topPlatforms.includes(d.Platform));

        // Aggregate data by year and platform
        const aggregatedData = d3.rollup(
            data,
            v => attribute === 'Game_Count' ? v.length : d3.sum(v, d => d[attribute]),
            d => d.Year,
            d => d.Platform
        );

        // Get all the years present in the data within the selected range
        const allYears = Array.from(new Set(data.map(d => d.Year))).sort();

        // Transform the data into a flat structure and ensure all years have values
        const processedData = [];
        topPlatforms.forEach(platform => {
            // Get the earliest year this platform appears with a non-zero count
            const firstYear = d3.min(data.filter(dd => dd.Platform === platform), dd => dd.Year);

            // Add the year before the first year with a zero count if it is within the selected range
            if (firstYear > startYear) {
                processedData.push({
                    Year: firstYear - 1,
                    Platform: platform,
                    [attribute]: 0
                });
            }

            // Plot data starting from the earliest year the platform appears
            allYears.forEach(year => {
                if (year >= firstYear) {
                    const value = aggregatedData.get(year)?.get(platform) || 0;
                    processedData.push({
                        Year: year,
                        Platform: platform,
                        [attribute]: value
                    });
                }
            });
        });

        // Clear existing SVG
        d3.select("#chart").selectAll("*").remove();

        // Set up SVG canvas dimensions
        const margin = { top: 20, right: 200, bottom: 40, left: 40 },
              width = 960 - margin.left - margin.right,
              height = 500 - margin.top - margin.bottom;

        // Create SVG element
        const svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Define scales and axes
        const x = d3.scaleLinear().domain([startYear, endYear]).range([0, width]);
        const y = d3.scaleLinear().domain([0, d3.max(processedData, d => d[attribute])]).range([height, 0]);

        const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
        const yAxis = d3.axisLeft(y);

        // Add X axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add Y axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // Define color scale
        const color = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(topPlatforms);

        // Add lines for each platform
        const line = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d[attribute]))
            .curve(d3.curveMonotoneX);  // Smooth the line

        const platformGroups = d3.group(processedData, d => d.Platform);

        platformGroups.forEach((values, key) => {
            // Sort values by year
            values.sort((a, b) => a.Year - b.Year);

            svg.append("path")
                .datum(values)
                .attr("class", "line")
                .attr("d", line)
                .style("stroke", color(key));

            svg.selectAll("dot")
                .data(values)
                .enter().append("circle")
                .attr("r", 5)
                .attr("cx", d => x(d.Year))
                .attr("cy", d => y(d[attribute]))
                .attr("class", "dot")
                .style("fill", color(key))
                .on("mouseover", function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html("Platform: " + d.Platform + "<br/> Year: " + d.Year + "<br/> " + attribute + ": " + d[attribute])
                        .style("left", (event.pageX + 5) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function(d) {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        });

        // Add legend
        const legend = svg.selectAll(".legend")
            .data(topPlatforms)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => "translate(0," + i * 20 + ")");

        legend.append("rect")
            .attr("x", width + 20)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", width + 44)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .text(d => d);

        // Add tooltip for interactivity
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    });
}

// Initial render with default attribute and time range
renderChart('Game_Count', 'all');

// Add event listeners to the dropdown menus
d3.select("#attribute-select").on("change", function() {
    const selectedAttribute = d3.select(this).property("value");
    const selectedTimeRange = d3.select("#time-select").property("value");
    updateTitle(selectedAttribute); // Update the title based on the selected attribute
    renderChart(selectedAttribute, selectedTimeRange);
});

d3.select("#time-select").on("change", function() {
    const selectedAttribute = d3.select("#attribute-select").property("value");
    const selectedTimeRange = d3.select(this).property("value");
    renderChart(selectedAttribute, selectedTimeRange);
});