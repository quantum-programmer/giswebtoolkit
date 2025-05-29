import MapWindow from '~/MapWindow';

export function GwtkBeekeeper( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkbeekeeper.main',
        getConstructor: () => import('./task/GwtkBeekeeperTask').then( ( module )=> module.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-beekeeper',
            pureTask: true,
            title: 'beekeeper.Description of the apiary'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}