import GeoPoint from '~/geo/GeoPoint';
import { SET_COORDINATE_IN_POINT } from '~/systemActions/PickPointAction';
import PixelPoint from '~/geometry/PixelPoint';
import { AngleUnit } from '~/utils/WorkspaceManager';
import GwtkMovingToPointTask from '@/components/GwtkMovingToPoint/task/GwtkMovingToPointTask';

export type DegreesMinutesSecondsData = {
    id: string,
    type: string,
    value: string
};
export type DegreesMinutesSecondsFieldColor = 'white' | 'transparent';
export const COPY_COORDINATE = 'gwtkmovingtopoint.copycoordinate';
export const SELECT_POINT_ACTION = 'gwtkmovingtopoint.selectpointaction';
export const MOVING_TO_POINT = 'gwtkmovingtopoint.movingtopoint';
export const SET_MOVE_TO_POINT_ACTIVE = 'gwtkmovingtopoint.setmovetopointactive';
export const SET_SELECT_POINT_ACTIVE = 'gwtkmovingtopoint.setselectpointactive';
export const SET_LATITUDE_COORDINATE = 'gwtkmovingtopoint.setlatitudecoordinate';
export const SET_LONGITUDE_COORDINATE = 'gwtkmovingtopoint.setlongitudecoordinate';


export type GwtkMovingToPointTaskState = {
    [ SELECT_POINT_ACTION ]: boolean;
    [ MOVING_TO_POINT ]: GeoPoint;
    [ SET_COORDINATE_IN_POINT ]: PixelPoint;
    [ COPY_COORDINATE ]: WidgetParams['coordinateString'];
    [ SET_MOVE_TO_POINT_ACTIVE ]: WidgetParams['moveToPointActive'];
    [ SET_SELECT_POINT_ACTIVE ]: WidgetParams['selectPointActive'];
    [ SET_LATITUDE_COORDINATE ]: WidgetParams['coordinateLatitude'];
    [ SET_LONGITUDE_COORDINATE ]: WidgetParams['coordinateLongitude'];
}

export type WidgetParams = {
    setState: GwtkMovingToPointTask['setState'];
    coordinateString: string;
    coordinateDisplayFormatValue: AngleUnit;
    moveToPointActive: boolean;
    selectPointActive: boolean;
    coordinateLatitude: string;
    coordinateLongitude: string;
}
