var shift_height = 450;
var num_shift_words = 24;
var rectHeight = 11;
var sumRectHeight = 15;

var state_encoder = d3.urllib.encoder().varname("state");
var state_decoder = d3.urllib.decoder().varname("state");
var year_encoder = d3.urllib.encoder().varname("year").varval("2012");
var view_decoder = d3.urllib.encoder().varname("view").varval("dashboard");
var region_decoder = d3.urllib.encoder().varname("region").varval("contiguousUS");
var people_decoder = d3.urllib.encoder().varname("users").varval("all");

function stateLookup(name) {
    // given a state name, return the ID
    var ID = -1;
    for (var i=0; i<sorted_state_json.length; i++) {
	if ( name === sorted_state_json[i].properties.abbr ) {
	    ID = i;
	    break;
	}
    }
    return ID;
}

var my_food_shifter;
var my_activity_shifter;

function initializePlot() {
    // line up the state flux with the map
    //
    // first, create a json so I can lookup the values for each state
    state_json_json = {};
    for (var i=0; i<49; i++) {
	state_json_json[stateFeatures[i].properties.name] = stateFeatures[i];
    }
    // save the sorted values in this
    sorted_state_json = Array(49);
    // loop through the map titles, and add them in that order to the above array
    for (var i=0; i<49; i++) {
	sorted_state_json[i] = state_json_json[stateFlux[i][0]];
    }

    var rand_state_id = Math.floor(Math.random() * 49);
    state_decoder.varresult(sorted_state_json[rand_state_id].properties.abbr);

    // make this the new one
    // stateFeatures = sorted_state_json;
    
    plotBarChart(d3.select("#bars01"),stateFlux.map(function(d) { return d[1]; }),sorted_state_json);
    // drap the map
    drawMap(d3.select("#map01"),stateFlux.map(function(d) { return d[1]; }),sorted_state_json,true,[-84.1,36.6],1500);
    allUSfood = stateFood.map(function(d) { return d3.sum(d); });
    allUSact = stateAct.map(function(d) { return d3.sum(d); });

    i = stateLookup(state_decoder().cached);
    shiftComp = i;
    // console.log(i);
    shiftCompName = sorted_state_json[i].properties.name;
    
    d3.selectAll("."+shiftCompName[0]+shiftCompName.split(" ")[shiftCompName.split(" ").length-1]).attr("fill","red");
    
    if (shiftCompName === "District of Columbia") {
	shiftCompName = "DC";
    }
    // console.log(shiftCompName);

    my_food_shifter = hedotools.shifter();
    my_food_shifter._my_shift_id("foodshift");
    // my_food_shifter.setFontSizes([10,10,16,10,8,8,13]);
    my_food_shifter._words(foodNames);
    my_food_shifter._lens(foodCals);
    my_food_shifter._refF(allUSfood);
    // computeFoodRanks()    
    foodRanks = [38, 10, 36, 21, 1, 24, 16, 3, 8, 14, 22, 15, 41, 42, 39, 43, 35, 0, 6, 11, 34, 5, 33, 9, 44, 32, 7, 2, 30, 31, 12, 29, 46, 45, 40, 13, 27, 18, 26, 48, 20, 37, 25, 28, 17, 19, 47, 4, 23];
    my_food_shifter.setfigure(d3.select("#shift01"));
    my_food_shifter._split_top_strings(false);
    my_food_shifter._compF(stateFood.map(function(d) { return parseFloat(d[shiftComp]); }));
    my_food_shifter.setTextBold(1);
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
    // console.log(sumtextarray);
    my_food_shifter._xlabel_text("Per food phrase caloric shift");
    my_food_shifter._ylabel_text("Food rank");
    my_food_shifter.show_x_axis(true);
    my_food_shifter.plot();

    my_activity_shifter = hedotools.shifter();
    my_activity_shifter._my_shift_id("activityshift");
    // my_activity_shifter.setFontSizes([16,10,16,10,8,8,13]);
    my_activity_shifter._words(actNames);
    my_activity_shifter._lens(actCals);
    my_activity_shifter._refF(allUSact);
    // computeActivityRanks();
    activityRanks = [43, 17, 45, 9, 1, 32, 46, 28, 25, 42, 18, 30, 26, 8, 21, 36, 47, 13, 44, 23, 41, 7, 48, 27, 4, 11, 24, 14, 35, 16, 10, 38, 15, 31, 19, 5, 33, 22, 39, 6, 37, 34, 3, 2, 29, 12, 40, 20, 0];
    my_activity_shifter._split_top_strings(false);
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
    my_activity_shifter.setTextBold(1);
    // my_activity_shifter.setWidth(modalwidth);
    my_activity_shifter.setText(sumtextarray);
    my_activity_shifter._xlabel_text("Per activity phrase caloric expenditure shift");
    my_activity_shifter._ylabel_text("Activity rank");
    my_activity_shifter.show_x_axis(true);    
    my_activity_shifter.setfigure(d3.select("#shift02"));
    my_activity_shifter.plot();
};

function computeFoodRanks() {
    foodScores = Array(49);
    for (var shiftComp=0; shiftComp<49; shiftComp++) {
	my_food_shifter._compF(stateFood.map(function(d) { return parseFloat(d[shiftComp]); }));
	my_food_shifter.shifter();
	var compH = my_food_shifter._compH();
	foodScores[shiftComp] = compH;
    }
    // do the sorting
    indices = Array(foodScores.length);
    for (var i = 0; i < foodScores.length; i++) { indices[i] = i; }
    indices.sort(function(a,b) { return foodScores[b] < foodScores[a] ? 1 : foodScores[b] > foodScores[a] ? -1 : 0; });

    foodRanks = Array(foodScores.length);
    for (var i = 0; i < foodScores.length; i++) {
	foodRanks[indices[i]] = i;
    }
    // return foodRanks;
}

function computeActivityRanks() {
    activityScores = Array(49);
    for (var shiftComp=0; shiftComp<49; shiftComp++) {
	my_activity_shifter._compF(stateAct.map(function(d) { return parseFloat(d[shiftComp]); }));	
	my_activity_shifter.shifter();
	var compH = my_activity_shifter._compH();
	activityScores[shiftComp] = compH;
    }

    // do the sorting
    indices = Array(activityScores.length);
    for (var i = 0; i < activityScores.length; i++) { indices[i] = i; }
    indices.sort(function(a,b) { return activityScores[a] < activityScores[b] ? 1 : activityScores[a] > activityScores[b] ? -1 : 0; });

    activityRanks = Array(activityScores.length);
    for (var i = 0; i < activityScores.length; i++) {
	activityRanks[indices[i]] = i;
    }
    // return activityRanks;    
}

loadCsv();
