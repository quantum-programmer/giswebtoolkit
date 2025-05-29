import {Component, Prop, Watch} from 'vue-property-decorator';
import {GwtkMapContentTaskState, UPDATE_LAYERS_ORDER} from '@/components/GwtkMapContent/task/GwtkMapContentTask';
import { LayerTreeItemBase, LayerTreeListItems } from '@/components/GwtkMapContent/Types';
import Draggable from 'vuedraggable';
import GwtkMapContentItemMenuWidget
    from '@/components/GwtkMapContent/task/components/ItemMenu/GwtkMapContentItemMenuWidget.vue';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';

@Component({
    components: {
        Draggable,
        GwtkMapContentItemMenuWidget
    }
})
export default class GwtkMapContentOrder extends BaseGwtkVueComponent {

    //TODO set active mode for tree and save state for recovering
    @Prop({ default: () => ({}) })
    private readonly setState!: <K extends keyof GwtkMapContentTaskState>(key: K, value: GwtkMapContentTaskState[K]) => void;

    @Prop({ default: () => ([]) })
    private readonly dynamicLabelData!: {
        id: string;
        dynamicLabel: boolean;
    }[];

    @Prop({ default: () => ([]) })
    readonly menuListItems!: any[];

    @Prop({ default: () => ([]) })
    private readonly listItems!: LayerTreeListItems;

    @Prop({ default: 0 })
    private readonly ver!: number;

    @Prop({ default: false })
    private readonly isUserLogged!: boolean;

    @Prop({ default: undefined })
    private readonly userLogin!: string | undefined;

    private xIdMoved: string = '';

    readonly draggableIdList = this.listItems.map((item) => item.id);

    @Watch('ver')
    onVerUpdate() {
        this.$forceUpdate();
    }

    updateOrder() {
        this.setState(UPDATE_LAYERS_ORDER, {
            viewOrder: this.draggableIdList.slice().reverse(),
            xIdMoved: this.xIdMoved
        });
    }

    change(item: { moved: { element: string, oldIndex: number, newIndex: number } }) {
        this.xIdMoved = item.moved.element;
    }

    getLayerVisibility(id: string) {
        const layer = this.mapVue.getMap().tiles.getLayerByxId(id) || this.mapVue.getMap().getVectorLayerByxId(id);
        return layer && layer.visible;
    }

    toggleLayerVisibility(item: LayerTreeItemBase) {
        const layer = this.mapVue.getMap().tiles.getLayerByxId(item.id) || this.mapVue.getMap().getVectorLayerByxId(item.id);
        if (layer) {
            this.mapVue.getMap().setLayerVisibility(layer, !layer.visible);
            this.onVerUpdate();
        }
    }

    dragStart() {
        this.mapVue.getTaskManager().setInternalDragStartFlag(true);
    }
    dragEnd() {
        this.mapVue.getTaskManager().setInternalDragStartFlag(false);
    }
}
