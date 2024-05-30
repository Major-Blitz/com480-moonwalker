$(document).ready(function () {
    // Define the legend data
    d3.csv("datasets/game_items_filtering.csv").then(
        function (data) {
            const record = JSON.parse(JSON.stringify(data));
            var curData = data;

            let width = window.innerWidth * 0.58,
                height = window.innerHeight * 0.85;
            var svg = d3
                .select("#filtering-bubbles")
                .append("svg")
                .attr("height", height)
                .attr("width", width);

            // Function to create the legend
            function createLegend(indicator) {
                var legendData = [];
                if (indicator === "fig5-show-all") {
                    legendData = [{ color: "#7f627f", label: "All Games" }];
                } else if (indicator === "fig5-price") {
                    legendData = [
                        { color: "#ff6f61", label: "<=30$" },
                        { color: "#67c2b0", label: "<=50$" },
                        { color: "#ffb74d", label: ">50$" },
                    ];
                } else if (indicator === "fig5-rating") {
                    legendData = [
                        { color: "#b2dfdb", label: ">=4.5❤" },
                        { color: "#ffab91", label: ">=4❤" },
                        { color: "#9fa8da", label: ">=3.5❤" },
                        { color: "#ffcc80", label: "<3.5❤" },
                    ];
                } else if (indicator === "fig5-genres") {
                    legendData = [
                        { color: "#4db6ac", label: "Adventure" },
                        { color: "#b39ddb", label: "Puzzle" },
                        { color: "#67c2b0", label: "RPG" },
                        { color: "#ffb74d", label: "Shooter" },
                    ];
                } else {
                    legendData = [
                        { color: "#81cfe0", label: ">=2020" },
                        { color: "#ffd369", label: ">=2010" },
                        { color: "#8aa29e", label: "<2010" },
                    ];
                }

                const legendContainer = svg
                    .append("g")
                    .attr("class", "legend")
                    .attr("transform", "translate(20, 20)");

                const legendItems = legendContainer
                    .selectAll(".legend-item")
                    .data(legendData)
                    .enter()
                    .append("g")
                    .attr("class", "legend-item")
                    .attr("transform", function (_, i) {
                        return "translate(0, " + i * 25 + ")";
                    });

                legendItems
                    .append("rect")
                    .attr("width", 20)
                    .attr("height", 20)
                    .attr("x", 5)
                    .attr("y", -1.5)
                    .style("fill", function (d) {
                        return d.color;
                    })
                    .style("cursor", "pointer")
                    .on("click", function (e, d) {
                        color_filter(indicator, d.color);
                        impl_filter(indicator);
                    });

                legendItems
                    .append("text")
                    .attr("x", 26)
                    .attr("y", 16)
                    .text(function (d) {
                        return d.label;
                    })
                    .style("fill", function (d) {
                        return "#333333";
                    })
                    .style("font-size", "20px");
            }

            function color_filter(indicator, selectedColor) {
                if (indicator === "fig5-show-all") {
                    return;
                } else if (indicator === "fig5-price") {
                    curData = curData.filter(function (d) {
                        if (selectedColor === "#ff6f61" && d.Price <= 30)
                            return true;
                        else if (
                            selectedColor === "#67c2b0" &&
                            d.Price <= 50 &&
                            d.Price > 30
                        )
                            return true;
                        else if (selectedColor === "#ffb74d" && d.Price > 50)
                            return true;
                        else return false;
                    });
                } else if (indicator === "fig5-rating") {
                    curData = curData.filter(function (d) {
                        if (selectedColor === "#b2dfdb" && d.Rating >= 4.5)
                            return true;
                        else if (
                            selectedColor === "#ffab91" &&
                            d.Rating >= 4 &&
                            d.Rating < 4.5
                        )
                            return true;
                        else if (
                            selectedColor === "#9fa8da" &&
                            d.Rating >= 3.5 &&
                            d.Rating < 4
                        )
                            return true;
                        else if (selectedColor === "#ffcc80" && d.Rating < 3.5)
                            return true;
                        else return false;
                    });
                } else if (indicator === "fig5-genres") {
                    curData = curData.filter(function (d) {
                        if (
                            selectedColor === "#4db6ac" &&
                            d["Genres"] === "Adventure"
                        )
                            return true;
                        else if (
                            selectedColor === "#b39ddb" &&
                            d["Genres"] === "Puzzle"
                        )
                            return true;
                        else if (
                            selectedColor === "#67c2b0" &&
                            d["Genres"] === "RPG"
                        )
                            return true;
                        else if (
                            selectedColor === "#ffb74d" &&
                            d["Genres"] === "Shooter"
                        )
                            return true;
                        else return false;
                    });
                } else if (indicator === "fig5-release-year") {
                    curData = curData.filter(function (d) {
                        if (
                            selectedColor === "#81cfe0" &&
                            d["Release Date"] >= 2020
                        )
                            return true;
                        else if (
                            selectedColor === "#ffd369" &&
                            d["Release Date"] >= 2010 &&
                            d["Release Date"] < 2020
                        )
                            return true;
                        else if (
                            selectedColor === "#8aa29e" &&
                            d["Release Date"] < 2010
                        )
                            return true;
                        else return false;
                    });
                }
                if (curData.length === 0) {
                    curData = record;
                    color_filter(indicator, selectedColor);
                }
            }

            function impl_filter(indicator) {
                // Remove existing elements except for the legend
                svg.selectAll(".circleContainer, circle, text").remove();
            
                // Remove existing groups
                svg.selectAll("g").remove();
                let radius = 30;
                if (curData.length <= 10) {
                    radius = 60;
                } else if (curData.length <= 15) {
                    radius = 45;
                } else if (curData.length <= 25) {
                    radius = 40;
                }
            
                createLegend(indicator);
            
                let elem_updated = svg
                    .selectAll("g.circleContainer")
                    .data(curData)
                    .enter()
                    .append("g")
                    .attr("class", "circleContainer");
            
                elem_updated
                    .data(curData)
                    .append("circle")
                    .attr("class", "fig5-circle")
                    .style("cursor", "pointer")
                    .attr("r", radius)
                    .style("fill", (d) => {
                        if (indicator === "fig5-show-all") {
                            return "#7f627f";
                        } else if (indicator === "fig5-price") {
                            if (d.Price <= 15) return "#ff6f61";
                            else if (d.Price <= 25) return "#67c2b0";
                            else return "#ffb74d";
                        } else if (indicator === "fig5-rating") {
                            if (d.Rating >= 4.5) return "#b2dfdb";
                            else if (d.Rating >= 4) return "#ffab91";
                            else if (d.Rating >= 3.5) return "#9fa8da";
                            else return "#ffcc80";
                        } else if (indicator === "fig5-genres") {
                            if (d["Genres"] === "Adventure") return "#4db6ac";
                            else if (d["Genres"] === "Puzzle") return "#b39ddb";
                            else if (d["Genres"] === "RPG") return "#67c2b0";
                            else return "#ffb74d";
                        } else if (indicator === "fig5-release-year") {
                            if (d["Release Date"] >= 2020) return "#81cfe0";
                            else if (d["Release Date"] >= 2010) return "#ffd369";
                            else return "#8aa29e";
                        }
                    })
                    .on("click", function (e, d) {
                        d3.selectAll(".fig5-circle")
                            .transition()
                            .duration(300)
                            .attr("r", radius)
                            .attr("stroke-width", 0);
            
                        // Increase the radius and stroke width of the clicked bubble for highlighting
                        d3.select(this)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.2)
                            .attr("stroke-width", 2)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.1)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.2)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.15)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.1);
            
                        d3.selectAll("#fig5_item_image").attr(
                            "src",
                            "images/game-item-figs/" + d["Item Name"] + ".jpg"
                        );
            
                        d3.selectAll("#fig5-title h3").text(d["Item Name"]);
                        d3.selectAll("#fig5-subtitle").text(d["Item Subname"]);
            
                        d3.selectAll("#fig5-developers").text(d["Developers"]);
                        d3.selectAll("#fig5-release").text(d["Release Date"]);
                        d3.selectAll("#fig5-genres-show").text(d["Genres"]);
                        d3.selectAll("#fig5-review").text(d["Review"]);
            
                        d3.selectAll("#fig5_price")
                            .select("text")
                            .text(d["Price"] + '💰');
                        d3.selectAll("#fig5_rating")
                            .select("text")
                            .text(d["Rating"] + "/5.0" + '🌟');
                        d3.selectAll("#fig5_recommended")
                            .select("text")
                            .text(d["Wish"] + '❤️');
            
                        document.getElementById("fig5-descrip").innerHTML =
                            document.getElementById("fig5_after_click").innerHTML;
                    });
            
                elem_updated
                    .append("text")
                    .attr("text-anchor", "middle")
                    .style("font-size", "12px")
                    .style("cursor", "pointer")
                    .text((d) => {
                        if (indicator === "fig5-show-all")
                            return d["Item Name"].substring(0, 3);
                        else if (indicator === "fig5-rating") return d.Rating;
                        else if (indicator === "fig5-price") return d.Price;
                        else if (indicator === "fig5-genres") return d["Genres"].substring(0, 3);
                        else return d["Release Date"];
                    })
                    .on("click", function (e, d) {
                        d3.selectAll(".fig5-circle")
                            .transition()
                            .duration(300)
                            .attr("r", radius)
                            .attr("stroke-width", 0);
            
                        // Increase the radius and stroke width of the clicked bubble for highlighting
                        d3.select(this)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.2)
                            .attr("stroke-width", 2)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.1)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.2)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.15)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.1);
            
                        d3.selectAll("#fig5_item_image").attr(
                            "src",
                            "images/game-item-figs/" + d["Item Name"] + ".jpg"
                        );
            
                        d3.selectAll("#fig5-title h3").text(d["Item Name"]);
                        d3.selectAll("#fig5-subtitle").text(d["Item Subname"]);
            
                        d3.selectAll("#fig5-developers").text(d["Developers"]);
                        d3.selectAll("#fig5-release").text(d["Release Date"]);
                        d3.selectAll("#fig5-genres-show").text(d["Genres"]);
                        d3.selectAll("#fig5-review").text(d["Review"]);
            
                        d3.selectAll("#fig5_price")
                            .select("text")
                            .text(d["Price"] + '💰');
                        d3.selectAll("#fig5_rating")
                            .select("text")
                            .text(d["Rating"] + "/5.0" + '🌟');
                        d3.selectAll("#fig5_recommended")
                            .select("text")
                            .text(d["Wish"] + '❤️');
            
                        document.getElementById("fig5-descrip").innerHTML =
                            document.getElementById("fig5_after_click").innerHTML;
                    });
            
                var simulation = d3
                    .forceSimulation()
                    .force("x", d3.forceX(width / 2).strength(0.1)) // Decrease the strength of the x-axis force
                    .force("y", d3.forceY(height / 2).strength(0.1)) // Decrease the strength of the y-axis force
                    .force(
                        "collide",
                        d3
                            .forceCollide()
                            .radius(radius + 0.5)
                            .strength(0.7) // Adjust the strength of the collision force as needed
                    )
                    .on("tick", function () {
                        elem_updated.attr("transform", function (d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    });
            
                simulation.nodes(curData);
            }
            
            function impl_filter_intial() {
                // Remove existing elements except for the legend
                svg.selectAll(".circleContainer, circle, text").remove();
            
                // Remove existing groups
                svg.selectAll("g").remove();
            
                let radius = 30;
                if (curData.length <= 10) {
                    radius = 40;
                }
            
                curData = record;
                preData = record;
                createLegend("fig5-show-all");
            
                let elem_updated = svg
                    .selectAll("g")
                    .data(curData)
                    .enter()
                    .append("g")
                    .attr("class", "circleContainer");
            
                elem_updated
                    .data(curData)
                    .append("circle")
                    .attr("class", "fig5-circle")
                    .style("cursor", "pointer")
                    .attr("r", radius)
                    .style("fill", "#7f627f")
                    .on("click", function (e, d) {
                        d3.selectAll(".fig5-circle")
                            .transition()
                            .duration(300)
                            .attr("r", radius)
                            .attr("stroke-width", 0);
            
                        // Increase the radius and stroke width of the clicked bubble for highlighting
                        d3.select(this)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.2)
                            .attr("stroke-width", 2)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.1)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.2)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.15)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.1);
            
                        d3.selectAll("#fig5_item_image").attr(
                            "src",
                            "images/game-item-figs/" + d["Item Name"] + ".jpg"
                        );
            
                        d3.selectAll("#fig5-title h3").text(d["Item Name"]);
                        d3.selectAll("#fig5-subtitle").text(d["Item Subname"]);
            
                        d3.selectAll("#fig5-developers").text(d["Developers"]);
                        d3.selectAll("#fig5-release").text(d["Release Date"]);
                        d3.selectAll("#fig5-genres-show").text(d["Genres"]);
                        d3.selectAll("#fig5-review").text(d["Review"]);
            
                        d3.selectAll("#fig5_price")
                            .select("text")
                            .text(d["Price"] + '💰');
                        d3.selectAll("#fig5_rating")
                            .select("text")
                            .text(d["Rating"] + "/5.0" + '🌟');
                        d3.selectAll("#fig5_recommended")
                            .select("text")
                            .text(d["Wish"] + '❤️');
            
                        document.getElementById("fig5-descrip").innerHTML =
                            document.getElementById("fig5_after_click").innerHTML;
                    });
            
                elem_updated
                    .append("text")
                    .attr("text-anchor", "middle")
                    .style("font-size", "12px")
                    .style("cursor", "pointer")
                    .text((d) => {
                        return d["Item Name"].substring(0, 3);
                    })
                    .on("click", function (e, d) {
                        d3.selectAll(".fig5-circle")
                            .transition()
                            .duration(300)
                            .attr("r", radius)
                            .attr("stroke-width", 0);
            
                        // Increase the radius and stroke width of the clicked bubble for highlighting
                        d3.select(this)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.2)
                            .attr("stroke-width", 2)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.1)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.2)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.15)
                            .transition()
                            .duration(300)
                            .attr("r", radius * 1.1);
            
                        d3.selectAll("#fig5_item_image").attr(
                            "src",
                            "images/game-item-figs/" + d["Item Name"] + ".jpg"
                        );
            
                        d3.selectAll("#fig5-title h3").text(d["Item Name"]);
                        d3.selectAll("#fig5-subtitle").text(d["Item Subname"]);
            
                        d3.selectAll("#fig5-developers").text(d["Developers"]);
                        d3.selectAll("#fig5-release").text(d["Release Date"]);
                        d3.selectAll("#fig5-genres-show").text(d["Genres"]);
                        d3.selectAll("#fig5-review").text(d["Review"]);
            
                        d3.selectAll("#fig5_price")
                            .select("text")
                            .text(d["Price"] + '💰');
                        d3.selectAll("#fig5_rating")
                            .select("text")
                            .text(d["Rating"] + "/5.0" + '🌟');
                        d3.selectAll("#fig5_recommended")
                            .select("text")
                            .text(d["Wish"] + '❤️');
            
                        document.getElementById("fig5-descrip").innerHTML =
                            document.getElementById("fig5_after_click").innerHTML;
                    });
            
                var simulation = d3
                    .forceSimulation()
                    .force("x", d3.forceX(width / 2).strength(0.1)) // Decrease the strength of the x-axis force
                    .force("y", d3.forceY(height / 2).strength(0.1)) // Decrease the strength of the y-axis force
                    .force(
                        "collide",
                        d3
                            .forceCollide()
                            .radius(radius + 0.5)
                            .strength(0.7) // Adjust the strength of the collision force as needed
                    )
                    .on("tick", function () {
                        elem_updated.attr("transform", function (d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        });
                    });
            
                simulation.nodes(curData);
            }            

            // Function to toggle button animation
            function toggleButtonAnimation(button) {
                // Remove animation class from all buttons
                d3.selectAll(".fig5-button").classed(
                    "flicker-animation",
                    false
                );

                // Add animation class to the clicked button
                d3.select(button).classed("flicker-animation", true);
            }

            // initialize the bubbles and add event listeners for the buttons
            impl_filter_intial();
            d3.select("#fig5-show-all").on("click", function () {
                document.getElementById("fig5-descrip").innerHTML =
                    document.getElementById("fig5_refresh").innerHTML;
                toggleButtonAnimation("#fig5-show-all");
                impl_filter_intial();
            });
            d3.select("#fig5-price").on("click", function () {
                toggleButtonAnimation("#fig5-price");
                impl_filter("fig5-price");
            });
            d3.select("#fig5-rating").on("click", function () {
                toggleButtonAnimation("#fig5-rating");
                impl_filter("fig5-rating");
            });
            d3.select("#fig5-genres").on("click", function () {
                toggleButtonAnimation("#fig5-genres");
                impl_filter("fig5-genres");
            });
            d3.select("#fig5-release-year").on("click", function () {
                toggleButtonAnimation("#fig5-release-year");
                impl_filter("fig5-release-year");
            });
        }
    );
});
