import MapWindow from '~/MapWindow';

export function GwtkSearchBySemantics( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtksearchbysemantics.main',
        getConstructor: () => import('./task/GwtkSearchBySemanticsTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'search-by-semantic',
            title: 'phrases.Search by semantics',
            helpPage: 'search_by_semantics',
            storedData: true
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}
