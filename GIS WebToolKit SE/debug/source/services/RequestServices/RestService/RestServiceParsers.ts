import { Legend, LEGEND_NODE_TYPE, LegendLeafNode } from '~/types/Types';
import { ParseTextToXml } from '~/services/Utils/XMLDoc';
import { LOCALE } from '~/types/CommonTypes';

export default class RestServiceParsers {
    /**
     * Разобрать ответ запроса легенды классификатора
     * @private
     * @method parseLegendResponse
     * @return {Legend | null} Легенда классификатора или `null`
     */
    static parseLegendResponse(response: string, serviceUrl: string, idLayer: string): Legend | undefined {

        const xmlDoc = ParseTextToXml(response);
        const MapLegend = xmlDoc.children[0];

        if (!MapLegend || (MapLegend.tag.toLowerCase() != 'maplegend' && MapLegend.tag.toLowerCase() != 'matrixlegend')) {
            return;
        }

        const imgPath = MapLegend.attributes['ImgPath'];
        if (!imgPath)
            return;

        const legend: Legend = {
            nodes: []
        };

        const imageRequestUrl = serviceUrl + '?SERVICE=WFS&METHOD=GetLegend&LAYER=' + encodeURIComponent(idLayer) + '&FILEPATH=' + encodeURIComponent(imgPath);

        if (MapLegend.tag.toLowerCase() === 'maplegend') {

            MapLegend.children.forEach(mapLegendLayerItem => {

                const key = mapLegendLayerItem.tag;
                const text = mapLegendLayerItem.attributes['Description'] || '';
                const nodes: LegendLeafNode[] = [];

                mapLegendLayerItem.children.forEach(mapLegendObjectItem => {
                    const code = parseInt(mapLegendObjectItem.attributes['Code']);
                    const key = mapLegendObjectItem.attributes['Key'];
                    const local = parseInt(mapLegendObjectItem.attributes['Local']);
                    const text = mapLegendObjectItem.attributes['Description'] || '';
                    const type = LEGEND_NODE_TYPE.Leaf;
                    let image = imageRequestUrl + mapLegendObjectItem.attributes['Image'];
                    image = image.replace(/\\/g, '/');
                    nodes.push({ key, text, code, local, image, type });
                });

                const type = LEGEND_NODE_TYPE.Branch;
                legend.nodes.push({ key, text, nodes, type });
            });
        } else {
            const key = 'matrixlegendroot';
            const text = '';
            const nodes: LegendLeafNode[] = [];

            MapLegend.children.forEach(mapLegendLayerItem => {
                const key = mapLegendLayerItem.attributes['Number'];
                const text = mapLegendLayerItem.attributes['Description'] || '';
                const type = LEGEND_NODE_TYPE.Leaf;
                let image = imageRequestUrl + mapLegendLayerItem.attributes['Image'];
                image = image.replace(/\\/g, '/');
                nodes.push({ key, text, code: +key, local: LOCALE.Plane, image, type });
            });
            const type = LEGEND_NODE_TYPE.Branch;
            legend.nodes.push({ key, text, nodes, type });
        }

        return legend;
    }
}
