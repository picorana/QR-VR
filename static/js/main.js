var camera, scene, renderer, controls, cube, texture_placeholder, container, creatureplane;
var raycaster, mouse, info;
var objects = [];

function render() { 
    requestAnimationFrame( render );
    controls.update(); 
    renderer.render( scene, camera ); 
} 

function init(){
	// i map_id possibili sono 0 e 1 per ora
	var map_id = getParameterByName("mapid");

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
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
	scene = new THREE.Scene();
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	//document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	//document.addEventListener( 'touchend', onDocumentTouchEnd, false );
	
	//document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	//document.addEventListener( 'touchend', onDocumentTouchStart, false );

	camera.position.z = 2;
    
    container = document.getElementById( 'container' );
    texture_placeholder = document.createElement( 'canvas' );
	texture_placeholder.width = 128;
	texture_placeholder.height = 128;

	info = document.getElementById('info');
	
	var context = texture_placeholder.getContext( '2d' );
	context.fillStyle = 'rgb( 200, 200, 200 )';
	context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );

    //renderer = new THREE.WebGLRenderer();
    renderer = new THREE.CanvasRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild(renderer.domElement);

    controls = new DeviceOrientationController( camera, renderer.domElement );
    controls.connect();
    window.addEventListener( 'resize', onWindowResize, false );

    var skyboxmaterials = [];
    for (var path of location_json.map.skybox){ skyboxmaterials.push(loadTexture(path)); }
	var skyboxmesh = new THREE.Mesh( 
		new THREE.BoxGeometry( 300, 300, 300, 7, 7, 7 ), 
		new THREE.MultiMaterial( skyboxmaterials ) );
	skyboxmesh.scale.x = - 1;
	scene.add( skyboxmesh );

	var creaturematerial = loadTexture( location_json.creature.texture );
	creatureplane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), creaturematerial);
	creatureplane.material.side = THREE.DoubleSide;
	creatureplane.position = location_json.creature.position;
	scene.add(creatureplane);
	objects.push(creatureplane);
}

function checkTouchIntersection(event){
	mouse.x = (event.touches[0].clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.touches[0].clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {
		info.innerHTML = info.innerHTML + '<br>clicked!';
	}
}

function checkClickIntersection(event){
	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {
		info.innerHTML = info.innerHTML + '<br>clicked!';
	}
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function loadTexture( path ) {

	var texture = new THREE.Texture( texture_placeholder );
	var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5, shading:THREE.FlatShading, transparent:true } );

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
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

init();


