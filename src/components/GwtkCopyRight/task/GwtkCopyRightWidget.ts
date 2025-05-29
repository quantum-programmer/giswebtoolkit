/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        Виджет компонента                         *
 *                  Информация о правообладателе                    *
 *                                                                  *
 *******************************************************************/
import { Component, Prop, Vue } from 'vue-property-decorator';
import { PrivacyPolicySettings } from '~/types/Options';


/**
 * Виджет компонента
 * @class GwtkCopyRightWidget
 * @extends BaseGwtkVueComponent
 */
@Component
export default class GwtkCopyRightWidget extends Vue {
    @Prop( { default: '' } )
    private readonly nameCompany!: string;

    @Prop( { default: '' } )
    private readonly privacyPolicy !: PrivacyPolicySettings;

}

