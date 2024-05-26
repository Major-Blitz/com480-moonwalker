let globalData = [];

d3.csv("../../../datasets/video-game-sales.csv").then(function(data) {
    globalData = data;

    let platformCounts = {};
    let genreCounts = {};
    data.forEach(d => {
        platformCounts[d.Platform] = (platformCounts[d.Platform] || 0) + 1;
        genreCounts[d.Genre] = (genreCounts[d.Genre] || 0) + 1;
    });

    let topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(d => d[0]);
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
    const container = document.getElementById('container_3');
    if (!container) {
        console.error("Container not found");
        return;
    }

    const width = Math.min(window.innerWidth * 0.5, 700);
    const height = Math.min(window.innerHeight, 600);

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

    d3.select("#container_3").select("svg").remove(); // 确保重新绘制时移除旧的SVG

    const svg = d3.select("#container_3").append("svg")
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

    const ribbons = svg.append("g")
        .attr("class", "ribbons")
        .selectAll("path")
        .data(chord)
        .enter().append("path")
        .attr("d", ribbon)
        .attr("class", "ribbon")
        .style("fill", d => d3.schemeCategory10[d.source.index % 10])
        .style("stroke", d => d3.rgb(d3.schemeCategory10[d.source.index % 10]).darker())
        .on("click", handleChordClick)
        .on("mouseover", function(_, d) {
            d3.selectAll(".ribbon").style("opacity", 0.3);  // All ribbons fade
            d3.select(this).style("opacity", 1);            // Current ribbon highlighted

            d3.selectAll(".group").each(function(p) {
                d3.select(this).select("path").style("opacity", (p.index === d.source.index || p.index === d.target.index) ? 1 : 0.3);
            });
        })
        .on("mouseout", function() {
            d3.selectAll(".ribbon, .group path").style("opacity", 1);
        });

    const groups = svg.append("g")
        .attr("class", "groups")
        .selectAll("g")
        .data(chord.groups)
        .enter().append("g")
        .attr("class", "group");

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
    
    groups.on("mouseover", function(_, d) {
        // 设置与arc相关联的所有ribbon的透明度为1
        d3.selectAll(".ribbon").style("opacity", function(p) {
            return (p.source.index === d.index || p.target.index === d.index) ? 1 : 0.3;
        });
    
        // 设置所有arc的透明度为0.1，并将当前arc的透明度设置为1
        d3.selectAll(".group").style("opacity", 0.3);
        d3.select(this).style("opacity", 1);
    })
    .on("mouseout", function() {
        // 重置所有ribbon和arc的透明度
        d3.selectAll(".ribbon").style("opacity", 1);
        d3.selectAll(".group").style("opacity", 1);
    });
}

window.addEventListener("resize", function() {
    if (window.globalMatrix && window.globalGenres && window.globalPlatforms) {
        updateChordDiagram(window.globalMatrix, window.globalGenres, window.globalPlatforms);
    }
});

function handleChordClick(event, d) {
    console.log(`Clicked chord`);

    // 确定所选的 genre 和 platform
    const genres = window.globalGenres;
    const platforms = window.globalPlatforms;

    const genreIndex = d.source.index < genres.length ? d.source.index : d.target.index;
    const platformIndex = d.source.index < genres.length ? d.target.index - genres.length : d.source.index - genres.length;
    const selectedGenre = genres[genreIndex];
    const selectedPlatform = platforms[platformIndex];

    console.log(selectedGenre, selectedPlatform);

    // 筛选特定平台和类型下的所有游戏
    const filteredGames = globalData.filter(game => game.Genre === selectedGenre && game.Platform === selectedPlatform);
    
    // 寻找销量最高的游戏
    const mostPopularGame = filteredGames.reduce((max, game) => parseFloat(max.Global_Sales) > parseFloat(game.Global_Sales) ? max : game, { Global_Sales: 0 });

    // 更新DOM元素
    if (mostPopularGame.Name) {
        document.getElementById('gameTitle').textContent = mostPopularGame.Name;
        document.getElementById('gameDescription').textContent = `The best-selling ${selectedGenre} game on ${selectedPlatform}.`;
        document.getElementById('gameGenre').textContent = `Genre: ${selectedGenre}`;
        document.getElementById('gameSales').textContent = `Sales: $${mostPopularGame.Global_Sales}M`;
        document.getElementById('gameYear').textContent = `Year: ${mostPopularGame.Year || 'Unknown'}`;
        document.getElementById('gameImage').src = `/asset/topgames/${mostPopularGame.Name.replace(/[^a-zA-Z0-9]/g, '')}.jpg`;

        const infoCard = document.getElementById('infoCard');
        infoCard.style.display = 'block'; // Make sure the info card is visible
    } else {
        console.error("No data available for the selected genre and platform combination.");
    }
    const infoCard = document.getElementById('infoCard');
    infoCard.classList.remove('hidden');

}
