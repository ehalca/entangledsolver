function showStep(step){
	$("#tabs").children().removeClass("active");
	$("#nav-link-"+step).addClass("active");
	$(".tab").not("#tab"+step).hide();
	$("#tab"+step).show();
}

function getImagePosition(img, maxWidth){
	var posX = 0;
	var posY = 0;
	var heightResult = 0;
	var widthResult = 0;
	
	if (img.width <= maxWidth){
		heightResult = img.height;
		widthResult = img.widthResult;
		posX = (maxWidth - img.width)/2;
	}else{
		widthResult = maxWidth;
		heightResult = (maxWidth * img.height)/img.width;
	}
	
	return {x : posX, y : posY, height : heightResult, width : widthResult, xCompressing : img.width/widthResult, yCompressing : img.height/heightResult};
}

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

function gotoStep(step, steps){
	$("#tabs").append("<li class='active' id=\"nav-link-"+step+"\"><a href='#' onClick='javascript:showStep(\""+step+"\");'>"+steps[step]+"</a></li>");
	showStep(step);
}