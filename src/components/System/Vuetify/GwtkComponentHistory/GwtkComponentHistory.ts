import { Component, Prop } from 'vue-property-decorator';
import Vue from 'vue';

/**
 * Компонент истории поиска
 * @class GwtkComponentHistory
 * @extends Vue
 */
@Component
export default class GwtkComponentHistory extends Vue {

    @Prop({ default: () => [] })
    readonly searchHistory!: { text: string, id: number }[];

}
