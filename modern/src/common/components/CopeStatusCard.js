import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem,
  CardMedia,
  Snackbar,
  Stack,
  CircularProgress,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RouteIcon from '@mui/icons-material/Route';

import moment from 'moment';
import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useDeviceReadonly } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import useFormatToText from '../util/useFormatToText';
import DirectionsSearch from './DirectionsSearch';

const useStyles = makeStyles((theme) => ({
  card: {
    pointerEvents: 'auto',
    width: theme.dimensions.popupMaxWidth,
  },
  media: {
    height: theme.dimensions.popupImageHeight,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  mediaButton: {
    color: theme.palette.colors.white,
    mixBlendMode: 'difference',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 1, 0, 2),
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  negative: {
    color: theme.palette.colors.negative,
  },
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  table: {
    '& .MuiTableCell-sizeSmall': {
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
  cell: {
    borderBottom: 'none',
  },
  actions: {
    justifyContent: 'space-between',
  },
  root: ({ desktopPadding }) => ({
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    transform: 'translateX(-50%)',
  }),
}));

const StatusRow = ({ name, content }) => {
  const classes = useStyles();
  return (
    <TableRow>
      <TableCell className={classes.cell}>
        <Typography variant="body2" style={{ userSelect: 'none' }}>{name}</Typography>
      </TableCell>
      <TableCell className={classes.cell}>
        <Typography variant="body2" color="textSecondary">{content}</Typography>
      </TableCell>
    </TableRow>
  );
};

const CopeStatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0 }) => {
  const classes = useStyles({ desktopPadding });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const { formatData } = useFormatToText();

  const deviceReadonly = useDeviceReadonly();

  const device = useSelector((state) => state.devices.items[deviceId]);

  const deviceImage = device?.attributes?.deviceImage;

  const positionAttributes = usePositionAttributes(t);
  const positionItems = useAttributePreference('positionItems', 'deviceTime,speed,address,totalDistance,course');

  const [anchorEl, setAnchorEl] = useState(null);

  const [removing, setRemoving] = useState(false);

  const [copied, setCopied] = useState(false);

  const [loadingQuickTrack, setLoadingQuickTrack] = useState(false);

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetch('/api/devices');
      if (response.ok) {
        dispatch(devicesActions.refresh(await response.json()));
      } else {
        throw Error(await response.text());
      }
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: '',
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetch('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    if (response.ok) {
      const item = await response.json();
      const permissionResponse = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
      });
      if (!permissionResponse.ok) {
        throw Error(await permissionResponse.text());
      }
      navigate(`/settings/geofence/${item.id}`);
    } else {
      throw Error(await response.text());
    }
  }, [navigate, position]);

  const handleCopyToClipboard = () => {
    const attrs = positionItems.split(',').filter((key) => position.hasOwnProperty(key) || position.attributes.hasOwnProperty(key));
    const text = attrs.reduce((acc, key) => {
      let value = acc;
      if (position.hasOwnProperty(key) || position.attributes.hasOwnProperty(key)) {
        value += `${formatData(position, key)};`;
      }
      return (value);
    }, `${device.name};`);
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const handleCloseSnack = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setCopied(false);
  };

  const handleQuickTrack = () => {
    setLoadingQuickTrack(true);
    const selectedFrom = moment().startOf('day').toISOString();
    const selectedTo = moment().endOf('day').toISOString();
    const query = new URLSearchParams({ deviceId, from: selectedFrom, to: selectedTo });
    fetch(`/api/positions?${query.toString()}`)
      .then((response) => response.json())
      .then((result) => {
        setLoadingQuickTrack(false);
        dispatch(devicesActions.setQuickTrack(result.map((item) => [item.longitude, item.latitude])));
      })
      .catch((error) => {
        setLoadingQuickTrack(false);
        throw Error(error);
      });
  };

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Card elevation={3} className={classes.card}>
            {deviceImage ? (
              <CardMedia
                className={classes.media}
                image={`/api/media/${device.uniqueId}/${deviceImage}`}
              >
                <IconButton
                  size="small"
                  onClick={handleCopyToClipboard}
                  onTouchStart={handleCopyToClipboard}
                >
                  <ContentCopyIcon fontSize="small" className={classes.mediaButton} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={onClose}
                  onTouchStart={onClose}
                >
                  <CloseIcon fontSize="small" className={classes.mediaButton} />
                </IconButton>
              </CardMedia>
            ) : (
              <div className={classes.header}>
                <IconButton
                  size="small"
                  onClick={handleCopyToClipboard}
                  onTouchStart={handleCopyToClipboard}
                >
                  <ContentCopyIcon fontSize="small" className={classes.mediaButton} />
                </IconButton>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography variant="body2" color="textSecondary">
                    {device.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={handleQuickTrack}
                    onTouchStart={handleQuickTrack}
                    disabled={loadingQuickTrack}
                  >
                    {
                      loadingQuickTrack ?
                        <CircularProgress size={20} />
                        :
                        <RouteIcon fontSize="small" className={classes.mediaButton} />
                    }
                  </IconButton>
                </Stack>

                <IconButton
                  size="small"
                  onClick={onClose}
                  onTouchStart={onClose}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </div>
            )}
            {position && (
              <CardContent className={classes.content}>
                <Table size="small" classes={{ root: classes.table }}>
                  <TableBody>
                    {positionItems.split(',').filter((key) => position.hasOwnProperty(key) || position.attributes.hasOwnProperty(key)).map((key) => (
                      <StatusRow
                        key={key}
                        name={positionAttributes.hasOwnProperty(key) ? positionAttributes[key].name : key}
                        content={(
                          <PositionValue
                            position={position}
                            property={position.hasOwnProperty(key) ? key : null}
                            attribute={position.hasOwnProperty(key) ? null : key}
                          />
                        )}
                      />
                    ))}
                  </TableBody>
                </Table>
                <DirectionsSearch />
                <Link to="/">Find a route</Link>
              </CardContent>
            )}
            <CardActions classes={{ root: classes.actions }} disableSpacing>
              <IconButton
                color="secondary"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                disabled={!position}
              >
                <PendingIcon />
              </IconButton>
              <IconButton
                onClick={() => navigate('/replay')}
                disabled={disableActions || !position}
              >
                <ReplayIcon />
              </IconButton>
              <IconButton
                onClick={() => navigate(`/settings/command-send/${deviceId}`)}
                disabled={disableActions}
              >
                <PublishIcon />
              </IconButton>
              <IconButton
                onClick={() => navigate(`/settings/device/${deviceId}`)}
                disabled={disableActions || deviceReadonly}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={() => setRemoving(true)}
                disabled={disableActions || deviceReadonly}
                className={classes.negative}
              >
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        )}
      </div>
      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={() => navigate(`/position/${position.id}`)}><Typography color="secondary">{t('sharedShowDetails')}</Typography></MenuItem>
          <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>
          <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}>{t('linkGoogleMaps')}</MenuItem>
          <MenuItem component="a" target="_blank" href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`}>{t('linkAppleMaps')}</MenuItem>
          <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}>{t('linkStreetView')}</MenuItem>
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={handleCloseSnack}
        message="Copied to Clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />

    </>
  );
};

export default CopeStatusCard;
