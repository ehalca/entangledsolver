function Connection(dot1,dot2){
	this.from = dot1;
	this.to = dot2;
	this.line = this.getLine();
	this.intersections = new Array();
}

Connection.prototype.getLine = function(){
	 if (!this.line){
		 this.line = new Kinetic.Line({
			points: [this.from.getX(), this.from.getY(), this.to.getX(), this.to.getY()],
			stroke: 'black',
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

Connection.prototype.setIntersection = function(intersection){
	if (!intersection){
		this.intersections = new Array();
	}else{
		this.intersections[this.intersections.length] = intersection;
	}
	this.updateColor();
}

Connection.prototype.removeIntersection = function(intersection){
	for (var i = 0; i < this.intersections.length; i++){
		if (this.intersections[i] == intersection){
			this.intersections.splice(i,1);
		}
	}
	this.updateColor();
}

Connection.prototype.updateColor = function(){
	this.line.setStroke(this.intersections.length > 0 ? "red" : "black");
	this.line.getLayer().draw();
}

Connection.prototype.workingColor = function(){
	this.line.setStroke("green");
	this.line.getLayer().draw();
}

Connection.prototype.targetColor = function(){
	this.line.setStroke("blue");
	this.line.getLayer().draw();
}

Connection.prototype.hasDot = function(dot){
	return (this.from == dot || this.to == dot);
}

function Node(dot, id){
	this.imageDot = dot;
	this.imageLines = new Array();
	this.nodes = new Array();
	this.id = id;
}

Node.prototype.addNode = function(node){
	this.nodes[this.nodes.length] = node;
}

Node.prototype.addLine = function(line){
	this.imageLines[this.imageLines.length] = line;
}


function EntangledSolver() {
		this.nodes = new Array();
		this.connections = new Array();
		this.supportedCommands = ["addNode","moveNode","deleteNode","addLine","deleteLine","undo","selectNode","selectLine","removeSelected","selectObj","dragStart","dragEnd","dragNode"];
		this.commandsToExecute = new Array();
		this.selectionColor = "blue";
		this.selectionMode = true;
		this.autoPlayMove = 1000;
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
			 solver.executeCommand({name:"addNode", target:getDot(solver.lastDrawnImage.stage.getPointerPosition())},solver.mathStage);
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
					solver.executeCommand({name:command},this.mathStage);
				});
			}
	  }
}

EntangledSolver.prototype.refreshDots = function(){
	for (var i = 0; i < this.commandsToExecute.length; i++){
			if ("addNode" == this.commandsToExecute[i].name){
				var pos = {x:this.commandsToExecute[i].target.getX(),y:this.commandsToExecute[i].target.getY()};
				var old = this.commandsToExecute[i].target;
				var newDot = getDot(pos);
				this.commandsToExecute[i].target = newDot;
				reFreshCommandLinesForDotWithDot(this.commandsToExecute,old,newDot);
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

EntangledSolver.prototype.renderToStage = function(stage, refresh){
	stage.clear();
	this.unbindNodes();
	if (refresh){
		this.refreshDots();
	}
	for (var i = 0; i < this.commandsToExecute.length; i++){
			if ("addNode" == this.commandsToExecute[i].name){
				this.commandsToExecute[i].object = this.addNewNode(this.commandsToExecute[i].target,stage);
			}else if ("addLine" == this.commandsToExecute[i].name){
				this.commandsToExecute[i].object = this.addNewLine(this.commandsToExecute[i].from,this.commandsToExecute[i].to,stage);
			}
	}
}

EntangledSolver.prototype.autoPlay = function(){
	var solver = this;
	this.timeInterval = 100;
	this.totalTime = 2000;
	this.moveDot(0,1);
}

EntangledSolver.prototype.moveDot = function(commandIndex,step,started){
	var solver = this;
	var steps = this.totalTime / this.timeInterval;
	var command = commandIndex;
	var toStep = 0;
	var startedNew;
	if (step <= steps){
		var stepMove = step / steps;
		var dot = findNodeById(this.nodes,this.moveCommands[commandIndex].id).imageDot;
		if (!this.selectedObject || this.selectedObject.obj != dot){
			this.selectObj(dot);
		}
		startedNew = started ? started : {x:dot.getX(), y: dot.getY()};
		var to = this.moveCommands[commandIndex];
		dot.setX(startedNew.x+(to.x - startedNew.x)*stepMove);
		dot.setY(startedNew.y+(to.y - startedNew.y)*stepMove);
		dot.getLayer().draw();
		this.updateMovingDot(dot);
		toStep = step + 1;
	}else{
		if (commandIndex < (this.moveCommands.length - 1)){
			toStep = 1;
			command = commandIndex + 1;
		}else{
			return;
		}
	}
	
	window.setTimeout(function(){
			solver.moveDot(command,toStep,startedNew);
		},this.timeInterval);
		 
}

EntangledSolver.prototype.unbindNodes = function(){
	for (var i = 0; i < this.nodes.length; i++){
		this.nodes[i].imageDot.off("click");
		this.nodes[i].imageDot.off("dragstart");
		this.nodes[i].imageDot.off("dragend");
		this.nodes[i].imageDot.off("dragmove");
	}
	this.nodes = new Array();
	this.connections = new Array();
}

EntangledSolver.prototype.executeCommand = function(command,stage){
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
	this.renderToStage(stage);
}

EntangledSolver.prototype.addNewNode = function(dot,stage){
	var solver = this;
	var node = new Node(dot,this.nodes.length);
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
		//solver.updateDot(this);
	});
	
	dot.on("dragmove", function(){
		solver.updateMovingDot(this);
	});
	
	layer.add(dot);
	stage.add(layer);
	return dot;
}

EntangledSolver.prototype.updateMovingDot = function(dot){
	var node = findNodeByDot(this.nodes,dot);
	for (var i=0; i < node.imageLines.length; i++){
		node.imageLines[i].updateLine(dot);
	}
	this.updateDot(dot);
}

EntangledSolver.prototype.updateDot = function(dot){
	var connections = separateConnections(this.connections, dot);
	var intersections = 0;
	target : for (var i = 0; i < connections.target.length; i++){
				var conn1 = connections.target[i];
				conn1.setIntersection(false);
				conn1.workingColor();
				for (var j = 0; j < connections.rest.length; j++){
					var conn2 = connections.rest[j];
					conn2.targetColor();
					if (!(conn2.hasDot(conn1.from) || conn2.hasDot(conn1.to)) && intersect(conn1, conn2)){
						conn1.setIntersection(conn2);
						conn2.setIntersection(conn1);
						//connections.rest.splice(j,1);
						//continue target;
						intersections ++;
					}else{
						conn2.removeIntersection(conn1);
					}
				}
				conn1.updateColor();
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
				this.executeCommand({name:'addLine',from:this.selectedObject.obj,to:obj},this.mathStage);
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

EntangledSolver.prototype.addNewLine = function(from,to,stage){
	var solver = this;
	var layer = new Kinetic.Layer();
	var connection = new Connection(from,to);
	this.connections[this.connections.length] = connection;
	var line = connection.getLine();
	var nodeFrom = findNodeByDot(solver.nodes,from);
	var nodeTo = findNodeByDot(solver.nodes,to);
	nodeFrom.addNode(to);
	nodeFrom.addLine(connection);
	nodeTo.addNode(from);
	nodeTo.addLine(connection);
	
	layer.add(line);
	stage.add(layer);
	layer.moveToBottom();
	this.updateDot(to);
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

EntangledSolver.prototype.play = function(container){
	var solver = this;
	this.selectionMode = true;
	this.mathStage.clear();
	this.playStage = new Kinetic.Stage({
        container: container.selector,
		width: container.width,
		height: container.height
	  });
	this.renderToStage(this.playStage, true);
}

EntangledSolver.prototype.callSolver = function(success){
	var solver = this;
	var myWorker = new Worker("js/worker.js");

	myWorker.onmessage = function (oEvent) {
	  console.log("Worker said : " + oEvent.data);
	  solver.makeMoveCommands(oEvent.data);
	  if (typeof(success) == "function") {
		success();
	  }
	};
	
	var graphSize = this.nodes.length;
	var connectionsSize = this.connections.length * 2;
	var array = [];
	var count = 0;
	for (var i = 0; i < this.connections.length; i++){
		array[count++] = findNodeByDot(this.nodes,this.connections[i].from).id;
		array[count++] = findNodeByDot(this.nodes,this.connections[i].to).id;
	}
	var json = JSON.stringify({array:array,graphSize:graphSize});
	myWorker.postMessage(json);
}

EntangledSolver.prototype.makeMoveCommands = function(points){
	this.moveCommands = new Array();
	var maxX = points[0].x;
	var maxY = points[0].y;
	for (var i = 0; i < points.length; i++){
		this.moveCommands[this.moveCommands.length] = points[i];
		maxX = Math.max(maxX,points[i].x);
		maxY = Math.max(maxY,points[i].y);
	}
	var max = Math.max(maxX,maxY);
	this.maxWidth = 800;
	var m = this.maxWidth / (max + 2);
	for (var i = 0; i < this.moveCommands.length; i++){
		this.moveCommands[i].x = this.moveCommands[i].x * m + (this.maxWidth / (max + 1));
		this.moveCommands[i].y = this.moveCommands[i].y * m + (this.maxWidth / (max + 1));		
	}
	
	return (this.moveCommands.length > 0);
}


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



function findNodeById(nodes,id){
	for (var i = 0; i < nodes.length; i++){
		if (nodes[i].id == id)
			return nodes[i];
	}
}


function reFreshCommandLinesForDotWithDot(commands,oldDot,newDot){
	for (var i = 0; i < commands.length; i++){
		if ("addLine" == commands[i].name ){
			if(commands[i].from == oldDot)
				commands[i].from = newDot;
			if(commands[i].to == oldDot)
				commands[i].to = newDot;
		}
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

function intersect(conn1, conn2){
	var p1 = {x:conn1.from.getX(),y:conn1.from.getY()};
	var p2 = {x:conn1.to.getX(),y:conn1.to.getY()};
	var q1 = {x:conn2.from.getX(),y:conn2.from.getY()};
	var q2 = {x:conn2.to.getX(),y:conn2.to.getY()};
	
	return intersection(p1.x,p1.y,p2.x,p2.y,q1.x,q1.y,q2.x,q2.y);
}

function intersection(
     x1, y1, x2, y2, 
     x3,  y3,  x4, y4
  ) {
    var d = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    if (d == 0) return false;
    
    var xi = ((x3-x4)*(x1*y2-y1*x2)-(x1-x2)*(x3*y4-y3*x4))/d;
    var yi = ((y3-y4)*(x1*y2-y1*x2)-(y1-y2)*(x3*y4-y3*x4))/d;
    
    if (xi < Math.min(x1,x2) || xi > Math.max(x1,x2)) return false;
    if (xi < Math.min(x3,x4) || xi > Math.max(x3,x4)) return false;
    return true;
  }

function separateConnections(connections, dot){
	var targetConnections = new Array();
	var restConnections = new Array();
	
	for (var i = 0; i < connections.length; i++){
		if (connections[i].hasDot(dot)){
			targetConnections[targetConnections.length] = connections[i]; 
		}else{
			restConnections[restConnections.length] = connections[i];
		}
	}
	
	return {target: targetConnections, rest: restConnections}
}

function rgbToHex(r, g, b) {
    if (r > 255 || g > 255 || b > 255) throw "Invalid color component";
    return ((r << 16) | (g << 8) | b).toString(16);
}
