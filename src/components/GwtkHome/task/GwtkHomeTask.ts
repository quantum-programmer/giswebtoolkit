/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                       Задача "Домой"                             *
 *                                                                  *
 *******************************************************************/

import Task from '~/taskmanager/Task';
import { GwtkComponentDescriptionPropsData } from '~/types/Types';
import MapWindow from '~/MapWindow';
import GwtkHomeMain from '@/components/GwtkHome/task/GwtkHomeMain.vue';
import { ContentTree } from '~/types/Options';
import { GISWebServiceSEMode, SourceType } from '~/services/Search/SearchManager';
import RequestServices, { ServiceType } from '~/services/RequestServices';
import { SimpleJson } from '~/types/CommonTypes';


export const SELECT_CATEGORY = 'gwtkhome.selectcategory';
export const SELECT_SUB_CATEGORY = 'gwtkhome.selectsubcategory';
export const TOGGLE_FILTER_ITEM = 'gwtkhome.togglefilteritem';
export const TOGGLE_ALL_FILTER_ITEMS = 'gwtkhome.toggleallfilteritems';

export type GwtkHomeTaskState = {
    [SELECT_CATEGORY]: string;
    [SELECT_SUB_CATEGORY]: string;
    [TOGGLE_FILTER_ITEM]: { id: string; itemId: string; };
    [TOGGLE_ALL_FILTER_ITEMS]: { id: string; selectAll: boolean; };
};

export type Category = {
    id: string;
    alias: string;
    color: string;
    icon: string;
    items: SubCategory[];
}

export type SubCategory = {
    id: string;
    alias: string;
    filter: SubCategoryFilterItem[];
    disabled?: true;
}

type SubCategoryFilterItem = {
    id: string;
    alias: string;
    selected: boolean;
    nodes?: string[];
}


type HelpServerAnswer = {
    haveQuestion: {
        recid: string;
        question: string;
        answer: string;
    }[ ];
    usefulTelephones: {
        recid: string;
        title: string;
        phone: string;
        mail: string;
    }[ ]
};

type SubCategorySelected = { idLayer: string, selected: boolean };

type WidgetParams={
    setState: GwtkHomeTask['setState'];
    selectedCategory: Category | null;
    categories: Category[];
};

/**
 * Команда создания компонента
 * @class GwtkHomeTask
 * @extends Task
 */
export default class GwtkHomeTask extends Task {

    subCategorySelected: SubCategorySelected[] = [];

    /**
     * Параметры виджета
     * @private
     * @readonly
     * @property widgetProps {GwtkComponentDescriptionPropsData & WidgetParams}
     */
    private readonly widgetProps: GwtkComponentDescriptionPropsData & WidgetParams;


    protected workspaceData?: { subCategorySelected: SubCategorySelected[] };

    /**
     * @constructor GwtkHomeTask
     * @param mapWindow {MapWindow} Экземпляр окна карты
     * @param id {string} Идентификатор задачи
     */
    constructor(mapWindow: MapWindow, id: string) {
        super(mapWindow, id);

        // Создание Vue компонента
        this.widgetProps = {
            taskId: this.id,
            description: this.mapWindow.getTaskManager().getTaskDescription(this.id),
            setState: this.setState.bind(this),
            selectedCategory: null,
            categories: [
                {
                    id: 'learnMore',
                    alias: 'rgis.To learn more',
                    color: 'var(--color-orange)',
                    icon: 'rgis/icons/learn-more',
                    items: []
                },
                {
                    id: 'B199699E-E313-4FE9-A6C0-1983E41FE888',
                    alias: 'rgis.Social sphere',
                    color: 'var(--color-blue-light-01)',
                    icon: 'rgis/icons/user',
                    items: []
                },
                {
                    id: '97D9AD77-C5D7-4D11-BA80-6C60998902ED',
                    alias: 'rgis.Road facilities',
                    color: 'var(--color-blue-light-02)',
                    icon: 'rgis/icons/bus',
                    items: []
                },
                {
                    id: 'D75950E2-9DB6-49F9-9ED2-255B8B0BF58A',
                    alias: 'rgis.Boundaries',
                    color: 'var(--color-violet-light)',
                    icon: 'rgis/icons/boundaries',
                    items: []
                },
                {
                    id: 'A39E6C5F-E6ED-4B62-A323-0DDC2F375236',
                    alias: 'rgis.Finance',
                    color: 'var(--color-blue-dark)',
                    icon: 'rgis/icons/finance',
                    items: []
                },
                {
                    id: '9725EACE-7973-4060-97B8-1DBB4098287A',
                    alias: 'rgis.National projects',
                    color: 'var(--color-orange)',
                    icon: 'rgis/icons/national-projects',
                    items: []
                },
                {
                    id: '194D6430-F484-41DF-9F09-E6EE42B49A1D',
                    alias: 'rgis.Tele-communications',
                    color: 'var(--color-violet-dark-02)',
                    icon: 'rgis/icons/laptop',
                    items: []
                },
                {
                    id: '99516D18-B763-4775-95EB-5D82ABE8096F',
                    alias: 'rgis.Investment platforms',
                    color: 'var(--color-violet-dark-01)',
                    icon: 'rgis/icons/toolbox',
                    items: []
                },

                {
                    id: 'route',
                    alias: 'rgis.Route',
                    color: 'var(--color-violet-light)',
                    icon: 'rgis/icons/route',
                    items: []
                },
                {
                    id: 'beekeeper',
                    alias: 'beekeeper.Description of the apiary',
                    color: 'var(--color-violet-dark-02)',
                    icon: 'rgis/icons/beekeeper',
                    items: []
                },
                {
                    id: 'plantBreeder',
                    alias: 'plantbreeder.Processing of NWR-fields',
                    color: 'var(--color-orange)',
                    icon: 'rgis/icons/planbreeder',
                    items: []
                },
                {
                    id: 'help',
                    alias: 'rgis.Help, tips',
                    color: 'var(--color-blue-light-02)',
                    icon: 'rgis/icons/rgis-help',
                    items: [
                        {
                            id: 'haveQuestion',
                            alias: 'rgis.Have a question',
                            filter: []
                        },
                        {
                            id: 'usefulTelephones',
                            alias: 'rgis.Useful telephones',
                            filter: []
                        }
                    ]
                }
            ]
        };
    }

    createTaskPanel() {

        // регистрация Vue компонента
        const nameMainWidget = 'GwtkHomeMain';
        const sourceMainWidget = GwtkHomeMain;
        this.mapWindow.registerComponent(nameMainWidget, sourceMainWidget);

        // Создание Vue компонента
        this.mapWindow.createFullScreenWidget(nameMainWidget, this.widgetProps);

        // Помещаем в список удаления после деактивации
        this.addToPostDeactivationList(this.widgetProps);
        this.mapWindow.getTaskManager().detachTask('gwtkmapobject.main');

    }

    setup() {
        super.setup();

        const contentTree = this.map.options.contenttree;
        const layers = this.map.tiles.getWmsLayers();
        if (this.workspaceData?.subCategorySelected) {
            this.subCategorySelected = this.workspaceData.subCategorySelected;
        }
        this.widgetProps.categories.forEach(category => {

            const categoryNode = contentTree.find((item) => item.id === category.id);

            if (categoryNode && categoryNode.nodes) {

                categoryNode.nodes.forEach(subCategoryNode => {

                    const subCategory: SubCategory = {
                        id: subCategoryNode.id,
                        alias: subCategoryNode.text,
                        filter: []
                    };

                    if (subCategoryNode.nodes) {
                        if (subCategoryNode.nodes.length === 0) {
                            subCategory.disabled = true;
                        } else if (subCategoryNode.id !== 'E52E0AFB-7CE6-4E4D-B02C-88DB067FAF79') {
                            const layerFilterItems: SubCategoryFilterItem[] = [];
                            this.fillLayerFilterItemsFromNode(subCategoryNode, layerFilterItems);
                            for (let i = 0; i < layerFilterItems.length; i++) {
                                const layerFilterItem = layerFilterItems[i];
                                const layer = layers.find((item) => item.xId === layerFilterItem.id);
                                if (layer) {
                                    const selected = this.subCategorySelected.find((item) => item.idLayer === layer.xId);
                                    if (selected) {
                                        layerFilterItem.selected = selected.selected;
                                    }
                                    // layerFilterItem.selected = layer.visible;
                                    subCategory.filter.push(layerFilterItem);
                                }
                            }
                        } else {
                            //TODO: Уникально для фильтра по годам строительства и ремонта
                            subCategoryNode.nodes.forEach((innerNode) => {
                                if (!this.subCategorySelected.find((item) => item.idLayer === innerNode.id)) {
                                    const subCategorySelectedStart = {
                                        idLayer: innerNode.id, selected: true
                                    };

                                    this.saveSubcategories([subCategorySelectedStart]);
                                }

                                const selected = this.subCategorySelected.find((item) => item.idLayer === innerNode.id);
                                const visibility = !!selected && selected.selected;

                                subCategory.filter.push({
                                    id: innerNode.id,
                                    alias: innerNode.text,
                                    selected: visibility,
                                    nodes: innerNode.nodes!.map(item => item.id)
                                });

                            });
                        }
                    }

                    category.items.push(subCategory);
                });
            }
        });

    }

    private saveSubcategories(subCategorySelected: SubCategorySelected[]) {
        if (!this.workspaceData) {
            this.workspaceData = { subCategorySelected: [] };
        }

        for (let numberLayer = 0; numberLayer < subCategorySelected.length; numberLayer++) {
            const valueLayer = subCategorySelected[numberLayer];
            let layerSelected = this.workspaceData.subCategorySelected.find((item) => item.idLayer === valueLayer.idLayer);
            if (layerSelected) {
                layerSelected.selected = valueLayer.selected;
            } else {
                this.workspaceData.subCategorySelected.push(valueLayer);
            }
        }

        this.writeWorkspaceData(true);
    }

    setState<K extends keyof GwtkHomeTaskState>(key: K, value: GwtkHomeTaskState[K]) {
        let subCategory, panelId: string;
        switch (key) {
            case SELECT_CATEGORY:
                const categoryId = value as string;
                if (categoryId === 'route') {
                    //TODO: Уникально для маршрутов
                    this.mapWindow.getTaskManager().createTask('gwtkmaproute.main');
                } else if (categoryId === 'beekeeper' && this.getAuthUserGroup() === 'beekeeper') {
                    //TODO: Уникально для Пчёлаводов
                    this.mapWindow.getTaskManager().createTask('gwtkbeekeeper.main');
                } else if (categoryId === 'beekeeper' && this.getAuthUserGroup() === 'beekeepersMinistryOfAgriculture') {
                    //TODO: Уникально для Работника Минсельхоза
                    this.mapWindow.getTaskManager().createTask('gwtkbeekeeperstatic.main');
                } else if (categoryId === 'plantBreeder' && this.getAuthUserGroup() === 'plantBreeder') {
                    //TODO: Уникально для Растениеводов
                    this.mapWindow.getTaskManager().createTask('gwtkplantbreeder.main');
                } else {
                    this.widgetProps.selectedCategory = this.widgetProps.categories.find((panelItem: Category) => panelItem.id === categoryId) || null;
                }

                if (categoryId === 'learnMore') {
                    //TODO: Уникально для узнать больше
                    const learnMore = this.widgetProps.categories.find(item => item.id === 'learnMore');
                    const url = this.map.options.helpUrl;
                    if (url && learnMore && learnMore.items.length === 0) {

                        const service = RequestServices.retrieveOrCreate({ url }, ServiceType.COMMON);
                        service.commonGet<SimpleJson>({ cmd: 'learnmore' }, { responseType: 'json' }).then((result) => {
                            if (result.data) {
                                for (const key in result.data) {
                                    learnMore.items.push({
                                        id: key,
                                        alias: result.data[key],
                                        filter: []
                                    });
                                }
                            }
                        }).catch((e) => {
                            return e;
                        });
                    }

                }

                if (categoryId === 'help') {
                    //TODO: Уникально для помощи
                    const help = this.widgetProps.categories.find(item => item.id === 'help');
                    const url = this.map.options.helpUrl;
                    if (help && url) {

                        let dataLoadedFlag = false;
                        for (let i = 0; i < help.items.length; i++) {
                            if (help.items[i].filter.length !== 0) {
                                dataLoadedFlag = true;
                                break;
                            }
                        }

                        if (!dataLoadedFlag) {
                            const service = RequestServices.retrieveOrCreate({ url }, ServiceType.COMMON);
                            service.commonGet <HelpServerAnswer>({ cmd: 'help' }, { responseType: 'json' }).then((result) => {
                                const data = result.data;
                                if (data) {

                                    const haveQuestionRecords = data['haveQuestion'];
                                    subCategory = help.items.find(item => item.id === 'haveQuestion');
                                    if (haveQuestionRecords && subCategory) {
                                        for (let i = 0; i < haveQuestionRecords.length; i++) {
                                            const record = haveQuestionRecords[i];

                                            subCategory.filter.push({
                                                id: record.recid,
                                                alias: record.question,
                                                selected: false,
                                                nodes: [record.answer]
                                            });


                                        }
                                    }

                                    const usefulTelephonesRecords = data['usefulTelephones'];
                                    subCategory = help.items.find(item => item.id === 'usefulTelephones');
                                    if (usefulTelephonesRecords && subCategory) {
                                        for (let i = 0; i < usefulTelephonesRecords.length; i++) {
                                            const record = usefulTelephonesRecords[i];

                                            subCategory.filter.push({
                                                id: record.recid,
                                                alias: record.title,
                                                selected: false,
                                                nodes: [record.phone, record.mail]
                                            });
                                        }
                                    }
                                }
                            }).catch((e) => {
                                return e;
                            });
                        }
                    }

                }


                break;
            case SELECT_SUB_CATEGORY:
                subCategory = this.findSubCategory(value as string);
                if (subCategory) {
                    const layers = this.map.tiles.getWmsLayers();

                    layers.forEach(layer => layer.hide());

                    const subCategoryId = subCategory.id;
                    const layerFilterItems = subCategory.filter;

                    if (layerFilterItems.length > 0) {
                        for (let i = 0; i < layerFilterItems.length; i++) {
                            const layerFilterItem = layerFilterItems[i];
                            if (layerFilterItem.selected) {
                                if (!layerFilterItem.nodes) {
                                    const layerXid = layerFilterItem.id;
                                    const layer = layers.find((item) => item.xId === layerXid);
                                    if (layer) {
                                        layer.show();
                                    }
                                } else {
                                    for (let j = 0; j < layerFilterItem.nodes.length; j++) {
                                        const layerXid = layerFilterItem.nodes[j];
                                        const layer = layers.find((item) => item.xId === layerXid);
                                        if (layer) {
                                            layer.show();
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        const layer = layers.find((item) => item.xId === subCategoryId);
                        if (layer) {
                            layer.show();
                        }
                    }

                    this.map._writeCookie();
                    this.map.tiles.wmsUpdate();
                    this.map.redraw();

                    this.map.searchManager.activateSource(SourceType.GISWebServiceSE, GISWebServiceSEMode.StrictSearch);
                    this.map.searchManager.clearSearchCriteriaAggregator();

                    //todo: уникально для слоя лесничеств
                    if (layers.find((item) => item.idLayer === 'Границы лесничеств utf_wgs')) {
                        // const scale = this.map.getZoomScale( this.map.getZoom()-3 );
                        const scale = 2 * 2183915.093862179;
                        if (scale) {
                            const criteriaAggregatorCopy = this.map.searchManager.getSearchCriteriaAggregatorCopy();
                            const multiLevelGeometrySearchCriterion = criteriaAggregatorCopy.getMultiLevelGeometrySearchCriterion();
                            multiLevelGeometrySearchCriterion.setValue(scale);
                            criteriaAggregatorCopy.setMultiLevelGeometrySearchCriterion(multiLevelGeometrySearchCriterion);

                            const srsNameSearchCriterion = criteriaAggregatorCopy.getSrsNameSearchCriterion();
                            srsNameSearchCriterion.setValue(this.map.getCrsString());

                            this.map.searchManager.setSearchCriteriaAggregator(criteriaAggregatorCopy);
                        }
                    }


                    this.map.searchManager.findNext().then((result) => {
                        if (result) {
                            if (result.mapObjects.length > 0) {
                                const bounds = result.mapObjects[0].getBounds().clone();
                                result.mapObjects.forEach((mapObject) => {
                                    const currentBounds = mapObject.getBounds();
                                    bounds.extend(currentBounds.min);
                                    bounds.extend(currentBounds.max);
                                });
                                this.map.fitBounds(bounds);
                            }
                        }
                        this.mapWindow.getTaskManager().showObjectPanel();
                    });


                    // this.mapWindow.getTaskManager().detachTask( this.id );
                }
                break;
            case TOGGLE_FILTER_ITEM:
                const toggleObject = value as { id: string; itemId: string; };
                panelId = toggleObject.id;
                const layerXid = toggleObject.itemId;

                subCategory = this.findSubCategory(panelId);
                if (subCategory && subCategory.filter) {
                    const filterItem = subCategory.filter.find((item) => item.id === layerXid);
                    if (filterItem) {
                        filterItem.selected = !filterItem.selected;
                        const subCategorySelectedStart: { idLayer: string, selected: boolean } = {
                            idLayer: layerXid, selected: filterItem.selected
                        };
                        this.saveSubcategories([subCategorySelectedStart]);
                    }
                }
                break;
            case TOGGLE_ALL_FILTER_ITEMS:
                const toggleAllObject = value as { id: string; selectAll: boolean };
                panelId = toggleAllObject.id;
                const selectAllMode = toggleAllObject.selectAll;

                subCategory = this.findSubCategory(panelId);
                if (subCategory) {
                    subCategory.filter.forEach((item) => {
                        item.selected = selectAllMode;
                        const subCategorySelectedStart: { idLayer: string, selected: boolean } = {
                            idLayer: item.id, selected: item.selected
                        };
                        this.saveSubcategories([subCategorySelectedStart]);
                    });
                }
                break;
        }
    }

    /**
     * Найти подкатегорию
     * @method findSubCategory
     * @param id {string} Идентификатор подкатегории
     */
    private findSubCategory(id: string) {

        for (let i = 0; i < this.widgetProps.categories.length; i++) {
            const category = this.widgetProps.categories[i];
            for (let j = 0; j < category.items.length; j++) {
                const subcategory = category.items[j];
                if (subcategory.id === id) {
                    return subcategory;
                }
            }
        }
    }

    /**
     * Заполнить список идентификаторов для фильтров подкатегории
     * @method fillLayerFilterItemsFromNode
     * @param currentNode {ContentTree} Узел дерева слоев
     * @param layerFilterItems {ContentTree} Список идентификаторов для фильтров подкатегории
     */
    private fillLayerFilterItemsFromNode(currentNode: ContentTree, layerFilterItems: SubCategoryFilterItem[]) {
        if (currentNode.nodes) {
            currentNode.nodes.forEach((node) => this.fillLayerFilterItemsFromNode(node, layerFilterItems));
        } else {
            layerFilterItems.push({ id: currentNode.id, alias: currentNode.text, selected: false });

            if (!this.subCategorySelected.find((item) => item.idLayer === currentNode.id)) {
                const subCategorySelectedStart = {
                    idLayer: currentNode.id, selected: true
                };
                this.saveSubcategories([subCategorySelectedStart]);
            }
        }

    }

    /**
     * Получить группу авторизованного пользователя
     * Метод предназначен для работы с Пчёлаводами и Растениеводами
     * @private
     * @method getAuthUserGroup
     */
    private getAuthUserGroup() {

        if (this.map.options.controls) {
            const controls = this.map.options.controls;

            if (controls.indexOf('beekeeper') !== -1) {
                return 'beekeeper';
            }

            if (controls.indexOf('plantBreeder') !== -1) {
                return 'plantBreeder';
            }

            if (controls.indexOf('beekeepersMinistryOfAgriculture') !== -1) {
                return 'beekeepersMinistryOfAgriculture';
            }
        }

        return 'Guest';
    }
}
