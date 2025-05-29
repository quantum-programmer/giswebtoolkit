import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';


export type ComponentDescription = {
    name: string;
    propsData: GwtkComponentDescriptionPropsData;
};

export default class GwtkCommonContainer extends BaseGwtkVueComponent {

    /**
     * Список описаний компонентов
     * @property {object[]} components
     */
    components: ComponentDescription[] = [];

    /**
     * Активный компонент (верхний в стеке)
     * @property {object} component
     */
    get component() {
        let result;
        if ( this.components.length > 0 ) {
            result = this.components[ this.components.length - 1 ];
        }
        return result;
    }

    /**
     * Добавить компонент
     * @param name {string} Название создаваемого компонента
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры создаваемого компонента
     * @return {number} Индекс добавленного элемента
     */
    addComponent( name: string, propsData: GwtkComponentDescriptionPropsData ) {
        let index = this.components.findIndex(item => item.propsData.taskId === propsData.taskId);
        if (index !== -1) {
            this.components.splice(index, 1);
        }
        this.components.push( { name, propsData } );
        index = this.components.length - 1;
        return index;
    }

    /**
     * Удалить компонент
     * @method removeComponent
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры удаляемого компонента
     * @return {number} Индекс удаленного элемента
     */
    removeComponent( propsData: GwtkComponentDescriptionPropsData ) {
        let index = -1;
        for ( let i = 0; i < this.components.length; i++ ) {
            if ( this.components[ i ].propsData === propsData ) {
                index = i;
                break;
            }
        }
        if ( index !== -1 ) {
            this.components.splice( index, 1 );
        }
        return index;
    }


    /**
     * Переместить компонент над всеми
     * @method showComponent
     * @param propsData {GwtkComponentDescriptionPropsData} Параметры компонента
     * @return {number} Начальный индекс элемента
     */
    showComponent( propsData: GwtkComponentDescriptionPropsData ) {
        let oldIndex = -1;
        for ( let i = 0; i < this.components.length; i++ ) {
            if ( this.components[ i ].propsData === propsData ) {
                oldIndex = i;
                break;
            }
        }
        if ( oldIndex !== -1 && oldIndex !== this.components.length - 1 ) {
            const [component] = this.components.splice( oldIndex, 1 );
            this.components.push( component );
        }
        return oldIndex;
    }

    /**
     * Удалить все компоненты
     * @method removeAllComponents
     */
    removeAllComponents() {
        this.components.splice( 0 );
    }
}
