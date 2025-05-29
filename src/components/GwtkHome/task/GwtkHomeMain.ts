/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                          Компонент "Домой"                       *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { GwtkHomeTaskState, Category, SELECT_CATEGORY } from '@/components/GwtkHome/task/GwtkHomeTask';
import GwtkHomeLearnMore from '@/components/GwtkHome/task/components/GwtkHomeLearnMore/GwtkHomeLearnMore.vue';
import GwtkHomeHelp from '@/components/GwtkHome/task/components/GwtkHomeHelp/GwtkHomeHelp.vue';
import GwtkHomeCategory from '@/components/GwtkHome/task/components/GwtkHomeCategory/GwtkHomeCategory.vue';

/**
 * Компонент "Домой"
 * @class GwtkHomeMain
 * @extends BaseGwtkVueComponent
 */
@Component(
    {
        components: {
            GwtkHomeLearnMore,
            GwtkHomeHelp,
            GwtkHomeCategory
        }
    }
)
export default class GwtkHomeMain extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkHomeTaskState>( key: K, value: GwtkHomeTaskState[K] ) => void;

    @Prop( { default: () => ([]) } )
    private readonly categories!: Category[];

    @Prop( { default: () => null } )
    private selectedCategory!: Category | null;

    updated() {
        this.$el.scrollTop = 0;
    }

    /**
     * Открыть панель
     * @private
     * @method selectCategory
     * @param panelName {String} имя панеля
     */
    private selectCategory( panelName: string ) {
        this.setState( SELECT_CATEGORY, panelName );
    }

    /**
     * Показать главную панель
     * @method isShowMain
     */
    get isShowMain() {
        return this.selectedCategory === null;
    }

    /**
     * Показать панель "Узнать больше"
     * @method isShowLearnMore
     */
    get isShowLearnMore() {
        return this.selectedCategory && this.selectedCategory.id === 'learnMore';
    }

    /**
     * Показать панель "Помощь, советы"
     * @method isShowHelp
     */
    get isShowHelp() {
        return this.selectedCategory && this.selectedCategory.id === 'help';
    }
}
