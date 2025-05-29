// Функции для тестирования WCS

import WcsService from '~/services/RequestServices/OgcServices/WcsService';
import { ServiceResponse } from '~/services/Utils/Types';

const server = 'http://gisserver.info/GISWebServiceSE/service.php';

function onDataLoaded(response: ServiceResponse<string>) {
    if (response.error) {
        console.warn(response.error);
    } else {
        const elem = document.createElement('div');
        elem.innerText = response.data || '';
        if (elem.innerText.length > 400) {
            elem.innerText = elem.innerText.slice(0, 400);
        }
        document.body.appendChild(elem);
    }
}


(async () => {
    const wcs = new WcsService({ url: server });
    let result = await wcs.getCapabilities();
    onDataLoaded(result);
    result = await wcs.describeCoverage({ COVERAGEID: 'NoginskMatrix' });
    onDataLoaded(result);
    result = await wcs.getCoverage({
        COVERAGEID: 'NoginskMatrix',
        DIMENSIONSUBSETX: 'y(38.24,38.5)',
        DIMENSIONSUBSETY: 'x(55.9,56)'
    });
    onDataLoaded(result);
})();
