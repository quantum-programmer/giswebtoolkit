import MapWindow from '~/MapWindow';

export const GwtkAreaMeasurementsMetaData = Object.freeze( {
    id: 'gwtkareameasurements.main',
    title: 'phrases.Area measurements',
    icon: '3d-area-measurements'
} );

export function GwtkAreaMeasurements( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkAreaMeasurementsTask').then( ( module ) => module.default ),
        id: GwtkAreaMeasurementsMetaData.id,
        active: false,
        enabled: true,
        options: {
            title: GwtkAreaMeasurementsMetaData.title,
            icon: GwtkAreaMeasurementsMetaData.icon,
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );

    return taskDescription;
}