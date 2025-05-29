/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *              Тулбар компонента "Состав карты"                    *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import {
    MapContentLayerActions,
    MapContentViewActions
} from '../Toolbar/Types';
import i18n from '@/plugins/i18n';
import {
    GwtkMapContentTaskState,
    ON_INPUT_SEARCH,
    ADD_PUBLISHING_FILES
} from '../../GwtkMapContentTask';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {
    LAYERS_BY_GROUPS,
    LAYERS_BY_TREE,
    LAYERS_BY_ORDER
} from '../../GwtkMapContentWidget';


const LAYERS_TREE_PUBLISH_MAP = 'gwtk.mapcontenttoolbar.publishmap';
const LAYERS_TREE_CREATE_LOCAL = 'gwtk.mapcontenttoolbar.createlocal';
const LAYERS_TREE_OPEN_LOCAL = 'gwtk.mapcontenttoolbar.openlocal';


@Component
export default class GwtkMapContentToolbar extends BaseGwtkVueComponent {

    @Prop({ default: LAYERS_BY_TREE })
    readonly viewMode!: string;

    @Prop({ default: true })
    readonly treeMode!: boolean;

    @Prop({ default: false })
    readonly showSearch!: boolean;

    @Prop({ default: '' })
    readonly searchValue!: string;

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) => void;


    private isLocalLayerNameInputDialog: boolean = false;

    private newLocalLayerName: string = '';

    get buttonLayersActions(): MapContentLayerActions {
        const mapContentLayerActions: MapContentLayerActions = [];

        let creationIsEnabled = false;
        const functions = this.mapVue.getMap().options.settings_mapEditor?.functions;
        if (functions) {
            creationIsEnabled = functions.includes('*') || functions.includes('create');
        }

        if (this.mapVue.getTaskManager().isEditorAvailable && creationIsEnabled) {
            mapContentLayerActions.push({
                text: this.$t('mapcontent.Create local layer') as string,
                value: LAYERS_TREE_CREATE_LOCAL,
                icon: 'mdi-file-plus-outline'
            });
        }

        mapContentLayerActions.push({
            text: this.$t('mapcontent.Open local layer') as string,
            value: LAYERS_TREE_OPEN_LOCAL,
            icon: 'mdi-folder-open-outline'
        });

        const publicationIsEnabled = this.mapVue.getMap().options.username !== 'ANONYMOUS';

        if (publicationIsEnabled) {
            mapContentLayerActions.push({
                text: this.$t('mapcontent.Publish a map') as string,
                value: LAYERS_TREE_PUBLISH_MAP,
                icon: 'mdi-publish'
            });
        }

        return mapContentLayerActions;
    }

    get buttonViewActions(): MapContentViewActions {
        return [
            {
                text: this.$t('phrases.By group') as string,
                value: LAYERS_BY_GROUPS
            },
            {
                text: this.$t('phrases.By order') as string,
                value: LAYERS_BY_ORDER
            },
            {
                text: this.$t('mapcontent.Tree') as string,
                value: LAYERS_BY_TREE
            }
        ];
    }

    created(): void {
        this.newLocalLayerName = this.$t('phrases.New layer') as string;
    }

    get canCreateNewLocalLayer(): boolean {
        return !this.newLocalLayerName;
    }

    private cancelCreate(): void {
        this.hideLocalLayerCreationDialog();
    }

    private emitCreateLayer(): void {
        this.$emit('create:layer', this.newLocalLayerName);
        this.hideLocalLayerCreationDialog();
    }

    private hideLocalLayerCreationDialog(): void {
        this.isLocalLayerNameInputDialog = false;
        if (!this.newLocalLayerName) {
            this.newLocalLayerName = this.$t('phrases.New layer') as string;
        }
    }

    private showCreateLocalLayerDialog(): void {
        this.mapVue.showInputText({
            title: i18n.t('phrases.Layer name') + '',
            inputText: this.newLocalLayerName + ''
        }).then((text) => {
            this.newLocalLayerName = text;
            this.emitCreateLayer();
        }).catch(() => this.cancelCreate());
    }

    processItem(action: string): void {
        switch (action) {
            case LAYERS_TREE_CREATE_LOCAL:
                this.showCreateLocalLayerDialog();
                break;
            case LAYERS_TREE_OPEN_LOCAL:
                this.$emit('open:layer');
                break;
            case LAYERS_TREE_PUBLISH_MAP:
                this.setState(ADD_PUBLISHING_FILES, undefined);
                break;
        }
    }

    getSearchValue(): string {
        return this.searchValue;
    }

    onInputSearch(value: string): void {
        this.setState(ON_INPUT_SEARCH, value);
    }

}
