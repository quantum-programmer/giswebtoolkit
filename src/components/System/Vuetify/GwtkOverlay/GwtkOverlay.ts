import { Component, Vue, Prop } from 'vue-property-decorator';


@Component
export default class GwtkOverlay extends Vue {

    @Prop( { default: false } ) value!: boolean;

    get closeButton() {
        return !!this.$listeners[ 'close' ];
    }


}