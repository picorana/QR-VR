/**
* The vrScene creates a Scene to be used in a VR application based on THREE.js
* @constructor
*
* @param {object} dependencies -
* @param {object} dependencies.THREE - THREE.js (https://github.com/mrdoob/three.js)
* @param {object} dependencies.manager - WebVRManager (https://github.com/borismus/webvr-boilerplate)
* @param {object} dependencies.vreticle - Vreticle (https://github.com/neuman/vreticle)
* 
* @param {object} locationsJSON - the loaded JSON containing scene info
* @param {number} [map_id = 0] - the current scene number
* @param {object} [container = (#container)] - the DOM element where to display the scene
*
*******************************************************
*
* @prop {number} timefactor - Controls the speed of the animation updates, the larger it goes the faster the animations will update
* @prop {array} dir - Stores a reduced hierarchy of the whole scene (filled by VRScene.getSceneOutline())
* @prop {array} onJsonLoaded - Stores the actions that need to take place once an external scene has been loaded (pushed by VRScene.addToJsonLoadQueue())
*
 */

function VRScene(dependencies , locationsJSON, map_id, container){
    //Check if all the dependencies are OK
    // if (typeof dependencies.THREE === 'object' &&
        // typeof dependencies.manager === 'object' &&
        // typeof dependencies.reticle === 'object'){ 
        this.THREE = dependencies.THREE;
        this.WebVRManager = dependencies.manager;
        this.vreticle = dependencies.reticle;
    // } else {
    //     //throw "there are some dependencies missing for generating the vr Scence";
    // }

    //TODO load a default locations.JSON as example
    this.locations = locationsJSON;
    this.map_id = (typeof map_id === 'number')? map_id : 0;
    this.container = (typeof container === 'object')? container : document.getElementById( 'container' );

    //timefactor controls the speed of the animation updates, the larger it goes the faster the animations will update
    this.timefactor = 1;

    //the dir array stores a reduced hierarchy of the whole scene (filled by this.getSceneOutline())
    this.dir = [];

    //onJsonLoaded will contain the user defined actions to be executed on JSON load
    this.onJsonLoaded = [];

    /**
   * Initailizate the vrScene.
   * @function initScene
   *
   * @param {number} [camFov = 75] - Camera frustum vertical field of view.
   * @param {number} [camAspect = (window aspect)] - Camera frustum aspect ratio.
   * @param {number} [camNear = 0.3] - Camera frustum near plane.
   * @param {number} [camFar = 10000] - Camera frustum far plane.
   *
   */
    this.initScene = function(camFov, camAspect, camNear, camFar){
        //Camera defaults
        this.fov = (camFov === "number")? camFov : 75;
        this.aspect = (camAspect === "number")? camAspect : window.innerWidth / window.innerHeight;
        this.near = (camNear === "number")? camFov : 0.3;
        this.far = (camFar === "number")? camFov : 10000;

        //Instantiate the basic THREE elements to construct the scene
        this.camera              = new this.THREE.PerspectiveCamera( this.fov, this.aspect, this.near, this.far );
        this.scene               = new this.THREE.Scene();
        this.raycaster           = new this.THREE.Raycaster();
        this.mouse               = new this.THREE.Vector2();
        this.renderer            = new this.THREE.WebGLRenderer({ antialias: true });
        this.texture_loader      = new this.THREE.TextureLoader();
        this.controls            = new this.THREE.VRControls(this.camera);
        this.effect              = new this.THREE.VREffect(this.renderer);
        this.manager             = new this.WebVRManager(this.renderer, this.effect);
        this.reticle             = this.vreticle.Reticle(this.camera);

        //Other utlility objects
        this.clock = new this.THREE.Clock();

        //---Create the canvas
        this.canvas_placeholder = document.createElement( 'canvas' );
        this.context = this.canvas_placeholder.getContext( '2d' );
        this.context.fillStyle = 'rgb( 200, 200, 200 )';
        this.context.fillRect( 0, 0, this.canvas_placeholder.width, this.canvas_placeholder.height );

        //---Append the renderer to the canvas
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.effect.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild( this.renderer.domElement );

    }
    /**
   *   Render the scene
   *
   *   @function render
   *
    */

    this.render = function(){
        requestAnimationFrame( this.render.bind(this) );
        
        this.manager.render(this.scene, this.camera);
        this.reticle.reticle_loop();

        //Update the controller of the orientation of the device
        this.controls.update(); 


        //Get the time passed from the last render and update the animations on the mixer
        if (typeof this.mixer !== 'undefined'){
            var delta = this.timefactor * this.clock.getDelta();
            this.mixer.update(delta);  
        } 

    }

    /**
   *   Create a skybox using the images listed on the loaded JSON.location[map_id].map.skybox
   *
   *   @function buildskybox
   */

    this.buildSkybox = function(){
        var skyboxTextureArray = this.locations.locations[ this.map_id ].map.skybox; 

        var skyboxmaterials = [];
        for (var i=0; i<skyboxTextureArray.length; i++){ 
            skyboxmaterials[i] = this.createMaterial(skyboxTextureArray[i]);
        }

        var skyboxmesh = new this.THREE.Mesh( new this.THREE.BoxGeometry( 500, 500, 500, 7, 7, 7 ), new this.THREE.MultiMaterial( skyboxmaterials ) );
        skyboxmesh.name = "skybox";
        skyboxmesh.scale.x = - 1;
        this.scene.add( skyboxmesh );

    }
    /**
    * Load a 3D scene or object in JSON format
    * @function loadJsonScene
    *
    * @param {string} jsonURL - the location of the Json file
    */

    
    this.loadJsonScene = function( jsonURL ){
        this.sceneDir = [];
        var VRSCENE = this;
       

        var loader = new this.THREE.ObjectLoader();
        loader.load( jsonURL, function ( obj ) {
            VRSCENE.scene.add( obj );
            // VRSCENE.getSceneOutline(false);
            VRSCENE.onJsonLoaded.forEach(function(e){
                e(VRSCENE);
            });

        });
    }

    /**
    *   Enqueue the actions that need to take place once an external scene has been loaded
    *
    *   @function addToJsonLoadQueue
    *
    *   @param toBeAppended - the function to enqueue, it takes as a parameter tho VRScene objects, allowing to interface with it's methods
    */

    this.addToJsonLoadQueue = function( toBeAppended ){
        this.onJsonLoaded.push( toBeAppended );
    }

    /**
    * Get a tree of all the elements on the scene with their children
    * @function getSceneOutline
    * 
    * @param {bool} printObjTree - if true prints the tree in console
    */
    this.getSceneOutline = function(printObjTree){
        if (printObjTree) console.log("*********Scene Outline*************");
        this.loopSceneOutline(printObjTree, this.scene.children, this.dir, 0, this);
        if (printObjTree) console.log("*****FINISHED Scene Outline********");
        if (printObjTree) console.log("\nThe whole outline in array:")
        if (printObjTree) console.log(this.dir);
        if (printObjTree) console.log("\n")

    }

    /**
    *   Get an array of all the elements on the scene containing a substring in their names
    *   
    *   @function getObjectsContainigStr
    *
    *   @param {string} str - the subtring to be searched inside the names of the objects
    *
    *   @return {array} A list of matching objects
    */

    this.getObjectsContainigStr = function( str ){
        var buf = [];
        this.hierarchySearch(this.scene.children, "SOFT", "name", str, buf);
        return buf;
    }

    /**
    *   Get an array of all the elements on the scene by type
    *   
    *   @function getObjectsbyType
    *
    *   @param {string} type - the type of objects to get
    *
    *   @return {array} A list of matching objects
    */

    this.getObjectsbyType = function( type ){
        var buf = [];
        this.hierarchySearch(this.scene.children, "SOFT", "type", type, buf);
        return buf;
    }

    /**
    *   Get an array of objects with a custom property [ matching a value ]
    *
    *   @function getObjectsByCustomProp
    *
    *   @param {string} propName - the key of the custom property
    *   @param [value] - the value to match. If null or undefined it will return al the objects having the custom property
    *
    *   @return {array} A list of matching objects
    */

     this.getObjectsByCustomProp = function( propName , value){
        var buf = [];

        if (typeof propName === 'undefined' &&  typeof value === 'undefined'){
            this.hierarchySearch(this.scene.children, "CUSTOMALL", propName, value, buf);            
            return buf
        }

        value = (typeof value === "undefined")? null : value;
            this.hierarchySearch(this.scene.children, "CUSTOM", propName, value, buf);

        return buf;
    }

    /**
    *   Search for properties matching a string inside the hierarchy of the scene
    *
    *   @function hierarchySearch
    *   
    *   @param {array} dir -  multidimensional array containing the hierarchy of the scene. <br>Every element must be an object with the structure: {name: "..." , children: [{}, {} ,,, {} ], custom_props : {}, , , others}.<br> A good idea is to use VRScene.scene.children
    *   @param {string} type - the type of search: "HARD" to match exact names, and "SOFT" to get the elements including the substring.
    *   @param {string} prop - the property where to search
    *   @param {string} str - the subtring to be searched inside the props of the objects
    *   @param {array} dest - the array where to push the results
    */

    this.hierarchySearch = function(dir, type, prop, val, dest){

        type = (typeof type === "string")? type : "SOFT";
        var VRSCENE = this;

        switch (type){
            case "HARD":
                dir.forEach( function (e){
                    if(e[prop]===val) dest.push(e);
                    VRSCENE.hierarchySearch(e.children, type, prop, val, dest);
                });
                break;

            case "CUSTOM":
                dir.forEach( function (e){
                    if( e.userData.hasOwnProperty( prop ) ) {
                            if (e.userData[prop] == val || val === null)    dest.push(e);
                        }
                    VRSCENE.hierarchySearch(e.children, type, prop, val, dest);
                });
                break;

            case "CUSTOMALL":
                dir.forEach( function (e){
                    if( Object.keys(e.userData).length > 0 ) {
                           dest.push(e);
                        }
                    VRSCENE.hierarchySearch(e.children, type, prop, val, dest);
                });
                break;

            default:
                dir.forEach( function (e){
                    if( e[prop].toLowerCase().includes( val.toLowerCase() ) ) dest.push(e);
                    VRSCENE.hierarchySearch(e.children, type, prop, val, dest);
                });
                break;
        }


        // if (type === "HARD"){
        //     dir.forEach( function (e){
        //         if(e[prop]===val) dest.push(e);
        //         VRSCENE.hierarchySearch(e.children, type, prop, val, dest);
        //     });
        // } else if (type ==="CUSTOM") {
        //     dir.forEach( function (e){
        //         if( e.userData.hasOwnProperty( prop ) ) {
        //                 if (e.userData[prop] == val || val === null)    dest.push(e);
        //             }
        //         VRSCENE.hierarchySearch(e.children, type, prop, val, dest);
        //     });
        // } else if (type === "CUSTOMALL") {
        //     dir.forEach( function (e){
        //         if( Object.keys(e.userData).length > 0 ) {
        //                dest.push(e);
        //             }
        //         VRSCENE.hierarchySearch(e.children, type, prop, val, dest);
        //     });
        // } else {
        //     dir.forEach( function (e){
        //         if( e[prop].toLowerCase().includes( val.toLowerCase() ) ) dest.push(e);
        //         VRSCENE.hierarchySearch(e.children, type, prop, val, dest);
        //     });
        // }
    }

    // this.includeCustomGeometry(){
    //     //TODO
    // }

    // this.createAimElement(){
    //     //TODO
    // }

    /************************************************/
    /******************Util functions****************/
    /************************************************/
    this.getTabString = function(d){
        var chars = [];
        if (typeof d === 'number'){
            for (var i = 0 ; i < d ; i++){
                if (i == d-1) chars [i] = "_";
                else if (i == d-2) chars [i] = "\\";
                else chars [i] = " |";
            } 
        }
        return chars.join("");
    }

    this.loopSceneOutline = function(print ,source, dest, depth){
        depth ++;
        var VRSCENE = this;
        var tabString = VRSCENE.getTabString(depth);
        source.forEach(function (e){
            if (print) console.log(tabString + e.name);
            var element = {
                name : e.name,
                children : [],
                custom_props : {}, //TODO
                origin : e
            }

            var i = dest.push(element);
            VRSCENE.loopSceneOutline(print, e.children, dest[i-1].children, depth);
        
        });
        depth--;
    }

    


    this.createMaterial = function ( path ) {
    var texture = this.THREE.ImageUtils.loadTexture(path);
    var material = new this.THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5, transparent:false, shading:THREE.FlatShading } );
 
    return material; 
    }


}




