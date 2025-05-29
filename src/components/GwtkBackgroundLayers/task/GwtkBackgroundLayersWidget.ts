import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import {Component, Prop} from 'vue-property-decorator';
import {TaskDescription} from '~/taskmanager/TaskManager';
import {
    BackgroundLayer,
    GwtkBackgroundLayersTaskState,
    SET_ACTIVE_LAYER,
    SET_ACTIVE_LAYER_OPACITY
} from './GwtkBackgroundLayersTask';


@Component
export default class GwtkBackgroundLayersWidget extends BaseGwtkVueComponent {
    @Prop({default: ''})
    private readonly taskId!: string;

    @Prop({default: () => ({})})
    private readonly description!: TaskDescription;

    @Prop({default: () => ({})})
    private readonly setState!: <K extends keyof GwtkBackgroundLayersTaskState>(key: K, value: GwtkBackgroundLayersTaskState[K]) => void;

    @Prop({default: () => ([])})
    private readonly backgroundLayers!: BackgroundLayer[];

    @Prop({default: () => ''})
    private readonly imageByDefault!: string;

    @Prop({default: () => 100})
    private readonly opacity!: number;

    private toggleItem(item: BackgroundLayer) {
        this.setState(SET_ACTIVE_LAYER, item);
    }

    private getImage(item: BackgroundLayer) {
        if (item.image) {
            return item.image;
        }
        return this.imageByDefault;
    }

    private get currentOpacity() {
        return this.opacity;
    }

    private get opacityLabel(): string {
        return this.opacity.toFixed(0) + ' %';
    }

    private setActiveLayerOpacity(value: number) {
        this.setState(SET_ACTIVE_LAYER_OPACITY, value);
    }

    private get activeBackground() {
        return this.backgroundLayers.find(item => item.active);
    }
}
