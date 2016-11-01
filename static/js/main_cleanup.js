var scene;


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
	scene.loadJsonScene("../static/json/048_OysterTestSceneISS.json");

	scene.addToJsonLoadQueue( function( VRS ){
        VRS.getSceneOutline(false);
	});	

	scene.addToJsonLoadQueue( function( VRS ){
        var modulos = VRS.getObjectsContainigStr("coso");
        console.log(modulos);
	});	



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
