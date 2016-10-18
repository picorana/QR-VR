var canvas_placeholder, renderer, camera;

function init(){

	// display fps
	fpsOut = document.getElementById('fps');
	lastLoop = new Date();
	//setInterval(function(){
	//  	fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps"; 
	//	},1000);

	// understand on what device you are
	var is_webgl_enabled = Detector.webgl? true : false;
	var can_handle_orientation = handleOrientation();
	var is_mobile = isMobile();
	var browser = detect_browser();

  	info = document.getElementById('info');
  	info.innerHTML += 
		"webgl: " + is_webgl_enabled +
		"<br> browser: " + browser +
		(is_mobile? " mobile" : " desktop") +
		" " + navigator.platform;

	if (can_handle_orientation===undefined){
		deviceNotSupported();
		return;
	}

	window.addEventListener( 'orientationchange', onScreenOrientationChange, false );
  	window.addEventListener( 'deviceorientation', handleOrientation, false );
  	window.addEventListener( 'resize', onWindowResize, false );

	canvas_placeholder = document.createElement( 'canvas' );
	var context = canvas_placeholder.getContext( '2d' );
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect( 0, 0, canvas_placeholder.width, canvas_placeholder.height );

	// i map_id possibili sono 0 e 1 per ora
	var map_id = getParameterByName("map_id");

	// load data from json file "locations.json"
	$.getJSON( "/static/json/locations.json", function( json, status ) { 
		//initScene(json.locations[map_id]);	
	})
  	.done(function() { 
  		//render();
  	})
  	.fail(function(jqXHR, textStatus, errorThrown) { console.log('getJSON request failed! ' + textStatus); })
  	.always(function() { console.log( "complete" );});
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// reset canvas on screen orientation change
function onScreenOrientationChange(event){
	controls.disconnect();
	if (window.innerWidth > window.innerHeight) camera = new THREE.PerspectiveCamera( 75, window.innerHeight / window.innerWidth, 1, 1100 );
	else camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1100 );
	renderer.setSize( window.innerWidth, window.innerHeight );
	controls = new DeviceOrientationController( camera, renderer.domElement );
	controls.connect();
	info.innerHTML += "<br>rotation"; 
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return 0;
    if (!results[2]) return 0;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

init();
console.log("finished");