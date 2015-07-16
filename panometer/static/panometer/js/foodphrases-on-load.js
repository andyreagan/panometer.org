var searchDecoder = d3.urllib.decoder().varresult("nofood").varname("search");
var allDecoder = d3.urllib.decoder().varresult("0").varname("all");
var searchEncoder = d3.urllib.encoder().varname("search");
var allEncoder = d3.urllib.encoder().varname("all");

var qcolor = d3.scale.quantize()
    .range([0,1,2,3,4,5,6,7,8]);

var substringMatcher = function(strs) {
    return function findMatches(q,cb) {
        var matches, substringRegex;
        //console.log("matching "+q);
        matches = [];
        for (var i=0; i<foodNames.length; i++) {
            if (foodNames[i].match(q)) {
     		matches.push({ value: foodNames[i]})   
            }
        }
        if (matches.length === 0) { matches.push({ value: "<i>food phrase not indexed</i>" }); }
        cb(matches);
    };
};

$(document).ready(function() {
    $("#wordsearch").typeahead(
        {
            hint: false,
            highlight: true,
            minLength: 1,
        },
        {
            name: "foodwords",
            source: substringMatcher(["one","two"])
        });
}).on("typeahead:selected",function(event,sugg,dataset) {
    // console.log(event);
    // console.log(sugg);
    // console.log(dataset);
    searchEncoder.varval(sugg.value);
    if (parseFloat(allDecoder().current)) { allEncoder.varval("0"); }
    for (var i=0; i<foodNames.length; i++) {
        if (foodNames[i] === sugg.value) {
	    // console.log(i);
            drawMap(d3.select("#map01"),stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; }));
            plotBarChart(d3.select("#bars01"),stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; }),stateFeatures);
            break;
        }
    }
    //drawWordStats(d3.select("#viewpanel"),sugg.value);
    //$("#viewpanel").load('/definition/' + encodeURIComponent(sugg.value));
    //$("#controlpanel").hide();
});

$("#showallmatching").on("click", function(e) {
    // close the typeahead

    // push up that all was selected
    allEncoder.varval("1");

    // console.log("showing all matching");				      
    // add up the matching words
    totalFood = Array(stateFood[0].length);
    for (var i=0; i<stateFood[0].length; i++) {
	totalFood[i] = 0;
    } // for 
    var typed = $('.typeahead').typeahead('val');
    searchEncoder.varval(typed);

    for (var i=0; i<foodNames.length; i++) {
        if (foodNames[i].match(typed)) {
	    // console.log(i);
	    tmpFood = stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; })
            for (var j=0; j<stateFood[i].length; j++) {
		totalFood[j] += tmpFood[j];
	    } // for
        } //if 
    } // for 
    drawMap(d3.select("#map01"),totalFood);
    plotBarChart(d3.select("#bars01"),totalFood,stateFeatures);
}); 


function initializePlot() {
    loadCsv();
}

function loadCsv() {
    var csvLoadsRemaining = 6;
    d3.json("data/us-states.topojson", function(data) {
        geoJson = data;
        stateFeatures = topojson.feature(geoJson,geoJson.objects.states).features;
        if (!--csvLoadsRemaining) initializePlotPlot();
    });

    d3.text("data/foodList_lemmatized_no_quotes.csv", function (text) {
        var tmp = text.split("\n").slice(1,451);
        foodCals = tmp.map(function(d) { return parseFloat(d.split(",")[3]); });
	foodNames = tmp.map(function(d) { return d.split(",")[0]; });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("data/activityList_lemmatized_no_quotes.csv", function (text) {
        var tmp = text.split("\n").slice(1,299);
        actCals = tmp.map(function(d) { return parseFloat(d.split(",")[2]); });
        actNames = tmp.map(function(d) { return d.split(",")[0]; });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("data/stateActivitiesMatrix_lemmatized.csv", function (text) {
        var tmp = text.split("\n").slice(1,299);
        stateAct = tmp.map(function(d) { return d.split(",").slice(1,1000); });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("data/stateFoodsMatrix_lemmatized.csv", function (text) {
        var tmp = text.split("\n").slice(1,451);
        stateFood = tmp.map(function(d) { return d.split(",").slice(1,1000); });
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
    d3.text("data/caloric_balance06292015.csv", function (text) {
        var tmp = text.split("\n").slice(1,1000000);
        stateFlux = tmp.map(function(d) { return parseFloat(d.split(",")[1]); }).slice(0,49);
        if (!--csvLoadsRemaining) initializePlotPlot();
    });
};

function initializePlotPlot() {
    // drap the map
    //drawMap(d3.select("#map01"),stateFlux);
    //allUSfood = stateFood.map(function(d) { return d3.sum(d); });
    //allUSact = stateAct.map(function(d) { return d3.sum(d); });
    //plotBarChart(d3.select("#bars01"),stateFlux,stateFeatures);
    stateFoodTotals = Array(stateFood[0].length);
    for (var i=0; i<stateFoodTotals.length; i++) {
        stateFoodTotals[i] = d3.sum(stateFood.map(function(d) { return d[i]; }));
    }
    if (searchDecoder().current === "nofood") { initialplot = "bacon";}
    else { initialplot = searchDecoder().current; 
	   $('.typeahead').typeahead('val', initialplot); }

    searchAll = parseFloat(allDecoder().current);

    totalFood = Array(stateFood[0].length);
    for (var i=0; i<stateFood[0].length; i++) {
	totalFood[i] = 0;
    } // for 

    if (searchAll) {
	
	for (var i=0; i<foodNames.length; i++) {
            if (foodNames[i].match(initialplot)) {
		var tmpFood = stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; })
		for (var j=0; j<stateFood[i].length; j++) {
		    totalFood[j] += tmpFood[j];
		} // for
            } //if 
	} // for 
    }
    else {
	for (var i=0; i<foodNames.length; i++) {
            if (foodNames[i] === initialplot) {
		var tmpFood = stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; })
		for (var j=0; j<stateFood[i].length; j++) {
		    totalFood[j] += tmpFood[j];
		} // for
		break;
            } //if 
	} // for 
    }
    drawMap(d3.select("#map01"),totalFood);
    plotBarChart(d3.select("#bars01"),totalFood,stateFeatures);
};


initializePlot();
