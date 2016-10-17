var canvas_placeholder, renderer, camera;

function init(){

	// display fps
	fpsOut = document.getElementById('fps');
	lastLoop = new Date();
	//setInterval(function(){
	//  	fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps"; 
	//	},1000);

	// do we have webgl?
	is_webgl_enabled = Detector.webgl? true : false;
	
	info = document.getElementById('info');

	window.addEventListener( 'orientationchange', onScreenOrientationChange, false );
  	window.addEventListener( 'deviceorientation', handleOrientation, false );
  	window.addEventListener( 'resize', onWindowResize, false );

  	info.innerHTML += "webgl: " + is_webgl_enabled
		+ "<br> browser: " + detect_browser() 
		+ (isMobile()? " mobile" : " desktop") 
		+ " " + navigator.platform;

	canvas_placeholder = document.createElement( 'canvas' );
	var context = canvas_placeholder.getContext( '2d' );
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect( 0, 0, canvas_placeholder.width, canvas_placeholder.height );

	renderer = new THREE.WebGLRenderer();
	container.appendChild(renderer.domElement);

	controls = new DeviceOrientationController( camera, renderer.domElement );
	controls.connect();
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

function handleOrientation ( event ){
	canHandleOrientation = event;
}

init();
console.log("finished");