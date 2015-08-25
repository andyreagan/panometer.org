// on page load, queue's up the geo json and draps the map on return (using dataloaded())
// at the end of this function, queue's up the map data and calls updatedMap() to put points on the map.
// updateMap() is the end of the road for the initial load
//
// the year window buttons, and the variable dropdown will trigger updateMap()
// the year drop down ... (#yeardroplist) calls changeYear()
// the play button ...  calls changeYear()
//
// TODO
// -add a timeline
// -combine the extent and date
// -fix left/right bounds on bottom plot
// -label teletherms in bottom plot
// -more info in pop-up

// globally namespace these things
var geoJson;
var stateFeatures;

var arrowradius = 16;

// the main variables for the file load
// careful not to overload "window"
var windowEncoder = d3.urllib.encoder().varname("window"); //.varval(...);
var windowDecoder = d3.urllib.decoder().varname("window").varresult("25");
var windows = ["10","25","50"];
var windowIndex = 0;
var currentWindow;
for (var i=0; i<windows.length; i++) {
    if (windowDecoder().cached === windows[i]) {
	windowIndex = i;
    }
}
currentWindow = windowDecoder().cached;
windowEncoder.varval(currentWindow);

// the main variables for the file load
// careful not to overload "window"
var cityEncoder = d3.urllib.encoder().varname("city"); //.varval(...);
var cityDecoder = d3.urllib.decoder().varname("city").varresult("No city");
var currentCityIndex = -1;
if (cityDecoder.cached !== "No city") {
    for (var i=0; i<locations.length; i++) {
        if (cityDecoder().cached === locations[i][3]) {
	    currentCityIndex = i;
        }
    }
}


var city_clicked_initial_load = function(d) {
    var city_name_split = d[3].split(",");
    var proper_city_name = city_name_split[0].split(" ");
    for (var i=0; i<proper_city_name.length; i++) {
        proper_city_name[i] = proper_city_name[i][0].toUpperCase() + proper_city_name[i].slice(1).toLowerCase();
    }
    var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",")+":";

    document.getElementById("stationname").innerHTML = city_name;
    
    console.log(d[0]);
    
    queue()
	.defer(d3.text,"/data/teledata/stations/tmax_boxplot_0"+d[0]+".txt")
	.defer(d3.text,"/data/teledata/stations/tmax_0"+d[0]+".txt")
	.defer(d3.text,"/data/teledata/stations/tmax_smoothed_0"+d[0]+".txt")
	.defer(d3.text,"/data/teledata/stations/tmax_coverage_0"+d[0]+".txt")
	.defer(d3.text,"/data/teledata/stations/tmin_boxplot_0"+d[0]+".txt")
	.defer(d3.text,"/data/teledata/stations/tmin_0"+d[0]+".txt")
	.defer(d3.text,"/data/teledata/stations/tmin_smoothed_0"+d[0]+".txt")
	.defer(d3.text,"/data/teledata/stations/tmin_coverage_0"+d[0]+".txt")
	.awaitAll(cityPlot);
}


// need to select the right one
// do something like this:
// http://stackoverflow.com/questions/19541484/bootstrap-set-initial-radio-button-checked-in-html
d3.select("#yearbuttons").selectAll("input").attr("checked",function(d,i) { if (i===windowIndex) { return "checked"; } else { return null; } });


var variableLong = ["Summer Teletherm Day & Extent","Winter Teletherm Day & Extent","Summer Teletherm Temperature","Winter Teletherm Temperature"];
var variableShort = ["summer_day","winter_day","maxT","minT",]
var variableHover = variableLong;
// ranges are pre-computed from the data like this:
// allMins = Array(data.length-2);
// allMaxes = Array(data.length-2);
// for (var i=0; i<data.length-2; i++) { min = 150; max = -100; for (var j=0; j<data[i+1].length; j++) { if (data[i+1][j] > -9998) { if (data[i+1][j] > max) { max = data[i+1][j]; } if (data[i+1][j] < min) { min = data[i+1][j]; } } } allMins[i] = min; allMaxes[i] = max; }
// console.log("["+d3.min(allMins)+","+d3.max(allMaxes)+"]");
// these are the 1 year ranges
// var variableRanges = [[60.802142,125.425581],[-41.824669,64.654411],[18,339],[85-184,301-184],[1,57],[2,60],];
var variableRanges = [[144,295],[145-184,257-184],[61.598812,125.425581],[-30.488525,65.002232],]
var maxYear = 2012;
var variableIndex = 0;
var variableEncoder = d3.urllib.encoder().varname("var");
var variableDecoder = d3.urllib.decoder().varname("var").varresult("maxT");
// now this is going to be the short one
var variable;
variable = variableDecoder().cached;
variableEncoder.varval(variable);
// get the index
for (var i=0; i<variableShort.length; i++) {
    if (variable === variableShort[i]) {
	variableIndex = i;
    }
}
$("#variabledropvis").html(variableLong[variableIndex]+" <span class=\"caret\"></span>");

var year;
var yearIndex;
var allyears;
var yearEncoder = d3.urllib.encoder().varname("year");
var yearDecoder = d3.urllib.decoder().varname("year").varresult("1960");
yearEncoder.varval(yearDecoder().cached);
// yearIndex = parseFloat(yearDecoder().cached);
// can't really get the index until we have the years loaded
yearIndex = 60;
// yearEncoder.varval(yearIndex);

var global_city_result;

var cityPlot = function(error,results) {
    // function(i) {
    // console.log("plotting individual city data for city number:");
    // console.log(i);
    // console.log(results);

    // just for reference, these are the files that are being loaded
    // 
    // .defer(d3.text,"/data/teledata/stations/tmax_boxplot_0"+d[0]+".txt")
    // this file has 5 lines
    // each line is max,Q3,median,Q1,min
    // 
    // .defer(d3.text,"/data/teledata/stations/tmax_0"+d[0]+".txt")
    // this file has 1 line
    // it's the average T
    //
    // .defer(d3.text,"/data/teledata/stations/tmax_smoothed_0"+d[0]+".txt")
    // this file has 2 lines
    // first line is the days, 1-365, and the second line is smoothed T
    //
    // .defer(d3.text,"/data/teledata/stations/tmax_coverage_0"+d[0]+".txt")
    // this has two lines
    // first line is the years, started with the first year there is coverage
    // second year is the coverage from those years.
    //
    // .defer(d3.text,"/data/teledata/stations/tmin_boxplot_0"+d[0]+".txt")
    // .defer(d3.text,"/data/teledata/stations/tmin_0"+d[0]+".txt")
    // .defer(d3.text,"/data/teledata/stations/tmin_smoothed_0"+d[0]+".txt")
    // .defer(d3.text,"/data/teledata/stations/tmin_coverage_0"+d[0]+".txt")

    // just to take a look
    // global_city_result = results;

    // get out the data I want
    var tmax_boxplot = results[0].split("\n").slice(0,5).map(function(d) { return d.split(" ").map(parseFloat); });
    var tmax_median = tmax_boxplot[2];
    var tmax_avg = results[1].split(" ").map(parseFloat);
    var tmax_smoothed_days = results[2].split("\n")[0].split(" ").map(parseFloat);
    // var tmax_smoothed = results[2].split("\n")[1].split(" ").map(parseFloat);
    var tmax_coverage_years = results[3].split("\n")[0].split(" ").map(parseFloat);
    var tmax_coverage_perc = results[3].split("\n")[1].split(" ").map(parseFloat);

    // get out the data I want
    var tmin_boxplot = results[4].split("\n").slice(0,5).map(function(d) { return d.split(" ").map(parseFloat); });
    var tmin_median = tmin_boxplot[6];
    var tmin_avg = results[5].split(" ").map(parseFloat);
    var tmin_smoothed_days = results[6].split("\n")[0].split(" ").map(parseFloat);
    // var tmin_smoothed = results[6].split("\n")[1].split(" ").map(parseFloat);
    var tmin_coverage_years = results[7].split("\n")[0].split(" ").map(parseFloat);
    var tmax_coverage_perc = results[7].split("\n")[1].split(" ").map(parseFloat);

    // var kernel = science.stats.kernel.gaussian;

    // windows
    var bws = [3,5,7,9,11,13,15,17,19,21,23,25,27,29,31];
    // store the compute teletherm day for each window
    var summer_teletherms = Array(15);
    // store the gaussian
    var g = Array(365);
    var alpha = 2;
    // extra long T vector, just handy for indexing
    var longer_tmax = [].concat(tmax_avg,tmax_avg,tmax_avg,tmax_avg);
    var t_extent = d3.extent(tmax_avg)[1]-d3.extent(tmax_avg)[0];
    // save things for bw=15
    var summer_teletherm_extent = Array(2);
    var tmax_smoothed_js = Array(365);
    var summer_bwssaved = Array(bws.length);
    for (var i=0; i<bws.length; i++) {
        var bw = bws[i];
	for (var j=0; j<g.length; j++) {
	    // gaussian kernel
	    // g[j] = Math.exp(-1/2*((182-j)/bw*(182-j)/bw));
	    // parameterized a la matlab
	    // http://www.mathworks.com/help/signal/ref/gausswin.html
	    g[j] = Math.exp(-1/2*(alpha*(182-j)/((bw-1)/2)*alpha*(182-j)/((bw-1)/2)));
	}
	var gsum = d3.sum(g);
	g = g.map(function(d) { return d/gsum; });
        summer_bwssaved[i] = Array(365+183);
        for (var j=0; j<summer_bwssaved[i].length; j++) {
	    summer_bwssaved[i][j] = science.lin.dot(g,longer_tmax.slice((j+365)-182,(j+1+365)+182));
	}
	// console.log(smoothed);
	// now find the max for the summer teletherm
	// this is the max T, but need to grab that day
        console.log(d3.max(summer_bwssaved[i]));
	summer_teletherms[i] = summer_bwssaved[i].indexOf(d3.max(summer_bwssaved[i]))+1;
    }

    var plot_bws = 6;
    tmax_smoothed_js = summer_bwssaved[plot_bws];
    var maxT = d3.max(tmax_smoothed_js);        
    // console.log(maxT);
    // then look out for the days within 2% of that temperature range
    // that is, with 
    // march forward
    var j = summer_teletherms[plot_bws]+1;
    while (tmax_avg[j] > (maxT-.02*t_extent)) {
	j++;
    }
    summer_teletherm_extent[0] = j;
    // march backward
    var j = summer_teletherms[plot_bws]-1;
    while (tmax_avg[j] > (maxT-.02*t_extent)) {
	j--;
    }
    summer_teletherm_extent[1] = j;

    console.log(summer_teletherms);
    // console.log(summer_bwssaved);

    var tmin_smoothed_js = Array(365);
    var winter_bwssaved = Array(bws.length);
    var winter_teletherms = Array(15);
    var longer_tmin = [].concat(tmin_avg,tmin_avg,tmin_avg,tmin_avg);
    var t_extent = d3.extent(tmin_avg)[1]-d3.extent(tmin_avg)[0];
    var winter_teletherm_extent = Array(2);    
    for (var i=0; i<bws.length; i++) {
        var bw = bws[i];
	for (var j=0; j<g.length; j++) {
	    // gaussian kernel
	    // g[j] = Math.exp(-1/2*((182-j)/bw*(182-j)/bw));
	    // parameterized a la matlab
	    // http://www.mathworks.com/help/signal/ref/gausswin.html
	    g[j] = Math.exp(-1/2*(alpha*(182-j)/((bw-1)/2)*alpha*(182-j)/((bw-1)/2)));
	}
	var gsum = d3.sum(g);
	g = g.map(function(d) { return d/gsum; });
        winter_bwssaved[i] = Array(365+183);
        for (var j=0; j<winter_bwssaved[i].length; j++) {
	    winter_bwssaved[i][j] = science.lin.dot(g,longer_tmin.slice((j+365)-182,(j+1+365)+182));
	}
	// console.log(smoothed);
	// now find the min for the winter teletherm
	// this is the min T, but need to grab that day
        console.log(d3.min(winter_bwssaved[i]));
	winter_teletherms[i] = winter_bwssaved[i].indexOf(d3.min(winter_bwssaved[i]))+1;        
    }

    var plot_bws = 6;
    tmin_smoothed_js = winter_bwssaved[plot_bws];
    var minT = d3.min(tmin_smoothed_js);        
    // console.log(minT);
    // then look out for the days within 2% of that temperature range
    // that is, with 
    // march forward
    var j = winter_teletherms[plot_bws]+1;
    while (tmin_avg[j] < (minT-.02*t_extent)) {
	j++;
    }
    winter_teletherm_extent[0] = j;
    // march backward
    var j = winter_teletherms[plot_bws]-1;
    while (tmin_avg[j] < (minT-.02*t_extent)) {
	j--;
    }
    winter_teletherm_extent[1] = j;

    console.log(winter_teletherms);
    // console.log(winter_bwssaved);    

    console.log("will now plot the city data");    

    var figure = d3.select("#station1");
    
    var margin = {top: 2, right: 0, bottom: 50, left: 50};

    // full width and height
    var figwidth  = parseInt(figure.style("width"));
    var figheight = 600; // figwidth*1.2;
    // don't shrink this
    var width = figwidth - margin.left - margin.right;
    // tiny bit of space
    var height = figheight - margin.top - margin.bottom;

    // remove an old figure if it exists
    figure.select(".canvas").remove();

    //Create SVG element
    var canvas = figure
	.append("svg")
	.attr("class", "map canvas")
	.attr("id", "stationsvg1")
	.attr("width", figwidth)
	.attr("height", figheight);

    var x_max = d3.scale.linear()
	.domain([1,365+183])
	.range([0,width]);

    var x_min = d3.scale.linear()
	.domain([1-183,365])
	.range([0,width]);

    var y =  d3.scale.linear()
	// .domain([-30,130]) // summer temps
	.domain([d3.min(tmin_avg),d3.max(tmax_avg)])
	.range([height-10, 10]); 

    // create the axes themselves
    var axes = canvas.append("g")
	.attr("transform", "translate(" + (margin.left) + "," +
	      ((0) * figheight) + ")") // 99 percent
	.attr("width", width)
	.attr("height", height)
	.attr("class", "main");

    // create the axes background
    var bgrect = axes.append("svg:rect")
	.attr("width", width)
	.attr("height", height)
	.attr("class", "bg")
	.style({'stroke-width':'2','stroke':'rgb(0,0,0)'})
	.attr("fill", "#FCFCFC");

    // axes creation functions
    var create_xAxis = function() {
	return d3.svg.axis()
	    .scale(x_max)
	    .ticks(9)
	    .orient("bottom"); }

    // axis creation function
    var create_yAxis = function() {
	return d3.svg.axis()
	    .ticks(5)
	    .scale(y) //linear scale function
	    .orient("left"); }

    // draw the axes
    var yAxis = create_yAxis()
	.innerTickSize(6)
	.outerTickSize(0);

    axes.append("g")
	.attr("class", "y axis")
	.attr("transform", "translate(0,0)")
	.attr("font-size", "14.0px")
	.call(yAxis);

    // draw the axes
    var xAxis = create_xAxis()
	.innerTickSize(6)
	.outerTickSize(0);

    axes.append("g")
	.attr("class", "x axis ")
	.attr("font-size", "14.0px")
	.attr("transform", "translate(0," + (height) + ")")
	.call(xAxis);

    var line_max = d3.svg.line()
	.x(function(d,i) { return x_max(i+1); })
	.y(function(d) { return y(d); })
	.interpolate("linear"); // cardinal

    var line_min = d3.svg.line()
	.x(function(d,i) { return x_min(i+1-365); })
	.y(function(d) { return y(d); })
	.interpolate("linear"); // cardinal    

    // for (var i=0; i<bws.length; i++) {
    //     axes.append("path")
    //         .datum(summer_bwssaved[i])
    //         .attr("class", "linejs")
    //         .attr("d", line_max)
    //         .attr("stroke","red")
    //         .attr("stroke-width",2)
    //         .attr("fill","none");
    // }

    axes.append("path")
        .datum(tmax_smoothed_js)
        .attr("class", "linejs")
        .attr("d", line_max)
        .attr("stroke","red")
        .attr("stroke-width",2)
        .attr("fill","none");

    axes.append("path")
        .datum(tmin_smoothed_js)
        .attr("class", "linepeter")
        .attr("d", line_min)
        .attr("stroke","blue")
        .attr("stroke-width",2)
        .attr("fill","none");

    axes.selectAll("circle.avgmaxtemp")
	.data([].concat(tmax_avg,tmax_avg))
	.enter()
	.append("circle")
	.attr({ "cx": function(d,i) { return x_max(i); },
		"cy": function(d,i) { return y(d); },
		"r": 2,
	      });

    axes.selectAll("circle.avgmintemp")
	.data([].concat(tmin_avg,tmin_avg))
	.enter()
	.append("circle")
	.attr({ "cx": function(d,i) { return x_min(i-365); },
		"cy": function(d,i) { return y(d); },
		"r": 2,
	      });
    
    // move the screen down to this
    // document.getElementById('station1').focus();
    $("html, body").animate({ scrollTop: $("#station1").offset().top }, 900);
    // $.scrollTo($('#station1').offset().top);
}

$("#yearbuttons input").click(function() {
    console.log($(this).val());
    currentWindow = $(this).val();
    windowEncoder.varval(currentWindow);

    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }
    
    queue()
    // teledata-{1,10,20,50}y-{maxT,minT,summer_day,winter_day,summer_extent,winter_extent}.csv
	// .defer(d3.text,"/data/teledata/teledata-"+windowDecoder().cached+"y-"+variableDecoder().cached+".csv")
	.defer(d3.text,"/data/teledata/dynamics/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")        
	.awaitAll(updateMap);
});

$("#variabledrop a").click(function() {
    console.log($(this).text());
    variable = $(this).text();
    for (var i=0; i<variableLong.length; i++) {
	if (variable === variableLong[i]) {
	    variableIndex = i;
	}
    }
    variableEncoder.varval(variableShort[variableIndex]);
    $("#variabledropvis").html(variable+" <span class=\"caret\"></span>");
    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }
    queue()
        // teledata-{1,10,20,50}y-{maxT,minT,summer_day,winter_day,summer_extent,winter_extent}.csv
        // fake data
        // .defer(d3.text,"/data/teledata/teledata-"+currentWindow+"y-"+variableShort[variableIndex]+".csv")
        // real data
	.defer(d3.text,"/data/teledata/dynamics/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")    
	.awaitAll(updateMap);
});

        // $("#yeardrop a").click(function() {
//     console.log($(this).text());
//     year = $(this).text();
//     $("#yeardropvis").html(year+" <span class=\"caret\"></span>");
// });

var cities;
var citygroups;
var cityarrows;
var data;

// special color scale for maxT
var maxTcolor = function(i) { 
    return d3.rgb(Math.floor(tempScale(data[i+1][0])*255),0,0).toString();
}

// diverging red blue color map from colorbrewer
var divredbluerev = ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#var"];
var divredblue = ["#053061","#2166ac","#4393c3","#92c5de","#d1e5f0","#f7f7f7","#fddbc7","#f4a582","#d6604d","#b2182b","#67001f",];

var summerTScale = d3.scale.quantize()
    // celsius domain
    // .domain([63,117])
    // for fake data
    .range(divredblue);

var fullExtent;
var angle_offset = 0;

var updateMap = function(error,results) {
    console.log("update the map!");
    // console.log("here is the result from queue:");
    // console.log(data);
    data = results[0].split("\n");
    // console.log("first result split on newlines:");
    // console.log(data);
    data = data.map(function(d) { return d.split(" ").map(parseFloat); });
    // console.log("each of those split on space:");
    // console.log(data);    

    // set the years from the first line of the dynamics file
    allyears = data[0];
    // console.log("this is all the years:");
    // console.log(allyears);

    for (var i=0; i<allyears.length; i++) {
        if ((allyears[i]+"") === yearDecoder().cached) {
            yearIndex = i;
            break;
        }
    }
    
    d3.select("#yeardroplist").selectAll("li").remove();
    d3.select("#yeardroplist")
	.selectAll("li")
	.data(allyears)
	.enter()
        .append("li")
        .append("a")
	.text(function(d) { return d; })
        .on("click",function(d,i) {
	    yearIndex = i;
	    // yearEncoder.varval(yearIndex.toFixed(0));
            yearEncoder.varval(d);
	    changeYear();
            if (yearIndex < allyears.length) {
	        var play_button = d3.select("#playButton")
                play_button.attr("class","btn btn-default disabled");
                // play_button.select("i").attr("class","fa fa-play");
            }            
	})

    // console.log("variableIndex="+variableIndex);

    // set the domain for the scale based on this year's min/max
    // var localExtent;
    // localExtent = [d3.min(data.map(function(d) { return d3.min(d); } )),d3.max(data.map(function(d) { return d3.max(d); } ))];
    // // localExtent = d3.extent([].concat.apply([], data.slice(1,1300)))
    // fullExtent = localExtent;
    if (variableIndex === 1) {
        angle_offset = -180;
    }
    else {
        angle_offset = 0;
    }
    
    summerTScale.domain(variableRanges[variableIndex]);
    
    changeYear();

    // console.log("variableIndex="+variableIndex);    
    // draw a scale on the map
    // only need the circular scale for days of the year
    if (variableIndex < 2) {
        drawScale(variableRanges[variableIndex],"polar");
    }
    else {
        drawScale(variableRanges[variableIndex],"linear");
    }
}

var playTimer;
var playing = false;

d3.select("#playButton").on("click",function(d,i) {
    if (playing) {
	playing = false;
	d3.select(this).select("i").attr("class","fa fa-play");
	clearInterval(playTimer);
    }
    else {
	d3.select(this).select("i").attr("class","fa fa-pause");
	playing = true;
	playTimer = setInterval(play,200);
    }
});

var play = function() {
    yearIndex++;
    changeYear();
}

var changeYear = function() {
    if (yearIndex > allyears.length-1) {
	clearInterval(playTimer);
	var play_button = d3.select("#playButton")
        play_button.attr("class","btn btn-default disabled");
        play_button.select("i").attr("class","fa fa-play");
	playing = false;
	yearIndex--;
	return 0;
    }
    // console.log("changing year index to");
    // console.log(yearIndex);
    // console.log(allyears[yearIndex]);
    $("#yeardropvis").html(allyears[yearIndex]+" <span class=\"caret\"></span>");

    cities.attr("fill",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return summerTScale(data[i+1][yearIndex]+angle_offset);
        }
        else {
            return summerTScale(75);
        }})
        .attr("value",function(d,i) {
            return data[i+1][yearIndex];
        });
    
    cities.style("visibility",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return "visible";
        }
        else {
            return "hidden";
        }
    });

    cityarrows.style("visibility",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return "visible";
        }
        else {
            return "hidden";
        }
    });
    
    if (variableIndex < 2) {
	cityarrows.attr({
	    "x2": function(d,i) { return arrowradius*Math.cos((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "y2": function(d,i) { return arrowradius*Math.sin((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "stroke-width": "1.5",
	    "stroke": function(d,i) { return summerTScale(data[i+1][yearIndex]+angle_offset); },
	});
    }
    else {
	cityarrows.style("visibility","hidden");        
	// cityarrows.attr({
	//     "x2": 0,
	//     "y2": 0,	    
	// });
    }
}

var drawScale = function(extent,type) {
    console.log("adding scale to the map of type:");
    console.log(type);
    // console.log(extent);
    var legendwidth = 200;
    var legendheight = 20;
    var legendradius = 30;
    // var legendwidth = 50;
    var textsize = 10;
    var legendarray = Array(divredblue.length);
    // var legendstringslen = [legendwidth,legendwidth,legendwidth,legendwidth,legendwidth,legendwidth,legendwidth,];
    // var initialpadding = 0;
    // var boxpadding = 0.25;
    d3.selectAll(".legendgroup").remove();
    if (type === "linear") {
	var legendgroup = canvas.append("g")
	    .attr({"class": "legendgroup",
		   "transform": "translate("+(w-50-legendwidth)+","+(h-2*legendheight-2)+")",});

	legendgroup.selectAll("rect.legendrect")
    	    .data(legendarray)
    	    .enter()
    	    .append("rect")
    	    .attr({"class": function(d,i) { return "q"+i+"-8"; },
    		   "x": function(d,i) { return i*legendwidth/divredblue.length; },
    		   "y": 0,
		   // "rx": 3,
		   // "ry": 3,
    		   "width": function(d,i) { return legendwidth/divredblue.length; },
    		   "height": legendheight,
		   "fill": function(d,i) { return divredblue[i]; },
		   // "stroke-width": "1",
		   // "stroke": "rgb(0,0,0)"
		  });

	legendgroup.selectAll("text.legendtext")
	    .data(extent.map(function(d) { return d.toFixed(2); }))
	    .enter()
	    .append("text")
	    .attr({"x": function(d,i) {
		if (i==0) { return 0; }
		else { return legendwidth-d.width(textsize+"px arial"); } },
    		   "y": legendheight+legendheight, 
    		   "class": function(d,i) { return "legendtext"; },
		   "font-size": textsize+"px",
		  })
    	    .text(function(d,i) { return d; });
    }
    else {
	var legendgroup = canvas.append("g")
	    .attr({"class": "legendgroup",
		   "transform": "translate("+(w-20-legendradius)+","+(h-legendradius-20)+")",});

	var arc = d3.svg.arc()
	    .outerRadius(legendradius)
	    .innerRadius(0);

	var pie = d3.layout.pie()
	    .sort(null)
	    .startAngle(extent[0]/365*2*Math.PI)
	    .endAngle(extent[1]/365*2*Math.PI)
	    .value(function(d) { return d; });

	legendgroup.selectAll(".arc")
	    .data(pie([1,1,1,1,1,1,1,1,1,1,1,]))
	    .enter()
	    .append("path")
	    .attr({"d": arc,
		   "fill": function(d,i) { return divredblue[i]; },
		  });
    }
}

var w;
var h;
var canvas;

var dataloaded = function(error,results) { 
    // console.log("map data loaded, these are the results (should just be the geojson in a list of length 1):");
    // console.log(results);
    console.log("map data loaded, drawing map");
    geoJson = results[0];
    stateFeatures = topojson.feature(geoJson,geoJson.objects.states).features;

    // go ahead and draw the map right here.
    // worry about separating logic later

    var fisheye = d3.fisheye.circular()
        .radius(4)
        .distortion(2);
    
    var figure = d3.select("#map");
    
    //Width and height
    w = parseInt(figure.style("width"));
    h = w*580/900;

    // remove an old figure if it exists
    figure.select(".canvas").remove();

    //Create SVG element
    canvas = figure
	.append("svg")
	.attr("class", "map canvas")
	.attr("id", "mapsvg")
	.attr("width", w)
	.attr("height", h);

    projection = d3.geo.albersUsa()
	.translate([w/2, h/2-10])
	.scale(w*1.37);

    var path = d3.geo.path()
	.projection(projection);

    states = canvas.selectAll("path")
	.data(stateFeatures);
    
    states.enter()
	.append("path")
	.attr("d", function(d,i) { return path(d.geometry); } )
	.attr("id", function(d,i) { return d.properties.name; } )
	.attr("class",function(d,i) { return "state"; } );

    // states.exit().remove();

    // states
    // 	.attr("stroke","black")
    // 	.attr("stroke-width",".7");

    var rmin = "4";
    var rmax = "6";

    var popuptimer;

    var hovergroup = figure.append("div").attr({
	"class": "hoverinfogroup",
	// "transform": "translate("+(x+hoverboxxoffset+axeslabelmargin.left)+","+(d3.min([d3.max([0,y-hoverboxheight/2-hoverboxyoffset]),height-hoverboxheight]))+")", 
    })
	.style({
	    "position": "absolute",
	    "top": "100px",
	    "left": "100px",
	    "visibility": "hidden",
	});

    function hidehover() {
	// console.log("hiding hover");
        canvas.selectAll("circle").transition().duration(500).style("opacity","1.0");
	canvas.selectAll("circle").attr("r",rmin);        
        canvas.selectAll("line").transition().duration(500).style("opacity","1.0");        
	hovergroup.style({
	    "visibility": "hidden",
	});
    }

    var city_hover = function(d,i) {
	// console.log(this);
	d3.select(this).select("circle").attr("r",rmax);
        

	// canvas.selectAll("circle").transition().duration(500).style("opacity","0.1");
	// canvas.selectAll("line").transition().duration(500).style("opacity","0.1");

        // d3.select(this).select("circle").interrupt(); //.style("opacity","1.0");
	// d3.select(this).select("line").interrupt(); //.style("opacity","1.0");
        
	// var hoverboxheight = 90;
	// var hoverboxwidth = 200;
	var hoverboxyoffset = 5;
	var hoverboxxoffset = -20;

        // thiscircle = d3.select(this);

	// var x = d3.mouse(this)[0];
	// var y = d3.mouse(this)[1];
        // console.log(d3.mouse(this));
        // console.log(x);
        // console.log(y);

        var x = d3.select(this).attr("my_x");
        var y = d3.select(this).attr("my_y");
        // console.log(x);
        // console.log(y);        

        // var hoverboxheightguess = 190;
	// if ((y+hoverboxheightguess)>h) { y-=(y+hoverboxheightguess-h); }
	
	// tip.show;
	// console.log(d);

	hovergroup.style({
	    "position": "absolute",
	    "top": (parseFloat(y)+hoverboxyoffset)+"px",
	    "left": (parseFloat(x)+hoverboxxoffset)+"px",
	    "visibility": "visible",
	});
        
	hovergroup.selectAll("p,h3,button,br").remove();

        var city_name_split = d[3].split(",");
        var proper_city_name = city_name_split[0].split(" ");
        for (var i=0; i<proper_city_name.length; i++) {
            proper_city_name[i] = proper_city_name[i][0].toUpperCase() + proper_city_name[i].slice(1).toLowerCase();
        }
        var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",");

	hovergroup.append("h3")
	    .attr("class","cityname")
	    .text(city_name);

        hovergroup.append("p")
            .text(variableHover[variableIndex]);
        
	hovergroup.append("p")
            .html(allyears[yearIndex]+"&ndash;"+(parseFloat(windows[windowIndex])+allyears[yearIndex]));

        if (variableIndex < 2) {
            // go convert the day to an actual date
            var teletherm_day = (data[parseFloat(d[0])+1][yearIndex]+angle_offset);
            var date = new Date(1900,0,1);
            date.setTime( date.getTime() + teletherm_day * 86400000 );
            var monthNames = ["January", "February", "March", "April", "May", "June",
                              "July", "August", "September", "October", "November", "December"
                             ];
            // console.log(d);
	    hovergroup.append("p")
                .text(monthNames[date.getMonth()]+" "+date.getDate());            

        }
        else {
            hovergroup.append("p")
                .html(data[parseFloat(d[0])+1][yearIndex].toFixed(2)+" degrees");
        }

        // clearTimeout(popuptimer);
	// popuptimer = setTimeout(hidehover,10000);
        
    };
    
    var city_unhover = function(d,i) {
        // console.log(this);
        // d3.select(this).attr("r",rmin);
        hidehover();
    };
    
    var city_clicked = function(d,i) {
	// console.log(this);
	// d3.select(this).attr("r",rmin);

	// alert("you clicked on the station at "+d[3]);
        cityEncoder.varval(d[3]);
        
        // format the name a little better
        var city_name_split = d[3].split(",");
        var proper_city_name = city_name_split[0].split(" ");
        for (var i=0; i<proper_city_name.length; i++) {
            proper_city_name[i] = proper_city_name[i][0].toUpperCase() + proper_city_name[i].slice(1).toLowerCase();
        }
        var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",")+" (all data combined):";

        // alert("you clicked on the station at "+city_name);
        document.getElementById("stationname").innerHTML = city_name;
        
	console.log(d[0]);
        
	
	queue()
	    .defer(d3.text,"/data/teledata/stations/tmax_boxplot_0"+d[0]+".txt")
	    .defer(d3.text,"/data/teledata/stations/tmax_0"+d[0]+".txt")
	    .defer(d3.text,"/data/teledata/stations/tmax_smoothed_0"+d[0]+".txt")
	    .defer(d3.text,"/data/teledata/stations/tmax_coverage_0"+d[0]+".txt")
	    .defer(d3.text,"/data/teledata/stations/tmin_boxplot_0"+d[0]+".txt")
	    .defer(d3.text,"/data/teledata/stations/tmin_0"+d[0]+".txt")
	    .defer(d3.text,"/data/teledata/stations/tmin_smoothed_0"+d[0]+".txt")
	    .defer(d3.text,"/data/teledata/stations/tmin_coverage_0"+d[0]+".txt")
	    .awaitAll(cityPlot);
    };

    citygroups = canvas.selectAll("circle.city")
	.data(locations)
	.enter()
	.append("g")
        .attr("class","citygroup")
	.attr("transform",function(d) { return "translate("+projection([d[2],d[1]])[0]+","+projection([d[2],d[1]])[1]+")"; })
	.attr("my_x",function(d) { return projection([d[2],d[1]])[0]; })
	.attr("my_y",function(d) { return projection([d[2],d[1]])[1]; })
        .on("mouseover",city_hover)
        .on("mouseout",city_unhover);    

    cities = citygroups
    	.append("circle")
        .attr({
	    "class": "city",
	    "cx": 0,
	    "cy": 0,
	    "r": rmin,
	})
        .on("mousedown",city_clicked);

    cityarrows = citygroups.append("line")
        .attr({
	    "x1": 0,
	    "y1": 0,
	    "x2": 0,
	    "y2": 0,
    	});

    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }

    console.log("queueing up the data for the circles on the map");

    queue()
        // teledata-{1,10,20,50}y-{maxT,minT,summer_day,winter_day,summer_extent,winter_extent}.csv
	// .defer(d3.text,"/data/teledata/teledata-"+windowDecoder().cached+"y-"+variableDecoder().cached+".csv")
	// .defer(d3.text,"/data/teledata/teledata-"+windowDecoder().cached+"y-"+variableDecoder().cached+".csv")    
        // .defer(d3.text,"/data/teledata/teledata-"+currentWindow+"y-"+variableShort[variableIndex]+".csv")
        .defer(d3.text,"/data/teledata/dynamics/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")            
	.awaitAll(updateMap);

    console.log("drawing the city data");
    
    if (currentCityIndex > 0) {
        city_clicked_initial_load(locations[currentCityIndex]);
    }

    canvas.on("mousemove", function() {
        // console.log("mouse:");
        // console.log(d3.mouse(this));
        var here = d3.mouse(this);
        // console.log(here); // [1030, 125]
        // fisheye.focus([here[0]-w/2,here[1]-h/2]);
        // console.log(projection.invert(here)); // [-72.4713375653601, 45.14035261565636]
        // console.log(projection.invert([here[1],here[0]])); // [-112.1040289366678, 12.156636670355539]
        var inverted = projection.invert([here[0],here[1]]); // [-72.4713375653601, 45.14035261565636]
        // console.log(inverted); // [-72.4713375653601, 45.14035261565636]
        // burlington is lat 44, lon -73
        fisheye.focus(inverted);

        // of course, the path function takes [longitude, latitude], so -72, 44 for burlington
        // https://github.com/mbostock/d3/wiki/Geo-Paths
        // (so that's what it gives back)

        // states.attr("d", function(d) { return path(d.geometry); });
        // canvas.selectAll("path").data(stateFeatures)
        // states = canvas.selectAll("path").data(stateFeatures).attr("d", function(d) {
        states.attr("d",null)
            .attr("d", function(d) {
                // console.log("original:");
                // console.log(d.geometry);

                if (d.geometry.type === "Polygon") {
                    var b = d.geometry.coordinates.map(function(d) { return d.map(function(f) { return fisheye(f);}); });
                }
                else {
                    var b = d.geometry.coordinates.map(function(d) { return d.map(function(f) { return f.map(function(g) { return fisheye(g); }); }); });
                }
                // console.log(b);
                var c = {type: d.geometry.type, coordinates: b};
                
                // console.log("new:");
                // console.log(c);

                return path(c);
        });

        // states.exit();

        citygroups.attr("transform",function(d) { return "translate("+projection(fisheye([d[2],d[1]])).join(",")+")"; });
    });
}

// // can just use the d3.csv,json
// function request(url, callback) {
//   var req = new XMLHttpRequest;
//   req.open("GET", url, true);
//   req.setRequestHeader("Accept", "application/json");
//   req.onreadystatechange = function() {
//     if (req.readyState === 4) {
//       if (req.status < 300) callback(null, JSON.parse(req.responseText));
//       else callback(req.status);
//     }
//   };
//   req.send(null);
// }

window.onload = function() {

    console.log("page loaded");
    // start using queue for the loads here
    
    
    // d3.json("http://hedonometer.org/data/geodata/us-states.topojson", function(data) {
    // 	geoJson = data;
    // 	stateFeatures = topojson.feature(geoJson,geoJson.objects.states).features;
    // 	// if (!--csvLoadsRemaining) initializePlotPlot(lens,words);
    // }); // d3.json
    
    queue()
    // .defer(request,"http://hedonometer.org/data/geodata/us-states.topojson")
        // switch to this for local devel
	.defer(d3.json,"/data/teledata/us-states.topojson")
	.awaitAll(dataloaded);

} // window.onload


