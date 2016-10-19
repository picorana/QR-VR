var canvas_placeholder, context, texture_loader, renderer, camera, scene, raycaster, mouse, controls, effects, manager, reticle;
var frameTime = 0, lastLoop, thisLoop, fpsOut, filterStrength = 20;

function init(){

	fpsOut = document.getElementById('fps');
	lastLoop = new Date();
	setInterval(function(){
	  	fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps"; 
		},1000);


	var is_webgl_enabled 		= Detector.webgl? true : false;
	var can_handle_orientation 	= handleOrientation();
	var is_mobile 				= isMobile();
	var browser 				= detect_browser();

  	info = document.getElementById('info');
  	info.innerHTML += 
		"webgl: " + is_webgl_enabled +
		"<br> browser: " + browser +
		(is_mobile? " mobile" : " desktop") +
		" " + navigator.platform;

	// note: orientationchange = screen rotation, deviceorientation = gyroscope
	window.addEventListener( 'orientationchange', 	onScreenOrientationChange, 	false );
  	window.addEventListener( 'deviceorientation', 	handleOrientation, 			false );
  	window.addEventListener( 'resize', 				onWindowResize, 			false );

	var map_id = getParameterByName( "map_id" );
	$.getJSON( "/static/json/locations.json", function( json, status ) { 
		initScene(json.locations[map_id]);	
	})
  	.done(	function() 									{ 	render();	})
  	.fail(	function(jqXHR, textStatus, errorThrown) 	{ console.log( "getJSON request failed! " + textStatus); })
  	.always(function() 									{ console.log( "complete" );});
}

function initScene( location_json ){
	camera 				= new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.3, 10000 );
	scene 				= new THREE.Scene();
	raycaster 			= new THREE.Raycaster();
	mouse 				= new THREE.Vector2();
	renderer 			= new THREE.WebGLRenderer({ antialias: true });
	container 			= document.getElementById( 'container' );
	canvas_placeholder 	= document.createElement( 'canvas' );
	texture_loader		= new THREE.TextureLoader();
	controls 			= new THREE.VRControls(camera);
	effect 				= new THREE.VREffect(renderer);
	manager 			= new WebVRManager(renderer, effect);
	reticle 			= vreticle.Reticle(camera);

	scene.add(camera);

	context = canvas_placeholder.getContext( '2d' );
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect( 0, 0, canvas_placeholder.width, canvas_placeholder.height );

	renderer.setSize( window.innerWidth, window.innerHeight );
	effect.setSize(window.innerWidth, window.innerHeight);
	container.appendChild( renderer.domElement );

	// THIS IS A TEST 
	var geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
	var material = new THREE.MeshNormalMaterial();
	var cube = new THREE.Mesh(geometry, material);
	reticle.add_collider(cube);
	var texture = texture_loader.load("../static/assets/ring.gif");
	cube.ongazelong = function(){
	  	this.material = reticle.get_random_hex_material();
	}

	cube.ongazeover = function(){
		material.map = texture;
		reticle.reticle_object.material = material;
	}

	cube.ongazeout = function(){
	  //this.material = reticle.default_material();
	  material.map = null;
	  reticle.reticle_object.material = material;
	}
	cube.position.z = -1;
	scene.add(cube);
	// END TEST

	buildSkybox(location_json.map.skybox);
}

function render(){
	requestAnimationFrame( render );
	manager.render(scene, camera);
	reticle.reticle_loop();

	controls.update(); 

	var thisFrameTime = (thisLoop = new Date()) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;
}

function buildSkybox(skyboxTextureArray){
	var skyboxmaterials = [];
    for (var i=0; i<skyboxTextureArray.length; i++){ 
    	var path = skyboxTextureArray[i];
    	var texture = texture_loader.load(path, function( texture ){
    		var material = new THREE.MeshBasicMaterial( { 
    			map: texture, 
    			overdraw: 0.5, 
    			shading:THREE.FlatShading, 
    			transparent:true 
    		});
    		material.transparent = false;
    		skyboxmaterials.push(material); 
    	});
    }

	var skyboxmesh = new THREE.Mesh( 
		new THREE.BoxGeometry( 300, 300, 300, 7, 7, 7), 
		new THREE.MultiMaterial( skyboxmaterials ) );
	skyboxmesh.scale.x = - 1;
	scene.add( skyboxmesh );

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