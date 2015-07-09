var shift_height = 450;
var num_shift_words = 24;
var rectHeight = 11;
var sumRectHeight = 15;

var state_encoder = d3.urllib.encoder().varname("ID");
var state_decoder = d3.urllib.decoder().varname("ID").varresult(Math.floor(Math.random() * 49));

function initializePlot() {
    loadCsv();
}

function loadCsv() {
    var csvLoadsRemaining = 6;
    d3.json("/data/lexicocalorimeter/state_squares.topojson", function(data) {
        geoJson = data;
        // stateFeatures = topojson.feature(geoJson,geoJson.objects.states).features;
	stateFeatures = topojson.feature(geoJson,geoJson.objects.state_squares).features;
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("/data/lexicocalorimeter/foodList_lemmatized_no_quotes.csv", function (text) {
        var tmp = text.split("\n").slice(1,451);
        foodCals = tmp.map(function(d) { return parseFloat(d.split(",")[3]); });
	foodNames = tmp.map(function(d) { return d.split(",")[0]; });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("/data/lexicocalorimeter/activityList_lemmatized_no_quotes.csv", function (text) {
        var tmp = text.split("\n").slice(1,299);
        actCals = tmp.map(function(d) { return parseFloat(d.split(",")[2]); });
        actNames = tmp.map(function(d) { return d.split(",")[0]; });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("/data/lexicocalorimeter/stateActivitiesMatrix_lemmatized.csv", function (text) {
        var tmp = text.split("\n").slice(1,299);
        stateAct = tmp.map(function(d) { return d.split(",").slice(1,1000); });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("/data/lexicocalorimeter/stateFoodsMatrix_lemmatized.csv", function (text) {
        var tmp = text.split("\n").slice(1,451);
        stateFood = tmp.map(function(d) { return d.split(",").slice(1,1000); });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("/data/lexicocalorimeter/caloric_balance06292015.csv", function (text) {
        var tmp = text.split("\n").slice(1,50);
	stateFlux = tmp.map(function(d) { return [d.split(",")[0],parseFloat(d.split(",")[1])]; });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
};

function initializePlotPlot() {
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

    // make this the new one
    // stateFeatures = sorted_state_json;
    
    plotBarChart(d3.select("#bars01"),stateFlux.map(function(d) { return d[1]; }),sorted_state_json);
    // drap the map
    drawMap(d3.select("#map01"),stateFlux.map(function(d) { return d[1]; }),sorted_state_json);
    allUSfood = stateFood.map(function(d) { return d3.sum(d); });
    allUSact = stateAct.map(function(d) { return d3.sum(d); });

    i = state_decoder().cached;
    shiftComp = i;
    shiftCompName = sorted_state_json[i].properties.name;
    
    d3.selectAll("."+shiftCompName[0]+shiftCompName.split(" ")[shiftCompName.split(" ").length-1]).attr("fill","red");
    
    if (shiftCompName === "District of Columbia") {
	shiftCompName = "DC";
    }
    console.log(shiftCompName);

    hedotools.shifter._words(foodNames);
    hedotools.shifter._lens(foodCals);
    hedotools.shifter._refF(allUSfood);
    // computeFoodRanks()    
    foodRanks = [38, 10, 36, 21, 1, 24, 16, 3, 8, 14, 22, 15, 41, 42, 39, 43, 35, 0, 6, 11, 34, 5, 33, 9, 44, 32, 7, 2, 30, 31, 12, 29, 46, 45, 40, 13, 27, 18, 26, 48, 20, 37, 25, 28, 17, 19, 47, 4, 23];
    hedotools.shifter.setfigure(d3.select("#shift01"));
    hedotools.shifter._split_top_strings(false);
    hedotools.shifter._compF(stateFood.map(function(d) { return parseFloat(d[shiftComp]); }));
    hedotools.shifter.setTextBold(1);
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
    // console.log(sumtextarray);
    hedotools.shifter._xlabel_text("Per food phrase caloric shift");
    hedotools.shifter._ylabel_text("Food rank");
    hedotools.shifter.show_x_axis(true);
    hedotools.shifter.plot();

    hedotools.shifterTwo._words(actNames);
    hedotools.shifterTwo._lens(actCals);
    hedotools.shifterTwo._refF(allUSact);
    // computeActivityRanks();
    activityRanks = [43, 17, 45, 9, 1, 32, 46, 28, 25, 42, 18, 30, 26, 8, 21, 36, 47, 13, 44, 23, 41, 7, 48, 27, 4, 11, 24, 14, 35, 16, 10, 38, 15, 31, 19, 5, 33, 22, 39, 6, 37, 34, 3, 2, 29, 12, 40, 20, 0];
    hedotools.shifterTwo._split_top_strings(false);
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
    hedotools.shifterTwo.setTextBold(1);
    // hedotools.shifterTwo.setWidth(modalwidth);
    hedotools.shifterTwo.setText(sumtextarray);
    hedotools.shifterTwo._xlabel_text("Per activity phrase caloric expenditure shift");
    hedotools.shifterTwo._ylabel_text("Activity rank");
    hedotools.shifterTwo.show_x_axis(true);    
    hedotools.shifterTwo.setfigure(d3.select("#shift02"));
    hedotools.shifterTwo.plot();
};

initializePlot();

function computeFoodRanks() {
    foodScores = Array(49);
    for (var shiftComp=0; shiftComp<49; shiftComp++) {
	hedotools.shifter._compF(stateFood.map(function(d) { return parseFloat(d[shiftComp]); }));
	hedotools.shifter.shifter();
	var compH = hedotools.shifter._compH();
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
	hedotools.shifterTwo._compF(stateAct.map(function(d) { return parseFloat(d[shiftComp]); }));	
	hedotools.shifterTwo.shifter();
	var compH = hedotools.shifterTwo._compH();
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

