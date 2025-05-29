/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Обертка карты для VueJS                       *
 *                                                                  *
 *******************************************************************/

import Vue from 'vue';
import {GwtkOptions} from '~/types/Options';
import {VueMapWindow} from '@/.';
import GwtkTaskContainer from '@/components/System/AppContainers/GwtkTaskContainer/GwtkTaskContainer';
import GwtkToolbar from '@/components/System/AppContainers/GwtkToolbar/GwtkToolbar';
import GwtkInfoDialog from '@/components/System/GwtkInfoDialog/GwtkInfoDialog';
import GwtkBottomNavigation from '@/components/System/AppContainers/GwtkBottomNavigation/GwtkBottomNavigation';
import GwtkLeftToolbar from '@/components/System/AppContainers/GwtkLeftToolbar/GwtkLeftToolbar';
import GwtkRightBar from '@/components/System/AppContainers/GwtkRightBar/GwtkRightBar';
import GwtkMapWindowFullScreen from '@/components/System/AppContainers/GwtkMapWindowFullScreen/GwtkMapWindowFullScreen';
import GwtkMapOverlay from '@/components/System/GwtkMapOverlay/GwtkMapOverlay';
import GwtkFooterPanel from '@/components/System/AppContainers/GwtkFooterPanel/GwtkFooterPanel';
import i18n from '@/plugins/i18n';
import vuetify from '@/plugins/vuetify';
import GwtkWindow from '@/components/System/AppContainers/GwtkWindow/GwtkWindow';
import GwtkInputTextDialog from '@/components/System/GwtkInputTextDialog/GwtkInputTextDialog';
import GwtkMapSnackBar from '@/components/System/GwtkMapSnackBar/GwtkMapSnackBar';
import GwtkTopPanel from '@/components/System/AppContainers/GwtkTopPanel/GwtkTopPanel';
import GwtkMap3dTaskContainer from '@/components/System/AppContainers/GwtkMap3dTaskContainer/GwtkMap3dTaskContainer';
import App from './App.vue';
import GwtkTaskBottomContainer from '@/components/System/AppContainers/GwtkTaskBottomContainer/GwtkTaskBottomContainer';


/**
 * Обертка карты для VueJS
 * @class MapVue
 */
export default class MapVue extends VueMapWindow {

    constructor(htmlElementId: string, options: GwtkOptions) {
        super(htmlElementId, options);
    }

    protected createMainContainer(htmlElementId:string): Vue {

        const vueContainer = new Vue({
            i18n,
            vuetify,
            render: h => h(App, {props: {mapVue: this}})
        }).$mount(`#${htmlElementId}`);

        return vueContainer.$children[0];
    }

    getBottomNavigationBarPanel(): GwtkBottomNavigation {
        return this.mainContainer.$refs.bottomNavigation as GwtkBottomNavigation;
    }

    getFooterPanel(): GwtkFooterPanel {
        return this.mainContainer.$refs.gwtkfooterpanel as GwtkFooterPanel;
    }

    getMap3dPanel(): GwtkMap3dTaskContainer {
        return this.mainContainer.$refs.map3dPanel as GwtkMap3dTaskContainer;
    }

    getInfoDialog(): GwtkInfoDialog {
        return this.mainContainer.$refs.info as GwtkInfoDialog;
    }

    getInputTextDialog(): GwtkInputTextDialog {
        return this.mainContainer.$refs.inputText as GwtkInputTextDialog;
    }

    getLeftToolbarPanel(): GwtkLeftToolbar {
        return this.mainContainer.$refs.leftToolbar as GwtkLeftToolbar;
    }

    getMapOverlay(): GwtkMapOverlay {
        return this.mainContainer.$refs.overlay as GwtkMapOverlay;
    }

    getMapWindowFullScreen(): GwtkMapWindowFullScreen {
        return this.mainContainer.$refs.fullScreenPanel as GwtkMapWindowFullScreen;
    }

    getRightBarPanel(): GwtkRightBar {
        return this.mainContainer.$refs.rightBarPanel as GwtkRightBar;
    }

    getMobileTopPanel(): GwtkTopPanel {
        return this.mainContainer.$refs.topPanel as GwtkTopPanel;
    }

    getSnackBarManager(): GwtkMapSnackBar {
        return this.mainContainer.$refs.snackbar as unknown as GwtkMapSnackBar;
    }

    getToolPanel(): GwtkTaskContainer {
        return this.mainContainer.$refs.sidebar as GwtkTaskContainer;
    }

    getBottomPanel(): GwtkTaskBottomContainer {
        return this.mainContainer.$refs.bottomPanel as GwtkTaskBottomContainer;
    }

    getToolbarPanel(): GwtkToolbar {
        return this.mainContainer.$refs.toolbar as GwtkToolbar;
    }

    getWindow(): GwtkWindow {
        return this.mainContainer.$refs.windowPanel as GwtkWindow;
    }

}
