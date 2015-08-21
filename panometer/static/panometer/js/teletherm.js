// on page load, queue's up the geo json and draps the map on return (using dataloaded()).
// at the end of this function, queue's up the map data and calls updatedMap() to put points on the map.
// updateMap() is the end of the road for the initial load
//
// the year window buttons, and the variable dropdown will trigger updateMap()
// the year drop down ...
// the play button ...

// globally namespace these things
var geoJson;
var stateFeatures;

// the main variables for the file load
// var yearWindow = 1;
var yearWindowEncoder = d3.urllib.encoder().varname("window"); //.varval(...);
var yearWindowDecoder = d3.urllib.decoder().varname("window").varresult("1");
var yearWindows = ["1","10","25","50"];
var yearWindowIndex = 0;
var yearWindow;
for (var i=0; i<yearWindows.length; i++) {
    if (yearWindowDecoder().cached === yearWindows[i]) {
	yearWindowIndex = i;
    }
}
yearWindow = yearWindowDecoder().cached;

// need to select the right one
// do something like this:
// http://stackoverflow.com/questions/19541484/bootstrap-set-initial-radio-button-checked-in-html
d3.select("#yearbuttons").selectAll("input").attr("checked",function(d,i) { if (i===yearWindowIndex) { return "checked"; } else { return null; } });

// var variable = "Max Temp";
var variableShort = ["maxT","minT","summer_day","winter_day","summer_extent","winter_extent",]
var variableLong = ["Max Temp","Min Temp","Summer Day","Winter Day","Summer Extent","Winter Extent",]
// ranges are pre-computed from the 1-year data like this:
// allMins = Array(data.length-2);
// allMaxes = Array(data.length-2);
// for (var i=0; i<data.length-2; i++) { min = 150; max = -100; for (var j=0; j<data[i+1].length; j++) { if (data[i+1][j] > -9998) { if (data[i+1][j] > max) { max = data[i+1][j]; } if (data[i+1][j] < min) { min = data[i+1][j]; } } } allMins[i] = min; allMaxes[i] = max; }
// d3.max(allMaxes);
// d3.min(allMins);
var variableRanges = [[60.802142,125.425581],[-41.824669,64.654411],[18,339],[85-184,301-184],[1,57],[2,60],]
var variableIndex = 0;
var variableEncoder = d3.urllib.encoder().varname("var");
var variableDecoder = d3.urllib.decoder().varname("var").varresult("maxT");
// now this is going to be the short one
var variable;
variable = variableDecoder().cached;
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
var yearDecoder = d3.urllib.decoder().varname("year").varresult("0");
yearIndex = parseFloat(yearDecoder().cached);


var cityPlot = function(error,results) {
    // function(i) {
    // console.log("plotting individual city data for city number:");
    // console.log(i);
    // console.log(results);
    var tmax_boxplot = results[0].split("\n").slice(0,5).map(function(d) { return d.split(" ").map(parseFloat); });
    tmax_median = tmax_boxplot[2];
    tmax = results[1].split(" ").map(parseFloat);
    tmax_smoothed_days = results[2].split("\n")[0].split(" ").map(parseFloat);
    tmax_smoothed = results[2].split("\n")[1].split(" ").map(parseFloat);

    // var kernel = science.stats.kernel.gaussian;
    // var bws = [3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33];
    // for (var i=0; i<bws.length; i++) {
    // 	var bw = bws[i];
    // 	var n = 365-(bw-1);
    // 	var smoothed = Array(n);
    // 	for (var j=0; j=smoothed.length; j++) {
    // 	    smoothed[j] = 0;
    // 	    smoothed[j]
    // 	}
    // }

    // windows
    var bws = [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33];
    // var bws = [15];
    // store the compute teletherm day for each window
    var summer_teletherm = Array(bws.length);
    // store the gaussian
    var g = Array(365);
    var alpha = 2;
    var smoothed = Array(365);
    // extra long T vector, just handy for indexing
    var longer_tmax = [].concat(tmax,tmax,tmax);
    var t_extent = d3.extent(tmax)[1]-d3.extent(tmax)[0];
    // save things for bw=15
    var summer_teletherm_extent = Array(2);
    var tmax_smoothed_js = Array(365);
    var bwssaved = Array(bws.length);
    for (var i=0; i<bws.length; i++) {
	// bw = 15;
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
	for (var j=0; j<g.length; j++) {
	    smoothed[j] = science.lin.dot(g,longer_tmax.slice((j+365)-182,(j+1+365)+182));
	}
	console.log(smoothed);
	// now find the max for the summer teletherm
	// this is the max T, but need to grab that day
	var maxT = d3.max(smoothed);
	console.log(maxT);
	summer_teletherm[i] = smoothed.indexOf(maxT);
	bwssaved[i] = smoothed;
	if ( bw === 1 ) {
	    tmax_smoothed_js = smoothed;
	    // then look out for the days within 2% of that temperature range
	    // that is, with 
	    // march forward
	    var j = summer_teletherm[i]+1;
	    while (tmax[j] > (maxT-.02*t_extent)) {
		j++;
	    }
	    summer_teletherm_extent[0] = j;
	    // march backward
	    var j = summer_teletherm[i]-1;
	    while (tmax[j] > (maxT-.02*t_extent)) {
		j--;
	    }
	    summer_teletherm_extent[1] = j;
	}
    }
    console.log(summer_teletherm);
    console.log(bwssaved);

    console.log("will now plot the city data");    

    var figure = d3.select("#station1");
    
    var margin = {top: 2, right: 40, bottom: 0, left: 40};

    // full width and height
    var figwidth  = parseInt(figure.style("width"));
    var figheight = 400; // figwidth*1.2;
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

    var x = d3.scale.linear()
	.domain([1,365])
	.range([0,width]);

    var y =  d3.scale.linear()
	// .domain([-30,130]) // summer temps
	.domain(d3.extent(tmax))
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
	    .scale(x)
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

    var line = d3.svg.line()
	.x(function(d,i) { return x(i+1); })
	.y(function(d) { return y(d); })
	.interpolate("linear"); // cardinal

    axes.append("path")
	.datum(tmax_smoothed_js)
	.attr("class", "linejs")
	.attr("d", line)
	.attr("stroke","black")
	.attr("stroke-width",3)
	.attr("fill","none");

    axes.append("path")
	.datum(tmax_smoothed)
	.attr("class", "linepeter")
	.attr("d", line)
	.attr("stroke","red")
	.attr("stroke-width",3)
	.attr("fill","none");

    axes.selectAll("circle.daytemp")
	.data(tmax)
	.enter()
	.append("circle")
	.attr({ "cx": function(d,i) { return x(i); },
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
    yearWindow = $(this).val();
    yearWindowEncoder.varval(yearWindow);

    var my_year = yearWindowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }
    
    queue()
    // teledata-{1,10,20,50}y-{maxT,minT,summer_day,winter_day,summer_extent,winter_extent}.csv
	// .defer(d3.text,"/data/teledata/teledata-"+yearWindowDecoder().cached+"y-"+variableDecoder().cached+".csv")
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
    var my_year = yearWindowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }
    queue()
        // teledata-{1,10,20,50}y-{maxT,minT,summer_day,winter_day,summer_extent,winter_extent}.csv
        // fake data
        // .defer(d3.text,"/data/teledata/teledata-"+yearWindow+"y-"+variableShort[variableIndex]+".csv")
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
    // console.log("update the map!");
    // console.log("here is the result from queue:");
    // console.log(data);
    data = results[0].split("\n");
    // console.log("first result split on newlines:");
    // console.log(data);
    data = data.map(function(d) { return d.split(" ").map(parseFloat); });
    // console.log("each of those split on comma:");
    // console.log(data);    

    // set the years from the first line of the dynamics file
    allyears = data[0];
    // console.log("this is all the years:");
    // console.log(allyears);
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
	    yearEncoder.varval(yearIndex.toFixed(0));
	    changeYear();
	})
    $("#variabledropvis").html(variableLong[variableIndex]+" <span class=\"caret\"></span>");

    // set the domain for the scale based on this year's min/max
    // var localExtent;
    // localExtent = [d3.min(data.map(function(d) { return d3.min(d); } )),d3.max(data.map(function(d) { return d3.max(d); } ))];
    // // localExtent = d3.extent([].concat.apply([], data.slice(1,1300)))
    // fullExtent = localExtent;
    if (variableIndex = 3) {
        angle_offset = -180;
    }
    
    summerTScale.domain(variableRanges[variableIndex]);
    
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
    
    var arrowradius = 16;
    if (variableIndex === 2 || variableIndex === 3) {
	// console.log("adding arrows");
	cityarrows.attr({
	    "x2": function(d,i) { return arrowradius*Math.cos((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "y2": function(d,i) { return arrowradius*Math.sin((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "stroke-width": "1.5",
	    "stroke": function(d,i) { return summerTScale(data[i+1][yearIndex]+angle_offset); },
	});
    }
    else {
	// console.log("removing arrows");
	cityarrows.style("visibility","hidden");
    }
    
    // draw a scale on the map
    // only need the circular scale for days of the year
    var scaleType = "linear";
    if (variableIndex === 2 || variableIndex === 3) {
	scaleType = "polar";
    }
    drawScale(variableRanges[variableIndex],scaleType);

    // changeYear();
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
	d3.select("#playbutton").select("i").attr("class","fa fa-play");
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
    
    var arrowradius = 16;
    if (variableIndex === 2 || variableIndex === 3) {
	cityarrows.attr({
	    "x2": function(d,i) { return arrowradius*Math.cos((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "y2": function(d,i) { return arrowradius*Math.sin((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "stroke-width": "1.5",
	    "stroke": function(d,i) { return summerTScale(data[i+1][yearIndex]+angle_offset); },
	});
    }
    else {
	cityarrows.attr({
	    "x2": 0,
	    "y2": 0,	    
	});
    }
}

var drawScale = function(extent,type) {
    // console.log("adding scale to the map of type:");
    // console.log(type);
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

        if (variableIndex === 4) {
            
        }
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
    geoJson = results[0];
    stateFeatures = topojson.feature(geoJson,geoJson.objects.states).features;

    // go ahead and draw the map right here.
    // worry about separating logic later
    
    var figure = d3.select("#map");
    
    //Width and height
    w = parseInt(figure.style("width"));
    h = w*650/900;

    // remove an old figure if it exists
    figure.select(".canvas").remove();

    //Create SVG element
    canvas = figure
	.append("svg")
	.attr("class", "map canvas")
	.attr("id", "mapsvg")
	.attr("width", w)
	.attr("height", h);

    var projection = d3.geo.albersUsa()
	.translate([w/2, h/2])
	.scale(w*1.3);

    var path = d3.geo.path()
	.projection(projection);

    var states = canvas.selectAll("path")
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

    var city_hover = function(d,i) {
	// console.log(this);
	d3.select(this).attr("r",rmax);
    };
    var city_unhover = function(d,i) {
	// console.log(this);
	d3.select(this).attr("r",rmin);
    };
    var city_clicked = function(d,i) {
	// console.log(this);
	// d3.select(this).attr("r",rmin);

	// alert("you clicked on the station at "+d[3]);
        
        // format the name a little better
        var city_name_split = d[3].split(",");
        var proper_city_name = city_name_split[0].split(" ");
        for (var i=0; i<proper_city_name.length; i++) {
            proper_city_name[i] = proper_city_name[i][0].toUpperCase() + proper_city_name[i].slice(1).toLowerCase();
        }
        var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",")+":";

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
	.attr("transform",function(d) { return "translate("+projection([d[2],d[1]])[0]+","+projection([d[2],d[1]])[1]+")"; });

    cities = citygroups
    	.append("circle")
        .attr({
	    "class": "city",
	    "cx": 0,
	    "cy": 0,
	    "r": rmin,
	})
        .on("mousedown",city_clicked)
        .on("mouseover",city_hover)
        .on("mouseout",city_unhover);

    cityarrows = citygroups.append("line")
        .attr({
	    "x1": 0,
	    "y1": 0,
	    "x2": 0,
	    "y2": 0,
    	});

    var my_year = yearWindowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }

    queue()
        // teledata-{1,10,20,50}y-{maxT,minT,summer_day,winter_day,summer_extent,winter_extent}.csv
	// .defer(d3.text,"/data/teledata/teledata-"+yearWindowDecoder().cached+"y-"+variableDecoder().cached+".csv")
	// .defer(d3.text,"/data/teledata/teledata-"+yearWindowDecoder().cached+"y-"+variableDecoder().cached+".csv")    
        // .defer(d3.text,"/data/teledata/teledata-"+yearWindow+"y-"+variableShort[variableIndex]+".csv")
        .defer(d3.text,"/data/teledata/dynamics/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")            
	.awaitAll(updateMap);
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


