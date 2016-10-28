var canvas_placeholder, context, texture_loader, renderer, camera, scene, raycaster, mouse, controls, effects, manager, reticle;
var frameTime = 0, lastLoop, thisLoop, fpsOut, filterStrength = 20;
var updateFcts	= [];
var ring_texture_array = [];

var ringIndex = 0;
var mixer, action1, sceneAnimationClip1;

var clock = new THREE.Clock();
var cssrenderer;


function init(){
	//---Print fps onscreen every 1s
	fpsOut = document.getElementById('fps');
	lastLoop = new Date();
	setInterval(function(){
	  	fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps"; 
		},1000);

	//---Check device capacities
	var is_webgl_enabled 		= Detector.webgl? true : false;
	var can_handle_orientation 	= handleOrientation();
	var is_mobile 				= isMobile();
	var browser 				= detect_browser();

	//---Print device info onscreen
  	info = document.getElementById('info');
  	info.innerHTML += 
		"webgl: " + is_webgl_enabled +
		"<br> browser: " + browser +
		(is_mobile? " mobile" : " desktop") +
		" " + navigator.platform;

	//---Attach listeners to the devices aspect changes, and adjust screen
	// note: orientationchange = screen rotation, deviceorientation = gyroscope
	window.addEventListener( 'orientationchange', 	onScreenOrientationChange, 	false );
  	//window.addEventListener( 'deviceorientation', 	handleOrientation, 			false );
  	window.addEventListener( 'resize', 				onWindowResize, 			false );

  	//---Get scene (map_id) parameters from url
	var map_id = getParameterByName( "map_id" );
	
	//---Load JSON containing specs about the diferents scenes, then initializate the current scene
	$.getJSON( "/static/json/locations.json", function( json, status ) { 
		initScene(json.locations[map_id]);	
	})
  	.done(	function() 									{ 		})
  	.fail(	function(jqXHR, textStatus, errorThrown) 	{ console.log( "getJSON request failed! " + textStatus); })
  	.always(function() 									{ console.log( "complete" );});
}

function initScene( location_json ){
	//--Get the DOM elements where the renderer will be placed
	container 			= document.getElementById( 'container' );
	canvas_placeholder 	= document.createElement( 'canvas' );

	//---Instantiate the basic THREE elements to construct the scene
	camera 				= new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.3, 10000 );
	scene 				= new THREE.Scene();
	raycaster 			= new THREE.Raycaster();
	mouse 				= new THREE.Vector2();
	renderer 			= new THREE.WebGLRenderer({ antialias: true });
	texture_loader		= new THREE.TextureLoader();
	controls 			= new THREE.VRControls(camera);
	effect 				= new THREE.VREffect(renderer);
	manager 			= new WebVRManager(renderer, effect);
	reticle 			= vreticle.Reticle(camera);
	cssrenderer 		= new THREE.CSS3DRenderer();

	//---First element added to scene: the camera
	scene.add(camera);

	//---Create the canvas?? 
	context = canvas_placeholder.getContext( '2d' );
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect( 0, 0, canvas_placeholder.width, canvas_placeholder.height );

	//---Append the renderer to the canvas
	renderer.setSize( window.innerWidth, window.innerHeight );
	effect.setSize(window.innerWidth, window.innerHeight);
	container.appendChild( renderer.domElement );
	cssrenderer.setSize( window.innerWidth/2, window.innerHeight );
	cssrenderer.domElement.style.position = 'absolute';
	cssrenderer.domElement.style.top = 0;
	container.appendChild(cssrenderer.domElement);

	var cssrenderer2 = JSON.parse(JSON.stringify(cssrenderer));
	console.log(cssrenderer);
	console.log(cssrenderer2);
	//container.appendChild(cssrenderer2.domElement);

	buildCSSElement('/static/html/testMenu.html', 100, 0, -200, 0, 0, 0);

	// THIS IS A TEST 
	//--Create the AIM element
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
	//-- Finished AIM element

	//--Load the scene on JSON, containing the Oysters, Panels, Buttons and content Meshes
	var loader = new THREE.ObjectLoader();
	loader.load("../static/json/048_MenuMeshChildren.json",function ( obj ) {
		//---Rotate the original scene to align it with the THREE generated Skybox
	    obj.rotation.y = Math.PI;
	    obj.rotation.x = Math.PI/2;
	    obj.position.z = -4;

	    //---Get the Animations on the scene. The exporter creates only one, with diferent tracks for each of the animated propoerties of each object
	    //Ex: "animations":[{"tracks":[ {panel00.position:...} , {panel00.quaternion:...} ,..., {button02.scale} ]}]
	    sceneAnimationClip1 = obj.animations[0];

	    //---The top level elements on the scene are the "oysters". Here we loop on each of it's children
	    obj.children[0].children.forEach(function (child, i){
	    	//---Changing the material to wireframe, only for some of them
	    	if( !child.name.includes("Content") && !child.name.includes("Panel") ) child.material.wireframe=true;
	    	//---Creating a CSS element on which display a video, and then adjusting the position manualy in order to align it with the panel :P
	    	if ( child.name.includes("Content") ){
	    		buildCSSElement('https://www.youtube.com/embed/LRP8d7hhpoQ', obj.children[0].position.x + child.position.x*62, -child.position.y*35, -obj.children[0].position.z*440, 0, obj.children[0].rotation.y*1.1, 0);
	    		console.log("child posx: " + child.position.x);
	    		console.log("oyster roty: " + obj.children[0].rotation.y);
	    	}
	    	//--Setting the emissive color of each "Panel" to white
	    	//--TODO: Set the material "emmisive map" to use the texture, obtaining a emmisive colored object. 
	    	if (child.name.includes("Panel")){
	    		child.material.emissive = new THREE.Color( 0xffffff );
	    	}
	    });

	    //---Create a Animation mixer and pass the loaded scene
		mixer = new THREE.AnimationMixer( obj );
		//---Add the loaded action and play it
	    action1 = mixer.clipAction( sceneAnimationClip1 );
	    action1.loop=THREE.LoopRepeat;
	    action1.play();

	    //---Add the loaded scene to the main scene
	    scene.add( obj );
	    console.log(obj);
	});
	// END TEST
	

	//---Build the skybox
	buildCSSSkybox(location_json.map.skybox);
	//buildSkybox(location_json.map.skybox);
	
	//---Render :P
	render();
}

function render(){
	requestAnimationFrame( render );
	manager.render(scene, camera);
	reticle.reticle_loop();

	cssrenderer.render( scene, camera );

	controls.update(); 

	var delta = 0.75 * clock.getDelta();
	mixer.update(delta);

	var thisFrameTime = (thisLoop = new Date()) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;


	updateFcts.forEach(function(updateFn){
		updateFn(frameTime/1000, thisFrameTime/1000);
	});

	
}

function testEvent(){
	var event = new CustomEvent("superbutton_clicked_event", { 'detail': 'increment' });
		    window.dispatchEvent(event);
}

function buildCSSSkybox(skyboxTextureArray){
	var sides = [
					{
						url: skyboxTextureArray[0],
						position: [ -512, 0, 0 ],
						rotation: [ 0, Math.PI / 2, 0 ]
					},
					{
						url: skyboxTextureArray[1],
						position: [ 512, 0, 0 ],
						rotation: [ 0, -Math.PI / 2, 0 ]
					},
					{
						url: skyboxTextureArray[2],
						position: [ 0,  512, 0 ],
						rotation: [ Math.PI / 2, 0, Math.PI ]
					},
					{
						url: skyboxTextureArray[3],
						position: [ 0, -512, 0 ],
						rotation: [ - Math.PI / 2, 0, Math.PI ]
					},
					{
						url: skyboxTextureArray[4],
						position: [ 0, 0,  512 ],
						rotation: [ 0, Math.PI, 0 ]
					},
					{
						url: skyboxTextureArray[5],
						position: [ 0, 0, -512 ],
						rotation: [ 0, 0, 0 ]
					}
				];

				for ( var i = 0; i < sides.length; i ++ ) {

					var side = sides[ i ];

					var element = document.createElement( 'img' );
					element.setAttribute('draggable', false);
					element.width = 1026; // 2 pixels extra to close the gap.
					element.src = side.url;

					var object = new THREE.CSS3DObject( element );
					object.position.fromArray( side.position );
					object.rotation.fromArray( side.rotation );
					scene.add( object );

				}
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
		new THREE.BoxGeometry( 1000, 1000, 1000, 7, 7, 7), 
		new THREE.MultiMaterial( skyboxmaterials ) );
	skyboxmesh.name = "skybox";
	skyboxmesh.scale.x = - 1;
	scene.add( skyboxmesh );

}

function buildCSSElement(url, posx, posy, posz, rotx, roty, rotz){

	var element = document.createElement( 'iframe' );
	element.src = url;
	element.style.width = '980px';
	element.style.height = '560px';
	element.style.border = '0px';

	var object = new THREE.CSS3DObject( element );
	object.position.x = posx;
	object.position.y = posy;
	object.position.z = posz;
	object.rotation.x = rotx;
	object.rotation.y = roty;
	object.rotation.z = rotz;
	object.scale.x = 0.25;
	object.scale.y = 0.25;
	scene.add( object );
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
