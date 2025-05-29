import Vue from 'vue';
import Vuetify from 'vuetify';
////Do not use this import while using scss variables
// import 'vuetify/dist/vuetify.min.css';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import { Iconfont } from 'vuetify/types/services/icons';

Vue.use( Vuetify );


const opts = {
    icons: {
        iconfont: 'mdi' as Iconfont,
    },
    theme: {
        options: { customProperties: true }
    },
};

export default new Vuetify( opts );
