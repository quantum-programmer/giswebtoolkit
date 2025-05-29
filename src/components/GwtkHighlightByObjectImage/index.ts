import MapWindow from '~/MapWindow';


export function GwtkHighlightByObjectImage( mapWindow: MapWindow ): void {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkhighlightbyobjectimage.main',
        getConstructor: () => import('./task/GwtkHighlightByObjectImageTask').then( m => m.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'legacy-select-object-image',
            title: 'phrases.Select by sign'
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}