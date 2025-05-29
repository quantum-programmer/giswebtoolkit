import RosreestrSearcherBase from '~/services/Search/mappers/RosreestrMapper/Searchers/RosreestrSearcherBase';
import { RosreestrLoadedData } from '~/services/Search/mappers/RosreestrMapper/Types';
import { RosreestrQueryType } from '~/services/Search/mappers/RosreestrMapper/RosreestrMapper';


export default class RosreestrCoordSearcher extends RosreestrSearcherBase {

    protected getQueryType(text: string): RosreestrQueryType {
        return RosreestrQueryType.LAND_DISTRICT;
    }

    async search(): Promise<RosreestrLoadedData> {
        let requestForType: RosreestrQueryType[];
        const rosreestrMinType = +this.params.typeRosreestrObject;

        switch (rosreestrMinType) {
            case RosreestrQueryType.CCO:
                requestForType = [RosreestrQueryType.CCO];
                break;
            case RosreestrQueryType.LAND_LOT:
                requestForType = [RosreestrQueryType.LAND_LOT];
                break;
            case RosreestrQueryType.LAND_QUARTER:
                requestForType = [RosreestrQueryType.LAND_QUARTER];
                break;
            case RosreestrQueryType.LAND_AREA:
                requestForType = [RosreestrQueryType.LAND_AREA];
                break;
            case RosreestrQueryType.LAND_DISTRICT:
                requestForType = [RosreestrQueryType.LAND_DISTRICT];
                break;
            case RosreestrQueryType.BOUNDARY:
                requestForType = [RosreestrQueryType.BOUNDARY];
                break;
            case RosreestrQueryType.USE_RESTRICTED_ZONE:            // ЗОУИТы
                requestForType = [RosreestrQueryType.USE_RESTRICTED_ZONE, RosreestrQueryType.TERRITORIAL_AREA, RosreestrQueryType.FORESTRY, RosreestrQueryType.FREE_ECONOMIC_ZONE, RosreestrQueryType.SPECIALLY_NATURAL_AREA];
                break;
            case RosreestrQueryType.TERRITORIAL_AREA:               // Территориальные зоны
                requestForType = [RosreestrQueryType.TERRITORIAL_AREA, RosreestrQueryType.FORESTRY, RosreestrQueryType.FREE_ECONOMIC_ZONE, RosreestrQueryType.SPECIALLY_NATURAL_AREA, RosreestrQueryType.USE_RESTRICTED_ZONE];
                break;
            case RosreestrQueryType.FORESTRY:                       // Лесничества и лесопарки
                requestForType = [RosreestrQueryType.FORESTRY, RosreestrQueryType.FREE_ECONOMIC_ZONE, RosreestrQueryType.SPECIALLY_NATURAL_AREA, RosreestrQueryType.USE_RESTRICTED_ZONE, RosreestrQueryType.TERRITORIAL_AREA];
                break;
            case RosreestrQueryType.SPECIALLY_NATURAL_AREA:         // Особо охраняемые природные территории
                requestForType = [RosreestrQueryType.SPECIALLY_NATURAL_AREA, RosreestrQueryType.FREE_ECONOMIC_ZONE, RosreestrQueryType.USE_RESTRICTED_ZONE, RosreestrQueryType.TERRITORIAL_AREA, RosreestrQueryType.FORESTRY];
                break;
            case RosreestrQueryType.FREE_ECONOMIC_ZONE:             // Свободные экономические зоны
                requestForType = [RosreestrQueryType.FREE_ECONOMIC_ZONE, RosreestrQueryType.USE_RESTRICTED_ZONE, RosreestrQueryType.TERRITORIAL_AREA, RosreestrQueryType.FORESTRY, RosreestrQueryType.SPECIALLY_NATURAL_AREA];
                break;
            default:
                requestForType = [
                    RosreestrQueryType.CCO,
                    RosreestrQueryType.LAND_LOT,
                    RosreestrQueryType.LAND_QUARTER,
                    RosreestrQueryType.LAND_AREA,
                    RosreestrQueryType.LAND_DISTRICT,
                    RosreestrQueryType.BOUNDARY,
                    RosreestrQueryType.USE_RESTRICTED_ZONE,             // ЗОУИТы
                    RosreestrQueryType.TERRITORIAL_AREA,                // Территориальные зоны
                    RosreestrQueryType.FORESTRY,                        // Лесничества и лесопарки
                    RosreestrQueryType.SPECIALLY_NATURAL_AREA,          // Особо охраняемые природные территории
                    RosreestrQueryType.FREE_ECONOMIC_ZONE               // Свободные экономические зоны
                ];
                break;
        }
        if (this.fullSearch) {
            for (const type of requestForType) {
                const result = await this.fetchDetailedData(type, this.text, this.params);
                if (result.data && result.data.length > 0) {
                    return result;
                }
            }
        } else {
            for (const type of requestForType) {
                const result = await this.fetchData(type, this.text, this.params);
                if (result.data && result.data.length > 0) {
                    return result;
                }
            }
        }

        return { data: [] };
    }

}
