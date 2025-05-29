import MapWindow from '~/MapWindow';

export function GwtkPrintMap( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkprintmap.main',
        getConstructor: () => import('./task/GwtkPrintMapTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'print',
            title: 'phrases.Print of map',
            helpPage: 'map_print'
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}