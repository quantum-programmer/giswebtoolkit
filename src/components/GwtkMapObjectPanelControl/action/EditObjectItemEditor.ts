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
import Action from '~/taskmanager/Action';
import GwtkMapObjectTask from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';

export default class EditObjectItemEditor extends Action<GwtkMapObjectTask> {

    canShowObjectPanel(): boolean {
        return false;
    }

    canClose(): boolean {
        return false;
    }

    canMapMove(): boolean {
        return true;
    }

}
