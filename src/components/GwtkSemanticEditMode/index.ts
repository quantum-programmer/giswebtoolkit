import MapWindow, { GwtkComponentPanel } from '~/MapWindow';

export function GwtkSemanticEditMode(mapWindow: MapWindow) {

    //регистрация задачи
    const taskDescription = {
        id: 'mode_button_editmode',
        getConstructor: () => import('./task/GwtkSemanticEditModeTask').then((module) => module.default),
        active: false,
        enabled: true,
        restartable: false,
        options: {
            icon: 'mdi-playlist-edit',
            title: 'editingmode.Attributes editing mode',
            storedData: false,
            specifiedToolbar: GwtkComponentPanel.RIGHT_BAR
        }
    };

    mapWindow.getTaskManager().registerTask(taskDescription);
}
