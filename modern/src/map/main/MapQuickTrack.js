import { useId, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '@mui/styles';
import { map } from '../core/MapView';
import { devicesActions } from '../../store';

const MapQuickTrack = () => {
  const id = useId();

  const theme = useTheme();
  const dispatch = useDispatch();

  const quickTrack = useSelector((state) => state.devices.quickTrack);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const [prevSelectedDevice, setPrevSelectedDevice] = useState(selectedDeviceId);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [],
        },
      },
    });
    map.addLayer({
      source: id,
      id,
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 4,
      },
    });

    return () => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, []);

  useEffect(() => {
    if (quickTrack) {
      map.getSource(id).setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: quickTrack,
            },
            properties: {
              color: theme.palette.colors.geometry,
            },
          },
        ],
      });
    } else {
      map.getSource(id).setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
            properties: {
              color: theme.palette.colors.geometry,
            },
          },
        ],
      });
    }
  }, [theme, quickTrack]);

  useEffect(() => {
    if (selectedDeviceId && selectedDeviceId !== prevSelectedDevice) {
      setPrevSelectedDevice(selectedDeviceId);
      dispatch(devicesActions.setQuickTrack([]));
    }
  }, [selectedDeviceId]);

  return null;
};

export default MapQuickTrack;
