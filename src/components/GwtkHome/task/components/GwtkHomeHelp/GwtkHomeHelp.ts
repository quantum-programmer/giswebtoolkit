/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Компонент "Помощь, советы"                    *
 *                                                                  *
 *******************************************************************/

import { Component } from 'vue-property-decorator';
import GwtkHomeCategory from '@/components/GwtkHome/task/components/GwtkHomeCategory/GwtkHomeCategory';
import GwtkHomeHelpUsefulTelephones
    from '@/components/GwtkHome/task/components/GwtkHomeHelp/GwtkHomeHelpUsefulTelephones/GwtkHomeHelpUsefulTelephones.vue';
import GwtkHomeHelpHaveQuestion
    from '@/components/GwtkHome/task/components/GwtkHomeHelp/GwtkHomeHelpHaveQuestion/GwtkHomeHelpHaveQuestion.vue';


/**
 * Компонент "Помощь, советы"
 * @class GwtkHomeHelp
 * @extends Vue
 */
@Component(
    {components: { GwtkHomeHelpUsefulTelephones, GwtkHomeHelpHaveQuestion }}
)
export default class GwtkHomeHelp extends GwtkHomeCategory {

    /**
     * Выбрать подкатегорию
     * @private
     * @method selectSubCategory
     * @param subCategoryId {string} Идентификатор подкатегории
     */
    protected selectSubCategory( subCategoryId: string ) {
        this.activeSubCategoryId = subCategoryId;
    }
}
