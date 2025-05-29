/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *          "Элемент управления видимостью элементов"               *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseMapContentView from '../BaseMapContentView';
import { CHANGE_VIEW_MODE, RESTORE_INITIAL_LAYERS, SAVE_VIEW_MODE, SET_ALL_LAYER_ENABLE, SET_ROOT_ITEMS_ENABLE, UPDATE_TREE } from '../../GwtkMapContentTask';
import { LAYERS_BY_GROUPS, LAYERS_BY_ORDER, LAYERS_BY_TREE } from '../../GwtkMapContentWidget';


@Component({
})
export default class GwtkMapContentVisibleControl extends BaseMapContentView {
    @Prop({ default: LAYERS_BY_TREE })
    readonly viewMode!: string;



    showAll() {
        this.setState(SET_ROOT_ITEMS_ENABLE, true);
    }

    hideAll() {
        this.setState(SET_ROOT_ITEMS_ENABLE, false);
    }

    enableAll() {
        this.setState(SET_ALL_LAYER_ENABLE, true);
    }

    disableAll() {
        this.setState(SET_ALL_LAYER_ENABLE, false);
    }

    restoreAll() {
        this.setState(RESTORE_INITIAL_LAYERS, undefined);
    }

    get buttonViewActions() {
        return [
            {
                text: this.$t('mapcontent.Tree') as string,
                value: LAYERS_BY_TREE,
                image: 'mdi-file-tree'
            },
            {
                text: this.$t('phrases.By group') as string,
                value: LAYERS_BY_GROUPS,
                image: 'mdi-format-list-group'

            },
            {
                text: this.$t('phrases.By order') as string,
                value: LAYERS_BY_ORDER,
                image: 'mdi-format-list-bulleted'
            },
        ];
    }

    isSelectedMode(value: string) {
        return value === this.viewMode;
    }


    changeMode(item: string) {
        this.setState(CHANGE_VIEW_MODE, item);
        if (item === LAYERS_BY_TREE) {
            this.setState(UPDATE_TREE, item);
        }
        this.setState(SAVE_VIEW_MODE, item);
    }
}
