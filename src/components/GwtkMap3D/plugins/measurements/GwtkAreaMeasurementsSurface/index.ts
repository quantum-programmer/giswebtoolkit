import MapWindow from '~/MapWindow';

export const GwtkAreaMeasurementsSurfaceMetaData = Object.freeze( {
    id: 'gwtkareameasurementssurface.main',
    title: 'phrases.Area measurements by surface',
    icon: '3d-area-measurements-surface'
} );

export function GwtkAreaMeasurementsSurface( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkAreaMeasurementsSurfaceTask').then( ( module ) => module.default ),
        id: GwtkAreaMeasurementsSurfaceMetaData.id,
        active: false,
        enabled: true,
        options: {
            title: GwtkAreaMeasurementsSurfaceMetaData.title,
            icon: GwtkAreaMeasurementsSurfaceMetaData.icon,
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );

    return taskDescription;
}