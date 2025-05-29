import MapWindow from '~/MapWindow';

export function GwtkMeasurements( mapWindow: MapWindow ) {
    //регистрация задачи
    const taskDescription = {
        id:'gwtkmeasurements.main',
        getConstructor: () => import('./task/GwtkMeasurementsTask').then(m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'ruler',
            title: 'phrases.Measurements',
            helpPage: 'dist_measure',
            storedData: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}