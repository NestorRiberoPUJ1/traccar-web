import {
  formatAlarm, formatAltitude, formatBoolean, formatCoordinate, formatCourse, formatDistance,
  formatNumber, formatNumericHours, formatPercentage, formatSpeed, formatTime, formatFuel,
} from './formatter';
import { useAttributePreference, usePreference } from './preferences';
import { useTranslation } from '../components/LocalizationProvider';

const useFormatToText = () => {
  const t = useTranslation();

  const distanceUnit = useAttributePreference('distanceUnit');
  const altitudeUnit = useAttributePreference('altitudeUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const coordinateFormat = usePreference('coordinateFormat');
  const hours12 = usePreference('twelveHourFormat');

  const formatValue = (value, key) => {
    switch (key) {
      case 'fixTime':
      case 'deviceTime':
      case 'serverTime':
        return formatTime(value, 'seconds', hours12);
      case 'latitude':
        return formatCoordinate('latitude', value, coordinateFormat);
      case 'longitude':
        return formatCoordinate('longitude', value, coordinateFormat);
      case 'speed':
        return formatSpeed(value, speedUnit, t);
      case 'course':
        return formatCourse(value);
      case 'altitude':
        return formatAltitude(value, altitudeUnit, t);
      case 'batteryLevel':
        return formatPercentage(value, t);
      case 'alarm':
        return formatAlarm(value, t);
      case 'odometer':
      case 'distance':
      case 'totalDistance':
        return formatDistance(value, distanceUnit, t);
      case 'hours':
        return formatNumericHours(value, t);
      case 'fuel':
        return formatFuel(value, t);
      default:
        if (typeof value === 'number') {
          return formatNumber(value);
        } if (typeof value === 'boolean') {
          return formatBoolean(value, t);
        }
        return value || '';
    }
  };

  const formatData = (position, property) => {
    const key = property;
    const value = position.hasOwnProperty(key) ? position[key] : position.attributes[key];
    switch (key) {
      case 'address':
        return value;
      default:
        return formatValue(value, key);
    }
  };

  return { formatData };
};

export default useFormatToText;
