import {GwtkComponentPanel} from '~/MapWindow';
import AppWindow from '../../AppWindow';

export function GwtkProjects(mapWindow: AppWindow) {

    //регистрация задачи
    const taskDescription = {
        id: 'gwtkprojects.main',
        getConstructor: () => import('./task/GwtkProjectsTask').then((module) => module.default),
        active: false,
        enabled: true,
        options: {
            icon: 'mdi-map-outline',
            title: 'projects.Projects',
            specifiedToolbar: GwtkComponentPanel.RIGHT_BAR
        }
    };

    mapWindow.getTaskManager().registerTask(taskDescription);
}
