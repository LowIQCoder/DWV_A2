let scene, camera, renderer, globe;
let points = [];

// Colors
const colors = {
    normal: 0x00ff00,
    suspicious: 0xff0000
};

// Initialize Three.js scene
function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Create globe
    createGlobe();

    // Camera position
    camera.position.z = 2.5;
    new THREE.OrbitControls(camera, renderer.domElement);

    // Start animation loop
    animate();

    // Fetch data every second
    setInterval(fetchData, 1000);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function createGlobe() {
    // Earth geometry
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const textureLoader = new THREE.TextureLoader();
    // Load Earth textures
    const earthTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg');
    const earthNormalMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg');

    // Create Earth material
    const material = new THREE.MeshPhongMaterial({
        map: earthTexture,
        normalMap: earthNormalMap,
        transparent: true
    });

    // Create globe mesh
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);
}

function addPoint(lat, lon, isSuspicious) {
    // Convert lat/lon to 3D position
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (180 - lon) * Math.PI / 180;
    const radius = 1.01;

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    // Create point
    const geometry = new THREE.SphereGeometry(0.01, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: isSuspicious ? colors.suspicious : colors.normal,
        transparent: true
    });
    const point = new THREE.Mesh(geometry, material);
    point.position.set(x, y, z);
    point.createdAt = Date.now();

    scene.add(point);
    points.push(point);
}

async function fetchData() {
    try {
        // Change from http://server:5000 to
        const response = await fetch('http://localhost:5000/packages');
        const packages = await response.json();

        // Process new packages
        packages.forEach(pkg => {
            addPoint(
                pkg.latitude,
                pkg.longitude,
                pkg.suspicious == 1
            );
        });

        // Update stats
        document.getElementById('stats').innerHTML = `
                    Total Points: ${points.length}<br>
                    Last Update: ${new Date().toLocaleTimeString()}
                `;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start application
init();