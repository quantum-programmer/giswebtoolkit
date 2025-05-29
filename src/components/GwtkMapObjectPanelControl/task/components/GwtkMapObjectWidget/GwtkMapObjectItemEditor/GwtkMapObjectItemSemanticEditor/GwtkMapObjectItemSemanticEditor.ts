/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *        Компонент "Редактирование семантики объекта карты"        *
 *                                                                  *
 *******************************************************************/


import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkMapObjectTaskState,
    UPLOAD_FILE,
    SemanticViewFlags,
    SET_SEMANTIC_VIEW_FLAGS,
    UPLOAD_BIM_FILE,
    PREVIEW_FILE,
} from '@/components/GwtkMapObjectPanelControl/task/GwtkMapObjectTask';
import MapObjectContent from '~/mapobject/utils/MapObjectContent';
import MapObjectSemanticContent from '~/mapobject/utils/MapObjectSemanticContent';
import i18n from '@/plugins/i18n';
import { ViewDocumentMode } from '~/taskmanager/TaskManager';

/**
 * Компонент "Редактирование семантики объекта карты"
 * @class GwtkMapObjectItemSemanticEditor
 * @extends Vue
 */
@Component
export default class GwtkMapObjectItemSemanticEditor extends Vue {

    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapObjectTaskState>(key: K, value: GwtkMapObjectTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    readonly mapObjectContent!: MapObjectContent;

    @Prop({ default: () => ({}) })
    readonly semanticViewFlags!: SemanticViewFlags;
    
    @Prop( { default: false } )
    readonly isReducedSizeInterface!: boolean;

    readonly menuOpenedList: string[] = [];

    created() {
        this.mapObjectContent.setCommonForAllObjectsFlag(this.semanticViewFlags.commonForAllObjects);
        this.mapObjectContent.setShowAllSemanticsFlag(this.semanticViewFlags.showAllSemantics);
    }

    setShowFilledSemantics(showFilledSemantics: boolean) {
        this.mapObjectContent.setShowAllSemanticsFlag(!showFilledSemantics);
        this.setState(SET_SEMANTIC_VIEW_FLAGS, { ...this.semanticViewFlags, showAllSemantics: !showFilledSemantics });
    }

    setCommonForAllObjects(commonForAllObjects: boolean) {
        this.mapObjectContent.setCommonForAllObjectsFlag(commonForAllObjects && this.semanticViewFlags.showAllSemantics);
        this.setState(SET_SEMANTIC_VIEW_FLAGS, { ...this.semanticViewFlags, commonForAllObjects });
    }

    get locale() {
        return i18n.locale;
    }

    checkIfMenuIsOpened(id: string) {
        return this.menuOpenedList.includes(id);
    }

    resetMenu(id: string) {
        const index = this.menuOpenedList.indexOf(id);
        if (index > -1) {
            this.menuOpenedList.splice(index, 1);
        }
    }

    addMenu(id: string) {
        const index = this.menuOpenedList.indexOf(id);
        if (index === -1) {
            this.menuOpenedList.push(id);
        }
    }

    formatDatePickerValue(datePickerValue: string): string {
        if (!datePickerValue) return '';
        const [year, month, day] = datePickerValue.split('-');
        return `${day}/${month}/${year}`;
    }

    parseDate(date: string) {
        if (!date) return null;

        let [day, month, year] = date.split('/');
        while (month.length < 2) {
            month = '0' + month;
        }
        while (day.length < 2) {
            day = '0' + day;
        }
        return `${year}-${month}-${day}`;
    }


    openFileUpload(semantic: MapObjectSemanticContent) {
        this.setState(UPLOAD_FILE, { semantic, mapObjectContent: this.mapObjectContent });
    }

    openBimFileUpload(file: File, semantic: MapObjectSemanticContent) {
        if (file) {
            this.setState(UPLOAD_BIM_FILE, { semantic, mapObjectContent: this.mapObjectContent, file });
        }
    }

    onClickViewBimFile(semantic: MapObjectSemanticContent) {
        this.setState(PREVIEW_FILE, { semantic, mapObjectContent: this.mapObjectContent, type: ViewDocumentMode.bim });
    }

    onClickChangeBim() {
        const fileInput = document.getElementById('bim-file-input');
        if (fileInput) {
            fileInput.click();
        }
    }
}
