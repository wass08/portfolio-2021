import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'


import Stats from 'stats.js'
import * as dat from 'dat.gui'
console.log('three', THREE);


const objects = {
};

class Scene {
  constructor() {
    this.setup();
  }

  async setup() {
    console.log('setup...');
    await this.loadResources();
    console.log('resources loaded');
    await this.buildScene();
  }

  async loadResources() {
    /**
     * Fonts
     */
    const fontLoader = new THREE.FontLoader()

    this.font = await fontLoader.loadAsync('/fonts/Poppins SemiBold_Regular.json');

    /**
    * Models
    */
    this.gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/')
    this.gltfLoader.setDRACOLoader(dracoLoader)

    // LOAD ALL OBJECTS CATALOG
    const gltf = await this.gltfLoader.loadAsync('/models/Objects/objects.gltf');
    gltf.scene.children.forEach(function (obj) {
      objects[obj.name] = obj;
    });

    const glassMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      opacity: 0.5,
      transparent: true,
    });
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        // Convert standard material to phong
        // let prevMaterial = child.material;
        // child.material = new THREE.MeshPhongMaterial();
        // THREE.MeshBasicMaterial.prototype.copy.call( child.material, prevMaterial );
        child.material.emissive = child.material.color;
        child.material.emissiveMap = child.material.map;
        if (child.material && child.material.name == 'A_Glass') {
          child.material = glassMaterial;
        }
      }
    });

    // LOAD PLAYER ANIMATIONS
    this.characterAnimations = (await this.gltfLoader.loadAsync('/models/Characters/character_animations.glb')).animations;
    // LOAD PLAYER MESHES
    // boss_female_01 boss_male_01
    this.playerMeshes = {
      male_developer_02: (await this.gltfLoader.loadAsync('/models/Characters/male_developer_02.gltf')).scene.children[0],
      female_developer_02: (await this.gltfLoader.loadAsync('/models/Characters/female_developer_02.gltf')).scene.children[0],
      boss_female_01: (await this.gltfLoader.loadAsync('/models/Characters/boss_female_01.gltf')).scene.children[0],
      boss_male_01: (await this.gltfLoader.loadAsync('/models/Characters/boss_male_01.gltf')).scene.children[0]
    };
  }

  async buildScene() {
    const self = this;

    // Debug
    const gui = new dat.GUI()
    this.gui = gui;
    window.gui = gui;
    //gui.hide();

    const stats = new Stats()
    this.stats = stats;
    stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom)
    stats.dom.style.right = '0';
    stats.dom.style.left = '';
    stats.dom.style.bottom = '0';
    stats.dom.style.top = '';

    // Canvas
    const canvas = document.querySelector('canvas.webgl')
    // Scene
    const scene = new THREE.Scene()
    this.scene = scene;



    /**
     * Lights
     */
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1)
    scene.add(ambientLight)




    /**
     * Char
     */

    let wassim = this.playerMeshes.male_developer_02;
    scene.add(wassim);
    wassim.traverse((child) =>
    {
      if ( child.isMesh ) {
        child.material.emissive =  child.material.color;
        child.material.emissiveMap = child.material.map ;
      }

      if(child instanceof THREE.Mesh)
      {
        child.castShadow = true
        child.receiveShadow = false
      }
    })

    /**
         * Sizes
         */
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    window.addEventListener('resize', () => {
      // Update sizes
      sizes.width = window.innerWidth
      sizes.height = window.innerHeight

      // Update camera
      camera.aspect = sizes.width / sizes.height
      camera.updateProjectionMatrix()

      // Update renderer
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(sizes.width, sizes.height)

      // Update effect composer
      effectComposer.setSize(sizes.width, sizes.height)
    })


    

    /**
     * Camera
     */
    // Base camera
    const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 1, 80)
    this.cameraOffset = {
      x: 6.2,
      y: 9.2,
      z: 6.2,
    };
    scene.add(camera)
    this.cameraRotation = 0;

    /**
     * Renderer
     */
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: window.devicePixelRatio == 1,
      precision: "mediump",
      powerPreference: 'high-performance',
    })
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(sizes.width, sizes.height)
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0xFFFFFF, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.3;


    let RenderTargetClass = null


    if (renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2) {
      RenderTargetClass = THREE.WebGLMultisampleRenderTarget
      console.log('Using WebGLMultisampleRenderTarget')
    }
    else {
      RenderTargetClass = THREE.WebGLRenderTarget
      console.log('Using WebGLRenderTarget')
    }

    const renderTarget = new RenderTargetClass(
      800,
      600,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        encoding: THREE.sRGBEncoding
      }
    )
    const effectComposer = new EffectComposer(renderer, renderTarget)
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    effectComposer.setSize(sizes.width, sizes.height)
    console.log(effectComposer);
    const renderPass = new RenderPass(scene, camera)
    effectComposer.addPass(renderPass)

    if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
      const smaaPass = new SMAAPass()
      effectComposer.addPass(smaaPass)

      console.log('Using SMAA')
    }



    // Controls
    const controls = new OrbitControls(camera, canvas)
    controls.target.set(0, 0, 0);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableZoom = true;
    if (this.builderMode) {
      controls.enabled = false;
    }
    controls.maxDistance = 42;
    controls.minDistance = 6;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = 0;
    controls.keys = {
      LEFT: 37, //left arrow
      UP: 38, // up arrow
      RIGHT: 39, // right arrow
      BOTTOM: 40 // down arrow
    }

    /*
    ** User Click
    */

    const raycaster = new THREE.Raycaster()

    const mouse = new THREE.Vector2()

    renderer.domElement.addEventListener('mousemove', (event) => {
      mouseMove(event.clientX, event.clientY)
    })
    renderer.domElement.addEventListener('pointerdown', (event) => {

    })

    renderer.domElement.addEventListener('touchstart', (event) => {

    })

    const mouseMove = (x, y) => {
      mouse.x = x / sizes.width * 2 - 1;
      mouse.y = - (y / sizes.height) * 2 + 1;
      cursorMovement.style.transform = `translateX(${x}px) translateY(${y}px)`;
    }
    console.log(renderer.domElement);


    /**
     * Animate
     */
    const clock = new THREE.Clock()
    let previousTime = 0
    let cursorMovement = document.getElementById('cursorMovement');
    let currentTarget;
    let currentObjectTarget;
    const tick = () => {
      stats.begin()
      const elapsedTime = clock.getElapsedTime()
      const deltaTime = elapsedTime - previousTime
      previousTime = elapsedTime




      // Positions
      raycaster.setFromCamera(mouse, camera)


      // Update controls
      controls.update()

      // Render
      // renderer.render(scene, camera)
      effectComposer.render()

      stats.end()
      // Call tick again on the next frame
      window.requestAnimationFrame(tick)
    }

    tick()
    console.log(renderer.info);
  }

  unload() {
    if (this.stats) {
      this.stats.dom.remove();
    }
    if (this.gui) {
      this.gui.domElement.remove();
    }
  }
}

export { Scene };