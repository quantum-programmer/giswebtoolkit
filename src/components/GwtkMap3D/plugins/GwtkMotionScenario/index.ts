import MapWindow from '~/MapWindow';

export const GwtkMotionScenarioMetaData = Object.freeze( {
    id: 'gwtkmotionscenario.main',
    title: 'phrases.Motion scenario',
    icon: '3d-dynamic-scenario'
} );

export function GwtkMotionScenario( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkMotionScenarioTask').then( ( module ) => module.default ),
        id: GwtkMotionScenarioMetaData.id,
        active: false,
        enabled: true,
        options: {
            title: GwtkMotionScenarioMetaData.title,
            icon: GwtkMotionScenarioMetaData.icon,
            pureTask: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );

    return taskDescription;
}