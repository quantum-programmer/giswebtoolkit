/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                    Виджет компонента                             *
 *               "Построение тепловой карты"                        *
 *                                                                  *
 *******************************************************************/

import { Component, Prop } from 'vue-property-decorator';
import {TaskDescription} from '~/taskmanager/TaskManager';
import {
    GwtkProjectsState,
    CLICK_FILE_TREE,
    CLICK_ON_BACK,
    CLICK_ON_PROJECT
} from './GwtkProjectsTask';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { ProjectsList, Project } from '../../../AppWindow';


const DEFAULT_PROJECT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAI0AAABlCAYAAABwSWBKAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAH0SURBVHgB7dzdahNRFIbhlZ8WoxWsID0TvZPeubchCDUUa4hNiLFqbdpkbMCDKtrmQ3Iw5HmuYBje2WsxB7vz/vLyVcGGXg8Gw87Hi9WbpmmOCzbQ7XSPuwUh0RATDTHREBMNMdEQEw0x0RATDTHREBMNMdEQEw0x0RATDTHREBMNMdEQEw0x0RATDTHREBMNMdEQEw0x0RATDbF+tdDJaFLT+bf6X0eHT+vl0fMis9MnzXh2UZP51yKz8+Pp9NOsrq5vis3tfDTL5areno5ruVoVm7EI31rcnjRn55+LzYjml/V+M559KR4mmjvOJvP6frUo7ieaO9b7zbsP5/abB4jmD+v95mQ0Lf6tlT/3Hu/v1c2TQW1Ls2pqNN3+fvPi2UH1e+37blsZTa/Xq71+r7bpx+K6+DvjiZhoiImGmGiIiYaYaIiJhphoiImGmGiIiYaYaIiJhphoiImGmGiIiYaYaIiJhphoiImGmGiIiYaYaIiJhphoiImGmGiIiYaYaIiJhphoiLXyUqN+v1eP9lv56L/pdjvVRq1884cHg6qD7V2fxv2MJ2KiISYaYqIhJhpioiEmGmKiISYaYqIhJhpioiEmGmKiISYaYqIhJhpioiEmGmKiISYaYqIhJhpioiEmGmKiIdZvmmZYTQ0LNtGp+gkiW1U0TCqKnQAAAABJRU5ErkJggg==';

/**
 * Виджет компонента
 * @class GwtkProjectsWidget
 * @extends Vue
 */
@Component
export default class GwtkProjectsWidget extends BaseGwtkVueComponent {

    @Prop( { default: '' } )
    private readonly taskId!: string;

    @Prop( { default: () => ({}) } )
    private readonly description!: TaskDescription;

    @Prop( { default: () => ({}) } )
    private readonly setState!: <K extends keyof GwtkProjectsState>( key: K, value: GwtkProjectsState[K] ) => void;

    @Prop( { default: () => ([]) } )
    private readonly itemsTree!: [{ nodes: [{ id: string }] }];

    @Prop( { default: () => ([]) } )
    private readonly projectList!: ProjectsList['projects'];

    @Prop( { default: '' } )
    private readonly activeProjectId!: string;

    @Prop( { default: false } )
    private readonly selectedFileTree!: boolean;

    private errorMessage = '';
    private projectNumber = '';
    private plist = false;

    created() {
        if ( !this.projectList ) {
            this.errorMessage = this.$t( 'projects.Component settings not set' ).toString();
            this.plist = true;
        }
    }

    get selectedProject() {
        return this.projectList?.find(project=>project.id===+this.projectNumber);
    }

    private clickFileTree( id: string ) {
        this.setState( CLICK_FILE_TREE, id );
        this.projectNumber = id;
    }

    private clickOnBack() {
        this.projectNumber = '';
        this.setState( CLICK_ON_BACK, 'clickOnBack' );
    }

    private clickOnProject( value: string ) {
        if ( value !== this.activeProjectId ) {
            this.setState( CLICK_ON_PROJECT, value );
        }
    }

    private clickOnSelectButton() {
        this.clickOnProject( this.projectNumber );
        this.clickOnBack();
    }

    private createImageSource( project: Project ): string {
        const { type, content } = project.image;
        if ( !type || !content ) {
            return DEFAULT_PROJECT_IMAGE;
        } else {
            return `data:${type};base64,${content}`;
        }
    }
}
