/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *        Класс для хранения пользовательских настроек в БД         *
 *                         GIS Web Server SE                        *
 *                                                                  *
 *******************************************************************/


import {
    ComponentData,
    JSONData,
    ProjectSettings,
    StorageService,
    UserSettings,
    ViewSettings
} from '~/utils/WorkspaceManager';
import {ContainsSomeOf, SimpleJson} from '~/types/CommonTypes';
import GISWebServerSEService from './GISWebServerSEService';


/**
 * Класс для хранения пользовательских настроек в БД GIS Web Server SE
 * @class GISWebServerDBService
 * @implements StorageService
 */
export default class GISWebServerDBService implements StorageService {

    constructor(private readonly username: string, private readonly projectId: string) {
    }


    setUser(user: string, projectId: string): void {
    }

    getViewSettings(): Promise<ContainsSomeOf<ViewSettings> | undefined> {
        const service = new GISWebServerSEService();
        return service.getProjectViewSettings<ContainsSomeOf<ViewSettings>>(this.projectId, 'viewSettings');
    }

    getProjectSettings(): Promise<ContainsSomeOf<ProjectSettings> | undefined> {
        const service = new GISWebServerSEService();
        return service.getProjectViewSettings<ContainsSomeOf<ProjectSettings>>(this.projectId, 'projectSettings');
    }

    getUserSettings(): Promise<ContainsSomeOf<UserSettings> | undefined> {
        const service = new GISWebServerSEService();
        return service.getProjectViewSettings<ContainsSomeOf<UserSettings>>(this.projectId, 'projectUserSettings');
    }

    getJsonData(): Promise<JSONData | undefined> {
        const service = new GISWebServerSEService();
        return service.getProjectViewSettings<JSONData>(this.projectId, 'jsonData');
    }

    async getAllComponentsData(): Promise<ComponentData | undefined> {
        const service = new GISWebServerSEService();
        return await service.getAuthUserAllComponentData(this.projectId);
    }

    async getComponentData(taskId: string): Promise<SimpleJson<any> | undefined> {
        const service = new GISWebServerSEService();
        return await service.getComponentData(this.projectId, taskId);
    }

    setViewSettings(data: ViewSettings): Promise<void> {
        const service = new GISWebServerSEService();
        return service.setProjectViewSettings(this.projectId, 'viewSettings', data);
    }

    setProjectSettings(data: ProjectSettings): Promise<void> {
        const service = new GISWebServerSEService();
        return service.setProjectViewSettings(this.projectId, 'projectSettings', data);
    }

    setUserSettings(data: UserSettings): Promise<void> {
        const service = new GISWebServerSEService();
        return service.setProjectViewSettings(this.projectId, 'projectUserSettings', data);
    }

    setJsonData(data: JSONData): Promise<void> {
        const service = new GISWebServerSEService();
        return service.setProjectViewSettings(this.projectId, 'jsonData', data);
    }

    async setComponentData(taskId: string, data?: SimpleJson<any>): Promise<void> {
        const service = new GISWebServerSEService();
        return service.setComponentData(this.projectId, taskId, data);
    }

    async clearViewSettings(): Promise<void> {
        const service = new GISWebServerSEService();
        return service.clearProjectViewSettings(this.projectId, 'viewSettings');
    }

    async clearProjectSettings(): Promise<void> {
        const service = new GISWebServerSEService();
        return service.clearProjectViewSettings(this.projectId, 'projectSettings');
    }

    async clearUserSettings(): Promise<void> {
        const service = new GISWebServerSEService();
        return service.clearProjectViewSettings(this.projectId, 'projectUserSettings');
    }

    clearJsonData(): Promise<void>;

    async clearJsonData(): Promise<void> {
        const service = new GISWebServerSEService();
        return service.clearProjectViewSettings(this.projectId, 'jsonData');
    }

    close(): Promise<void> {
        return Promise.resolve(undefined);
    }
}
