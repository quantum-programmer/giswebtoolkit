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

import { ComponentData, ProjectSettings, StorageService, ViewSettings, JSONData, UserSettings } from '~/utils/WorkspaceManager';
import { SimpleJson, ContainsSomeOf } from '~/types/CommonTypes';
import { DBStructure, IndexedDBStorage } from '~/services/BrowserService/IndexedDBStorage';
import { StoreNames } from 'idb/build/entry';

/**
 * Класс для хранения пользовательских настроек в IndexedDB
 * @class IndexedDBService
 * @implements StorageService
 */
export default class IndexedDBService implements StorageService {

    private storage: Promise<IndexedDBStorage | undefined>;

    constructor( user: string, projectId: string ) {
        this.storage = IndexedDBStorage.retrieveStorage( user, projectId as StoreNames<DBStructure> );
    }

    async setUser( user: string, projectId: string ) {
        (await this.storage)?.close();
        return this.storage = IndexedDBStorage.retrieveStorage( user, projectId as StoreNames<DBStructure> );
    }

    async getViewSettings() {
        const storage = await this.storage;
        if ( storage ) {
            return await storage.getItem<SimpleJson<any>>( 'viewSettings', true );
        }
    }

    async setViewSettings( data: ViewSettings ) {
        const storage = await this.storage;
        if ( storage ) {
            await storage.setItem<SimpleJson<any>>( 'viewSettings', data );
        }
    }

    async clearViewSettings() {
        const storage = await this.storage;
        if ( storage ) {
            await storage.removeItem( 'viewSettings' );
        }
    }


    async getProjectSettings() {
        const storage = await this.storage;
        if ( storage ) {
            return await storage.getItem<ContainsSomeOf<ProjectSettings>>( 'projectSettings', true );
        }
    }

    async getUserSettings() {
        const storage = await this.storage;
        if ( storage ) {
            return await storage.getItem<ContainsSomeOf<UserSettings>>( 'projectUserSettings', true );
        }
    }

    async setProjectSettings( data: ProjectSettings ) {
        const storage = await this.storage;
        if ( storage ) {
            await storage.setItem<ContainsSomeOf<ProjectSettings>>( 'projectSettings', data );
        }
    }

    async setUserSettings( data: UserSettings ) {
        const storage = await this.storage;
        if ( storage ) {
            await storage.setItem<ContainsSomeOf<UserSettings>>( 'projectUserSettings', data );
        }
    }

    async clearProjectSettings() {
        const storage = await this.storage;
        if ( storage ) {
            await storage.removeItem( 'projectSettings' );
        }
    }

    async clearUserSettings() {
        const storage = await this.storage;
        if ( storage ) {
            await storage.removeItem( 'projectUserSettings' );
        }
    }

    async getComponentData( taskId: string ): Promise<ComponentData | undefined> {
        const storage = await this.storage;
        if ( storage ) {
            return await storage.getItem<SimpleJson<any>>( taskId, true );
        }
    }

    async setComponentData( taskId: string, data?: ComponentData ): Promise<void> {
        const storage = await this.storage;
        if ( storage ) {
            if ( data ) {
                await storage.setItem<SimpleJson<any>>( taskId, data );
            } else {
                await storage.removeItem( taskId );
            }
        }
    }

    async getAllComponentsData(): Promise<ComponentData | undefined> {
        const storage = await this.storage;
        if ( storage ) {
            const keys = await storage.getAllKeys();
            const filteredKeys = keys.filter( key => key !== 'projectSettings' && key !== 'viewSettings' );

            if ( filteredKeys.length > 0 ) {
                const result: ComponentData = {};

                for ( let i = 0; i < filteredKeys.length; i++ ) {
                    const componentId = filteredKeys[ i ];
                    const componentData = await storage.getItem<SimpleJson<any>>( componentId );
                    if ( componentData ) {
                        result[ componentId ] = componentData;
                    }
                }

                return result;
            }

        }
    }

    async close(): Promise<void> {
        return (await this.storage)?.close();
    }

    async getJsonData() {
        const storage = await this.storage;
        if ( storage ) {
            return await storage.getItem<SimpleJson<any>>( 'jsonData', true );
        }
    }

    async setJsonData( data: JSONData ) {
        const storage = await this.storage;
        if ( storage ) {
            await storage.setItem<SimpleJson<any>>( 'jsonData', data );
        }
    }

    async clearJsonData() {
        const storage = await this.storage;
        if ( storage ) {
            await storage.removeItem( 'jsonData' );
        }
    }
}
