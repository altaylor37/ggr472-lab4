/*--------------------------------------------------------------------
GGR472 LAB 4: Incorporating GIS Analysis into web maps using Turf.js 
--------------------------------------------------------------------*/

/*--------------------------------------------------------------------
Step 1: INITIALIZE MAP
--------------------------------------------------------------------*/
// Define access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYWx0YXlsb3IzNyIsImEiOiJjbHMyOWRoY2wwMWllMmtxam1yZjE3ams4In0.qdGA5yoWQbVEgPX3Tlru5A'; //****ADD YOUR PUBLIC ACCESS TOKEN*****

// Initialize map and edit to your preference
const map = new mapboxgl.Map({
    container: 'map', // container id in HTML
    style: 'mapbox://styles/altaylor37/cls29ky3c01ug01p2at938z40',  // ****ADD MAP STYLE HERE *****
    center: [-79.39, 43.65],  // starting point, longitude/latitude
    zoom: 12 // starting zoom level
});

// Empty variables and fetching data.
let collisions;
let bBoxGeoJson;
let bboxCoords;
fetch('https://raw.githubusercontent.com/altaylor37/ggr472-lab4/main/data/pedcyc_collision_06-21.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response);
        collisions = response;
    });



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
            'circle-radius': 5,
            'circle-color': '#ff0000'
        }
    });

//Envelope & create a bounding box for the collisions point file. Creating, loading, and styling.
    let interEnvCollisions = turf.envelope(collisions);

    bBoxGeoJson = {
        "type": "FeatureCollection",
        "features": [interEnvCollisions]
    }
    // map.addSource('envelopedCollisions', {
    //     type: "geojson",
    //     data: bBoxGeoJson
    // })
    // map.addLayer({
    //     id: "collEnv",
    //     type: "fill",
    //     source: "envelopedCollisions",
    //     paint: {
    //         'fill-color': "grey",
    //         'fill-opacity': 0.5,
    //         'fill-outline-color': "black"
    //     }
    // });

    console.log(bBoxGeoJson)
    console.log(bBoxGeoJson.features[0].geometry.coordinates);

    // console.log(bbox)
    // console.log(bbox.geometry.coordinates)

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
    let scaledBox = turf.bbox(turf.transformScale((turf.bboxPolygon(bbox)), 1.1));

    //Create, Add, and Style the hexgrid. 
    let hexGrid = turf.hexGrid(scaledBox, 0.5, {units: 'kilometers'});
    // map.addSource('hexGrid', {
    //     type: 'geojson',
    //     data: hexGrid
    // });
    // map.addLayer({
    //     id: 'hexGridLayer',
    //     type: 'fill',
    //     source: 'hexGrid',
    //     paint: {
    //         'fill-color': '#ffffff',
    //         'fill-opacity': 0.5
    //     }
    // });

    let collHex = turf.collect(hexGrid, collisions, '_id', 'values');
    console.log(collHex);

    let maxColl = 0;

    collHex.features.forEach((feature) => {
        feature.properties.COUNT = feature.properties.values.length
        if (feature.properties.COUNT > maxColl) {
            // console.log(feature);
            maxColl = feature.properties.COUNT
        }
    });
    console.log(maxColl);



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
                0, '#ffffcc',
                27, '#a1dab4',
                54, '#41b6c4',
            ],
        'fill-opacity': 0.755 
        }
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

document.getElementById('opacity-slider').addEventListener('input', function(e) {
    let layerOpacity = e.target.value;
    map.setPaintProperty('CollHexCloro', 'fill-opacity', parseFloat(layerOpacity));
});




/*--------------------------------------------------------------------
Step 2: VIEW GEOJSON POINT DATA ON MAP
--------------------------------------------------------------------*/
//HINT: Create an empty variable
//      Use the fetch method to access the GeoJSON from your online repository
//      Convert the response to JSON format and then store the response in your new variable



/*--------------------------------------------------------------------
    Step 3: CREATE BOUNDING BOX AND HEXGRID
--------------------------------------------------------------------*/
//HINT: All code to create and view the hexgrid will go inside a map load event handler
//      First create a bounding box around the collision point data then store as a feature collection variable
//      Access and store the bounding box coordinates as an array variable
//      Use bounding box coordinates as argument in the turf hexgrid function



/*--------------------------------------------------------------------
Step 4: AGGREGATE COLLISIONS BY HEXGRID
--------------------------------------------------------------------*/
//HINT: Use Turf collect function to collect all '_id' properties from the collision points data for each heaxagon
//      View the collect output in the console. Where there are no intersecting points in polygons, arrays will be empty



// /*--------------------------------------------------------------------
// Step 5: FINALIZE YOUR WEB MAP
// --------------------------------------------------------------------*/
//HINT: Think about the display of your data and usability of your web map.
//      Update the addlayer paint properties for your hexgrid using:
//        - an expression
//        - The COUNT attribute
//        - The maximum number of collisions found in a hexagon
//      Add a legend and additional functionality including pop-up windows


