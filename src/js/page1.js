d3.csv("../../../datasets/video-game-sales.csv").then(data => {
   // 格式化数据
   data.forEach(d => {
    d.Year = +d.Year;
});

// 获取前10个平台
const topPlatforms = data.map(d => d.Platform)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);

// 过滤数据，只保留前10个平台的数据
data = data.filter(d => topPlatforms.includes(d.Platform));

// 按年份和平台汇总数据
const aggregatedData = d3.rollup(
    data,
    v => v.length,  // 计算每年的游戏数量
    d => d.Year,
    d => d.Platform
);

// 找到所有的年份
const allYears = Array.from(new Set(data.map(d => d.Year))).sort();

// 转换成平面结构，并确保所有年份都有值
const processedData = [];
topPlatforms.forEach(platform => {
    // 找到该平台的最早出现年份
    const firstYear = d3.min(data.filter(dd => dd.Platform === platform), dd => dd.Year);

    // 从最早出现年份开始绘制数据
    allYears.forEach(year => {
        const sales = (year >= firstYear) ? (aggregatedData.get(year)?.get(platform) || 0) : 0;
        if (year >= firstYear - 1) {
            processedData.push({
                Year: year,
                Platform: platform,
                Game_Count: sales
            });
        }
    });
});

// 设置SVG画布的尺寸
const margin = { top: 20, right: 150, bottom: 40, left: 40 },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

// 创建SVG元素
const svg = d3.select("#chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// 定义比例尺和坐标轴
const x = d3.scaleLinear().domain([1980, d3.max(processedData, d => d.Year)]).range([0, width]);
const y = d3.scaleLinear().domain([0, d3.max(processedData, d => d.Game_Count)]).range([height, 0]);

const xAxis = d3.axisBottom(x).tickFormat(d3.format("d"));
const yAxis = d3.axisLeft(y);

// 添加X轴
svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

// 添加Y轴
svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// 定义颜色比例尺
const color = d3.scaleOrdinal(d3.schemeCategory10)
    .domain(topPlatforms);

// 添加折线
const line = d3.line()
    .x(d => x(d.Year))
    .y(d => y(d.Game_Count))
    .curve(d3.curveMonotoneX);  // 使线条平滑

const platformGroups = d3.group(processedData, d => d.Platform);

platformGroups.forEach((values, key) => {
    // 按年份排序
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
        .attr("cy", d => y(d.Game_Count))
        .attr("class", "dot")
        .style("fill", color(key))
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html("Platform: " + d.Platform + "<br/> Year: " + d.Year + "<br/> Game Count: " + d.Game_Count)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
});

// 添加图例
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

// 添加交互效果
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
});