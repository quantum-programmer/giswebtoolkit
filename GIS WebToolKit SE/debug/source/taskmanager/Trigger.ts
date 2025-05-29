/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                          Класс Триггер                           *
 *                                                                  *
 *******************************************************************/

import Action from '~/taskmanager/Action';
import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import Utils from '~/services/Utils';


/**
 * Класс Trigger
 * @class Trigger
 */
export default class Trigger extends Action<Task> {

    constructor(mapWindow:MapWindow, id= Utils.generateGUID()) {
        const triggerTask = new TriggerTask(mapWindow, id);
        super(triggerTask, id);

        triggerTask.doTrigger(this);
    }

    close() {
        super.close();
    }

    quit() {
        super.quit();
    }

    canShowTooltip(): boolean {
        return true;
    }

    canMapMove(): boolean {
        return true;
    }

    canSelectObject(): boolean {
        return true;
    }

}

class TriggerTask extends Task {

    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);
    }

    doTrigger(trigger: Trigger) {
        this._action = trigger;
        this.mapWindow.getTaskManager().addTrigger(trigger);
        trigger.setup();
    }

    closeAction(id: string) {
        if (this._action && this._action.id === id) {
            this._action.destroy();
            this._action.clearTaskActon();
            this.mapWindow.getTaskManager().removeTrigger(id);
        }
    }

    quitAction(id: string) {
        this.closeAction(id);
    }

}
