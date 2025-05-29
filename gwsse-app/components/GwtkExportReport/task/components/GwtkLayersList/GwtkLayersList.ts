/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Виджет списка слоёв                        *
 *                        "Экспорт отчётов"                         *
 *                                                                  *
 *******************************************************************/

import {Component, Prop, Watch} from 'vue-property-decorator';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import Layer from '~/maplayers/Layer';

@Component
export default class GwtkLayersList extends BaseGwtkVueComponent {

    @Prop({default: () => ([])})
    private readonly layerIds!: Layer['id'][];

    @Prop({default: () => ([])})
    private readonly setLayersSelected!: Layer['id'][];

    @Prop({default: false})
    private readonly useLayersFromTemplate!: boolean;

    @Prop({default: () => ([])})
    private readonly layersSelectedFromTemplate!: Layer['id'][];

    @Prop({default: false})
    private readonly disabled!: boolean;

    @Prop({default: false})
    private readonly isVersionTransneft!: boolean;

    protected showLayerList: boolean = false;

    protected checkedLayerIndexes: number[] = [];

    protected layerNames: { [id: string]: Layer['alias']} = {};

    protected filterValue: string = '';

    protected layerIdsFiltered: Layer['id'][] = [];

    protected filteredRaw: string = '';

    protected checkedRaw: string = '';

    get isMalformed(): boolean {
        return this.checkedLayerIndexes.length === 0;
    }

    get checkedLayersRules(): ((v: string) => boolean | string)[] {
        return [
            v => !!v || this.$t('exportReport.Select maps') as string
        ];
    }

    get checkedLayerIds(): Layer['id'][] {
        return this.checkedLayerIndexes.map(index => this.layerIds[index]);
    }

    get filterIsOver(): boolean {
        return this.layerIdsFiltered.length === 0;
    }

    get isAllLayersChecked(): boolean {
        return this.filteredRaw === this.checkedRaw;
    }

    @Watch('filterValue')
    protected setLayersFiltered(): void {
        this.layerIdsFiltered = this.filterLayerIds(this.layerIds);
        this.updateRaws();
    }

    @Watch('layerIds')
    handleLayerIds(): void {
        this.refreshWithNewLayerIds();
        this.updateLayers();
    }

    @Watch('setLayersSelected')
    setLayersChecked(): void {
        this.checkedLayerIndexes = [];
        const layers: Layer[] = [];
        this.layerIds.forEach((layerId, index) => {
            if (this.setLayersSelected.indexOf(layerId) !== -1) {
                this.checkedLayerIndexes.push(index);
                const layer = this.mapVue.getMap().layers.find(layer => layer.id === layerId);
                if (layer) {
                    layers.push(layer);
                }
            }
        });
        this.updateRaws();
        this.$emit('updateLayers', layers);
    }

    created() {
        this.refreshWithNewLayerIds();
        this.updateLayers();
    }

    protected refreshWithNewLayerIds(): void {
        this.setCheckedLayers();
        this.setLayerNames();
        this.setLayersFiltered();
    }

    protected setCheckedLayers(): void {
        this.checkedLayerIndexes = [];
        this.layerIds.forEach((layerId, index) => {
            if (this.mapVue.getMap().layers.find(layer => layer.id === layerId)?.visible) {
                this.checkedLayerIndexes.push(index);
            }
        });
        this.updateRaws();
    }

    protected updateRaws(): void {
        this.$nextTick(() => {
            this.filteredRaw = this.layerIdsFiltered.slice().sort().toString();
            this.checkedRaw = this.checkedLayerIds.slice().sort().toString();
        });
    }

    protected toggleLayerList(): void {
        this.showLayerList = !this.showLayerList || this.isMalformed;
    }

    protected toggleUseLayersFromTemplate(): void {
        this.$emit('toggleUseLayersFromTemplate');
    }

    protected updateLayers(): void {
        const layers: Layer[] = [];
        this.checkedLayerIndexes.forEach(index => {
            const layerId = this.layerIds[index];
            const layer = this.mapVue.getMap().layers.find(layer => layer.id === layerId);
            if (layer) {
                layers.push(layer);
            }
        });
        this.updateRaws();
        this.$emit('updateLayers', layers);
    }

    protected setLayerNames(): void {
        this.layerNames = Object.fromEntries(this.mapVue.getMap().layers.map(layer => [layer.id, layer.alias]));
    }

    protected setFilterValue(value: string): void {
        this.filterValue = value;
    }

    protected filterLayerIds(layerIds: Layer['id'][]): Layer['id'][] {
        const searchText = (this.filterValue || '').trim().toLowerCase();
        if (!searchText) {
            return layerIds;
        }
        return layerIds.filter(layerId => this.layerNames[layerId].toLowerCase().indexOf(searchText) !== -1);
    }

    protected toggleAllLayers(): void {
        const checkedLayerIdsFiltered = this.filterLayerIds(this.checkedLayerIds);
        if (checkedLayerIdsFiltered.length === this.layerIdsFiltered.length && this.checkedLayerIndexes.length === this.layerIdsFiltered.length) {
            this.checkedLayerIndexes = [];
        } else {
            this.checkedLayerIndexes = this.layerIdsFiltered.map(layerId => this.layerIds.indexOf(layerId));
        }

        this.updateRaws();
        this.updateLayers();
    }

    protected isActive(index: number): boolean {
        return this.checkedLayerIndexes.indexOf(index) !== -1;
    }

}
