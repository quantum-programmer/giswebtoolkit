import MapWindow from '~/MapWindow';

export const GwtkFreeFlightMetaData = Object.freeze( {
    id: 'gwtkfreeflight.main',
    title: 'phrases.Free flight',
    icon: '3d-free-flight'
} );

export function GwtkFreeFlight( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkFreeFlightTask').then( ( module ) => module.default ),
        id: GwtkFreeFlightMetaData.id,
        active: false,
        enabled: true,
        options: {
            title: GwtkFreeFlightMetaData.title,
            icon: GwtkFreeFlightMetaData.icon,
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );

    return taskDescription;
}