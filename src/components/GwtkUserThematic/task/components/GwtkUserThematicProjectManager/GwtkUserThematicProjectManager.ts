/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *       Виджет компонента "Менеджер проектов картограммы"          *
 *                                                                  *
 *******************************************************************/

import { Component, Prop, Vue } from 'vue-property-decorator';
import {
    GwtkUserThematicTaskState,
    ADD_THEMATIC_PROJECT_FROM_FILE,
    CREATE_THEMATIC_PROJECT,
    EDIT_THEMATIC_PROJECT_NAME,
    EXPORT_THEMATIC_PROJECT_LIST,
    REMOVE_THEMATIC_PROJECT_FROM_LIST,
    SET_THEMATIC_PROJECT
} from '../../GwtkUserThematicTask';

/**
 * Компонент "Менеджер проектов картограммы"
 * @class GwtkUserThematicProjectManager
 * @extends Vue
 */
@Component
export default class GwtkUserThematicProjectManager extends Vue {
    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkUserThematicTaskState>( key: K, value?: GwtkUserThematicTaskState[K] ) => void;

    @Prop( { default: () => [] } )
    private readonly buildParameterList!: { id: string, text: string }[];

    @Prop( { default: () => [] } )
    private readonly projectNamesList!: string[];

    @Prop( { default: 0 } )
    private readonly projectSelectedIndex!: number;

    @Prop( { default: false } )
    private readonly isReducedSizeInterface!: boolean;

    private projectClickedIndex: number = 0;

    private exportOverlay = false;

    private projectSelectedList: boolean[] = [];

    private projectListNameDefault = this.$t( 'userthematic.Project bank' ) + '';

    created() {
        this.projectClickedIndex = -1;
    }

    private toggleExportDots() {
        this.exportOverlay = !this.exportOverlay;
        this.projectNamesList.forEach( () => {
            this.projectSelectedList.push( true );
        } );
    }

    private toggleExport() {
        this.setState( EXPORT_THEMATIC_PROJECT_LIST, {
            selectedList: this.projectSelectedList,
            name: this.projectListNameDefault
        } );
        this.exportOverlay = false;
    }

    private toggleCreate() {
        this.setState( CREATE_THEMATIC_PROJECT );
    }

    private toggleAddProjectFromFile() {
        this.setState( ADD_THEMATIC_PROJECT_FROM_FILE );
    }

    private toggleSelectProject() {
        this.setState( SET_THEMATIC_PROJECT, this.projectClickedIndex );
        this.$emit( 'goBack' );
        this.projectClickedIndex = -1;
    }

    private setProjectSelectedIndex( index: number ) {
        this.projectClickedIndex = index;
    }

    private toggleEditProject( index: number ) {
        this.setState( EDIT_THEMATIC_PROJECT_NAME, index );
    }

    private toggleRemoveProject( index: number ) {
        this.setState( REMOVE_THEMATIC_PROJECT_FROM_LIST, index );
    }

    private get selectAllValue() {
        let res = true;
        this.projectSelectedList.forEach( ( item ) => {
            res = res && item;
        } );

        return res;
    }

    private set selectAllValue( value: boolean ) {
        this.projectSelectedList.forEach( ( item, index ) => {

            if ( value ) {
                this.projectSelectedList.splice( index, 1, true );
            } else {
                this.projectSelectedList.splice( index, 1, false );
            }
        } );

    }

    private get exportEnabled() {
        let res = false;
        this.projectSelectedList.forEach( ( item, index ) => {
            res = res || item;
        } );

        return (res && this.projectListNameDefault);
    }

    private get selectEnabled() {
        return (this.projectClickedIndex >= 0 && this.projectNamesList.length && this.projectClickedIndex !== this.projectSelectedIndex);
    }

}
