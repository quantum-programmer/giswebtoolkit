import { Component } from 'vue-property-decorator';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import GwtkCommonContainer from '@/components/System/AppContainers/GwtkCommonContainer';

@Component
export default class GwtkFooterPanel extends GwtkCommonContainer {
    /**
     * Добавить компонент
     * @param name {string} Название создаваемого компонента
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры создаваемого компонента
     * @return {number} Индекс добавленного элемента
     */
    addComponent( name: string, propsData: GwtkComponentDescriptionPropsData ) {
        const index = super.addComponent( name, propsData );
        return index;
    }

    /**
     * Удалить компонент
     * @method removeComponent
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры компонента
     */
    removeComponent( propsData: GwtkComponentDescriptionPropsData ) {
        let deletedIndex = super.removeComponent( propsData );
        return deletedIndex;
    }

}
