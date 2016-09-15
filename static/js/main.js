var camera, scene, renderer, controls, cube, texture_placeholder, container, creatureplane;
var raycaster, mouse, info;
var objects = [], caught = new Set();

var is_webgl_enabled;

var filterStrength = 20;
var frameTime = 0, lastLoop, thisLoop, fpsOut;

function render() { 
    requestAnimationFrame( render );
    controls.update(); 
    renderer.render( scene, camera ); 

    // fps display text update
    var thisFrameTime = (thisLoop=new Date) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;
} 

function init(){

	// fps display text setup
	fpsOut = document.getElementById('fps');
	lastLoop = new Date;
	setInterval(function(){
	  fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps";
	},1000);

	// i map_id possibili sono 0 e 1 per ora
	var map_id = getParameterByName("map_id");

	// load data from json file "locations.json"
	$.getJSON( "/static/json/locations.json", function( json, status ) { 
		initScene(json.locations[map_id]);
	})
  	.done(function() { 
  		render();
  	})
  	.fail(function(jqXHR, textStatus, errorThrown) { console.log('getJSON request failed! ' + textStatus); })
  	.always(function() { console.log( "complete" );});
}

function initScene(location_json){

	is_webgl_enabled = Detector.webgl? true : false;

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
	scene = new THREE.Scene();
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();
    
    container = document.getElementById( 'container' );
    if (is_webgl_enabled) texture_placeholder = document.createElement( 'canvas' );
    else texture_placeholder = document.createElement( 'div' );
	texture_placeholder.width = 32;
	texture_placeholder.height = 32;

	info = document.getElementById('info');
	info.innerHTML += "<br>webgl: " + is_webgl_enabled;
	
	if (is_webgl_enabled){
		var context = texture_placeholder.getContext( '2d' );
		context.fillStyle = 'rgb( 200, 200, 200 )';
		context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );
	}

    renderer = is_webgl_enabled? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
    //renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild(renderer.domElement);

    controls = new DeviceOrientationController( camera, renderer.domElement );
    controls.connect();
    window.addEventListener( 'resize', onWindowResize, false );

    buildSkybox(location_json.map.skybox);
    buildCreatures(location_json.creatures);

    //var light = new THREE.AmbientLight( 0xffffff );
	//scene.add(light);

}

function buildSkybox(skyboxTextureArray){
	var skyboxmaterials = [];
    for (var path of skyboxTextureArray){ skyboxmaterials.push(loadTexture(path)); }
	var skyboxmesh = new THREE.Mesh( 
		new THREE.BoxGeometry( 300, 300, 300, 7, 7, 7), 
		new THREE.MultiMaterial( skyboxmaterials ) );
	skyboxmesh.scale.x = - 1;
	scene.add( skyboxmesh );
}

function buildCreatures(creatureArray){
	var id = 0;
	for (var creature of creatureArray){
		var creaturematerial = loadTexture( creature.texture );
		creaturematerial.transparent = true;
		creatureplane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), creaturematerial);
		creatureplane.material.side = THREE.DoubleSide;
		creatureplane.position.x = creature.position[0];
		creatureplane.position.y = creature.position[1];
		creatureplane.position.z = creature.position[2];
		creatureplane.lookAt( camera.position );
		creatureplane.frustumCulled = false;
		creatureplane.name = "creature" + id++;
		scene.add(creatureplane);
		

		objects.push(creatureplane);
	}
}

function checkTouchIntersection(event){
	mouse.x = (event.touches[0].clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.touches[0].clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {
		catchCreature(intersects[0]);
	}
}

function checkClickIntersection(event){
	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {
		catchCreature(intersects[0]);
	}
}

function catchCreature(clickedElement){
	if (!caught.has(objects.indexOf(clickedElement.object))){
		info.innerHTML = info.innerHTML + '<br>clicked! id=' + objects.indexOf(clickedElement.object);
		//delete objects[objects.indexOf(clickedElement.object)];

		scene.remove(clickedElement.object);
		caught.add(objects.indexOf(clickedElement.object));
	}
	
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function loadTexture( path ) {

	var texture = new THREE.Texture( texture_placeholder );
	var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5, shading:THREE.FlatShading, transparent:false } );
	//var material = new THREE.MeshBasicMaterial( { map: texture} );

	var image = new Image();
	image.onload = function () {

		texture.image = this;
		texture.needsUpdate = true;

	};
	image.src = path;

	return material;
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


