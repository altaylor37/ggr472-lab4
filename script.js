// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYWx0YXlsb3IzNyIsImEiOiJjbHMyOWRoY2wwMWllMmtxam1yZjE3ams4In0.qdGA5yoWQbVEgPX3Tlru5A'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/altaylor37/cls29ky3c01ug01p2at938z40',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});

//Map controls
map.addControl(new mapboxgl.FullscreenControl());
map.addControl(new mapboxgl.NavigationControl());

// Empty variables and fetching data.
let collisions;
let bBoxGeoJson;
let bboxCoords;
let boundsTO;
let boundsTOPoly;
fetch('https://raw.githubusercontent.com/altaylor37/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        collisions = response;
    });

fetch('https://raw.githubusercontent.com/altaylor37/ggr472-lab4/main/TorontoLineBoundary.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        boundsTO = response;
    });

fetch('https://raw.githubusercontent.com/altaylor37/ggr472-lab4/main/TorontoBoundary.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        boundsTOPoly = response;
    });

//Popup functionality initalization
    let popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });

// Map load event to add collisions layer and style it.
map.on('load', function() {
    map.addSource('collisions', {
        type: 'geojson',
        data: collisions
    })
    map.addLayer({
        id: 'collPedCyc',
        type: 'circle',
        source: 'collisions',
        paint: {
            'circle-radius': [
                "interpolate",
                ["linear"],
                ["zoom"],
                10, 1,
                15, 7
            ],
            'circle-color': 'black'
        }
    });

    map.addSource('torontoBoundary', {
        type: 'geojson',
        data: boundsTO
    })
    map.addLayer({
        id: 'torBounds',
        type: 'line',
        source: 'torontoBoundary',
        paint: {
            'line-color': 'black',
            'line-width': [
                "interpolate",
                ["linear"],
                ["zoom"],
                10, 1,
                15, 7
            ],
        }
    });

    console.log('Collisions GeoJSON Type:', collisions.type); // Should be FeatureCollection
    console.log('First Feature Geometry Type:', collisions.features[0].geometry.type); // Typically Point, LineString, etc.

//Envelope & create a bounding box for the collisions point file. Creating, loading, and styling.
// I was using this section to troubleshoot and when I went to delete the console logs and the if statement the hexagons no longer appeared. 
    let interEnvCollisions = turf.envelope(collisions);
    console.log('Envelope Type:', interEnvCollisions.geometry.type); // Should be Polygon
    console.log('Envelope Coordinates:', interEnvCollisions.geometry.coordinates);
    if (boundsTOPoly.type === 'FeatureCollection') {
        boundsTOPoly = boundsTOPoly.features[0]; // Assuming the first feature is the desired boundary
    }
    console.log('Toronto Boundary Type:', boundsTOPoly.geometry.type); // Should be Polygon or MultiPolygon
    let intersectionResult = turf.intersect(interEnvCollisions, boundsTOPoly);
    console.log('Intersection Result:', intersectionResult);


    bBoxGeoJson = {
        "type": "FeatureCollection",
        "features": [interEnvCollisions]
    }

    console.log(bBoxGeoJson)
    console.log(bBoxGeoJson.features[0].geometry.coordinates);

    let bBoxCoords = [bBoxGeoJson.features[0].geometry.coordinates[0][0],
                bBoxGeoJson.features[0].geometry.coordinates[0][1],
                bBoxGeoJson.features[0].geometry.coordinates[0][2],
                bBoxGeoJson.features[0].geometry.coordinates[0][3]];

    console.log(bBoxCoords);

    //Specify variables as Lon/Lat or min x/y values within the array. I have no idea why it was not working without this but I found this as an alternative on StackOverflow. 
    let minLon = bBoxCoords[0][0];
    let minLat = bBoxCoords[0][1];
    let maxLon = bBoxCoords[2][0];
    let maxLat = bBoxCoords[2][1];
    let bbox = [minLon, minLat, maxLon, maxLat];

    //Expand bbox by 10% to fit all points.
    let scaledBox = turf.bbox(turf.transformScale((turf.bboxPolygon(bbox)), 1.2));
    let hexOptions = {
        units: 'kilometers',
        mask: boundsTOPoly
    };

    //Create, Add, and Style the hexgrid. NOTE: The mask takes the map way too long to load. I tried various other various like boolean intersect between the city boundaries and HexGrid but could not get any of them to work.
    let hexGrid = turf.hexGrid(scaledBox, 0.5, hexOptions);
    let collHex = turf.collect(hexGrid, collisions, '_id', 'values');

    let maxColl = 0;
    collHex.features.forEach((feature) => {//Do the following for every single hexagon.
        feature.properties.COUNT = feature.properties.values.length//Counting the number of collisions per hexagon.
        if (feature.properties.COUNT > maxColl) {//Check to see if current hex is larger than maxColl value.
            maxColl = feature.properties.COUNT//If the count of a hex is larger than the previous maxColl state, overwrite it.
        }
    });
    console.log(maxColl);//Log the max count (72)

    //Display / Style CollHex
    map.addSource('CollHex', {
        type: 'geojson',
        data: collHex
    });
    map.addLayer({
        id: 'CollHexCloro',
        type: 'fill',
        source: 'CollHex',
        paint: {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'COUNT'],
                0, '#ffffff',
                1, '#E8F6CB',
                10, '#D0EDCA',
                25, '#A0DBC8',
                40, '#71C9C6',
                55, '#59C0C5',
                70, '#41B6C4'
            ],
        'fill-opacity': 0.5
        }
    });

    document.getElementById('opacity-slider').addEventListener('input', function(e) {
        let layerOpacity = e.target.value;
        map.setPaintProperty('CollHexCloro', 'fill-opacity', parseFloat(layerOpacity));
    });
});



// Display the pop-up on hover
map.on('mousemove', 'CollHexCloro', function(e) {
    // Check that the feature exists
    if (e.features.length > 0) {
        var feature = e.features[0];

        // Ensure there is a COUNT property
        if (feature.properties.COUNT !== undefined) {
            // Set the pop-up content and location
            popup.setLngLat(e.lngLat)
                 .setHTML(`<strong>Collisions: </strong> ${feature.properties.COUNT}`)
                 .addTo(map);

            // Optional: Change the cursor style as a UI indicator
            map.getCanvas().style.cursor = 'pointer';
        }
    }
});

// Hide the pop-up when the mouse leaves the hexagon layer
map.on('mouseleave', 'CollHexCloro', function() {
    map.getCanvas().style.cursor = '';
    popup.remove();
});


// LAYER BUTTON FUNCTIONALITY - Listens to see if the button is clicked or not, displays or hides the population density layer.
document.getElementById('hexcheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'CollHexCloro',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

document.getElementById('collcheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'collPedCyc',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

document.getElementById('tocheck').addEventListener('change', (e) => {
    map.setLayoutProperty(
        'torBounds',
        'visibility',
        e.target.checked ? 'visible' : 'none'
    );
});

 // Button to return to Toronto view
 document.getElementById('returnToToronto').onclick = function() {
    map.flyTo({center: [-79.39, 43.65], zoom: 12});
};