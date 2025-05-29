import MapWindow from '~/MapWindow';

export function GwtkShutter( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkshutter.main',
        getConstructor: () => import('./task/GwtkShutterTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'shutter-layer',
            title: 'phrases.Shutter layer',
            helpPage:'layer_shutter'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}