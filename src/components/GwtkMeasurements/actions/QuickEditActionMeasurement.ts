/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Обработчик редактирования объекта                *
 *                                                                  *
 *******************************************************************/
import GwtkMeasurementsTask from '@/components/GwtkMeasurements/task/GwtkMeasurementsTask';
import {
    PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR,
    PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY,
    WorkspaceValues
} from '~/utils/WorkspaceManager';
import Style from '~/style/Style';
import Stroke from '~/style/Stroke';
import Fill from '~/style/Fill';
import PointEditAction from '~/systemActions/PointEditAction';
import SVGrenderer from '~/renderer/SVGrenderer';


/**
 * Обработчик редактирования точек объекта измерения
 * @class QuickEditActionMeasurement
 * @extends PointEditAction
 */
export default class QuickEditActionMeasurement extends PointEditAction<GwtkMeasurementsTask> {

    setup() {
        super.setup();
        this.updateStyle();
    }

    onWorkspaceChanged( type: keyof WorkspaceValues ) {
        if ( [PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR, PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR, PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY].indexOf( type ) !== -1 ) {
            this.updateStyle();
        }
    }

    onPreRender( renderer: SVGrenderer ) {
        if ( this.currentMultiPointObject.isDirty ) {
            this.currentMultiPointObject.isDirty = false;
            this.map.requestRender();
        }
    }

    onPostRender( renderer: SVGrenderer ) {
        if ( this.currentObject ) {
            this.map.mapObjectsViewer.drawMapObject( renderer, this.currentMultiPointObject );

            if ( this.hoverObject ) {
                this.map.mapObjectsViewer.drawMapObject( renderer, this.hoverObject, this.hoverObjectStyle );
            }

            this.map.mapObjectsViewer.drawMapObject( renderer, this.editPointObject );
        }
    }

    onWorkspaceReset() {
        this.updateStyle();
    }

    private updateStyle() {
        this.currentObjectStyle = new Style( {
            stroke: new Stroke( {
                color: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_LINE_COLOR ),
                width: '2px',
                linejoin: 'round'
            } ),
            fill: new Fill( {
                color: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_FILL_COLOR ),
                opacity: this.map.workspaceManager.getValue( PROJECT_SETTINGS_MEASUREMENT_STYLE_OPACITY )
            } )
        } );

        this.map.requestRender();
    }
}
