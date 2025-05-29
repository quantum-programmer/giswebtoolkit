import GISWebServerSEService from './service/GISWebServerSEService';
import AppWindow from './AppWindow';


export default (async function () {
    const response = await new GISWebServerSEService().getAppParams();

    const json = response.data;

    if (!json || typeof json === 'string') {
        AppWindow.closeLoadingScreen();

        const errorDiv = document.createElement('div');

        errorDiv.style.margin = '24px';
        errorDiv.style.padding = '12px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.border = '2px solid red';
        errorDiv.style.borderRadius = '4px';

        errorDiv.innerHTML = json || 'Error requesting app parameters!';
        document.body.innerHTML = errorDiv.outerHTML;
        return;
    }

    (window as any).theMapVue = new AppWindow(
        'dvMap',
        json.options,
        {
            ...json.appParams,
            keyFlag: true,
            counters: json.settings.counters,
            sess_updatekey: json.settings.sess_updatekey
        },
        json.projectsList);
})();
