function EntangledSolver() {	
}

EntangledSolver.prototype.drawImage = function(container){
this.canvas.width = this.imgEl.width;
this.canvas.height = this.imgEl.height;
this.canvas.getContext('2d').drawImage(this.imgEl, 0, 0, this.imgEl.width, this.imgEl.height);
};

EntangledSolver.prototype.initImg = function(src){
	this.initialImage = src;
}

EntangledSolver.prototype.drawInitialImage = function(container){
	var stage = new Kinetic.Stage({
        container: container.selector
      });
      var layer = new Kinetic.Layer();

      var imageObj = new Image();
	  var result;
      imageObj.onload = function() {
	  var positioning = getImagePosition(imageObj, container.maxWidth);
        var yoda = new Kinetic.Image({
          image: imageObj,
		  x: positioning.x,
		  y: positioning.y,
          width: positioning.width,
          height: positioning.height
        });
		
        // add the shape to the layer
        layer.add(yoda);
		
        
        stage.setWidth(positioning.width);
		stage.setHeight(positioning.height);
        // add the layer to the stage
        stage.add(layer);
      };
      imageObj.src = this.initialImage;
}

EntangledSolver.prototype.startCroping = function(fromContainer, toContainer){
	this.drawInitialImage(fromContainer);
	var solver = this;
	$('#originalImage').mousedown( function() {
				$(document).mousemove(function(evt) {
					var x = evt.pageX - $('#originalImage').offset().left;
					var y = evt.pageY - $('#originalImage').offset().top;
				});

				$(document).mouseup(function() {
					$(this).unbind();  // unbind events from document
				});
			});
} 

EntangledSolver.prototype.setInitialImage = function(f,container){
	 
	 // Only process image files.
        assert(f.type.match('image.*'),'Selected file is not an image');
      

      var reader = new FileReader();

      // Closure to capture the file information.
	  var solver = this;
      reader.onload = (function(theFile) {
        return function(e) {
		solver.initImg(e.target.result)
		solver.drawInitialImage(container)
        };
      })(f);

      // Read in the image file as a data URL.
      reader.readAsDataURL(f);
}

EntangledSolver.prototype.cropImage = function(){

}

