/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *         Компонент "Запись постоянных пасек для просмотра"        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import { BeekeepersRequestResult } from '@/components/GwtkBeekeeper/task/GwtkBeekeeperTask';


/**
 * Компонент "Запись постоянных пасек для просмотра"
 * @class GwtkBeekeeperStaticRecordItem
 * @extends Vue
 */
@Component
export default class GwtkBeekeeperStaticRecordItem extends Vue {

    @Prop( { default: () => ([]) } )
    private readonly record!: BeekeepersRequestResult[];

    @Prop( { default: false } )
    private readonly selected!: boolean;

    get recordOrganName() {
        let name = '';

        this.record.forEach((item: BeekeepersRequestResult) => {
            if ( item.key === 'name_organ' ) {
                name = item.value as string;
            }
        });

        return name;
    }
}
