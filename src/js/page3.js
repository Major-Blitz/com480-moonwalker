let globalData = [];

var isClicked = false;

var groupClicked = false,
    chordClicked = false;

var chosen_idx = -1;
var src_idx = -1,
    tgt_idx = -1;

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

function groupMouseMove(_, d) {
    d3.select(this).style("cursor", "pointer");
    if (!isClicked) {
        groupFocus(d.index);
    }
}

function groupFocus(d) {
    // Set opacity of all ribbons associated with the arc to 1
    d3.selectAll(".ribbon").style("opacity", function(p) {
        return (p.source.index === d || p.target.index === d) ? 1 : 0.3;
    });

    // Set opacity of all arcs to 0.3, and set the current arc's opacity to 1
    d3.selectAll(".group").style("opacity", 0.3);
    d3.selectAll(".group").filter(p => p.index === d).style("opacity", 1);
}

function unfocus() {
    d3.selectAll(".ribbon").style("opacity", 1);
    d3.selectAll(".group").style("opacity", 1);
}

function clearFocus() {
    d3.selectAll(".ribbon").style("opacity", 1);
    d3.selectAll(".group").style("opacity", 1);
    isClicked = false;
    groupClicked = false;
    chordClicked = false;
    // Show default introduction
    document.getElementById('infoCard').style.display = 'none';
    document.getElementById('defaultInfo').style.display = 'block';
}

function groupClickHandler(_, d) {
    if (groupClicked && d.index === chosen_idx) {
        clearFocus();
    } else {
        isClicked = true;
        groupClicked = true;
        chosen_idx = d.index;
        handleGroupClick(_, d);
        d3.select(this).style("cursor", "pointer");
        groupFocus(d.index);
    }
}

function chordClickHandler(_, d) {
    if (chordClicked &&
        d.source.index === src_idx &&
        d.target.index === tgt_idx
    ) {
        clearFocus();
    } else {
        chordClicked = true;
        isClicked = true;
        src_idx = d.source.index;
        tgt_idx = d.target.index;
        handleChordClick(_, d);
        chordFocus(d.source.index, d.target.index);
    }
}

function chordMouseMove(_, d) {
    d3.select(this).style("cursor", "pointer");
    if (!isClicked) {
        var srcIdx = d.source.index;
        var tgtIdx = d.target.index;

        chordFocus(d.source.index, d.target.index);
    }
}

function chordFocus(srcIdx, tgtIdx) {
    d3.selectAll(".ribbon").style("opacity", function(p) {
        return (p.source.index === srcIdx && p.target.index === tgtIdx) ? 1 : 0.3;
    });

    d3.selectAll(".group").style("opacity", function(p) {
        return (p.index === srcIdx || p.index === tgtIdx) ? 1 : 0.3;
    });
}

function mouseout() {
    if (!isClicked) {
        unfocus();
    }
}

function updateChordDiagram(matrix, genres, platforms) {
    const container = document.getElementById('container_3');
    if (!container) {
        console.error("Container not found");
        return;
    }

    const width = Math.min(window.innerWidth * 0.5, 700);
    const height = Math.min(window.innerHeight, 600);
    const marginLeft = 50; // Adjust this value to control the left margin

    if (width <= 0 || height <= 0) {
        console.error("Invalid container dimensions:", width, height);
        return;
    }

    const margin = { top: 20, right: 20, bottom: 20, left: marginLeft };

    console.log("Width:", width, "Height:", height);

    const outerRadius = Math.min(width, height) / 2 - Math.max(margin.top + margin.bottom, margin.left + margin.right);
    const innerRadius = outerRadius - 20;

    if (outerRadius <= 0 || innerRadius <= 0) {
        console.error("Invalid radius values:", outerRadius, innerRadius);
        return;
    }

    d3.select("#container_3").select("svg").remove(); // Ensure old SVG is removed when redrawing

    const svg = d3.select("#container_3").append("svg")
        .attr("width", width + marginLeft * 2)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${(width + marginLeft) / 2}, ${height / 2})`);

    // Add background rectangle for capturing clicks on empty space
    svg.append("rect")
        .attr("width", width + marginLeft * 2)
        .attr("height", height)
        .attr("transform", `translate(${-marginLeft}, ${-height / 2})`)
        .style("fill", "transparent")
        .on("click", function(event) {
            if (event.target === this) {
                clearFocus();
            }
        });

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
        .on("click", chordClickHandler)
        .on("mouseover", chordMouseMove)
        .on("mouseout", mouseout);

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

    groups.on("click", groupClickHandler)
        .on("mouseover", groupMouseMove)
        .on("mouseout", mouseout);
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

        // Show the card and hide the default info
        document.getElementById('infoCard').style.display = 'block';
        document.getElementById('defaultInfo').style.display = 'none';
    } else {
        console.error("No data available for the selected genre and platform combination.");
    }
}

function handleGroupClick(_, d) {
   // Show the group's introduction
}

window.addEventListener("load", function() {
    // Initially show default info and hide the info card
    document.getElementById('infoCard').style.display = 'none';
    document.getElementById('defaultInfo').style.display = 'block';
});
