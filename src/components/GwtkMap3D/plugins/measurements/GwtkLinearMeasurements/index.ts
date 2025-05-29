import MapWindow from '~/MapWindow';

export const GwtkLinearMeasurementsMetaData = Object.freeze( {
    id: 'gwtklinearmeasurements.main',
    title: 'phrases.Linear measurements',
    icon: '3d-linear-measurements'
} );

export function GwtkLinearMeasurements( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkLinearMeasurementsTask').then( ( module ) => module.default ),
        id: GwtkLinearMeasurementsMetaData.id,
        active: false,
        enabled: true,
        options: {
            title: GwtkLinearMeasurementsMetaData.title,
            icon: GwtkLinearMeasurementsMetaData.icon,
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );

    return taskDescription;
}