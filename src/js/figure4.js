
var dom = document.getElementById('container_4');
var myChart = echarts.init(dom, null, {
    renderer: 'canvas',
    useDirtyRect: false
});
var app = {};

var option;

const data = [];
for (let i = 0; i < 12; ++i) {
data.push(Math.round(Math.random() * 200));
}

const gamePublishers = [
'Electronic Arts',
'Blizzard',
'Nintendo',
'Sony',
'Microsoft Studios',
'Ubisoft',
'Take-Two',
'Square Enix',
'Sega',
'Capcom',
'Bandai Namco',
'Epic Games'
];

const colors = [
'#5470c6',
'#91cc75',
'#fac858',
'#ee6666',
'#73c0de',
'#3ba272',
'#fc8452',
'#9a60b4',
'#ea7ccc',
'#bb4b75',
'#f6d146',
'#3a89c9'
];

option = {
xAxis: {
    max: 'dataMax'
},
yAxis: {
    type: 'category',
    data: gamePublishers,
    inverse: true,
    animationDuration: 300,
    animationDurationUpdate: 300,
    max: 10 // only the largest 3 bars will be displayed
},
series: [
    {
    realtimeSort: true,
    name: 'X',
    type: 'bar',
    data: data,
    itemStyle: {
        color: function(params) {
        return colors[params.dataIndex];
        }
    },
    label: {
        show: true,
        position: 'right',
        valueAnimation: true
    }
    }
],
grid: {
    top: 50,
    right: 50,
    bottom: 50,
    left: 100
},
animationDuration: 0,
animationDurationUpdate: 3000,
animationEasing: 'linear',
animationEasingUpdate: 'linear',
graphic: [
    {
    type: 'text',
    right: 50,
    bottom: 8,
    style: {
        text: '2012',
        font: 'bold 25px Arial'
    }
    }
]
};

function run() {
for (var i = 0; i < data.length; ++i) {
    if (Math.random() > 0.9) {
    data[i] += Math.round(Math.random() * 2000);
    } else {
    data[i] += Math.round(Math.random() * 200);
    }
}
myChart.setOption({
    series: [
    {
        type: 'bar',
        data
    }
    ]
});
}

setTimeout(function () {
    run();
}, 0);

setInterval(function () {
    run();
}, 3000);

if (option && typeof option === 'object') {
    myChart.setOption(option);
}

window.addEventListener('resize', myChart.resize);