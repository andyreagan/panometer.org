// make the plot
function plotBarChart(figure,data,geodata) {
    // console.log(data);
    /* plot the bar chart

       -take a d3 selection, and draw the bar chart SVG on it
       -requires the magnitude for each state, and the geojson
           with the names

    */
    var margin = {top: 0, right: 0, bottom: 40, left: 60};
    var figwidth = parseInt(d3.select('#bars01').style('width'));
    var aspectRatio = 2.0;
    // var figheight = parseInt(d3.select('#bars01').style('width'))*aspectRatio - margin.top - margin.bottom;
    var figheight = 230;
    var width = figwidth-margin.left-margin.right;
    var height = figheight-margin.top-margin.bottom;
    // center vertically
    var figcenter = height/2;
    var textSize = 12;
    var barHeight = 18;

    data = data.map(function(d) { return d-d3.mean(data); });

    // console.log(geodata);

    // do the sorting
    indices = Array(data.length);
    for (var i = 0; i < data.length; i++) { indices[i] = i; }
    // sort by abs magnitude
    // indices.sort(function(a,b) { return Math.abs(data[a]) < Math.abs(data[b]) ? 1 : Math.abs(data[a]) > Math.abs(data[b]) ? -1 : 0; });
    // sort by magnitude, parity preserving
    indices.sort(function(a,b) { return data[a] < data[b] ? 1 : data[a] > data[b] ? -1 : 0; });
    
    // global
    // var sortedStates;
    sortedStates = Array(data.length);
    stateRanks = Array(data.length);
    for (var i = 0; i < data.length; i++) {
	sortedStates[i] = [i,indices[i],geodata[indices[i]].properties.name,data[indices[i]]];
	stateRanks[indices[i]] = i;
    }
    // console.log(sortedStates);

    // remove an old figure if it exists
    figure.select(".canvas").remove();

    var canvas = figure.append("svg")
    	.attr("id","barsvg")
	.attr("width",figwidth)
	.attr("height",figheight)
	.attr("class","canvas")

    // x scale, maps all the data to 
    x = d3.scale.linear()
	.domain([data.length,1])
	.range([width-20, 5]); 

    // linear scale function
    var absDataMax = d3.max([d3.max(data),-d3.min(data)]);
    var y =  d3.scale.linear()
    	// .domain([-absDataMax,absDataMax])
        .domain([absDataMax,-absDataMax])
	.range([5,height-10]);
    

    // // zoom object for the axes
    // var zoom = d3.behavior.zoom()
    // 	.y(y) // pass linear scale function
    //     // .translate([10,10])
    // 	.scaleExtent([1,1])
    // 	.on("zoom",zoomed);

    // create the axes themselves
    var axes = canvas.append("g")
	.attr("transform", "translate(" + (margin.left) + "," +
	      (margin.top) + ")")
	.attr("width", width)
	.attr("height", height)
	.attr("class", "main");
	// .call(zoom);

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
	    .ticks(20)
	    .scale(x)
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
	.attr("class", "y axis ")
	.attr("font-size", "12.0px")
	.attr("transform", "translate(0,0)")
	.call(yAxis);

    var xAxis = create_xAxis()
	.innerTickSize(6)
	.outerTickSize(0);

    axes.append("g")
	.attr("class", "x axis ")
	.attr("font-size", "12.0px")
	.attr("transform", "translate(0," + (height) + ")")
	.call(xAxis);

    d3.selectAll(".tick line").style({'stroke':'black'});

    // create the clip boundary
    // var clip = axes.append("svg:clipPath")
    // 	.attr("id","clip")
    // 	.append("svg:rect")
    // 	.attr("x",0)
    // 	.attr("y",0)
    // 	.attr("width",width)
    // 	.attr("height",height);

    // // now something else
    // var unclipped_axes = axes;

    // axes = axes.append("g")
    // 	.attr("clip-path","url(#clip)");

    var ylabel = canvas.append("text")
	.text("Caloric Balance")
	.attr("class","axes-text")
	.attr("x",(figwidth-width)/4)
	.attr("y",figheight/2+30)
	.attr("font-size", "16.0px")
	.attr("fill", "#000000")
	.attr("transform", "rotate(-90.0," + (figwidth-width)/4 + "," + (figheight/2+30) + ")");

    var xlabel = canvas.append("text")
	.text("State Rank")
	.attr("class","axes-text")
	.attr("x",width/2+(figwidth-width)/2)
	.attr("y",3*(figheight-height)/4+height)
	.attr("font-size", "16.0px")
	.attr("fill", "#000000")
	.attr("style", "text-anchor: middle;");

    var qcolor = d3.scale.quantize()
	.domain(d3.extent(data))
	// .range([0,1,2,3,4,5,6,7,8]);
	.range(["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b",]);

    axes.selectAll("rect.staterect")
	.data(sortedStates)
	.enter()
	.append("rect")
	// .attr("fill", function(d,i) { if (data[3]>0) {return color(data[3]);} else {return color(d[3]); } })
    // .attr("class", function(d,i) { return d[2][0]+d[2].split(" ")[d[2].split(" ").length-1]+" staterect "+"q9-"+qcolor(d[3]); })
	.attr("class", function(d,i) { return d[2][0]+d[2].split(" ")[d[2].split(" ").length-1]+" staterect "; })
    	.attr("fill",function(d,i) { return qcolor(d[3]); })
	.attr("y", function(d,i) { if (d[3]<0) { return figcenter; } else { return y(d[3]); } })
	.attr("x", function(d,i) { return x(i+1); })
	.style({'opacity':'0.7','stroke-width':'1','stroke':'rgb(0,0,0)'})
	.attr("width",function(d,i) { return barHeight; } )
	.attr("height",function(d,i) { if (d[3]<0) {return d3.max([y(d[3])-figcenter,0.01]);} else {return d3.max([figcenter-y(d[3]),0.01]); } } )
	.on('mouseover', function(d,i){
            var rectSelection = d3.select(this).style({opacity:'1.0'});
	    state_hover(d,i);
	})
	.on('mouseout', function(d){
            var rectSelection = d3.select(this).style({opacity:'0.7'});
	    state_unhover(d,i);
	});

    axes.selectAll("text.statetext")
	.data(sortedStates)
	.enter()
	.append("text")
	.attr("class", function(d,i) { return d[2]+""; })
        .attr("y", function(d,i) { if (d[3]<0) { return figcenter-6; } else { return figcenter+6; } })
	.attr("x",function(d,i) { return x(i+1)+3; } )
	.attr("transform", function(d,i) { return "rotate(46 "+(x(i+1)+3)+","+(figcenter+Math.abs(d[3])/d[3]*6)+")"; })
	.style({"text-anchor": function(d,i) { if (d[3]>0) { return "start";} else { return "end";}},
		"font-size": textSize,
	       })
        .text(function(d,i) { return (i+1)+". "+d[2]; })
    	.on('mouseover', function(d,i){
	    state_hover(d,i);
	});

    // d3.select(window).on("resize.shiftplot",resizeshift);
    
    // function resizeshift() {
    // 	figwidth = parseInt(d3.select("#shift01").style('width')) - margin.left - margin.right,
    // 	width = .775*figwidth
    // 	figcenter = width/2;

    // 	canvas.attr("width",figwidth);

    // 	x.range([(sortedWords[0].length+3)*9, width-(sortedWords[0].length+3)*9]);
    // 	topScale.range([width*.1,width*.9]);

    // 	bgrect.attr("width",width);
    // 	//axes.attr("transform", "translate(" + (0.125 * figwidth) + "," +
    // 	//      ((1 - 0.125 - 0.775) * figheight) + ")");
	
    // 	// mainline.attr("d",line);

    // 	// fix the x axis
    // 	canvas.select(".x.axis").call(xAxis);

    // 	clip.attr("width",width);

    // 	// get the x label
    // 	xlabel.attr("x",(margin.left+width/2));

    // 	// the andy reagan credit
    // 	credit.attr("x",width-7);

    // 	// line separating summary
    // 	sepline.attr("x2",width);

    // 	// all of the lower shift text
    // 	axes.selectAll("text.shifttext").attr("x",function(d,i) { if (d>0) {return x(d)+2;} else {return x(d)-2; } } );
    // }

    function state_hover(d,i) { 
	// console.log("from the bar chart:");
	// console.log(sortedStates[i]);

	// console.log(d3.extent(data));
	
	d3.selectAll("rect.staterect")
    	    .attr("fill",function(d,i) { return qcolor(d[3]); });

	d3.selectAll("path.state")
	    .attr("fill",function(d,i) { return qcolor(data[i]); });

	// d3.select(this).attr("fill","red");
	// console.log("."+d[2][0]+d[2].split(" ")[d[2].split(" ").length-1]);
	d3.selectAll("."+d[2][0]+d[2].split(" ")[d[2].split(" ").length-1]).attr("fill","red");

	shiftComp = sortedStates[i][1];
	shiftCompName = sortedStates[i][2];
	state_encoder.varval(sorted_state_json[shiftComp].properties.abbr);	

	if (shiftCompName === "District of Columbia") {
	    shiftCompName = "DC";
	}
	// console.log(shiftCompName);
	
	my_food_shifter._refF(allUSfood);
	my_food_shifter._compF(stateFood.map(function(d) { return parseFloat(d[shiftComp]); }));
	my_food_shifter.shifter();
	var refH = my_food_shifter._refH();
	var compH = my_food_shifter._compH();
	if (compH >= refH) {
	    var happysad = " consumes more calories on average:";
	}
	else { 
	    var happysad = " consumes less calories on average:";
	}	
	var sumtextarray = ["","",""];
	sumtextarray[0] = function() {
	    if (Math.abs(refH-compH) < 0.01) {
		return "How the food phrases of the whole US and "+shiftCompName+" differ";
	    }
	    else {
		return "Why "+shiftCompName+happysad;
	    }
	}();
	sumtextarray[1] = function() {
	    return "Average US calories = " + (refH.toFixed(2));
	}();
	sumtextarray[2] = function() {
	    return shiftCompName+" calories = " + (compH.toFixed(2)) + " (Rank " + (foodRanks[shiftComp]+1) + " out of 49)";
	}();
	
	my_food_shifter.setText(sumtextarray);
	my_food_shifter.replot();

	my_activity_shifter._refF(allUSact);
	my_activity_shifter._compF(stateAct.map(function(d) { return parseFloat(d[shiftComp]); }));
	my_activity_shifter.shifter();
	var refH = my_activity_shifter._refH();
	var compH = my_activity_shifter._compH();
	if (compH >= refH) {
	    var happysad = " expends more calories on average:";
	}
	else {
	    var happysad = " expends fewer calories on average:";
	}
	var sumtextarray = ["","",""];
	sumtextarray[0] = function() {
	    if (Math.abs(refH-compH) < 0.01) {
		return "How the activity phrases of the whole US and "+shiftCompName+" differ";
	    }
	    else {
		return "Why "+shiftCompName+happysad;		
	    }
	}();
	sumtextarray[1] = function() {
	    return "Average US caloric expenditure = " + (refH.toFixed(2));
	}();
	sumtextarray[2] = function() {
	    return shiftCompName+" caloric expenditure = " + (compH.toFixed(2)) + " (Rank " + (activityRanks[shiftComp]+1) + " out of 49)";
	}();
	// my_activity_shifter.setWidth(modalwidth);
	my_activity_shifter.setText(sumtextarray);
	my_activity_shifter.replot();
    }

    function state_unhover(d,i) { 
	// var statecolor = qcolor(d[3]);
	// d3.selectAll("."+d[2][0]+d[2].split(" ")[d[2].split(" ").length-1]).attr("fill",function(d,i) { return statecolor; });
    }
};









