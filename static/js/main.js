var camera, scene, renderer, controls, cube, texture_placeholder, container, pikaplane;


function tilt(data){
	document.getElementById("thing").innerHTML = "alpha: " + data[0] + " beta: " + data[1] + " gamma: " + data[2];
}


if (window.DeviceOrientationEvent) {
    window.addEventListener("deviceorientation", function () {
        tilt([event.alpha, event.beta, event.gamma]);
    }, true);
} else if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', function () {
        tilt([event.acceleration.x * 2, event.acceleration.y * 2]);
    }, true);
} else {
    window.addEventListener("MozOrientation", function () {
        tilt([orientation.x * 50, orientation.y * 50]);
    }, true);
}

function render() { 
    requestAnimationFrame( render );
    controls.update(); 
    cube.rotation.x += 0.1; 
    cube.rotation.y += 0.1;
    renderer.render( scene, camera ); 
} 

function init(){
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
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
    //setupControllerEventHandlers( controls );
    window.addEventListener( 'resize', onWindowResize, false );

    //CREATE SKYBOX
    var materials = [
		loadTexture( '/static/assets/skybox/skybox_pz.jpg' ), // right
		loadTexture( '/static/assets/skybox/skybox_px.jpg' ), // left
		loadTexture( '/static/assets/skybox/skybox_py.jpg' ), // top
		loadTexture( '/static/assets/skybox/skybox_ny.jpg' ), // bottom
		loadTexture( '/static/assets/skybox/skybox_nz.jpg' ), // back
		loadTexture( '/static/assets/skybox/skybox_nx.jpg' )  // front
	];
	var mesh = new THREE.Mesh( new THREE.BoxGeometry( 300, 300, 300, 7, 7, 7 ), new THREE.MultiMaterial( materials ) );
	mesh.scale.x = - 1;
	scene.add( mesh );

	//var pikatexture = THREE.TextureLoader( "/static/assets/Pikachu.png" );
	//var pikamaterial = new THREE.MeshBasicMaterial({ map: pikatexture });
	//pikamaterial.map = pikatexture;
	var pikamaterial = loadTexture("/static/assets/Pikachu.png" );
	pikaplane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), pikamaterial);
	pikaplane.material.side = THREE.DoubleSide;
	pikaplane.position.z = 3;
	scene.add(pikaplane);

	// PLS REMOVE THE CUBE
    var geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } ); 
    cube = new THREE.Mesh( geometry, material ); 
    //scene.add( cube ); 
    camera.position.z = 5;

    render();
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
