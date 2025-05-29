/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Тестирование компонента                       *
 *                           GwtkButton                             *
 *                                                                  *
 *******************************************************************/

import Vue from 'vue';
import Vuetify from 'vuetify';
import { Wrapper, createLocalVue, mount } from '@vue/test-utils';
import GwtkButton from '../GwtkButton.vue';
import '@/components/directives';

Vue.use(Vuetify);

const localVue = createLocalVue();

describe ('GwtkButton.vue', () => {
    const vuetify = new Vuetify();
    let wrapper: Wrapper <Vue, Element>;

    beforeEach (() => {
        wrapper = mount(GwtkButton, {
            localVue,
            vuetify
        });
    });

    test ('should render component', () => {
        expect(wrapper.classes('gwtk-empty')).toEqual(true);
        expect(wrapper.props('alignContent')).toBe('center');
    });

    test ('should render component alignContent left', async () => {
        await wrapper.setProps({
            alignContent: 'left'
        });

        expect(wrapper.props('alignContent')).toBe('left');
    });

    test ('should render primary component', async () => {
        await wrapper.setProps({
            primary: true,
        });

        expect(wrapper.classes('gwtk-primary')).toEqual(true);
    });
});
