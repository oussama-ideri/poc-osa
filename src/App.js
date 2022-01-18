import React, { useState, useRef } from "react";
import ReactMapGL, { Marker, Popup, FlyToInterpolator } from "react-map-gl";
import useSupercluster from "use-supercluster";
import data from "./data/oeuvres-dataG.json";
import "./App.css";
import Pin from './pin';
import OeuvreMap from './OeuvreMap';



function App() {

    // DEFAULT MAP STATE
    const [viewport, setViewport] = useState({
      latitude: 49.434240,
      longitude: 1.089720,
      width: "100vw",
      height: "100vh",
      zoom: 13
    });

    // SELECTED ARTWORK STATE
    const [selectedArtWork, setselectedArtWork] = useState(null);

    // REF TO GET BOUNDS OF THE MAP LATER ON CLUSTERS
    const mapRef = useRef();

    // 
    const oeuvres = data;
    const points = oeuvres.map(oeuvre => ({
      type: "Feature",
      properties: { cluster: false, oeuvreId: oeuvre.id, name: oeuvre.name, description: oeuvre.description },
      geometry: {
        type: "Point",
        coordinates: [
          parseFloat(oeuvre.location.longitude),
          parseFloat(oeuvre.location.latitude)
        ]
      }
    }))

    // GET BOUNDS : IN A FROM [lat,long,lat,long] (4 corners)
    const bounds = mapRef.current
      ? mapRef.current
          .getMap()
          .getBounds()
          .toArray()
          .flat()
      : null;

    // ADD CLUSTERS, SUPERCLUSTER  
    // cluster options (70,20)
    const { clusters, supercluster } = useSupercluster({
      points,
      bounds,
      zoom: viewport.zoom,
      options: { radius: 70, maxZoom: 20 }
    });

    // 
    return (
      <div>
        <ReactMapGL
          {...viewport}
          maxZoom={18}
          mapStyle={process.env.REACT_APP_MAPBOX_STYLE}
          mapboxApiAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          onViewportChange={newViewport => {
            setViewport({ ...newViewport });
          }}
          ref={mapRef}
        >
          
          {clusters.map(cluster => {
            const [longitude, latitude] = cluster.geometry.coordinates;
            const {
              cluster: isCluster,
              point_count: pointCount
            } = cluster.properties;
            var style;
            
            if (isCluster) {
              if(pointCount < 50) 
                style = 1
              else if (pointCount < 500)
                style = 2
              else style = 3;
  
              return (
                <Marker
                  key={`cluster-${cluster.id}`}
                  latitude={latitude}
                  longitude={longitude}
                >
                  <div
                    className={`cluster-marker s-${style}`}
                    
                    onClick={() => {
                      const expansionZoom = Math.min(
                        supercluster.getClusterExpansionZoom(cluster.id),
                        20
                      );
  
                      setViewport({
                        ...viewport,
                        latitude,
                        longitude,
                        zoom: expansionZoom,
                        transitionInterpolator: new FlyToInterpolator({
                          speed: 2
                        }),
                        transitionDuration: "auto"
                      });
                    }}
                  >
                    {pointCount}
                  </div>
                </Marker>
              );
            }
  
            return (
              <Marker
                key={`oeuvre-${cluster.properties.oeuvreId}`}
                latitude={latitude}
                longitude={longitude}
              >
              
              <Pin size={20} onClick={() => setselectedArtWork(cluster)} />
  
                
              </Marker>
              
            );
          })}
          {selectedArtWork ? (
            <Popup
              tipSize={3}
              closeOnClick={true}
              latitude={selectedArtWork.geometry.coordinates[1]}
              longitude={selectedArtWork.geometry.coordinates[0]}
              onClose={() => {
                setselectedArtWork(null);
              }}
            >
              <OeuvreMap info={selectedArtWork.properties} />
          
            </Popup>
          ) : null}
        </ReactMapGL>
      </div>
    );
}

export default App;
