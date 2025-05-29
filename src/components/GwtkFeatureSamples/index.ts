import MapWindow from '~/MapWindow';

export function GwtkFeatureSamples( mapWindow: MapWindow ) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkfeaturesamples.main',
        getConstructor: () => import('./task/GwtkFeatureSamplesTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'mdi-format-list-bulleted-type',
            title: 'phrases.Object lists',
            helpPage: 'object_lists',
            storedData: true
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}