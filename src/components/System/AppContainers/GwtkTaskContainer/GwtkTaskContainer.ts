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

/**
 * Системный компонент боковой панели
 * @class GwtkTaskContainer
 * @extends GwtkCommonContainer
 */
@Component
export default class GwtkTaskContainer extends GwtkCommonContainer {

    showItem = true;

    setVisibility(value: boolean) {
        this.showItem = value;
    }

    get value() {
        return this.components.length > 0;
    }

    /**
     * Ширина панели
     * @private
     * @property width {number}
     */
    private width = 350;

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
    @Watch( 'isActive' )
    emitShow() {
        this.$emit( 'show', this.isActive );
    }


    /**
     * Обработчик события изменения массива открытых панелей
     * @method updatePanel
     * @description Если удалили компонент, то нужно поправить индексы открытых элементов в `panel`
     */
    @Watch( 'panel' )
    updatePanel() {
        if ( this.deletedIndex !== -1 ) {
            for ( let i = 0; i < this.panel.length; i++ ) {
                if ( this.panel[ i ] > this.deletedIndex ) {
                    this.panel[ i ]--;
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
    addComponent( name: string, propsData: GwtkComponentDescriptionPropsData ) {
        const index = super.addComponent( name, propsData );
        this.panel.push( index );
        return index;
    }

    /**
     * Удалить компонент
     * @method removeComponent
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    removeComponent( propsData: GwtkComponentDescriptionPropsData ) {
        this.deletedIndex = super.removeComponent( propsData );
        // Чтобы нормально пересчитать индексы раскрытых панелей, нужно добавить удаляемую в список, если ее не было
        // иначе updatePanel не запустится
        if ( this.panel.indexOf( this.deletedIndex ) === -1 ) {
            this.panel.push( this.deletedIndex );
        }
        return this.deletedIndex;
    }

    /**
     * Обработчик события изменения размера
     * @method onResize
     * @param dimentions {width:number} - Новые размеры
     */
    onResize( { width }: { width: number } ) {
        this.width = width;
    }
}
