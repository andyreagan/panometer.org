// two functions, smooth_timeries_gaussian and cityTimePlot
//
// smooth_timeseries_gaussian is used by cityPlot to take the raw data
// and average it
//
// cityPlot takes the raw data load, a total of 4 files, and uses the year stored in yearIndex
// and parseInt(windowDecoder().cached) (the number of years) to add up the data

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
        // console.log(all_extent_days);
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
var cityTimePlot = function(error,results) {
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
        console.log(tmin_raw_years.length);
        console.log(tmax_raw_years.length);
    }

    var min_years = Math.min(tmin_raw_years.length,tmax_raw_years.length);

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

    var local_window = parseInt(windowDecoder().cached);

    // storage for average values across each year!
    // var all_tmax_avg = Array(min_years-local_window+1);
    // var all_tmin_avg = Array(min_years-local_window+1);
    all_tmax_avg = Array(min_years-local_window+1);
    all_tmin_avg = Array(min_years-local_window+1);

    summer_data_coverage = Array(min_years);
    winter_data_coverage = Array(min_years);
    
    for (var j=0; j<min_years-local_window+1; j++) {
        all_tmax_avg[j] = Array(365);
        all_tmin_avg[j] = Array(365);
        for (var i=0; i<365; i++) {
            all_tmax_avg[j][i] = 0;
            all_tmin_avg[j][i] = 0;
        }
    }

    // store the values at the end
    for (var i=0; i<365; i++) {
        tmax_avg[i] = 0;
        tmin_avg[i] = 0;
        good_tmax_count[i] = 0;
        good_tmin_count[i] = 0;
    }

    // add the first local_window of the raw dates
    for (var j=0; j<local_window; j++) {
        var good_tmax_this_year = 0;
        var good_tmin_this_year = 0;
        for (var i=0; i<365; i++) {
            if (tmax_raw[j][i] > -9998) {
                tmax_avg[i] = tmax_avg[i] + tmax_raw[j][i];
                good_tmax_count[i]++;
                good_tmax_this_year++;
            }
            if (tmin_raw[j][i] > -9998) {
                tmin_avg[i] = tmin_avg[i] + tmin_raw[j][i];
                good_tmin_count[i]++;
                good_tmin_this_year++;
            }
        }
        summer_data_coverage[j] = good_tmax_this_year/365;
        winter_data_coverage[j] = good_tmin_this_year/365;
    }

    // take the average into the first year
    for (var i=0; i<365; i++) {
        if (good_tmax_count[i] > 0) {
            all_tmax_avg[0][i] = tmax_avg[i]/good_tmax_count[i];
        }
        if (good_tmin_count[i] > 0) {
            all_tmin_avg[0][i] = tmin_avg[i]/good_tmin_count[i];
        }
    }

    // add the first local_window of the raw dates
    for (var j=local_window; j<min_years; j++) {
        var good_tmax_this_year = 0;
        var good_tmin_this_year = 0;
        // go through the year and add
        for (var i=0; i<365; i++) {
            if (tmax_raw[j][i] > -9998) {
                tmax_avg[i] = tmax_avg[i] + tmax_raw[j][i];
                good_tmax_count[i]++;
                good_tmax_this_year++;
            }
            if (tmin_raw[j][i] > -9998) {
                tmin_avg[i] = tmin_avg[i] + tmin_raw[j][i];
                good_tmin_count[i]++;
                good_tmin_this_year++;
            }
        }
        // go through the year-window and subtract
        for (var i=0; i<365; i++) {
            if (tmax_raw[j-local_window][i] > -9998) {
                tmax_avg[i] = tmax_avg[i] - tmax_raw[j-local_window][i];
                good_tmax_count[i]--;
            }
            if (tmin_raw[j-local_window][i] > -9998) {
                tmin_avg[i] = tmin_avg[i] - tmin_raw[j-local_window][i];
                good_tmin_count[i]--;
            }
        }
        // console.log(j);
        // take the new average
        for (var i=0; i<365; i++) {
            if (good_tmax_count[i] > 0) {
                all_tmax_avg[j-local_window+1][i] = tmax_avg[i]/good_tmax_count[i];
            }
            if (good_tmin_count[i] > 0) {
                all_tmin_avg[j-local_window+1][i] = tmin_avg[i]/good_tmin_count[i];
            }
        }
        // console.log(j);
        summer_data_coverage[j] = good_tmax_this_year/365;
        winter_data_coverage[j] = good_tmin_this_year/365;
    }

    // tmin_avg = all_tmin_avg[0];
    // tmax_avg = all_tmax_avg[0];

    // var summer_smoother = smooth_timeseries_gaussian([15],tmax_avg,"summer");
    // summer_teletherm_date = summer_smoother.teletherm_dates[0];
    // summer_teletherm_extent = summer_smoother.teletherm_extents[0];
    // console.log(summer_teletherm_extent);
    // tmax_smoothed_js  = summer_smoother.smoothed_timeseries[0];

    // var winter_smoother = smooth_timeseries_gaussian([15],tmin_avg,"winter");
    // winter_teletherm_date = winter_smoother.teletherm_dates[0];
    // winter_teletherm_extent = winter_smoother.teletherm_extents[0];
    // console.log(winter_teletherm_extent);
    // tmin_smoothed_js  = winter_smoother.smoothed_timeseries[0];

    // screw it, store the full averaged values too
    all_tmax_avg_smoothed = Array(min_years-local_window+1);
    all_tmin_avg_smoothed = Array(min_years-local_window+1);
    // for (var j=0; j<min_years; j++) {
    //     all_tmax_avg[j] = Array(365);
    //     all_tmin_avg[j] = Array(365);
    //     for (var i=0; i<365; i++) {
    //         all_tmax_avg[j][i] = 0;
    //         all_tmin_avg[j][i] = 0;
    //     }
    // }

    all_winter_dates = Array(min_years-local_window+1);
    all_winter_extents = Array(min_years-local_window+1);
    all_summer_dates = Array(min_years-local_window+1);
    all_summer_extents = Array(min_years-local_window+1);

    // smooth everything
    for (var j=local_window; j<min_years+1; j++) {
        var summer_smoother = smooth_timeseries_gaussian([15],all_tmax_avg[j-local_window],"summer");
        all_summer_dates[j-local_window] = summer_smoother.teletherm_dates[0];
        all_summer_extents[j-local_window] = summer_smoother.teletherm_extents[0];
        all_tmax_avg_smoothed[j-local_window]  = summer_smoother.smoothed_timeseries[0];

        var winter_smoother = smooth_timeseries_gaussian([15],all_tmin_avg[j-local_window],"winter");
        all_winter_dates[j-local_window] = winter_smoother.teletherm_dates[0];
        all_winter_extents[j-local_window] = winter_smoother.teletherm_extents[0];
        all_tmin_avg_smoothed[j-local_window]  = winter_smoother.smoothed_timeseries[0];
    }

    var flattened_summer_extents = [];
    for (var i=0; i<all_summer_extents.length; i++) {
        for (var j=0; j<all_summer_extents[i].length; j++) {
            flattened_summer_extents.push([i].concat(all_summer_extents[i][j]))
        }
    }

    var flattened_winter_extents = [];
    for (var i=0; i<all_winter_extents.length; i++) {
        for (var j=0; j<all_winter_extents[i].length; j++) {
            flattened_winter_extents.push([i].concat(all_winter_extents[i][j]))
        }
    }

    console.log("will now plot the city data");

    if (station_dynamics) {
        cityPlot(all_tmax_avg[0],all_summer_dates[0],all_summer_extents[0],all_tmax_avg_smoothed[0],all_tmin_avg[0],all_winter_dates[0],all_winter_extents[0],all_tmin_avg_smoothed[0]);
    }

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
        figure = d3.select("#timeseries1");
        
        margin = {top: 2, right: 50, bottom: 40, left: 50};

        // full width and height
        figwidth  = parseInt(figure.style("width"));
        figheight = 2+40+80*4;
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

        x = d3.scale.linear()
	    .domain([0,min_years])
	    .range([0,width]);

        tmin_raw_mins = Array();
        tmin_raw_good_years = Array();
        for (var i=0; i<min_years; i++) {
            if (winter_data_coverage[i] > .50) {
                var my_min = 100;
                for (var j=0; j<tmin_raw[i].length; j++) {
                    if (tmin_raw[i][j] < my_min && tmin_raw[i][j] > -9000) {
                        my_min = tmin_raw[i][j];
                    }
                }
                tmin_raw_mins.push(my_min)
                tmin_raw_good_years.push(i);
            }
        }
        tmax_raw_maxs = Array();
        tmax_raw_good_years = Array();
        for (var i=0; i<min_years; i++) {
            if (summer_data_coverage[i] > .50) {
                tmax_raw_maxs.push(d3.max(tmax_raw[i]));
                tmax_raw_good_years.push(i);
            }
        }
        
        y_T =  d3.scale.linear()
	    .domain([d3.min(tmin_raw_mins),d3.max(tmax_raw_maxs)])
            // .domain([0,d3.max(tmax_raw_maxs)])
            // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
	    .range([height-10, 10]);

        y_T_summer =  d3.scale.linear()
	    // .domain([d3.min(tmax_raw_maxs)-5,d3.max(tmax_raw_maxs)+2])
	    .domain([d3.min(all_tmax_avg_smoothed.map(function(d) { return d3.max(d); }))-5,d3.max(tmax_raw_maxs)+2])
            // .domain([0,d3.max(tmax_raw_maxs)])
            // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
	    .range([1*height/4,0*height/4]);

        y_T_winter =  d3.scale.linear()
	    .domain([d3.min(tmin_raw_mins)-5,d3.max(all_tmin_avg_smoothed.map(function(d) { return d3.min(d); }))+5])
            // .domain([0,d3.max(tmax_raw_maxs)])
            // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
	    .range([3*height/4, 2*height/4]);

        y_tele_summer = d3.scale.linear()
	    .domain([d3.min(flattened_summer_extents.map(function(d) { return d[1]; }))-5,d3.max(flattened_summer_extents.map(function(d) { return d[2]; }))+5])
            // .domain([0,d3.max(tmax_raw_maxs)])
            // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
            .range([2*height/4, 1*height/4]);
	    // .range([height-10, 10]);

        y_tele_winter = d3.scale.linear()
	    // .domain([100,200])
            .domain([d3.min(flattened_winter_extents.map(function(d) { return d[1]; }))-5,d3.max(flattened_winter_extents.map(function(d) { return d[2]; }))+2])
        // .domain([0,d3.max(tmax_raw_maxs)])
        // .domain([d3.min(tmin_raw_mins),d3.max(all_tmax_avg[0])])
            .range([4*height/4, 3*height/4]);

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
	        .scale(x)
	        .orient("bottom"); }

        // axis creation function
        var create_yAxis_T_summer = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_T_summer) //linear scale function
	        .orient("left"); }

        // draw the axes
        var yAxis_T_summer = create_yAxis_T_summer()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(0,0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_T_summer);

        // axis creation function
        var create_yAxis_T_winter = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_T_winter) //linear scale function
	        .orient("left"); }

        // draw the axes
        var yAxis_T_winter = create_yAxis_T_winter()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate(0,0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_T_winter);

        // axis creation function
        var create_yAxis_tele_summer = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_tele_summer) //linear scale function
	        .orient("right"); }

        // draw the axes
        var yAxis_tele_summer = create_yAxis_tele_summer()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate("+width+",0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_tele_summer);

        // axis creation function
        var create_yAxis_tele_winter = function() {
	    return d3.svg.axis()
	        .ticks(5)
            	.scale(y_tele_winter) //linear scale function
	        .orient("right"); }

        // draw the axes
        var yAxis_tele_winter = create_yAxis_tele_winter()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "y axis")
	    .attr("transform", "translate("+width+",0)")
	    .attr("font-size", "14.0px")
	    .call(yAxis_tele_winter);

        // draw the axes
        var xAxis = create_xAxis()
	    .innerTickSize(6)
	    .outerTickSize(0);

        axes.append("g")
	    .attr("class", "x axis ")
	    .attr("font-size", "14.0px")
	    .attr("transform", "translate(0," + (height) + ")")
	    .call(xAxis);

        d3.selectAll(".tick line").style("stroke","black");

        d3.selectAll(".tick text").style("font-size",10);    

        var xlabel_text = "Years";
        var xlabel = canvas.append("text")
	    .text(xlabel_text)
	    .attr("class","axes-text")
	    .attr("x",margin.left+width/2)  
	    .attr("y",figheight-5)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("style", "text-anchor: middle;");

        
        var ylabel_text = "Temperature";
        var ylabel = canvas.append("text")
	    .text(ylabel_text)
	    .attr("class","axes-text")
	    .attr("x",18)
	    .attr("y",height/2)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("transform", "rotate(-90.0," + (18) + "," + (height/2) + ")");
        
        var ylabel_text = "Day of Year";
        var ylabel = canvas.append("text")
	    .text(ylabel_text)
	    .attr("class","axes-text")
	    .attr("x",width+margin.right+margin.left-15)
	    .attr("y",height/2)
	    .attr("font-size", "15.0px")
	    .attr("fill", "#000000")
	    .attr("transform", "rotate(90.0," + (width+margin.right+margin.left-15) + "," + (height/2) + ")");

        line_T = d3.svg.line()
	    .x(function(d,i) { return x(i+local_window); })
	    .y(function(d) { return y_T(d); })
	    .interpolate("linear"); // cardinal

        line_T_summer = d3.svg.line()
	    .x(function(d,i) { return x(i+local_window); })
	    .y(function(d) { return y_T_summer(d); })
	    .interpolate("linear"); // cardinal

        line_T_winter = d3.svg.line()
	    .x(function(d,i) { return x(i+local_window); })
	    .y(function(d) { return y_T_winter(d); })
	    .interpolate("linear"); // cardinal

        line_T_raw = d3.svg.line()
	    .x(function(d,i) { return x(i); })
	    .y(function(d) { return y_T(d); })
	    .interpolate("linear"); // cardinal

        line_T_raw_summer = d3.svg.line()
	    .x(function(d,i) { return x(i); })
	    .y(function(d) { return y_T_summer(d); })
	    .interpolate("linear"); // cardinal

        line_T_raw_summer = d3.svg.line()
	    .x(function(d,i) { return x(i); })
	    .y(function(d) { return y_T_summer(d); })
	    .interpolate("linear"); // cardinal

        // var summer_teletherm_extent_extended = Array(summer_teletherm_extent.length);
        // for (var i=0; i<summer_teletherm_extent.length; i++) {
        //     summer_teletherm_extent_extended[i] = [summer_teletherm_extent[i][0]];
        //     while ((summer_teletherm_extent_extended[i][summer_teletherm_extent_extended[i].length-1]) < summer_teletherm_extent[i][1]) { summer_teletherm_extent_extended[i].push(summer_teletherm_extent_extended[i][summer_teletherm_extent_extended[i].length-1]+1);  }
        // }

        // var winter_teletherm_extent_extended = Array(winter_teletherm_extent.length);
        // for (var i=0; i<winter_teletherm_extent.length; i++) {
        //     winter_teletherm_extent_extended[i] = [winter_teletherm_extent[i][0]];
        //     while ((winter_teletherm_extent_extended[i][winter_teletherm_extent_extended[i].length-1]) < winter_teletherm_extent[i][1]) { winter_teletherm_extent_extended[i].push(winter_teletherm_extent_extended[i][winter_teletherm_extent_extended[i].length-1]+1);  }
        // }

        axes.append("path")
            .datum(all_tmax_avg.map(function(d) { return d3.max(d); }))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_T_summer)
            .attr("stroke","red")
            .attr("stroke-width",1)
            .attr("stroke-dasharray","10,10")
            .attr("fill","none");

        axes.append("path")
            .datum(all_tmax_avg_smoothed.map(function(d) { return d3.max(d); }))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_T_summer)
            .attr("stroke","red")
            .attr("stroke-width",2)
            .attr("fill","none");


        axes.selectAll("circle.tmax_raw")
            .data(tmax_raw_maxs)
            .enter()
            .append("circle")
            .attr({"class": "tmaxsmoothed",
                   "cx": function(d,i) { return x(tmax_raw_good_years[i]); },
                   "cy": function(d) { return y_T_summer(d); },
                   "r": 2,
                   "fill": "red",});

        axes.selectAll("line.tmax_raw")
            .data(flattened_summer_extents)
            .enter()
            .append("line")
	    .attr({ "x1": function(d) { return x(d[0]+local_window); },
		    "y1": function(d) { return y_tele_summer(d[1]); },
		    "x2": function(d) { return x(d[0]+local_window); },
                    "y2": function(d) { return y_tele_summer(d[2]); },
                    "class": "summerteleline",
	          })
            .style({
                "stroke": "#C0C0C0",
                "stroke-width": 4,
            });

        axes.selectAll("line.tmax_raw")
            .data(flattened_winter_extents)
            .enter()
            .append("line")
	    .attr({ "x1": function(d) { return x(d[0]+local_window); },
		    "y1": function(d) { return y_tele_winter(d[1]); },
		    "x2": function(d) { return x(d[0]+local_window); },
                    "y2": function(d) { return y_tele_winter(d[2]); },
                    "class": "summerteleline",
	          })
            .style({
                "stroke": "#C0C0C0",
                "stroke-width": 4,
            });

        axes.selectAll("rect.tmax_raw")
            .data(all_summer_dates)
            .enter()
            .append("rect")
	    .attr({ "x": function(d,i) { return x(i+local_window)-3; },
		    "y": function(d) { return y_tele_summer(d); },
		    "width": 6,
                    "height": 6,
                    "class": "summerteleline",
	          })
            .style({
                "fill": "darkgrey",
                // "stroke": "#C0C0C0",
                // "stroke-width": 4,
            });

        axes.selectAll("rect.tmax_raw")
            .data(all_winter_dates)
            .enter()
            .append("rect")
	    .attr({ "x": function(d,i) { return x(i+local_window)-3; },
		    "y": function(d) { return y_tele_winter(d); },
		    "width": 6,
                    "height": 6,
                    "class": "summerteleline",
	          })
            .style({
                "fill": "darkgrey",
                // "stroke": "#C0C0C0",
                // "stroke-width": 4,
            });
        
        axes.selectAll("circle.tmax_raw")
            .data(tmin_raw_mins)
            .enter()
            .append("circle")
            .attr({"class": "tmaxsmoothed",
                   "cx": function(d,i) { return x(tmin_raw_good_years[i]); },
                   "cy": function(d) { return y_T_winter(d); },
                   "r": 2,
                   "fill": "blue",});
        
        axes.append("path")
            .datum(all_tmin_avg.map(function(d) { return d3.min(d); }))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_T_winter)
            .attr("stroke","blue")
            .attr("stroke-width",1)
            .attr("stroke-dasharray","10,10")
            .attr("fill","none");

        axes.append("path")
            .datum(all_tmin_avg_smoothed.map(function(d) { return d3.min(d); }))
            .attr("class", "tmaxsmoothed")
            .attr("d", line_T_winter)
            .attr("stroke","blue")
            .attr("stroke-width",2)
            .attr("fill","none");

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

    // updatewindow = function(t) {
    //     console.log("updating the top window slider");
    //     console.log(yearIndex);
    //     // curr_window.transition().duration(t).attr("x",x(full_year_range[yearIndex]));
    //     curr_window.transition().attr("x",x(full_year_range[yearIndex]))
    //         .attr("width",x(parseFloat(currentWindow)+full_year_range[0])-x(full_year_range[0]));
    // }
    
    // move the screen down to this
    // document.getElementById('station1').focus();
    // $("html, body").animate({ scrollTop: $("#station1").offset().top }, 900);
    // $.scrollTo($('#station1').offset().top);
}

