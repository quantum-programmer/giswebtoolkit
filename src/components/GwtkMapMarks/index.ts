import MapWindow from '~/MapWindow';

export function GwtkMapMarks( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtkmapmarks.main', 
        getConstructor: () => import('./task/GwtkMapMarksTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'mdi-bookmark-outline',        
            title: 'phrases.Map Marks',
            helpPage: 'map_marks',
            storedData: true
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

}
