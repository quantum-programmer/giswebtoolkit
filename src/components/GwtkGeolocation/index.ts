import MapWindow, { GwtkComponentPanel } from '~/MapWindow';
import { BrowserService } from '~/services/BrowserService';

export function GwtkGeolocation( mapWindow: MapWindow ): void {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkgeolocation.main',
        getConstructor: () => import('./task/GwtkGeolocationTask').then( m => m.default ),
        active: false,
        enabled: BrowserService.checkGeolocation(),
        options: {
            title: 'phrases.Geolocation',
            icon: 'geolocation',
            specifiedToolbar: GwtkComponentPanel.RIGHT_BAR
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}