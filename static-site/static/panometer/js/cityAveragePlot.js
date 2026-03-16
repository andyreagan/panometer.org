// two functions, smooth_timeries_gaussian and cityPlot
//
// smooth_timeseries_gaussian is used by cityPlot to take the raw data
// and average it
//
// cityPlot takes the raw data load, a total of 4 files, and uses the year stored in yearIndex
// and parseInt(windowDecoder().cached) (the number of years) to add up the data

var cityNYTPlot = function(tmax_avg,summer_teletherm_date,summer_teletherm_extent,tmax_smoothed_js,tmin_avg,winter_teletherm_date,winter_teletherm_extent,tmin_smoothed_js,div) {
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
    
    var plot = function() {
        // globals that this function needs:
        // tmin_avg,tmax_avg,summer_teletherm_extent,winter_teletherm_extent,tmax_smoothed_js,tmin_smoothed_js,summer_teletherm_date,winter_teletherm_date

        figure = d3.select(div);
        
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
    plot();

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
    // $("html, body").animate({ scrollTop: $("#station1").offset().top }, 900);
    // $.scrollTo($('#station1').offset().top);
}


var cityNYTCirclePlot = function(tmax_avg,summer_teletherm_date,summer_teletherm_extent,tmax_smoothed_js,tmin_avg,winter_teletherm_date,winter_teletherm_extent,tmin_smoothed_js,div) {
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
    
    var plot = function() {
        // globals that this function needs:
        // tmin_avg,tmax_avg,summer_teletherm_extent,winter_teletherm_extent,tmax_smoothed_js,tmin_smoothed_js,summer_teletherm_date,winter_teletherm_date

        figure = d3.select(div);
        
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
	    .domain([1,365])
            // .domain([1,365+181])
	    // .range([0,width]);
            .range([-2*Math.PI,0]);

        x_min = d3.scale.linear()
	    .domain([1-181,365-181])
	    .range([-2*Math.PI,0]);
        
        y =  d3.scale.linear()
	// .domain([-30,130]) // summer temps
	    .domain([d3.min(tmin_avg),d3.max(tmax_avg)])
	    .range([40,height/2+40]);

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
	    .x(function(d,i) {
                // console.log(x_max(i+1));
                // console.log(y(d)*Math.cos(x_max(i+1)));
                return y(d)*Math.cos(x_max(i+1))+width/2;
            })
	       .y(function(d,i) { return height/2+y(d)*Math.sin(x_max(i+1)); })
	    .interpolate("linear"); // cardinal

        

        line_min = d3.svg.line()
	    .x(function(d,i) { return width/2+y(d)*Math.cos(x_min(i+1)); })
	    .y(function(d,i) { return y(d)*Math.sin(x_min(i+1))+height/2; })
	    .interpolate("linear"); // cardinal    

        area_max = d3.svg.area()
	    .x(function(d,i) { return x_max(d+1); })
	    .y0(function(d) { return height; })
	    .y1(function(d) { return y(tmax_smoothed_js[d]); })    
	    .interpolate("linear"); // cardinal

        area_min = d3.svg.area()
            .x0(function(d,i) { return width/2; })
	    .x1(function(d,i) { return width/2+y(tmin_smoothed_js[d])*Math.cos(x_min(d+1)); })
	    .y0(function(d,i) { return height/2; })
	    .y1(function(d,i) { return height/2+y(tmin_smoothed_js[d])*Math.sin(x_min(d+1)); })
	    .interpolate("linear"); // cardinal

        area_max = d3.svg.area()
            .x0(function(d,i) { return width/2; })
	    .x1(function(d,i) { return width/2+y(tmax_smoothed_js[d])*Math.cos(x_max(d+1)); })
	    .y0(function(d,i) { return height/2; })
	    .y1(function(d,i) { return height/2+y(tmax_smoothed_js[d])*Math.sin(x_max(d+1)); })
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
            // .datum([].concat(tmax_smoothed_js,tmax_smoothed_js.slice(0,181)))
            .datum(tmax_smoothed_js)        
            .attr("class", "tmaxsmoothed")
            .attr("d", line_max)
            .attr("stroke","red")
            .attr("stroke-width",2)
            .attr("fill","none");

        axes.append("path")
            .datum(tmin_smoothed_js)
            .attr("class", "tminsmoothed")
            .attr("d", line_min)
            .attr("stroke","blue")
            .attr("stroke-width",2)
            .attr("fill","none");

        axes.append("circle")
	    .attr({ "cx": function(d,i) { return width/2; },
		    "cy": function(d,i) { return height/2; },
		    "r": 5,
                    "class": "centercircle",
	          });
        
        axes.selectAll("circle.avgmaxtemp")
	    .data(tmax_avg)
	    .enter()
	    .append("circle")
	    .attr({ "cx": function(d,i) { return y(d)*Math.cos(x_max(i+1))+width/2; },
		    "cy": function(d,i) { return y(d)*Math.sin(x_max(i+1))+height/2; },
		    "r": 2,
                    "class": "avgmaxtemp",
	          });

        axes.selectAll("circle.avgmintemp")
	    .data(tmin_avg)
	    .enter()
	    .append("circle")
	    .attr({ "cx": function(d,i) { return y(d)*Math.cos(x_min(i+1))+width/2; },
		    "cy": function(d,i) { return y(d)*Math.sin(x_min(i+1))+height/2; },        
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
    plot();

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
    // $("html, body").animate({ scrollTop: $("#station1").offset().top }, 900);
    // $.scrollTo($('#station1').offset().top);
}

