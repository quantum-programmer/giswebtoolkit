/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Абстрактный класс окна приложения                 *
 *                                                                  *
 *******************************************************************/

import { CURSOR_TYPE, GwtkComponentDescriptionPropsData, GwtkMap } from '~/types/Types';
import SVGrenderer from '~/renderer/SVGrenderer';
import TaskManager from '~/taskmanager/TaskManager';
import { LogEventType, SimpleJson } from '~/types/CommonTypes';
import { ActionModePanel } from '~/taskmanager/Action';
import { FontSize } from '~/utils/WorkspaceManager';

export enum GwtkComponentPanel {
    TOOLBAR,
    SIDEBAR,
    BOTTOM_NAVIGATION_BAR,
    LEFT_TOOLBAR,
    RIGHT_BAR,
    MAP_WINDOW_FULL_SCREEN,
    FOOTER_PANEL,
    WINDOW_PANEL,
    MAP3D_PANEL,
    BOTTOM_PANEL
}

export type MapOverlayProps = {
    handleClose?: () => void;
};

export type SaveObjectPanelProps = {
    visiblePanel: boolean;
    saveActive: boolean
    modePanel: ActionModePanel;
};

export type InfoDialogProps = {
    title?: string;
    message: string;
    handleClose?: () => void;
};

export type InputTextDialogProps = {
    title?: string;
    inputText?: string;
    description?: string;
    titleText?: string;
};

export type ButtonDescription = {
    id: string;
    active: boolean;
    enabled: boolean;
    options?: {
        className?: string;
        icon?: string;
        title?: string;
        theme?: string;
        label?: string;
        link?: { href: string; target?: string; }
    }
}

export type RegistrationFunction = ( mapVue: MapWindow ) => void;

export type ColorScheme = { primary?: string; secondary?: string; };

/**
 * Окно приложения
 * @abstract
 * @class MapWindow
 */
export default abstract class MapWindow {

    protected abstract map: GwtkMap;

    private taskManager!: TaskManager;

    abstract hideElements(): void;

    abstract showElements(): void;

    /**
     * Создать компонент
     * @method createComponent
     * @param destination {GwtkComponentPanel} Контейнер для компонента
     * @param name {string} Название компонента
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    protected abstract createComponent( destination: GwtkComponentPanel, name: string, propsData: GwtkComponentDescriptionPropsData ): void;

    /**
     * Отобразить компонент
     * @method showComponent
     * @param destination {GwtkComponentPanel} Контейнер компонента
     * @param description {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    protected abstract showComponent( destination: GwtkComponentPanel, description: GwtkComponentDescriptionPropsData ): void;

    /**
     * Удалить компонент
     * @method deleteComponent
     * @param destination {GwtkComponentPanel} Контейнер для компонента
     * @param description {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    protected abstract deleteComponent( destination: GwtkComponentPanel, description: GwtkComponentDescriptionPropsData ): void;

    /**
     * Отобразить окно информации
     * @method showInfo
     * @param infoParams {InfoDialogProps} Параметры окна
     */
    abstract showInfo( infoParams: InfoDialogProps ): void;

    /**
     * Отобразить окно ввода текста
     * @method showInputText
     * @param inputTextParams {InputTextDialogProps} Параметры окна
     */
    abstract showInputText( inputTextParams: InputTextDialogProps ): Promise<string>;

    /**
     * Отобразить окно ожидания
     * @method showOverlay
     * @param overlayParams {MapOverlayProps} Параметры окна
     */
    abstract showOverlay( overlayParams?: MapOverlayProps ): void;

    /**
     * Закрыть окно ожидания
     * @method removeOverlay
     */
    abstract removeOverlay(): void;

    /**
     * Отобразить панель Сохранения объекта
     * @method showSaveObjectPanel
     * @param modePanelDescription {ActionModePanel} Параметры окна
     */
    abstract showSaveObjectPanel( modePanelDescription?: SaveObjectPanelProps ): void;

    /**
     * Добавить всплывающее сообщение
     * @method addSnackBarMessage
     * @param message {string} Текст сообщения
     * @param [params] {object} Параметры сообщения
     */
    abstract addSnackBarMessage( message: string, params?:{timeout?: number;type?:LogEventType;} ) : void;

    abstract registerComponent( name: string, source: any ): void;

    /**
     * Создать элемент тулбара
     * @method createToolbarItem
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     * @param [specifiedToolbar] {GwtkComponentPanel} Панель для кнопки
     */
    createToolbarItem( propsData: GwtkComponentDescriptionPropsData, specifiedToolbar?: GwtkComponentPanel ) {
        if ( specifiedToolbar !== undefined ) {
            this.createComponent( specifiedToolbar, 'GwtkToolbarItem', propsData );
        } else {
            // добавление в контейнер
            this.createComponent( GwtkComponentPanel.TOOLBAR, 'GwtkToolbarItem', propsData );
            if ( propsData.description.options === undefined || (propsData.description.options && propsData.description.options.className !== 'not-bottom') ) {
                this.createComponent( GwtkComponentPanel.BOTTOM_NAVIGATION_BAR, 'GwtkBottomNavigationItem', propsData );
            }
        }
    }

    /**
     * Создать виджет
     * @method createWidget
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createWidget( name: string, propsData: GwtkComponentDescriptionPropsData & SimpleJson<any> ) {
        // добавление в контейнер
        this.createComponent( GwtkComponentPanel.SIDEBAR, name, propsData );
    }

    /**
     * Создать виджет для 3D
     * @method createMap3dPanel
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createMap3dPanel( name: string, propsData: GwtkComponentDescriptionPropsData & SimpleJson<any> ) {
        // добавление в контейнер
        this.createComponent( GwtkComponentPanel.MAP3D_PANEL, name, propsData );
    }

    /**
     * Создать полноэкранный виджет
     * @method createFullScreenWidget
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createFullScreenWidget( name: string, propsData: GwtkComponentDescriptionPropsData & SimpleJson<any> ) {
        // добавление в контейнер
        this.createComponent( GwtkComponentPanel.MAP_WINDOW_FULL_SCREEN, name, propsData );
    }

    /**
     * Создать оконный виджет
     * @method createWindowWidget
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createWindowWidget( name: string, propsData: GwtkComponentDescriptionPropsData & SimpleJson<any> ) {
        // добавление в контейнер
        this.createComponent( GwtkComponentPanel.WINDOW_PANEL, name, propsData );
    }

    /**
     * Создать виджет в нижней панели
     * @method createBottomWidget
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createBottomWidget( name: string, propsData: GwtkComponentDescriptionPropsData & SimpleJson<any> ) {
        // добавление в контейнер
        this.createComponent( GwtkComponentPanel.BOTTOM_PANEL, name, propsData );
    }

    /**
     * Создать панель масштаба и координат
     * @method createFooterWidget
     * @param name {string} Название виджета
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    createFooterWidget( name: string, propsData: GwtkComponentDescriptionPropsData & SimpleJson<any> ) {
        // добавление в контейнер
        this.createComponent( GwtkComponentPanel.FOOTER_PANEL, name, propsData );
    }


    /**
     * Отобразить элемент
     * @method showItem
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    showItem( propsData: GwtkComponentDescriptionPropsData ) {
        this.showComponent( GwtkComponentPanel.TOOLBAR, propsData );
        this.showComponent( GwtkComponentPanel.LEFT_TOOLBAR, propsData );
        this.showComponent( GwtkComponentPanel.BOTTOM_NAVIGATION_BAR, propsData );
        this.showComponent( GwtkComponentPanel.RIGHT_BAR, propsData );
        this.showComponent( GwtkComponentPanel.SIDEBAR, propsData );
        this.showComponent( GwtkComponentPanel.MAP_WINDOW_FULL_SCREEN, propsData );
        this.showComponent( GwtkComponentPanel.WINDOW_PANEL, propsData );
        this.showComponent( GwtkComponentPanel.BOTTOM_PANEL, propsData );
    }

    /**
     * Удалить элемент
     * @method deleteItem
     * @param propsData {GwtkComponentDescriptionPropsData} Данные компонента
     */
    deleteItem( propsData: GwtkComponentDescriptionPropsData ) {
        // удаление из контейнера
        this.deleteComponent( GwtkComponentPanel.TOOLBAR, propsData );
        this.deleteComponent( GwtkComponentPanel.LEFT_TOOLBAR, propsData );
        this.deleteComponent( GwtkComponentPanel.BOTTOM_NAVIGATION_BAR, propsData );
        this.deleteComponent( GwtkComponentPanel.RIGHT_BAR, propsData );
        this.deleteComponent( GwtkComponentPanel.SIDEBAR, propsData );
        this.deleteComponent( GwtkComponentPanel.MAP_WINDOW_FULL_SCREEN, propsData );
        this.deleteComponent( GwtkComponentPanel.FOOTER_PANEL, propsData );
        this.deleteComponent( GwtkComponentPanel.WINDOW_PANEL, propsData );
        this.deleteComponent( GwtkComponentPanel.MAP3D_PANEL, propsData );
        this.deleteComponent( GwtkComponentPanel.BOTTOM_PANEL, propsData );
    }

    /**
     * Задать тип курсора
     * @method setCursor
     * @param cursorType {CURSOR_TYPE} Тип курсора
     * @return {CURSOR_TYPE} Предшествующий тип курсора
     */
    setCursor( cursorType: CURSOR_TYPE ) {
        let oldCursor: CURSOR_TYPE = this.map?.setCursor( cursorType );

        return oldCursor;
    }

    /**
     * Получить экземпляр карты
     * @method getMap
     * @return {GwtkMap} Экземпляр карты
     */
    getMap() {
        return this.map;
    }

    /**
     * Получить экземпляр менеджера задач
     * @method getTaskManager
     * @return {TaskManager} Экземпляр менеджера задач
     */
    getTaskManager() {
        return this.taskManager;
    }

    /**
     * Получить экземпляр инструмента рисования векторных данных
     * @method getVectorRenderer
     * @return {SVGrenderer} Экземпляр инструмента рисования векторных данных
     */
    getVectorRenderer() {
        return this.map.getVectorRenderer() as SVGrenderer;
    }

    protected onMapCreated( ...args: any ) {
        this.taskManager = new TaskManager( this );
        this.map.taskManagerNew = this.taskManager;
    }

    abstract setDarkTheme( value: boolean ): void;

    abstract setReduceSizeInterface( value: boolean ): void;

    abstract applyColorScheme( colorScheme: ColorScheme ): void;

    abstract setFontSize( size: FontSize ): void;
}
