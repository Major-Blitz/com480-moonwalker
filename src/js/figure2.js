const dataset = {
    "children": [
        {"Name": "Action", "Count": 150},
        {"Name": "Adventure", "Count": 120},
        {"Name": "RPG", "Count": 100},
        {"Name": "Sports", "Count": 90},
        {"Name": "Simulation", "Count": 80},
        {"Name": "Strategy", "Count": 70},
        {"Name": "Puzzle", "Count": 60},
        {"Name": "Shooter", "Count": 10},
    ]
};

const diameter = 600;
const color = d3.scaleOrdinal(d3.schemePastel1);
const years = d3.range(2000, 2017);

const bubble = d3.pack(dataset)
                 .size([diameter, diameter])
                 .padding(1.5);

const svg = d3.select("#container_2")
              .append("svg")
              .attr("width", diameter + 200)  
              .attr("height", diameter + 50)
              .attr("class", "bubble");

const nodes = d3.hierarchy(dataset)
                .sum(function(d) { return d.Count; });

const node = svg.selectAll(".node")
                .data(bubble(nodes).descendants())
                .enter()
                .filter(function(d) {
                    return !d.children;
                })
                .append("g")
                .attr("class", "node")
                .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

node.append("title")
    .text(function(d) {
        return d.Name + ": " + d.Count;
    });

node.append("circle")
    .attr("r", function(d) {
        return d.r;
    })
    .style("fill", function(d, i) {
        return color(i);
    });

node.append("text")
    .attr("dy", ".2em")
    .text(function(d) {
        return d.data.Name;
    })
    .attr("font-size", function(d) {
        return d.r / 5;
    });

const legend = svg.append("g")
                  .attr("class", "legend")
                  .attr("transform", "translate(" + (diameter + 50) + ", 100)");

const legendItems = legend.selectAll(".legend-item")
                          .data(dataset.children)
                          .enter()
                          .append("g")
                          .attr("class", "legend-item")
                          .attr("transform", function(d, i) {
                              return "translate(0," + (i * 40) + ")";
                          });

legendItems.append("rect")
           .attr("class", "legend-color")
           .attr("fill", function(d, i) {
               return color(i);
           });

legendItems.append("text")
           .attr("x", 70)
           .attr("y", 15)
           .text(function(d) {
               return d.Name;
           });
