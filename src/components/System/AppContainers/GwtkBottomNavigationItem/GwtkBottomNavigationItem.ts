import { Component, Prop } from 'vue-property-decorator';
import GwtkCommonItem from '../GwtkCommonItem';

/**
 * Системный компонент элемента тулбара
 * @class GwtkToolbarItem
 * @extends GwtkCommonItem
 */
@Component
export default class GwtkBottomNavigationItem extends GwtkCommonItem {

    @Prop( { default: false } ) listItem!: Boolean;

}