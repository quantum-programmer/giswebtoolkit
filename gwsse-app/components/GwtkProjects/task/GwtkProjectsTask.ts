/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Компонент Проекты                           *
 *                                                                  *
 ********************************************************************/


import Task from '~/taskmanager/Task';
import {GwtkComponentDescriptionPropsData} from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkProjectsWidget from './GwtkProjectsWidget.vue';
import AppWindow, {ProjectsList} from '../../../AppWindow';
import {ContentTree, GwtkOptions} from '~/types/Options';
import GISWebServerSEService from '../../../service/GISWebServerSEService';
import {ProjectDescriptionParams} from '../../../service/GISWebServerSEService/Types';
import { LogEventType } from '~/types/CommonTypes';


export const CLICK_FILE_TREE = 'gwtkprojects.clickfiletree';
export const CLICK_ON_BACK = 'gwtkprojects.clickonback';
export const CLICK_ON_PROJECT = 'gwtkprojects.clickonproject';

export type GwtkProjectsState = {
    [CLICK_FILE_TREE]: string;
    [CLICK_ON_BACK]: string;
    [CLICK_ON_PROJECT]: string;
}

type WidgetParams = {
    buildMapProgressBar: boolean;
    setState: GwtkProjectsTask['setState'];
    selectedFileTree: boolean;
    itemsTree: ContentTree[];
    projectList: ProjectsList['projects'];
    activeProjectId: string;
}

/**
 * Компонент "Проекты"
 * @class GwtkProjectsTask
 * @extends Task
 * @description
 */
export default class GwtkProjectsTask extends Task {
    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;

    /**
     * @constructor GwtkProjectsTask
     * @param mapWindow {MapWindow} Экземпляр окна приложения
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);


        const projectList = (this.mapWindow as AppWindow).projectsList?.projects || [];

        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            buildMapProgressBar: false,
            selectedFileTree: false,
            itemsTree: [],
            projectList,
            activeProjectId: this.map.options.id
        };
    }

    /**
     * регистрация Vue компонента
     */
    createTaskPanel() {
        // регистрация Vue компонента
        const nameWidget = 'GwtkProjectsWidget';
        const sourceWidget = GwtkProjectsWidget;
        this.mapWindow.registerComponent(nameWidget, sourceWidget);

        // Создание Vue компонента
        this.mapWindow.createWindowWidget(nameWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);

    }

    async setState<K extends keyof GwtkProjectsState>(key: K, value: GwtkProjectsState[K]) {

        switch (key) {

            case CLICK_FILE_TREE:
                try {
                    const result = await GwtkProjectsTask.sendRequest({cmd: 'projparams', projid: value});
                    if (result) {
                        this.widgetProps.itemsTree = result.contenttree;
                        this.widgetProps.selectedFileTree = true;
                    }

                } catch (error) {
                    this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
                }
                break;

            case CLICK_ON_BACK:
                if (value == 'clickOnBack') {
                    this.widgetProps.selectedFileTree = false;
                }
                break;

            case CLICK_ON_PROJECT:
                try {
                    const currentOptions = await GwtkProjectsTask.sendRequest({ cmd: 'projparams', projid: value });
                    if (currentOptions) {
                        await this.map.workspaceManager.close();
                        await (this.mapWindow as AppWindow).initMapOptions(currentOptions);
                    }
                } catch (error) {
                    this.map.writeProtocolMessage({ text: error as string, type: LogEventType.Error, display: false });
                }
                break;
        }
    }

    private static async sendRequest(options: ProjectDescriptionParams): Promise<GwtkOptions | undefined> {
        const requestService = new GISWebServerSEService();
        const result = await requestService.getProjectDescription(options);
        if (result.data) {
            return result.data.options;
        }
    }
}

