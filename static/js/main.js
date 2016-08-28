var camera, scene, renderer, controls, cube;


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
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    controls = new DeviceOrientationController( camera, renderer.domElement );
    controls.connect();
    //setupControllerEventHandlers( controls );
    window.addEventListener( 'resize', onWindowResize, false );

    var geometry = new THREE.BoxGeometry( 1, 1, 1 ); 
    var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } ); 
    cube = new THREE.Mesh( geometry, material ); 
    scene.add( cube ); 
    camera.position.z = 5;

    render();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}




init();
