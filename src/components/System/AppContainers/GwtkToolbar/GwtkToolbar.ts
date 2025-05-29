import { Component, Prop } from 'vue-property-decorator';
import GwtkCommonContainer, { ComponentDescription } from '../GwtkCommonContainer';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';


const ITEM_WIDTH = 42;
const GROUP_SPACE = 32;

@Component
export default class GwtkToolbar extends GwtkCommonContainer {

    private windowWidth = window.innerWidth;

    private get widthLimit() {
        return this.windowWidth * 0.4;
    }

    get groupComponents() {
        const mapGroups = [] as ComponentDescription[][];
        const listGroups = [] as ComponentDescription[][];

        const componentNameGroups = this.groups;
        if ( componentNameGroups.length > 0 ) {

            //заполняем по списку компоненты групп
            const componentGroupList = [];
            for ( let groupIndex = 0; groupIndex < componentNameGroups.length; groupIndex++ ) {
                const componentGroup = [];
                const componentNameGroup = componentNameGroups[ groupIndex ];
                for ( const componentName of componentNameGroup ) {
                    const component = this.components.find( item => item.propsData.description.id === componentName );
                    if ( component ) {
                        componentGroup.push( component );
                    }
                }
                if ( componentGroup.length > 0 ) {
                    componentGroupList.push( componentGroup );
                }
            }

            //добавляем в отдельный список компоненты без групп
            const lastGroup = [];
            for ( const component of this.components ) {
                let groupedFlag = false;
                for ( const componentNameGroup of componentNameGroups ) {
                    if ( componentNameGroup.includes( component.propsData.description.id ) ) {
                        groupedFlag = true;
                        break;
                    }
                }
                if ( !groupedFlag ) {
                    lastGroup.push( component );
                }
            }

            if ( lastGroup.length > 0 ) {
                componentGroupList.push( lastGroup );
            }


            let itemsWidth = ITEM_WIDTH + 2; //кнопка меню
            let visibleGroupsCount = 0;

            for ( const componentGroup of componentGroupList ) {
                componentGroup.forEach( () => itemsWidth += ITEM_WIDTH );
                itemsWidth += GROUP_SPACE;

                if ( itemsWidth < this.widthLimit ) {
                    visibleGroupsCount++;
                }
            }

            mapGroups.splice( 0, 0, ...componentGroupList.splice( 0, visibleGroupsCount ) );

            listGroups.splice( 0, 0, ...componentGroupList.splice( 0 ) );

        } else {
            const firstGroup = [];
            for ( let i = 0; i < Math.min( this.components.length, 4 ); i++ ) {
                firstGroup.push( this.components[ i ] );
            }

            if ( firstGroup.length > 0 ) {
                mapGroups.push( firstGroup );
            }

            const lastGroup = [];
            for ( let i = 4; i < this.components.length; i++ ) {
                lastGroup.push( this.components[ i ] );
            }
            if ( lastGroup.length > 0 ) {
                listGroups.push( lastGroup );
            }
        }

        return { mapGroups, listGroups };
    }

    addComponent(name: string, propsData: GwtkComponentDescriptionPropsData) {
        const index = this.components.findIndex((item) => item.propsData.taskId === propsData.taskId);
        if (index !== -1) {
            this.components.splice(index, 1);
        }
        this.components.push({ name, propsData });
        return this.components.length - 1;
    }

    private readonly groups: string[][] = [];

    updateGroupList( value: string[][] ) {
        this.groups.splice( 0, this.groups.length, ...value );
    }

    mounted() {
        window.addEventListener( 'resize', () => {
            this.windowWidth = window.innerWidth * window.devicePixelRatio;
        } );
    }
}
