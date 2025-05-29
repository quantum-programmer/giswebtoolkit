import MapWindow from '~/MapWindow';

export function GwtkReliefLineDiagram( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkprofileRelief.main',
        getConstructor: () => import('./task/GwtkReliefLineDiagramTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: false,
        options: {
            icon: 'relief_profile',
            title: 'phrases.Relief profile',
            helpPage: 'build_profile'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}
