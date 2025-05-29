import {Component, Prop} from 'vue-property-decorator';
import Utils from '~/services/Utils';
import BaseGwtkVueComponent from '@/components/System/BaseGwtkVueComponent';
import i18n from '@/plugins/i18n';
import AppWindow, {Project} from './AppWindow';
import {CommonAppParams} from './Types';


@Component
export default class App extends BaseGwtkVueComponent {

    private mapDivId = Utils.generateGUID();

    @Prop({default: () => null})
    appParams!: CommonAppParams;

    counters = '';

    project: Project | null = null;

    logo = '';

    version = '1';

    get dbHref() {
        return window.location.href.split('/').slice(0, window.location.href.split('/').length - 2).join('/') + this.appParams.geoDB.url;
    }

    get userName() {
        return (this.appParams.enterLink || '') + (this.appParams.userName || '');
    }

    created() {
        App.controlCookies();

        this.logo = this.appParams.logo || '';

        document.title = this.appParams.title;

        (this.mapVue as AppWindow).onInitMap((map) => {
            const options = map.options;
            const projectsList = (this.mapVue as AppWindow).projectsList;
            if (projectsList) {
                this.project = projectsList.projects?.find(proj => proj.id == +options.id) || null;
            }

            if (this.project) {
                document.title = this.project.text + ' - GIS WebServer SE ' + this.appParams.version;
            }

            if (this.appParams.counters) {
                this.counters = this.appParams.counters;
            }

            this.version = this.appParams.version;
        });
    }

    /**
     * Проверка доступности Cookies
     * @method controlCookies
     */
    private static controlCookies() {
        if (!navigator.cookieEnabled) {
            alert(`${i18n.tc('gwsse.Error')}! ${i18n.tc('gwsse.Cookies disabled')}!\n${i18n.tc('gwsse.Cookies must be enabled for application work properly')}!`);
        }
    }


}
