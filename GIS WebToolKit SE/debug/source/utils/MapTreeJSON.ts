/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                 Класс Параметры дерева слоев карты               *
 *                                                                  *
 *                                                                  *
 *******************************************************************/

import {GwtkMap} from '~/types/Types';
import {ContentTree} from '~/types/Options';


export enum TreeNodeType {
    Layer,
    Group,
    VirtualFolder,
    ThematicLayer,
    LocalLayer,
    HeatLayer
}

export type NodeTree = {
    nodes: NodeTree[],
    disabled: boolean
}

export type ContentTreeNode = {
    id: string;
    text: string;
    nodeType: TreeNodeType;
    img?: string;
    imgurl?: string;
    parentId: string;
    disabled?: boolean;
    backgroundactive?: 1,
    backgroundimage?: string;
    nodes?: ContentTreeNode[];
};

export type ContentTreeNodeUpdate = {
    remove?: boolean;
} & ContentTreeNode;


export const USER_LAYERS_FOLDER_ID = 'userlayers';
export const MAP_BACKGROUNDS_NODE_ID = 'mapbackgrounds';


/**
 * Класс MapTreeJSON
 * @class MapTreeJSON
 * @param map {GwtkMap} Экземпляр карты
 */
export default class MapTreeJSON {

    private readonly map: GwtkMap;

    private readonly actualTree: ContentTreeNode = {
        id: 'root',
        text: '',
        nodeType: TreeNodeType.Group,
        parentId: '',
        nodes: []
    };

    private readonly nodeUserLayers: ContentTreeNode = {
        id: USER_LAYERS_FOLDER_ID,
        nodeType: TreeNodeType.Group,
        text: 'User layers',
        img: '',
        parentId: this.actualTree.id,
        nodes: []
    };

    private readonly mapBackgrounds: ContentTreeNode[] = [];

    get contentTree(): ContentTreeNode {
        return this.actualTree;
    }

    /**
     * @constructor MapTreeJSON
     * @param map {GwtkMap} Экземпляр карты
     */
    constructor(map: GwtkMap) {
        this.map = map;
        this.nodeUserLayers.text = this.map.translate(this.nodeUserLayers.text);
        let iscreated = false;
        let contentTree;
        if (this.map.options.contenttree) {
            contentTree = this.map.options.contenttree;
        } else {
            contentTree = this.createContentTreeDefault();
            iscreated = true;
        }

        const mapBackgroundsNodeIndex = contentTree.findIndex(item => item.id === MAP_BACKGROUNDS_NODE_ID);
        if (mapBackgroundsNodeIndex > -1) {
            const mapBackgroundsNode = contentTree[mapBackgroundsNodeIndex];
            if (mapBackgroundsNode && mapBackgroundsNode.nodes !== undefined) {
                mapBackgroundsNode.nodes.forEach((item) => this.mapBackgrounds.push({
                    id: item.id,
                    text: item.text,
                    nodeType: item.nodeType? item.nodeType : TreeNodeType.Layer,
                    parentId: item.parentId? item.parentId : '',
                    backgroundactive : item.backgroundactive,
                    backgroundimage : item.backgroundimage
                }));
            }

            contentTree.splice(mapBackgroundsNodeIndex, 1);
        }

        this.actualTree.nodes = this.updateContentTree(contentTree, this.actualTree.id);

        const disabledNodeIds = this.map.loadDisabledNodes();
        if (disabledNodeIds) {
            this.fillDisabledNodeIds(this.actualTree, disabledNodeIds.slice());
        }

        if (iscreated) this.updateMapContentTree();
    }

    /**
     * Добавить узел в дерево состава
     * @method addNode
     * @param treeNode { ContentTreeNodeUpdate } параметры узла
     */
    protected addNode(treeNode: ContentTreeNodeUpdate): true | undefined {
        let parentNode;
        const newNode = JSON.parse(JSON.stringify(treeNode));
        if (treeNode.parentId) {
            parentNode = this.findNode(this.actualTree, treeNode.parentId);
        }

        if (parentNode) {
            return this.addChildNode(parentNode, newNode);
        } else {
            if (!treeNode.parentId) {
                return this.addChildNode(this.actualTree, newNode);
            } else {
                if (treeNode.parentId == this.nodeUserLayers.id) {
                    let groupNode = this.findNode(this.actualTree, this.nodeUserLayers.id);
                    if (!groupNode) {
                        groupNode = JSON.parse(JSON.stringify(this.nodeUserLayers)) as MapTreeJSON['nodeUserLayers'];
                        this.addChildNode(this.actualTree, groupNode);
                    }
                    return this.addChildNode(groupNode, newNode);
                } else {
                    return this.addChildNode(this.actualTree, newNode);
                }
            }
        }
    }

    /**
     * Установить дочерний узел
     * @method addChildNode
     * @param parentNode { ContentTreeNode } родителький узел
     * @param newNode { ContentTreeNode } добавляемый узел
     */
    private addChildNode(parentNode: ContentTreeNode, newNode: ContentTreeNode): true | undefined {
        if (!parentNode.nodes) {
            parentNode.nodes = [newNode];
            return true;
        } else {
            const index = parentNode.nodes.findIndex(item => newNode.id === item.id);
            if (index > -1) {
                return this.updateNode(parentNode.nodes[index], newNode);
            } else {
                parentNode.nodes.push(newNode);
                return true;
            }
        }
    }

    private updateNode(targetNode: ContentTreeNode, sourceNode: ContentTreeNode): true | undefined {
        let updateFlag: true | undefined;
        let targetNodeKey: keyof ContentTreeNode;
        for (targetNodeKey in sourceNode) {
            if (targetNodeKey === 'nodes') {
                const targetNodeChildren = targetNode[targetNodeKey];
                const sourceNodeChildren = sourceNode[targetNodeKey];
                if (targetNodeChildren) {
                    if (sourceNodeChildren) {
                        for (let i = targetNodeChildren.length - 1; i >= 0; i--) {
                            const targetNodeChild = targetNodeChildren[i];
                            const sourceNodeChild = sourceNodeChildren.find(item => item.id === targetNodeChild.id);
                            if (!sourceNodeChild) {
                                targetNodeChildren.splice(i, 1);
                                updateFlag = true;
                            }
                        }

                        for (let i = 0; i < sourceNodeChildren.length; i++) {
                            const sourceNodeChild = sourceNodeChildren[i];
                            const targetNodeChild = targetNodeChildren.find(item => item.id === sourceNodeChild.id);
                            if (targetNodeChild) {
                                updateFlag = this.updateNode(targetNodeChild, sourceNodeChild);
                            } else {
                                targetNodeChildren[i] = sourceNodeChild;
                                updateFlag = true;
                            }
                        }

                    } else {
                        if (targetNodeChildren.length !== 0) {
                            targetNodeChildren.splice(0);
                            updateFlag = true;
                        }
                    }
                } else {
                    if (sourceNodeChildren) {
                        targetNode[targetNodeKey] = sourceNodeChildren.slice();
                        updateFlag = true;
                    }
                }
            } else {
                const targetValue = targetNode[targetNodeKey];
                const sourceValue = sourceNode[targetNodeKey];

                if (targetValue !== sourceValue) {
                    if (Array.isArray(targetValue) && Array.isArray(sourceValue) && targetValue.length === sourceValue.length) {
                        if (targetValue.join() === sourceValue.join()) {
                            continue;
                        }
                    }

                    Reflect.set(targetNode, targetNodeKey, sourceValue);
                    updateFlag = true;
                }
            }
        }
        return updateFlag;
    }


    /**
     * Удалить узел дерева состава
     * @method removeNode
     * @param treenode { ContentTreeNodeUpdate } параметры узла
     */
    protected removeNode(treenode: ContentTreeNodeUpdate): true | undefined {
        const currentNode = this.findNode(this.actualTree, treenode.id);
        if (!currentNode || !currentNode.parentId) {
            return;
        }
        const parentNode = this.findNode(this.actualTree, currentNode.parentId);
        if (!parentNode) {
            return;
        }
        const nodes = parentNode.nodes;
        if (nodes) {
            const index = nodes.findIndex(item => treenode.id === item.id);
            if (index > -1) {
                nodes.splice(index, 1);
                return true;
            }
        }
    }


    /**
     * Найти узел дерева состава
     * @method findNode
     * @private
     * @param treenode { ContentTreeNode } узел дерева
     * @param id { string } идентификатор узла
     * @returns { ContentTreeNode | undefined }
     */
    private findNode(treenode: ContentTreeNode, id: string): ContentTreeNode | undefined {
        let resultNode;
        if (treenode.id === id) {
            resultNode = treenode;
        } else if (treenode.nodes && treenode.nodes.length !== 0) {
            for (let i = 0; i < treenode.nodes.length; i++) {
                const currentNode = treenode.nodes[i];

                currentNode.parentId = treenode.id;

                if (currentNode.id == id) {
                    resultNode = currentNode;
                    break;
                }
                const currentResult = this.findNode(currentNode, id);
                if (currentResult) {
                    resultNode = currentResult;
                    break;
                }
            }
        }
        return resultNode;
    }

    /**
     * Создать дерево состава по списку слоев карты
     * @method createContentTreeDefault
     * @private
     * @returns { ContentTree[]  } дерево слоев (одноранговое)
     */
    private createContentTreeDefault(): ContentTree[] {
        let tree: ContentTree[] = [];
        const nodes: ContentTree[] = [];
        const root: ContentTree = {
            id: 'maps',
            text: this.map.translate('Maps'),
            group: true,
            clickable: true,
            nodes
        };
        const layers = this.map.layers;
        for (let i = 0; i < layers.length; i++) {

            const newNode = {
                id: layers[i].xId,
                text: layers[i].alias,
                clickable: true
            };

            nodes.push(newNode);
        }
        tree.push(root);
        return tree;
    }

    /**
     * Обновить параметры дерева в карте
     * @method updateMapContentTree
     * @private
     */
    private updateMapContentTree() {

        const userlayers = this.findNode(this.actualTree, this.nodeUserLayers.id);
        if (userlayers && userlayers.nodes && userlayers.nodes.length === 0) {
            this.removeNode(this.nodeUserLayers);
        }

        this.map.updateContentTree(JSON.stringify(this.actualTree));

        this.map.saveDisabledNodes(this.readDisabledNodeIds(this.actualTree));
    }

    private readDisabledNodeIds(node: ContentTreeNode, result: string[] = []) {
        if (node.disabled) {
            result.push(node.id);
        }
        if (node.nodes) {
            for (let i = 0; i < node.nodes.length; i++) {
                this.readDisabledNodeIds(node.nodes[i], result);
            }
        }
        return result;
    }

    private fillDisabledNodeIds(node: ContentTreeNode, disabledNodeIds: string[]) {

        if (disabledNodeIds.length === 0) {
            return;
        }
        const index = disabledNodeIds.indexOf(node.id);

        if (index !== -1) {
            node.disabled = true;
            disabledNodeIds.splice(index, 1);
        }

        if (node.nodes) {
            for (let i = 0; i < node.nodes.length; i++) {
                this.fillDisabledNodeIds(node.nodes[i], disabledNodeIds);
            }
        }
    }


    /**
     * Обновить список узлов дерева состава
     * @method updateTreeNodeList
     * @param treeitem { ContentTreeNodeUpdate } параметры узла
     */
    updateTreeNodeList(treeitem: ContentTreeNodeUpdate): true | undefined {
        let updateFlag;
        if (treeitem.remove) {
            updateFlag = this.removeNode(treeitem);
        } else {
            updateFlag = this.addNode(treeitem);
        }
        if (updateFlag) {
            this.updateMapContentTree();
        }
        return updateFlag;
    }

    /**
     * Удалить дочерние узлы
     * @method removeChildren
     * @param nodeId { string } Иденитификатор узла
     * @returns { boolean }
     */
    removeChildren(nodeId: string): boolean {
        let result = false;
        const node = this.findNode(this.actualTree, nodeId);
        if (node && node.nodes && node.nodes.length > 0) {
            node.nodes.splice(0);
            result = true;
        }
        return result;
    }

    /**
     * Получить узел дерева состава
     * @method getNode
     * @param id { string } идентификатор узла
     * @returns { ContentTreeNode | undefined }
     */
    getNode(id: string): ContentTreeNode | undefined {
        const node = this.findNode(this.actualTree, id);
        if (node) {
            return JSON.parse(JSON.stringify(node));
        }
    }

    /**
     * Приведение старой структуры к новой
     * @method updateContentTree
     * @private
     * @static
     */
    private updateContentTree(contentTreeOrigin: ContentTree[], rootId: string): ContentTreeNode[] {
        let contentTree = JSON.parse(JSON.stringify(contentTreeOrigin)) as ContentTree[];
        contentTree = this.updateContentTreeNode(contentTree, rootId);

        return contentTree as ContentTreeNode[];
    }

    private getNodeType(node: ContentTree) {

        if (node.nodeType !== undefined) {
            return node.nodeType;
        }

        const virtualFolderDescription = this.map.options.layers.find(layerDescription => layerDescription.id === node.id);
        if (virtualFolderDescription && virtualFolderDescription.folder) {
            return TreeNodeType.VirtualFolder;
        }
        if (node.nodes) {
            return TreeNodeType.Group;
        }

        return TreeNodeType.Layer;
    }

    /**
     * Добавить идентификаторы родителей в описания узлов
     * @method updateContentTreeNode
     * @private
     * @static
     */
    private updateContentTreeNode(contentTree: ContentTree[], parentId: string): ContentTreeNode[] {
        return contentTree.map(currentNode => {

            let nodes;
            if (currentNode.nodes) {
                nodes = this.updateContentTreeNode(currentNode.nodes, currentNode.id);
            }

            const {id, text, img, imgurl, backgroundactive, backgroundimage} = currentNode;

            const result: ContentTreeNode = {
                id,
                text,
                img,
                imgurl,
                nodeType: this.getNodeType(currentNode),
                parentId,
                nodes,
                backgroundactive,
                backgroundimage
            };

            return result;
        });
    }

    checkNodeIsDisabled(nodeId: string): boolean {
        const node = this.findNode(this.actualTree, nodeId);
        if (node) {
            const disabled = node.disabled || false;
            if (disabled) {
                return true;
            // }
            // else if (node.parentId) {
            //     return this.checkNodeIsDisabled(node.parentId);
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    getMapBackgrounds() {
        return this.mapBackgrounds;
    }

    isBackgroundLayer(nodeId: string) {
        return !!this.mapBackgrounds.find(item => item.id === nodeId);
    }

    getActiveBackGroundId() {
        return this.mapBackgrounds.find(item => item.backgroundactive)?.id;
    }

    /**
     * Вспомогательная функция для сброса узлов состава карт
     * @method enableNodes
     */
    enableNodes(node: NodeTree) {
        if (node.nodes && node.nodes.length > 0) {
            node.disabled = false;
            for (let i = 0; i < node.nodes.length; i++) {
                this.enableNodes(node.nodes[i]);
            }
        }
    }

    enableParentNodes(node: ContentTreeNode) {
        if (node.parentId) {
            const parentNode = this.findNode(this.actualTree, node.parentId);
            if (parentNode) {
                parentNode.disabled = false;
                this.enableParentNodes(parentNode);
            }
        }
    }

}
