import MapWindow from '~/MapWindow';

export function GwtkBeekeeperStatic(mapWindow: MapWindow) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkbeekeeperstatic.main',
        getConstructor: () => import('./task/GwtkBeekeeperStaticTask').then( ( module )=> module.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-beekeeper',
            //pureTask: true,
            title: 'beekeeper.Description of the apiary'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}