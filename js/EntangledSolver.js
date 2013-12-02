function Connection(dot1,dot2){
	this.from = dot1;
	this.to = dot2;
	this.line = this.getLine();
}

Connection.prototype.getLine = function(){
	 if (!this.line){
		 this.line = new Kinetic.Line({
			points: [this.from.getX(), this.from.getY(), this.to.getX(), this.to.getY()],
			stroke: 'red',
			strokeWidth: 1,
			lineCap: 'round',
			lineJoin: 'round'
		  });
	  }
	return this.line;
}

Connection.prototype.updateLine = function(dot){
	if (this.from == dot 
			|| this.to == dot){
			this.line.setPoints([this.from.getX(), this.from.getY(), this.to.getX(), this.to.getY()]);
			this.line.getLayer().draw();
	}
}

function Node(dot){
	this.imageDot = dot;
	this.imageLines = new Array();
	this.nodes = new Array();
	
}

Node.prototype.addNode = function(node){
	this.nodes[this.nodes.length] = node;
}

Node.prototype.addLine = function(line){
	this.imageLines[this.imageLines.length] = line;
}


function EntangledSolver() {
		this.nodes = new Array();
		this.supportedCommands = ["addNode","moveNode","deleteNode","addLine","deleteLine","undo","selectNode","selectLine","removeSelected","selectObj","dragStart","dragEnd","dragNode"];
		this.commandsToExecute = new Array();
		this.selectionColor = "blue";
		this.selectionMode = true;
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
	  var solver = this;
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
		solver.lastDrawnImage = {stage: stage, img:yoda, positioningOpts: positioning};
      };
      imageObj.src = this.initialImage;
	  return {img:imageObj,stage:stage};
}

EntangledSolver.prototype.startCroping = function(fromContainer, toContainer){
	this.drawInitialImage(fromContainer);
	var solver = this;
	$('#'+fromContainer.selector).mousedown( function() {
				$(document).mousemove(function(evt) {
					if (! (solver.cropX && solver.cropY)){
						solver.cropX = evt.pageX - $('#'+fromContainer.selector).offset().left;
						solver.cropY = evt.pageY - $('#'+fromContainer.selector).offset().top;
					}
					var x = evt.pageX - $('#'+fromContainer.selector).offset().left;
					var y = evt.pageY - $('#'+fromContainer.selector).offset().top;
					var thumbStage = solver.lastDrawnImage.stage;
					if (thumbStage){
						var opts = {startx:solver.cropX, 
																		starty: solver.cropY, 
																		width: x - solver.cropX, 
																		height: y - solver.cropY, 
																		stage: thumbStage, 
																		lastLayer: solver.lastSelectionRect};
						solver.lastSelectionRect = drawSelectionRect(opts);
						solver.cropTo(opts, toContainer);											
					}
				});

				$(document).mouseup(function() {
					solver.cropX = null;
					solver.cropY = null;
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

EntangledSolver.prototype.cropTo = function(opts, container){
	var originalStage = opts.stage;
	var stage = new Kinetic.Stage({
        container: container.selector,
        width: Math.abs(opts.width),
        height: Math.abs(opts.height)
      });
      var layer = new Kinetic.Layer();

      
        var yoda =  this.lastDrawnImage.img.clone();
		var xCompress = this.lastDrawnImage.positioningOpts.xCompressing;
		var yCompress = this.lastDrawnImage.positioningOpts.yCompressing;
		var startx = opts.startx; var starty = opts.starty;
		if (opts.width < 0){
			startx += opts.width
		}
		if (opts.height < 0){
			starty += opts.height;
		}
		var crop = {x:startx*xCompress, 
					y:starty*yCompress, 
					width: Math.abs(opts.width)*xCompress, 
					height: Math.abs(opts.height)*yCompress};
		
		
		yoda.setHeight(Math.abs(opts.height));
		yoda.setWidth(Math.abs(opts.width));
		yoda.setCrop(crop);
		
        // add the shape to the layer
        layer.add(yoda);

        // add the layer to the stage
        stage.add(layer);
      
	  this.cropStage = {stage:stage, img: yoda};
	 
   //do something with the color
}

EntangledSolver.prototype.createMath = function(fromContainer, toContainer){
	var solver = this;
	var imageResult = this.drawInitialImage(fromContainer);
	this.mathStage = new Kinetic.Stage({
        container: toContainer.selector
      });
	  var positioning = getImagePosition(imageResult.img, fromContainer.maxWidth);
      this.mathStage.setWidth(positioning.width);
	  this.mathStage.setHeight(positioning.height);
	  imageResult.stage.on('mousedown',function(){
			 solver.executeCommand({name:"addNode", target:getDot(solver.lastDrawnImage.stage.getPointerPosition())});
	  });
}

EntangledSolver.prototype.configCommands = function(options){
	  var solver = this;
	  if (options || options.length > 0){
			var configs = [];
			if( Object.prototype.toString.call( options ) === '[object Array]' ) {
				configs = options;
			}else{
				configs[0] = options;
			}
			for (var i = 0; i < configs.length; i ++){
				solver.configs = configs;
				var selector = configs[i].selector;
				var event = configs[i].event;
				$("#"+selector).bind(event, function(){ 
					var command = solver.getCommandFor($(this).attr('id'),event);
					solver.executeCommand({name:command});
				});
			}
	  }
}

EntangledSolver.prototype.getCommandFor = function(selector, event){
	for (var i = 0; i < this.configs.length; i ++){
		if (this.configs[i].selector == selector && this.configs[i].event == event){
			return this.configs[i].commandName;
		}
	}
	return "";
}

EntangledSolver.prototype.reRenderMathStage = function(){
	this.mathStage.clear();
	this.unbindNodes();
	for (var i = 0; i < this.commandsToExecute.length; i++){
			if ("addNode" == this.commandsToExecute[i].name){
				this.commandsToExecute[i].object = this.addNewNode(this.commandsToExecute[i].target);
			}else if ("addLine" == this.commandsToExecute[i].name){
				this.commandsToExecute[i].object = this.addNewLine(this.commandsToExecute[i].from,this.commandsToExecute[i].to);
			}
	}
}

EntangledSolver.prototype.unbindNodes = function(){
	for (var i = 0; i < this.nodes.length; i++){
		this.nodes[i].imageDot.off("click");
	}
	this.nodes = new Array();
}

EntangledSolver.prototype.executeCommand = function(command){
	if ("undo" == command.name){
		if (this.commandsToExecute.length > 0)
		var lastCommand = this.commandsToExecute[this.commandsToExecute.length - 1].name;
		if (lastCommand == "addNode" 
				|| lastCommand == "addLine"){
			this.removeObj(this.commandsToExecute[this.commandsToExecute.length - 1].object);		
		}else if(lastCommand == "dragNode"){
			this.commandsToExecute[this.commandsToExecute.length - 1].object.setX(this.commandsToExecute[this.commandsToExecute.length - 1].startx);
			this.commandsToExecute[this.commandsToExecute.length - 1].object.setY(this.commandsToExecute[this.commandsToExecute.length - 1].starty);
			this.commandsToExecute.splice(this.commandsToExecute.length - 1,1);
		}
	}else if ("removeSelected" == command.name){
		this.removeSelected();
	}
	else if ($.inArray(command.name, this.supportedCommands) > -1){
		this.commandsToExecute[this.commandsToExecute.length] = command;
	}
	this.reRenderMathStage();
}

EntangledSolver.prototype.addNewNode = function(dot){
	var solver = this;
	var node = new Node(dot);
	this.nodes[this.nodes.length] = node;
	var layer = new Kinetic.Layer();
	dot.on('click', function(){
		solver.selectObj(this);
	});
	dot.on("dragstart", function(){
		if (solver.commandsToExecute[solver.commandsToExecute.length - 1].object != this){
			solver.commandsToExecute[solver.commandsToExecute.length] = {name:'dragNode',object:this, startx:this.getX(), starty:this.getY(), endx:0, endy:0};
		}
	});
	  
	dot.on("dragend", function(){
		solver.commandsToExecute[solver.commandsToExecute.length - 1].endx = this.getX();
		solver.commandsToExecute[solver.commandsToExecute.length - 1].endy = this.getY();
	});
	
	dot.on("dragmove", function(){
		solver.updateMovingDot(this);
	});
	
	layer.add(dot);
	this.mathStage.add(layer);
	return dot;
}

EntangledSolver.prototype.updateMovingDot = function(dot){
	var node = findNodeByDot(this.nodes,dot);
	for (var i=0; i < node.imageLines.length; i++){
		node.imageLines[i].updateLine(dot);
	}
}

EntangledSolver.prototype.selectObj = function(obj){
	if (this.selectedObject && this.selectedObject.obj == obj){
		this.deSelectObj(obj);
		this.selectedObject = null;
	}else{
		if(this.selectedObject){
			if (this.selectionMode){
				this.deSelectObj(obj);
			}else{
				this.executeCommand({name:'addLine',from:this.selectedObject.obj,to:obj});
				this.deSelectObj(obj);
				this.selectedObject = null;
				return;
			}
		}
		this.selectedObject = {obj: obj, initialColor:obj.getFill()};
		obj.setFill(this.selectionColor);
		obj.getLayer().draw();
	}
}

EntangledSolver.prototype.addNewLine = function(from,to){
	var solver = this;
	var layer = new Kinetic.Layer();
	var connection = new Connection(from,to);
	var line = connection.getLine();
	var nodeFrom = findNodeByDot(solver.nodes,from);
	var nodeTo = findNodeByDot(solver.nodes,to);
	nodeFrom.addNode(to);
	nodeFrom.addLine(connection);
	nodeTo.addNode(from);
	nodeTo.addLine(connection);
	
	layer.add(line);
	this.mathStage.add(layer);
	layer.moveToBottom();
	return line;
}

EntangledSolver.prototype.deSelectObj = function(obj){
	this.selectedObject.obj.setFill(this.selectedObject.initialColor)
	this.selectedObject.obj.getLayer().draw();
}

EntangledSolver.prototype.removeSelected = function(){
	if (this.selectedObject){
			this.removeObj(this.selectedObject.obj);
	}
}

EntangledSolver.prototype.removeObj = function(nodeObj){

	for (var i = 0; i < this.commandsToExecute.length; i++){
		if (this.commandsToExecute[i].object && this.commandsToExecute[i].object == nodeObj){
			this.commandsToExecute.splice(i,1);
			if (this.selectedObject && this.selectedObject.obj == nodeObj){
				this.deSelectObj(nodeObj);
			}
			break;
		}
	}
};

function getDot(pos){
	var circle =  new Kinetic.Circle({
        x: pos.x,
        y: pos.y,
        radius: 15,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 1,
		draggable : true
      });
	  
	  return circle;
}


function findNodeByDot(nodes,dot){
	for (var i = 0; i < nodes.length; i++){
		if (nodes[i].imageDot == dot)
			return nodes[i];
	}
}



function drawSelectionRect(opts){
	var stage = opts.stage;
	var layer = new Kinetic.Layer();
	if (opts.lastLayer && opts.lastLayer.layer){
		layer = opts.lastLayer.layer;
		layer.removeChildren();
	}
	

      var rect = new Kinetic.Rect({
        x: opts.startx,
        y: opts.starty,
        width: opts.width,
        height: opts.height,
        stroke:  '#00FF00',
        strokeWidth: 1
      });

      // add the shape to the layer
      layer.add(rect);

      // add the layer to the stage
      stage.add(layer);
	  return {layer:layer};
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255) throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}
