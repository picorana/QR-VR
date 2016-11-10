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
* @property {number} timefactor - Controls the speed of the animation updates, the larger it goes the faster the animations will update
* @property {array} dir - Stores a reduced hierarchy of the whole scene (filled by VRScene.getSceneOutline())
* @property {array} onJsonLoaded - Stores the actions that need to take place once an external scene has been loaded (pushed by VRScene.addToJsonLoadQueue())
* @property {array} loadedObjects - Contains the external objects from THREE.ObjectLoader()
* @property {array} loadedAnimations - LoadedAnimations will contain the external animations inside the objects loaded with THREE.ObjectLoader();
* @property {array} videos - will contain the loaded videos (filled by this.createVideoTexture ())
* @property {array} videoContexts - will contain the created videoContexts (filled by this.createVideoTexture ())
* @property {array} videoTextures - will contain the created videoTextures (filled by this.createVideoTexture ())
* @property {array} clickable_objects - clickable_objects will contain the objects to be checked by the raycaster                             
*
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
    this.map_id = (!isNaN(map_id))? map_id : 0;
    this.container = (typeof container === 'object')? container : document.getElementById( 'container' );

    //timefactor controls the speed of the animation updates, the larger it goes the faster the animations will update
    this.timefactor = 1;

    //the dir array stores a reduced hierarchy of the whole scene (filled by this.getSceneOutline())
    this.dir = [];

    //onJsonLoaded will contain the user defined actions to be executed on JSON load
    this.onJsonLoaded = [];

    //onRenderCycle will contain the user defined actions to be executed on each render cycle
    this.onRenderCycle = [];

    //loadedObjects will contain the external objects from THREE.ObjectLoader()
    this.loadedObjects = [];

    //loadedAnimations will contain the external animations inside the objects loaded with THREE.ObjectLoader();
    this.loadedAnimations = [];

    //the videotexture's elements
    this.videos=[];
    this.videoTextures=[];
    this.videoContexts=[];

    //clickable_objects will contain the objects to be checked by the raycaster
    this.clickable_objects = [];

    //TODODOC
    this.aimElementStuff = {} ;

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
        var VRSCENE = this;   

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
        this.texture_loader      = new this.THREE.TextureLoader(this.loading_manager);
        this.obj_loader          = new this.THREE.ObjectLoader(this.loading_manager);
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

        //---Attach listeners to the devices aspect changes, and adjust screen
        window.addEventListener( 'orientationchange',   VRSCENE.onScreenOrientationChange.bind(VRSCENE),  false );
        window.addEventListener( 'resize',              VRSCENE.onWindowResize.bind(VRSCENE),             false );
        window.addEventListener( 'mousedown',           VRSCENE.onDocumentMouseDown.bind(VRSCENE) ,       false );

        this.scene.add(this.camera);
    }

    /**
   *   Render the scene
   *
   *   @function render
   *
    */

    this.render = function(){
        requestAnimationFrame( this.render.bind(this) );
        var VRSCENE = this;
        
        this.manager.render(this.scene, this.camera);
        this.reticle.reticle_loop();

        //Update the controller of the orientation of the device
        this.controls.update(); 


        //refresh the video image
        if (typeof this.videoTextures[0] !== 'undefined'){
            this.videoTextures.forEach(function(e,i){
                if ( VRSCENE.videos[i].readyState === VRSCENE.videos[i].HAVE_ENOUGH_DATA ) {
                    VRSCENE.videoContexts[i].drawImage( VRSCENE.videos[i], 0, 0 );
                    if ( e ) 
                        e.needsUpdate = true;
                }
            });
        }

        //Get the time passed from the last render and update the animations on the mixer
        if (typeof this.mixer !== 'undefined'){
            var delta = this.timefactor * this.clock.getDelta();
            this.mixer.update(delta);  
        } 

        this.onRenderCycle.forEach(function(e){
                e(VRSCENE);
            });
    }

    /**
    *   Enqueue the actions that need to take place on the render loop
    *
    *   @function addToRenderCycle
    *
    *   @param toBeAppended - the function to enqueue, it takes as a parameter the VRScene object, allowing to interface with it's methods
    */

    this.addToRenderCycle = function( toBeAppended ){
        this.onRenderCycle.push( toBeAppended );
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
        var VRSCENE = this;       

        this.obj_loader.load( jsonURL, function ( obj ) {
            VRSCENE.loadedObjects.push( obj );
            VRSCENE.loadedAnimations.push(obj.animations)
            VRSCENE.scene.add( obj );
            
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
     * Rotate all or some of the loaded elements
     * @function rotateLoaded
     * 
     * @param  {number} x - the x rotation
     * @param  {number} y - the y rotation
     * @param  {number} z - the z rotation
     * @param {number} name - the substring to match against the name of the object to rotate, if undefined or empty, the rotation will be performed on all loaded objects (but not on the loaded childs)
     */
    this.rotateLoaded = function( x , y , z , name){
        var buf = [];
        
        if (typeof name === 'string' && name !== "") this.hierarchySearch(this.loadedObjects, "SOFT", "name", name, buf);
        else buf = this.loadedObjects;

        buf.forEach(function(e){
            e.rotation.x = x;
            e.rotation.y = y;
            e.rotation.z = z;
        });
    }

    /**
     * Set an animation to be played
     *
     * @function setAnimation
     * 
     * @param {object} animationClip         - The animation clip to be set
     * @param {object} obj                   - The object to which the animation will be applied (most times it's the object that came with the animation)
     * @param {string} [loopType = "Repeat"] - The loop type: "Once", "Repeat" or "PingPong".
     */
    this.setAnimation = function( animationClip , obj , loopType){
        if (typeof this.mixer === 'undefined'){
            this.mixer = new THREE.AnimationMixer( obj );
        }
        var action = this.mixer.clipAction( animationClip ); 
        var loopTypes = {
                        "Once": this.THREE.LoopOnce,
                        "Repeat": this.THREE.LoopRepeat,
                        "PingPong": this.THREE.LoopPingPong
                        };
        
        action.loop = (typeof loopTypes[loopType] === 'undefined')? this.THREE.LoopRepeat : loopTypes[loopType];
        
        return action;
    }

   /**
    * Create a videotexture based on a video
    * 
    * @param  {string} origin - the id of the video DOM element
    * @return {number} - the index of the arrays where the elements where stored <br>
    *                    (this.videos , this.videoTextures , this.videoContexts)
    */
    this.createVideoTexture = function ( origin ) {
        //TODO if the origin is an URL create the DOM element
        var video = document.getElementById( origin );   
        
        var videoImage = document.createElement( 'canvas' );
        //--Play the video on user click
        //--TODO: Il video si attiva al cliccare anche se e' nascosto (si sente il souno)
        /*document.addEventListener( 'click', function ( event ) {
            video.play();
        } );*/

        //--Set the video canvas attributes
        videoImage.width = 560;
        videoImage.height = 320;
        var videoImageContext = videoImage.getContext( '2d' );

        //Create the videotexture that will be used on the content object's material
        var videoTexture = new this.THREE.Texture( videoImage );
        videoTexture.minFilter = this.THREE.LinearFilter;
        videoTexture.magFilter = this.THREE.LinearFilter;

        var videoLen = this.videos.push(video);
        var txtLen = this.videoTextures.push(videoTexture);
        var contextLen = this.videoContexts.push(videoImageContext)

        if ( videoLen === txtLen && txtLen === contextLen ) return txtLen-1;
        else return null;
    }



    /**
     * Set the objects to act as colliders. Technically just adding them to the list of "clickable objects"     
     * @param {object|array} toBeAppended - the single object or an array of objects
     */
    this.addToClickable = function( toBeAppended ){
        var VRSCENE = this;
        if (Object.prototype.toString.call( toBeAppended ) === '[object Array]'){
            this.clickable_objects = this.clickable_objects.concat(toBeAppended);
            this.clickable_objects.forEach(function(e){
                VRSCENE.reticle.add_collider(e);
            });
        } else {
            this.clickable_objects.push(toBeAppended);
        }
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
    *   @param {string} exclude - exclude the results containing this string
    *
    *   @return {array} A list of matching objects
    */

    this.getObjectsContainigStr = function( str , exclude ){
        var buf = [];
        this.hierarchySearch(this.scene.children, "SOFT", "name", str, buf);
        if (typeof exclude !== 'undefined') {
            buf = buf.filter(function(o){
                return !o.name.includes( exclude );
            })
        }
        return buf;
    }

    /**
    *   Get an array of all the elements on the scene containing a substring in their MATERIAL names
    *   
    *   @function getObjectsContainigMatStr
    *
    *   @param {string} str - the subtring to be searched inside the names of the material of the objects
    *   @param {string} exclude - exclude the results containing this string
    *
    *   @return {array} A list of matching objects
    */

    this.getObjectsContainigMatStr = function( str , exclude ){
        var buf = [];
        this.hierarchySearch(this.scene.children, "MATERIAL", 'name', str, buf);
        if (typeof exclude !== 'undefined') {
            buf = buf.filter(function(o){
                return !o.material.name.includes( exclude );
            })
        }
        return buf;
    }

    /**
    *   Get an array of all the material on the scene containing a substring in their names
    *   
    *   @function getMatsContainigStr
    *
    *   @param {string} str - the subtring to be searched inside the names of the material of the objects
    *   @param {string} exclude - exclude the results containing this string
    *
    *   @return {array} A list of matching materials
    */

    this.getMatsContainigStr = function( str , exclude ){
        var buf = [];
        this.hierarchySearch(this.scene.children, "MATERIAL", 'name', str, buf);
        if (typeof exclude !== 'undefined') {
            buf = buf.filter(function(o){
                return !o.material.name.includes( exclude );
            })
        }
         
         return this.getMatsFromObjs(buf);
    }

    this.getMatsFromObjs = function( list ){
        var buf = list;

        var sorted = buf.sort(function(a, b){ 
            if(a.material.uuid < b.material.uuid) return 1; 
            else return -1 });
         
         buf = sorted.filter(function(elem, i, self) {
            if ( i-1 >= 0 )
                return elem.material.uuid != self[i-1].material.uuid;
            else
                return true;
            })

        return buf.map(function(e){ return e.material });
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

            case "MATERIAL":
                dir.forEach( function (e){
                    if( e.material && 
                        e.material[prop] && 
                        e.material[prop].toLowerCase().includes( val.toLowerCase() ) ) 
                            dest.push(e);
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

    }

    this.createAimElement = function(maxAnimationFrames){
        this.aimElementStuff.ring_texture_array = [] ;

        for (var i=0; i<maxAnimationFrames; i++){
            this.aimElementStuff.ring_texture_array.push(this.texture_loader.load("../static/assets/ring/frame"+i+".gif"));
        }
        this.aimElementStuff.ring_material = new this.THREE.MeshBasicMaterial({  transparent: true });
        this.aimElementStuff.ring_material.needsUpdate = true;
        this.aimElementStuff.ringIndex = 0;
        
        this.addToRenderCycle(function( VRSCENE ){
            VRSCENE.aimElementStuff.ring_material.map = VRSCENE.aimElementStuff.ring_texture_array[VRSCENE.aimElementStuff.ringIndex];
            VRSCENE.aimElementStuff.ringIndex++;
            if (VRSCENE.aimElementStuff.ringIndex== maxAnimationFrames ) VRSCENE.aimElementStuff.ringIndex=0;
        });
    }

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
    var texture = this.texture_loader.load(path);
    var material = new this.THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5, transparent:false, shading:THREE.FlatShading } );
 
    return material; 
    }

    this.onWindowResize = function() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    this.onScreenOrientationChange = function(event){
        this.controls.disconnect();
        if (window.innerWidth > window.innerHeight) this.camera = new this.THREE.PerspectiveCamera( 75, window.innerHeight / window.innerWidth, 1, 1100 );
        else this.camera = new this.THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1100 );
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.controls = new DeviceOrientationController( camera, renderer.domElement );
        this.controls.connect();
    }

    this.onDocumentMouseDown = function( event ) {

        event.preventDefault();

        this.mouse.x = ( event.clientX / this.renderer.domElement.clientWidth ) * 2 - 1;
        this.mouse.y = - ( event.clientY / this.renderer.domElement.clientHeight ) * 2 + 1;

        this.raycaster.setFromCamera( this.mouse, this.camera );

        var intersects = this.raycaster.intersectObjects( this.clickable_objects ); 
        if ( intersects.length > 0 ) {
            console.log(intersects[0]);
            intersects[0].object.ongazeover();
        }

    }

}




