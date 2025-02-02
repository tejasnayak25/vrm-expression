import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import * as THREE_VRM from "@pixiv/three-vrm";
import CustomVRMExpression from "./dist/vrm-expression.mjs";

let renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector("canvas")
});
renderer.shadowMap.enabled = true;
renderer.autoClearColor = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.setSize( renderer.domElement.clientWidth, renderer.domElement.clientHeight );
renderer.setPixelRatio( window.devicePixelRatio );

let scene = new THREE.Scene();

const light = new THREE.DirectionalLight( 0xffffff, 3 );
light.position.set( 1.0, 1.0, 1.0 ).normalize();
scene.add( light );

let gridHelper = new THREE.GridHelper( 5, 10, 0x888888, 0x444444 );
scene.add( gridHelper );

const camera = new THREE.PerspectiveCamera( 40.0,renderer.domElement.clientWidth /renderer.domElement.clientHeight, 1, 300.0 );
camera.position.set( 0.0, 1.3, 1.5 );
camera.updateMatrixWorld();

const orbit_controls = new OrbitControls( camera, renderer.domElement );
orbit_controls.screenSpacePanning = true;

orbit_controls.target.set( 0.0, 1.3, 0.0 ); 
orbit_controls.update();

const transform_controls = new TransformControls(camera, renderer.domElement);

transform_controls.addEventListener( 'dragging-changed', function ( event ) {

    orbit_controls.enabled = ! event.value;

} );

scene.add( transform_controls );

let currentVrm;
const clock = new THREE.Clock();

let loader = new GLTFLoader();
loader.crossOrigin = 'anonymous';
loader.register((parser) => {
    return new THREE_VRM.VRMLoaderPlugin(parser);
});

loader.load("./Amla.vrm", (gltf) => {
    let vrm = gltf.userData.vrm;
    currentVrm = vrm;

    let root = vrm.scene;
    scene.add(root);

    // let vrmExpression = new CustomVRMExpression({ vrm, overrides: { iris: "./images/iris.png" }, additionalExpressions: ['happy'] });
    let vrmExpression = new CustomVRMExpression({ vrm, overrides: { face: "./images/face.jpg", eyeline: "./images/eyeliner.png", eyelash: "./images/eyelash.png" }, additionalExpressions: ['blink'] });

    let range = document.getElementById("exp");

    range.onchange = () => {
        vrmExpression.setValue(Number(range.value));
    }
});

function animate() {
    requestAnimationFrame(animate);
    if ( currentVrm ) {
        currentVrm.update(clock.getDelta());
    }
    
    renderer.render(scene, camera);
}

animate();
