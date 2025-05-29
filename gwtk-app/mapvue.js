const { systemComponents, componentRegFunctions, App } = window.VueGWTK;

const GwtkComponentPanel = {
    TOOLBAR: 0,
    SIDEBAR: 1,
    BOTTOM_NAVIGATION_BAR: 2,
    LEFT_TOOLBAR: 3,
    RIGHT_BAR: 4,
    MAP_WINDOW_FULL_SCREEN: 5,
    FOOTER_PANEL: 6
}

const ComponentNames = {
    content: 'GwtkMapContent',
    search: 'GwtkSearch',
    routecontrol: 'GwtkMapRoute',
    maplink: 'GwtkShare',
    searchSem: 'GwtkSearchBySemantics',
    areasearch: 'GwtkSearchArea',
    selectobjects: 'GwtkManualObjectHighlight',
    mapscale: 'GwtkMapScaleViewer',
    rightholder: 'GwtkCopyRight',
    transitiontopoint: 'GwtkMovingToPoint',
    mapeditor: 'GwtkMapEditor',
    ruler: 'GwtkMeasurements',
    polygonarea: 'GwtkMeasurements',
    anglemeter: 'GwtkMeasurements',
    builderofzone: 'GwtkBuilderOfZone',
    viewoptions: 'GwtkMapOptions',
    geolocation: 'GwtkGeolocation',
    map2img: 'GwtkPrintMap',
    objectPanel: 'GwtkMapObject',
    //---------------------------------
    legend: 'GwtkMapLegend',
    zoomin: 'GwtkZoomIn',
    zoomout: 'GwtkZoomOut',
    mapLog: 'GwtkMapLog',
    profileRelief: 'GwtkReliefLineDiagram',
    matrixcontrol: 'GwtkMatrixControl',
    userthematic: 'GwtkUserThematic',
    mapcalculations: 'GwtkMapCalculations',
    yandexPanorama: 'GwtkYandexPanorama'
};


/**
 * Обертка карты для VueJS
 * @class MapVue
 */
class MapVue extends GWTK.MapWindow {
    /**
     * Vue компонент панели карты
     * @private
     * @readonly
     * @property toolPanel {GwtkCommonContainer}
     */
    toolPanel;
    /**
     * Vue компонент панели карты масштаб и координаты карты
     * @private
     * @readonly
     * @property toolPanel {GwtkCommonContainer}
     */
    footerPanel;

    /**
     * Vue компонент панели активаторов компонентов
     * @private
     * @readonly
     * @property toolbarPanel {GwtkCommonContainer}
     */
    toolbarPanel;
    /**
     * Vue компонент дополнительной панели активаторов компонентов
     * @private
     * @readonly
     * @property leftToolbar {GwtkCommonContainer}
     */
    leftToolbar;
    /**
     * Vue компонент всплывающих сообщений
     * @private
     * @readonly
     * @property gwtkSnackBar {SnackBarManager}
     */
    gwtkSnackBar;
    /**
     * Vue компонент Ожидания
     * @private
     * @readonly
     * @property mapOverlay  {GwtkMapOverlay}
     */
    mapOverlay;

    bottomNavigationBar;

    /**
     * Vue компонент информации
     * @private
     * @readonly
     * @property infoDialog {GwtkInfoDialog}
     */
    infoDialog;

    /**
     * Vue компонент ввода текста
     * @private
     * @readonly
     * @property inputTextDialog {GwtkInputTextDialog}
     */
    inputTextDialog;

    /**
     * Vue компонент для увеличения и уменьшения изображения
     * @private
     * @readonly
     * @property rightBarPanel {GwtkCommonContainer}
     */
    rightBarPanel;

    /**
     * Vue компонент для сохранения/отмены редактирования объекта в мобильной версии
     * @private
     * @readonly
     * @property topPanel {BaseGwtkVueComponent}
     */
    topPanel;

    /**
     * Vue компонент для полноэкранного отображения компонентов
     * @private
     * @readonly
     * @property fullScreenPanel {GwtkCommonContainer}
     */
    fullScreenPanel;

    /**
     * Список функций создания компонентов
     * @private
     * @readonly
     * @property componentFunctionList {SimpleJson<RegistrationFunction>}
     */

    // componentFunctionList;

    /**
     * @constructor
     * @param divId {string} Идентификатор контейнера для карты
     * @param options {GwtkOptions} Параметры карты
     */
    constructor(divId, options) {
        super(divId, options);
        // ссылка на панель инструментов
        this.toolPanel = this.mainContainer.$children[0].$refs.sidebar;
        // ссылка на панель масштаба и карты
        this.footerPanel = this.mainContainer.$children[0].$refs.gwtkfooterpanel;
        // ссылка на панель активаторов
        this.toolbarPanel = this.mainContainer.$children[0].$refs.toolbar;
        this.leftToolbar = this.mainContainer.$children[0].$refs.leftToolbar;
        this.bottomNavigationBar = this.mainContainer.$children[0].$refs.bottomNavigation;
        this.rightBarPanel = this.mainContainer.$children[0].$refs.rightBarPanel;
        // ссылка на компонент всплывающих сообщений
        this.gwtkSnackBar = this.mainContainer.$children[0].$refs.footer;
        // ссылка на панель
        this.infoDialog = this.mainContainer.$children[0].$refs.info;
        // ссылка на панель
        this.inputTextDialog = this.mainContainer.$children[0].$refs.inputText;
        // ссылка на панель
        this.mapOverlay = this.mainContainer.$children[0].$refs.overlay;
        // ссылка на полноэкранный панель
        this.fullScreenPanel = this.mainContainer.$children[0].$refs.fullScreenPanel;

    }

    onMapCreated() {

        this.callbacks.push(() => {
            // компоненты карты
            this.resetComponents();
            this.initComponents(this.map.options);
        });

        super.onMapCreated();
    }

    /**
     * Инициализировать компоненты
     * @protected
     * @method setComponents
     * @param options {GwtkOptions} Параметры приложения
     */
    initComponents(options) {

        const controlsList = [];

        if (options.controls[0] === '*') {
            const names = Object.values(ComponentNames);
            for (const name of names) {
                if (!controlsList.includes(name)) {
                    controlsList.push(name);
                }
            }
        }else{
            for (const key in ComponentNames) {
                if (options.controls.includes(key)) {
                    const name = ComponentNames[key];
                    if (!controlsList.includes(name)) {
                        controlsList.push(name);
                    }
                }
            }
            if (options.controls.includes('scaleupdown')) {
                controlsList.push('GwtkZoomIn');
                controlsList.push('GwtkZoomOut');
            }
            controlsList.push(ComponentNames['legend']);
            controlsList.push(ComponentNames['mapLog']);
        }

        for (let i = 0; i < controlsList.length; i++) {
            const name = controlsList[i];
            if (name in this.componentFunctionList) {
                this.componentFunctionList[name](this);
            }
        }

        this.getMap().initOldComponents();   //TODO: to be deleted
    }


    /**
     * Создать главный контейнер для карты
     * @method createMainContainer
     * @param divId {string} Идентификатор HTML контейнера приложения
     * @param options {GwtkOptions} Параметры приложения
     */
    createMainContainer(divId, options) {
        //Регистрируем компоненты
        // Vue.use(this);
        this.install(Vue);

        return new Vue({
            provide: () => ({
                mapVue: this
            }),
            render: h => h(App.default, { props: { mapDivId: this.mapDivId, options } })
        }).$mount(`#${divId}`);
    }

    /**
     * Сброс состояния компонентов
     * @method resetComponents
     */
    resetComponents() {
        this.toolbarPanel?.removeAllComponents();
        this.leftToolbar?.removeAllComponents();
        this.bottomNavigationBar?.removeAllComponents();
        this.rightBarPanel?.removeAllComponents();
    }

    /**
     * Зарегистрировать компонент
     * @method registerComponent
     * @param name {string} Название компонента
     * @param source {object} Источник компонента
     */
    registerComponent(name, source) {
        // регистрация во Vue
        Vue.component(name, source);
    }

    /**
     * Создать элемент тулбара
     * @method createToolbarItem
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     * @param [specifiedToolbar] {GwtkComponentPanel} Панель для кнопки
     */
    createToolbarItem(propsData, specifiedToolbar) {
        if (specifiedToolbar !== undefined) {
            this.createComponent(specifiedToolbar, 'GwtkToolbarItem', propsData);
        }else{
            // добавление в контейнер
            this.createComponent(GwtkComponentPanel.TOOLBAR, 'GwtkToolbarItem', propsData);
            if (propsData.description.options === undefined || (propsData.description.options && propsData.description.options.className !== 'not-bottom')) {
                this.createComponent(GwtkComponentPanel.BOTTOM_NAVIGATION_BAR, 'GwtkBottomNavigationItem', propsData);
            }
        }
    }

    /**
     * Создать виджет
     * @method createWidget
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createWidget(name, propsData) {
        // добавление в контейнер
        this.createComponent(GwtkComponentPanel.SIDEBAR, name, propsData);
    }

    /**
     * Создать полноэкранный виджет
     * @method createFullScreenWidget
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createFullScreenWidget(name, propsData) {
        // добавление в контейнер
        this.createComponent(GwtkComponentPanel.MAP_WINDOW_FULL_SCREEN, name, propsData);
    }

    /**
     * Создать панель масштаба и координат
     * @method createFooterWidget
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createFooterWidget(name, propsData) {
        // добавление в контейнер
        this.createComponent(GwtkComponentPanel.FOOTER_PANEL, name, propsData);
    }

    /**
     * Удалить элемент
     * @method deleteItem
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    deleteItem(propsData) {
        // удаление из контейнера
        this.deleteComponent(GwtkComponentPanel.TOOLBAR, propsData);
        this.deleteComponent(GwtkComponentPanel.LEFT_TOOLBAR, propsData);
        this.deleteComponent(GwtkComponentPanel.BOTTOM_NAVIGATION_BAR, propsData);
        this.deleteComponent(GwtkComponentPanel.RIGHT_BAR, propsData);
        this.deleteComponent(GwtkComponentPanel.SIDEBAR, propsData);
        this.deleteComponent(GwtkComponentPanel.MAP_WINDOW_FULL_SCREEN, propsData);
        this.deleteComponent(GwtkComponentPanel.FOOTER_PANEL, propsData);

        window.setTimeout(() => (this.fullScreenPanel).sidebarIsActive = (this.toolPanel).value, 300);
    }

    /**
     * Отобразить элемент
     * @method showItem
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    showItem(propsData) {
        this.showComponent(GwtkComponentPanel.TOOLBAR, propsData);
        this.showComponent(GwtkComponentPanel.LEFT_TOOLBAR, propsData);
        this.showComponent(GwtkComponentPanel.BOTTOM_NAVIGATION_BAR, propsData);
        this.showComponent(GwtkComponentPanel.RIGHT_BAR, propsData);
        this.showComponent(GwtkComponentPanel.SIDEBAR, propsData);
        this.showComponent(GwtkComponentPanel.MAP_WINDOW_FULL_SCREEN, propsData);
    }


    /**
     * Получить контейнер
     * @method getContainer
     * @param destination {GwtkComponentPanel} Название контейнера
     * @return {GwtkCommonContainer|undefined} Контейнер
     */
    getContainer(destination) {
        let container;
        switch (destination) {
            case GwtkComponentPanel.TOOLBAR:
                container = this.toolbarPanel;
                break;
            case GwtkComponentPanel.LEFT_TOOLBAR:
                container = this.leftToolbar;
                break;
            case GwtkComponentPanel.MAP_WINDOW_FULL_SCREEN:
                container = this.fullScreenPanel;
                break;
            case GwtkComponentPanel.BOTTOM_NAVIGATION_BAR:
                container = this.bottomNavigationBar;
                break;
            case GwtkComponentPanel.RIGHT_BAR:
                container = this.rightBarPanel;
                break;
            case GwtkComponentPanel.FOOTER_PANEL:
                container = this.footerPanel;
                break;
            case GwtkComponentPanel.SIDEBAR:
            default:
                container = this.toolPanel;
                break;
        }
        return container;
    }

    /**
     * Создать компонент
     * @method createComponent
     * @param destination {GwtkComponentPanel} Контейнер для компонента
     * @param name {string} Название компонента
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    createComponent(destination, name, propsData) {
        // добавление в контейнер
        this.getContainer(destination).addComponent(name, propsData);
        (this.fullScreenPanel).sidebarIsActive = (this.toolPanel).value;
    }

    /**
     * Удалить компонент
     * @method deleteComponent
     * @param destination {GwtkComponentPanel} Контейнер для компонента
     * @param description {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    deleteComponent(destination, description) {
        // добавление в контейнер
        this.getContainer(destination).removeComponent(description);
    }

    /**
     * Отобразить компонент
     * @method showComponent
     * @param destination {GwtkComponentPanel} Контейнер компонента
     * @param description {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    showComponent(destination, description) {
        // добавление в контейнер
        this.getContainer(destination).showComponent(description);
    }

    /**
     * Отобразить окно информации
     * @method showInfo
     * @param infoParams {InfoDialogProps} Параметры окна
     */
    showInfo(infoParams) {
        this.infoDialog.setInfoParams(infoParams);
    }

    /**
     * Отобразить окно информации
     * @method showInfo
     * @param infoParams {InputTextDialogProps} Параметры окна
     */
    showInputText(inputTextDialogParams) {
        this.inputTextDialog.setInputTextDialogParams(inputTextDialogParams);
    }

    /**
     * Отобразить окно ожидания
     * @method showOverlay
     * @param overlayParams {MapOverlayProps} Параметры окна
     */
    showOverlay(overlayParams) {
        this.mapOverlay.setOverlayParams(overlayParams);
    }

    /**
     * Удалить окно ожидания
     * @method showOverlay
     */
    removeOverlay() {
        this.mapOverlay.closeOverlay();
    }

     /**
     * Отобразить панель Сохранения объекта
     * @method showSaveObjectPanel
     * @param params {SaveObjectPanelProps} Параметры окна
     */
    showSaveObjectPanel(params) {
        this.topPanel.setParams(params);
    }


    /**
     * Добавить всплывающее сообщение
     * @method addSnackBarMessage
     * @param message {string} Текст сообщения
     */
    addSnackBarMessage(message) {
        this.gwtkSnackBar.addMessage(message);
    }

    /**
     * Регистрация компонентов в среде Vue
     * @method install
     * @param Vue {VueConstructor} Экземпляр Vue
     */
    install(Vue) {
        if (systemComponents) {
            for (const key in systemComponents) {
                const component = (systemComponents)[key];
                if (component) {
                    Vue.component(key, component);
                }
            }
        }

        if (componentRegFunctions) {
            if (!this.componentFunctionList) {
                this.componentFunctionList = {};
            }
            for (const key in componentRegFunctions) {
                const component = (componentRegFunctions)[key];
                if (component) {
                    this.componentFunctionList[key] = component;
                }
            }
        }
    }

}

GWTK.MapVue = MapVue;
