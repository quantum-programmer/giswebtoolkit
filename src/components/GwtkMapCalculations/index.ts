import MapWindow from '~/MapWindow';

export function GwtkMapCalculations( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtkmapcalculations.main',
        getConstructor: () => import('./task/GwtkMapCalculationsTask').then( ( module ) => module.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            icon: 'map-calculation',        
            title: 'phrases.Map calculation',
            helpPage: 'map_computer'
        }
    };

    mapWindow.getTaskManager().registerTask( taskDescription );

} 

