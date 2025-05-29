/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Системный компонент боковой панели                *
 *                                                                  *
 *******************************************************************/

import { Component, Watch } from 'vue-property-decorator';
import GwtkCommonContainer from '../GwtkCommonContainer';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import i18n from '@/plugins/i18n';
import { LogEventType } from '~/types/CommonTypes';
import Utils from '~/services/Utils';
import { PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG } from '~/utils/WorkspaceManager';

/**
 * Системный компонент боковой панели
 * @class GwtkTaskBottomContainer
 * @extends GwtkCommonContainer
 */
@Component
export default class GwtkTaskBottomContainer extends GwtkCommonContainer {

    h = 412;

    minHeight = 42;

    showItem = true;

    expanded = false;

    readonly tabs: { taskId: string; title: string; closable?: boolean; }[] = [];

    isReducedSizeInterface = false;

    onResizeEnd = Utils.debounce(() => {
        this.$nextTick(() => this.mapVue.getMap().resizing());
    }, 200);

    get activeTab() {
        return this.component?.propsData.taskId;
    }

    set activeTab(id: string | undefined) {
        if (id !== undefined) {
            this.mapVue.getTaskManager().createTask(id).then(() => this.mapVue.getTaskManager().makeTaskActive(id));
        }
    }

    setVisibility(value: boolean) {
        this.showItem = value;
    }

    get value() {
        // return this.components.length > 0;
        return true;
    }

    mounted() {
        if (this.mapVue.getMap()) {
            this.isReducedSizeInterface = this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
        }
    }

    updated() {
        if (this.mapVue.getMap()) {
            this.isReducedSizeInterface = this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
        }
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 10);
    }

    /**
     * Массив развернутых компонентов
     * @private
     * @property panel {number[]}
     */
    private panel: number[] = [];

    /**
     * Индекс удаленного компонента
     * @private
     * @property deletedIndex {number}
     */
    private deletedIndex: number = -1;

    /**
     * Проверка активности компонентов
     * @private
     * @property isActive {boolean}
     */
    private get isActive() {
        return this.components.length > 0;
    }

    /**
     * Обработчик события изменения значения `isActive`
     * @method emitShow
     */
    @Watch('isActive')
    emitShow() {
        this.$emit('show', this.isActive);
        this.$nextTick(() => this.mapVue.getMap().resizing());
    }


    /**
     * Обработчик события изменения массива открытых панелей
     * @method updatePanel
     * @description Если удалили компонент, то нужно поправить индексы открытых элементов в `panel`
     */
    @Watch('panel')
    updatePanel() {
        if (this.deletedIndex !== -1) {
            for (let i = 0; i < this.panel.length; i++) {
                if (this.panel[i] > this.deletedIndex) {
                    this.panel[i]--;
                }
            }
            this.deletedIndex = -1;
        }
    }

    /**
     * Добавить компонент
     * @param name {string} Название создаваемого компонента
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры создаваемого компонента
     * @return {number} Индекс добавленного элемента
     */
    addComponent(name: string, propsData: GwtkComponentDescriptionPropsData) {
        const index = super.addComponent(name, propsData);
        this.panel.push(index);
        const previousTabCount = this.tabs.filter(tab => tab.closable).length;
        if (!this.tabs.find(item => item.taskId === propsData.taskId)) {
            this.tabs.push({
                taskId: propsData.taskId,
                title: propsData.description.options.title || 'Undefined task',
                closable: propsData.description.options.pureTask !== true
            });
        }
        if (previousTabCount !== this.tabs.filter(tab => tab.closable).length) {
            if (!this.expanded) {
                this.togglePanel(true);
            }
        }
        return index;
    }

    /**
     * Удалить компонент
     * @method removeComponent
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    removeComponent(propsData: GwtkComponentDescriptionPropsData) {
        this.deletedIndex = super.removeComponent(propsData);
        // Чтобы нормально пересчитать индексы раскрытых панелей, нужно добавить удаляемую в список, если ее не было
        // иначе updatePanel не запустится
        if (this.panel.indexOf(this.deletedIndex) === -1) {
            this.panel.push(this.deletedIndex);
        }
        const tabIndex = this.tabs.findIndex(item => item.taskId === propsData.taskId);
        if (tabIndex !== -1) {
            this.tabs.splice(tabIndex, 1);
        }

        if (this.tabs.length === 0) {
            this.togglePanel(false);
        }

        return this.deletedIndex;
    }

    removeAllComponents() {
        super.removeAllComponents();
        this.tabs.splice(0);
        this.togglePanel(false);
    }

    /**
     * Переместить компонент над всеми
     * @method showComponent
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры компонента
     * @return {number} Начальный индекс элемента
     */
    showComponent(propsData: GwtkComponentDescriptionPropsData) {
        const result = super.showComponent(propsData);
        if (result !== -1) {
            if (!this.expanded) {
                this.togglePanel(true);
            }
        }
        return result;
    }

    get helpPageExists(): boolean {
        if (!this.component) {
            return false;
        }
        return this.mapVue.getTaskManager().checkHelpPage(this.component.propsData.taskId);
    }

    clear() {
        const component = this.component;
        if (component) {
            this.mapVue.showInputText({
                description: `${i18n.t('phrases.Clean confirmation component state')}`
            }).then(() => {
                this.mapVue.getTaskManager().clearTaskWorkspaceData(component.propsData.taskId);
            }).catch(error => {
                this.mapVue.getMap().writeProtocolMessage({
                    text: error as string,
                    type: LogEventType.Error,
                    display: false
                });
            });
        }
    }


    /**
     * Открыть страницу справки
     * @method openHelp
     */
    openHelp() {
        if (this.component) {
            this.mapVue.getTaskManager().callHelp(this.component.propsData.taskId);
        }
    }

    /**
     * Обработчик клика
     * @method onClick
     */
    closeTask(taskId: string) {
        this.mapVue.getTaskManager().detachTask(taskId, true);
    }

    togglePanel(value: boolean, height?: number) {
        this.expanded = value;

        this.$nextTick(() => {
            if (height) {
                this.h = height;
            }
            if (!this.expanded) {
                //@ts-ignore
                this.$refs.resizable.$el.style.height = 'auto';
            } else {
                //свернуть внешнюю панель
                this.mapVue.getMap().trigger({ type: 'callAPI', cmd: 'toggleBottomPanel', data: { visible: false }});
            }

            this.mapVue.getMap().resizing();
        });
        return {height: this.h};
    }

    private onResizing(x: number, y: number, width?: number, height?: number): void {
        if (height && height > 0) {
            this.h = height;
        }
        this.$nextTick(() => {
            //@ts-ignore
            this.$refs.resizable.$el.style.transform = 'none';
            //@ts-ignore
            this.$refs.resizable.$el.style.width = '100%';

            this.onResizeEnd();
        });
    }
}
