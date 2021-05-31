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
import { TetrahedronGeometry } from 'three'

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
    // await this.buildScene();
    
    setTimeout(() => {
      document.body.classList.add("loaded");
    }, 1000);

    const self = this;
    document.querySelector('.loading-screen__button').onclick = () => {
      self.buildScene();
      document.body.classList.add("started");
      setTimeout(() => {
        self.video.play();
      }, 4200);
    };
  }

  async loadResources() {
    /**
     * Fonts
     */
    // const fontLoader = new THREE.FontLoader(this.loadingManager)

    // this.font = await fontLoader.loadAsync('/fonts/Poppins SemiBold_Regular.json');

    /**
    * Models
    */
    this.gltfLoader = new GLTFLoader(this.loadingManager)
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/')
    this.gltfLoader.setDRACOLoader(dracoLoader)

    // LOAD OFFICE
    const gltf = await this.gltfLoader.loadAsync('/models/Offices/office.gltf');

    // SETUP GLASS MATERIAL
    const glassMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      opacity: 0.5,
      transparent: true,
    });

    // SETUP VIDEO TEXTURE
    const video = document.createElement('video');
    this.video = video;
    video.setAttribute('crossorigin', 'anonymous');
    video.src = "https://player.vimeo.com/external/538877060.hd.mp4?s=4042b4dc217598f5ce7c4cf8b8c3787b42218ea3&profile_id=175";
    //video.src = "https://cf.appdrag.com/wassimdemo/asset/welcome.mp4";
    video.load();
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.wrapT = THREE.RepeatWrapping;
    videoTexture.repeat.y = - 1;
    const videoMaterial =  new THREE.MeshBasicMaterial( {map: videoTexture, side: THREE.FrontSide, toneMapped: false} );

    const self = this;
    // SETUP CUSTOM MATERIALS
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.emissive = child.material.color;
        child.material.emissiveMap = child.material.map;
        if (child.material.name == "Baked") {
          console.log(child.material);
          window.material = child.material;
        }
        if (child.material && child.material.name == 'A_Glass') {
          child.material = glassMaterial;
        }
        if (child.material.name == 'ScreenComputer') {
          self.computerObject = child;
          child.material = videoMaterial;
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
        visible: false,
      },
      'SM_Prop_CorkBoard_01' : {
        offset: new THREE.Vector3(-0.4, 0.3, 0.3),
        element: document.querySelector('.point--activities'),
        details: document.querySelector('.screen--activities'),
        visible: false,
      },
      'SM_Prop_Trophy_01' : {
        offset: new THREE.Vector3(0, 0, 0.3),
        element: document.querySelector('.point--achievements'),
        details: document.querySelector('.screen--achievements'),
        visible: false,
      },
      'SM_Prop_Computer_Setup_01' : {
        offset: new THREE.Vector3(0, 0.2, 0.5),
        element: document.querySelector('.point--about'),
        details: document.querySelector('.screen--about'),
        visible: false,
      },
      'SM_Prop_Phone_Desk_01' : {
        offset: new THREE.Vector3(0, 0.27, 0),
        element: document.querySelector('.point--contact'),
        details: document.querySelector('.screen--contact'),
        visible: false,
      },
      'SM_Prop_Book_Group_02' : {
        offset: new THREE.Vector3(0, 0, 0.3),
        element: document.querySelector('.point--skills'),
        details: document.querySelector('.screen--skills'),
        visible: false,
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
    renderer.shadowMap.enabled = false;
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

    document.body.classList.add('camera-moving');
    gsap.to(camera.position, {
			duration: 4,
			x: -1.8,
			y: 1.3,
			z: 1.1,
      delay: 2.4,
			onUpdate: () => {
        controls.target.set(defaultControlsPosition.x, defaultControlsPosition.y, defaultControlsPosition.z);
			},
      onComplete: () => {
        document.body.classList.remove('camera-moving');
      },
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
      document.body.classList.add('camera-moving');
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
          },
          onComplete: () => {
            document.body.classList.remove('camera-moving');
          }
        });
      });
    }
    
    document.querySelector('.details__back').addEventListener('pointerdown', (event) => {
      camToSave.resetPosition = true;
      document.body.classList.remove("details");
      currentPoint.details.classList.remove("visible");
      currentPoint = null;
      document.body.classList.add('camera-moving');
      gsap.to(controls.target, {
        duration: 1.2,
        x: defaultControlsPosition.x,
        y: defaultControlsPosition.y,
        z: defaultControlsPosition.z,
        delay: 0,
        onComplete: () => {
          document.body.classList.remove('camera-moving');
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

    let isHoveringComputerScreen = false;
    renderer.domElement.addEventListener('mousemove', (event) => {
      mouseMove(event.clientX, event.clientY);
    });

    renderer.domElement.addEventListener('pointerdown', (event) => {
      if (isHoveringComputerScreen) {
        if (self.video.paused) {
          self.video.play(); 
        } else {
          //self.video.pause();
        }
      } else {
        console.log('ne');
      }
    });

    renderer.domElement.addEventListener('touchstart', (event) => {

    });

    const mouseMove = (x, y) => {
      mouse.x = x / sizes.width * 2 - 1;
      mouse.y = - (y / sizes.height) * 2 + 1;
      // cursorMovement.style.transform = `translateX(${x}px) translateY(${y}px)`;
    }

    const setVisibilityForPoint = (point, visible) => {
      if (visible && !point.visible) {
        point.element.classList.add('visible');
      }
      if (!visible && point.visible) {
        point.element.classList.remove('visible');
      }
      point.visible = visible;
    }
    /**
     * Animate
     */
    const clock = new THREE.Clock();
    let previousTime = 0;
    let cursorMovement = document.getElementById('cursorMovement');
    const self = this;
    const tick = () => {
      stats.begin();
      const elapsedTime = clock.getElapsedTime();
      const deltaTime = elapsedTime - previousTime;
      previousTime = elapsedTime;

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
          setVisibilityForPoint(point, false);
          continue ;
        }

        raycaster.setFromCamera(screenPosition, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        if(intersects.length === 0)
        {
          setVisibilityForPoint(point, true);
        }
        else
        {
          const intersectionDistance = intersects[0].distance;
          const pointDistance = point.position.distanceTo(camera.position);
          if(intersectionDistance < pointDistance)
          {
            setVisibilityForPoint(point, false);
          }
          else
          {
            setVisibilityForPoint(point, true);
          }
        }

        raycaster.setFromCamera(mouse, camera);
        const intersectsComputer = raycaster.intersectObjects([self.computerObject]);
        if (intersectsComputer.length) {
          isHoveringComputerScreen = true;
        } else {
          isHoveringComputerScreen = false;
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