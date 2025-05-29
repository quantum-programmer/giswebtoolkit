import MapWindow from '~/MapWindow';

export function GwtkMapScaleViewer( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmapscaleviewer.main',
        getConstructor: () => import('./task/GwtkMapScaleViewerTask').then( ( module ) => module.default ),
        active: true,
        enabled: true,
        options: {
            icon: '',
            title: '',
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
    mapWindow.getTaskManager().createTask( 'gwtkmapscaleviewer.main' );

}