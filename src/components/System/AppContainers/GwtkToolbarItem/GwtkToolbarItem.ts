import { Component, Prop } from 'vue-property-decorator';
import GwtkCommonItem from '../GwtkCommonItem';

/**
 * Системный компонент элемента тулбара
 * @class GwtkToolbarItem
 * @extends GwtkCommonItem
 */
@Component
export default class GwtkToolbarItem extends GwtkCommonItem {

    @Prop( { default: false } ) listItem!: boolean;
    
    @Prop( { default: false } ) iconButton!: boolean;

    @Prop( { default: false } ) withoutTooltip!: boolean;

    @Prop( { default: 'bottom' } ) position!: string;
}
