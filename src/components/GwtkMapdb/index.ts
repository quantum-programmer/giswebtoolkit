import MapWindow from '~/MapWindow';

export function GwtkMapdb( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmapdb.main',
        getConstructor: () => import('./task/GwtkMapdbTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: false,
        options: {
            icon: 'mdi-database-outline',
            title: 'phrases.Spatial database',
            helpPage: 'spatial_database',
            storedData: true
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}
