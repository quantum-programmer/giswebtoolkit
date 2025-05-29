import MapWindow from '~/MapWindow';

export function GwtkMyMaps( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmymaps.main',
        getConstructor: () => import('./task/GwtkMyMapsTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'mdi-palette-outline',
            title: 'mymaps.My maps',
            helpPage: 'mymap',
            storedData: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}