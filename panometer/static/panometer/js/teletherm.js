// on page load, queue's up the geo json and draps the map on return (using dataloaded())
// at the end of this function, queue's up the map data and calls updatedMap() to put points on the map.
// updateMap() is the end of the road for the initial load
//
// the year window buttons, and the variable dropdown will trigger updateMap()
// the year drop down ... (#yeardroplist) calls changeYear()
// the play button ...  calls changeYear()

// globally namespace these things
var geoJson;
var stateFeatures;

var arrowradius = 16;
var rmin = 4;
var rmax = 6;

var month_names = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December", ];
var month_lengths = [31,28,31,30,31,30,31,31,30,31,30,31,];
// this will be the first day of every month
var month_lengths_cum = [1,31,28,31,30,31,30,31,31,30,31,30,];
for (var i=1; i<month_lengths_cum.length; i++) {
    month_lengths_cum[i] += month_lengths_cum[i-1];
}
// first day of every month for 18 months
var month_lengths_cum_18_forward = [1,31,28,31,30,31,30,31,31,30,31,30,31,31,28,31,30,31,];
for (var i=1; i<month_lengths_cum_18_forward.length; i++) {
    month_lengths_cum_18_forward[i] += month_lengths_cum_18_forward[i-1];
}
// note, the above ends at 517, which is short of the xrange of 365+181 = 546
// first day of every month for 18 months, starting backward 1
var month_lengths_cum_18_backward = [1-181,31,28,31,30,31,30,31,31,30,31,30,31,31,28,31,30,31,];
for (var i=1; i<month_lengths_cum_18_backward.length; i++) {
    month_lengths_cum_18_backward[i] += month_lengths_cum_18_backward[i-1];
}

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
    var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",")+" ("+full_year_range[yearIndex]+"&ndash;"+(full_year_range[yearIndex]+parseInt(windowDecoder().cached))+"):";

    document.getElementById("stationname").innerHTML = city_name;
    
    console.log(d);
    
    // queue()
    //     .defer(d3.text,"/data/teledata/stations/tmax_boxplot_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_smoothed_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_coverage_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_boxplot_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_smoothed_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_coverage_0"+d[0]+".txt")
    //     .awaitAll(cityPlot);

    queue()
        .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_values_combined.txt")
        .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_years_combined.txt")
        .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_values_combined.txt")
        .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_years_combined.txt")
        .awaitAll(cityPlot);
}


// need to select the right one
// do something like this:
// http://stackoverflow.com/questions/19541484/bootstrap-set-initial-radio-button-checked-in-html
d3.select("#yearbuttons").selectAll("input").attr("checked",function(d,i) { if (i===windowIndex) { return "checked"; } else { return null; } });

// now you can close a city
$("#dismissCity").on("click",function() {
    $("#stationsvg1").remove();
    $("#stationname").html("");
    $(this).css("visibility","hidden");
    cityEncoder.destroy();
})

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
var variableDecoder = d3.urllib.decoder().varname("var").varresult("summer_day");
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
var full_year_range = [1900,1901,1902,1903,1904,1905,1906,1907,1908,1909,1910,1911,1912,1913,1914,1915,1916,1917,1918,1919,1920,1921,1922,1923,1924,1925,1926,1927,1928,1929,1930,1931,1932,1933,1934,1935,1936,1937,1938,1939,1940,1941,1942,1943,1944,1945,1946,1947,1948,1949,1950,1951,1952,1953,1954,1955,1956,1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013];
var yearEncoder = d3.urllib.encoder().varname("year");
var yearDecoder = d3.urllib.decoder().varname("year").varresult("1960");
yearEncoder.varval(yearDecoder().cached);
// yearIndex = parseFloat(yearDecoder().cached);
// can't really get the index until we have the years loaded
for (var i=0; i<full_year_range.length; i++) {
    if ((full_year_range[i]+"") === yearDecoder().cached) {
        yearIndex = i;
        break;
    }
}
// yearEncoder.varval(yearIndex);

var global_city_result;

var smooth_timeseries_gaussian = function(windows,t,season) {
    // store the compute teletherm day for each window
    var teletherm_dates = Array(windows.length);
    var teletherm_extents = Array(windows.length);        
    // store the gaussian
    var g = Array(365);
    var alpha = 2;
    // extra long T vector, just handy for indexing
    var longer_t = [].concat(t,t,t);
    var range_t = d3.extent(t)[1]-d3.extent(t)[0];
    // save things for all timeseries
    var smoothed_timeseries = Array(windows.length);
    for (var i=0; i<windows.length; i++) {
        var my_window = windows[i];
	for (var j=0; j<g.length; j++) {
	    // gaussian kernel
	    // g[j] = Math.exp(-1/2*((182-j)/my_window*(182-j)/my_window));
	    // parameterized a la matlab
	    // http://www.mathworks.com/help/signal/ref/gausswin.html
	    g[j] = Math.exp(-1/2*(alpha*(182-j)/((my_window-1)/2)*alpha*(182-j)/((my_window-1)/2)));
	}
	var gsum = d3.sum(g);
	g = g.map(function(d) { return d/gsum; });
        smoothed_timeseries[i] = Array(365);
        for (var j=0; j<365; j++) {
	    smoothed_timeseries[i][j] = science.lin.dot(g,longer_t.slice((j+365)-182,(j+1+365)+182));
	}
	// now find the max for the summer teletherm
	// this is the max T, but need to grab that day
        if (season === "summer") {
            var T_teletherm = d3.max(smoothed_timeseries[i]);
        }
        else {
            var T_teletherm = d3.min(smoothed_timeseries[i]);
        }
	teletherm_dates[i] = smoothed_timeseries[i].indexOf(T_teletherm)+1;
        
        // then look out for the days within 2% of that temperature range
        // now it's a list of length 1
        teletherm_extents[i] = [[teletherm_dates[i]-1,teletherm_dates[i]+1]];
        var all_extent_days = [];
        for (var j=0; j<smoothed_timeseries[i].length; j++) {
            if (Math.abs(smoothed_timeseries[i][j] - T_teletherm) < .02*range_t) {
                all_extent_days.push(j);
            }
        }
        console.log(all_extent_days);
        // now go find the intervals in all the days
        // start the first interval
        teletherm_extents[i][0][0] = all_extent_days[0];
        for (var j=1; j<all_extent_days.length; j++) {
            if ((all_extent_days[j]-all_extent_days[j-1]) !== 1) {
                // end the previous interval
                teletherm_extents[i][teletherm_extents[i].length-1][1] = all_extent_days[j-1];
                // start another
                teletherm_extents[i].push([all_extent_days[j],all_extent_days[j]]);
            }
        }
        // end the last interval
        teletherm_extents[i][teletherm_extents[i].length-1][1] = all_extent_days[all_extent_days.length-1];
    }

    return {"smoothed_timeseries": smoothed_timeseries, "teletherm_dates": teletherm_dates, "teletherm_extents": teletherm_extents,};
}

// declare these globally (shoot me)
var tmin_avg,tmax_avg,summer_teletherm_extent,winter_teletherm_extent,tmax_smoothed_js,tmin_smoothed_js,summer_teletherm_date,winter_teletherm_date;

var tmax_raw;
var tmax_raw_years;
var tmin_raw;
var tmin_raw_years;

var cityPlot = function(error,results) {
    // function(i) {
    // console.log("plotting individual city data for city number:");
    // console.log(i);
    // console.log(results);

    // just for reference, these are the files that are being loaded
    // 
    // .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_values_combined.txt")
    // this one has the values for each day in the year, with rows as the years, and values going across
    //
    // .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_years_combined.txt")
    // this one has the years for the above file, going down
    // .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_values_combined.txt")
    // .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_years_combined.txt")

    // just to take a look
    // global_city_result = results;

    // get out the data I want

    var split_results_precomputed_small = function() {
        tmax_raw = results[0].split("\n").map(function(d) { return d.split(" ").map(parseFloat).slice(0,365); });
        tmax_raw_years = results[1].split("\n").map(parseFloat);
        if (isNaN(tmax_raw_years[tmax_raw_years.length-1])) {
            tmax_raw_years = tmax_raw_years.slice(0,tmax_raw_years.length-1);
            tmax_raw = tmax_raw.slice(0,tmax_raw.length-1);
        }
        tmin_raw = results[2].split("\n").map(function(d) { return d.split(" ").map(parseFloat).slice(0,365); });
        tmin_raw_years = results[3].split("\n").map(parseFloat);
        if (isNaN(tmin_raw_years[tmin_raw_years.length-1])) {
            tmin_raw_years = tmin_raw_years.slice(0,tmin_raw_years.length-1);
            tmin_raw = tmin_raw.slice(0,tmin_raw.length-1);
        }
    }

    split_results_precomputed_small();

    // check that the tmin and tmax start at the same year
    if (tmin_raw_years[0] !== tmax_raw_years[0]) {
        console.log("first years are  off");
    }

    // check that the tmin and tmax have the same # of years
    if (tmin_raw_years.length !== tmax_raw_years.length) {
        console.log("lengths are off");
    }

    var yearOffset = 0;
    // go get the year offset from the allyears
    for (var i=0; i<full_year_range.length; i++) {
        if (tmin_raw_years[0] === full_year_range[i]) {
            yearOffset = i;
            break;
        }
    }

    var good_tmax_count = Array(365);
    var good_tmin_count = Array(365);
    tmax_avg = Array(365);
    tmin_avg = Array(365);
    
    // reset these
    for (var i=0; i<365; i++) {
        tmax_avg[i] = 0;
        tmin_avg[i] = 0;
        good_tmax_count[i] = 0;
        good_tmin_count[i] = 0;        
    }

    // add them up
    for (var j=0; j<parseInt(windowDecoder().cached); j++) {
        for (var i=0; i<365; i++) {
            if (tmax_raw[j+yearIndex-yearOffset][i] > -9998) {
                tmax_avg[i] = tmax_avg[i] + tmax_raw[j+yearIndex-yearOffset][i];
                good_tmax_count[i]++;
            }
            if (tmin_raw[j+yearIndex-yearOffset][i] > -9998) {
                tmin_avg[i] = tmin_avg[i] + tmin_raw[j+yearIndex-yearOffset][i];
                good_tmin_count[i]++;
            }
        }
    }

    // take the average
    for (var i=0; i<365; i++) {
        if (good_tmax_count[i] > 0) {
            tmax_avg[i] = tmax_avg[i]/good_tmax_count[i];
        }
        if (good_tmin_count[i] > 0) {
            tmin_avg[i] = tmin_avg[i]/good_tmin_count[i];
        }
    }

    var summer_smoother = smooth_timeseries_gaussian([15],tmax_avg,"summer");
    summer_teletherm_date = summer_smoother.teletherm_dates[0];
    summer_teletherm_extent = summer_smoother.teletherm_extents[0];
    console.log(summer_teletherm_extent);
    tmax_smoothed_js  = summer_smoother.smoothed_timeseries[0];

    var winter_smoother = smooth_timeseries_gaussian([15],tmin_avg,"winter");
    winter_teletherm_date = winter_smoother.teletherm_dates[0];
    winter_teletherm_extent = winter_smoother.teletherm_extents[0];
    console.log(winter_teletherm_extent);
    tmin_smoothed_js  = winter_smoother.smoothed_timeseries[0];
    
    console.log("will now plot the city data");

    var figure;
    var margin;
    var figheight;
    var figwidth;
    var width;
    var height;
    var canvas;
    var x_max;
    var x_min;
    var y;
    var axes;
    var line_max;
    var line_min;
    var area_max;
    var area_min;
    
    plot_city_main = function() {
        // globals that this function needs:
        // tmin_avg,tmax_avg,summer_teletherm_extent,winter_teletherm_extent,tmax_smoothed_js,tmin_smoothed_js,summer_teletherm_date,winter_teletherm_date

        figure = d3.select("#station1");
        
        margin = {top: 40, right: 10, bottom: 40, left: 50};

        // full width and height
        figwidth  = parseInt(figure.style("width"));
        figheight = figwidth*0.5;
        // don't shrink this
        width = figwidth - margin.left - margin.right;
        // tiny bit of space
        height = figheight - margin.top - margin.bottom;

        // remove an old figure if it exists
        figure.select(".canvas").remove();

        //Create SVG element
        canvas = figure
	    .append("svg")
	    .attr("class", "map canvas")
	    .attr("id", "stationsvg1")
	    .attr("width", figwidth)
	    .attr("height", figheight);

        x_max = d3.scale.linear()
	    .domain([1,365+181])
	    .range([0,width]);

        x_min = d3.scale.linear()
	    .domain([1-181,365+181-181])
	    .range([0,width]);
        
        y =  d3.scale.linear()
	// .domain([-30,130]) // summer temps
	    .domain([d3.min(tmin_avg),d3.max(tmax_avg)])
	    .range([height-10, 10]); 

        // create the axes themselves
        axes = canvas.append("g")
	    .attr("transform", "translate(" + (margin.left) + "," +
	          (margin.top) + ")") // 99 percent
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
                .tickValues(month_lengths_cum_18_forward)
                .tickFormat(function(d,i) { return month_names[i % 12].slice(0,3) + " 1"; })
	        .orient("bottom"); }

        // axes creation functions
        var create_xAxis_2 = function() {
	    return d3.svg.axis()
	        .scale(x_min)
                .tickValues(month_lengths_cum_18_backward)
                .tickFormat(function(d,i) { return month_names[i % 12].slice(0,3) + " 1"; })
	        .orient("top"); }    

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

        // draw the axes
        var xAxis_2 = create_xAxis_2()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "x axis ")
	    .attr("font-size", "14.0px")
	    .attr("transform", "translate(0," + (0) + ")")
	    .call(xAxis_2);

        d3.selectAll(".tick line").style("stroke","black");

        d3.selectAll(".tick text").style("font-size",10);    

        var xlabel_text = "Summer Teletherm Day";
        var xlabel = canvas.append("text")
	    .text(xlabel_text)
	    .attr("class","axes-text")
	    .attr("x",margin.left+width/2)  
	    .attr("y",figheight-5)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("style", "text-anchor: middle;");

        
        var xlabel_text = "Winter Teletherm Day";
        var xlabel = canvas.append("text")
	    .text(xlabel_text)
	    .attr("class","axes-text")
	    .attr("x",margin.left+width/2)  
	    .attr("y",14)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("style", "text-anchor: middle;");

        var ylabel_text = "Temperature";
        var ylabel = canvas.append("text")
	    .text(ylabel_text)
	    .attr("class","axes-text")
	    .attr("x",18)
	    .attr("y",figheight/2)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("transform", "rotate(-90.0," + (18) + "," + (figheight/2) + ")");    

        line_max = d3.svg.line()
	    .x(function(d,i) { return x_max(i+1); })
	    .y(function(d) { return y(d); })
	    .interpolate("linear"); // cardinal

        line_min = d3.svg.line()
	    .x(function(d,i) { return x_min(i+1-181); })
	    .y(function(d) { return y(d); })
	    .interpolate("linear"); // cardinal    

        area_max = d3.svg.area()
	    .x(function(d,i) { return x_max(d+1); })
	    .y0(function(d) { return height; })
	    .y1(function(d) { return y(tmax_smoothed_js[d]); })    
	    .interpolate("linear"); // cardinal


        area_min = d3.svg.area()
	    .x(function(d,i) { return x_min(d+1); })
	    .y0(function(d) { return 0; })
	    .y1(function(d) { return y(tmin_smoothed_js[d]); })
	    .interpolate("linear"); // cardinal

        var summer_teletherm_extent_extended = Array(summer_teletherm_extent.length);
        for (var i=0; i<summer_teletherm_extent.length; i++) {
            summer_teletherm_extent_extended[i] = [summer_teletherm_extent[i][0]];
            while ((summer_teletherm_extent_extended[i][summer_teletherm_extent_extended[i].length-1]) < summer_teletherm_extent[i][1]) { summer_teletherm_extent_extended[i].push(summer_teletherm_extent_extended[i][summer_teletherm_extent_extended[i].length-1]+1);  }
        }

        axes.selectAll("path.summerextentarea")
            .data(summer_teletherm_extent_extended)
            .enter()
            .append("path")
            .attr("class", "summerextentarea")
            .attr("d", area_max)
            .attr("stroke","black")
            .attr("stroke-width",0.5)
            .attr("fill","lightgrey");

        var winter_teletherm_extent_extended = Array(winter_teletherm_extent.length);
        for (var i=0; i<winter_teletherm_extent.length; i++) {
            winter_teletherm_extent_extended[i] = [winter_teletherm_extent[i][0]];
            while ((winter_teletherm_extent_extended[i][winter_teletherm_extent_extended[i].length-1]) < winter_teletherm_extent[i][1]) { winter_teletherm_extent_extended[i].push(winter_teletherm_extent_extended[i][winter_teletherm_extent_extended[i].length-1]+1);  }
        }

        // console.log(winter_teletherm_extent);
        // console.log(winter_teletherm_extent_extended);

        axes.selectAll("path.winterextentarea")
        // .data([tmin_smoothed_js.slice(winter_teletherm_extent[0][0],winter_teletherm_extent[0][1]),tmin_smoothed_js.slice(winter_teletherm_extent[1][0],winter_teletherm_extent[1][1])])
            .data(winter_teletherm_extent_extended)
            .enter()
            .append("path")        
            .attr("class", "winterextentarea")
            .attr("d", area_min)
            .attr("stroke","black")
            .attr("stroke-width",0.5)
            .attr("fill","lightgrey");

        axes.append("path")
            .datum([].concat(tmax_smoothed_js,tmax_smoothed_js.slice(0,181)))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_max)
            .attr("stroke","red")
            .attr("stroke-width",2)
            .attr("fill","none");

        axes.append("path")
            .datum([].concat(tmin_smoothed_js.slice(184),tmin_smoothed_js))
            .attr("class", "tminsmoothed")
            .attr("d", line_min)
            .attr("stroke","blue")
            .attr("stroke-width",2)
            .attr("fill","none");

        axes.selectAll("circle.avgmaxtemp")
	    .data([].concat(tmax_avg,tmax_avg.slice(0,181)))
	    .enter()
	    .append("circle")
	    .attr({ "cx": function(d,i) { return x_max(i+1); },
		    "cy": function(d,i) { return y(d); },
		    "r": 2,
                    "class": "avgmaxtemp",
	          });

        axes.selectAll("circle.avgmintemp")
	    .data([].concat(tmin_avg.slice(184),tmin_avg))
	    .enter()
	    .append("circle")
	    .attr({ "cx": function(d,i) { return x_min(i+1-181); },
		    "cy": function(d,i) { return y(d); },
		    "r": 2,
                    "class": "avgmintemp",
	          });
        
        axes.append("line")
	    .attr({ "x1": x_max(summer_teletherm_date+1),
		    "y1": height,
		    "x2": x_max(summer_teletherm_date+1),
                    "y2": y(tmax_smoothed_js[summer_teletherm_date]),
                    "class": "summerteleline",
	          })
            .style({
                "stroke": "black",
                "stroke-width": 2,
            });

        axes.append("line")
	    .attr({ "x1": x_min(winter_teletherm_date+1),
		    "y1": 0,
		    "x2": x_min(winter_teletherm_date+1),
                    "y2": y(tmin_smoothed_js[winter_teletherm_date]),
                    "class": "winterteleline",
	          })
            .style({
                "stroke": "black",
                "stroke-width": 2,
            });

        // format the summer teletherm day
        // with our fixed months
        var month = 0;
        while (summer_teletherm_date > month_lengths_cum[month]) {
            month+=1;
        }
        var day = summer_teletherm_date-month_lengths_cum[month-1]+1;
        // console.log(month);
        // console.log(day);
        
        axes.append("text")
            .attr({
                "x": function(d,i) { return x_max(summer_teletherm_extent[0][0]+1)-5; },
                "y": height-30,
                "transform": function(d,i) { return "rotate(-90 "+(x_max(summer_teletherm_extent[0][0]+1)-5)+","+(height-30)+")"; },
                "class": "summertext",
            })
            .style({
                "text-align": "left",
                "font-size": 11,
            })    
            .text("Summer Teletherm: "+month_names[month-1].slice(0,3)+" "+day+" (day "+summer_teletherm_date+"), "+(summer_teletherm_extent[summer_teletherm_extent.length-1][1]-summer_teletherm_extent[0][0])+" day extent")

        // format the winter teletherm day
        // with our fixed months
        month = 0;
        while (winter_teletherm_date > month_lengths_cum[month]) {
            month+=1;
        }
        day = winter_teletherm_date-month_lengths_cum[month-1]+1;
        
        axes.append("text")
            .attr({
                "x": function(d,i) { return x_min(winter_teletherm_extent[0][0]+1)-5; },
                "y": 290,
                "transform": function(d,i) { return "rotate(-90 "+(x_min(winter_teletherm_extent[0][0]+1)-5)+","+290+")"; },
            })
            .style({
                "text-align": "right",
                "font-size": 11,
                "class": "wintertext",
            })    
            .text("Winter Teletherm: "+month_names[month-1-6].slice(0,3)+" "+day+" (day "+winter_teletherm_date+"), "+(winter_teletherm_extent[winter_teletherm_extent.length-1][1]-winter_teletherm_extent[0][0])+" day extent");
        
    } // end plot() function

    // call it
    plot_city_main();

    replot_city_main = function() {
        // broken now, with multiple periods combing back
        axes.select("path.summerextentarea")
            .transition()
            .datum(tmax_smoothed_js.slice(summer_teletherm_extent[0][0],summer_teletherm_extent[0][1]))
            .attr("d", area_max);

        axes.select("path.winterextentarea")
            .transition()
            .datum(tmin_smoothed_js.slice(winter_teletherm_extent[0][0],winter_teletherm_extent[0][1]))
            .attr("d", area_min)
        
        axes.select("path.tmaxsmoothed")
            .transition()
            .datum([].concat(tmax_smoothed_js,tmax_smoothed_js.slice(0,181)))
            .attr("d", line_max)

        axes.select("path.tminsmoothed")
            .transition()
            .datum([].concat(tmin_smoothed_js.slice(184),tmin_smoothed_js))
            .attr("d", line_min)

        axes.selectAll("circle.avgmaxtemp")
            .transition()
	    .data([].concat(tmax_avg,tmax_avg.slice(0,181)))
	    .attr({ "cx": function(d,i) { return x_max(i+1); },
		    "cy": function(d,i) { return y(d); },
	          });

        axes.selectAll("circle.avgmintemp")
	    .data([].concat(tmin_avg.slice(184),tmin_avg))
            .transition()        
	    .attr({ "cx": function(d,i) { return x_min(i+1-181); },
		    "cy": function(d,i) { return y(d); },
	          });
        
        axes.select("line.summerteleline")
            .transition()
	    .attr({ "x1": x_max(summer_teletherm_date+1),
		    "x2": x_max(summer_teletherm_date+1),
                    "y2": y(tmax_smoothed_js[summer_teletherm_date]),
	          });

        axes.append("line.winterteleline")
            .transition()
	    .attr({ "x1": x_min(winter_teletherm_date+1),
		    "x2": x_min(winter_teletherm_date+1),
                    "y2": y(tmin_smoothed_js[winter_teletherm_date]),
	          });
        
        // format the summer teletherm day
        // with our fixed months
        var month = 0;
        while (summer_teletherm_date > month_lengths_cum[month]) {
            month+=1;
        }
        var day = summer_teletherm_date-month_lengths_cum[month-1]+1;
        // console.log(month);
        // console.log(day);
        
        axes.select("text.summertext")
            .transition()
            .attr({
                "x": function(d,i) { return x_max(summer_teletherm_extent[0]+1)-5; },
                "transform": function(d,i) { return "rotate(-90 "+(x_max(summer_teletherm_extent[0]+1)-5)+","+(height-30)+")"; },
            })
            .text("Summer Teletherm: "+month_names[month-1].slice(0,3)+" "+day+" (day "+summer_teletherm_date+"), "+(summer_teletherm_extent[1]-summer_teletherm_extent[0])+" day extent")

        // format the winter teletherm day
        // with our fixed months
        month = 0;
        while (winter_teletherm_date > month_lengths_cum[month]) {
            month+=1;
        }
        day = winter_teletherm_date-month_lengths_cum[month-1]+1;
        
        axes.select("text.wintertext")
            .transition()
            .attr({
                "x": function(d,i) { return x_min(winter_teletherm_extent[0]+1)-5; },
                "transform": function(d,i) { return "rotate(-90 "+(x_min(winter_teletherm_extent[0]+1)-5)+","+290+")"; },
            })
            .text("Winter Teletherm: "+month_names[month-1-6].slice(0,3)+" "+day+" (day "+winter_teletherm_date+"), "+(winter_teletherm_extent[1]-winter_teletherm_extent[0])+" day extent");        
    }
    
    // move the screen down to this
    // document.getElementById('station1').focus();
    $("html, body").animate({ scrollTop: $("#station1").offset().top }, 900);
    // $.scrollTo($('#station1').offset().top);
}

$("#yearbuttons input").click(function() {
    console.log("calling updatewindow()");
    updatewindow(1000);
    
    // console.log($(this).val());
    currentWindow = $(this).val();
    windowEncoder.varval(currentWindow);

    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }

    // need to get the extent in there too
    if (variableDecoder().cached === "summer_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")        
	    .awaitAll(updateMap);
    }
    else if (variableDecoder().cached === "winter_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")                
	    .awaitAll(updateMap);
    }
    else {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .awaitAll(updateMap);
    }
    
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
    
    // need to get the extent in there too
    if (variableDecoder().cached === "summer_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")        
	    .awaitAll(updateMap);
    }
    else if (variableDecoder().cached === "winter_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")                
	    .awaitAll(updateMap);
    }
    else {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .awaitAll(updateMap);
    }
    
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
var extradata = [];

// special color scale for maxT
var maxTcolor = function(i) { 
    return d3.rgb(Math.floor(tempScale(data[i+1][0])*255),0,0).toString();
}

// diverging red blue color map from colorbrewer
// var divredbluerev = ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#var"];
// var divredblue = ["#053061","#2166ac","#4393c3","#92c5de","#d1e5f0","#f7f7f7","#fddbc7","#f4a582","#d6604d","#b2182b","#67001f",];
// var divredblue = ['rgb(165,0,38)','rgb(215,48,39)','rgb(244,109,67)','rgb(253,174,97)','rgb(254,224,144)','rgb(255,255,191)','rgb(171,217,233)','rgb(116,173,209)','rgb(69,117,180)','rgb(49,54,149)','rgb(44,46,108)'].reverse();
// var divredblue = [
//     [1.0000000e+00,0.0000000e+00,0.0000000e+00],
//     [1.0000000e+00,6.0000000e-02,0.0000000e+00],
//     [1.0000000e+00,1.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,1.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,2.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,3.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,3.6000000e-01,0.0000000e+00],
//     [1.0000000e+00,4.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,4.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,5.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,6.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,6.6000000e-01,0.0000000e+00],
//     [1.0000000e+00,7.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,7.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,8.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,9.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,9.6000000e-01,0.0000000e+00],
//     [9.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [9.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [7.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [6.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [6.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [5.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [5.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [4.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [3.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [3.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [2.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [2.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [1.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.0000000e-02,1.0000000e+00,0.0000000e+00],
//     [2.0000000e-02,1.0000000e+00,0.0000000e+00],
//     [0.0000000e+00,1.0000000e+00,4.0000000e-02],
//     [0.0000000e+00,1.0000000e+00,1.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,1.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,2.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,2.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,3.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,4.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,4.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,5.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,5.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,6.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,7.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,7.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,8.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,8.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,9.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,1.0000000e+00],
//     [0.0000000e+00,9.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,8.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,8.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,7.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,7.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,6.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,5.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,5.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,3.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,2.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,2.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,1.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,1.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.0000000e-02,1.0000000e+00],
//     [2.0000000e-02,0.0000000e+00,1.0000000e+00],
//     [8.0000000e-02,0.0000000e+00,1.0000000e+00],
//     [1.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [2.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [2.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [3.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [3.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [4.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [5.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [5.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [6.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [6.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [7.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [8.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [8.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [9.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [9.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [1.0000000e+00,0.0000000e+00,9.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,9.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,8.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,7.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,7.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,5.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,4.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,4.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,3.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,3.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,2.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,1.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,1.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.0000000e-02],];
var divredblue = ["rgb(255,0,0)","rgb(255,15,0)","rgb(255,31,0)","rgb(255,46,0)","rgb(255,61,0)","rgb(255,77,0)","rgb(255,92,0)","rgb(255,107,0)","rgb(255,122,0)","rgb(255,138,0)","rgb(255,153,0)","rgb(255,168,0)","rgb(255,184,0)","rgb(255,199,0)","rgb(255,214,0)","rgb(255,230,0)","rgb(255,245,0)","rgb(250,255,0)","rgb(235,255,0)","rgb(219,255,0)","rgb(204,255,0)","rgb(189,255,0)","rgb(173,255,0)","rgb(158,255,0)","rgb(143,255,0)","rgb(128,255,0)","rgb(112,255,0)","rgb(97,255,0)","rgb(82,255,0)","rgb(66,255,0)","rgb(51,255,0)","rgb(36,255,0)","rgb(20,255,0)","rgb(5,255,0)","rgb(0,255,10)","rgb(0,255,26)","rgb(0,255,41)","rgb(0,255,56)","rgb(0,255,71)","rgb(0,255,87)","rgb(0,255,102)","rgb(0,255,117)","rgb(0,255,133)","rgb(0,255,148)","rgb(0,255,163)","rgb(0,255,179)","rgb(0,255,194)","rgb(0,255,209)","rgb(0,255,224)","rgb(0,255,240)","rgb(0,255,255)","rgb(0,240,255)","rgb(0,224,255)","rgb(0,209,255)","rgb(0,194,255)","rgb(0,179,255)","rgb(0,163,255)","rgb(0,148,255)","rgb(0,133,255)","rgb(0,117,255)","rgb(0,102,255)","rgb(0,87,255)","rgb(0,71,255)","rgb(0,56,255)","rgb(0,41,255)","rgb(0,26,255)","rgb(0,10,255)","rgb(5,0,255)","rgb(20,0,255)","rgb(36,0,255)","rgb(51,0,255)","rgb(66,0,255)","rgb(82,0,255)","rgb(97,0,255)","rgb(112,0,255)","rgb(128,0,255)","rgb(143,0,255)","rgb(158,0,255)","rgb(173,0,255)","rgb(189,0,255)","rgb(204,0,255)","rgb(219,0,255)","rgb(235,0,255)","rgb(250,0,255)","rgb(255,0,245)","rgb(255,0,230)","rgb(255,0,214)","rgb(255,0,199)","rgb(255,0,184)","rgb(255,0,168)","rgb(255,0,153)","rgb(255,0,138)","rgb(255,0,122)","rgb(255,0,107)","rgb(255,0,92)","rgb(255,0,77)","rgb(255,0,61)","rgb(255,0,46)","rgb(255,0,31)","rgb(255,0,15)",];

var summerTScale = d3.scale.quantize()
 // celsius domain
 // .domain([63,117])
 // for fake data
    .range(divredblue);

var fullExtent;
var angle_offset = 0;

var updateMap = function(error,results) {
    console.log("update the map!");
    console.log("here is the result from queue for the map update:");
    console.log(results);
    data = results[0].split("\n");
    if (results.length > 1) {
        extradata = results[1].split("\n").map(function(d) { return d.split(" ").map(parseFloat); });
    }
    else {
        extradata = [];
    }
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
	.html(function(d) { return d+""+"&ndash;"+(d+parseInt(windowDecoder().cached)); })
        .on("click",function(d,i) {
	    yearIndex = i;
            console.log(yearIndex);
	    // yearEncoder.varval(yearIndex.toFixed(0));
            yearEncoder.varval(allyears[i]+"");
	    changeYear();
            if (yearIndex < allyears.length) {
	        var play_button = d3.select("#playButton")
                play_button.attr("class","btn btn-default");
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
    var pagewidth = parseInt(d3.select("#station1").style("width"));
    if (pagewidth > 600) {
        if (variableIndex < 2) {
            drawScale(variableRanges[variableIndex],"polar");
        }
        else {
            drawScale(variableRanges[variableIndex],"linear");
        }
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
    var loop = true;
    var update_time = 1000;
    if (yearIndex > allyears.length-1) {
        if (loop) {
            yearIndex = 0;
            updatetime = 3000;
        }
        else{
	    clearInterval(playTimer);
	    var play_button = d3.select("#playButton")
            play_button.attr("class","btn btn-default disabled");
            play_button.select("i").attr("class","fa fa-play");
	    playing = false;
	    yearIndex--;
	    return 0;
        }
    }

    
    // console.log("changing year index to");
    // console.log(yearIndex);
    // console.log(allyears[yearIndex]);
    $("#yeardropvis").html(allyears[yearIndex]+""+"&ndash;"+(allyears[yearIndex]+parseInt(windowDecoder().cached))+" <span class=\"caret\"></span>");
    yearEncoder.varval(allyears[yearIndex]+"");
    

    console.log("calling updatewindow() to update the top timeline");
    updatewindow(update_time);

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

    if (extradata.length > 0) {
        cities.attr("r",function(d,i) {
            if (extradata[i+1][yearIndex] > -9998) {
                return Math.sqrt(extradata[i+1][yearIndex]);
            }
            else {
                return rmin;
            }})
            .attr("extravalue",function(d,i) {
                return extradata[i+1][yearIndex];
            });
    }
    else {
        cities.attr("r",function(d,i) {
                return rmin;
        });
    }

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
    var legendradius = 50;
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
		   "transform": "translate("+(w-20-legendradius)+","+(h-legendradius-30)+")",});

	var arc = d3.svg.arc()
	    .outerRadius(legendradius-5)
	    .innerRadius(0);

	var pie = d3.layout.pie()
	    .sort(null)
	    .startAngle((extent[0]-1)/365*2*Math.PI)
	    .endAngle((extent[1]-1)/365*2*Math.PI)
	    .value(function(d) { return d; });

        var ones = Array(divredblue.length);
        for (var i=0; i<ones.length; i++) { ones[i] = 1; }
	legendgroup.selectAll(".arc")
	    .data(pie(ones))
	    .enter()
	    .append("path")
	    .attr({"d": arc,
		   "fill": function(d,i) { return divredblue[i]; },
		  });

        // now go and convert all of the dates to an angle
        var radial_scale = d3.scale.linear()
            .domain([1,365/4+1])
            .range([Math.PI/2,0]);

        var rotation_scale = d3.scale.linear()
            .domain([1,365/4+1])
            .range([90,180]);

        var num_labels = 11;

        // let's linspace out the ticks
        var increments = Array(num_labels);
        var increments_moved = Array(increments.length);        
        var spacing = (extent[1]-extent[0])/(increments.length-1);
        for (var i=0; i<increments.length; i++) {
            increments[i] = extent[0]+i*spacing;
            increments_moved[i] = extent[0]+i*spacing-spacing/4;
        }
        console.log("increments:");
        console.log(increments);
        
        legendgroup.selectAll(".label")
	    .data(increments_moved)
	    .enter()
	    .append("text")
	    .attr({ // "text-align": "right",
                   "x": function(d,i) { return (legendradius+25)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ); },
                   "y": function(d,i) { return -(legendradius+25)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4)); },
                // "transform": function(d,i) { return "rotate("+(((rotation_scale(((d + 365/4) % 365) - 365/4) + 90) % 180) -90)+" "+((legendradius+25)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ))+","+(-(legendradius+25)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4)))+")"; },
                "transform": function(d,i) { return "rotate("+(rotation_scale(((d + 365/4) % 365) - 365/4))+" "+((legendradius+25)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ))+","+(-(legendradius+25)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4)))+")"; },
		  })
            .style({"font-size": "8px"})
            .text(function(d,i) { 
                var date = new Date(1900,0,1);
                date.setTime( date.getTime() + increments[i] * 86400000 );
                if ( date.getDate() < 10 ) {
                    return month_names[date.getMonth()].slice(0,3)+" 0"+date.getDate();
                }
                else {
                    return month_names[date.getMonth()].slice(0,3)+" "+date.getDate();
                }
            });
        
        legendgroup.selectAll(".tick")
	    .data(increments)
	    .enter()
	    .append("line")
	    .attr({
                   "x1": function(d,i) { return (legendradius-5)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ); },
                   "y1": function(d,i) { return -(legendradius-5)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4) ); },
                   "x2": function(d,i) { return (legendradius)*Math.cos(radial_scale(((d + 365/4) % 365) - 365/4) ); },
                   "y2": function(d,i) { return -(legendradius)*Math.sin(radial_scale(((d + 365/4) % 365) - 365/4) ); },
		  })
                .style({
            "stroke": "black",
            "stroke-width": 1,            
        });
    }
}

var w;
var h;
var canvas;

var plot_timeline = function() {

    var figure = d3.select("#timeline");
    
    var margin = {top: 0, right: 10, bottom: 0, left: 10};

    // full width and height
    var figwidth  = parseInt(figure.style("width"));
    var figheight = 20;
    var width = figwidth - margin.left - margin.right;
    var height = figheight - margin.top - margin.bottom;

    // remove an old figure if it exists
    figure.select(".canvas").remove();

    //Create SVG element
    var canvas = figure
	.append("svg")
	.attr("class", "canvas")
	.attr("id", "timelinesvg")
	.attr("width", figwidth)
	.attr("height", figheight);

    var x = d3.scale.linear()
	.domain([full_year_range[0],full_year_range[full_year_range.length-1]])
	.range([10,width-10]);

    var y =  d3.scale.linear()
	// .domain([-30,130]) // summer temps
	.domain([0,1])
	.range([0,height]);

    var centerline = canvas.append("line")
        .attr({
            "x1": x(1900),
            "y1": y(0.25),
            "x2": x(2013),
            "y2": y(0.25),
        })
        .style({
            "stroke": "black",
            "stroke-width": 2,            
        });

    var ticks = canvas.selectAll("line.yeartick")
        .data([1900,1905,1910,1915,1920,1925,1930,1935,1940,1945,1950,1955,1960,1965,1970,1975,1980,1985,1990,1995,2000,2005,2010,2013])
        .enter()
        .append("line")
        .attr({
            "x1": function(d,i) { return x(d); },
            "y1": y(0.0),
            "x2": function(d,i) { return x(d); },
            "y2": y(0.5),
        })
        .style({
            "stroke": "black",
            "stroke-width": 1,            
        });

    var ticklabels = canvas.selectAll("line.yearticklabel")
        .data([1900,1905,1910,1915,1920,1925,1930,1935,1940,1945,1950,1955,1960,1965,1970,1975,1980,1985,1990,1995,2000,2005,2010,2013])
        .enter()
        .append("text")
        .attr({
            "x": function(d,i) { return x(d-1.3); },
            "y": height-2,
        })
        .style({
            // "stroke": "black",
            "text-align": "center",
            "font-size": 9,
        })
        .text(function(d) { return d; });
    

    var curr_window = canvas.append("rect")
        .attr({
            "x": x(full_year_range[yearIndex]),
            "y": y(0.0),
            "width": x(parseFloat(currentWindow)+full_year_range[0])-x(full_year_range[0]),
            "height": y(0.5),
            "class": "currentwindow",
        })
        .style({
            "border": "blue",
            "fill": "blue",
            "opacity": 0.5,
        });

    updatewindow = function(t) {
        console.log("updating the top window slider");
        console.log(yearIndex);
        // curr_window.transition().duration(t).attr("x",x(full_year_range[yearIndex]));
        curr_window.transition().attr("x",x(full_year_range[yearIndex]))
            .attr("width",x(parseFloat(currentWindow)+full_year_range[0])-x(full_year_range[0]));
    }
    
    // currentWindow
    // yearIndex
}

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
        .distortion(3);
    
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
	.scale(w*1.2); // 1.37 is max size

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
	// canvas.selectAll("circle").attr("r",rmin);
        canvas.selectAll("line").transition().duration(500).style("opacity","1.0");        
	hovergroup.style({
	    "visibility": "hidden",
	});
    }

    var city_hover = function(d,i) {
	// console.log(this);
	// d3.select(this).select("circle").attr("r",rmax);
        

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
            .html(variableHover[variableIndex]+" from "+allyears[yearIndex]+"&ndash;"+(parseFloat(windows[windowIndex])+allyears[yearIndex])+": ");

        if (variableIndex < 2) {
            // go convert the day to an actual date
            var teletherm_day = (data[parseFloat(d[0])][yearIndex]+angle_offset);
            var date = new Date(1900,0,1);
            date.setTime( date.getTime() + teletherm_day * 86400000 );
            
            var teletherm_extent = extradata[parseFloat(d[0])][yearIndex];
            if (teletherm_extent === -9999) {
                teletherm_extent = "unknown";
            }
	    hovergroup.append("p")
                .text(month_names[date.getMonth()]+" "+date.getDate()+", with "+teletherm_extent+" day extent.");

        }
        else {
            hovergroup.append("p")
                .html(data[parseFloat(d[0])][yearIndex].toFixed(2)+" degrees F.");
        }

        hovergroup.append("p")
            .html("Click the city for more info.");

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
        var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",")+" ("+allyears[yearIndex]+"&ndash;"+(allyears[yearIndex]+parseInt(windowDecoder().cached))+"):";

        // alert("you clicked on the station at "+city_name);
        document.getElementById("stationname").innerHTML = city_name;
	console.log(d[0]);
        
        queue()
            .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_values_combined.txt")
            .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_years_combined.txt")
            .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_values_combined.txt")
            .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_years_combined.txt")
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
	    // "r": rmin,
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

    console.log("plotting timeline");
    plot_timeline(); 
    console.log("queueing up the data for the circles on the map");

    if (variableDecoder().cached === "summer_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")        
	    .awaitAll(updateMap);
    }
    else if (variableDecoder().cached === "winter_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")                
	    .awaitAll(updateMap);
    }
    else {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .awaitAll(updateMap);
    }    

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



