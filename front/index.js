// ==============================
// IMPORTS AND CONFIGURATION
// ==============================
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js";
import { OrbitControls } from './lib/OrbitControls.js';

// ==============================
// GLOBAL VARIABLES
// ==============================
let scene, camera, renderer, controls, earth;
let clock = new THREE.Clock();
let points = [];
let lastPackageCount = 0;
let ROTATION_OFFSET = 180;
let LATITUDE_TILT = 0;
let countryCounts = {};
let isRotationEnabled = true;
let rotationSpeed = 0.15;
// ==============================
// CHART CONFIGURATION
// ==============================
const chartConfig = {
    width: 280,
    height: 300,
    margin: { top: 0, right: 20, bottom: 50, left: 70 }
};

let svg, xScale, yScale; // Added missing declarations

// ==============================
// MAIN INITIALIZATION
// ==============================
async function init() {
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    document.body.appendChild(renderer.domElement);

    // Scene setup
    scene = new THREE.Scene();

    // Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);

    // Create Earth
    createEarth();

    // Initialize controls and data fetching
    fetchPackages();
    setInterval(fetchPackages, 2000);

    // Orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 10;

    document.getElementById('rotation-toggle').addEventListener('change', (e) => {
        isRotationEnabled = e.target.checked;
    });


    // Start animation
    animate();

    initChart();
}

// ==============================
// CHART FUNCTIONS (MOVED UP)
// ==============================
function initChart() {
    svg = d3.select("#bar-chart svg")
        .attr("width", chartConfig.width)
        .attr("height", chartConfig.height);

    xScale = d3.scaleLinear()
        .range([chartConfig.margin.left, chartConfig.width - chartConfig.margin.right]);

    yScale = d3.scaleBand()
        .range([chartConfig.height - chartConfig.margin.bottom, chartConfig.margin.top])
        .padding(0.2);

    svg.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${chartConfig.margin.left},0)`);
}

function updateChart() {
    const data = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);

    const orderedData = data.reverse();

    xScale.domain([0, d3.max(data, d => d.count) || 1]);
    yScale.domain(orderedData.map(d => d.country));

    // Update bars
    const bars = svg.selectAll(".bar")
        .data(orderedData, d => d.country);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("fill", "#4A148C")
        .merge(bars)
        .transition()
        .duration(500)
        .attr("x", chartConfig.margin.left)
        .attr("y", d => yScale(d.country))
        .attr("width", d => xScale(d.count) - chartConfig.margin.left)
        .attr("height", yScale.bandwidth());

    bars.exit().remove();

    // Update y-axis
    svg.select(".y-axis")
        .transition()
        .duration(500)
        .call(d3.axisLeft(yScale))
        .selectAll("text")
        .style("fill", "white")
        .style("font-size", "10px");

    svg.selectAll(".domain").remove();
    svg.selectAll(".tick line").remove();
}

// ==============================
// EARTH CREATION
// ==============================
function createEarth() {
    const textureLoader = new THREE.TextureLoader();
    earth = new THREE.Mesh(
        new THREE.SphereGeometry(1, 64, 64),
        new THREE.MeshPhongMaterial({
            map: textureLoader.load('./static/texture.jpg'),
            normalMap: textureLoader.load('./static/earth_normalmap_8192x4096.jpg'),
            normalScale: new THREE.Vector2(0.85, 0.85),
            shininess: 25
        })
    );
    scene.add(earth);
}

// ==============================
// DATA HANDLING
// ==============================
function fetchPackages() {
    fetch('http://localhost:5000/packages')
        .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(data => {
            const newPackages = data.slice(lastPackageCount);
            lastPackageCount = data.length;

            newPackages.forEach(pkg => {
                // Create 3D point
                const point = createPoint(
                    pkg.latitude,
                    pkg.longitude,
                    pkg.suspicious === 1.0
                );
                points.push(point);

                // Determine country
                const country = getLocation(pkg.latitude, pkg.longitude);

                // Update country counts for bar chart
                countryCounts[country] = (countryCounts[country] || 0) + 1;

                // Add to table
                const tableBody = document.getElementById('package-table-body');
                const row = document.createElement('tr');

                // IP Address column
                const ipCell = document.createElement('td');
                ipCell.textContent = pkg.ip; // or pkg.ip depending on your data
                ipCell.style.color = pkg.suspicious === 1.0 ? '#ff0000' : '#00ff00';

                // Country column
                const countryCell = document.createElement('td');
                countryCell.textContent = country;
                countryCell.style.opacity = 0.8;

                row.appendChild(ipCell);
                row.appendChild(countryCell);
                tableBody.appendChild(row);
            });

            // Update visualization elements
            updateChart();
        })
        .catch(error => console.error('Fetch error:', error));
}

// ==============================
// POINT MANAGEMENT
// ==============================
function convertGeoTo3D(lat, lon) {
    const adjustedLat = lat + LATITUDE_TILT;
    const adjustedLon = -lon + ROTATION_OFFSET;

    const phi = THREE.MathUtils.degToRad(90 - adjustedLat);
    const theta = THREE.MathUtils.degToRad(adjustedLon);

    return {
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta)
    };
}

// ==============================
// LOCATION DETERMINATION
// ==============================
function getLocation(lat, lon) {
    // Approximate geographic boundaries
    if (lat >= 24 && lat <= 49 && lon >= -125 && lon <= -66) {  // USA
        return 'USA';
    } else if (lat >= 50 && lat <= 60 && lon >= -10 && lon <= 2) {  // UK
        return 'UK';
    } else if (lat >= 47 && lat <= 55 && lon >= 5 && lon <= 15) {  // Germany
        return 'Germany';
    } else if (lat > 40 && lon >= 19 && lon <= 180) {  // Russia
        return 'Russia';
    } else if (lat >= 18 && lat <= 53 && lon >= 73 && lon <= 135) {  // China
        return 'China';
    } else if (lat >= 24 && lat <= 45 && lon >= 122 && lon <= 153) {  // Japan
        return 'Japan';
    } else if (lat >= -45 && lat <= -10 && lon >= 112 && lon <= 154) {  // Australia
        return 'Australia';
    } else if (lat >= 8 && lat <= 37 && lon >= 68 && lon <= 97) {  // India
        return 'India';
    } else {
        return 'Other';
    }
}

function createPoint(lat, lon, isSuspicious) {
    const pos = convertGeoTo3D(lat, lon);

    const geometry = new THREE.SphereGeometry(0.005, 16, 16);
    const material = new THREE.MeshPhongMaterial({
        color: isSuspicious ? 0xff0000 : 0x00ff00,
        transparent: true,
        opacity: 0.9
    });

    const point = new THREE.Mesh(geometry, material);
    point.position.set(pos.x, pos.y, pos.z);
    point.userData = {
        origLat: lat,
        origLon: lon,
        startTime: clock.getElapsedTime(), // Store creation time
        isAnimating: true
    };

    earth.add(point);
    return point;
}

// ==============================
// ANIMATION LOOP
// ==============================
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const currentTime = clock.getElapsedTime();

    // Update rotation only if enabled
    if (isRotationEnabled) {
        earth.rotation.y += rotationSpeed * delta;
    }

    // Animate points
    points.forEach(point => {
        const elapsed = currentTime - point.userData.startTime;

        if (elapsed < 3) {
            // Calculate animation progress (0 to 1)
            const progress = elapsed / 3;

            // Create pulsating effect using sine wave
            const scaleFactor = 1 + 2 * Math.sin(progress * Math.PI);
            const opacity = 0.9 - 0.6 * Math.sin(progress * Math.PI);

            // Apply transformations
            point.scale.set(scaleFactor, scaleFactor, scaleFactor);
            point.material.opacity = opacity;
        } else if (point.userData.isAnimating) {
            // Reset to original state after animation
            point.scale.set(1, 1, 1);
            point.material.opacity = 0.9;
            point.userData.isAnimating = false;
        }
    });

    controls.update();
    renderer.render(scene, camera);
}

// ==============================
// WINDOW RESIZE HANDLER
// ==============================
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
