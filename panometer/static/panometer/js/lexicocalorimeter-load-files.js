function loadCsv() {
    var csvLoadsRemaining = 6;
    d3.json("http://panometer.org/data/lexicocalorimeter/state_squares.topojson", function(data) {
        geoJson = data;
        // stateFeatures = topojson.feature(geoJson,geoJson.objects.states).features;
	stateFeatures = topojson.feature(geoJson,geoJson.objects.state_squares).features;
        if (!--csvLoadsRemaining) initializePlot();
    });
    d3.text("http://panometer.org/data/lexicocalorimeter/foodList_lemmatized_no_quotes.csv", function (text) {
        var tmp = text.split("\n").slice(1,451);
        foodCals = tmp.map(function(d) { return parseFloat(d.split(",")[3]); });
	foodNames = tmp.map(function(d) { return d.split(",")[0]; });
        if (!--csvLoadsRemaining) initializePlot();
    });
    d3.text("http://panometer.org/data/lexicocalorimeter/activityList_lemmatized_no_quotes.csv", function (text) {
        var tmp = text.split("\n").slice(1,299);
        actCals = tmp.map(function(d) { return parseFloat(d.split(",")[2]); });
        actNames = tmp.map(function(d) { return d.split(",")[0]; });
        if (!--csvLoadsRemaining) initializePlot();
    });
    d3.text("http://panometer.org/data/lexicocalorimeter/stateActivitiesMatrix_lemmatized.csv", function (text) {
        var tmp = text.split("\n").slice(1,299);
        stateAct = tmp.map(function(d) { return d.split(",").slice(1,1000); });
        if (!--csvLoadsRemaining) initializePlot();
    });
    d3.text("http://panometer.org/data/lexicocalorimeter/stateFoodsMatrix_lemmatized.csv", function (text) {
        var tmp = text.split("\n").slice(1,451);
        stateFood = tmp.map(function(d) { return d.split(",").slice(1,1000); });
        if (!--csvLoadsRemaining) initializePlot();
    });
    d3.text("http://panometer.org/data/lexicocalorimeter/caloric_balance06292015.csv", function (text) {
        var tmp = text.split("\n").slice(1,50);
	stateFlux = tmp.map(function(d) { return [d.split(",")[0],parseFloat(d.split(",")[1])]; });
        if (!--csvLoadsRemaining) initializePlot();
    });
};



