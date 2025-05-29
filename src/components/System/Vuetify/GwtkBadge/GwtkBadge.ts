import { Component, Vue, Prop } from 'vue-property-decorator';

@Component
export default class GwtkBadge extends Vue {

    @Prop( { default: 0 } ) count!: number;

    @Prop( { default: false } ) disabled!: boolean | '';

    get currentColor() {
        return this.disabled === false ? '' : 'var(--v-secondary-lighten5)';
    }

}