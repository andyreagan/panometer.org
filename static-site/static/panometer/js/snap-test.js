var s = Snap("#mainlogo");
// var s = Snap(500,500);

Snap.load("/static/panometer/graphics/logo-7.2.svg", function (f) {

    // grab the main group out, and put it in the DOM SVG
    main_group = f.select("g");
    s.append(main_group);

    // main the whole thing draggable
    // this may be hurting the brower, unsure
    // main_group.drag();

    main_group.select("#meter5-copy").click(function() { window.location.assign("http://panometer.org/instruments/lexicocalorimeter/"); });
    main_group.select("#panometer-logo").click(function() { window.location.assign("http://panometer.org/instruments/lexicocalorimeter/"); });

        main_group.select("#meter3-copy").click(function() { window.location.assign("http://hedonometer.org"); });
    main_group.select("#smiley").click(function() { window.location.assign("http://hedonometer.org"); });

    arrow1 = main_group.select("#arrow1").select("path");
    arrow1x = main_group.select("#arrow1").select("ellipse").attr("cx");
    arrow1y = main_group.select("#arrow1").select("ellipse").attr("cy");    
    function rotateInfinite1() {
	arrow1.stop().animate(
	    { transform: 'r360,'+arrow1x+','+arrow1y}, 750, function() {
		arrow1.attr({ transform: 'r0,'+arrow1x+','+arrow1y });
		rotateInfinite1();
	    }
	);
    }
    rotateInfinite1();

    arrow2 = main_group.select("#arrow2").select("path");
    arrow2x = main_group.select("#arrow2").select("ellipse").attr("cx");
    arrow2y = main_group.select("#arrow2").select("ellipse").attr("cy");    
    function rotateInfinite2() {
	arrow2.stop().animate(
	    { transform: 'r360,'+arrow2x+','+arrow2y}, 20000, function() {
		arrow2.attr({ transform: 'r0,'+arrow2x+','+arrow2y });
		rotateInfinite2();
	    }
	);
    }
    rotateInfinite2();

    arrow3 = main_group.select("#arrow3").select("path");
    arrow3x = main_group.select("#arrow3").select("ellipse").attr("cx");
    arrow3y = main_group.select("#arrow3").select("ellipse").attr("cy");    
    function rotateInfinite3() {
	arrow3.stop().animate(
	    { transform: 'r-360,'+arrow3x+','+arrow3y}, 5000, function() {
		arrow3.attr({ transform: 'r0,'+arrow3x+','+arrow3y });
		rotateInfinite3();
	    }
	);
    }
    rotateInfinite3();

    arrow4 = main_group.select("#arrow4").select("path");
    arrow4x = main_group.select("#arrow4").select("ellipse").attr("cx");
    arrow4y = main_group.select("#arrow4").select("ellipse").attr("cy");    
    function rotateInfinite4() {
	arrow4.stop().animate(
	    { transform: 'r360,'+arrow4x+','+arrow4y}, 10000, function() {
		arrow4.attr({ transform: 'r0,'+arrow4x+','+arrow4y });
		rotateInfinite4();
	    }
	);
    }
    rotateInfinite4();

    arrow5 = main_group.select("#arrow5").select("path");
    arrow5x = main_group.select("#arrow5").select("ellipse").attr("cx");
    arrow5y = main_group.select("#arrow5").select("ellipse").attr("cy");    
    function rotateInfinite5() {
	arrow5.stop().animate(
	    { transform: 'r360,'+arrow5x+','+arrow5y}, 8000, function() {
		arrow5.attr({ transform: 'r0,'+arrow5x+','+arrow5y });
		rotateInfinite5();
	    }
	);
    }
    rotateInfinite5();
    
    arrow6 = main_group.select("#arrow6").select("path");
    arrow6x = main_group.select("#arrow6").select("ellipse").attr("cx");
    arrow6y = main_group.select("#arrow6").select("ellipse").attr("cy");    
    function rotateInfinite6() {
	arrow6.stop().animate(
	    { transform: 'r360,'+arrow6x+','+arrow6y}, 3000, function() {
		arrow6.attr({ transform: 'r0,'+arrow6x+','+arrow6y });
		rotateInfinite6();
	    }
	);
    }
    rotateInfinite6();
    
    // Obviously drag could take event handlers too
    // Looks like our croc is made from more than one polygon...
});



