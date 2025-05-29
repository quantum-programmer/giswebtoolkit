import MapWindow from '~/MapWindow';

export function GwtkMapOptions( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtkmapoptions.main',
        getConstructor: () => import('./task/GwtkMapOptionsTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'settings',
            title: 'phrases.Options',
            helpPage: 'parameters'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}