var scene;
var oystersOnScene, theVideoIndex, vidTxt;
var gifIndex, gifTxt;


var deps = {
	THREE 	: THREE,
	manager : WebVRManager,
	reticle : vreticle
};

//---Get scene (map_id) parameters from url
var map_id = getParameterByName( "map_id" );

//---Load JSON containing specs about the diferents scenes, then initializate the current scene
$.getJSON( "json/locations.json", function( json, status ) { 

	scene = new VRScene( deps, json, map_id );
	scene.initScene();
	scene.buildSkybox();
	scene.loadJsonScene("json/048_OysterTestSceneISS.json");

	//test: get the scene Outline (false = don't print on console)
	scene.addToJsonLoadQueue( function( VRS ){
        VRS.getSceneOutline(false);
	});	

	//Do the ISS setup stuff
	scene.addToJsonLoadQueue( function( VRS ){
		//rotate the loaded scene
		scene.rotateLoaded(Math.PI/2 , Math.PI ,0 , "mainscene");
		//attach the animation to the mixer, and play it
		scene.setAnimation(scene.loadedAnimations[0][0], scene.loadedObjects[0]).play();

		//create the videotexture and attach it to the content objects
		theVideoIndex = scene.createVideoTexture('thevideo');
		vidTxt = scene.videoTextures[theVideoIndex];
		var contentObjs = VRS.getObjectsContainigStr("content");

		contentObjs.forEach(function (e){
			var movieMaterial = new THREE.MeshBasicMaterial( { map: vidTxt, overdraw: true, side:THREE.DoubleSide } );
			e.material = movieMaterial;
		})

		VRS.getMatsContainigStr("wire").forEach( function(e){
				e.wireframe=true;
			});


		VRS.videos[theVideoIndex].play();
	});


	// //test: get all the obj with some string
	// scene.addToJsonLoadQueue( function( VRS ){
 //        var cosos = VRS.getObjectsContainigStr("coso");
 //        console.log(cosos);
	// });	


	// 	////////////////////
	// 	// gifIndex 

	// 	//get the "oysters", but exclude the "gems"
	// 	oystersOnScene = VRS.getObjectsContainigStr("oyster" , "gem")

	// 	//Set colliders
	// 	scene.addToClickable( oystersOnScene );
	// 	//scene.addToClickable( VRS.getObjectsContainigStr("content"));
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

 //    		var wait_material = scene.createDynamicTextureMaterial(30, '/static/assets/wait/wait', 'gif', 1);
 //    		var base_texture = scene.texture_loader.load('/static/assets/wait/wait0.gif');
 //    		var base_material = new THREE.MeshBasicMaterial({transparent:true, map:base_texture});
 //    		scene.reticle.reticle_object.material = base_material;
 //    		scene.reticle.reticle_object.geometry = new THREE.BoxGeometry( .05, .05, .05 );
 //    		//scene.reticle.reticle_object.geometry.scale(2,2,2);

	//     	oyster.ongazeover = function(){
	// 			console.log("gaze over: " + oyster.name);
	// 			VRS.scalesum[i] = 0.1;
	// 			scene.reticle.reticle_object.material = wait_material;
	// 		};

	// 		oyster.ongazelong = function(){
	// 			console.log("gaze long: " + oyster.name);
	// 			VRS.videos[theVideoIndex].play();
	// 			scene.reticle.reticle_object.material = base_material;
	// 		};

	// 		oyster.ongazeout = function(){
	// 			console.log("gaze out: " + oyster.name);
	// 			VRS.scalesum[i] = -0.1;
	// 			VRS.videos[theVideoIndex].pause();
	// 			scene.reticle.reticle_object.material = base_material;
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

	//Do the ISS render cycle actions
	scene.addToRenderCycle( function(VRS) {
		// Once an oyster is opened play the transition animation
		try {
			oystersOnScene.forEach(function(oyster, i){
				VRS.scalefactor[i] += VRS.scalesum[i];
				//console.log(oyster.name);
				//scalefactor[i] = 1;
				if (VRS.scalefactor[i]<=0.001) VRS.scalefactor[i] = 0.001;
				if (VRS.scalefactor[i]>=1) VRS.scalefactor[i] = 1;
				oyster.children.forEach(function(child, j){
					child.scale.set(VRS.scalefactor[i], VRS.scalefactor[i], VRS.scalefactor[i]);
				});
			});
		} catch (e){
			//console.log(e);
		}
	});

	scene.timeFactor = 1.4;
	
})
	.done(	function() {
	        scene.render(); 
		// var elem = document.getElementById("loading_screen");
		// elem.parentNode.removeChild(elem);		

  //       var button = document.createElement("button");
  //       button.id = "loading_button";
  //       button.innerHTML = "click to start";
  //       button.onclick = function () {
	 //            console.log("click");
	 //            document.getElementById("loading_screen2").style.display = "none";
	 //        };
	 //    scene.loading_manager.onProgress = function (item, loaded, total) {
	 //        document.getElementById("loading_text").HTML = "loading" + item;
	 //    };
  //       scene.loading_manager.onLoad = function () {
		//     console.log('all items loaded');
		//     document.getElementById("loading_button_wrapper").appendChild(button);
		//     document.getElementById("loading_text").style.display = 'none';
		// };
	})
	.fail(	 function(jqXHR, textStatus, errorThrown) 		{ console.log( "getJSON request failed! " + textStatus); })
	.always( function() 									{ console.log( "JSON load complete" );});


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
