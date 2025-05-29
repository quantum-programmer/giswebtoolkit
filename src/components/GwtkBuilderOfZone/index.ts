import MapWindow from '~/MapWindow';

export function GwtkBuilderOfZone( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkbuilderofzone.main',
        getConstructor: () => import('./task/GwtkBuilderOfZoneTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'builder-of-zone',
            title: 'phrases.Build buffer zone',
            helpPage: 'buffer_zone'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}