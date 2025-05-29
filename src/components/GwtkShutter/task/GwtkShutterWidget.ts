/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет компонента                             *
 *                        "Шторка"                                  *
 *                                                                  *
 *******************************************************************/

import {Component, Prop} from 'vue-property-decorator';
import {TaskDescription} from '~/taskmanager/TaskManager';
import {
    ShutterLayerDescription,
    GwtkShutterTaskState,
    TOGGLE_ITEM,
    SET_VERTICAL_MODE,
    TOGGLE_SELECT_ALL,
    ON_INPUT_SEARCH
} from '@/components/GwtkShutter/task/GwtkShutterTask';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG} from '~/utils/WorkspaceManager';


/**
 * Виджет компонента
 * @class GwtkShutterWidget
 * @extends Vue
 */
@Component
export default class GwtkShutterWidget extends BaseGwtkVueComponent {

    @Prop({default: ''})
    private readonly taskId!: string;

    @Prop({default: () => ({})})
    private readonly description!: TaskDescription;

    @Prop({default: () => ({})})
    private readonly setState!: <K extends keyof GwtkShutterTaskState>(key: K, value: GwtkShutterTaskState[K]) => void;

    @Prop({default: []})
    private readonly layerList!: ShutterLayerDescription[];

    @Prop({default: false})
    private readonly verticalMode!: boolean;

    @Prop({default: ''})
    readonly searchValue!: string;

    get layerListItems() {
        const layerList: ShutterLayerDescription[] = [];
        for (let i = 0; i < this.layerList.length; i++) {
            if (this.layerList[i].alias.toLocaleLowerCase().includes(this.searchValue.toLowerCase())) {
                layerList.push(this.layerList[i]);
            }
        }
        return layerList;
    }

    get activeLayersCount() {
        let count = 0;
        this.layerList.forEach(item => {
            if (item.active) {
                count++;
            }
        });
        return count;
    }

    get isReducedSizeInterface() {
        return this.mapVue.getMap().workspaceManager.getValue(PROJECT_SETTINGS_USER_INTERFACE_REDUCE_SIZE_INTERFACE_FLAG);
    }

    getSearchValue(): string {
        return this.searchValue;
    }

    onInputSearch(value: string): void {
        this.setState(ON_INPUT_SEARCH, value);
    }

    get selectAll(): boolean {
        return this.layerListItems.length ? this.layerListItems.every(item => item.active) : false;
    }

    set selectAll(status: boolean) {
        const xIdList: string[] = [];
        this.layerListItems.forEach(item => xIdList.push(item.xId));
        this.setState(TOGGLE_SELECT_ALL, {xIdList, status});
    }

    private toggleItem(xId: string, status: boolean) {
        this.setState(TOGGLE_ITEM, {xId, status});
    }

    private toggleVerticalMode() {
        this.setState(SET_VERTICAL_MODE, !this.verticalMode);
    }

}
