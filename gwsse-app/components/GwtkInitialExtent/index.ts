import MapWindow, {GwtkComponentPanel} from '~/MapWindow';

export function GwtkInitialExtent( mapWindow: MapWindow) {

    //регистрация задачи
    const taskDesciption = {
        id: 'gwtkinitialextend.main',
        getConstructor: () => import('./task/GwtkInitialExtentTask').then( m => m.default ),
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-home',
            title: 'initialextent.Project initial map extent',
            specifiedToolbar: GwtkComponentPanel.LEFT_TOOLBAR
        }
    };

    mapWindow.getTaskManager().registerTask( taskDesciption );
}
