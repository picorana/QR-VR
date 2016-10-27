var canvas_placeholder, context, texture_loader, renderer, camera, scene, raycaster, mouse, controls, effects, manager, reticle;
var frameTime = 0, lastLoop, thisLoop, fpsOut, filterStrength = 20;
var updateFcts	= [];
var ring_texture_array = [];

var ringIndex = 0;
var mixer, action1, sceneAnimationClip1;

var videoImageContext, videoImage, video;

var clock = new THREE.Clock();

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
  	//window.addEventListener( 'deviceorientation', 	handleOrientation, 			false );
  	window.addEventListener( 'resize', 				onWindowResize, 			false );

	var map_id = getParameterByName( "map_id" );
	$.getJSON( "/static/json/locations.json", function( json, status ) { 
		initScene(json.locations[map_id]);	
	})
  	.done(	function() 									{ 		})
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
	var texture = texture_loader.load("../static/assets/ring/frame_0_delay-0.04s.gif");
	for (var i=0; i<20; i++){
		ring_texture_array.push(texture_loader.load("../static/assets/ring/frame_"+i+"_delay-0.04s.gif"));
	}
	texture.needsUpdate = true;
	var ring_material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
	ring_material.needsUpdate = true;
	updateFcts.push(function(delta, now){
		ring_material.map = ring_texture_array[ringIndex];
		ringIndex++;
		if (ringIndex==20) ringIndex=0;
	});
	var cube = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());
	reticle.add_collider(cube);
	
	cube.ongazelong = function(){
	  	this.material = reticle.get_random_hex_material();
	};

	cube.ongazeover = function(){
		//material.map = texture;
		reticle.reticle_object.geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
		reticle.reticle_object.material = ring_material;
	};

	cube.ongazeout = function(){
		reticle.reticle_object.geometry = new THREE.SphereGeometry(0.005, 0.005, 0.005);
	};

	cube.position.z = -5;
	cube.position.x = 2;
	scene.add(cube);

	var loader = new THREE.ObjectLoader();
	loader.load("../static/json/048_MenuMeshChildren.json",function ( obj ) {
	    obj.rotation.y = Math.PI;
	    obj.rotation.x = Math.PI/2;
	    obj.position.z = -4;

	    sceneAnimationClip1 = obj.animations[0];
	    
	    video = document.getElementById('thevideo');
		    		
		videoImage = document.createElement( 'canvas' );
		document.addEventListener( 'click', function ( event ) {
            video.play();
        } );

	    videoImage.width = 560;
	    videoImage.height = 320;
	    videoImageContext = videoImage.getContext( '2d' );
	    videoTexture = new THREE.Texture( videoImage );
	    videoTexture.minFilter = THREE.LinearFilter;
	    videoTexture.magFilter = THREE.LinearFilter;
	    
	    obj.children.forEach(function(oyster, i){

		    oyster.children.forEach(function (child, i){
		    	console.log(child.name);
		    	if( !child.name.includes("Content") && !child.name.includes("Panel") ) child.material.wireframe=true;
		    	if ( child.name.includes("Content") ){
		    		
				    
				    var movieMaterial = new THREE.MeshBasicMaterial( { map: videoTexture, overdraw: true, side:THREE.DoubleSide } );
				    var movieGeometry = new THREE.PlaneGeometry( 2, 2);
				    child.material = movieMaterial;
				    child.geometry = movieGeometry;
				    reticle.add_collider(child);
				    child.ongazelong = function(){
					  	video.play();
					  	reticle.reticle_object.geometry = new THREE.SphereGeometry(0.005, 0.005, 0.005);
					};
					child.ongazeover = function(){
						reticle.reticle_object.geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
						reticle.reticle_object.material = ring_material;
					};
					child.ongazeout = function(){
						video.pause();
						reticle.reticle_object.geometry = new THREE.SphereGeometry(0.005, 0.005, 0.005);
					};
		    	}
		    	if (child.name.includes("Panel")){
		    		child.material.emissive = new THREE.Color( 0xffffff );
		    	}
		    });
		});
		mixer = new THREE.AnimationMixer( obj );
	    action1 = mixer.clipAction( sceneAnimationClip1 );
	    action1.loop=THREE.LoopRepeat;
	    action1.play();

	    scene.add( obj );
	    console.log(obj);
	});
	// END TEST

	buildSkybox(location_json.map.skybox);
	render();
}

function render(){
	requestAnimationFrame( render );
	manager.render(scene, camera);
	reticle.reticle_loop();

	controls.update(); 

	var delta = 0.75 * clock.getDelta();
	mixer.update(delta);

	var thisFrameTime = (thisLoop = new Date()) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;

	if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
        videoImageContext.drawImage( video, 0, 0 );
        if ( videoTexture ) 
            videoTexture.needsUpdate = true;
    }


	updateFcts.forEach(function(updateFn){
		updateFn(frameTime/1000, thisFrameTime/1000);
	});
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
	skyboxmesh.name = "skybox";
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