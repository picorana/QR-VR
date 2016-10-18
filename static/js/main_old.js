var camera, scene, renderer, controls, cube, texture_placeholder, container, creatureplane;
var raycaster, mouse, info;
var objects = []; 
var caught = [];

var video;
var mixer;
var videoTexture;

var is_webgl_enabled;
var canHandleOrientation;

// implementing: webgl, canvas, css3d
var chosen_renderer = "webgl";

var filterStrength = 20;
var frameTime = 0, lastLoop, thisLoop, fpsOut;

	var clock = new THREE.Clock();

function render() { 
    requestAnimationFrame( render );
    controls.update(); 
    renderer.render( scene, camera ); 

    // where is the camera looking at?
    var vector = new THREE.Vector3( 0, 0, -10 );
	vector.applyQuaternion( camera.quaternion );
	effect.render( scene, camera );
	//console.log(vector);
	/*cube2.position = vector;
	cube2.position.x = vector.x;
	cube2.position.y = vector.y;
	cube2.position.z = vector.z;*/
	
	//videoTexture.update();
	var delta = 0.75 * clock.getDelta();
	mixer.update(delta);

    // fps display text update
    var thisFrameTime = (thisLoop=new Date) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;
} 

// context independent init
function init(){

	// fps display text setup
	fpsOut = document.getElementById('fps');
	lastLoop = new Date;
	setInterval(function(){
	  fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps";
	},1000);

	is_webgl_enabled = Detector.webgl? true : false;
	info = document.getElementById('info');

	window.addEventListener( 'orientationchange', onScreenOrientationChange, false );
  	window.addEventListener( 'deviceorientation', handleOrientation, false );
  	window.addEventListener( 'resize', onWindowResize, false );

	// device detection
	var isMobile = false;
	if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
	    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;

	info.innerHTML += "<br>webgl: " + is_webgl_enabled
		+ "<br> browser: " + browser() 
		+ (isMobile? " mobile" : " desktop") 
		+ " " + navigator.platform;

	if (isMobile && canHandleOrientation!=null) {
		deviceNotSupported();
		return;
	}

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

// context specific init
function initScene(location_json){

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1100 );
	scene = new THREE.Scene();
	raycaster = new THREE.Raycaster();
	mouse = new THREE.Vector2();

	

	mixer = new THREE.AnimationMixer( scene );

	var loader = new THREE.ObjectLoader();
	loader.load("../static/assets/testMeshC.json",function ( obj ) {
		var sceneAnimationClip = obj.animations[0];
		obj.position.z = -5;
		obj.position.y = 3;
	    scene.add( obj );
	    console.log(obj);
	    
		mixer.clipAction( sceneAnimationClip ).play();
	});

/*
	var jsonloader = new THREE.ObjectLoader();
	jsonloader.load("../static/assets/testMeshB.json", function(geometry) {
        mesh = new THREE.Mesh(geometry);
        console.log("jsonloader done");
        mesh.position.z = -5;
        scene.add(mesh);
    });
*/

	

	//videoTexture= new THREEx.VideoTexture("../static/js/small.mp4");
	//var video	= videoTexture.video;

	//var geometry2 = new THREE.SphereGeometry( .1);
	//var material2 = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5, map	: videoTexture.texture } );
	//var material3 = new THREE.MeshBasicMaterial( { vertexColors: THREE.FaceColors, overdraw: 0.5 } );

	// TEST PART!!
	//cube2 = new THREE.Mesh( geometry2, material3 );
	//scene.add( cube2 );
	console.log("blah");

	/*
	var testgeometry = new THREE.PlaneGeometry(1, 1);
	var testmaterial	= new THREE.MeshBasicMaterial({
		map	: videoTexture.texture
	});

	var testmesh	= new THREE.Mesh( testgeometry, testmaterial );
	testmesh.position.y=30;
	scene.add(testmesh);*/

	// END TEST PART


	container = document.getElementById( 'container' );

	if (chosen_renderer == "webgl"){
		
	    texture_placeholder = document.createElement( 'canvas' );
		
		if (is_webgl_enabled){
			var context = texture_placeholder.getContext( '2d' );
			context.fillStyle = 'rgb( 200, 200, 200 )';
			context.fillRect( 0, 0, texture_placeholder.width, texture_placeholder.height );
		}

	    renderer = is_webgl_enabled? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
	    effect = new THREE.StereoEffect(renderer);
	    effect.setSize( window.innerWidth, window.innerHeight );
	    //renderer = new THREE.SoftwareRenderer();
	    //renderer = new THREE.CanvasRenderer();
	    renderer.setSize( window.innerWidth, window.innerHeight );
	    container.appendChild(renderer.domElement);

	    controls = new DeviceOrientationController( camera, renderer.domElement );
	    controls.connect();

	    
	    
	    buildSkybox(location_json.map.skybox);
	    buildCreatures(location_json.creatures);

	    //var light = new THREE.AmbientLight( 0xffffff );
		//scene.add(light);

	} else if (chosen_renderer == "css3d") {

		var sides = [
					{
						url: location_json.creatures[0].texture,
						position: [ -512, 0, 0 ],
						rotation: [ 0, Math.PI / 2, 0 ]
					},
					{
						url: location_json.creatures[0].texture,
						position: [ 512, 0, 0 ],
						rotation: [ 0, -Math.PI / 2, 0 ]
					},
					{
						url: location_json.creatures[0].texture,
						position: [ 0,  512, 0 ],
						rotation: [ Math.PI / 2, 0, Math.PI ]
					},
					{
						url: location_json.creatures[0].texture,
						position: [ 0, -512, 0 ],
						rotation: [ - Math.PI / 2, 0, Math.PI ]
					},
					{
						url: location_json.creatures[0].texture,
						position: [ 0, 0,  512 ],
						rotation: [ 0, Math.PI, 0 ]
					},
					{
						url: location_json.creatures[0].texture,
						position: [ 0, 0, -512 ],
						rotation: [ 0, 0, 0 ]
					}
				];

		var creatureplane = buildCreatures(location_json.creatures);
		
		var cube = new THREE.Object3D();
		scene.add( cube );

		for ( var i = 0; i < sides.length; i ++ ) {

					var side = sides[ i ];

					var element = document.createElement( 'img' );
					element.width = 1026; // 2 pixels extra to close the gap.
					element.src = side.url;

					var object = new THREE.CSS3DObject( element );
					object.position.fromArray( side.position );
					object.rotation.fromArray( side.rotation );
					cube.add( object );

				}

		/*
		var element = document.createElement( 'img' );
		element.width = 1026; // 2 pixels extra to close the gap.
		element.src = location_json.creatures[0].texture;

		var object = new THREE.CSS3DObject( element );
		object.position.fromArray( creatureplane.position );
		object.rotation.fromArray( creatureplane.rotation );
		cube.add( object );
		*/

		renderer = new THREE.CSS3DRenderer();
		renderer.setSize( window.innerWidth, window.innerHeight );
	    container.appendChild(renderer.domElement);

	    controls = new DeviceOrientationController( camera, renderer.domElement );
	    controls.connect();
	    
	    buildCreatures(location_json.creatures);
	}
	
}

function buildSkybox(skyboxTextureArray){
	var skyboxmaterials = [];
    for (var i=0; i<skyboxTextureArray.length; i++){ 
    	var path = skyboxTextureArray[i];
    	var tmpmaterial = loadTexture(path);
    	tmpmaterial.transparent = false;
    	skyboxmaterials.push(tmpmaterial); 
    }
	var skyboxmesh = new THREE.Mesh( 
		new THREE.BoxGeometry( 300, 300, 300, 7, 7, 7), 
		new THREE.MultiMaterial( skyboxmaterials ) );
	skyboxmesh.scale.x = - 1;
	scene.add( skyboxmesh );

	/*
	var geometry = new THREE.SphereGeometry( 500, 60, 40 );
	geometry.scale( - 1, 1, 1 );

	var material = new THREE.MeshBasicMaterial( {
		map: new THREE.TextureLoader().load( '../static/assets/maxresdefault.jpg' )
	} );

	mesh = new THREE.Mesh( geometry, material );

	scene.add( mesh );*/
}

function buildCreatures(creatureArray){
	var id = 0;
	for (var i=0; i<creatureArray.length; i++){
		var creature = creatureArray[i];
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

		// TEMPORARY!! REMOVE THIS!
		return creatureplane;
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

// this function is horrible
// caught is an array of the indexes of the objects in objects [] that have been clicked on, their indexes in objects are their ids
function catchCreature(clickedElement){
	if (caught.indexOf(objects.indexOf(clickedElement.object))==-1){
		info.innerHTML = info.innerHTML + '<br>clicked! id=' + objects.indexOf(clickedElement.object);

		scene.remove(clickedElement.object);
		caught.push(objects.indexOf(clickedElement.object));
	}
	
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

function deviceNotSupported( event ){
	info.innerHTML = "DEVICE NOT SUPPORTED!";
}

function handleOrientation ( event ){
	canHandleOrientation = event;
}

var browser = function() {
    // Return cached result if avalible, else get result then cache it.
    if (browser.prototype._cachedResult)
        return browser.prototype._cachedResult;

    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';

    // At least Safari 3+: "[object HTMLElementConstructor]"
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;

    // Chrome 1+
    var isChrome = !!window.chrome && !isOpera;

    // At least IE6
    var isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;

    return browser.prototype._cachedResult =
        isOpera ? 'Opera' :
        isFirefox ? 'Firefox' :
        isSafari ? 'Safari' :
        isChrome ? 'Chrome' :
        isIE ? 'IE' :
        isEdge ? 'Edge' :
        "Don't know";
};

init();


