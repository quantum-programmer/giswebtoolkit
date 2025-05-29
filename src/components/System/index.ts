import './Vuetify';
import { GwtkInfoDialog } from './GwtkInfoDialog';
import { GwtkInputTextDialog } from './GwtkInputTextDialog';
import { GwtkMapOverlay } from './GwtkMapOverlay';
import { GwtkMapSnackBar } from './GwtkMapSnackBar';
import * as appContainers from './AppContainers';
import { VueConstructor } from 'vue';

const GwtkSystem = {
    install(vue: VueConstructor) {
        if (appContainers) {
            let key: keyof typeof appContainers;
            for (key in appContainers) {
                const component = appContainers[key] as VueConstructor;
                if (component) {
                    vue.component(key, component);
                }
            }
        }
        vue.component( 'GwtkInfoDialog', GwtkInfoDialog );
        vue.component( 'GwtkInputTextDialog', GwtkInputTextDialog );
        vue.component( 'GwtkMapOverlay', GwtkMapOverlay );
        vue.component( 'GwtkMapSnackBar', GwtkMapSnackBar );
    }
};

export default GwtkSystem;
