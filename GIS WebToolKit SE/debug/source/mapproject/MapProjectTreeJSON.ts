/********************************************************************
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2024              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                      Дерево проекта карты                        *
 *                                                                  *
 *******************************************************************/

import MapTreeJSON, { ContentTreeNode, ContentTreeNodeUpdate } from '~/utils/MapTreeJSON';
import { GwtkMap } from '~/types/Types';

/**
 * Класс дерево проекта карты
 * @class MapProjectTreeJSON
 * @extends MapTreeJSON
 */
export default class MapProjectTreeJSON extends MapTreeJSON {

    /**
     * Дерево проекта
     * @property projectTree
     */
    get projectTree() {
        return this.getProjectTree();
    }

    /**
     * @constructor MapProjectTreeJSON
     * @param map {GwtkMap} Экземпляр карты
     * @param projecttree { ContentTreeNode[] } параметры дерева состава слоев
     */
    constructor( map: GwtkMap, projecttree?: ContentTreeNode[] ) {
        super( map );
        if ( projecttree ) {
            this.updateProjectContentTree( projecttree );
        }
    }

    /**
     * Обновить дерево проекта
     * @param projectTreeOrigin { ContentTreeNode[] } параметры дерева состава слоев
     * @private
     */
    private updateProjectContentTree( projectTreeOrigin: ContentTreeNode[] ) {
        const rootid = this.projectTree.id;
        this.removeChildren( rootid );
        projectTreeOrigin.forEach( node => this.addNode( node ) );
    }

    /**
     * Удалить узел дерева
     * @method removeNode
     * @param treeitem { ContentTreeNodeUpdate } параметры узла
     */
    removeNode( treeitem: ContentTreeNodeUpdate ) {
        return super.removeNode( treeitem );
    }

    /**
     * Добавить узел в дерево состава
     * @method addNode
     * @protected
     * @param treeitem { ContentTreeNodeUpdate } параметры узла
     */
    protected addNode( treeitem: ContentTreeNodeUpdate ) {
        return super.addNode( treeitem );
    }

    /**
     * Обновить список узлов дерева состава
     * @method updateTreeNodeList
     * @param treeitem { ContentTreeNodeUpdate } параметры узла
     */
    updateTreeNodeList( treeitem: ContentTreeNodeUpdate ): true | undefined {
        if ( treeitem.remove ) {
            return this.removeNode( treeitem );
        } else {
            return this.addNode( treeitem );
        }
    }

    /**
     * Удалить дочерние узлы
     * @method removeChildren
     * @param nodeId { string } Иденитификатор узла
     * @return { boolean }
     */
    removeChildren( nodeId: string ): boolean {
        return super.removeChildren( nodeId );
    }

    /**
     * Получить узел дерева
     * @method getNode
     * @param id { string } идентификатор узла
     * @return { ContentTreeNode | undefined }
     */
    getNode( id: string ) {
        return super.getNode( id );
    }

    /**
     * Получить дерево
     * @method getProjectTree
     * @return { ContentTreeNode }
     */
    getProjectTree() {
        return this.contentTree;
    }

    /**
     * Получить описание дерева
     * @method getProjectTreeOriginal
     * @return { ContentTreeNode[] }
     */
    getProjectTreeOriginal() {
        return this.contentTree.nodes;
    }

}
