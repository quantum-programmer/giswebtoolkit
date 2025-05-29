/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Класс для хранения пользовательских настроек в БД        *
 *                         GIS Web Server SE                        *
 *                                                                  *
 *******************************************************************/


import {UserSettings, UserStorageService} from '~/utils/WorkspaceManager';
import {ContainsSomeOf} from '~/types/CommonTypes';
import GISWebServerSEService from './GISWebServerSEService';

/**
 * Класс для хранения пользовательских настроек в БД GIS Web Server SE
 * @class GISWebServerDBUserDataService
 * @implements UserStorageService
 */
export default class GISWebServerDBUserDataService implements UserStorageService {



    constructor(private readonly username: string) {
    }

    getActiveProject(): Promise<{ number: number } | undefined> {
        const service = new GISWebServerSEService();
        return service.getUserDataActiveProject();
    }

    setActiveProject(data: { number: number }): Promise<string | undefined> {
        const service = new GISWebServerSEService();
        return service.setUserDataActiveProject(data);
    }

    clearActiveProject(): Promise<void> {
        const service = new GISWebServerSEService();
        return service.clearUserDataActiveProject();
    }

    getUserSettings(): Promise<ContainsSomeOf<UserSettings> | undefined> {
        const service = new GISWebServerSEService();
        return service.getUserDataDefaultUserSettings();
    }

    setUserSettings(data: UserSettings): Promise<void> {
        const service = new GISWebServerSEService();
        return service.setUserDataDefaultUserSettings(data);
    }

    setUser(user: string): void {
    }

    close(): Promise<void> {
        return Promise.resolve(undefined);
    }

}