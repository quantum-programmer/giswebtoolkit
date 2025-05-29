import { mount, shallowMount } from '@vue/test-utils';
import GwtkFeatureSamplesSearchWidget from '../GwtkFeatureSamplesSearchWidget.vue';
import Vue from 'vue';
import i18n from '@/plugins/i18n';
import vuetify from '@/plugins/vuetify';
import '@/components/directives';
import GwtkSystem from '@/components/System';

Vue.use(GwtkSystem);


Vue.component('GwtkFeatureSamplesSearchWidget', GwtkFeatureSamplesSearchWidget);


describe('test GwtkFeatureSamplesSearchWidget', () => {

    const wrapper = mount(GwtkFeatureSamplesSearchWidget, {
        propsData: {
            setState: () => {},
            searchProps: {
                searchResult: null,
                firstSearchItemId: 1,
                secondSearchItemId: 1,
                selectedOperators: [],
                searchProgress: 1,
                searchFirstItemGroupList: [],
                searchSecondItemGroupList: [],
                searchOperatorList: [],
                csvCreation: false,
            }

        },
        i18n,
        vuetify
    });
        
    test ('test', () => {
        expect(wrapper.find('span')).toBeTruthy();
    });
});