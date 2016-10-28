var canvas_placeholder, context, texture_loader, renderer, camera, scene, raycaster, mouse, controls, effects, manager, reticle;
var frameTime = 0, lastLoop, thisLoop, fpsOut, filterStrength = 20;
var updateFcts	= [];
var ring_texture_array = [];

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var clickable_objects = [];
var clicked_objects = [];

var rotators = [];

var ringIndex = 0;
var mixer, action1, sceneAnimationClip1;

var videoImageContext, videoImage, video;

var clock = new THREE.Clock();
var scalefactor = [];
var scalesum = [];

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

		
	window.addEventListener( 'orientationchange', 	onScreenOrientationChange, 	false );
  	window.addEventListener( 'resize', 				onWindowResize, 			false );
  	window.addEventListener( 'mousedown', onDocumentMouseDown , false );

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

	var loader = new THREE.ObjectLoader();
	loader.load("../static/json/048_OysterTestSceneISS.json",function ( obj ) {
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
	    	reticle.add_collider(oyster);

	    	clickable_objects.push(oyster);

	    	scalefactor[i] = -0.1;
	    	scalesum[i] = 0;

	    	//oyster.material.wireframe = true;
	    	if (oyster.name.includes("gem")) return;
	    	else {
	    		oyster.material.wireframe=true;
	    		oyster.material.transparent = true;
	    		oyster.material.opacity = 0;
	    	}

			oyster.ongazeover = function(){
				console.log("gaze over: " + oyster.name);
				scalesum[i] = 0.1;
			};

			oyster.ongazeout = function(){
				console.log("gaze out: " + oyster.name);
				scalesum[i] = -0.1;
				video.pause();
			};

		    oyster.children.forEach(function (child, j){

		    	clickable_objects.push(child);
		    	//console.log(child);
		    	if( child.name == "EmptyKelvin") return;
		    	if( child.material.name.includes("wire") ) child.material.wireframe=true;
		    	if( child.name.includes("bottone") ) {
		    		child.material.wireframe=true;
		    		child.material.transparent = true;
	    			child.material.opacity = 0.1;
		    	}
				
		    	if ( child.name.includes("content") ){  
				    var movieMaterial = new THREE.MeshBasicMaterial( { map: videoTexture, overdraw: true, side:THREE.DoubleSide } );
				    //var movieGeometry = new THREE.PlaneGeometry( 3, 1);
				    child.material = movieMaterial;
				    //child.geometry = movieGeometry;
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

		    	if ( child.name.includes("module") ){ 

		    		reticle.add_collider(child);
		    		child.ongazeover = function(){
		    			console.log(child.name);
		    		};
		    		child.material = new THREE.MeshBasicMaterial({color:0x555555});


		    		child.children.forEach(function (module, k){
		    			clickable_objects.push(module); 
		    			module.material = new THREE.MeshBasicMaterial({color:0x555555});
		    			
		    			if (module.userData.iss_module!=null){

		    				console.log(module.name);
		    				reticle.add_collider(module);
		    				module.ongazeover = function(){
		    					module.material = new THREE.MeshBasicMaterial({color:0xffffff});;
		    					console.log("module on gaze over: " + module.name);
		    				};

		    				module.ongazeout = function(){
		    					module.material = new THREE.MeshBasicMaterial({color:0x555555});
		    					console.log("module gaze out: " + module.name);
		    				};
		    			}
		    			
		    		});
		    	}

		    	if (child.name.includes("panel")){
		    		//child.material.emissive = new THREE.Color( 0xffffff );
		    	}
		    	if (child.name.includes("coso") || child.name.includes("rotator") || child.name.includes("emissive")){
		    		//child.material.emissive = new THREE.Color( 0xffffff );
		    		child.material.emissive = child.material.color;
		    	}

		    	if ( child.name.includes("rotator")){
                    child.animateRot = function (child){
                        child.rotateZ(Math.random()*0.3);
                    };
                    rotators.push(child);
                }
		    });
		});

		mixer = new THREE.AnimationMixer( obj );
	    action1 = mixer.clipAction( sceneAnimationClip1 );
	    action1.loop=THREE.LoopRepeat;
	    action1.play();

	    scene.add( obj );
	    //console.log(obj);
	});

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

	if (rotators.length > 0) rotators.forEach(function(r) {
        r.animateRot(r);
    });

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

	try {
		scene.children[2].children.forEach(function(oyster, i){
			scalefactor[i] += scalesum[i];
			//console.log(oyster.name);
			//scalefactor[i] = 1;
			if (scalefactor[i]<=0.001) scalefactor[i] = 0.001;
			if (scalefactor[i]>=1) scalefactor[i] = 1;
			oyster.children.forEach(function(child, j){
				child.scale.set(scalefactor[i], scalefactor[i], scalefactor[i]);
			});
		});
	} catch (e){
		//console.log(e);
	}

	
}

function buildSkybox(skyboxTextureArray){
	var skyboxmaterials = [];
    for (var i=0; i<skyboxTextureArray.length; i++){ 
    	skyboxmaterials[i] = createMaterial(skyboxTextureArray[i]);
    }

	var skyboxmesh = new THREE.Mesh( new THREE.BoxGeometry( 500, 500, 500, 7, 7, 7 ), new THREE.MultiMaterial( skyboxmaterials ) );
	skyboxmesh.name = "skybox";
	skyboxmesh.scale.x = - 1;
	scene.add( skyboxmesh );
}

function createMaterial( path ) {
    var texture = THREE.ImageUtils.loadTexture(path);
    var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5, transparent:false, shading:THREE.FlatShading } );
 
    return material; 
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

function onDocumentMouseDown( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( clickable_objects ); 

    if ( intersects.length > 0 ) {
        intersects[0].object.ongazeover();
    }

}

function checkIfLookingAtModules( event ) {

    event.preventDefault();

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( clickable_objects ); 

    if ( intersects.length > 0 ) {
        intersects[0].object.ongazeover();
    }

}

init();
console.log("finished");