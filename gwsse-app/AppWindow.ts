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

import {LogEventType, SimpleJson} from '~/types/CommonTypes';
import {GwtkOptions, ToolbarGroupsOptions} from '~/types/Options';
import {GwtkMap} from '~/types/Types';
import {TranslateDescription} from '~/translate/Types';
import IndexedDBUserDataService from '~/utils/IndexedDBUserDataService';
import {loadFromUrl, mapCreateUserControl} from '~/api/MapApi';
import RequestServices, {ServiceType} from '~/services/RequestServices';
import App from './App.vue';
import GISWebServerSEService from './service/GISWebServerSEService';
import {GwtkProjects} from './components/GwtkProjects';
import {GwtkAdminPanel} from './components/GwtkAdminPanel';
import {GwtkHelp} from './components/GwtkHelp';
import {GwtkGeoDB} from './components/GwtkGeoDB';
import {GwtkAuthComponent} from './components/GwtkAuthComponent';
import {GwtkInitialExtent} from './components/GwtkInitialExtent';
import {GwtkProjectBookmarks} from './components/GwtkProjectBookmarks';
import ruRu from './locale/ru-ru.json';
import enUs from './locale/en-us.json';
import i18n from '@/plugins/i18n';
import {VueMapWindow} from '@/index';
import GwtkBottomNavigation from '@/components/System/AppContainers/GwtkBottomNavigation/GwtkBottomNavigation';
import GwtkFooterPanel from '@/components/System/AppContainers/GwtkFooterPanel/GwtkFooterPanel';
import GwtkMap3dTaskContainer from '@/components/System/AppContainers/GwtkMap3dTaskContainer/GwtkMap3dTaskContainer';
import GwtkInfoDialog from '@/components/System/GwtkInfoDialog/GwtkInfoDialog';
import GwtkInputTextDialog from '@/components/System/GwtkInputTextDialog/GwtkInputTextDialog';
import GwtkLeftToolbar from '@/components/System/AppContainers/GwtkLeftToolbar/GwtkLeftToolbar';
import GwtkMapOverlay from '@/components/System/GwtkMapOverlay/GwtkMapOverlay';
import GwtkMapWindowFullScreen from '@/components/System/AppContainers/GwtkMapWindowFullScreen/GwtkMapWindowFullScreen';
import GwtkRightBar from '@/components/System/AppContainers/GwtkRightBar/GwtkRightBar';
import GwtkTopPanel from '@/components/System/AppContainers/GwtkTopPanel/GwtkTopPanel';
import GwtkMapSnackBar from '@/components/System/GwtkMapSnackBar/GwtkMapSnackBar';
import GwtkTaskContainer from '@/components/System/AppContainers/GwtkTaskContainer/GwtkTaskContainer';
import GwtkToolbar from '@/components/System/AppContainers/GwtkToolbar/GwtkToolbar';
import GwtkWindow from '@/components/System/AppContainers/GwtkWindow/GwtkWindow';
import Vue from 'vue';
import vuetify from '@/plugins/vuetify';
import GISWebServerDBService from './service/GISWebServerDBService';
import {CommonAppParams} from './Types';
import GISWebServerDBUserDataService from './service/GISWebServerDBUserDataService';
import {EXPORT_REPORT_COMPONENT, GwtkExportReport} from './components/GwtkExportReport';
import GwtkTaskBottomContainer from '@/components/System/AppContainers/GwtkTaskBottomContainer/GwtkTaskBottomContainer';
import { GwtkMapContentGwsse } from './components/GwtkMapContent';
import { GwtkMapLegendGwsse } from './components/GwtkMapLegend';
import { ComponentNames as ComponentNamesSuper  } from '@/components/VueMapWindow';
import {UserStorageService} from '~/utils/WorkspaceManager';


i18n.mergeLocaleMessage('ru-ru', ruRu);
i18n.mergeLocaleMessage('en-us', enUs);

export type Project = {
    id: number;
    text: string;
    description: string;
    // project: boolean;
    // img: string;
    image: {
        'name': string;
        'content': string;
        'type': string;
    };
    usercontrols: { name: string; file?: string; }[];
    userplugins?: { title: string; name: string; path: string; cssPath: string; }[];
    usertriggers?: { title: string; name: string; path: string; }[];
    // eventPanelId: string;
    // gallery: boolean;
    // ndcommand: boolean;
    // ndact: string;
    // ndClass: string;
    // srcimg: string;
};

export type ProjectsList = {
    index: number;
    projects?: Project[]
};

declare global {
    interface Window {
        projectsList?: ProjectsList;
        loadUserComponent: (path: string) => Promise<any>;
    }
}


const ComponentNames: SimpleJson = {
    exportReport: 'GwtkExportReport',  
    ...ComponentNamesSuper
};

/**
 * Обертка карты для VueJS
 * @class AppWindow
 */
export default class AppWindow extends VueMapWindow {

    protected mainContainer!: Vue;

    protected initMapHandlers?: ((map: GwtkMap) => void)[];

    private timerId?: number;

    constructor(htmlElementId: string, options: GwtkOptions, readonly appParams: CommonAppParams, readonly projectsList: ProjectsList) {
        super(htmlElementId, options, appParams);
    }

    protected createMainContainer(htmlElementId: string, appParams: CommonAppParams): Vue {

        const vueContainer = new Vue({
            i18n,
            vuetify,
            data: () => appParams,
            render: h => h(App, {props: {mapVue: this, appParams}})
        }).$mount(`#${htmlElementId}`);

        return vueContainer.$children[0];
    }

    protected async init(options: GwtkOptions, projectionList?: SimpleJson<TranslateDescription>): Promise<void> {

        const currentOptions = options;
        loadFromUrl(currentOptions);

        const userName = currentOptions.username || 'ANONYMOUS';

        const storageService = userName.toUpperCase() !== 'ANONYMOUS' ? new GISWebServerDBService(userName, currentOptions.id) : undefined;
        const userStorageService = userName.toUpperCase() !== 'ANONYMOUS' ? new GISWebServerDBUserDataService(userName) : undefined;

        await super.init(options, projectionList, {storageService, userStorageService});

        await this.checkKey(options.url, options.servicepam);


        if (this.initMapHandlers) {
            this.initMapHandlers.forEach(handler => handler(this.map));
        }

        // чтобы успела поменяться тема
        window.setTimeout(() => AppWindow.closeLoadingScreen(), 250);
    }

    async startApp(options: GwtkOptions, projectionList?: SimpleJson<TranslateDescription>, userStorageService?: UserStorageService): Promise<void> {

        let projectId = options.id;

        loadFromUrl(options);

        userStorageService = userStorageService || (options.username.toUpperCase() !== 'ANONYMOUS' ? new GISWebServerDBUserDataService(options.username) : undefined);

        if (options.forcedParams && options.forcedParams.projectid) {
            projectId = options.forcedParams.projectid;
        } else {
            let activeProject;
            const userSettingsDB = userStorageService || new IndexedDBUserDataService(options.username || 'ANONYMOUS');
            try {
                activeProject = await userSettingsDB.getActiveProject();
            } catch (error) {
                // console.log(error);
            }
            await userSettingsDB.close();

            if (activeProject) {
                projectId = '' + activeProject.number;
            }

            const projectsList = this.projectsList;
            if (projectsList && projectsList.projects && !projectsList.projects.find(project => project.id + '' === projectId + '')) {
                projectId = '' + projectsList.projects[projectsList.index].id;
            }
        }

        if (projectId != options.id) {
            const requestService = new GISWebServerSEService();
            const result = await requestService.getProjectDescription({cmd: 'projparams', projid: projectId});
            if (result && result.data) {
                options = result.data.options;
                projectionList = options.layerprojection;
            } else {
                console.log(this.i18n.t('phrases.Failed to get data') + ' ' + this.i18n.t('phrases.Project') + ' ID= ' + projectId);
                const message = this.i18n.t('phrases.Map creation error') + '!';
                //throw new Error( message );
                console.log(message);
                alert(message);
                return;
            }
        }

        return super.startApp(options, projectionList, userStorageService);
    }

    initComponents(controls: GwtkOptions['controls']) {

        if (controls.includes('*') || controls.includes('initialextent')) {
            ComponentNames['initialextent'] = 'initialextent';
            this.componentFunctionList['initialextent'] = GwtkInitialExtent;
        }

        if (controls.includes('*') || controls.includes('projectbookmarks')) {
            ComponentNames['projectbookmarks'] = 'projectbookmarks';
            this.componentFunctionList['projectbookmarks'] = GwtkProjectBookmarks;
        }

        if (controls.includes('*') || controls.includes('help')) {
            ComponentNames['help'] = 'help';
            this.componentFunctionList['help'] = GwtkHelp;
        }

        if (controls.includes('*') || controls.includes('exportReport')) {
            ComponentNames['exportReport'] = 'gwtkexportreport';
            this.componentFunctionList['gwtkexportreport'] = GwtkExportReport;
        }

        if (this.projectsList && this.projectsList.projects && (!this.map.options.controlsdata?.projects?.hideIfSingle || this.projectsList.projects.length > 1) && (controls.includes('*') || controls.includes('projects'))) {
            GwtkProjects(this);
        }

        if (this.appParams.geoDB.title) {
            GwtkGeoDB(this);
        }

        if (this.appParams.isAdmin) {
            GwtkAdminPanel(this);
        }

        if(!this.appParams.hideAuth) {
            GwtkAuthComponent(this);
        }

        const controlsList: string[] = [];

        if (controls[0] === '*') {
            const names = Object.values(ComponentNames);
            for (const name of names) {
                if (!controlsList.includes(name)) {
                    controlsList.push(name);
                }
            }
        } else {
            for (const key of controls) {

                switch (key) {
                    case 'scaleupdown':
                        controlsList.push('GwtkZoomIn');
                        controlsList.push('GwtkZoomOut');
                        break;
                    case 'scalebyrect':
                        controlsList.push('GwtkFrameScalingIn');
                        controlsList.push('GwtkFrameScalingOut');
                        break;
                    default:
                        if (ComponentNames[key]) {
                            const name = ComponentNames[key];
                            if (!controlsList.includes(name)) {
                                controlsList.push(name);
                            }
                        }
                }
            }
        }

        if (!controlsList.includes('GwtkMapObjectTooltip')) {
            controlsList.push('GwtkMapObjectTooltip');
        }

        if (!controlsList.includes('GwtkMapLegend')) {
            controlsList.push('GwtkMapLegend');
        }

        if (!controlsList.includes('GwtkDocumentViewer')) {
            controlsList.push('GwtkDocumentViewer');
        }

        if (!controlsList.includes('GwtkClearSelect')) {
            controlsList.push('GwtkClearSelect');
        }

        for (let i = 0; i < controlsList.length; i++) {
            const name = controlsList[i];
            if (name in this.componentFunctionList) {
                this.componentFunctionList[name](this);
                if (name === 'GwtkMapContent') {
                    GwtkMapContentGwsse(this);
                } else if (name === 'GwtkMapLegend') {
                    GwtkMapLegendGwsse(this);
                }
            }
        }

        this.getMap().initOldComponents();   //TODO: to be deleted
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


    async loadPlugins() {

        const project = this.projectsList.projects?.find(project => project.id == + this.map.options.id);

        if (project) {

            const uc = project.usercontrols;

            if (uc.length > 0) {
                if (this.getScriptsOfUserControls(uc, '' + project.id, this.getMap()) === 0) {
                    AppWindow.mapAttachUserControls(this.getMap(), uc, true);
                }
            }

            const service = new GISWebServerSEService();

            const userTriggerList = project.usertriggers || [];
            for (let i = 0; i < userTriggerList.length; i++) {
                const {path} = userTriggerList[i];
                await service.loadModule(path).then((module) => {
                    new module[Reflect.ownKeys(module)[0]](this);
                }).catch(error => {
                    console.log(error);
                });
            }


            const userPluginList = project.userplugins || [];
            for (let i = 0; i < userPluginList.length; i++) {
                let {path, cssPath} = userPluginList[i];
                if (cssPath) {
                    await service.loadModuleCss(cssPath).catch(error => {
                        console.log(error);
                    });
                }

                await service.loadModule(path).then((module) => {
                    ComponentNames[userPluginList[i].name] = userPluginList[i].name;
                    this.componentFunctionList[userPluginList[i].name] = module[Reflect.ownKeys(module)[0]];
                }).catch(error => {
                    console.log(error);
                });
            }
        }
    }

    /**
     * Загрузить скрипты пользовательских элементов управления.
     * Если аргумент map определен,  * плагины подключаются к карте.
     * Иначе генерится событие 'pluginloaded', объект события содержит
     * идентификатор проекта prjid.
     * @method getScriptsOfUserControls
     * @param  {Array} plugins - список описаний плагинов проекта
     * @param  {String} projid - идентификатор проекта, чей список
     * @param  {Object} map - ссылка на карту.
     */
    getScriptsOfUserControls(plugins: { name: string; file?: string; }[], projid: string, map: GwtkMap) {

        if (plugins == undefined || !Array.isArray(plugins)) {
            return 0;
        }

        let i, len, count = 0, errcount = 0, totalRequests = plugins.length;

        for (i = 0; len = plugins.length, i < len; i++) {
            //@ts-ignore
            if (typeof GWTK[plugins[i].name] !== 'undefined') {
                count++;
                totalRequests--;
                continue;
            }
            if (!plugins[i].file) {
                errcount++;
                totalRequests--;
                continue;
            }

            const url = new GISWebServerSEService().getDefaults().url + 'plugins/' + plugins[i].file;
            fetch(url).then(() => {
                count++;
            }).catch(() => {
                errcount++;
                console.log('getScriptsOfUserControls. ' + 'Failed to get data' + ' ' + url);
            }).finally(() => {
                if (count + errcount >= plugins.length) {
                    AppWindow.mapAttachUserControls(map, plugins, true);
                }
            });
        }

        return totalRequests;
    }

    onInitMap(handler: (map: GwtkMap) => void) {
        if (!this.initMapHandlers) {
            this.initMapHandlers = [];
        }
        this.initMapHandlers.push(handler);
    }

    offInitMap(handler: (map: GwtkMap) => void) {
        if (this.initMapHandlers) {
            this.initMapHandlers.splice(this.initMapHandlers.indexOf(handler), 1);
        }
    }

    async initMapOptions(options: GwtkOptions) {
        const userStorageService = options.username.toUpperCase() !== 'ANONYMOUS' ? new GISWebServerDBUserDataService(options.username) : undefined;
        return super.startApp(options, options.layerprojection, userStorageService);
    }

    /**
     * Проверить наличие ключа на сервисе GIS WebService SE
     * @method checkKey
     * @param  url {string}  url сервиса
     * @param  pam {boolean} необходимость авторизации на сервисе
     *
     */
    protected async checkKey(url: string, pam = false) {

        if (this.timerId !== undefined) {
            window.clearTimeout(this.timerId);
            this.timerId = undefined;
        }

        const options = this.getMap().options;

        const params = RequestServices.createHttpParams(this.getMap(), {url});
        const service = RequestServices.retrieveOrCreate(params, ServiceType.REST);

        let request;

        if (options.usetoken) {
            let token;
            try {
                const result = await new GISWebServerSEService({url}).getTokenParams({param: 'token'});
                token = (result.data && result.data !== 'false') ? result.data : undefined;
            } catch (e) {
                console.log(e);
            }
            request = service.checkKey({Program: 'GWSSE'}, {headers: {'AUTHORIZATION-TOKEN': token}});

        } else if (options.extauth && options.authkey && url.indexOf(window.location.origin) == -1) {
            request = new GISWebServerSEService({url}).checkLicense();
        } else {
            const service = RequestServices.retrieveOrCreate(params, ServiceType.REST);
            request = service.checkKey({Program: 'GWSSE'});
        }


        request.then((response) => {
            if (!response.data || parseInt(response.data) !== 1) {
                this.getMap().writeProtocolMessage({
                    type: LogEventType.Error,
                    text: this.i18n.tc('gwsse.Hard key check ERROR') + '!',
                    description: this.i18n.tc('gwsse.Hard key not found')
                });
                return;
            }
            this.appParams.keyFlag = true;
        })
            .catch((e) => {
                this.getMap().writeProtocolMessage({
                    type: LogEventType.Error,
                    text: this.i18n.tc('gwsse.Hard key check ERROR') + '!',
                    description: e
                });
                this.appParams.keyFlag = false;

                this.timerId = window.setTimeout(() => {
                    this.checkKey(url, pam);
                }, 20000);
            });
    }


    async openExportReport(): Promise<boolean> {
        const created = await this.getTaskManager().createTask(EXPORT_REPORT_COMPONENT);
        if (created) {
            return true;
        }
        const taskDescription = this.getTaskManager().getTaskDescription(EXPORT_REPORT_COMPONENT);
        return taskDescription && taskDescription.active;
    }

    closeExportReport(): true | undefined {
        const taskDescription = this.getTaskManager().getTaskDescription(EXPORT_REPORT_COMPONENT);
        if (!taskDescription) {
            return;
        }

        if (taskDescription.active) {
            return this.getTaskManager().detachTask(EXPORT_REPORT_COMPONENT);
        }
    }

    /**
     * Подключить пользовательские элементы управления
     * @param map {Object} ссылка на карту
     * @param plugins {Array} список элементов управления, массив элементов типа GWTK.UserControlType
     * @param apply {boolean} признак инициализации, `true` - выполнить инициализацию после создания
     */
    static mapAttachUserControls(map: GwtkMap, plugins: (undefined | { name: string; options?: string | {}; alias?: string; })[], apply: boolean) {
        if (!map) return;

        if (!Array.isArray(plugins) || plugins.length == 0) {
            return;
        }
        let i, len;
        for (i = 0; len = plugins.length, i < len; i++) {
            const control = plugins[i];
            if (control === undefined || control.options === undefined || !control.name) {
                let message = '';
                if (control && control.alias) {
                    message = control.alias;
                }
                console.log('GWTK.mapAttachUserControls. ' + message + ' ' + 'Component not plugged.');
                continue;
            }
            if (!control.alias) {
                control.alias = '';
            }
            let proto;
            if (typeof control.options === 'string') {
                //@ts-ignore
                proto = window[control.options] || GWTK[control.options];
                if (!proto) {
                    console.log('GWTK.mapAttachUserControls. ' + control.alias + ' ' + 'Not defined a required parameter' + ' options.');
                    continue;
                }
            } else
                proto = control.options;


            mapCreateUserControl(control.name, map, {...proto, title: control.alias || proto.title}, apply);

        }

        return;
    }

    protected getComponentGroups(toolbarGroups?: ToolbarGroupsOptions) {
        const componentGroups = [];

        if (toolbarGroups) {
            if (toolbarGroups.length > 0) {
                for (let i = 0; i < toolbarGroups.length; i++) {
                    const groupItems = toolbarGroups[i].items;
                    const groupComponentNames: string[] = [];
                    for (let j = 0; j < groupItems.length; j++) {
                        const functionName = ComponentNames[groupItems[j]];
                        if (functionName) {
                            const componentName = (ComponentNames[groupItems[j]] + '.main').toLowerCase();
                            if (!groupComponentNames.includes(componentName)) {
                                groupComponentNames.push(componentName);
                            }
                        }
                    }
                    componentGroups.push(groupComponentNames);
                }
            }
        }

        return componentGroups;
    }

    static closeLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            document.body.removeChild(loadingScreen);
        }
    }
}
