/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                          Класс PluginTask                        *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import MapWindow from '~/MapWindow';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import { SimpleJson } from '~/types/CommonTypes';


/**
 * Класс PluginTask
 * @class PluginTask
 */
export default class PluginTask extends Task {

    private readonly name: string;

    protected template = '';

    private templateHeader: string = `
                                        <gwtk-window-item
                                            :task-id="taskId"
                                            :map-vue="mapVue"
                                            :description="description"
                                            :min-width="minWidth"
                                            :min-height="minHeight"
                                        >
                                     `;

    private templateFooter: string = `
                                        </gwtk-window-item>
                                     `;

    private templateHeaderSidebar: string = `
                                        <gwtk-task-container-item
                                            :task-id="taskId"
                                            :map-vue="mapVue"
                                            :description="description"
                                        >
                                     `;

    private templateFooterSidebar: string = `
                                        </gwtk-task-container-item>
                                     `;

    private _widgetProps: SimpleJson<any> = {
        minWidth: 600,
        minHeight: 696
    };

    windowMode = true;

    /**
     * Параметры виджета
     * @protected
     * @readonly
     * @property widgetProps {SimpleJson}
     */
    protected get widgetProps() {
        return this._widgetProps;
    }

    protected set widgetProps(value: SimpleJson<any>) {
        this._widgetProps = { ...this.widgetProps, ...value };
    }

    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        this.widgetProps.taskId = id;
        this.widgetProps.mapVue = mapWindow;
        this.widgetProps.description = this.mapWindow.getTaskManager().getTaskDescription(id);

        this.name = id;
    }

    createTaskPanel() {
        //регистрация Vue компонента
        this.mapWindow.registerComponent(this.name, {
            props: Reflect.ownKeys(this.widgetProps),
            template: this.windowMode ? (this.templateHeader + this.template + this.templateFooter) : (this.templateHeaderSidebar + this.template + this.templateFooterSidebar)
        });

        // Создание Vue компонента
        if (this.windowMode) {
            this.mapWindow.createWindowWidget(this.name, this.widgetProps as GwtkComponentDescriptionPropsData);
        } else {
            this.mapWindow.createWidget(this.name, this.widgetProps as GwtkComponentDescriptionPropsData);
        }

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps as GwtkComponentDescriptionPropsData);
    }

    canShowTooltip(): boolean {
        return true;
    }

}
