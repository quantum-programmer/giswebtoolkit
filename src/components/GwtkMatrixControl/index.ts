import MapWindow from '~/MapWindow';

export function GwtkMatrixControl( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkmatrixcontrol.main',
        getConstructor: () => import('./task/GwtkMatrixControlTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'mdi-chart-bell-curve',
            title: 'phrases.Values of matrixes in point',
            helpPage: 'matrix_value_at_point'
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}