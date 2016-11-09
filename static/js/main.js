var scene;
var oystersOnScene, theVideoIndex, vidTxt;


var deps = {
	THREE 	: THREE,
	manager : WebVRManager,
	reticle : vreticle
};

//---Get scene (map_id) parameters from url
var map_id = getParameterByName( "map_id" );

//---Load JSON containing specs about the diferents scenes, then initializate the current scene
$.getJSON( "/static/json/locations.json", function( json, status ) { 
	scene = new VRScene( deps, json, map_id );
	scene.initScene();
	scene.buildSkybox();
	//scene.loadJsonScene("../static/json/048_OysterTestSceneISS.json");

	//test: get the scene Outline (false = don't print on console)
	// scene.addToJsonLoadQueue( function( VRS ){
 //        VRS.getSceneOutline(false);
	// });	

	// //Do the ISS setup stuff
	// //scene.addToJsonLoadQueue( function( VRS ){
	// 	//rotate the loaded scene
	// 	scene.rotateLoaded(Math.PI/2 , Math.PI ,0 , "mainscene");
	// 	//attach the animation to the mixer, and play it
	// 	scene.setAnimation(scene.loadedAnimations[0][0], scene.loadedObjects[0]).play();

	// 	//create the videotexture and attach it to the content objects
	// 	theVideoIndex = scene.createVideoTexture('thevideo');
	// 	vidTxt = scene.videoTextures[theVideoIndex];
	// 	var contentObjs = VRS.getObjectsContainigStr("content");

	// 	contentObjs.forEach(function (e){
	// 		var movieMaterial = new VRS.THREE.MeshBasicMaterial( { map: vidTxt, overdraw: true, side:THREE.DoubleSide } );
	// 		e.material = movieMaterial;

	// 	    VRS.reticle.add_collider(e);
	// 	    e.ongazelong = function(){
	// 		  	// video.play();
	// 		  	// VRS.reticle.reticle_object.geometry = new THREE.SphereGeometry(0.005, 0.005, 0.005);
	// 		};
	// 		e.ongazeover = function(){
	// 			// VRS.reticle.reticle_object.geometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
	// 			// VRS.reticle.reticle_object.material = ring_material;
	// 		};
	// 		e.ongazeout = function(){
	// 			// video.pause();
	// 			// VRS.reticle.reticle_object.geometry = new THREE.SphereGeometry(0.005, 0.005, 0.005);
	// 		};
	// 	})

	// 	//get the "oysters", but exclude the "gems"
	// 	oystersOnScene = VRS.getObjectsContainigStr("oyster" , "gem")

	// 	//Set colliders
	// 	scene.addToClickable( oystersOnScene );
	// 	scene.addToClickable( VRS.getObjectsContainigStr("content"));
	// 	scene.addToClickable( VRS.getObjectsContainigStr("bottone"));

	// 	//Setup the oysters
	// 	VRS.scalefactor = [];
	// 	VRS.scalesum = [];
	// 	oystersOnScene.forEach( function(oyster ,i){
	// 		VRS.scalefactor[i] = -0.1;
	//     	VRS.scalesum[i] = 0;


 //    		oyster.material.wireframe=true;
 //    		oyster.material.transparent = true;
 //    		oyster.material.opacity = 0;


	//     	oyster.ongazeover = function(){
	// 			console.log("gaze over: " + oyster.name);
	// 			VRS.scalesum[i] = 0.1;
	// 		};

	// 		oyster.ongazeout = function(){
	// 			console.log("gaze out: " + oyster.name);
	// 			VRS.scalesum[i] = -0.1;
	// 			VRS.videos[theVideoIndex].pause();
	// 		};
	
	// 	});

	// 	//Setup the mats properties that the exporter doesn't support
	// 	VRS.getMatsContainigStr("wire").forEach( function(e){
	// 		e.wireframe=true;
	// 	});

	// 	var bottoni = VRS.getObjectsContainigStr("bottone");
	// 	VRS.getMatsFromObjs( bottoni ).forEach( function(e){
 //    		e.transparent = true;
	// 		e.opacity = 0.1;
	// 	});


	// 	VRS.getMatsFromObjs(VRS.getObjectsContainigStr("sol")).forEach(function(e){
	// 		e.side = THREE.DoubleSide;
	// 	});

	// });

	// //Do the ISS render cycle actions
	// scene.addToRenderCycle( function(VRS) {
	// 	// Once an oyster is opened play the transition animation
	// 	try {
	// 		oystersOnScene.forEach(function(oyster, i){
	// 			VRS.scalefactor[i] += VRS.scalesum[i];
	// 			//console.log(oyster.name);
	// 			//scalefactor[i] = 1;
	// 			if (VRS.scalefactor[i]<=0.001) VRS.scalefactor[i] = 0.001;
	// 			if (VRS.scalefactor[i]>=1) VRS.scalefactor[i] = 1;
	// 			oyster.children.forEach(function(child, j){
	// 				child.scale.set(VRS.scalefactor[i], VRS.scalefactor[i], VRS.scalefactor[i]);
	// 			});
	// 		});
	// 	} catch (e){
	// 		//console.log(e);
	// 	}
	// });

	// //create the Aim element
	// scene.createAimElement(20);

	scene.timeFactor = 1.4;
	scene.render();
})
	.done(	function()									{ 		})
	.fail(	function(jqXHR, textStatus, errorThrown) 	{ console.log( "getJSON request failed! " + textStatus); })
	.always(function() 									{ console.log( "JSON load complete" );});


//*******************

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return 0;
    if (!results[2]) return 0;
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
