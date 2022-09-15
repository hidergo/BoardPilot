import { useRef, useState } from 'react';
import { BoxGeometry, Color, Mesh, MeshBasicMaterial, PerspectiveCamera, PointLight, Scene, Sphere, WebGLRenderer, WireframeGeometry } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let modelLoaded = false;
let rendering = false;

export default function Home3D () {
    const loader = new GLTFLoader();

    const canvRef = useRef<HTMLCanvasElement>(null);

    const scene = new Scene();
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    const renderer = new WebGLRenderer({
        canvas: canvRef.current || undefined,
        antialias: false
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    
    scene.background = new Color(255, 255, 255);

    const light = new PointLight( 0xFFFFFF, 5, 100 );
    light.position.set( 5, 5, 5 );
    scene.add(light);

    camera.position.set( 0, 20, 100 );
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    
    if(!modelLoaded) {
        modelLoaded = true;
        loader.load("/hidergosplit.glb", (mdl) => {
            console.log("LOADED");
            scene.add(mdl.scene);
        })
    }
    
    
    /*
    const geometry = new BoxGeometry( 10, 10, 10 );
    const material = new MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new Mesh( geometry, material );
    scene.add( cube );
    */

    function renderScene () {
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(renderScene);
    }
    if(!rendering)
        renderScene();

    rendering = true;

    console.log("REND SCENE");

    

    return <div>
        <canvas width={window.innerWidth} height={window.innerHeight} ref={canvRef}>

        </canvas>
    </div>;
}