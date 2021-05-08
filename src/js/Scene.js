import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'

import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import gsap from 'gsap'


import Stats from 'stats.js'
import * as dat from 'dat.gui'

class Scene {
  constructor() {
    this.setup();
  }

  async setup() {
    const loadingScreenTitleLoader = document.querySelector(".loading-screen__title--loader");
    this.loadingManager = new THREE.LoadingManager(
        // Loaded
        () =>
        {
          console.log('loaded');
        },

        // Progress
        (itemUrl, itemsLoaded, itemsTotal) =>
        {
            const progressRatio = itemsLoaded / itemsTotal * 100;
            console.log(itemsLoaded, itemsTotal, progressRatio)
            loadingScreenTitleLoader.style.width = `${progressRatio}%`;
        }
    );
    await this.loadResources();
    console.log('resources loaded');
    await this.buildScene();
    
    setTimeout(() => {
      document.body.classList.add("loaded");
    }, 1000);
  }

  async loadResources() {
    /**
     * Fonts
     */
    const fontLoader = new THREE.FontLoader(this.loadingManager)

    this.font = await fontLoader.loadAsync('/fonts/Poppins SemiBold_Regular.json');

    /**
    * Models
    */
    this.gltfLoader = new GLTFLoader(this.loadingManager)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/')
    this.gltfLoader.setDRACOLoader(dracoLoader)

    // LOAD OFFICE
    const gltf = await this.gltfLoader.loadAsync('/models/Offices/office.gltf');

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

    this.office = gltf.scene;

    // LOAD PLAYER ANIMATIONS
    // this.characterAnimations = (await this.gltfLoader.loadAsync('/models/Characters/character_animations.glb')).animations;
    // LOAD PLAYER MESHES
    // boss_female_01 boss_male_01
    // this.playerMeshes = {
    //   boss_male_01: (await this.gltfLoader.loadAsync('/models/Characters/boss_male_01.gltf')).scene.children[0]
    // };
  }

  async buildScene() {

    // Debug
    const gui = new dat.GUI()
    this.gui = gui;
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

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight.position.set(2,5,2);

    scene.add(directionalLight);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = -3;
    directionalLight.shadow.camera.far = 8;
    // directionalLight.shadow.camera.left = 1;
    // directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 6;
    directionalLight.shadow.camera.bottom = -6;
    directionalLight.shadow.mapSize.width = 512
    directionalLight.shadow.mapSize.height = 512
    directionalLight.shadow.normalBias = 0.05
    const directionalLightCameraHelper = new THREE.CameraHelper(directionalLight.shadow.camera)
    // scene.add(directionalLightCameraHelper)
    /**
     * Char
     */

    // let wassim = this.playerMeshes.boss_male_01;
    // scene.add(wassim);
    // wassim.traverse((child) =>
    // {
    //   if ( child.isMesh ) {
    //     child.material.emissive =  child.material.color;
    //     child.material.emissiveMap = child.material.map ;
    //   }

    //   if(child instanceof THREE.Mesh)
    //   {
    //     child.castShadow = true
    //     child.receiveShadow = false
    //   }
    // })
    /**
     * Labels
     */
     const raycaster = new THREE.Raycaster();
     const points = {
      'SM_Prop_Certificate_01' : {
        offset: new THREE.Vector3(0.1, 0, 0),
        element: document.querySelector('.point--education'),
        details: document.querySelector('.screen--education'),
      },
      'SM_Prop_CorkBoard_01' : {
        offset: new THREE.Vector3(-0.4, 0.3, 0.3),
        element: document.querySelector('.point--activities'),
        details: document.querySelector('.screen--activities'),
      },
      'SM_Prop_Trophy_01' : {
        offset: new THREE.Vector3(0, 0, 0.3),
        element: document.querySelector('.point--achievements'),
        details: document.querySelector('.screen--achievements'),
      },
      'SM_Prop_Computer_Setup_01' : {
        offset: new THREE.Vector3(0, 0.2, 0.5),
        element: document.querySelector('.point--about'),
        details: document.querySelector('.screen--about'),
      },
      'SM_Prop_Phone_Desk_01' : {
        offset: new THREE.Vector3(0, 0.27, 0),
        element: document.querySelector('.point--contact'),
        details: document.querySelector('.screen--contact'),
      },
      'SM_Prop_Book_Group_02' : {
        offset: new THREE.Vector3(0, 0, 0.3),
        element: document.querySelector('.point--skills'),
        details: document.querySelector('.screen--skills'),
      }
     };
    /*
    ** Office
    */

    scene.add(this.office);
    this.office.traverse((child) =>
    {
      const point = points[child.name];
      if (point) {
        point.position = new THREE.Vector3(
          child.position.x + point.offset.x, 
          child.position.y + point.offset.y, 
          child.position.z + point.offset.z
        );
      }
      if(child instanceof THREE.Mesh)
      {
        child.castShadow = true;
        child.receiveShadow = true;
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
    const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.001, 80);
    scene.add(camera);
    camera.position.set(2, 1.5, -2);
    
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
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(sizes.width, sizes.height);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0xFFFFFF, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;


    let RenderTargetClass = null;

    if (renderer.getPixelRatio() === 1 && renderer.capabilities.isWebGL2) {
      RenderTargetClass = THREE.WebGLMultisampleRenderTarget;
      console.log('Using WebGLMultisampleRenderTarget');
    }
    else {
      RenderTargetClass = THREE.WebGLRenderTarget;
      console.log('Using WebGLRenderTarget');
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
    );

    const effectComposer = new EffectComposer(renderer, renderTarget);
    effectComposer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    effectComposer.setSize(sizes.width, sizes.height);
    console.log(effectComposer);
    const renderPass = new RenderPass(scene, camera);
    effectComposer.addPass(renderPass);

    if (renderer.getPixelRatio() === 1 && !renderer.capabilities.isWebGL2) {
      const smaaPass = new SMAAPass();
      effectComposer.addPass(smaaPass);

      console.log('Using SMAA');
    }



    // Controls
    const defaultControlsPosition = new THREE.Vector3(0, 1, 0);
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(defaultControlsPosition.x, defaultControlsPosition.y, defaultControlsPosition.z);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.maxDistance = 2.5;
    controls.minDistance = 0;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minPolarAngle = 0;


    controls.keys = {
      LEFT: 37, //left arrow
      UP: 38, // up arrow
      RIGHT: 39, // right arrow
      BOTTOM: 40 // down arrow
    }

    
    gsap.to(camera.position, {
			duration: 4,
			x: -1.8,
			y: 1.3,
			z: 1.1,
      delay: 2.4,
			onUpdate: function() {
        controls.target.set(defaultControlsPosition.x, defaultControlsPosition.y, defaultControlsPosition.z);
			}
		});

    /*
    ** User Click
    */

    const camToSave = {};
    let currentPoint;
    const mouse = new THREE.Vector2();

    for(const key in points)
    {
      const point = points[key];
      point.element.addEventListener('pointerdown', (event) => {
        currentPoint = point;
        camToSave.position = camera.position.clone();
        camToSave.quaternion = camera.quaternion.clone();
        let triggeredVisibilityDetails = false;
        let tween = gsap.to(controls.target, {
          duration: 1.2,
          x: point.position.x,
          y: point.position.y,
          z: point.position.z,
          delay: 0,
          onUpdate: () => {
            if (!triggeredVisibilityDetails && tween.progress() > 0.5) {
              triggeredVisibilityDetails = true;
              document.body.classList.add("details")
              point.details.classList.add("visible");
            }
          }
        });
      });
    }
    
    document.querySelector('.details__back').addEventListener('pointerdown', (event) => {
      camToSave.resetPosition = true;
      document.body.classList.remove("details");
      currentPoint.details.classList.remove("visible");
      currentPoint = null;
      gsap.to(controls.target, {
        duration: 1.2,
        x: defaultControlsPosition.x,
        y: defaultControlsPosition.y,
        z: defaultControlsPosition.z,
        delay: 0,
        onComplete: function() {
        }
      });
      gsap.to(camera.position, {
        duration: 1.2,
        x: camToSave.position.x,
        y: camToSave.position.y,
        z: camToSave.position.z,
        delay: 0,
        onUpdate: function() {
        }
      });
    });
    renderer.domElement.addEventListener('mousemove', (event) => {
      mouseMove(event.clientX, event.clientY);
    });

    renderer.domElement.addEventListener('pointerdown', (event) => {
      console.log('oh');
    });

    renderer.domElement.addEventListener('touchstart', (event) => {

    });

    const mouseMove = (x, y) => {
      mouse.x = x / sizes.width * 2 - 1;
      mouse.y = - (y / sizes.height) * 2 + 1;
      // cursorMovement.style.transform = `translateX(${x}px) translateY(${y}px)`;
    }

    /**
     * Animate
     */
    const clock = new THREE.Clock();
    let previousTime = 0;
    let cursorMovement = document.getElementById('cursorMovement');
    const tick = () => {
      stats.begin();
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - previousTime;
      previousTime = elapsedTime;


      // Update controls
      // if (currentPoint) {
      //   controls.target.lerp(currentPoint.position, 0.06);
      // } else {
      //   if (camToSave.resetPosition) {
      //     camera.position.lerp(camToSave.position, 0.12);
      //     camera.quaternion.slerp(camToSave.quaternion, 0.12);
      //     controls.target.lerp(camToSave.controlTarget, 0.12);
      //     if (camera.position.distanceTo(camToSave.position) < 0.01) {
      //       camToSave.resetPosition = false;
      //     }
      //   }
      // }
      controls.update();

      // Go through each point
      for(const key in points)
      {
        const point = points[key];
        const screenPosition = point.position.clone();
        screenPosition.project(camera);

        const translateX = screenPosition.x * sizes.width * 0.5;
        const translateY = - screenPosition.y * sizes.height * 0.5;
        point.element.style.transform = `translateX(${translateX}px) translateY(${translateY}px)`;
        
        // Check if point is visible before raycasting
        let frustum = new THREE.Frustum();
        frustum.setFromProjectionMatrix( new THREE.Matrix4().multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse ) );
        if (!frustum.containsPoint(point.position)) {
          point.element.classList.remove('visible');
          continue ;
        }

        raycaster.setFromCamera(screenPosition, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if(intersects.length === 0)
        {
          point.element.classList.add('visible');
        }
        else
        {
          const intersectionDistance = intersects[0].distance;
          const pointDistance = point.position.distanceTo(camera.position);
          if(intersectionDistance < pointDistance)
          {
            point.element.classList.remove('visible');
          }
          else
          {
            point.element.classList.add('visible')
          }
        }
      }

      // Render
      // renderer.render(scene, camera)
      effectComposer.render();

      stats.end();
      // Call tick again on the next frame
      window.requestAnimationFrame(tick);
    }

    tick();
    console.log(renderer.info);
  }
}

export { Scene };