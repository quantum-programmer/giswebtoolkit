/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Пустой оббработчик для растениеводов               *
 *                                                                  *
 *******************************************************************/


import Action from '~/taskmanager/Action';
import { CURSOR_TYPE } from '~/types/Types';
import GwtkPlantBreederTask from '@/components/GwtkPlantBreeder/task/GwtkPlantBreederTask';

/**
 * Пустой оббработчик для растениеводов
 * @class PlantBreederEmptyAction
 * @extends Action<Task>
 */
export default class PlantBreederEmptyAction extends Action<GwtkPlantBreederTask> {

    /**
     * Вид курсора
     * @private
     * @property cursor {CURSOR_TYPE}
     */
    private cursor?: CURSOR_TYPE;

    /**
     * @constructor PlantBreederEmptyAction
     * @param task {Task} Экземпляр родительской задачи
     * @param id {string} Идентификатор обработчика
     */
    constructor( task: GwtkPlantBreederTask, id: string) {
        super(task, id);
    }

    destroy() {
        if ( this.cursor ) {
            this.mapWindow.setCursor( this.cursor );
            this.cursor = undefined;
        }

        this.map.requestRender();
    }

    setup() {
        this.map.clearActiveObject();
        this.cursor = this.mapWindow.setCursor( CURSOR_TYPE.default );
        const selectedObjectsList = this.map.getSelectedObjects();
        this.map.removeSelectedObjects( selectedObjectsList );
    }

    canClose() {
        return true;
    }

    canMapMove() {
        return true;
    }

    canSelectObject() {
        return !this.parentTask.getWidgetPropsCurrentMapObject();
    }

}
