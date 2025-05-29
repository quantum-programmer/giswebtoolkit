import { Component, Vue } from 'vue-property-decorator';
import { MapOverlayProps } from '~/MapWindow';


@Component
export default class GwtkMapOverlay extends Vue {
    private searchAppProgressBar = false;
    private handleClose: (() => void) | null = null;

    /**
     * Настроить параметры окна ожидания
     * @method setOverlayParams
     * @param [overlayParams] {MapOverlayProps} Параметры оверлея
     */
    setOverlayParams( overlayParams?: MapOverlayProps ) {
        this.searchAppProgressBar = true;
        if ( overlayParams && overlayParams.handleClose ) {
            this.handleClose = overlayParams.handleClose;
        } else {
            this.handleClose = null;
        }
    }

    /**
     * Закрыть окно
     * @method closeOverlay
     */
    closeOverlay() {
        this.searchAppProgressBar = false;
        if ( this.handleClose ) {
            this.handleClose();
            this.handleClose = null;
        }
    }

}