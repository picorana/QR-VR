var camera;
var scene;

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

window.addEventListener('DOMContentLoaded', function(){
            var canvas = document.getElementById('renderCanvas');
            var engine = new BABYLON.Engine(canvas, true);

            var createScene = function(){
                var scene = new BABYLON.Scene(engine);

                var camera = new BABYLON.DeviceOrientationCamera("DevOr_camera", new BABYLON.Vector3(0, 1, -15), scene);

                camera.setTarget(BABYLON.Vector3.Zero());
                camera.attachControl(canvas, false);

                var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), scene);

                var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
                sphere.position.y = 1;

                var ground = BABYLON.Mesh.CreateGround('ground1', 6, 6, 2, scene);

                /*var plane = BABYLON.Mesh.CreatePlane("plane", 10, scene);
                plane.position.x = 10;
                var materialPlane = new BABYLON.StandardMaterial("texturePlane", scene);
                materialPlane.diffuseTexture = new BABYLON.Texture("Pikachu.png", scene);
                materialPlane.backFaceCulling = false;
                plane.material = materialPlane;*/

                var skyMaterial = new BABYLON.SkyMaterial("skyMaterial", scene);
                skyMaterial.backFaceCulling = false;
                skyMaterial.luminance = .5;

                var skybox = BABYLON.Mesh.CreateBox("skyBox", 1000.0, scene);
                skybox.material = skyMaterial;

                return scene;
            }

            scene = createScene();
            engine.runRenderLoop(function(){
                scene.render();
            });

            window.addEventListener('resize', function(){
                engine.resize();
            });
        });
