import MapWindow from '~/MapWindow';

export function GwtkMovingToPoint( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmovingtopoint.main',
        getConstructor: () => import('./task/GwtkMovingToPointTask').then( ( module ) => module.default ),
        active: true,
        enabled: true,
        options: {
            icon: 'moving-to-point',
            title: 'phrases.Moving to the point',
            pureTask: true,
            helpPage: 'moving_to_point'
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
    mapWindow.getTaskManager().createTask( 'gwtkmovingtopoint.main' );
}