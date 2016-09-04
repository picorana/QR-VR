var camera, scene, renderer, controls, cube, texture_placeholder, container, creatureplane;
var raycaster, mouse, info;
var particle, particleMaterial;
var objects = [];

function render() { 
    requestAnimationFrame( render );
    controls.update(); 
    renderer.render( scene, camera ); 
} 

function init(){
	// i map_id possibili sono 0 e 1 per ora
	var map_id = getParameterByName("map_id");

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

    particleMaterial = new THREE.SpriteCanvasMaterial( {

					color: 0x000000,
					program: function ( context ) {

						context.beginPath();
						context.arc( 0, 0, 0.5, 0, PI2, true );
						context.fill();

					}

				} );

    buildSkybox(location_json.map.skybox);
    buildCreatures(location_json.creatures);

	
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
		info.innerHTML = info.innerHTML + '<br>clicked!';
		catchCreature(intersects[0]);
	}
}

function checkClickIntersection(event){
	mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
	mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;

	raycaster.setFromCamera( mouse, camera );

	var intersects = raycaster.intersectObjects( objects );

	if ( intersects.length > 0 ) {
		info.innerHTML = info.innerHTML + '<br>clicked!';
		catchCreature(intersects[0]);
	}
}

function catchCreature(clickedElement){
	console.log(objects.indexOf(clickedElement.object));
	delete objects[objects.indexOf(clickedElement.object)];
	clickedElement.object.material.color.setHex( Math.random() * 0xffffff );

	var particle = new THREE.Sprite( particleMaterial );
	particle.position.copy(clickedElement.point);
	particle.scale.x = particle.scale.y = 16;
	scene.add( particle );

	scene.remove(clickedElement.object);
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
    if (!results) return 0;
    if (!results[2]) return 0;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

init();


