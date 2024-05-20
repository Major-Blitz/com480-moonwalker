d3.csv("../../../datasets/video-game-sales.csv").then(function(data) {
    let platformCounts = {};
    let genreCounts = {};
    data.forEach(d => {
        platformCounts[d.Platform] = (platformCounts[d.Platform] || 0) + 1;
        genreCounts[d.Genre] = (genreCounts[d.Genre] || 0) + 1;
    });

    let topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(d => d[0]);
    let topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => d[0]);

    let filteredData = data.filter(d => topPlatforms.includes(d.Platform) && topGenres.includes(d.Genre));

    let matrix = createMatrix(filteredData, topGenres, topPlatforms);

    window.globalMatrix = matrix;
    window.globalGenres = topGenres;
    window.globalPlatforms = topPlatforms;

    console.log("Matrix:", matrix);
    updateChordDiagram(matrix, topGenres, topPlatforms);
});

function createMatrix(data, genres, platforms) {
    const size = genres.length + platforms.length;
    let matrix = Array.from({ length: size }, () => new Array(size).fill(0));

    data.forEach(game => {
        const genreIndex = genres.indexOf(game.Genre);
        const platformIndex = platforms.indexOf(game.Platform) + genres.length;

        if (genreIndex !== -1 && platformIndex !== -1) {
            matrix[genreIndex][platformIndex] += parseFloat(game.Global_Sales);
            matrix[platformIndex][genreIndex] += parseFloat(game.Global_Sales);
        }
    });

    return matrix;
}

function updateChordDiagram(matrix, genres, platforms) {
    const container = document.getElementById('container_1');
    if (!container) {
        console.error("Container not found");
        return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width <= 0 || height <= 0) {
        console.error("Invalid container dimensions:", width, height);
        return;
    }

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };

    console.log("Width:", width, "Height:", height);

    const outerRadius = Math.min(width, height) / 2 - Math.max(margin.top + margin.bottom, margin.left + margin.right);
    const innerRadius = outerRadius - 20;

    if (outerRadius <= 0 || innerRadius <= 0) {
        console.error("Invalid radius values:", outerRadius, innerRadius);
        return;
    }

    d3.select("#container_1").select("svg").remove(); // 确保重新绘制时移除旧的SVG

    const svg = d3.select("#container_1").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

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

    const groups = svg.append("g")
        .attr("class", "groups")
        .selectAll("g")
        .data(chord.groups)
        .enter().append("g");

    groups.append("path")
        .style("fill", d => d3.schemeCategory10[d.index % 10])
        .style("stroke", d => d3.rgb(d3.schemeCategory10[d.index % 10]).darker())
        .attr("d", arc);

    groups.append("text")
        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
        .attr("dy", ".35em")
        .attr("transform", function(d) {
            const rotateAngle = (d.angle * 180 / Math.PI - 90);
            const translateDist = outerRadius + 10;
            const rotateText = (rotateAngle > 90 && rotateAngle < 270) ? "rotate(180)" : "";
            const translateY = (rotateAngle > 90 && rotateAngle < 270) ? -16 : 16;
            return `rotate(${rotateAngle}) translate(${translateDist}) ${rotateText} translate(0, ${translateY})`;
        })
        .style("text-anchor", function(d) {
            return (d.angle > Math.PI) ? "end" : "start";
        })
        .text(d => d.index < genres.length ? genres[d.index] : platforms[d.index - genres.length]);
}

window.addEventListener("resize", function() {
    if (window.globalMatrix && window.globalGenres && window.globalPlatforms) {
        updateChordDiagram(window.globalMatrix, window.globalGenres, window.globalPlatforms);
    }
});
