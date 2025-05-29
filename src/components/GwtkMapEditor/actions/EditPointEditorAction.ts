/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Обработчик редактирование точки объекта               *
 *                                                                  *
 *******************************************************************/

import EditPointAction from '~/systemActions/EditPointAction';
import GwtkMapEditorTask, {
    EDIT_POINT_ACTION,
    START_WAIT_CAPTURING,
    STOP_WAIT_CAPTURING
} from '../task/GwtkMapEditorTask';
import MapObject from '~/mapobject/MapObject';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import VectorLayer from '~/maplayers/VectorLayer';
import {LogEventType} from '~/types/CommonTypes';


/**
 * Обработчик редактирование точки объекта
 * @class EditPointEditorAction
 * @extends EditPointAction<GwtkMapEditorTask>
 */
export default class EditPointEditorAction extends EditPointAction<GwtkMapEditorTask> {

    canSelectThisObject( mapObject: MapObject ): boolean {
        const vectorLayer = this.parentTask.vectorLayer;
        return !!vectorLayer && vectorLayer.isEditable && vectorLayer.id === mapObject.vectorLayer.id;
    }

    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
        this.parentTask.updateCriteriaAggregator( criteriaAggregator );
    }

    async commit() {
        if ( this.currentObject ) {
            const vectorLayerList = new Set<VectorLayer>();

            const currentVectorLayer = this.currentObject.vectorLayer;
            currentVectorLayer.startTransaction();
            vectorLayerList.add( currentVectorLayer );
            await this.currentObject.commit();

            this.commonPointObjectList.forEach( mapObject => {
                const vectorLayer = mapObject.object.vectorLayer;
                if ( !vectorLayerList.has( vectorLayer ) ) {
                    vectorLayer.startTransaction();
                    vectorLayerList.add( vectorLayer );
                }
                mapObject.object.commit();
            } );

            await this.parentTask.commitTransaction( vectorLayerList, EDIT_POINT_ACTION );

            await this.currentObject.reload();
            const activeObject = this.map.getActiveObject();
            if ( activeObject && activeObject.gmlId === this.currentObject.gmlId ) {
                activeObject.updateFrom( this.currentObject );
            } else {
                this.map.setActiveObject( this.currentObject );
            }

            this.map.clearActiveObject();
            this.map.removeSelectedObject( this.currentObject );
        }

        this.quit();
    }

    protected async loadMapObjects(): Promise<MapObject[] | undefined> {
        let result = undefined;
        this.parentTask.setState(START_WAIT_CAPTURING);
        try {
            result = await super.loadMapObjects();
        } catch (e) {

            this.map.writeProtocolMessage( { text: e as string, type: LogEventType.Error } );
            console.error( e );

        } finally {
            this.parentTask.setState(STOP_WAIT_CAPTURING);

        }

        if (!result) {
            this.resetCapturingMode();
        }

        return result;
    }

    protected setCapturePointMode( value: boolean ) {
        if ( value ) {
            super.setCapturePointMode(value);
        } else {
            this.parentTask.setState(STOP_WAIT_CAPTURING);
            this.resetCapturingMode();
        }
    }

    protected setCaptureLineMode( value: boolean ) {
        if ( value ) {
            super.setCaptureLineMode(value);
        } else {
            this.parentTask.setState(STOP_WAIT_CAPTURING);
            this.resetCapturingMode();
        }
    }

}
