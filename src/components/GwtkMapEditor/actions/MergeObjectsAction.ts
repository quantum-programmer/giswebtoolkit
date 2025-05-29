/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Обработчик сшивки объектов                    *
 *                                                                  *
 *******************************************************************/

import MapObject, {MapObjectType} from '~/mapobject/MapObject';
import SVGrenderer from '~/renderer/SVGrenderer';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import Action, {PRIMARY_PANEL_ID, SAVE_PANEL_ID, ACTION_COMMIT, ACTION_CANCEL} from '~/taskmanager/Action';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import GwtkMapEditorTask, {MERGE_OBJECTS_ACTION} from '../task/GwtkMapEditorTask';
import {LogEventType} from '~/types/CommonTypes';
import i18n from '@/plugins/i18n';
import GwtkError from '~/utils/GwtkError';


/**
 * Обработчик сшивки объектов
 * @class MergeObjectsAction
 * @extends Action<Task>
 */
export default class MergeObjectsAction extends Action<GwtkMapEditorTask> {

    /**
     * Параметры для виджета
     * @private
     * @readonly
     * @property widgetParams {WidgetParams}
     */
    private readonly widgetParams = {
        [PRIMARY_PANEL_ID]: {
            enabled: true,
            title: 'Merge mode',
            visible: false,
            buttons: []
        },
        [SAVE_PANEL_ID]: {
            enabled: true,
            visible: true,
            buttons: [
                {
                    id: ACTION_COMMIT,
                    active: false,
                    enabled: true,
                    options: {
                        label: 'mapeditor.Confirm',
                        theme: 'primary'
                    }
                },
                {
                    id: ACTION_CANCEL,
                    active: false,
                    enabled: true,
                    options: {
                        label: 'mapeditor.Cancel',
                        theme: 'secondary'
                    }
                }
            ]
        }
    };

    private firstObject?: MapObject;
    private secondObject?: MapObject;

    /**
     * Стиль рисования редактируемого объекта
     * @private
     * @readonly
     * @property mergeObjectStyle {Style}
     */
    private readonly mergeObjectStyle = new Style({
        stroke: new Stroke({
            color: 'blue',
            width: '2px',
            dasharray: '5, 5'
        }),
        fill: new Fill({
            opacity: 0.1
        })
    });

    destroy() {
        this.parentTask.resetMessage();
        this.parentTask.removeModePanel();
        this.firstObject = this.secondObject = undefined;
        this.map.requestRender();
    }

    setup() {
        const activeObject = this.map.getActiveObject();
        if (activeObject && !this.canSelectThisObject(activeObject)) {
            this.map.clearActiveObject();
        } else {
            this.selectObject(activeObject);
        }
    }

    onPostRender(renderer: SVGrenderer) {
        if (this.firstObject) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.firstObject, this.mergeObjectStyle);
        }

        if (this.secondObject && !this.secondObject.removeFlag) {
            this.map.mapObjectsViewer.drawMapObject(renderer, this.secondObject, this.mergeObjectStyle);
        }
    }

    canMapMove() {
        return true;
    }

    canSelectObject() {
        return !this.firstObject || !this.secondObject;
    }

    canSelectThisObject(mapObject: MapObject): boolean {
        const vectorLayer = this.parentTask.vectorLayer;
        return !!vectorLayer && vectorLayer.isEditable && vectorLayer.id === mapObject.vectorLayer.id
            && (mapObject.type === MapObjectType.Polygon || mapObject.type === MapObjectType.MultiPolygon);
    }

    selectObject(mapObject?: MapObject) {

        if (this.firstObject && this.secondObject) {
            return;
        }

        if (mapObject) {

            const canUpdate = mapObject.getEditFlag();
            if (!canUpdate) {
                this.mapWindow.addSnackBarMessage(i18n.tc('mapeditor.Selected object is not available for editing'));
                return;
            }

            if (this.mapWindow.getTaskManager().canSelectThisObject(mapObject)) {
                if (!this.firstObject) {
                    this.firstObject = mapObject;
                    this.map.requestRender();
                } else if (!this.secondObject && mapObject.gmlId !== this.firstObject.gmlId) {
                    this.secondObject = mapObject;
                    this.map.requestRender();

                    this.parentTask.createModePanel(this.widgetParams);
                }
            }
        }

        if (!this.firstObject) {
            this.parentTask.setPanelMessage({text: 'Select first object'});
        } else if (!this.secondObject) {
            this.parentTask.setPanelMessage({text: 'Select second object'});
        } else {
            this.parentTask.setPanelMessage({
                text: 'Object will be deleted after merging',
                value: ': ' + this.secondObject.gmlId
            });
            this.map.clearActiveObject();
        }
    }

    async commit() {
        if (this.firstObject && this.secondObject) {
            try {
                const jsonFeature = await this.firstObject.mergeWith(this.secondObject);

                const mapObjectMerged = new MapObject(this.firstObject.vectorLayer, jsonFeature.geometry.type, jsonFeature.properties);
                mapObjectMerged.updateGeometryFromJSON(jsonFeature);

                this.firstObject = mapObjectMerged;

                const vectorLayer = this.firstObject.vectorLayer;
                vectorLayer.startTransaction();

                await this.firstObject.commit();
                await this.secondObject.delete();

                await this.parentTask.commitTransaction([vectorLayer], MERGE_OBJECTS_ACTION);
            } catch (error) {
                const text = i18n.t('mapeditor.Error') + '. ' + i18n.t('mapeditor.Merging map objects');
                const gwtkError = new GwtkError(error);
                const description = gwtkError.message;
                this.map.writeProtocolMessage({text, description, type: LogEventType.Error, display: true});
            }

            this.map.removeSelectedObject(this.secondObject);
            this.map.removeSelectedObject(this.firstObject);

            this.map.requestRender();

            this.quit();
        }
    }

    revert() {
        this.quit();
    }

    updateCriteriaAggregator(criteriaAggregator: CriteriaAggregator) {
        this.parentTask.updateCriteriaAggregator(criteriaAggregator);
    }
}
