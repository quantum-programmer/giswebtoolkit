/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик добавления точек объекта               *
 *                                                                  *
 *******************************************************************/

import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import AppendPointAction from '~/systemActions/AppendPointAction';
import GwtkReliefLineDiagramTask, {
    APPEND_POINT_RELIEF_LINE_ACTION,
    EDIT_POINT_RELIEF_LINE_ACTION,
    ReliefProfileMessages
} from '../task/GwtkReliefLineDiagramTask';
import {LOCALE, LogEventType} from '~/types/CommonTypes';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import {ACTION_COMMIT, SAVE_PANEL_ID} from '~/taskmanager/Action';
import i18n from '@/plugins/i18n';
import GeoJsonLayer from '~/maplayers/GeoJsonLayer';


/**
 * Обработчик редактирования объекта
 * @class AppendPointReliefLine
 * @extends AppendPointAction
 */
export default class AppendPointReliefLine extends AppendPointAction<GwtkReliefLineDiagramTask> {

    /**
     * Стили отображения объекта карты
     * @private
     * @readonly
     * @property mapObjectStyle {Style}
     */
    private readonly mapObjectStyle = new Style({
        stroke: new Stroke({
            color: 'grey',
            width: '2px',
            linejoin: 'round'
        })
    });

    private canCloseFlag = false;

    constructor(task: GwtkReliefLineDiagramTask, id: string) {
        super(task, id);

        const tempVectorLayer = GeoJsonLayer.getEmptyInstance(this.map);

        const mapObject = new MapObject(tempVectorLayer, MapObjectType.LineString, {local: LOCALE.Line});

        mapObject.addStyle(this.mapObjectStyle);

        const mapActiveObject = this.map.getActiveObject();
        if (mapActiveObject) {

            if (mapActiveObject.type === MapObjectType.LineString) {
                const pointStart = mapActiveObject.getPointList()[0];
                const pointEnd = mapActiveObject.getPointList()[mapActiveObject.getPointList().length - 1];

                if (!pointStart || !pointEnd) {
                    this.map.writeProtocolMessage({
                        text: i18n.tc('relieflinediagram.Relief profile') + '. ' + i18n.tc('relieflinediagram.Failed to get data') + '!',
                        description: i18n.tc('relieflinediagram.Geometry error'),
                        display: true,
                        type: LogEventType.Error
                    });

                    return;
                }

                if (Math.abs(pointStart.x - pointEnd.x) > 0.001 && Math.abs(pointStart.y - pointEnd.y) > 0.001) {

                    mapObject.updateGeometryFrom(mapActiveObject);

                    this.currentObject = mapObject;
                    this.commit();
                    return;
                }

            } else {

                this.parentTask.selectedObjectInit = mapActiveObject;

                this.parentTask.objectContourCount = mapActiveObject.getObjectContoursCount(0);

                this.parentTask.hasSelectedMultiLineObject();

                this.quit();
                return;
            }

        }
        this.map.setActiveObject(mapObject);

        this.parentTask.showMessage(ReliefProfileMessages.pickPoints);
    }

    setup() {
        if (this.currentObject) {
            return;
        }
        super.setup();

        const button = this.widgetParams[SAVE_PANEL_ID].buttons.find(button => button.id === ACTION_COMMIT);
        if (button) {
            button.enabled = false;
            button.options.theme = 'primary';
        }

        this.widgetParams[SAVE_PANEL_ID].buttons.length = 1;
    }

    commit() {
        super.commit();

        if (this.currentObject) {
            this.canCloseFlag = true;
            this.currentObject.commit().then(() => {
                this.parentTask.setState(EDIT_POINT_RELIEF_LINE_ACTION, true);
                this.quit();
            });
        }
    }

    revert() {
        this.parentTask.setState(APPEND_POINT_RELIEF_LINE_ACTION, true);
    }

    canClose(): boolean {
        return this.canCloseFlag;
    }

}
