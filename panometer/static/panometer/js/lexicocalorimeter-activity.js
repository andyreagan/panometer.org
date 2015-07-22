var searchDecoder = d3.urllib.decoder().varresult("noact").varname("search");
var allDecoder = d3.urllib.decoder().varresult(0).varname("all");
var searchEncoder = d3.urllib.encoder().varname("search");
var allEncoder = d3.urllib.encoder().varname("all");

var state_encoder = d3.urllib.encoder().varname("ID");
var state_decoder = d3.urllib.decoder().varname("ID").varresult(Math.floor(Math.random() * 49));

var qcolor = d3.scale.quantize()
    .range([0,1,2,3,4,5,6,7,8]);

var map_location = [-93.1,41.6];
var map_size = 3000;

var substringMatcher = function(strs) {
    return function findMatches(q,cb) {
        var matches, substringRegex;
        //console.log("matching "+q);
        matches = [];
        for (var i=0; i<actNames.length; i++) {
            if (actNames[i].match(q)) {
     		matches.push({ value: actNames[i]})   
            }
        }
        if (matches.length === 0) { matches.push({ value: "<i>activity phrase not indexed</i>" }); }
        cb(matches);
    };
};

$(document).ready(function() {
    $("#wordsearch").typeahead(
        {
            hint: false,
            highlight: true,
            minLength: 2,
        },
        {
            name: "actwords",
            source: substringMatcher(["one","two"])
        });
}).on("typeahead:selected",function(event,sugg,dataset) {
    // console.log(event);
    // console.log(sugg);
    // console.log(dataset);
    searchEncoder.varval(sugg.value);
    if (parseFloat(allDecoder().current)) { allEncoder.varval("0"); }
    for (var i=0; i<actNames.length; i++) {
        if (actNames[i] === sugg.value) {
	    console.log(i);
	    drawMap(d3.select("#map01"),stateAct[i].map(parseFloat).map(function(d,i) { return d/stateActTotals[i]; }),sorted_state_json,false,map_location,map_size);
	    plotBarChart(d3.select("#bars01"),stateAct[i].map(parseFloat).map(function(d,i) { return d/stateActTotals[i]; }),sorted_state_json,"Fraction of all activity phrases");    		
            // drawMap(d3.select("#map01"),stateAct[i].map(parseFloat).map(function(d,i) { return d/stateActTotals[i]; }),sorted_state_json,false);
            // plotBarChart(d3.select("#bars01"),stateAct[i].map(parseFloat).map(function(d,i) { return d/stateActTotals[i]; }),stateFeatures);
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
    totalAct = Array(stateAct[0].length);
    for (var i=0; i<stateAct[0].length; i++) {
	totalAct[i] = 0;
    } // for 
    var typed = $('.typeahead').typeahead('val');
    searchEncoder.varval(typed);

    for (var i=0; i<actNames.length; i++) {
        if (actNames[i].match(typed)) {
	    // console.log(i);
	    tmpAct = stateAct[i].map(parseFloat).map(function(d,i) { return d/stateActTotals[i]; })
            for (var j=0; j<stateAct[i].length; j++) {
		totalAct[j] += tmpAct[j];
	    } // for
        } //if 
    } // for
    drawMap(d3.select("#map01"),totalAct,sorted_state_json,false,map_location,map_size);
    plotBarChart(d3.select("#bars01"),totalAct,sorted_state_json,"Fraction of all activity phrases");
}); 

function initializePlot() {
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
    
    // drap the map
    //drawMap(d3.select("#map01"),stateFlux);
    //allUSfood = stateFood.map(function(d) { return d3.sum(d); });
    //allUSact = stateAct.map(function(d) { return d3.sum(d); });
    //plotBarChart(d3.select("#bars01"),stateFlux,stateFeatures);
    stateActTotals = Array(stateAct[0].length);
    for (var i=0; i<stateActTotals.length; i++) {
        stateActTotals[i] = d3.sum(stateAct.map(function(d) { return d[i]; }));
    }
    if (searchDecoder().cached === "noact") { initialplot = "skiing";}
    else { initialplot = searchDecoder().cached; 
	   $('.typeahead').typeahead('val', initialplot); }

    searchAll = parseFloat(allDecoder().cached);

    totalAct = Array(stateAct[0].length);
    for (var i=0; i<stateAct[0].length; i++) {
	totalAct[i] = 0;
    } // for 

    if (searchAll) {
	for (var i=0; i<actNames.length; i++) {
            if (actNames[i].match(initialplot)) {
		var tmpAct = stateAct[i].map(parseFloat).map(function(d,i) { return d/stateActTotals[i]; })
		for (var j=0; j<stateAct[i].length; j++) {
		    totalAct[j] += tmpAct[j];
		} // for
            } //if 
	} // for 
    }
    else {
	for (var i=0; i<actNames.length; i++) {
            if (actNames[i] === initialplot) {
		var tmpAct = stateAct[i].map(parseFloat).map(function(d,i) { return d/stateActTotals[i]; })
		for (var j=0; j<stateAct[i].length; j++) {
		    totalAct[j] += tmpAct[j];
		} // for
		break;
            } //if 
	} // for 
    }
    drawMap(d3.select("#map01"),totalAct,sorted_state_json,false,map_location,map_size);
    plotBarChart(d3.select("#bars01"),totalAct,sorted_state_json,"Fraction of all activity phrases");
};

loadCsv();





