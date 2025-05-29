import MapWindow from '~/MapWindow';

export const GwtkLinearMeasurementsSurfaceMetaData = Object.freeze( {
    id: 'gwtklinearmeasurementssurface.main',
    title: 'phrases.Linear measurements by surface',
    icon: '3d-linear-measurements-surface'
} );

export function GwtkLinearMeasurementsSurface( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkLinearMeasurementsSurfaceTask').then( ( module ) => module.default ),
        id: GwtkLinearMeasurementsSurfaceMetaData.id,
        active: false,
        enabled: true,
        options: {
            title: GwtkLinearMeasurementsSurfaceMetaData.title,
            icon: GwtkLinearMeasurementsSurfaceMetaData.icon,
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );

    return taskDescription;
}