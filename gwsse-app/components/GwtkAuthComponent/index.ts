import {GwtkComponentPanel} from '~/MapWindow';
import {CommonAppWindow} from '../../Types';

export function GwtkAuthComponent(mapWindow: CommonAppWindow) {

    const params = mapWindow.appParams;

    // const authType = params.authType;

    let enterButtonTitle = 'gwsse.Enter';
    if (params.loggedInFlag) {
        enterButtonTitle = 'gwsse.Exit';
    }
    // else {
    //     if (authType === 0) {
    //         enterButtonTitle = 'gwsse.Simple';
    //     } else if (authType === 1) {
    //         enterButtonTitle = 'gwsse.System';
    //     } else if (authType === 2) {
    //         enterButtonTitle = 'gwsse.Domain';
    //     } else if (authType === 3) {
    //         enterButtonTitle = 'gwsse.Enter GIS WebService SE';
    //     } else if (authType === 4) {
    //         enterButtonTitle = 'gwsse.Enter ESIA';
    //     } else if (authType === 5) {
    //         enterButtonTitle = 'gwsse.Enter by form';
    //     }
    // }


    //регистрация задачи
    const taskDescription = {
        getConstructor: () => import('./task/GwtkAuthComponentTask').then((module) => module.default),
        id: 'gwtkauthcomponent.main',
        active: false,
        enabled: true,
        options: {
            icon: params.loggedInFlag ? 'mdi-logout' : 'mdi-login',
            title: enterButtonTitle,
            specifiedToolbar: GwtkComponentPanel.LEFT_TOOLBAR,
            helpPage: 'authorization'
        }
    };
    mapWindow.getTaskManager().registerTask(taskDescription);
}
