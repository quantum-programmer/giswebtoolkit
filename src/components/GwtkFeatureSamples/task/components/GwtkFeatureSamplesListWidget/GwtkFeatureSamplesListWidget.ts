/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Виджет списков компонента                         *
 *               "Просмотр списков объектов"                        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkFeatureSamplesState,
    CREATE_GROUP,
    DELETE_GROUP,
    SHOW_ITEM_LIST,
    TOGGLE_ITEM_GROUP,
    SELECT_ITEM_LIST, WidgetGroup,
} from '@/components/GwtkFeatureSamples/task/GwtkFeatureSamplesTask';


/**
 * Виджет компонента
 * @class GwtkFeatureSamplesListWidget
 * @extends Vue
 */
@Component
export default class GwtkFeatureSamplesListWidget extends Vue {

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkFeatureSamplesState>( key: K, value: GwtkFeatureSamplesState[K] ) => void;

    @Prop({ default: 0 })
    private readonly selectedObjectCount!: number;

    @Prop({ default: () => ([]) })
    private readonly groupList!: WidgetGroup[];

    @Prop({ default: () => ([]) })
    private readonly activeListIndices!: number[];

    get itemGroupActiveList() {
        return this.activeListIndices.map(item => this.groupList.findIndex(group => group.id === item));
    }

    private confirmId = -1;

    private createGroup() {
        this.setState(CREATE_GROUP, null);
    }

    private deleteGroup(value: number) {
        this.setState(DELETE_GROUP, value);
        this.openConfirm(-1);
    }

    private onClickShowItemList(value: number) {
        this.setState(SHOW_ITEM_LIST, value);
    }

    private clickOnListItem(value: number) {
        this.setState(TOGGLE_ITEM_GROUP, value);
        this.openConfirm(-1);
    }

    private openConfirm( idx: number ) {
        if ( this.confirmId === idx ) {
            this.confirmId = -1;
        } else {
            this.confirmId = idx;
        }
    }

    private selectItemList( idx: number ) {
        this.setState( SELECT_ITEM_LIST, idx );
    }

    private isActive( listId: number ) {
        return this.activeListIndices.indexOf( listId ) !== -1;
    }
}
