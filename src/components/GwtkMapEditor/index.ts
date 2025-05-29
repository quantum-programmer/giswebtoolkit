import MapWindow from '~/MapWindow';

export function GwtkMapEditor( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id:'gwtkmapeditor.main',
        getConstructor: () => import('./task/GwtkMapEditorTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'mdi-pencil-outline',
            title: 'phrases.Map editor',
            helpPage: 'map_editor',
            storedData: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}