/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Обработчик удаления объекта                   *
 *                                                                  *
 *******************************************************************/

import MapObject from '~/mapobject/MapObject';
import GwtkMapEditorTask, { DELETE_OBJECT_ACTION } from '../task/GwtkMapEditorTask';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';
import DeleteObjectAction from '~/systemActions/DeleteObjectAction';


/**
 * Обработчик удаления объекта
 * @class DeleteObjectEditorAction
 * @extends DeleteObjectAction
 */
export default class DeleteObjectEditorAction extends DeleteObjectAction<GwtkMapEditorTask> {

    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
        this.parentTask.updateCriteriaAggregator( criteriaAggregator );
    }

    canSelectThisObject( mapObject: MapObject ): boolean {
        const vectorLayer = this.parentTask.vectorLayer;
        return !!vectorLayer && vectorLayer.isEditable && vectorLayer.id === mapObject.vectorLayer.id;
    }

    async commit() {
        if ( this.currentObject ) {

            const vectorLayer = this.currentObject.vectorLayer;
            vectorLayer.startTransaction();
            await this.currentObject.delete();
            await this.parentTask.commitTransaction( [vectorLayer], DELETE_OBJECT_ACTION );

            this.map.removeSelectedObject( this.currentObject );
            this.map.clearActiveObject();
            this.currentObject = undefined;
            this.parentTask.setPanelMessage( { text: 'Select map object' } );
            this.parentTask.removeModePanel();
        }
    }

}
