/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                         Базовый класс компонента                 *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import VueMapWindow from '@/components/VueMapWindow';

@Component
export default class BaseGwtkVueComponent extends Vue {

    @Prop( { required: true } ) mapVue!: VueMapWindow;
}
