/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *   Класс для хранения пользовательских настроек в localStorage    *
 *                                                                  *
 *******************************************************************/

import { BrowserService } from '~/services/BrowserService';
import {
    MeasurementsStyle,
    MeasurementUnits,
    ObjectSelectionStyle,
    Params3d
} from '~/utils/WorkspaceManager';
import { LogRecord, SimpleJson } from '~/types/CommonTypes';
import { EditorLayoutDescription } from '~/types/Types';

type AppSettings = {
    username: string;
    id: string;
    options: { [ key: string ]: string }
};

type Settings = {
    measurementUnits: MeasurementUnits;
    measurementsStyle: MeasurementsStyle;
    objectSelectionStyle: ObjectSelectionStyle;
    refreshInterval: number;
    layersViewOrder: string[];
    hiddenLayers: string[];
    layersOpacity: { id: string; opacity: number; }[];
    visibleModels: string[];
    layoutsList: { id: string; layouts: { id: string; description: EditorLayoutDescription | null; }[] }[];
    layersSelected: { idLayer: string, selected: boolean }[];
}

type ProjectSettings = {
    id: string;
    mapcenter: { x: number; y: number; h: number; };
    zoomLevel: number;
    params3d: Params3d;
    serviceUrl: string;
    tilematrixset: string;
    protocolMapEvent: LogRecord[];
}

/**
 * Класс для хранения пользовательских настроек в localStorage
 * @class LocalStorageService
 */
export default class LocalStorageService {

    getSettings( userId: string, projectId: string ): Settings | undefined {
        if ( !userId ) {
            return;
        }
        const localStorageData = BrowserService.localStorage.getItem<SimpleJson<Settings>>( userId + 'settings', true );
        if ( localStorageData ) {
            return localStorageData[ projectId ];
        }
    }

    setSettings( userId: string, projectId: string, data: Settings ) {
        if ( !userId ) {
            return;
        }
        const localStorageData = BrowserService.localStorage.getItem<SimpleJson<Settings>>( userId + 'settings', true );
        if ( localStorageData ) {
            localStorageData[ projectId ] = data;
            BrowserService.localStorage.setItem<SimpleJson<Settings>>( userId + 'settings', localStorageData );
        } else {
            BrowserService.localStorage.setItem<SimpleJson<Settings>>( userId + 'settings', { [ projectId ]: data } );
        }
    }


    clearSettings( userId: string, projectId: string ): void {
        if ( !userId ) {
            return;
        }
        const localStorageData = BrowserService.localStorage.getItem<SimpleJson<Settings>>( userId + 'settings', true );
        if ( localStorageData ) {
            delete localStorageData[ projectId ];
            BrowserService.localStorage.setItem<SimpleJson<Settings>>( userId + 'settings', localStorageData );
        }
    }


    getProjectSettings( userId: string, projectId: string ): ProjectSettings | undefined {
        if ( !userId ) {
            return;
        }

        const localStorageData = BrowserService.localStorage.getItem<SimpleJson<ProjectSettings>>( userId + 'projectSettings', true );
        if ( localStorageData ) {
            return localStorageData[ projectId ];
        }
    }

    setProjectSettings( userId: string, projectId: string, data: ProjectSettings ) {
        if ( !userId ) {
            return;
        }

        const localStorageData = BrowserService.localStorage.getItem<SimpleJson<ProjectSettings>>( userId + 'projectSettings', true );
        if ( localStorageData ) {
            localStorageData[ projectId ] = data;
            BrowserService.localStorage.setItem<SimpleJson<ProjectSettings>>( userId + 'projectSettings', localStorageData );
        } else {
            BrowserService.localStorage.setItem<SimpleJson<ProjectSettings>>( userId + 'projectSettings', { [ projectId ]: data } );
        }
    }

    clearProjectSettings( userId: string, projectId: string ): void {
        if ( !userId ) {
            return;
        }

        const localStorageData = BrowserService.localStorage.getItem<SimpleJson<ProjectSettings>>( userId + 'projectSettings', true );
        if ( localStorageData ) {
            delete localStorageData[ projectId ];
            BrowserService.localStorage.setItem<SimpleJson<ProjectSettings>>( userId + 'projectSettings', localStorageData );
        }
    }

    getAppSettings( key: string, username: string ): AppSettings | undefined {

        let appSettings: AppSettings | undefined;

        try {
            const appSettingsArr = BrowserService.localStorage.getItem<AppSettings[]>(key, true) || [];
            appSettings = appSettingsArr.find(settings => settings.username === username);
        } catch (error) {
            error;
        }

        if ( !appSettings ) {
            // try to restore old settings
            const location = window.location.toString();
            const id = BrowserService.localStorage.getItem<string>( location );
            if ( id !== undefined ) {
                const optionsVersion = BrowserService.localStorage.getItem<{ [ key: string ]: string }>( id + 'optionsVersion', true );
                if ( optionsVersion ) {
                    appSettings = {
                        id, username, options: optionsVersion
                    };

                    BrowserService.localStorage.removeItem( id + 'optionsVersion' );
                    BrowserService.localStorage.setItem( key, [appSettings] );

                }
            }
        }

        return appSettings;
    }

    setAppSettings( key: string, data: AppSettings ): void {

        const appSettingsArr = BrowserService.localStorage.getItem<AppSettings[]>( key, true ) || [];

        const numberAppSettings = appSettingsArr.findIndex( settings => settings.id === data.id );

        if ( numberAppSettings === -1 ) {
            appSettingsArr.push( data );
        } else {
            appSettingsArr[ numberAppSettings ] = data;
        }

        BrowserService.localStorage.setItem<AppSettings[]>( key, appSettingsArr );
    }
}
