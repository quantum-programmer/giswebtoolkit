/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Меню группового элемента                         *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import {ContentTreeNode} from '../../../../../../GIS WebToolKit SE/debug/source/utils/MapTreeJSON';
import GwtkMapLayerFactory from '../LayerItems/GwtkMapLayerFactory';
import BaseGwtkVueComponent from '../../../../System/BaseGwtkVueComponent';
import GwtkMapLayerItem from '@/components/GwtkMapContent/task/components/LayerItems/GwtkMapLayerItem';
import { GwtkMapContentTaskState, SET_TREE_NODE_LAYER_ENABLE } from '../../GwtkMapContentTask';


/**
 * Меню группового элемента
 * @class GwtkMapContentItemMenuWidget
 * @extends Vue
 */
@Component
export default class GwtkMapContentItemMenuWidget extends BaseGwtkVueComponent {

    @Prop({
        default: () => ({})
    })
    contentTreeItem!: ContentTreeNode;

    layerTreeItem!: GwtkMapLayerItem;

    created() {
        this.layerTreeItem = GwtkMapLayerFactory.createMapLayerItem(this.mapVue.getMap(), this.contentTreeItem, null);
    }

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) => void;

    closeOnContentClick = true;

    get showAllIconTitle(): string {
        return this.$t('legend.Enable all') as string;
    }

    get hideAllIconTitle(): string {
        return this.$t('legend.Disable all') as string;
    }

    showAll() {
        this.setState(SET_TREE_NODE_LAYER_ENABLE, { enable: true, tree: this.layerTreeItem });
        this.$emit('update');
    }

    hideAll() {
        this.setState(SET_TREE_NODE_LAYER_ENABLE, {enable: false, tree: this.layerTreeItem});
        this.$emit('update');
    }
}
