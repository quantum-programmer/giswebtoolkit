import MapWindow from '~/MapWindow';


export function GwtkSelectedObjectsViewer( mapWindow: MapWindow ): void {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkselectedobjectsviewer.main',
        getConstructor: () => import('./task/GwtkSelectedObjectsViewerTask').then( m => m.default ),
        active: false,
        enabled: false,
        options: {
            icon: 'mdi-format-list-bulleted',
            title: 'phrases.Selected objects'
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}