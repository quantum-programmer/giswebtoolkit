import MapWindow from '~/MapWindow';

export function GwtkMapLog( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmaplog.main',
        getConstructor: () => import('./task/GwtkMapLogTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'maplog',
            title: 'phrases.Log of Map events',
            helpPage: 'map_event_log'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}