import MapWindow from '~/MapWindow';

export function GwtkSearch( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtksearch.main',
        getConstructor: () => import('./task/GwtkSearchTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'search',
            title: 'phrases.Search',
            helpPage: 'search'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}
