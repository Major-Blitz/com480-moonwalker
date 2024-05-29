// Define a fixed color mapping for platforms
const platformColorMapping = {
    "PS2": "#E69F00",
    "X360": "#56B4E9",
    "PS3": "#009E73",
    "Wii": "#F0E442",
    "DS": "#0072B2",
    "PSP": "#D55E00",
    "3DS": "#CC79A7",
    "PS4": "#999999",
    "N64": "#DDA0DD",  // Add more colors for older platforms
    "SNES": "#8A2BE2",
    "SAT": "#FF1493",
    "PS": "#00BFFF"
};

// Get the year range based on the selected option
function getYearRange(range) {
    switch(range) {
        case 'before2000':
            return [1988, 1999];
        case '2000-2010':
            return [2000, 2010];
        case '2010-2020':
            return [2010, 2016];
        default:
            return [1998, 2016]; 
    }
}

// Function to update the chart title based on the selected attribute
function updateTitle(attribute) {
    const titleMap = {
        'Game_Count': 'Number of Games Released on Platforms',
        'Global_Sales': 'Global Sales of Games on Platforms (in millions)',
        'NA_Sales': 'NA Sales of Games on Platforms (in millions)',
        'EU_Sales': 'EU Sales of Games on Platforms (in millions)',
        'Other_Sales': 'Other Sales of Games on Platforms (in millions)'
    };
    const title = titleMap[attribute] || 'Number of Games Released on Platforms';
    console.log(`Updating title to: ${title}`);
    d3.select("#chart-title").text(title);
}

// Wrap the entire chart rendering logic in a function that takes the selected attribute and time range as arguments
function renderChart(attribute, timeRange) {
    // Update the chart title
    console.log(`Updating title now`);
    updateTitle(attribute);

    const [startYear, endYear] = getYearRange(timeRange);

    d3.csv("datasets/video-game-sales.csv").then(data => {
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
        const margin = { top: 50, right: 200, bottom: 50, left: 200 };
        
        const width = Math.min(window.innerWidth * 0.6, 1200);
        const height = Math.min(window.innerHeight * 0.6, 600);

        // Create SVG element
        const svg = d3.select("#chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Define scales and axes
        const x = d3.scaleLinear().domain([startYear, endYear]).range([0, width]);
        const y = d3.scaleLinear().domain([0, d3.max(processedData, d => d[attribute])]).range([height, 0]);

        const xAxis = d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10).tickSizeOuter(0);
        const yAxis = d3.axisLeft(y).ticks(10).tickSizeOuter(0);

        // Add X axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("font-family", "Poppins")
            .style("font-size", "14px")
            .style("fill", "#1f77b4")  // Blue color for x-axis labels
            .attr("dy", "1em")
            .attr("dx", "-.8em")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        // Add Y axis
        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .selectAll("text")
            .style("font-family", "Poppins")
            .style("font-size", "14px")
            .style("fill", "#ff7f0e");  // Orange color for y-axis labels

        // Define color scale
        const colorFigure1 = d3.scaleOrdinal()
            .domain(topPlatforms)
            .range(["#E69F00", "#56B4E9", "#009E73", "#F0E442"]);

        // Define line generator
        const line = d3.line()
            .x(d => x(d.Year))
            .y(d => y(d[attribute]))
            .curve(d3.curveMonotoneX);  // Smooth the line

        // Define the initial line generator for animation
        const initialLine = d3.line()
            .x(d => x(d.Year))
            .y(y(0))  // Start at the bottom (y=0)
            .curve(d3.curveMonotoneX);

        const platformGroups = d3.group(processedData, d => d.Platform);

        platformGroups.forEach((values, key) => {
            // Sort values by year
            values.sort((a, b) => a.Year - b.Year);

            // Append the initial path (invisible)
            const path = svg.append("path")
                .datum(values)
                .attr("class", "line")
                .attr("d", initialLine)  // Use initial line generator
                .style("fill", platformColorMapping[key])
                .style("stroke", platformColorMapping[key])
                .style("stroke-width", 4)  // Increase the stroke width
                .style("fill", "none");

            console.log("platform: ", key, "color", platformColorMapping[key]);

            // Transition to the final path
            path.transition()
                .duration(1000)
                .attr("d", line);  // Use final line generator

            // Add circles for data points with transition
            svg.selectAll(`.dot-${key}`)
                .data(values)
                .enter().append("circle")
                .attr("r", 8)  // Increase the radius
                .attr("cx", d => x(d.Year))
                .attr("cy", y(0))  // Start at the bottom (y=0)
                .attr("class", `dot-${key}`)
                .style("fill", platformColorMapping[key])
                .style("stroke", "#fff")
                .style("stroke-width", 2)  // Optionally increase the stroke width for better visibility
                .on("mouseover", function(event, d) {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltip.html("Platform: " + d.Platform + "<br/> Year: " + d.Year + "<br/> " + attribute + ": " + d3.format(".2f")(d[attribute]))
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 28) + "px")
                        .style("text-align", "center");  // Ensure text alignment is center
                })
                .on("mouseout", function(d) {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .transition() // Add transition for the dots
                .duration(1000)
                .attr("cy", d => y(d[attribute]));  // Move to the final position
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
            .style("fill", d => platformColorMapping[d]);

        legend.append("text")
            .attr("x", width + 44)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "start")
            .style("font-size", "12px")
            .text(d => d);

        // Update legend color
        svg.selectAll(".legend rect")
            .data(topPlatforms)
            .style("fill", d => platformColorMapping[d]);

        svg.selectAll(".legend text")
            .data(topPlatforms)
            .text(d => d);

        // Remove redundent legend
        svg.selectAll(".legend")
            .data(topPlatforms)
            .exit()
            .remove();

        // Add tooltip for interactivity
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    });
}

// Initial render
renderChart("Game_Count", "all");

// Update chart when the attribute or time range is changed
document.getElementById("attribute-select").addEventListener("change", function() {
    const attribute = this.value;
    const timeRange = document.getElementById("time-select").value;
    updateTitle(attribute); // Update the title based on the selected attribute
    renderChart(attribute, timeRange);
});

document.getElementById("time-select").addEventListener("change", function() {
    const timeRange = this.value;
    const attribute = document.getElementById("attribute-select").value;
    renderChart(attribute, timeRange);
});
