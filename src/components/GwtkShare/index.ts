import MapWindow from '~/MapWindow';
import { BrowserService } from '~/services/BrowserService';

export function GwtkShare( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtkshare.main',
        getConstructor: () => import('./task/GwtkShareTask').then( ( module ) => module.default ),
        active: false,
        enabled: BrowserService.isSecureContext, // Копирование в буфер доступно, только для localhost, https, разрешенных сайтов
        options: {
            icon: 'share',
            title: 'phrases.Link'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}
