import Layer from '~/maplayers/Layer';

export function isLayerServiceSupported(layer: Layer): boolean {
    let services: string[] = layer.map.options.controlsdata?.exportReport?.services || [];
    if (services[0] === '') {
        services.shift();
    }

    if (services.indexOf(layer.map.options.url) === -1) {
        services.push(layer.map.options.url);
    }

    for (const serviceUrl of services) {
        if (layer.serviceUrl.toLowerCase().indexOf(serviceUrl.toLowerCase()) !== -1) {
            return true;
        }
    }
    return false;
}
