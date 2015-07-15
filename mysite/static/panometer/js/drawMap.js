function drawMap(figure,data,sorted_json) {
    /* 
       plot the state map!

       drawMap(figure,geoJson,stateHapps);
         -figure is a d3 selection
         -geoJson is the loaded us-states file
         -stateHapps is the loaded csv (state,val)
    */

    //Width and height
    var w = parseInt(d3.select('#map01').style('width'));
    var h = w*.9;

    // mean 0 the data
    data = data.map(function(d) { return d-d3.mean(data); });

    // //Define map projection
    // var projection = d3.geo.albersUsa()
    // 	.translate([w/2, h/2])
    // 	.scale(w*1.3);

    var projection = d3.geo.equirectangular()
    // .translate([.01,0])
    // these work for col-sm-5
    // .center([-87,38])
    // .scale(1650);
    	.center([-84.7,36.6])
    	.scale(1560);

    //Define path generator
    var path = d3.geo.path()
	.projection(projection);

    var numColors = 100,
        hueRange = [240,60], // in degrees
        // see http://hslpicker.com/#ffd900
        saturation = 1, // full
        lightness = 0.5; // half
    var colors = Array(numColors);
    var colorStrings = Array(numColors);
    for (i = 0; i<numColors; i++) {
	colors[i] = hslToRgb((hueRange[0]+(hueRange[1]-hueRange[0])/(numColors-1)*i)/360, saturation, lightness);
	colorStrings[i] = "rgb(" + colors[i][0] + "," + colors[i][1] + "," + colors[i][2] + ")"
    }
    // console.log(colors);
    // console.log(colorStrings);
    
    //Define quantize scale to sort data values into buckets of color
    color = d3.scale.quantize()
	//.range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
        .range(colorStrings)
	.domain([d3.min(data),d3.max(data)]);
    //Colors taken from colorbrewer.js, included in the D3 download

    // remove an old figure if it exists
    figure.select(".canvas").remove();

    //Create SVG element
    var canvas = figure
	.append("svg")
    	.attr("id","mapsvg")    
	.attr("class", "canvas")
	.attr("width", w)
	.attr("height", h);

    //Bind data and create one path per GeoJSON feature
    var states = canvas.selectAll("path")
	.data(sorted_json);

    var state_text = canvas.selectAll("text")
	.data(sorted_json);

    var qcolor = d3.scale.quantize()
	.domain(d3.extent(data))
	// .range([0,1,2,3,4,5,6,7,8]);
	.range(["#f7fcf5","#e5f5e0","#c7e9c0","#a1d99b","#74c476","#41ab5d","#238b45","#006d2c","#00441b",]);
    
    states.enter()
	.append("path")
	.attr("d", function(d,i) { return path(d.geometry); } )
	.attr("id", function(d,i) { return d.properties.name; } )
    // .attr("class",function(d,i) { return "state map "+d.properties.name[0]+d.properties.name.split(" ")[d.properties.name.split(" ").length-1]+" q9-"+qcolor(data[i]); } )
	.attr("class",function(d,i) { return "state map "+d.properties.name[0]+d.properties.name.split(" ")[d.properties.name.split(" ").length-1]; } )
	.attr("fill",function(d,i) { return qcolor(data[i]); })
        //.on("mousedown",state_clicked)
        //.on("mouseover",function(d,i) { console.log(d.properties.name); } );
	.on("mouseover",state_hover)
        .on("mouseout",state_unhover);

    states.exit().remove();

    states
	.attr("stroke","black")
	.attr("stroke-width","1");


    state_text.enter()
	.append("text")
    // .attr("transform", function(d,i) { return "translate("+(path.centroid(d.geometry)[0]-9)+","+(path.centroid(d.geometry)[1]+5)+")"; } )
	.attr("x", function(d,i) { return path.centroid(d.geometry)[0]; })
    	.attr("y", function(d,i) { return path.centroid(d.geometry)[1]; })
	.style({
	    "text-anchor": "middle",
	    "dominant-baseline": "middle",
	})
	.attr("class","statetext")
	.text(function(d,i) { return d.properties.abbr; } )
    	.on("mouseover",state_hover)
        .on("mouseout",state_unhover);

    function state_clicked(d,i) { 
	// next line verifies that the data and json line up
	// console.log(d.properties.name); console.log(allData[i].name); 

	// toggle the reference
	if (shiftRef !== i) {
	    //console.log("reference "+allData[i].name);
	    shiftRef = i;
	    d3.selectAll(".state").attr("stroke","none");
	    d3.selectAll(".state."+allData[i].name[0]+allData[i].name.split(" ")[allData[i].name.split(" ").length-1]).attr("stroke","black")
	        .attr("stroke-width",3);
	}
	else { 
	    //console.log("reference everything");
	    shiftRef = 51;
	    d3.selectAll(".state").attr("stroke","none");
	        //.attr("stroke-width",3);
	}
	
	if (shiftRef !== shiftComp) {
	    shiftObj = shift(allData[shiftRef].freq,allData[shiftComp].freq,lens,words);
	    plotShift(d3.select('#shift01'),shiftObj.sortedMag.slice(0,200),
		      shiftObj.sortedType.slice(0,200),
		      shiftObj.sortedWords.slice(0,200),
		      shiftObj.sumTypes,
		      shiftObj.refH,
		      shiftObj.compH,shift_height);
	}
    }

    function state_hover(d,i) {
	// console.log("from the map:");
	// console.log(i);

	d3.selectAll("rect.staterect")
    	    .attr("fill",function(d,i) { return qcolor(d[3]); });

	canvas.selectAll("path.state")
	    .attr("fill",function(d,i) { return qcolor(data[i]); });

	d3.selectAll("."+d.properties.name[0]+d.properties.name.split(" ")[d.properties.name.split(" ").length-1]).attr("fill","red");
	
	// d3.select(this).attr("fill","red");

	state_encoder.varval(i.toFixed(0));
	// shiftCompName = sortedStates[i][2];
	shiftComp = i;
	shiftCompName = d.properties.name;

	if (shiftCompName === "District of Columbia") {
	    shiftCompName = "DC";
	}
	// console.log(shiftCompName);
	
	hedotools.shifter._refF(allUSfood);
	hedotools.shifter._compF(stateFood.map(function(d) { return parseFloat(d[shiftComp]); }));
	hedotools.shifter.shifter();
	var refH = hedotools.shifter._refH();
	var compH = hedotools.shifter._compH();
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
	
	hedotools.shifter.setText(sumtextarray);
	hedotools.shifter.replot();

	hedotools.shifterTwo._refF(allUSact);
	hedotools.shifterTwo._compF(stateAct.map(function(d) { return parseFloat(d[shiftComp]); }));
	hedotools.shifterTwo.shifter();
	var refH = hedotools.shifterTwo._refH();
	var compH = hedotools.shifterTwo._compH();
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
	// hedotools.shifterTwo.setWidth(modalwidth);
	hedotools.shifterTwo.setText(sumtextarray);
	hedotools.shifterTwo.replot();
    }

    function state_unhover(d,i) { 
	// next line verifies that the data and json line up
	// console.log(d.properties.name); console.log(allData[i].name.split(" ")[allData[i].name.split(" ").length-1]); 
	shiftComp = i;
	// console.log(".state.list."+allData[i].name[0]+allData[i].name.split(" ")[allData[i].name.split(" ").length-1]);
	// d3.selectAll(".state.list."+allData[i].name[0]+allData[i].name.split(" ")[allData[i].name.split(" ").length-1])
	//     .attr("fill",color(allData[i].avhapps));

	// console.log(qcolor(data[i]))
	// var statecolor = qcolor(data[i]);
	// console.log(statecolor);
	// d3.selectAll("."+d.properties.name[0]+d.properties.name.split(" ")[d.properties.name.split(" ").length-1]).attr("fill",function(d,i) { return statecolor; });
	
	// d3.select(this)
        //  .attr("fill", function() {
    	//      return qcolor(data[i]);
    	// });
    }

};


/*
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h, s, l){
    var r, g, b;

    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}






