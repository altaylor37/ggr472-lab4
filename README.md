# GGR472 Lab 4: Incorporating GIS analysis into web maps using Turf.js
 
This repository contains the starter code required to complete Lab 4. The lab is designed to help you learn how to perform spatial analysis and visualize outputs using the [Turf.js](https://turfjs.org/) and [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/api/) libraries.


## Repository Contents
- `data/pedcyc_collision_06-21.geojson`: Data file containing point locations of road collisions involving pedestrian and cyclists between 2006 and 2021 in Toronto 
- `TorontoBoundary.geojson`: Polygon of Toronto. Dissolved all the old municipalities into one polygon then feature to line geojson in ArcGIS Pro. https://open.toronto.ca/dataset/former-municipality-boundaries/ 
- `TorontoLineBoundary.geojson`: Line of Toronto border. Used the polygon to line feature on the Toronto boundary then feature to goejson in ArcGIS Pro.
- `instructions/GGR472_Lab4`: Instructions document explaining steps required to complete the lab
- `index.html`: HTML file to render the map
- `style.css`: CSS file for positioning the map interface
- `script.js`: JavaScript file template to be updated to include code that creates and visualizes and hexgrid map based on the collision data

# Map Operation
KNOWN ISSUE - I explain it in the javascript comments but my hexmap takes a long time to load. Until data is loaded the map is unresponsive. It takes ~15-30seconds depending on the machine. 

Map controls on right side. 

Sidebar contains buttons to
- Return to downtown
- Toggle hexagons / collisions / city limits layers
- Slider to control the opacity of the hexagon layer for better viewing

City limits and collisions layers change in size depending on view state.
Mouse changes pointers and creates a popup when hovering over hexagons. Popup window shows how many collisions occured in the time period in that area. 