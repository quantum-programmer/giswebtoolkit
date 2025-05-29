import Vue from 'vue';
import VueI18n, { DateTimeFormat } from 'vue-i18n';

import en from './locale/en-us.json';
import ru from './locale/ru-ru.json';
import es from './locale/es-es.json';
import ua from './locale/ua-ua.json';
import vivn from './locale/vi-vn.json';

Vue.use( VueI18n );

const messages = {
    'en-us': en,
    'ru-ru': ru,
    'es-es': es,
    'ua-ua': ua,
    'vi-vn': vivn,
};

const dateTimeFormats = {
    'en-us': en.dateTimeFormats as DateTimeFormat,
    'ru-ru': ru.dateTimeFormats as DateTimeFormat,
    'es-es': es.dateTimeFormats as DateTimeFormat,
    'ua-ua': ua.dateTimeFormats as DateTimeFormat,
    'vi-vn': vivn.dateTimeFormats as DateTimeFormat,
};

export default new VueI18n( {
    locale: 'ru-ru',// set locale
    fallbackLocale: 'en-us', // set fallback locale
    messages, // set locale messages,
    dateTimeFormats
} );