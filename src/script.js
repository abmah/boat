import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'lil-gui'
// import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

/**
 * Base
 */
// Debug
const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Loaders
 */
const textureLoader = new THREE.TextureLoader()
const gltfLoader = new GLTFLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

/**
 * Update all materials
 */
const updateAllMaterials = () => {
    scene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            child.material.envMapIntensity = 1
            child.material.needsUpdate = true
            child.castShadow = true
            child.receiveShadow = true
        }
    })
}

/**
 * Environment map
 */
const environmentMap = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.jpg',
    '/textures/environmentMaps/0/nx.jpg',
    '/textures/environmentMaps/0/py.jpg',
    '/textures/environmentMaps/0/ny.jpg',
    '/textures/environmentMaps/0/pz.jpg',
    '/textures/environmentMaps/0/nz.jpg'
])
environmentMap.encoding = THREE.sRGBEncoding

// scene.background = environmentMap
scene.environment = environmentMap


/**
 * Models
 */
// create gui folder 
const BoatFolder = gui.addFolder('Boat')
let boatMesh = null;

gltfLoader.load(
    '/models/boat.glb',
    (gltf) => {
        // Model
        boatMesh = gltf.scene
        boatMesh.traverse(function (child) {
            if (child.isMesh) {


                if (child) {
                }

            }
        })
        boatMesh.rotation.y = Math.PI * 0.5
        boatMesh.position.x = 5
        BoatFolder.add(boatMesh.position, 'x').min(- 10).max(10).step(0.01)
        BoatFolder.add(boatMesh.position, 'y').min(- 10).max(10).step(0.01)
        BoatFolder.add(boatMesh.position, 'z').min(- 10).max(10).step(0.01)
        scene.add(boatMesh)
        // Update materials
        updateAllMaterials()
    }
)

/**
 * Sea
 */

const debugObject = {}
debugObject.depthColor = '#5da4cb'
debugObject.surfaceColor = '#4d8bb3'
debugObject.intensitiy = 2;
const fog = new THREE.Fog('#5da4cb', 30, 50)
scene.fog = fog

gui.addColor(debugObject, 'depthColor').onChange(() => { SeaMaterial.uniforms.uDepthColor.value.set(debugObject.depthColor) })
gui.addColor(debugObject, 'surfaceColor').onChange(() => { SeaMaterial.uniforms.uSurfaceColor.value.set(debugObject.surfaceColor) })
// gui.add(debugObject, 'intensitiy').min(0).max(10).onChange(() => { SeaMaterial.uniforms.intensitiy.value = (debugObject.intensitiy) })

const Sea = new THREE.PlaneGeometry(400, 400, 5, 5)
const SeaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
        uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
        intensitiy: { value: debugObject.intensitiy }
    },
    vertexShader:
        `
    
    varying vec3  vPos;
    uniform float uTime;
    uniform float intensitiy;
    void main() {
    
    vec3 newPosition = position + sin(uv.x * 10.0 + uTime) * intensitiy;
    newPosition += position + sin(uv.y * 10.0 + uTime) * intensitiy * .5;
  
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

   
    vPos = newPosition;
    }
    `,
    fragmentShader:
        `
        uniform float uTime;
       
        varying vec3  vPos;
        uniform vec3 uSurfaceColor;
        uniform vec3 uDepthColor;
 
        
        void main() {
            vec3 color1 = uSurfaceColor;
            vec3 color2 = uDepthColor;
            vec3 color = mix(color1, color2, vPos.z);
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    wireframe: false
})

const seaMesh = new THREE.Mesh(Sea, SeaMaterial)
seaMesh.rotation.x = - Math.PI * 0.5
seaMesh.position.y = - 0.3
scene.add(seaMesh)

/**
 * Lights
 */
const directionalLight = new THREE.DirectionalLight('#ffffff', 3)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.normalBias = 0.05
directionalLight.position.set(0.25, 2, - 2.25)
scene.add(directionalLight)

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
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 200)


camera.position.set(2.87, 2.87, -0.57)
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'x').min(- 10).max(10).step(0.01)
cameraFolder.add(camera.position, 'y').min(- 10).max(10).step(0.01)
cameraFolder.add(camera.position, 'z').min(- 10).max(10).step(0.01)

scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFShadowMap
renderer.physicallyCorrectLights = true
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.setClearColor('#5da4cb')

/**
 * Animate
 */
const clock = new THREE.Clock()

const boatAnimation = (time) => {
    if (boatMesh) {
        let movementPace = Math.sin(time) * 2 * 0.008
        boatMesh.position.y += movementPace
        boatMesh.rotation.z = movementPace * 5
    }
}

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    // Update sea material
    SeaMaterial.uniforms.uTime.value = elapsedTime


    // Update controls
    controls.update()

    // Animate the boat
    boatAnimation(elapsedTime)


    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()