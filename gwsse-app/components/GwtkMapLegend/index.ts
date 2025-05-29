import MapWindow from '~/MapWindow';

export function GwtkMapLegendGwsse( mapWindow: MapWindow ) {

    const taskDescription = {
        id: 'gwtkmaplegend.main',
        getConstructor: () => import('./task/GwtkMapLegendTask').then( m => m.default ),
        active: false,
        enabled: true,
        restartable: true,
        options: {
            pureTask: !(mapWindow.getMap().options.controls.includes( '*' ) || mapWindow.getMap().options.controls.includes( 'legend' )),
            icon: 'mdi-map-legend',
            title: 'legend.Map legend',
            helpPage: 'layer_legend',
            storedData: true
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}