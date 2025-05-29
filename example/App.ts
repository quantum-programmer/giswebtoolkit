import { Component } from 'vue-property-decorator';
import Utils from '~/services/Utils';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';


@Component
export default class App extends BaseGwtkVueComponent {

    private mapDivId = Utils.generateGUID();

    // menuActiveFlag = false;
    // sidebarExpandedFlag = true;
    // sidebarActiveFlag = false;
    //
    // onShow( active: boolean ) {
    //     this.sidebarActiveFlag = active;
    //     if ( !active ) {
    //         this.sidebarExpandedFlag = true;
    //     }
    // }
}
