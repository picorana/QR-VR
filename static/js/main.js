var camera, scene, renderer, controls, cube, texture_placeholder, container, creatureplane;

function render() { 
    requestAnimationFrame( render );
    controls.update(); 
    renderer.render( scene, camera ); 
} 

function init(){
	$.getJSON( "/static/json/locations.json", function( json, status ) { 
		//console.log(json.locations[0]);
		initScene(json.locations[1]);
	})
  		.done(function() { 
  			console.log( "second success" ); 
  			render();
  		})
  		.fail(function(jqXHR, textStatus, errorThrown) { console.log('getJSON request failed! ' + textStatus); })
  		.always(function() { console.log( "complete" );});
}

function initScene(location_json){
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
	camera.position.z = 5;
    scene = new THREE.Scene();

    container = document.getElementById( 'container' );
    texture_placeholder = document.createElement( 'canvas' );
	texture_placeholder.width = 128;
	texture_placeholder.height = 128;
	
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

init();


