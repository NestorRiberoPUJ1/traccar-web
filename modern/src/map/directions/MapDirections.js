import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { map } from '../core/MapView';

const MapDirections = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const directions = new MapboxDirections({
      accessToken: 'pk.eyJ1IjoibnJpYmVybyIsImEiOiJjbGV0MTB0YXUwZDQwM3ptYXZ2ZnZtYXBvIn0.vDXiWhofa4-3_-s4fiNZeg',
      unit: 'metric',
      profile: 'mapbox/driving',
    });
    map.addControl(directions);
    return () => map.removeControl(directions);
  }, [dispatch]);
  return null;
};

export default MapDirections;
