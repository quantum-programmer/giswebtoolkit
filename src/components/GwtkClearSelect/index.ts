import MapWindow from '~/MapWindow';

export function GwtkClearSelect( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkClearSelect').then( ( module ) => module.default ),
        id: 'gwtkclearselect.main',
        active: false,
        enabled: mapWindow.getMap().hasObjectsSelection(),
        options: {
            icon: 'mdi-selection-remove',
            title: 'phrases.Clear selection'
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}