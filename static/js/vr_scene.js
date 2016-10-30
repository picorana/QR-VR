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

    this.timefactor = 1;

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
            console.log(skyboxTextureArray[i]);
        }

        var skyboxmesh = new this.THREE.Mesh( new this.THREE.BoxGeometry( 500, 500, 500, 7, 7, 7 ), new this.THREE.MultiMaterial( skyboxmaterials ) );
        skyboxmesh.name = "skybox";
        skyboxmesh.scale.x = - 1;
        this.scene.add( skyboxmesh );

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

    this.createMaterial = function ( path ) {
    var texture = this.THREE.ImageUtils.loadTexture(path);
    var material = new this.THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5, transparent:false, shading:THREE.FlatShading } );
 
    return material; 
    }


}




