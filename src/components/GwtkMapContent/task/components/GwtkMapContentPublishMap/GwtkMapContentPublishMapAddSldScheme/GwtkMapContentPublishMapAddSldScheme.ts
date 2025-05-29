import { Component, Prop } from 'vue-property-decorator';
import BaseMapContentView from '../../BaseMapContentView';
import { LOCALE } from '~/types/CommonTypes';
import { DEFAULT_SVG_MARKER_ID } from '~/renderer/SVGrenderer';
import {
    GwtkMapContentTaskState,
    OPEN_SLD_EDITOR,
    SET_SLD_OBJECT_TYPE,
    SldWidgetObject,
    UPDATE_PREVIEW_IMAGE,
    UPDATE_STYLES_ORDER
} from '../../../GwtkMapContentTask';
import Stroke, { StrokeOptions } from '~/style/Stroke';
import Fill, { FillOptions } from '~/style/Fill';
import Hatch, { HatchOptions } from '~/style/Hatch';
import TextStyle, { TextOptions } from '~/style/TextStyle';
import Style from '~/style/Style';
import { BrowserService } from '~/services/BrowserService';
import Draggable from 'vuedraggable';
import Utils from '~/services/Utils';
import GwtkMarkerEditor from './MarkerIconsGallery/GwtkMarkerEditor.vue';
import { MapMarkersCommandsFlags, MarkerIcon, MarkerImageCategory } from '~/types/Types';

type STYLE = 'Stroke' | 'Fill' | 'Hatch';

@Component({ components: { Draggable, GwtkMarkerEditor } })
export default class GwtkMapContentPublishMapAddSldScheme extends BaseMapContentView {


    @Prop({ default: () => ({}) })
    readonly setState!: <K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) => void;

    @Prop({ default: () => ({}) })
    readonly sldObject!: SldWidgetObject;

    @Prop({ default: () => ([]) })
    readonly markerImageList!: MarkerIcon[];

    @Prop({ default: () => ([]) })
    readonly markerCategoryList!: MarkerImageCategory[];

    @Prop({ default: () => ({}) })
    readonly mapMarkersCommands!: MapMarkersCommandsFlags;


    private readonly markerLocalGUID = 'm' + Utils.generateGUID();

    private get availableStyles() {

        switch (this.sldObject.sldObjectType) {
            case LOCALE.Plane:
                return [
                    { text: this.$t('phrases.Filling'), value: 'Fill' },
                    { text: this.$t('phrases.Hatching'), value: 'Hatch' },
                    { text: this.$t('phrases.Line'), value: 'Stroke' }];
            case LOCALE.Line:
                return [{ text: this.$t('phrases.Line'), value: 'Stroke' }];
            case LOCALE.Point:
            case LOCALE.Text:
            default:
                return [];
        }
    }

    private get sldObjectTypeString() {
        let type = 'text';
        if (this.sldObject.sldObjectType === LOCALE.Line) {
            type = 'line';
        } else if (this.sldObject.sldObjectType === LOCALE.Plane) {
            type = 'polygon';
        } else if (this.sldObject.sldObjectType === LOCALE.Point) {
            type = 'marker';
        }
        return type;
    }

    private readonly defaultFillOptions = {
        color: BrowserService.getCssVariableColor('--color-purple-03').color,
        opacity: 1
    };

    private readonly defaultStrokeOptions = {
        color: BrowserService.getCssVariableColor('--v-secondary-base').color,
        opacity: 1
    };

    private readonly defaultTextOptions: TextOptions = {
        color: BrowserService.getCssVariableColor('--color-purple-03').color,
        font: { family: 'Verdana', size: '16px', weight: 'normal' },
        contour: {},
        shadow: {}
    };

    private readonly defaultHatchOptions: HatchOptions = {
        color: BrowserService.getCssVariableColor('--v-secondary-base').color,
        opacity: 1,
        angle: 45,
        step: '7px',
        width: '1px'
    };

    private readonly defaultMarkerId = DEFAULT_SVG_MARKER_ID;

    private version = 1;

    created() {
        this.setGraphicObjectTypeLine();
        this.setState(OPEN_SLD_EDITOR, undefined);
    }

    mounted() {
        const marker = this.sldObject.styleOptions.marker[0]?.marker;
        if (marker) {
            this.changeMarkerType(0);
        }
    }

    get activeTab() {
        let value: number;
        switch (this.sldObject.sldObjectType) {
            case LOCALE.Line:
            case LOCALE.Plane:
            case LOCALE.Point:
            case LOCALE.Text:
                value = this.sldObject.sldObjectType;
                break;
            default:
                value = LOCALE.Line;
        }
        return value;
    }

    get isTypeLine() {
        return this.sldObject.sldObjectType === LOCALE.Line;
    }

    get isTypePolygon() {
        return this.sldObject.sldObjectType === LOCALE.Plane;
    }

    get isTypePoint() {
        return this.sldObject.sldObjectType === LOCALE.Point;
    }

    get isTypeText() {
        return this.sldObject.sldObjectType === LOCALE.Text;
    }

    private setGraphicObjectTypeLine() {
        this.setState(SET_SLD_OBJECT_TYPE, LOCALE.Line);
    }

    private setGraphicObjectTypePolygon() {
        this.setState(SET_SLD_OBJECT_TYPE, LOCALE.Plane);
    }

    private setGraphicObjectTypePoint() {
        this.changeMarkerType(0);

        this.setState(SET_SLD_OBJECT_TYPE, LOCALE.Point);
    }

    private setGraphicObjectTypeText() {
        this.setState(SET_SLD_OBJECT_TYPE, LOCALE.Text);
    }

    private addStyle(style: STYLE) {

        if (this.isTypeLine) {
            if (style === 'Stroke') {
                this.sldObject.styleOptions.line.push(new Style({ stroke: new Stroke(this.defaultStrokeOptions) }));
            }
            return;
        }

        if (style === 'Fill') {
            this.sldObject.styleOptions.polygon.push(new Style({ fill: new Fill(this.defaultFillOptions) }));
        }

        if (style === 'Stroke') {
            this.sldObject.styleOptions.polygon.push(new Style({ stroke: new Stroke(this.defaultStrokeOptions) }));
        }

        if (style === 'Hatch') {
            this.sldObject.styleOptions.polygon.push(new Style({ hatch: new Hatch(this.defaultHatchOptions) }));
        }
        this.setState(UPDATE_PREVIEW_IMAGE, undefined);
    }


    private updateStroke(value: StrokeOptions, index: number) {
        const style = { ...this.sldObject.styleOptions[this.sldObjectTypeString][index], stroke: new Stroke(value) };
        this.sldObject.styleOptions[this.sldObjectTypeString].splice(index, 1, new Style(style));
        this.setState(UPDATE_PREVIEW_IMAGE, undefined);
    }

    private updateFill(value: FillOptions, index: number) {
        const style = { ...this.sldObject.styleOptions.polygon[index], fill: new Fill(value) };
        this.sldObject.styleOptions.polygon.splice(index, 1, new Style(style));
        this.setState(UPDATE_PREVIEW_IMAGE, undefined);
    }

    private updateHatch(value: HatchOptions, index: number) {
        const style = { ...this.sldObject.styleOptions.polygon[index], hatch: new Hatch(value) };
        this.sldObject.styleOptions.polygon.splice(index, 1, new Style(style));
        this.setState(UPDATE_PREVIEW_IMAGE, undefined);
    }

    private updateText(value: TextOptions, index: number) {
        const style = { ...this.sldObject.styleOptions.text[index], text: new TextStyle(value) };
        this.sldObject.styleOptions.text.splice(index, 1, new Style(style));
        this.setState(UPDATE_PREVIEW_IMAGE, undefined);
    }

    private updateOrder({ oldIndex, newIndex }: { oldIndex: number; newIndex: number; }) {
        const listCopy = this.sldObject.styleOptions[this.sldObjectTypeString].slice();
        const oldIndexItem = listCopy.splice(oldIndex, 1)[0];
        listCopy.splice(newIndex, 0, oldIndexItem);
        this.setState(UPDATE_STYLES_ORDER, listCopy);
        this.version++;
    }

    private getTitle(index: number, stroke: any) {
        const style = this.sldObject.styleOptions[this.sldObjectTypeString][index];
        let postfix = '';
        if (style.fill) {
            postfix = this.$t('phrases.Filling') as string;
        } else if (style.stroke) {
            postfix = this.$t('phrases.Line') as string;
        } else if (style.hatch) {
            postfix = this.$t('phrases.Hatching') as string;
        }
        return this.$t('phrases.Style') + ' ' + (index + 1) + (postfix ? ` (${postfix})` : '');
    }

    private changeMarkerType(index: number) {

        const marker = this.sldObject.styleOptions.marker[index].marker;
        if (marker) {
            const defs = this.$refs['graphicTemplatesDefs'] as SVGDefsElement;
            if (defs) {
                const markerAttribute = defs.querySelector('#' + this.markerLocalGUID);
                if (markerAttribute && marker.markerDescription) {
                    const image = marker.markerDescription.image;

                    if (image) {
                        if (image[0] !== '<') {
                            let imageAttribute = markerAttribute.querySelector('image');
                            if (!imageAttribute) {
                                imageAttribute = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                                markerAttribute.appendChild(imageAttribute);
                            }
                            imageAttribute.setAttribute('href', image);
                        } else {
                            const template = document.createElement('template');
                            template.innerHTML = image.trim();

                            const svgImage = template.content.firstChild as SVGImageElement;
                            if (svgImage) {
                                markerAttribute.appendChild(svgImage);
                            }
                        }

                        const { width, height, refX, refY } = marker.markerDescription;

                        if (width !== undefined && height !== undefined && refX !== undefined && refY !== undefined) {
                            markerAttribute.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
                            markerAttribute.setAttribute('refX', refX + '');
                            markerAttribute.setAttribute('refY', refY + '');
                            markerAttribute.setAttribute('markerWidth', width + '');
                            markerAttribute.setAttribute('markerHeight', height + '');
                        }

                        const svg = markerAttribute.querySelector('svg');
                        if (svg) {
                            svg.remove();
                        }
                    }
                }
            }
        }

    }

    private removeStyle(index: number) {
        this.sldObject.styleOptions[this.sldObjectTypeString].splice(index, 1);
        this.setState(UPDATE_PREVIEW_IMAGE, undefined);
    }


    closeSldEditor() {
        this.$emit('close:sldEditor');
    }

    saveSldTemplate() {
        this.$emit('save:sldTemplate');
    }

    resetSldTemplate() {
        this.$emit('reset:sldTemplate');
    }

    dragStart() {
        this.mapVue.getTaskManager().setInternalDragStartFlag(true);
    }

    dragEnd() {
        this.mapVue.getTaskManager().setInternalDragStartFlag(false);
    }
}
