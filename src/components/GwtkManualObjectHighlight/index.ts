import MapWindow from '~/MapWindow';


export function GwtkManualObjectHighlight( mapWindow: MapWindow ): void {

    //регистрация задачи
    const taskDescription = {
        id:'gwtkmanualobjecthighlight.main',
        getConstructor: () => import('./task/GwtkManualObjectHighlightTask').then( m => m.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'flashlight-plus',
            title: 'phrases.Select specified'
        }
    };
    mapWindow.getTaskManager().registerTask( taskDescription );
}
