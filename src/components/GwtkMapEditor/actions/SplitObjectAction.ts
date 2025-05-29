/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Обработчик рассечения линейного объекта            *
 *                                                                  *
 *******************************************************************/

import MapObject, { MapObjectType } from '~/mapobject/MapObject';
import SVGrenderer, {
    GREEN_CIRCLE_SMALL_SVG_MARKER_ID,
    RED_CIRCLE_SMALL_SVG_MARKER_ID,
    RED_CIRCLE_SVG_MARKER_ID
} from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Action, { ACTION_CANCEL, ACTION_COMMIT, PRIMARY_PANEL_ID, SAVE_PANEL_ID } from '~/taskmanager/Action';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import GwtkMapEditorTask, { SPLIT_OBJECT_ACTION } from '../task/GwtkMapEditorTask';
import { MapPoint } from '~/geometry/MapPoint';
import MarkerStyle from '~/style/MarkerStyle';
import { MouseDeviceEvent } from '~/input/MouseDevice';
import { CURSOR_TYPE } from '~/types/Types';
import VectorLayer from '~/maplayers/VectorLayer';
import { LOCALE } from '~/types/CommonTypes';
import { NearestInterpolatedPointResult } from '~/mapobject/geometry/BaseMapObjectGeometry';
import { Cartesian2D } from '~/geometry/Cartesian2D';
import i18n from '@/plugins/i18n';


/**
 * Обработчик сшивки объектов
 * @class SplitObjectAction
 * @extends Action<Task>
 */
export default class SplitObjectAction<T extends GwtkMapEditorTask> extends Action<T> {

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = {
        [ PRIMARY_PANEL_ID ]: {
            enabled: true,
            title: 'Merge mode',
            visible: false,
            buttons: []
        },
        [ SAVE_PANEL_ID ]: {
            enabled: true,
            visible: true,
            buttons: [
                {
                    id: ACTION_COMMIT,
                    active: false,
                    enabled: true,
                    options: {
                        label: 'mapeditor.Confirm',
                        theme: 'primary',
                    }
                },
                {
                    id: ACTION_CANCEL,
                    active: false,
                    enabled: true,
                    options: {
                        label: 'mapeditor.Cancel',
                        theme: 'secondary',
                    }
                }
            ]
        }
    };

    /**
     * Текущее значение области захвата точек привязки
     * @private
     * @property deltaPix {number}
     */
    private deltaPix = 10;

    /**
     * Исходный редактируемый объект
     * @private
     * @readonly
     */
    private originObject?: MapObject;

    /**
     * Стиль рисования редактируемого объекта
     * @private
     * @readonly
     * @property originObjectStyle {Style}
     */
    private readonly originObjectStyle = new Style( {
        stroke: new Stroke( {
            color: 'green',
            width: '2px'
        } )
    } );

    /**
     * Объект точки рассечения
     * @private
     * @readonly
     */
    private readonly splitPointObject: MapObject;

    private readonly splitPointObjectStyles = [
        new Style( {
            marker: new MarkerStyle( {
                markerId: RED_CIRCLE_SMALL_SVG_MARKER_ID
            } )
        } ),
        new Style( {
            marker: new MarkerStyle( {
                markerId: RED_CIRCLE_SVG_MARKER_ID
            } )
        } )
    ];

    private splitPointObjectStylesIndex = 0;

    private splitPointResult?: NearestInterpolatedPointResult;

    private isSplitPointSelected: boolean = false;

    /**
     * Объект точек (узлов) рассекаемого объекта
     * @private
     */
    private readonly originMultipointObject: MapObject;

    /**
     * @constructor SplitObjectAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: T, id: string ) {
        super( task, id );

        // создаем слой для построения
        const tempVectorLayer = VectorLayer.getEmptyInstance( this.map );

        // объект точки рассечения
        this.splitPointObject = new MapObject( tempVectorLayer, MapObjectType.Point, { local: LOCALE.Point } );

        // объект точек (узлов) рассекаемого объекта
        this.originMultipointObject = new MapObject( tempVectorLayer, MapObjectType.MultiPoint, { local: LOCALE.Point } );
        this.originMultipointObject.addStyle( new Style( {
            marker: new MarkerStyle( {
                markerId: GREEN_CIRCLE_SMALL_SVG_MARKER_ID
            } )
        } ) );
    }

    destroy() {
        this.parentTask.resetMessage();
        this.parentTask.removeModePanel();
        this.originObject = undefined;
        this.originMultipointObject.removeAllPoints();
        this.map.requestRender();

        this.mapWindow.setCursor( CURSOR_TYPE.default );
    }

    setup() {
        const activeObject = this.map.getActiveObject();
        if ( activeObject && !this.canSelectThisObject( activeObject ) ) {
            this.map.clearActiveObject();
        } else {
            this.selectObject( activeObject );
        }
    }

    private checkSplitPointResult( splitPointResult: NearestInterpolatedPointResult ): MapPoint | undefined {
        if ( this.originObject ) {

            const { pointSelectorPrev, pointSelectorNext, point } = splitPointResult;

            if ( pointSelectorPrev.positionNumber === 0 && pointSelectorPrev.contourNumber === 0 ) {
                const edgePoint = this.originObject.getPoint( pointSelectorPrev );

                // Cartesian2D чтобы не сравнивать высоты
                if ( !edgePoint || Cartesian2D.equals( edgePoint, point ) ) {
                    return;
                }
            }

            const lastContourNumber = this.originObject.getObjectContoursCount( 0 ) - 1;
            const lastPositionNumber = this.originObject.getContourPointsCount( 0, lastContourNumber ) - 1;

            if ( pointSelectorNext.positionNumber === lastPositionNumber && pointSelectorNext.contourNumber === lastContourNumber ) {

                const edgePoint = this.originObject.getPoint( pointSelectorNext );

                // Cartesian2D чтобы не сравнивать высоты
                if ( !edgePoint || Cartesian2D.equals( edgePoint, point ) ) {
                    return;
                }
            }

            return point;
        }
    }

    onMouseClick( event: MouseDeviceEvent ) {
        if ( this.splitPointResult && this.originObject && !this.isSplitPointSelected ) {

            if ( this.checkSplitPointResult( this.splitPointResult ) ) {

                this.isSplitPointSelected = true;

                this.parentTask.setPanelMessage( {
                    text: 'Object will be modified after splitting',
                    value: ': ' + this.originObject.gmlId
                } );

                this.parentTask.createModePanel( this.widgetParams );

                this.mapWindow.setCursor( CURSOR_TYPE.default );
            }
        }
    }

    onMouseMove( event: MouseDeviceEvent ) {
        if ( this.isSplitPointSelected ) {
            return;
        }

        if ( this.originObject ) {
            const map = this.map;

            const cursorMapPoint = map.pixelToPlane( event.mousePosition );

            //сначала проверка на попадание в точку объекта

            const point = event.mousePosition.clone();

            //смещаем точку в пикселах для вычисления допуска в метрах
            point.x += this.deltaPix;
            point.y += this.deltaPix;

            const pointXYSupport = map.pixelToPlane( point );

            //допуск попадания в точку
            const delta = Math.max( Math.abs( pointXYSupport.x - cursorMapPoint.x ), Math.abs( pointXYSupport.y - cursorMapPoint.y ) );

            const result = this.originObject.checkPointHover( cursorMapPoint, delta );
            if ( result ) {

                const objectPoint = this.originObject.getPoint( result );
                if ( !objectPoint ) {
                    return;
                }

                const { objectNumber, contourNumber, positionNumber } = result;

                let positionNumberPrev = positionNumber;
                let positionNumberNext = positionNumber + 1;

                const maxPositionNumber = this.originObject.getContourPointsCount( objectNumber, contourNumber ) - 1;

                if ( positionNumberNext > maxPositionNumber ) {
                    positionNumberNext = maxPositionNumber;
                    positionNumberPrev = Math.max( 0, positionNumberNext - 1 );
                }

                this.splitPointResult = {
                    point: objectPoint,
                    pointSelectorPrev: { positionNumber: positionNumberPrev, contourNumber, objectNumber },
                    pointSelectorNext: { positionNumber: positionNumberNext, contourNumber, objectNumber }
                };

                this.splitPointObject.addPoint( objectPoint );

                this.splitPointObjectStylesIndex = 1;

            } else {

                this.splitPointResult = this.originObject.findNearestInterpPoint( cursorMapPoint );

                if ( this.splitPointResult ) {

                    this.splitPointObject.addPoint( this.splitPointResult.point );


                    const edgePointPrev = this.originObject.getPoint( this.splitPointResult.pointSelectorPrev );
                    const edgePointNext = this.originObject.getPoint( this.splitPointResult.pointSelectorNext );

                    // Cartesian2D чтобы не сравнивать высоты
                    if ( !edgePointPrev || !edgePointNext ||
                        Cartesian2D.equals( edgePointPrev, this.splitPointResult.point ) ||
                        Cartesian2D.equals( edgePointNext, this.splitPointResult.point )
                    ) {
                        this.splitPointObjectStylesIndex = 1;
                    } else {
                        this.splitPointObjectStylesIndex = 0;
                    }
                } else {
                    this.splitPointObject.removeAllPoints();
                }
            }

            this.mapWindow.setCursor( CURSOR_TYPE.pointer );
        }
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.splitPointObject.isDirty ) {
            this.map.requestRender();
            this.splitPointObject.isDirty = false;
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.originObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.originObject, this.originObjectStyle );
            this.map.mapObjectsViewer.drawMapObject( renderer, this.originMultipointObject );
            this.map.mapObjectsViewer.drawMapObject( renderer, this.splitPointObject, this.splitPointObjectStyles[ this.splitPointObjectStylesIndex ] );
        }
    }

    canMapMove() {
        return true;
    }

    canSelectObject() {
        return !this.originObject;
    }

    canSelectThisObject( mapObject: MapObject ): boolean {
        const vectorLayer = this.parentTask.vectorLayer;
        return !!vectorLayer && vectorLayer.isEditable &&
            vectorLayer.id === mapObject.vectorLayer.id &&
            (mapObject.type === MapObjectType.LineString || mapObject.type === MapObjectType.MultiLineString);
    }

    selectObject( mapObject?: MapObject ) {
        if ( this.originObject ) {
            return;
        }

        if ( mapObject ) {

            const canUpdate = mapObject.getEditFlag();
            if (!canUpdate) {
                this.mapWindow.addSnackBarMessage(i18n.tc('mapeditor.Selected object is not available for editing'));
                return;
            }

            this.originObject = mapObject;
            this.originMultipointObject.removeAllPoints();
            mapObject.getPointList().forEach( item => this.originMultipointObject.addPoint( item ) );

            this.map.clearActiveObject();
        }

        if ( !this.originObject ) {
            this.parentTask.setPanelMessage( { text: 'Select line object' } );
        } else if ( !this.isSplitPointSelected ) {
            this.parentTask.setPanelMessage( { text: 'Select split point' } );
        }
    }

    async commit() {
        if ( this.originObject && this.isSplitPointSelected && this.splitPointResult ) {

            const vectorLayer = this.originObject.vectorLayer;
            const firstObject = new MapObject( vectorLayer, this.originObject.type );
            firstObject.updateFrom( this.originObject );
            firstObject.removeAllPoints();

            const contourNumberPrev = this.splitPointResult.pointSelectorPrev.contourNumber;
            const positionNumberPrev = this.splitPointResult.pointSelectorPrev.positionNumber;

            for ( let contourNumber = 0; contourNumber <= contourNumberPrev; contourNumber++ ) {

                const contourPoints = this.originObject.getContourPoints( 0, contourNumber );

                for ( let positionNumber = 0; positionNumber < contourPoints.length; positionNumber++ ) {

                    const currentPoint = contourPoints[ positionNumber ];
                    firstObject.addPoint( currentPoint, { contourNumber } );

                    if ( contourNumber === contourNumberPrev && positionNumber === positionNumberPrev ) {
                        break;
                    }
                }
            }

            const firstObjectLastPoint = firstObject.getPoint( {
                contourNumber: contourNumberPrev,
                positionNumber: positionNumberPrev
            } );
            if ( firstObjectLastPoint && !Cartesian2D.equals( firstObjectLastPoint, this.splitPointResult.point ) ) {
                firstObject.addPoint( this.splitPointResult.point, { contourNumber: contourNumberPrev } );
            }

            if ( firstObject.getContourPointsCount( 0, contourNumberPrev ) === 1 ) {
                firstObject.removeContour( { objectNumber: 0, contourNumber: contourNumberPrev } );
            }

            const secondObject = vectorLayer.createMapObject( this.originObject.type );
            const objectNumber = secondObject.objectNumber;
            secondObject.updateFrom( this.originObject );
            secondObject.removeAllPoints();
            secondObject.objectNumber = objectNumber;

            const contourNumberNext = this.splitPointResult.pointSelectorNext.contourNumber;
            const positionNumberNext = this.splitPointResult.pointSelectorNext.positionNumber;

            let contourNumForSecond = 0;
            const contoursCount = this.originObject.getObjectContoursCount( 0 );
            for ( let contourNumber = contourNumberNext; contourNumber < contoursCount; contourNumber++ ) {
                const startPosition = contourNumber === contourNumberNext ? positionNumberNext : 0;
                const contourPoints = this.originObject.getContourPoints( 0, contourNumber );

                for ( let positionNumber = startPosition; positionNumber < contourPoints.length; positionNumber++ ) {
                    const point = contourPoints[ positionNumber ];
                    secondObject.addPoint( point, { contourNumber: contourNumForSecond } );
                }

                contourNumForSecond++;
            }

            const secondObjectFirstPoint = secondObject.getPoint( { positionNumber: 0 } );
            if ( secondObjectFirstPoint && !Cartesian2D.equals( secondObjectFirstPoint, this.splitPointResult.point ) ) {
                secondObject.addPoint( this.splitPointResult.point, { positionNumber: 0 } );
            }

            if ( secondObject.getContourPointsCount( 0, 0 ) === 1 ) {
                secondObject.removeContour( { objectNumber: 0, contourNumber: 0 } );
            }

            vectorLayer.startTransaction();
            await firstObject.commit();
            await secondObject.commit();

            await this.parentTask.commitTransaction( [vectorLayer], SPLIT_OBJECT_ACTION );

            this.map.removeSelectedObject( this.originObject );
        }
        this.quit();
    }

    revert() {
        this.quit();
    }

    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
        this.parentTask.updateCriteriaAggregator( criteriaAggregator );
    }
}
