importScripts('graphSolver.js', 'ESHelper.js'); 
onmessage = function(e) {
	var obj = JSON.parse(e.data);
	var buf = Module._malloc(4*obj.array.length);
	var array = new Int32Array(obj.array.length);
	for (var i = 0; i < obj.array.length; i++){
		array[i] = obj.array[i];
	}
	Module.HEAPU8.set(new Uint8Array(array.buffer, array.byteOffset, array.byteLength), buf);
	var calculate = Module.cwrap('getGraphPositions', 'int*',['number','number','number']);
	var solution = calculate(buf,obj.array.length,obj.graphSize);
	var points = new Array();
	if (true)//check if solution
	{
		for (var i = 0; i < obj.graphSize * 2; i += 2){
			points[points.length] = {id:i/2,x:getValue(solution+4*i,'int*'),y:getValue(solution+4*(i+1),'int*')};
		}
	}
	Module._free(buf);
	postMessage(points);
};
