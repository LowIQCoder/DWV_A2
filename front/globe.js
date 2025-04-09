// ==============================
// IMPORTS AND CONFIGURATION
// ==============================

// Importing the Three.js library and required modules
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { OrbitControls } from './lib/OrbitControls.js';
import { GLTFLoader } from "./lib/GLTFLoader.js";

// Constants for simulation settings
const SIMULATION_DURATION = 60; // Total simulation duration in seconds
let TIME_ACCELERATION = 1440 / 10; // Speed multiplier for simulation time
const FLIGHT_SPEED = 0.00015; // Speed of flights in degrees per millisecond

// ==============================
// GLOBAL VARIABLES
// ==============================

let scene, camera, renderer, controls, earth, sunLight;
let flights = []; // Array to store flight objects
let clock = new THREE.Clock(); // Clock to track time
let tooltip = document.getElementById('tooltip'); // Tooltip element for flight info
let raycaster = new THREE.Raycaster(); // Raycaster for detecting mouse interactions
let mouse = new THREE.Vector2(); // Vector to store mouse position
let planeInstances; // Instanced mesh for planes
let airportStars = []; // Array to store airport star objects and their data

// ==============================
// FLIGHT CLASS
// ==============================

/**
 * Represents a flight and its behavior.
 * Handles flight data, path creation, and dynamic updates.
 */
class Flight {
    constructor(data) {
        this.data = data; // Flight data from the dataset
        this.startTime = this.parseTime(data.departure_time); // Start time in simulation seconds
        this.duration = this.calculateDuration(); // Duration of the flight
        this.curvePoints = calculateCurvePoints(
            this.data.origin_lat,
            this.data.origin_lon,
            this.data.destination_lat,
            this.data.destination_lon,
            50 // Number of segments for smoothness
        ); // Precompute the curved path
        this.dynamicPath = this.createDynamicPath(this.curvePoints); // Dynamic path for visualization
        this.dynamicPathAdded = false; // Track if dynamicPath is added to the scene
        this.dynamicSegmentIndex = 0; // Track the last drawn segment index
    }


    /**
     * TASK 7::
     * Parses the departure time string into simulation seconds.
     * @param {string} timeString - Time in "HH:MM" format.
     * @returns {number} Time in seconds.
     */
    parseTime(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 3600 + minutes * 60; // Convert hours and minutes to seconds
    }
    
    /**
     * TASK 8::
     * Calculates the flight duration based on the distance between origin and destination.
     * Uses the haversine formula to calculate the great-circle distance.
     */
    calculateDuration() {
        return 10000; // Duration based on speed
    }

    /**
     * Creates a dynamic line for the flight path.
     * @param {Array} curvePoints - Precomputed curve points for the path.
     */
    createDynamicPath(curvePoints) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array((curvePoints.length - 1) * 6); // Allocate space for all segments
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return new THREE.LineSegments(
            geometry,
            new THREE.LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 })
        );
    }

    /**
     * Updates the flight's position and dynamically draws the path.
     * @param {number} currentTime - Current simulation time in seconds.
     */
    update(currentTime) {
        if (currentTime >= this.startTime && !this.dynamicPathAdded) {
            this.dynamicPathAdded = true;
            scene.add(this.dynamicPath); // Add the dynamic path to the scene
            this.dynamicPath.visible = true; // Ensure visibility
        }

        if (this.dynamicPathAdded && currentTime <= this.startTime + this.duration) {
            const t = (currentTime - this.startTime) / this.duration; // Progress of the flight
            const targetSegmentIndex = Math.floor(t * (this.curvePoints.length - 1));

            // Draw segments up to the current progress
            if (targetSegmentIndex > this.dynamicSegmentIndex) {
                const positions = this.dynamicPath.geometry.attributes.position.array;
                for (let i = this.dynamicSegmentIndex; i <= targetSegmentIndex; i++) {
                    const start = this.curvePoints[i];
                    const end = this.curvePoints[i + 1];

                    if (end) {
                        const offset = i * 6; // Each segment has 6 values (start and end points)
                        positions[offset] = start.x;
                        positions[offset + 1] = start.y;
                        positions[offset + 2] = start.z;
                        positions[offset + 3] = end.x;
                        positions[offset + 4] = end.y;
                        positions[offset + 5] = end.z;
                    }
                }
                this.dynamicPath.geometry.attributes.position.needsUpdate = true; // Mark as updated
                this.dynamicSegmentIndex = targetSegmentIndex; // Update the last drawn segment index
            }
        }
    }

    /**
     * Converts latitude and longitude to a 3D vector on a sphere.
     * @param {number} lat - Latitude in degrees.
     * @param {number} lon - Longitude in degrees.
     * @param {number} radius - Radius of the sphere (default is 1).
     * @returns {THREE.Vector3} A 3D vector representing the position on the sphere.
     */
    latLongToVector3(lat, lon, radius = 1) {
        const phi = THREE.MathUtils.degToRad(90 - lat); // Convert latitude to polar angle
        const theta = THREE.MathUtils.degToRad(lon + 90); // Convert longitude to azimuthal angle
        return new THREE.Vector3().setFromSphericalCoords(radius, phi, theta);
    }
}

// Add the method to the Flight class
Flight.prototype.latLongToVector3 = Flight.prototype.latLongToVector3;

// ==============================
// SCENE INITIALIZATION
// ==============================

/**
 * Initializes the Three.js scene, camera, renderer, and other components.
 */
async function init() {
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.autoClear = false; // Ensure the renderer does not clear the DOM

    // Scene setup
    scene = new THREE.Scene();
    
    // TASK 1::  Set background to black
    scene.background =  // Set background to black
    
    // TASK 2:: Modify Camera Setup and watch the result
    // Set camera position to (3, 3, 3) and look at the center of the scene
    // Set camera field of view to 20 degrees
    // Set camera aspect ratio to window's width and height
    // Set camera near and far clipping planes to 0.1 and 1000 respectively
    // Set camera field of view to 20 degrees

    // Camera setup
    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 4, 4); // Position the camera
    camera.lookAt(0, 0, 0); // Point the camera at the center of the scene


    // TASK 3::  Set the sun light to white color and intensity of 1
    // Set the sun light position to (5, 3, 5)
    // Add the sun light to the scene
    // Add a point light with proper decay and distance
    sunLight = new THREE.PointLight(0xffffff, 1, 70);
    sunLight.decay = 2; // Set decay for realistic light falloff
    sunLight.position.set(20, 0, 0);
    scene.add(sunLight);

    

    // Add an ambient light to soften shadows and improve overall lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);

    // Earth setup
    createEarth();
    createMoon();

    // TASK 4 :: Controls setup
    // Prepera the orbit controls to allow user to rotate the camera around the scene
    // Set the controls to enable damping for smoother movement
    // Set the damping factor to 0.05
    // Set the minimum and maximum distance for zooming in and out
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enable damping for smoother controls
    controls.dampingFactor = 0.05;
    controls.maxDistance = 50; // Set maximum zoom-out distance
    controls.minDistance = 2;  // Set minimum zoom-in distance

    // Load flight data
    await loadFlightData();

    // Setup UI elements
    setupToggleButtons();
    setupSpeedControl();

    // Start the animation loop
    animate();
}

/**
 * TASK 5 :: Creates the Earth with textures and lighting effects.
 * The Earth should include textures for the surface, normal map, specular map, and emissive map to simulate city lights.
 * Use THREE.SphereGeometry to create a sphere with a radius of 1 and high detail (64 segments for width and height).
 * Use THREE.TextureLoader to load the following textures:
 * Surface Texture: https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg
 * Normal Map: https://threejs.org/examples/textures/planets/earth_normal_2048.jpg
 * Emissive Map: earth_lights.gif from asset folder
 * Specular Map: https://threejs.org/examples/textures/planets/earth_specular_2048.jpg
 * Update the code bellow
*/
function createEarth() {
    const textureLoader = new THREE.TextureLoader();
    const earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64), // High-detail sphere geometry
        new THREE.MeshStandardMaterial({
            map: textureLoader.load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg'), // Surface texture
            normalMap: textureLoader.load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg'), // Normal map for surface details
            emissiveMap: textureLoader.load('./assets/earth_lights.gif'), // Emissive map for city lights
            emissive: 0xffffff, // Emissive color            
            emissiveIntensity: 0.5, // Intensity of the emissive effect
            specularMap: textureLoader.load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg') // Specular map for reflective properties
        })
    );
    earth.castShadow = true
    earth.receiveShadow = true;
    scene.add(earth);
}

function createMoon() {
    const textureLoader = new THREE.TextureLoader();
    const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.27, 32, 32), // Smaller sphere for the moon
        new THREE.MeshStandardMaterial({
            map: textureLoader.load('https://threejs.org/examples/textures/planets/moon_1024.jpg'), // Moon texture
            normalMap: textureLoader.load('https://threejs.org/examples/textures/planets/moon_normal_1024.jpg') // Normal map for surface details
        })
    );
    moon.castShadow = true; // Enable shadow casting for the moon
    moon.receiveShadow = true; // Enable shadow receiving for the moon
    moon.name = 'Moon'; // Assign a name to the moon object

    // Position the moon relative to the Earth
    moon.position.set(10, 0, 0); // Example position (2 units away from Earth)
    scene.add(moon);
}

// ==============================
// FLIGHT DATA LOADING
// ==============================

/**
 * Loads flight data from a CSV file and initializes flights.
 */
async function loadFlightData() {
    const response = await fetch('flight_dataset.csv');
    const csvData = await response.text();
    await new Promise(resolve => Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
            results.data.forEach(data => {
                if (data && data.departure_time) {
                    const flight = new Flight(data); // Create a flight object
                    flights.push(flight); // Add to the flights array
                }
            });
            createInstancedPlanes(); // Create the instanced mesh after flights are populated
            createAirportStars(); // Add stars at airport positions
            resolve();
        }
    }));
}

// ==============================
// ANIMATION LOOP
// ==============================

/**
 * Continuously renders the scene and updates flight positions.
 */
function animate() {
    requestAnimationFrame(animate); // Request the next frame
    const delta = clock.getDelta(); // Time elapsed since the last frame
    const currentTime = clock.getElapsedTime() * TIME_ACCELERATION; // Simulated time
    // Slow down the sun's rotation speed
    const sunRotationSpeed = 0.001; // Adjust this value to control the speed
    const sunTime = currentTime * sunRotationSpeed;
    // TASK 3 :: Update the sun's position to match Earth's rotation
    // Use Earth's rotation to calculate the sun's position
    sunLight.position.set(
    Math.sin(sunTime) * 5, // X-coordinate oscillates with time
    Math.cos(sunTime) * 5, // Y-coordinate oscillates with time
    3); // Z-coordinate remains constant

    // Animate the moon to orbit around the Earth
    const moonOrbitRadius = 10; // Distance from the Earth
    const moonOrbitSpeed = 0.005; // Speed of the moon's orbit

    const moon = scene.getObjectByName('Moon'); // Assuming the moon is named "Moon"
    if (moon) {
        moon.position.set(
            Math.cos(currentTime * moonOrbitSpeed) * moonOrbitRadius, // X-coordinate
            0, // Y-coordinate remains constant
            Math.sin(currentTime * moonOrbitSpeed) * moonOrbitRadius // Z-coordinate
        );
    }

    updateInstancedPlanes(currentTime); // Update the instanced planes
    flights.forEach(flight => flight.update(currentTime)); // Update all flights
    
    // Task 4 :: Update the controls
    // Update the controls for camera movement
    controls.update(); // Update the controls for camera movement
    renderer.render(scene, camera); // Render the scene
}

// ==============================
// EVENT HANDLERS
// ==============================

// Handle window resize events
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handle mouse movement for tooltips
window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Intersect with the instanced mesh (planes)
    // uses the raycaster to check for intersections between the mouse pointer (converted to a ray)
    // and the planeInstances object (an InstancedMesh containing all the planes).
    // returns an array of intersection objects. 
    // Each intersection contains details about the intersected instance, 
    // such as its instanceId.
    const planeIntersects = raycaster.intersectObject(planeInstances);
    if (planeIntersects.length > 0) {
        const instanceId = planeIntersects[0].instanceId; // Get the instance ID
        if (instanceId !== undefined) {
            const flight = flights[instanceId]; // Map the instance ID to the corresponding flight
            if (flight) {
                tooltip.style.display = 'block';
                tooltip.style.left = `${event.clientX + 15}px`;
                tooltip.style.top = `${event.clientY + 15}px`;
                tooltip.innerHTML = `
                    <strong>Flight Details</strong><br>
                    Plane Name: ${flight.data.plane_name || 'Unknown'}<br>
                    Plane Model: ${flight.data.plane_model || 'Unknown'}<br>
                    From: ${flight.data.origin_iata || 'Unknown'} (${flight.data.origin_lat}, ${flight.data.origin_lon})<br>
                    To: ${flight.data.destination_iata || 'Unknown'} (${flight.data.destination_lat}, ${flight.data.destination_lon})<br>
                    Departure: ${flight.data.departure_time || 'Unknown'}<br>
                    Duration: ${Math.round(flight.duration / 60)} minutes
                `;
                return;
            }
        }
    }
    // TASK 6:: 
    // Intersect with airport stars
    // Check if the mouse intersects with any airport stars
    // If it does, display the tooltip with airport information.
    const validStars = airportStars.map(a => a.star).filter(star => star !== undefined && star !== null);
    const starIntersects = raycaster.intersectObjects(validStars);
    if (starIntersects.length > 0) {
        const intersectedStar = starIntersects[0].object;
        const airport = airportStars.find(a => a.star === intersectedStar);
        if (airport) {
            tooltip.style.display = 'block';
            tooltip.style.left = `${event.clientX + 15}px`;
            tooltip.style.top = `${event.clientY + 15}px`;
            tooltip.innerHTML = `
                <strong>Airport Details</strong><br>
                Latitude: ${airport.data.lat}<br>
                Longitude: ${airport.data.lon}<br>
                Planes: ${airport.data.planes}
            `;
            return;
        }
    }
    

    tooltip.style.display = 'none'; // Hide tooltip if no intersection
    tooltip.style.cssText = `
        position: absolute;
        background-color: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
        display: none;
    `;
});

// ==============================
// START THE APPLICATION
// ==============================

init();

// Create flight paths and instanced planes
function createFlightPaths() {
    flights.forEach(flight => {
        const curvePoints = calculateCurvePoints(
            flight.data.origin_lat,
            flight.data.origin_lon,
            flight.data.destination_lat,
            flight.data.destination_lon,
            50 // Number of segments for smoothness
        );

        const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const curveMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2, opacity: 0.8, transparent: true }); // Green lines with transparency
        const curveLine = new THREE.Line(curveGeometry, curveMaterial);

        curveLine.visible = false; // Hide complete lines initially
        flight.path = curveLine; // Assign the complete path to the flight
        scene.add(curveLine); // Add the complete path to the scene
    });
}

function createInstancedPlanes() {
    const dotGeometry = new THREE.SphereGeometry(0.01, 8, 8); // Small sphere for dots
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 , emissiveIntensity: 0.1 }); // Red color for dots

    planeInstances = new THREE.InstancedMesh(dotGeometry, dotMaterial, flights.length);

    // Ensure boundingSphere is defined for raycasting
    dotGeometry.computeBoundingSphere();

    // Override raycast method for InstancedMesh
    planeInstances.raycast = function (raycaster, intersects) {
        const inverseMatrix = new THREE.Matrix4();
        const ray = new THREE.Ray();
        const sphere = new THREE.Sphere();

        const instanceMatrix = new THREE.Matrix4();
        const localRay = new THREE.Ray();

        sphere.copy(dotGeometry.boundingSphere).applyMatrix4(instanceMatrix);

        for (let i = 0; i < this.count; i++) {
            this.getMatrixAt(i, instanceMatrix);
            inverseMatrix.copy(instanceMatrix).invert();
            localRay.copy(raycaster.ray).applyMatrix4(inverseMatrix);

            if (localRay.intersectsSphere(sphere)) {
                const intersectionPoint = new THREE.Vector3();
                localRay.intersectSphere(sphere, intersectionPoint);
                intersectionPoint.applyMatrix4(instanceMatrix);

                const distance = raycaster.ray.origin.distanceTo(intersectionPoint);
                if (distance < raycaster.near || distance > raycaster.far) continue;

                intersects.push({
                    distance: distance,
                    point: intersectionPoint.clone(),
                    object: this,
                    instanceId: i, // Add instanceId to the intersection
                });
            }
        }
    };

    scene.add(planeInstances); // Add the instanced mesh to the scene
    createFlightPaths(); // Create flight path lines
}

// Function to calculate a curved path between two points on a sphere
/**
 * Generates a curved path (great-circle arc) between two geographical points on a sphere.
 * Converts the origin and destination lat/lon into 3D vectors slightly above the sphere's surface.
 * Interpolates between the start and end points in `segments` steps using linear interpolation.
 * Normalizes each interpolated point to ensure it lies on the sphere, then scales it to simulate altitude.
 * Returns an array of `THREE.Vector3` points representing the curve.
 * 
 * @param {number} originLat - Latitude of the starting point.
 * @param {number} originLon - Longitude of the starting point.
 * @param {number} destLat - Latitude of the destination point.
 * @param {number} destLon - Longitude of the destination point.
 * @param {number} segments - Number of segments for the curve (default: 50).
 * @returns {THREE.Vector3[]} Array of points forming the curve.
 */
function calculateCurvePoints(originLat, originLon, destLat, destLon, segments = 50) {
    const curvePoints = [];
    const start = Flight.prototype.latLongToVector3(originLat, originLon, 1.05); // Slightly above the surface
    const end = Flight.prototype.latLongToVector3(destLat, destLon, 1.05); // Slightly above the surface

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const intermediate = new THREE.Vector3().lerpVectors(start, end, t).normalize().multiplyScalar(1.05); // Offset for altitude
        curvePoints.push(intermediate);
    }

    return curvePoints;
}

// Update instanced planes' positions
function updateInstancedPlanes(currentTime) {
    if (!planeInstances || !flights.length) return;

    const dummy = new THREE.Object3D(); // Temporary object for transformations

    flights.forEach((flight, index) => {
        const t = (currentTime - flight.startTime) / flight.duration; // Progress of the flight

        if (t >= 0 && t <= 1) {
            const start = Flight.prototype.latLongToVector3(flight.data.origin_lat, flight.data.origin_lon);
            const end = Flight.prototype.latLongToVector3(flight.data.destination_lat, flight.data.destination_lon);
            const radiusOffset = 0.05; // Offset for path above the sphere

            // Interpolate position smoothly along the curve
            const currentPos = new THREE.Vector3().copy(start).lerp(end, t).normalize().multiplyScalar(1 + radiusOffset);

            // Set position and orientation
            dummy.position.copy(currentPos);
            const nextPos = new THREE.Vector3().copy(start).lerp(end, Math.min(t + 0.01, 1)).normalize().multiplyScalar(1 + radiusOffset);
            dummy.lookAt(nextPos);

            // Apply transformations to the instance
            dummy.updateMatrix();
            planeInstances.setMatrixAt(index, dummy.matrix);

            // Update airport plane counts
            if (t < 0.01 && !flight.departed) {
                // Plane just departed, decrement origin airport count
                const originKey = `${flight.data.origin_lat},${flight.data.origin_lon}`;
                const originAirport = airportStars.find(a => `${a.data.lat},${a.data.lon}` === originKey);
                if (originAirport) originAirport.data.planes--;
                flight.departed = true; // Mark flight as departed
            } else if (t > 0.99 && !flight.arrived) {
                // Plane just arrived, increment destination airport count
                const destinationKey = `${flight.data.destination_lat},${flight.data.destination_lon}`;
                const destinationAirport = airportStars.find(a => `${a.data.lat},${a.data.lon}` === destinationKey);
                if (destinationAirport) destinationAirport.data.planes++;
                flight.arrived = true; // Mark flight as arrived
            }
        }
    });

    planeInstances.instanceMatrix.needsUpdate = true; // Notify Three.js of the updates
}

// Task 9:: the following code adds button to toggle the visibility of dynamic lines
// You task is to update the code to add another buttong to toggle the visibility of complete lines
function setupToggleButtons() {
    const buttonStyle = `
        position: absolute;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: bold;
        color: #fff;
        background-color: #007bff;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: background-color 0.3s ease;
        z-index: 1000; /* Ensure buttons stay on top */
        display: block; /* Ensure buttons are visible */
    `;

    const toggleDynamicLinesButton = document.createElement('button');
    toggleDynamicLinesButton.innerText = 'Toggle Dynamic Lines';
    toggleDynamicLinesButton.style.cssText = buttonStyle;
    toggleDynamicLinesButton.style.top = '60px';
    toggleDynamicLinesButton.style.left = '10px';
    document.body.appendChild(toggleDynamicLinesButton);

    let areDynamicLinesVisible = true;

    toggleDynamicLinesButton.addEventListener('click', () => {
        areDynamicLinesVisible = !areDynamicLinesVisible;
        flights.forEach(flight => {
            if (flight.dynamicPath) flight.dynamicPath.visible = areDynamicLinesVisible;
        });
    });

    const toggleCompleteLinesButton = document.createElement('button');
    toggleCompleteLinesButton.innerText = 'Toggle Complete Lines';
    toggleCompleteLinesButton.style.cssText = buttonStyle;
    toggleCompleteLinesButton.style.top = '10px';
    toggleCompleteLinesButton.style.left = '10px';
    document.body.appendChild(toggleCompleteLinesButton);

    let areCompleteLinesVisible = false;

    toggleCompleteLinesButton.addEventListener('click', () => {
        areCompleteLinesVisible = !areCompleteLinesVisible;
        flights.forEach(flight => {
            if (flight.path) flight.path.visible = areCompleteLinesVisible;
        });
    });
}

// Add a slider to control simulation speed
function setupSpeedControl() {
    const speedControlContainer = document.createElement('div');
    speedControlContainer.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        z-index: 1000;
        background-color: rgba(0, 0, 0, 0.8);
        color: #fff;
        padding: 10px;
        border-radius: 5px;
        font-family: Arial, sans-serif;
        font-size: 14px;
    `;

    const speedLabel = document.createElement('label');
    speedLabel.innerText = 'Simulation Speed: ';
    speedLabel.style.marginRight = '10px';

    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '1';
    speedSlider.max = '10';
    speedSlider.value = '5';
    speedSlider.style.width = '200px';

    speedSlider.addEventListener('input', () => {
        TIME_ACCELERATION = 1440 / speedSlider.value; // Adjust time acceleration based on slider value
    });

    speedControlContainer.appendChild(speedLabel);
    speedControlContainer.appendChild(speedSlider);
    document.body.appendChild(speedControlContainer);
}

// Create stars at airport positions
function createAirportStars() {
    const starGeometry = new THREE.SphereGeometry(0.01, 16, 16); // Slightly larger sphere for stars
    const starMaterial = new THREE.MeshStandardMaterial({ color: 0xf7a400, emissive: 0xffd700, emissiveIntensity: 1.1 }); // Gold color with emissive effect

    const airportData = {}; // Object to store airport details (e.g., number of planes)

    flights.forEach(flight => {
        const originKey = `${flight.data.origin_lat},${flight.data.origin_lon}`;
        const destinationKey = `${flight.data.destination_lat},${flight.data.destination_lon}`;

        // Increment plane count only for the origin airport at the start
        if (!airportData[originKey]) {
            airportData[originKey] = { lat: flight.data.origin_lat, lon: flight.data.origin_lon, planes: 0 };
        }
        airportData[originKey].planes++;

        // Ensure destination airport exists in the data
        if (!airportData[destinationKey]) {
            airportData[destinationKey] = { lat: flight.data.destination_lat, lon: flight.data.destination_lon, planes: 0 };
        }
    });

    Object.values(airportData).forEach(airport => {
        const position = Flight.prototype.latLongToVector3(airport.lat, airport.lon);

        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.copy(position);
        scene.add(star);

        airportStars.push({ star, data: airport });
    });
}