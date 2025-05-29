/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Обработчик редактирование участка объекта             *
 *                                                                  *
 *******************************************************************/

import ActionLink from '~/taskmanager/ActionLink';
import GwtkMapEditorTask, {
    EDIT_SEGMENT_ACTION,
    GwtkMapEditorTaskState,
    SEGMENT_ADD_POINT_ACTION, SEGMENT_ADD_POINT_ACTION_COMMIT,
    SELECT_SEGMENT_ACTION
} from '../task/GwtkMapEditorTask';
import { PointInfo } from '~/mapobject/geometry/BaseMapObjectGeometry';
import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import Utils from '~/services/Utils';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import { MapPoint } from '~/geometry/MapPoint';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';
import VectorLayer from '~/maplayers/VectorLayer';


/**
 * Обработчик редактирование участка объекта
 * @class EditSegmentActionLink
 * @extends ActionLink<GwtkMapEditorTask>
 */
export default class EditSegmentActionLink extends ActionLink<GwtkMapEditorTask> {

    pointList?: PointInfo[];

    currentObject?: MapObject;
    activeObject?: MapObject;

    destroy() {
        this.parentTask.removeModePanel();
        this.parentTask.resetMessage();

        super.destroy();

        if ( this.currentObject ) {
            this.map.setActiveObject( this.currentObject );
        } else {
            if ( this.activeObject ) {
                this.map.setActiveObject( this.activeObject );
            } else {
                this.map.clearActiveObject();
            }
        }
    }

    setup() {
        this.activeObject = this.map.getActiveObject();

        this.setLinkAction( SELECT_SEGMENT_ACTION );
    }

    async setState<K extends keyof GwtkMapEditorTaskState>( key: K, value: GwtkMapEditorTaskState[K] ) {
        switch ( key ) {
            case SEGMENT_ADD_POINT_ACTION:
                if ( value ) {
                    this.pointList = value as PointInfo[];
                    this.currentObject = this.map.getActiveObject();
                    const mapObject = new MapObject( new VectorLayer( this.map, {
                        alias: '',
                        id: Utils.generateGUID(),
                        url: ''
                    } ), MapObjectType.LineString );
                    if ( this.currentObject ) {
                        let geoPoint = this.currentObject.getPoint( this.pointList[ this.pointList.length - 1 ] );
                        if ( geoPoint ) {
                            mapObject.addPoint( geoPoint );
                        }
                        geoPoint = this.currentObject.getPoint( this.pointList[ 0 ] );
                        if ( geoPoint ) {
                            mapObject.addPoint( geoPoint );
                            mapObject.addPoint( geoPoint );
                        }
                    }
                    this.map.setActiveObject( mapObject );
                    this.setLinkAction( key );
                } else {
                    this.setLinkAction();
                }
                break;
            case SEGMENT_ADD_POINT_ACTION_COMMIT:
                if ( !this.action ) {
                    return;
                }
                const activeObject = this.map.getActiveObject();
                if ( this.currentObject && this.pointList && this.pointList.length === 3 && activeObject && activeObject.getPointList().length > 2 && this.action.id === SEGMENT_ADD_POINT_ACTION ) {

                    const [{ positionNumber: startPointPositionNumber }, { positionNumber: middlePointPositionNumber }, { positionNumber: endPointPositionNumber }] = this.pointList;
                    const order = EditSegmentActionLink.getOrder( startPointPositionNumber, middlePointPositionNumber, endPointPositionNumber );
                    if ( order === 'clockwise' ) {
                        const mapPoints = activeObject.getPointList().slice( 1 );
                        mapPoints.pop();
                        mapPoints.reverse();
                        //по ходу точек
                        this.replaceSegment( startPointPositionNumber, endPointPositionNumber, mapPoints );
                    } else if ( order === 'counterclockwise' ) {
                        const mapPoints = activeObject.getPointList().slice( 1 );
                        mapPoints.pop();
                        //против хода точек
                        this.replaceSegment( endPointPositionNumber, startPointPositionNumber, mapPoints );
                    }

                    const vectorLayer = this.currentObject.vectorLayer;
                    vectorLayer.startTransaction();

                    await this.currentObject.commit();

                    await this.parentTask.commitTransaction( [vectorLayer], EDIT_SEGMENT_ACTION );
                    await this.currentObject.reload();

                    this.map.removeSelectedObject( this.currentObject );
                    this.quit();
                }
                break;
            default:
                super.setState( key, value );
        }
    }

    /**
     * Заменить участок на массив точек
     * @private
     * @method replaceSegment
     * @param startPointPositionNumber {number} Начальная точка участка
     * @param endPointPositionNumber {number} Конечная точка участка
     * @param geoPointList {GeoPoint[]} Массив точек
     */
    private replaceSegment( startPointPositionNumber: number, endPointPositionNumber: number, geoPointList: MapPoint[] ) {
        if ( this.currentObject && this.pointList ) {
            const count = endPointPositionNumber - startPointPositionNumber;

            const selector = { ...this.pointList[ 0 ], positionNumber: startPointPositionNumber + 1 };
            if ( count >= 0 ) {
                for ( let i = 0; i < count - 1; i++ ) {
                    this.currentObject.removePoint( selector );
                }
            } else {
                while ( this.currentObject.getPoint( selector ) ) {
                    this.currentObject.removePoint( selector );
                }
                selector.positionNumber = 0;
                for ( let i = 0; i < endPointPositionNumber; i++ ) {
                    this.currentObject.removePoint( selector );
                }
            }


            for ( let i = 0; i < geoPointList.length; i++ ) {
                this.currentObject.addPoint( geoPointList[ i ], selector );
            }
        }
    }

    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
        this.parentTask.updateCriteriaAggregator( criteriaAggregator );
    }

    private static getOrder( first: number, second: number, third: number ) {
        let result: 'clockwise' | 'counterclockwise' | undefined;
        if (
            first <= second && second <= third ||
            second <= third && third <= first ||
            third <= first && first <= second
        ) {
            result = 'clockwise';
        } else if (
            first >= second && second >= third ||
            third >= first && first >= second ||
            second >= third && third >= first
        ) {
            result = 'counterclockwise';
        }
        return result;
    }

    revert() {
        super.revert();
        this.quit();
    }
}
