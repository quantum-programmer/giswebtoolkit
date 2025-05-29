/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                Виджет задачи Построить зону затопления           *
 *                                                                  *
 *******************************************************************/
import { Component, Prop } from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import { TaskDescription } from '~/taskmanager/TaskManager';
import { MapPoint } from '~/geometry/MapPoint';
import {
    BUILD_START,
    DataListItem,
    FLOOD_ZONE_NAME,
    FLOOD_ZONE_WIDTH,
    GwtkBuildFloodZoneTaskState,
    HIGHLIGHT_OBJECT_ACTION,
    LIFT_LEVEL_FIRST,
    LIFT_LEVEL_SECOND,
    NEW_BUILDING,
    SELECTED_FOLDER,
    SELECTED_MATRIX,
    RESET_SELECTION
} from '../task/GwtkBuildFloodZoneTask';


@Component({
    components: {}
})
export default class GwtkBuildFloodZoneWidget extends BaseGwtkVueComponent {

    @Prop({ default: '' })
    private readonly taskId!: string;

    @Prop({ default: () => ({}) })
    private readonly description!: TaskDescription;

    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkBuildFloodZoneTaskState>(key: K, value: GwtkBuildFloodZoneTaskState[K]) => void;

    @Prop({ default: () => ([]) })
    private readonly matrixList!: DataListItem[];

    @Prop({ default: () => ([]) })
    private readonly folderList!: DataListItem[];

    @Prop({ default: 0 })
    private readonly floodZoneWidth!: number;

    @Prop({ default: '' })
    private readonly floodZoneName!: string;

    @Prop({ default: () => ([]) })
    private readonly objectPointsArray!: MapPoint[];

    @Prop({ default: 0 })
    private readonly liftLevelFirst!: number;

    @Prop({ default: 0 })
    private readonly liftLevelSecond!: number;

    @Prop({ default: '' })
    private readonly selectedMatrixId!: string;

    @Prop({ default: '' })
    private readonly selectedFolderId!: string;

    @Prop({ default: 0 })
    private readonly maxPointsCount!: number;

    @Prop({ default: false })
    private readonly isObjectSelected!: boolean;

    @Prop({ default: false })
    private readonly allPointsAreSelected!: boolean;

    @Prop({ default: '' })
    private readonly additionalMessage!: string;

    @Prop({ default: false })
    private readonly isBuilding!: boolean;

    @Prop({ default: true })
    private readonly isComponentConfigured!: boolean;

    @Prop({ default: true })
    private readonly isNewBuilding!: boolean;

    get levelFirst() {
        if (this.liftLevelFirst) {
            return '' + this.liftLevelFirst;
        } else {
            return '';
        }
    }

    set levelFirst(value: string) {
        if (value) {
            this.setState(LIFT_LEVEL_FIRST, value);
        } else {
            this.setState(LIFT_LEVEL_FIRST, undefined);
        }
    }

    get levelSecond() {
        if (this.liftLevelSecond) {
            return '' + this.liftLevelSecond;
        } else {
            return '';
        }
    }

    set levelSecond(value: string) {
        if (value) {
            this.setState(LIFT_LEVEL_SECOND, value);
        } else {
            this.setState(LIFT_LEVEL_SECOND, undefined);
        }
    }

    private changeMatrix(id: string) {
        this.setState(SELECTED_MATRIX, id);
    }

    private changeFolder(id: string) {
        this.setState(SELECTED_FOLDER, id);
    }

    get floodName() {
        if (this.floodZoneName) {
            return '' + this.floodZoneName;
        } else {
            return '';
        }
    }

    set floodName(value: string) {
        if (value) {
            this.setState(FLOOD_ZONE_NAME, value);
        } else {
            this.setState(FLOOD_ZONE_NAME, undefined);
        }
    }

    get floodWidth() {
        if (this.floodZoneWidth) {
            return '' + this.floodZoneWidth;
        } else {
            return '';
        }
    }

    set floodWidth(value: string) {
        if (value) {
            this.setState(FLOOD_ZONE_WIDTH, value);
        } else {
            this.setState(FLOOD_ZONE_WIDTH, undefined);
        }
    }

    get firstPointX() {
        if (this.objectPointsArray.length > 0) {
            const point = this.objectPointsArray[0];
            return '' + point.y;
        }
        return undefined;
    }

    get firstPointY() {
        if (this.objectPointsArray.length > 0) {
            const point = this.objectPointsArray[0];
            return '' + point.x;
        }
        return undefined;
    }

    get secondPointX() {
        if (this.objectPointsArray.length > 1) {
            const point = this.objectPointsArray[this.objectPointsArray.length - 1];
            return '' + point.y;
        }
        return undefined;
    }

    get secondPointY() {
        if (this.objectPointsArray.length > 1) {
            const point = this.objectPointsArray[this.objectPointsArray.length - 1];
            return '' + point.x;
        }
        return undefined;
    }

    get firstPointElevation() {
        if (this.objectPointsArray.length > 0) {
            const point = this.objectPointsArray[0];
            if (point.h > 0) {
                return '' + point.h;
            }
        }
        return undefined;
    }

    get secondPointElevation() {
        if (this.objectPointsArray.length > 1) {
            const point = this.objectPointsArray[this.objectPointsArray.length - 1];
            if (point.h > 0) {
                return '' + point.h;
            }
        }
        return undefined;
    }

    buildStart() {
        this.setState(BUILD_START, undefined);
    }

    newBuilding() {
        this.setState(NEW_BUILDING, undefined);
    }

    cancelClick() {
        this.setState(HIGHLIGHT_OBJECT_ACTION, true);
    }

    get dataReady() {
        return this.liftLevelFirst > 0 && this.liftLevelSecond > 0
            && this.floodZoneWidth > 0 && this.floodZoneName.length > 0
            && this.firstPointElevation !== '' && this.secondPointElevation !== '';
    }

    numberRule = [
        (v: string) => {
            return !(!v || !v.match(/^\d+$/));
        }
    ];

    namesRule = [
        (v: string) => {
            if (!v) return false;
            return v.length > 0;
        }
    ];

    get objectName() {
        if (this.additionalMessage) {
            return ': ' + this.additionalMessage;
        }
        return '';
    }

    private resetSelection() {
        this.setState(RESET_SELECTION, undefined);
    }
}
