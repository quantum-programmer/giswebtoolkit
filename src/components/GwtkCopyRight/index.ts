import MapWindow from '~/MapWindow';

export function GwtkCopyRight( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'GwtkCopyRight.main',
        getConstructor: () => import('./task/GwtkCopyRightTask').then( ( module ) => module.default ),
        active: mapWindow.getMap().options.copyright !== undefined,
        enabled: true,
        options: {
            icon: '',
            title: 'phrases.CopyRight',
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
    mapWindow.getTaskManager().createTask( 'GwtkCopyRight.main' );
}