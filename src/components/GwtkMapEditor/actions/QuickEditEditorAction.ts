/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик редактирования объекта                *
 *                                                                  *
 *******************************************************************/

import MapObject from '~/mapobject/MapObject';
import GwtkMapEditorTask from '../task/GwtkMapEditorTask';
import QuickEditAction from '~/systemActions/QuickEditAction';
import CriteriaAggregator from '~/services/Search/CriteriaAggregator';


/**
 * Обработчик редактирования объекта
 * @class QuickEditEditorAction
 * @extends QuickEditAction
 */
export default class QuickEditEditorAction extends QuickEditAction<GwtkMapEditorTask> {

    async commit(): Promise<void> {
        if ( this.currentObject ) {
            const vectorLayer = this.currentObject.vectorLayer;
            vectorLayer.startTransaction();
            await this.currentObject.commit();
            await this.parentTask.commitTransaction( [vectorLayer], this.id );
            await this.currentObject.reload();
            this.map.removeSelectedObject( this.currentObject );
            this.updateRect();
        }
    }

    updateCriteriaAggregator( criteriaAggregator: CriteriaAggregator ) {
        this.parentTask.updateCriteriaAggregator( criteriaAggregator );
    }

    canSelectThisObject( mapObject: MapObject ): boolean {
        const vectorLayer = this.parentTask.vectorLayer;
        return !!vectorLayer && vectorLayer.isEditable && vectorLayer.id === mapObject.vectorLayer.id;
    }
}
