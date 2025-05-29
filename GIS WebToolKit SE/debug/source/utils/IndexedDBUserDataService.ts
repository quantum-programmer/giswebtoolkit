/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *     Класс для хранения пользовательских настроек в IndexedDB     *
 *                                                                  *
 *******************************************************************/


import { DBStructure, IndexedDBStorage } from '~/services/BrowserService/IndexedDBStorage';
import { StoreNames } from 'idb/build/entry';
import { ContainsSomeOf } from '~/types/CommonTypes';
import { UserSettings, UserStorageService } from './WorkspaceManager';


/**
 * Класс для хранения пользовательских настроек в IndexedDB
 * @class IndexedDBUserDataService
 */
export default class IndexedDBUserDataService implements UserStorageService {

    private storage: Promise<IndexedDBStorage | undefined>;

    constructor(user: string) {
        this.storage = IndexedDBStorage.retrieveStorage(user, 'userData' as StoreNames<DBStructure>);
    }

    async setUser(user: string) {
        (await this.storage)?.close();
        return this.storage = IndexedDBStorage.retrieveStorage(user, 'userData' as StoreNames<DBStructure>);
    }

    async getActiveProject() {
        const storage = await this.storage;
        if (storage) {
            return await storage.getItem<{ number: number; }>('activeProject', true);
        }
    }

    async setActiveProject(data: { number: number; }): Promise<string | undefined> {
        const storage = await this.storage;
        if (storage) {
            return await storage.setItem<{ number: number; }>('activeProject', data);
        }
    }

    async clearActiveProject() {
        const storage = await this.storage;
        if (storage) {
            await storage.removeItem('activeProject');
        }
    }
    async getUserSettings() {
        const storage = await this.storage;
        if (storage) {
            return await storage.getItem<ContainsSomeOf<UserSettings>>('defaultUserSettings', true);
        }
    }

    async setUserSettings(data: UserSettings) {
        const storage = await this.storage;
        if (storage) {
            await storage.setItem<ContainsSomeOf<UserSettings>>('defaultUserSettings', data);
        }
    }
    async close() {
        return (await this.storage)?.close();
    }
}
