d3.csv("../../../datasets/video-game-sales.csv").then(function(data) {
    // calculate how many times platform and genre appear
    let platformCounts = {};
    let genreCounts = {};
    data.forEach(d => {
        platformCounts[d.Platform] = (platformCounts[d.Platform] || 0) + 1;
        genreCounts[d.Genre] = (genreCounts[d.Genre] || 0) + 1;
    });

    // select top 10 platforms and top 5 genres
    let topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(d => d[0]);
    let topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => d[0]);

    // filter top 5
    let filteredData = data.filter(d => topPlatforms.includes(d.Platform) && topGenres.includes(d.Genre));

    let matrix = createMatrix(filteredData, topGenres, topPlatforms);

    createChordDiagram(matrix, topGenres, topPlatforms);
});


function createMatrix(data, genres, platforms) {
    const size = genres.length + platforms.length;
    let matrix = Array.from({length: size}, () => new Array(size).fill(0));

    data.forEach(game => {
        const genreIndex = genres.indexOf(game.Genre);
        const platformIndex = platforms.indexOf(game.Platform) + genres.length;  // NOTE: platforms index needs to be shifted

        if (genreIndex !== -1 && platformIndex !== -1) {
            matrix[genreIndex][platformIndex] += parseFloat(game.Global_Sales);
            matrix[platformIndex][genreIndex] += parseFloat(game.Global_Sales); // create double link
        }
    });

    return matrix;
}

function createChordDiagram(matrix, genres, platforms) {
    const totalGroups = genres.length + platforms.length;
    const svg = d3.select("#container_1").append("svg")
        .attr("width", 960)
        .attr("height", 800)
        .append("g")
        .attr("transform", "translate(480, 400)");

    const outerRadius = 400;
    const innerRadius = 380;

    const chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending)
        (matrix);

    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);

    svg.append("g")
        .attr("class", "ribbons")
        .selectAll("path")
        .data(chord)
        .enter().append("path")
        .attr("d", ribbon)
        .style("fill", d => d3.schemeCategory10[d.source.index % 10])
        .style("stroke", d => d3.rgb(d3.schemeCategory10[d.source.index % 10]).darker());

    const group = svg.append("g")
        .attr("class", "groups")
        .selectAll("g")
        .data(chord.groups)
        .enter().append("g");

    group.append("path")
        .style("fill", d => d3.schemeCategory10[d.index % 10])
        .style("stroke", d => d3.rgb(d3.schemeCategory10[d.index % 10]).darker())
        .attr("d", arc);

    group.append("text")
        .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", d => {
            const rotateAngle = (d.angle * 180 / Math.PI - 90);
            const translateDist = outerRadius + 10;
            return `rotate(${rotateAngle}) translate(${translateDist}) ${rotateAngle > 90 && rotateAngle < 270 ? "rotate(180)" : ""}`;
        })
        .style("text-anchor", "middle")
        .text(d => {
            if (d.index < genres.length) {
                return genres[d.index];  // Genre labels
            } else {
                return platforms[d.index - genres.length];  // Platform labels
            }
        });
}
