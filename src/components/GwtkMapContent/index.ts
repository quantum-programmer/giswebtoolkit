import MapWindow from '~/MapWindow';

export function GwtkMapContent( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtkmapcontent.main',
        getConstructor: () => import('./task/GwtkMapContentTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'layers',
            title: 'mapcontent.Map content',
            helpPage: 'map_contents',
            storedData: true
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );
}