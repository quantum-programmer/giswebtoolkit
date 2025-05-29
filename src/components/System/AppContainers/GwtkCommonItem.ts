/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *               Системный компонент элемента панели                *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import i18n from '@/plugins/i18n';

/**
 * Системный компонент элемента панели
 * @class GwtkCommonItem
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkCommonItem extends BaseGwtkVueComponent {

    @Prop({
        default: ''
    })
    taskId!: string;

    @Prop()
    actionId?: string;

    @Prop({
        default: () => ({ active: true, enabled: true, options: { title: 'Default title' } })
    })
    description!: TaskDescription;

    /**
     * Состояние активности компонента
     * @protected
     * @property active {boolean}
     */
    protected get active() {
        return this.description.active;
    }

    protected get helpPageExists(): boolean {
        return this.mapVue.getTaskManager().checkHelpPage(this.taskId);
    }

    protected get storedData(): boolean {
        return !!this.mapVue.getTaskManager().getTaskDescription(this.taskId).options.storedData;
    }

    protected get title(): string {
        const componentName = this.mapVue.getTaskManager().getTaskDescription(this.taskId).options.title + '';
        return i18n.tc(componentName);
    }

    /**
     * Обработчик клика
     * @method onClick
     */
    onClick() {
        this.mapVue.getTaskManager().toggleTaskOrAction(this.taskId, this.actionId);
    }

    /**
     * Открыть страницу справки
     * @method openHelp
     */
    openHelp() {
        this.mapVue.getTaskManager().callHelp(this.taskId);
    }
}
