var searchDecoder = d3.urllib.decoder().varresult("noact").varname("search");
var allDecoder = d3.urllib.decoder().varresult(0).varname("all");
var searchEncoder = d3.urllib.encoder().varname("search");
var allEncoder = d3.urllib.encoder().varname("all");

var state_encoder = d3.urllib.encoder().varname("ID");
var state_decoder = d3.urllib.decoder().varname("ID").varresult(Math.floor(Math.random() * 49));

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
    for (var i=0; i<foodNames.length; i++) {
        if (foodNames[i] === sugg.value) {
	    console.log(i);
	    drawMap(d3.select("#map01"),stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; }),sorted_state_json,false,[-90.1,41.6],2200);
	    plotBarChart(d3.select("#bars01"),stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; }),sorted_state_json,"Fraction of all food phrases");    		
            // drawMap(d3.select("#map01"),stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; }),sorted_state_json,false);
            // plotBarChart(d3.select("#bars01"),stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; }),stateFeatures);
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
	    tmpAct = stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; })
            for (var j=0; j<stateFood[i].length; j++) {
		totalFood[j] += tmpAct[j];
	    } // for
        } //if 
    } // for
    drawMap(d3.select("#map01"),totalFood,sorted_state_json,false,[-90.1,41.6],2200);
    plotBarChart(d3.select("#bars01"),totalFood,sorted_state_json,"Fraction of all food phrases");
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
    //allUSact = stateFood.map(function(d) { return d3.sum(d); });
    //plotBarChart(d3.select("#bars01"),stateFlux,stateFeatures);
    stateFoodTotals = Array(stateFood[0].length);
    for (var i=0; i<stateFoodTotals.length; i++) {
        stateFoodTotals[i] = d3.sum(stateFood.map(function(d) { return d[i]; }));
    }
    if (searchDecoder().cached === "noact") { initialplot = "bacon";}
    else { initialplot = searchDecoder().cached; 
	   $('.typeahead').typeahead('val', initialplot); }

    searchAll = parseFloat(allDecoder().cached);

    totalFood = Array(stateFood[0].length);
    for (var i=0; i<stateFood[0].length; i++) {
	totalFood[i] = 0;
    } // for 

    if (searchAll) {
	for (var i=0; i<foodNames.length; i++) {
            if (foodNames[i].match(initialplot)) {
		var tmpAct = stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; })
		for (var j=0; j<stateFood[i].length; j++) {
		    totalFood[j] += tmpAct[j];
		} // for
            } //if 
	} // for 
    }
    else {
	for (var i=0; i<foodNames.length; i++) {
            if (foodNames[i] === initialplot) {
		var tmpAct = stateFood[i].map(parseFloat).map(function(d,i) { return d/stateFoodTotals[i]; })
		for (var j=0; j<stateFood[i].length; j++) {
		    totalFood[j] += tmpAct[j];
		} // for
		break;
            } //if 
	} // for 
    }
    drawMap(d3.select("#map01"),totalFood,sorted_state_json,false,[-90.1,41.6],2200);
    plotBarChart(d3.select("#bars01"),totalFood,sorted_state_json,"Fraction of all food phrases");
};

loadCsv();





