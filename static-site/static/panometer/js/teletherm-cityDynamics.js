// on page load, queue's up the geo json and draps the map on return (using dataloaded())
// at the end of this function, queue's up the map data and calls updatedMap() to put points on the map.
// updateMap() is the end of the road for the initial load
//
// the year window buttons, and the variable dropdown will trigger updateMap()
// the year drop down ... (#yeardroplist) calls changeYear()
// the play button ...  calls changeYear()

// globally namespace these things
var geoJson;
var stateFeatures;
var station_dynamics = true;

var arrowradius = 16;
var rmin = 4;
var rmax = 6;

var month_names = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December", ];
var month_lengths = [31,28,31,30,31,30,31,31,30,31,30,31,];
// this will be the first day of every month
var month_lengths_cum = [1,31,28,31,30,31,30,31,31,30,31,30,];
for (var i=1; i<month_lengths_cum.length; i++) {
    month_lengths_cum[i] += month_lengths_cum[i-1];
}
// first day of every month for 18 months
var month_lengths_cum_18_forward = [1,31,28,31,30,31,30,31,31,30,31,30,31,31,28,31,30,31,];
for (var i=1; i<month_lengths_cum_18_forward.length; i++) {
    month_lengths_cum_18_forward[i] += month_lengths_cum_18_forward[i-1];
}
// note, the above ends at 517, which is short of the xrange of 365+181 = 546
// first day of every month for 18 months, starting backward 1
var month_lengths_cum_18_backward = [1-181,31,28,31,30,31,30,31,31,30,31,30,31,31,28,31,30,31,];
for (var i=1; i<month_lengths_cum_18_backward.length; i++) {
    month_lengths_cum_18_backward[i] += month_lengths_cum_18_backward[i-1];
}

// the main variables for the file load
// careful not to overload "window"
var windowEncoder = d3.urllib.encoder().varname("window"); //.varval(...);
var windowDecoder = d3.urllib.decoder().varname("window").varresult("25");
var windows = ["10","25","50"];
var windowIndex = 0;
var currentWindow;
for (var i=0; i<windows.length; i++) {
    if (windowDecoder().cached === windows[i]) {
	windowIndex = i;
    }
}
currentWindow = windowDecoder().cached;
windowEncoder.varval(currentWindow);

// the main variables for the file load
// careful not to overload "window"
var cityEncoder = d3.urllib.encoder().varname("city"); //.varval(...);
var cityDecoder = d3.urllib.decoder().varname("city").varresult("No city");
var currentCityIndex = -1;
if (cityDecoder.cached !== "No city") {
    for (var i=0; i<locations.length; i++) {
        if (cityDecoder().cached === locations[i][3]) {
	    currentCityIndex = i;
        }
    }
}

var city_clicked_initial_load = function(d) {
    var city_name_split = d[3].split(",");
    var proper_city_name = city_name_split[0].split(" ");
    for (var i=0; i<proper_city_name.length; i++) {
        proper_city_name[i] = proper_city_name[i][0].toUpperCase() + proper_city_name[i].slice(1).toLowerCase();
    }
    var city_name = [proper_city_name.join(" "),city_name_split[1]].join(",")+" from "+full_year_range[yearIndex]+"&ndash;"+(full_year_range[yearIndex]+parseInt(windowDecoder().cached))+":";

    document.getElementById("stationname").innerHTML = city_name;
    // var city_link = city_name+"<a href=\"/instruments/teletherms/citydynamics/?cityid="+d[4]+"\"> (click for city page)</a>"
    // document.getElementById("stationname").innerHTML = city_link;
    
    console.log(d);
    
    // queue()
    //     .defer(d3.text,"/data/teledata/stations/tmax_boxplot_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_smoothed_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmax_coverage_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_boxplot_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_smoothed_0"+d[0]+".txt")
    //     .defer(d3.text,"/data/teledata/stations/tmin_coverage_0"+d[0]+".txt")
    //     .awaitAll(cityTimePlot);

    queue()
        .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_values_combined.txt")
        .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-tmax_years_combined.txt")
        .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_values_combined.txt")
        .defer(d3.text,"/data/teledata/stations/telethermdata-"+d[4]+"-wrapped_tmin_years_combined.txt")
        .awaitAll(cityTimePlot);
}


// need to select the right one
// do something like this:
// http://stackoverflow.com/questions/19541484/bootstrap-set-initial-radio-button-checked-in-html
d3.select("#yearbuttons").selectAll("input").attr("checked",function(d,i) { if (i===windowIndex) { return "checked"; } else { return null; } });

// now you can close a city
$("#dismissCity").on("click",function() {
    $("#stationsvg1").remove();
    $("#stationname").html("");
    $(this).css("visibility","hidden");
    cityEncoder.destroy();
})

var variableLong = ["Summer Teletherm Day & Extent","Winter Teletherm Day & Extent","Summer Teletherm Temperature","Winter Teletherm Temperature"];
var variableShort = ["summer_day","winter_day","maxT","minT",]
var variableHover = variableLong;
// ranges are pre-computed from the data like this:
// allMins = Array(data.length-2);
// allMaxes = Array(data.length-2);
// for (var i=0; i<data.length-2; i++) { min = 150; max = -100; for (var j=0; j<data[i+1].length; j++) { if (data[i+1][j] > -9998) { if (data[i+1][j] > max) { max = data[i+1][j]; } if (data[i+1][j] < min) { min = data[i+1][j]; } } } allMins[i] = min; allMaxes[i] = max; }
// console.log("["+d3.min(allMins)+","+d3.max(allMaxes)+"]");
// these are the 1 year ranges
// var variableRanges = [[60.802142,125.425581],[-41.824669,64.654411],[18,339],[85-184,301-184],[1,57],[2,60],];
var variableRanges = [[144,295],[145-184,257-184],[61.598812,125.425581],[-30.488525,65.002232],]
var maxYear = 2012;
var variableIndex = 0;
var variableEncoder = d3.urllib.encoder().varname("var");
var variableDecoder = d3.urllib.decoder().varname("var").varresult("summer_day");
// now this is going to be the short one
var variable;
variable = variableDecoder().cached;
variableEncoder.varval(variable);
// get the index
for (var i=0; i<variableShort.length; i++) {
    if (variable === variableShort[i]) {
	variableIndex = i;
    }
}
$("#variabledropvis").html(variableLong[variableIndex]+" <span class=\"caret\"></span>");

var year;
var yearIndex;
var allyears;
var full_year_range = [1900,1901,1902,1903,1904,1905,1906,1907,1908,1909,1910,1911,1912,1913,1914,1915,1916,1917,1918,1919,1920,1921,1922,1923,1924,1925,1926,1927,1928,1929,1930,1931,1932,1933,1934,1935,1936,1937,1938,1939,1940,1941,1942,1943,1944,1945,1946,1947,1948,1949,1950,1951,1952,1953,1954,1955,1956,1957,1958,1959,1960,1961,1962,1963,1964,1965,1966,1967,1968,1969,1970,1971,1972,1973,1974,1975,1976,1977,1978,1979,1980,1981,1982,1983,1984,1985,1986,1987,1988,1989,1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013];
var yearEncoder = d3.urllib.encoder().varname("year");
var yearDecoder = d3.urllib.decoder().varname("year").varresult("1960");
yearEncoder.varval(yearDecoder().cached);
// yearIndex = parseFloat(yearDecoder().cached);
// can't really get the index until we have the years loaded
for (var i=0; i<full_year_range.length; i++) {
    if ((full_year_range[i]+"") === yearDecoder().cached) {
        yearIndex = i;
        break;
    }
}
// yearEncoder.varval(yearIndex);

$("#yearbuttons input").click(function() {
    console.log("calling updatewindow()");
    updatewindow(1000);
    
    // console.log($(this).val());
    currentWindow = $(this).val();
    windowEncoder.varval(currentWindow);

    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }

    // need to get the extent in there too
    if (variableDecoder().cached === "summer_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")        
	    .awaitAll(updateMap);
    }
    else if (variableDecoder().cached === "winter_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")                
	    .awaitAll(updateMap);
    }
    else {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .awaitAll(updateMap);
    }
    
});

$("#variabledrop a").click(function() {
    console.log($(this).text());
    variable = $(this).text();
    for (var i=0; i<variableLong.length; i++) {
	if (variable === variableLong[i]) {
	    variableIndex = i;
	}
    }
    variableEncoder.varval(variableShort[variableIndex]);
    $("#variabledropvis").html(variable+" <span class=\"caret\"></span>");
    var my_year = windowDecoder().cached;
    if (my_year === "1") {
        var padded_year = "01";
    }
    else {
        var padded_year = my_year;
    }
    
    // need to get the extent in there too
    if (variableDecoder().cached === "summer_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")        
	    .awaitAll(updateMap);
    }
    else if (variableDecoder().cached === "winter_day")
    {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached.replace("day","extent")+".txt")                
	    .awaitAll(updateMap);
    }
    else {
        queue()
	    .defer(d3.text,"/data/teledata/dynamics-1900/telethermdata-"+padded_year+"years-"+variableDecoder().cached+".txt")
	    .awaitAll(updateMap);
    }
    
});

        // $("#yeardrop a").click(function() {
//     console.log($(this).text());
//     year = $(this).text();
//     $("#yeardropvis").html(year+" <span class=\"caret\"></span>");
// });

var cities;
var citygroups;
var cityarrows;
var data;
var extradata = [];

// special color scale for maxT
var maxTcolor = function(i) { 
    return d3.rgb(Math.floor(tempScale(data[i+1][0])*255),0,0).toString();
}

// diverging red blue color map from colorbrewer
// var divredbluerev = ["#67001f","#b2182b","#d6604d","#f4a582","#fddbc7","#f7f7f7","#d1e5f0","#92c5de","#4393c3","#2166ac","#var"];
// var divredblue = ["#053061","#2166ac","#4393c3","#92c5de","#d1e5f0","#f7f7f7","#fddbc7","#f4a582","#d6604d","#b2182b","#67001f",];
// var divredblue = ['rgb(165,0,38)','rgb(215,48,39)','rgb(244,109,67)','rgb(253,174,97)','rgb(254,224,144)','rgb(255,255,191)','rgb(171,217,233)','rgb(116,173,209)','rgb(69,117,180)','rgb(49,54,149)','rgb(44,46,108)'].reverse();
// var divredblue = [
//     [1.0000000e+00,0.0000000e+00,0.0000000e+00],
//     [1.0000000e+00,6.0000000e-02,0.0000000e+00],
//     [1.0000000e+00,1.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,1.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,2.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,3.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,3.6000000e-01,0.0000000e+00],
//     [1.0000000e+00,4.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,4.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,5.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,6.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,6.6000000e-01,0.0000000e+00],
//     [1.0000000e+00,7.2000000e-01,0.0000000e+00],
//     [1.0000000e+00,7.8000000e-01,0.0000000e+00],
//     [1.0000000e+00,8.4000000e-01,0.0000000e+00],
//     [1.0000000e+00,9.0000000e-01,0.0000000e+00],
//     [1.0000000e+00,9.6000000e-01,0.0000000e+00],
//     [9.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [9.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [7.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [6.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [6.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [5.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [5.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [4.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [3.8000000e-01,1.0000000e+00,0.0000000e+00],
//     [3.2000000e-01,1.0000000e+00,0.0000000e+00],
//     [2.6000000e-01,1.0000000e+00,0.0000000e+00],
//     [2.0000000e-01,1.0000000e+00,0.0000000e+00],
//     [1.4000000e-01,1.0000000e+00,0.0000000e+00],
//     [8.0000000e-02,1.0000000e+00,0.0000000e+00],
//     [2.0000000e-02,1.0000000e+00,0.0000000e+00],
//     [0.0000000e+00,1.0000000e+00,4.0000000e-02],
//     [0.0000000e+00,1.0000000e+00,1.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,1.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,2.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,2.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,3.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,4.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,4.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,5.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,5.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,6.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,7.0000000e-01],
//     [0.0000000e+00,1.0000000e+00,7.6000000e-01],
//     [0.0000000e+00,1.0000000e+00,8.2000000e-01],
//     [0.0000000e+00,1.0000000e+00,8.8000000e-01],
//     [0.0000000e+00,1.0000000e+00,9.4000000e-01],
//     [0.0000000e+00,1.0000000e+00,1.0000000e+00],
//     [0.0000000e+00,9.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,8.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,8.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,7.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,7.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,6.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,5.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,5.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,3.4000000e-01,1.0000000e+00],
//     [0.0000000e+00,2.8000000e-01,1.0000000e+00],
//     [0.0000000e+00,2.2000000e-01,1.0000000e+00],
//     [0.0000000e+00,1.6000000e-01,1.0000000e+00],
//     [0.0000000e+00,1.0000000e-01,1.0000000e+00],
//     [0.0000000e+00,4.0000000e-02,1.0000000e+00],
//     [2.0000000e-02,0.0000000e+00,1.0000000e+00],
//     [8.0000000e-02,0.0000000e+00,1.0000000e+00],
//     [1.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [2.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [2.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [3.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [3.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [4.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [5.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [5.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [6.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [6.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [7.4000000e-01,0.0000000e+00,1.0000000e+00],
//     [8.0000000e-01,0.0000000e+00,1.0000000e+00],
//     [8.6000000e-01,0.0000000e+00,1.0000000e+00],
//     [9.2000000e-01,0.0000000e+00,1.0000000e+00],
//     [9.8000000e-01,0.0000000e+00,1.0000000e+00],
//     [1.0000000e+00,0.0000000e+00,9.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,9.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,8.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,7.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,7.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,5.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,4.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,4.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,3.6000000e-01],
//     [1.0000000e+00,0.0000000e+00,3.0000000e-01],
//     [1.0000000e+00,0.0000000e+00,2.4000000e-01],
//     [1.0000000e+00,0.0000000e+00,1.8000000e-01],
//     [1.0000000e+00,0.0000000e+00,1.2000000e-01],
//     [1.0000000e+00,0.0000000e+00,6.0000000e-02],];
var divredblue = ["rgb(255,0,0)","rgb(255,15,0)","rgb(255,31,0)","rgb(255,46,0)","rgb(255,61,0)","rgb(255,77,0)","rgb(255,92,0)","rgb(255,107,0)","rgb(255,122,0)","rgb(255,138,0)","rgb(255,153,0)","rgb(255,168,0)","rgb(255,184,0)","rgb(255,199,0)","rgb(255,214,0)","rgb(255,230,0)","rgb(255,245,0)","rgb(250,255,0)","rgb(235,255,0)","rgb(219,255,0)","rgb(204,255,0)","rgb(189,255,0)","rgb(173,255,0)","rgb(158,255,0)","rgb(143,255,0)","rgb(128,255,0)","rgb(112,255,0)","rgb(97,255,0)","rgb(82,255,0)","rgb(66,255,0)","rgb(51,255,0)","rgb(36,255,0)","rgb(20,255,0)","rgb(5,255,0)","rgb(0,255,10)","rgb(0,255,26)","rgb(0,255,41)","rgb(0,255,56)","rgb(0,255,71)","rgb(0,255,87)","rgb(0,255,102)","rgb(0,255,117)","rgb(0,255,133)","rgb(0,255,148)","rgb(0,255,163)","rgb(0,255,179)","rgb(0,255,194)","rgb(0,255,209)","rgb(0,255,224)","rgb(0,255,240)","rgb(0,255,255)","rgb(0,240,255)","rgb(0,224,255)","rgb(0,209,255)","rgb(0,194,255)","rgb(0,179,255)","rgb(0,163,255)","rgb(0,148,255)","rgb(0,133,255)","rgb(0,117,255)","rgb(0,102,255)","rgb(0,87,255)","rgb(0,71,255)","rgb(0,56,255)","rgb(0,41,255)","rgb(0,26,255)","rgb(0,10,255)","rgb(5,0,255)","rgb(20,0,255)","rgb(36,0,255)","rgb(51,0,255)","rgb(66,0,255)","rgb(82,0,255)","rgb(97,0,255)","rgb(112,0,255)","rgb(128,0,255)","rgb(143,0,255)","rgb(158,0,255)","rgb(173,0,255)","rgb(189,0,255)","rgb(204,0,255)","rgb(219,0,255)","rgb(235,0,255)","rgb(250,0,255)","rgb(255,0,245)","rgb(255,0,230)","rgb(255,0,214)","rgb(255,0,199)","rgb(255,0,184)","rgb(255,0,168)","rgb(255,0,153)","rgb(255,0,138)","rgb(255,0,122)","rgb(255,0,107)","rgb(255,0,92)","rgb(255,0,77)","rgb(255,0,61)","rgb(255,0,46)","rgb(255,0,31)","rgb(255,0,15)",];

var summerTScale = d3.scale.quantize()
 // celsius domain
 // .domain([63,117])
 // for fake data
    .range(divredblue);

var fullExtent;
var angle_offset = 0;

var updateMap = function(error,results) {
    console.log("update the map!");
    console.log("here is the result from queue for the map update:");
    console.log(results);
    data = results[0].split("\n");
    if (results.length > 1) {
        extradata = results[1].split("\n").map(function(d) { return d.split(" ").map(parseFloat); });
    }
    else {
        extradata = [];
    }
    // console.log("first result split on newlines:");
    // console.log(data);
    data = data.map(function(d) { return d.split(" ").map(parseFloat); });
    // console.log("each of those split on space:");
    // console.log(data);    

    // set the years from the first line of the dynamics file
    allyears = data[0];
    // console.log("this is all the years:");
    // console.log(allyears);

    for (var i=0; i<allyears.length; i++) {
        if ((allyears[i]+"") === yearDecoder().cached) {
            yearIndex = i;
            break;
        }
    }
    
    d3.select("#yeardroplist").selectAll("li").remove();
    d3.select("#yeardroplist")
	.selectAll("li")
	.data(allyears)
	.enter()
        .append("li")
        .append("a")
	.html(function(d) { return d+""+"&ndash;"+(d+parseInt(windowDecoder().cached)); })
        .on("click",function(d,i) {
	    yearIndex = i;
            console.log(yearIndex);
	    // yearEncoder.varval(yearIndex.toFixed(0));
            yearEncoder.varval(allyears[i]+"");
	    changeYear();
            if (yearIndex < allyears.length) {
	        var play_button = d3.select("#playButton")
                play_button.attr("class","btn btn-default");
                // play_button.select("i").attr("class","fa fa-play");
            }            
	})

    // console.log("variableIndex="+variableIndex);

    // set the domain for the scale based on this year's min/max
    // var localExtent;
    // localExtent = [d3.min(data.map(function(d) { return d3.min(d); } )),d3.max(data.map(function(d) { return d3.max(d); } ))];
    // // localExtent = d3.extent([].concat.apply([], data.slice(1,1300)))
    // fullExtent = localExtent;
    if (variableIndex === 1) {
        angle_offset = -180;
    }
    else {
        angle_offset = 0;
    }
    
    summerTScale.domain(variableRanges[variableIndex]);
    
    changeYear();

    // console.log("variableIndex="+variableIndex);    
    // draw a scale on the map
    // only need the circular scale for days of the year
    var pagewidth = parseInt(d3.select("#station1").style("width"));
    if (pagewidth > 600) {
        if (variableIndex < 2) {
            drawScale(variableRanges[variableIndex],"polar");
        }
        else {
            drawScale(variableRanges[variableIndex],"linear");
        }
    }
}

var playTimer;
var playing = false;

d3.select("#playButton").on("click",function(d,i) {
    if (playing) {
	playing = false;
	d3.select(this).select("i").attr("class","fa fa-play");
	clearInterval(playTimer);
    }
    else {
	d3.select(this).select("i").attr("class","fa fa-pause");
	playing = true;
	playTimer = setInterval(play,200);
    }
});

var play = function() {
    yearIndex++;
    changeYear();
}

var changeYear = function() {
    var loop = true;
    var update_time = 1000;
    if (yearIndex > allyears.length-1) {
        if (loop) {
            yearIndex = 0;
            updatetime = 3000;
        }
        else{
	    clearInterval(playTimer);
	    var play_button = d3.select("#playButton")
            play_button.attr("class","btn btn-default disabled");
            play_button.select("i").attr("class","fa fa-play");
	    playing = false;
	    yearIndex--;
	    return 0;
        }
    }

    
    // console.log("changing year index to");
    // console.log(yearIndex);
    // console.log(allyears[yearIndex]);
    $("#yeardropvis").html(allyears[yearIndex]+""+"&ndash;"+(allyears[yearIndex]+parseInt(windowDecoder().cached))+" <span class=\"caret\"></span>");
    yearEncoder.varval(allyears[yearIndex]+"");
    

    console.log("calling updatewindow() to update the top timeline");
    updatewindow(update_time);

    cities.attr("fill",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return summerTScale(data[i+1][yearIndex]+angle_offset);
        }
        else {
            return summerTScale(75);
        }})
        .attr("value",function(d,i) {
            return data[i+1][yearIndex];
        });

    if (extradata.length > 0) {
        cities.attr("r",function(d,i) {
            if (extradata[i+1][yearIndex] > -9998) {
                return Math.sqrt(extradata[i+1][yearIndex]);
            }
            else {
                return rmin;
            }})
            .attr("extravalue",function(d,i) {
                return extradata[i+1][yearIndex];
            });
    }
    else {
        cities.attr("r",function(d,i) {
                return rmin;
        });
    }

    cities.style("visibility",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return "visible";
        }
        else {
            return "hidden";
        }
    });

    cityarrows.style("visibility",function(d,i) {
        if (data[i+1][yearIndex] > -9998) {
            return "visible";
        }
        else {
            return "hidden";
        }
    });
    
    if (variableIndex < 2) {
	cityarrows.attr({
	    "x2": function(d,i) { return arrowradius*Math.cos((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "y2": function(d,i) { return arrowradius*Math.sin((data[i+1][yearIndex]+angle_offset)/365*2*Math.PI-Math.PI/2); },
	    "stroke-width": "1.5",
	    "stroke": function(d,i) { return summerTScale(data[i+1][yearIndex]+angle_offset); },
	});
    }
    else {
	cityarrows.style("visibility","hidden");        
	// cityarrows.attr({
	//     "x2": 0,
	//     "y2": 0,	    
	// });
    }
}

var w;
var h;
var canvas;

// // can just use the d3.csv,json
// function request(url, callback) {
//   var req = new XMLHttpRequest;
//   req.open("GET", url, true);
//   req.setRequestHeader("Accept", "application/json");
//   req.onreadystatechange = function() {
//     if (req.readyState === 4) {
//       if (req.status < 300) callback(null, JSON.parse(req.responseText));
//       else callback(req.status);
//     }
//   };
//   req.send(null);
// }

window.onload = function() {

    console.log("page loaded");
    // start using queue for the loads here
    var cityDecoder = d3.urllib.decoder().varname("cityid");
    var cityID = parseInt(cityDecoder().cached);
    var my_city;
    for (var i=0; i<locations.length; i++) {
        if (locations[i][4] === cityID) {
            my_city = locations[i];
            break;
        }
    }
    
    city_clicked_initial_load(my_city);

} // window.onload



