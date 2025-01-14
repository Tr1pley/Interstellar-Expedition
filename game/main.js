// main.js
import * as THREE from 'three';
// 如果想使用 OrbitControls，可以解开下面的注释
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';
// 如果想使用 GLTFLoader，可以解开下面的注释
import { GLTFLoader } from './three/examples/jsm/loaders/GLTFLoader.js';

// 如果你在 sun.js 里有 export 出某些对象或函数，可以这样导入
// 例如： export function createSun(...) {...}
import { createSun } from './js/lib/sun.js';

// ------------------ 以下是原先的脚本逻辑 ------------------

// 确保在 DOMContentLoaded 后执行，如果需要可以保留此监听
window.addEventListener('DOMContentLoaded', () => {
    // 初始化场景、相机和渲染器
    const scene = new THREE.Scene();

    // 设置相机（透视相机）
    const camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    camera.position.set(0, 10, 20);

    // 初始化渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 添加星空背景
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const positions = [];
    for (let i = 0; i < starsCount; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        positions.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // create asterism
    function createAsterism(dsitanceX, dsitanceY, dsitanceZ) {
        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(dsitanceX, dsitanceY, dsitanceZ);
        scene.add(pointLight);

        const asterismGeometry = new THREE.BufferGeometry();
        const asterismCount = 1500;
        const asterismPositions = [];
        const colors = [];
        for (let i = 0; i < asterismCount; i++) {
            const x = (Math.random() - 0.5) * 300 * Math.random() + dsitanceX;
            const y = (Math.random() - 0.5) * 30 * Math.random() + dsitanceY;
            const z = (Math.random() - 0.5) * 40 * Math.random() + dsitanceZ;
            asterismPositions.push(x, y, z);
            const colorR = 0.5 + Math.random() * 0.5;  // 赤成分（弱め）
            const colorG = 0.5;  // 緑成分（弱め）
            const colorB = 1.0;  // 青成分（強め）
            colors.push(colorR, colorG, colorB);
        }
        asterismGeometry.setAttribute('position', new THREE.Float32BufferAttribute(asterismPositions, 3));
        asterismGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const asterismMaterial = new THREE.PointsMaterial({
            size: 0.1,
            opacity: 0.6,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        const asterismField = new THREE.Points(asterismGeometry, asterismMaterial);

        asterismField.rotation.x = Math.PI / Math.random() * 2;
        asterismField.rotation.y = Math.PI / Math.random() * 2;
        asterismField.rotation.z = Math.PI / Math.random() * 2;

        scene.add(asterismField);
    }

    // 添加恒星（太阳）
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const texture = new THREE.TextureLoader().load("https://raw.githubusercontent.com/uemura5683/threejs_plactice/master/earth_vol2/img/sun.jpg");
    const sunMaterial = new THREE.MeshBasicMaterial({ map: texture });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    // 添加光源（使恒星发光）
    const pointLight = new THREE.PointLight(0xffffff, 1, 1000);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // 创建行星的函数
    function createPlanetWithTexture(planetData) {
        const geometry = new THREE.SphereGeometry(planetData.radius, 32, 32);
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(planetData.textureUrl);
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const planet = new THREE.Mesh(geometry, material);

        planet.userData = {
            distance: planetData.distance,
            speed: planetData.speed,
            angle: Math.random() * Math.PI * 2
        };
        planet.rotation.z = THREE.MathUtils.degToRad(planetData.tilt);
        scene.add(planet);
        return planet;
    }

    function createPlanetWithRing(planetData) {
        const planet = createPlanetWithTexture(planetData);
        const ringGeometory = new THREE.TorusGeometry(
            planetData.radius * 1.5,
            5,
            2,
            1000
        );
        const textureLoader = new THREE.TextureLoader();
        const ringTexture = textureLoader.load(planetData.ringTextureUrl);
        const ringMaterial = new THREE.MeshPhongMaterial({
            map: ringTexture,
            opacity: 0.7,
            transparent: true
        });
        const ring = new THREE.Mesh(ringGeometory, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
        planet.rotation.z = THREE.MathUtils.degToRad(planetData.tilt);

        return planet;
    }

    function createMoon(earth, moonData) {
        const moonGeometry = new THREE.SphereGeometry(moonData.radius, 32, 32);
        const moonTexture = new THREE.TextureLoader().load(moonData.textureUrl);
        const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });

        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.userData = {
            distance: moonData.distance,
            speed: moonData.speed,
            angle: Math.random() * Math.PI * 2
        };
        // 初期位置
        moon.position.set(
            Math.cos(moon.userData.angle) * moon.userData.distance,
            0,
            Math.sin(moon.userData.angle) * moon.userData.distance
        );
        earth.add(moon);

        return moon;
    }

    function createComet(cometData) {
        const geometry = new THREE.SphereGeometry(cometData.radius, 16, 16);
        const material = new THREE.MeshStandardMaterial({ color: cometData.color });
        const comet = new THREE.Mesh(geometry, material);

        const tailPositions = [];
        for (let i = 0; i < cometData.tailLength; i++) {
            tailPositions.push(0, 0, 0);
        }
        const tailGeometry = new THREE.BufferGeometry();
        tailGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(tailPositions, 3)
        );

        const tailMaterial = new THREE.LineBasicMaterial({
            color: cometData.color,
            linewidth: 2,
            transparent: true,
            opacity: 0.7,
        });

        const tail = new THREE.Line(tailGeometry, tailMaterial);

        const cometGroup = new THREE.Group();
        cometGroup.add(comet, tail);
        scene.add(cometGroup);

        cometGroup.userData = {
            speed: cometData.speed,
            angle: cometData.initialAngle,
            distance: cometData.distance,
            tailPositions,
            tailGeometry
        };

        return cometGroup;
    }

    function updateComet(comet) {
        const inclination = THREE.MathUtils.degToRad(30);
        const eccentricity = 0.7;
        const semiMajorAxis = 200;

        comet.userData.angle += comet.userData.speed;

        const x = semiMajorAxis * Math.cos(comet.userData.angle);
        const z = semiMajorAxis * Math.sqrt(1 - eccentricity ** 2) * Math.sin(comet.userData.angle);

        const y = z * Math.sin(inclination);
        comet.position.set(x, y, z * Math.cos(inclination));

        const tailPositions = comet.userData.tailPositions || [];
        const cometPosition = comet.position.clone();

        tailPositions.unshift(cometPosition);
        if (tailPositions.length > 30) tailPositions.pop();

        const positions = [];
        for (const pos of tailPositions) {
            positions.push(
                pos.x - comet.position.x,
                pos.y - comet.position.y,
                pos.z - comet.position.z
            );
        }

        comet.userData.tailGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        comet.userData.tailGeometry.attributes.position.needsUpdate = true;
    }

    // planet data
    const planetData = {
        mercury: {
            radius: 0.38,
            distance: 14,
            speed: 0.005,
            textureUrl: 'texture/mercury_tx.png',
            tilt: 0.03,
        },
        venus: {
            radius: 0.95,
            distance: 29,
            speed: 0.005,
            textureUrl: 'texture/venus_tx.png',
            tilt: 177.4,
        },
        earth: {
            radius: 1,
            distance: 40,
            speed: 0.005,
            textureUrl: 'texture/earth_tx.png',
            tilt: 23.4,
        },
        mars: {
            radius: 0.53,
            distance: 60,
            speed: 0.005,
            textureUrl: 'texture/mars_tx.png',
            tilt: 25.2,
        },
        jupiter: {
            radius: 10.97,
            distance: 100,
            speed: 0.003,
            textureUrl: 'texture/jupiter_tx.png',
            tilt: 3.1,
        },
        saturn: {
            radius: 9.13,
            distance: 150,
            speed: 0.002,
            textureUrl: 'texture/saturn_tx.png',
            ringTextureUrl: 'https://raw.githubusercontent.com/82mou/sandbox/master/universe/img/saturn-ring.jpg',
            tilt: 26.7,
        },
        uranus: {
            radius: 3.98,
            distance: 200,
            speed: 0.001,
            textureUrl: 'texture/uranus_tx.png',
            ringTextureUrl: 'https://raw.githubusercontent.com/82mou/sandbox/master/universe/img/ouranos-ring.jpg',
            tilt: 97.8,
        },
        neptune: {
            radius: 3.87,
            distance: 250,
            speed: 0.0009,
            textureUrl: 'texture/neptune_tx.png',
            tilt: 28.3,
        },
    };

    // moon data
    const moonData = {
        radius: 0.27,
        distance: 1.5,
        speed: 0.01,
        textureUrl: 'texture/moon_tx.png'
    };

    // comet data
    const cometData = {
        radius: 0.5,
        color: 0xffffff,
        speed: 0.002,
        distance: 100,
        startX: 20,
        startY: 0,
        startZ: 0,
        tailLength: 15,
        initialAngle: 0,
    };

    // 创建多个行星
    const planets = [
        createPlanetWithTexture(planetData.mercury),
        createPlanetWithTexture(planetData.venus),
        createPlanetWithTexture(planetData.earth),
        createPlanetWithTexture(planetData.mars),
        createPlanetWithTexture(planetData.jupiter),
        createPlanetWithRing(planetData.saturn),
        createPlanetWithRing(planetData.uranus),
        createPlanetWithTexture(planetData.neptune),
    ];

    // create moon
    const moon = createMoon(planets[2], moonData);

    // create asterism
    createAsterism(200, 0, -200);
    createAsterism(200, 5, 500);
    createAsterism(400, 5, 400);
    createAsterism(-200, 0, 300);
    createAsterism(-200, 0, -300);
    createAsterism(-500, 0, 10);

    // create comet
    const comet = createComet(cometData);

    // 创建飞船
    const spaceshipGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const spaceshipMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const spaceship = new THREE.Mesh(spaceshipGeometry, spaceshipMaterial);
    spaceship.position.set(0, 0, 15);
    scene.add(spaceship);

    // 添加飞船的光源（模拟引擎）
    const shipLight = new THREE.PointLight(0x00ff00, 1, 10);
    spaceship.add(shipLight);

    // 设置飞船的初始方向
    spaceship.lookAt(new THREE.Vector3(0, 0, 0));

    // 键盘控制
    const keys = { w: false, a: false, s: false, d: false };
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (keys.hasOwnProperty(key)) keys[key] = true;
    });
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (keys.hasOwnProperty(key)) keys[key] = false;
    });

    // 控制飞船移动
    function updateSpaceship() {
        const speed = 0.2;
        const direction = new THREE.Vector3();
        spaceship.getWorldDirection(direction);

        if (keys['s']) {
            spaceship.position.add(direction.clone().multiplyScalar(speed));
        }
        if (keys['w']) {
            spaceship.position.add(direction.clone().multiplyScalar(-speed));
        }
        if (keys['d']) {
            spaceship.rotation.y += 0.05;
        }
        if (keys['a']) {
            spaceship.rotation.y -= 0.05;
        }
    }

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // // 如果需要，可以启用 OrbitControls 调试
    // const controls = new OrbitControls(camera, renderer.domElement);

    // 动画循环
    function animate() {
        requestAnimationFrame(animate);

        // 更新行星位置
        planets.forEach((planet) => {
            planet.userData.angle += planet.userData.speed;
            planet.position.set(
                Math.cos(planet.userData.angle) * planet.userData.distance,
                0,
                Math.sin(planet.userData.angle) * planet.userData.distance
            );
        });

        // 地球的月球
        moon.userData.angle += moon.userData.speed;
        moon.position.set(
            Math.cos(moon.userData.angle) * moon.userData.distance,
            0,
            Math.sin(moon.userData.angle) * moon.userData.distance
        );

        // 更新飞船
        updateSpaceship();

        // 使相机跟随飞船
        const relativeCameraOffset = new THREE.Vector3(0, 5, 10);
        const cameraOffset = relativeCameraOffset.applyMatrix4(spaceship.matrixWorld);
        camera.position.lerp(cameraOffset, 0.05);
        camera.lookAt(spaceship.position);

        // 更新彗星
        updateComet(comet);

        renderer.render(scene, camera);
    }
    animate();
});
