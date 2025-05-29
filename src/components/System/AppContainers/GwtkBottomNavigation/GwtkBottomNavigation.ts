import { Component } from 'vue-property-decorator';
import GwtkCommonContainer from '../GwtkCommonContainer';

@Component
export default class GwtkBottomNavigation extends GwtkCommonContainer {


    get selectedIndex() {
        let index: number | undefined = undefined;

        for ( let componentNumber = 0; componentNumber < this.components.length; componentNumber++ ) {
            const component = this.components[ componentNumber ];

            if ( component.propsData.description.active )
                index = componentNumber;

            if ( componentNumber === 3 )
                break;
        }

        return index;
    }

}
