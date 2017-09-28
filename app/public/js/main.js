$(document).ready(function(){
  load_charts();
});

function load_charts(){
var xhrWords = new XMLHttpRequest();
xhrWords.onreadystatechange = function() {
    if (xhrWords.readyState == 4) {
        data = xhrWords.responseText;
        data = JSON.parse(data);
        wordCloud(data["words"]);
    }
}
xhrWords.open('POST', 'fetchdata', true);
xhrWords.setRequestHeader( "Content-Type", "application/json; charset=UTF-8" );
xhrWords.send(JSON.stringify({"chart" : "wordcloud","userselect" :"Me"}));


var xhrSeries = new XMLHttpRequest();
xhrSeries.onreadystatechange = function() {
    if (xhrSeries.readyState == 4) {
        data = xhrSeries.responseText;
        data = JSON.parse(data);
        timeseries(data["seriesData"],"prosecuting_agency","dfdf","sdsad");
    }
}
xhrSeries.open('POST', 'fetchdata', true);
xhrSeries.setRequestHeader( "Content-Type", "application/json; charset=UTF-8" );
xhrSeries.send(JSON.stringify({"chart" : "timeseries"}));

}



var xhrPerformance = new XMLHttpRequest();
xhrPerformance.onreadystatechange = function() {
    if (xhrPerformance.readyState == 4) {
        data = xhrPerformance.responseText;
        data = JSON.parse(data);
        bar_chart(data["barData"], 'trigram','User','Frequency');
    }
}
xhrPerformance.open('POST', 'fetchdata', true);
xhrPerformance.setRequestHeader( "Content-Type", "application/json; charset=UTF-8" );
xhrPerformance.send(JSON.stringify({"chart" : "perfomanceBar"}));


function timeseries(data,bind,x_label,y_label){
  var chart = c3.generate({
    bindto: '#'+bind,
    size: {
    },
    data: {
        x: 'x',
        columns: data
    },
    zoom: {
  enabled: true
},
    axis: {
        x: {
            type: 'timeseries',
            label: "Day",
            tick: {
                format: '%Y-%m-%d',
                rotate: 75,
                fit: false,
                multiline: false
            }
          },
            y: {
                label: "Overall activity count",
                min: 0,
                padding: { top: 10, bottom: 0 }
            }
    }
});
}

function changeCloud(selectedValue) {
  var xhrWords = new XMLHttpRequest();
  xhrWords.onreadystatechange = function() {
      if (xhrWords.readyState == 4) {
          data = xhrWords.responseText;
          data = JSON.parse(data);
           $('#scatterplot').jQCloud('update', data["words"]);
      }
  }
  xhrWords.open('POST', 'fetchdata', true);
  xhrWords.setRequestHeader( "Content-Type", "application/json; charset=UTF-8" );
  xhrWords.send(JSON.stringify({"chart" : "wordcloud","userselect" :selectedValue}));
}


function wordCloud(data) {
$('#scatterplot').jQCloud(data, {
  shape: 'circular',
  center: {x:0.6,y:0.5},
   colors: ["#800026", "#bd0026", "#e31a1c", "#fc4e2a"],
  fontSize: {
    from: 0.1,
    to: 0.02
  },
  autoResize: true
});
}
function bar_chart(data, bind,x_label, y_label){
  var chart = c3.generate({
    bindto: '#'+bind,
      size: {
       height: 500,
     width: $('#'+bind)[0].offsetWidth - 10
  },
    data: {
      x: 'x',
      columns: data,
      type: 'bar',
    },
       subchart: {
        show: true
    },
    axis: {
        x: {
            type: 'category',
            label: x_label,
            tick: {
                rotate: 75,
                multiline: false
            },
            extent: [0, 3]
        },
        y: {
            label: y_label,
            min: 0,
            padding: { top: 10, bottom: 0 }
        },
    },

    bar: {
      ratio : 0.5
    },
    legend: {
        show: false
    },
    padding:{
      bottom: 10
    },
    tooltip: {
        format: {
            title: function (d) {
                return x_label;
            }
        }
    }
  });
}
