import MapWindow from '~/MapWindow';

export function GwtkHeatMap( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkheatmap.main',
        getConstructor: () => import('./task/GwtkHeatMapTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'heatmap',
            title: 'phrases.Build heat map',
            helpPage:'heat_map'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}