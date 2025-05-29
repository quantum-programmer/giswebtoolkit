import MapWindow from '~/MapWindow';

export function GwtkPlantBreeder( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id: 'gwtkplantbreeder.main',
        getConstructor: () => import('./task/GwtkPlantBreederTask').then( ( module )=> module.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-sprout-outline',
            pureTask: true,
            title: 'plantbreeder.Processing of NWR fields'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}