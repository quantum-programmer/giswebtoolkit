/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *            Виджет компонента "Состав карты"                      *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import { OUTTYPE } from '~/services/RequestServices/common/enumerables';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    OPEN_LAYER_STYLES_SETTINGS,
    SET_DYNAMIC_LABEL_LAYER,
    GwtkMapContentTaskState,
    MapContentTreeViewNode
} from '../../GwtkMapContentTask';
import { ContentTreeNode } from '~/utils/MapTreeJSON';
import GwtkMapLayerFactory from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerFactory';
import GwtkVirtualFolderItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkVirtualFolderItem';
import GwtkGroupLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkGroupLayerItem';
import GwtkSingleLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkSingleLayerItem';


/**
 * Виджет компонента
 * @class GwtkMapContentItemMenuWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkMapContentItemMenuWidget extends BaseGwtkVueComponent {

    @Prop({ default: () => ([]) })
    private readonly dynamicLabelData!: {
        id: string;
        dynamicLabel: boolean;
    }[];

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    private readonly contentTreeItem!: MapContentTreeViewNode | ContentTreeNode;

    @Prop({ default: false })
    private readonly isUserLogged!: boolean;

    @Prop({ default: undefined })
    private readonly userLogin!: string | undefined;

    @Prop({ default: () => ([]) })
    readonly menuListItems!: any[];

    private showExportMenu = false;

    private closeOnContentClick = true;

    private needScrollToDownloadMenuItem = false;

    /**
     * Список идентификаторов файлов, находящихся в процессе загрузки
     * @private
     * @property loadingStreams {string[]}
     */
    private loadingStreams: string[] = [];

    get layerTreeItem(): GwtkVirtualFolderItem | GwtkGroupLayerItem | GwtkSingleLayerItem {
        let result;
        if ((this.contentTreeItem as MapContentTreeViewNode).item) {
            result = GwtkMapLayerFactory.createMapLayerItem(this.mapVue.getMap(), (this.contentTreeItem as MapContentTreeViewNode).item, null);
        } else {
            result = GwtkMapLayerFactory.createMapLayerItem(this.mapVue.getMap(), (this.contentTreeItem as ContentTreeNode), null);
        }
        return result;
    }

    get targetIconTitle(): string {
        return this.$t('phrases.View layer') as string;
    }

    get closeBtnTitle(): string {
        return this.$t('phrases.Close') as string;
    }

    get settingsBtnTitle(): string {
        return this.$t('phrases.Options') as string;
    }

    get opacityLabel(): string {
        return this.layerTreeItem.opacity?.toFixed(0) + ' %';
    }

    get informationIconTitle(): string {
        return this.$t('phrases.Information') as string;
    }

    get canShowExport(): boolean {
        return (!!this.layerTreeItem.exportTypes && this.layerTreeItem.exportTypes.length > 0);
    }

    get downloadTitle(): string {
        return this.$t('phrases.Download') as string;
    }

    get isLoadingLayer(): boolean {
        return this.loadingStreams.length !== 0;
    }

    get exportItems(): string[] {
        return this.layerTreeItem.exportTypes || [];
    }

    get updateIconTitle() {
        return this.$t('phrases.Update');
    }

    get isInfoEnabled(): boolean {
        return false; //TODO:источник информации о слое
    }

    get isDynamicLayer() {
        return this.dynamicLabelData.find((item) => item.id === this.layerTreeItem.layerGUID);
    }

    get dynamicLayerIcon() {
        const index = this.dynamicLabelData.findIndex((data) => data.id === this.layerTreeItem.layerGUID);
        if (index !== -1 && this.dynamicLabelData[index].dynamicLabel) {
            return 'close-icon';
        } else {
            return 'subtitles-outline';
        }
    }

    get isEditorAvailable() {
        let result = false;
        const functions = this.mapVue.getMap().options.settings_mapEditor?.functions;
        if (functions) {
            result = functions.includes('*') || functions.includes('create') || functions.includes('edit') || functions.includes('delete');
        }
        return this.mapVue.getTaskManager().isEditorAvailable && result;
    }

    get isCopyStoredAvailable(): boolean {
        if (this.isUserLogged && this.layerTreeItem instanceof GwtkSingleLayerItem) {
            if (this.layerTreeItem.layer?.options.isPublic) {
                return true;
            }
            if (this.layerTreeItem.layer?.options.ownerLogin === this.userLogin) {
                return true;
            }
        }
        return false;
    }

    get titleForCopyStored(): string {
        const nodeName = this.layerTreeItem instanceof GwtkSingleLayerItem && this.layerTreeItem.layer?.options.isPublic ? this.$t('mapcontent.User maps') : this.$t('mapcontent.Public maps');
        return this.$t('mapcontent.Into') + ' ' + nodeName;
    }

    get iconForCopyStored(): string {
        return this.layerTreeItem instanceof GwtkSingleLayerItem && this.layerTreeItem.layer?.options.isPublic ? 'mdi-folder-account-outline' : 'mdi-share-variant-outline';
    }

    get isDeleteStoredAvailable(): boolean {
        return this.isUserLogged && this.layerTreeItem instanceof GwtkSingleLayerItem && this.layerTreeItem.layer?.options.ownerLogin === this.userLogin;
    }

    /**
     * Скачать слой
     */
    async toggleDownLoadLayer(downloadFormat: string) {
        this.showExportMenu = false;
        this.loadingStreams.splice(0, 0, downloadFormat);
        if (downloadFormat) {
            await this.layerTreeItem.download(downloadFormat.toUpperCase() as OUTTYPE);
        }

        this.loadingStreams.pop();
    }

    viewEntireLayer() {
        this.closeOnContentClick = true;
        this.layerTreeItem.viewEntireLayer();
    }

    closeLayer() {
        this.closeOnContentClick = true;
        this.layerTreeItem.close();
    }

    setOpacityLayer(index: number) {
        this.closeOnContentClick = true;
        this.layerTreeItem.setOpacityLayer(index);
    }

    getObjectList() {
        this.closeOnContentClick = true;
        this.layerTreeItem.getObjectList().finally(() => {
            this.mapVue.getTaskManager().showObjectPanel();
        });
    }

    openMapLegend() {
        this.mapVue.getTaskManager().openLegend(this.layerTreeItem.layerGUID);
    }

    openLayerStylesSettings() {
        this.setState(OPEN_LAYER_STYLES_SETTINGS, this.layerTreeItem.layerGUID);
    }

    openMapEditor() {
        if (this.layerTreeItem.isEditable) {
            this.mapVue.getTaskManager().openMapEditor(this.layerTreeItem.layerGUID);
        }
    }

    toggleDownloadMenuItem() {
        this.showExportMenu = !this.showExportMenu;
        this.closeOnContentClick = false;

        if (this.showExportMenu) {

            const menuElement = this.$refs['layerMenuItemsList'] as HTMLElement;

            if (menuElement && menuElement.getBoundingClientRect) {

                const downloadMenuHeight = this.exportItems.length * 27;
                const menuHeight = menuElement.getBoundingClientRect().height + downloadMenuHeight;
                const menuTop = menuElement.getBoundingClientRect().top;

                this.needScrollToDownloadMenuItem = (menuHeight + menuTop) > window.innerHeight;
            }
        }
    }

    setDynamicLabel() {
        this.setState(SET_DYNAMIC_LABEL_LAYER, this.layerTreeItem.layerGUID);
    }

}
