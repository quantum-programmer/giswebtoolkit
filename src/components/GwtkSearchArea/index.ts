import MapWindow from '~/MapWindow';

export function GwtkSearchArea( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtksearcharea.main',
        getConstructor: () => import('./task/GwtkSearchAreaTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'search-area',        
            title: 'phrases.Area search',
            helpPage: 'area_search'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}
