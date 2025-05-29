/************************************************************************
 ********************************************   Гиман Н.Л. 12/07/18 *****
 ******************************************** Нефедьева О. 09/04/20  ****
 ***********************************************  Тазин В. 28/06/18  ****
 ******************************************* Соколова Т.О. 07/12/20  ****

 *   Library: Web 2.0 UI for jQuery (using prototypical inheritance)
 *   - Following objects defined
 *        - w2sidebar        - sidebar widget
 *        - $().w2sidebar    - jQuery wrapper
 *   - Dependencies: jQuery, w2utils
 *
 * == NICE TO HAVE ==
 *   - return ids of all subitems
 *   - add find() method to find nodes by a specific criteria (I want all nodes for exampe)
 *   - dbl click should be like it is in grid (with timer not HTML dbl click event)
 *   - reorder with grag and drop
 *   - add route property that would navigate to a #route
 *   - node.style is missleading - should be there to apply color for example
 *
 ************************************************************************/

(function () {
    if (!window.w2ui || !window.w2utils || !window.w2obj) {
        return;
    }
    var w2sidebarGWTK = function (options) {
        this.gCheck             = false;
        this.checkeditem        = [];
        this.checkeditemTemp    = null;
        this.name          = null;
        this.box           = null;
        this.sidebar       = null;
        this.parent        = null;
        this.nodes         = [];        // Sidebar child nodes
        this.menu          = [];
        this.routeData     = {};        // data for dynamic routes
        this.selected      = null;      // current selected node (readonly)
        this.img           = null;
        this.icon          = null;
        this.style         = '';
        this.topHTML       = '';
        this.bottomHTML    = '';
        this.keyboard      = true;
        this.onClick       = null;      // Fire when user click on Node Text
        this.onDblClick    = null;      // Fire when user dbl clicks
        this.onContextMenu = null;
        this.onMenuClick   = null;      // when context menu item selected
        this.onExpand      = null;      // Fire when node Expands
        this.onCollapse    = null;      // Fire when node Colapses
        this.onKeydown     = null;
        this.onRender      = null;
        this.onRefresh     = null;
        this.onResize      = null;
        this.onDestroy     = null;
        this.returnElement      = null;
        this.returnCondition    = null;
        this.hideChecked        = null;
        this.hidenCheckedInfo   = {layerVisible:{}};
        $.extend(true, this, w2obj.sidebar, options);
    };

    // ====================================================
    // -- Registers as a jQuery plugin

    $.fn.w2sidebarGWTK = function(method) {
        if (typeof method === 'object' || !method ) {
            // check name parameter
            if (!w2utils.checkName(method, 'w2sidebarGWTK')) return;
            // extend items
            var nodes  = method.nodes;
            var object = new w2sidebarGWTK(method);
            $.extend(object, { handlers: [], nodes: [] });
            if (typeof nodes != 'undefined') {
                object.add(object, nodes);
            }
            if ($(this).length !== 0) {
                object.render($(this)[0]);
            }
            object.sidebar = object;
            // register new object
            w2ui[object.name] = object;
            return object;

        } else if (w2ui[$(this).attr('name')]) {
            var obj = w2ui[$(this).attr('name')];
            obj[method].apply(obj, Array.prototype.slice.call(arguments, 1));
            return this;
        } else {
            console.log('ERROR: Method ' +  method + ' does not exist on jQuery.w2sidebarGWTK' );
        }
    };

    // ====================================================
    // -- Implementation of core functionality

    w2sidebarGWTK.prototype = {

        node: {
            panischecked        : false,
            layerVisible        : false,
            gClickable          : false,
            id              : null,
            text            : '',
            count           : null,
            img             : null,
            icon            : null,
            nodes           : [],
            style           : '',            // additional style for subitems
            route           : null,
            selected        : false,
            expanded        : false,
            hidden          : false,
            disabled        : false,
            group           : false,        // if true, it will build as a group
            groupShowHide   : true,
            plus            : false,        // if true, plus will be shown even if there is no sub nodes
            hint            : '',           // 22/10/2015
            // events
            onClick         : null,
            onDblClick      : null,
            onContextMenu   : null,
            onExpand        : null,
            onCollapse      : null,
            // internal
            parent          : null,    // node object
            sidebar         : null,
            remove          : null,
            save            : null,
            eventPanelId    : null,
            saveFileName    : null
        },
        /**
         * Рекурсия для прохода по дереву
         * @param node - узел дерева
         * @param mode - true/false выставляет всем галочки
         */
        recurs: function (node, mode) {
            
            var len = node.nodes.length, mod = false, ii, inode;
            for (ii = 0; ii < len; ii++) {
                inode = node.nodes[ii];
                if(mode){
                    mod = true;
                    inode.panischecked = true;
                }
                inode.panischecked = mode;
                // if (inode.panischecked == true) {
                    this.putElementInArray(inode);
                    this.recurs(inode, mod);
                // }
            }
        },
        // 28/03/16
        /**
         * Функция заполняет массив checkeditem в соответствии с условием returnCondition
         * @param node - узел дерева
         */
        putElementInArray: function(node){
            if(this.returnCondition !== null && typeof this.returnCondition == 'function'){
                if(this.returnCondition(node)){
                    this.checkeditem.push(node);
                }
            }else{
                this.checkeditem.push(node);
            }
        },
        // 28/03/16
        /**
         * Возвращает массив checkeditem в функцию returnElement
         * @param mode - признак включения/выключения слоя или узла дерева
         */
        returnElementArray: function(mode){
            if(this.checkeditem.length > 0){
                if(typeof this.returnElement == 'function'){
                    this.returnElement(mode, this.checkeditem, this.checkeditemTemp);
                }
            }
        },
        // 28/03/16
        /**
         * Включает узел и все родительские узлы
         * @param ndd - узел дерева
         * @param needObj - true/false записывает родительский узел
         * @param forFirstStart - параметр для состава карты
         * @returns {{id: "", sendData: boolean, node: boolean || {} }}
         */
        onElementAndAllParent: function(ndd, needObj, forFirstStart){
            var obj = this,
                nodParent = ndd.parent,
                temp = ndd.id, neObj = false;
            if(nodParent == obj){ //esli eto sam obj to nugno vosstanovit vseh detey vazvat function(){}
                temp = ndd.id;
                ndd.panischecked = true;
                obj.hidenCheckedInfo[ndd.id] = true;
            }
            if (this.hideChecked === null) {
                this.putElementInArray(ndd);
            }
            while (nodParent !== obj) {
                if(!nodParent.group){
                    if(needObj){
                        neObj = nodParent;
                    }
                    temp = nodParent.id;
                }
                ndd.panischecked = true;
                nodParent.panischecked = true;
                obj.hidenCheckedInfo[nodParent.id] = true;
                if (this.hideChecked === null) {
                    this.putElementInArray(nodParent);
                }
                if(forFirstStart){
                    this.putElementInArray(nodParent);
                }
                nodParent = nodParent.parent;
            }
            //console.log(temp);
            return {id: temp, sendData: true, node: neObj};
        },
        // 28/03/16
        /**
         * Выключает узел и родительские узлы
         * @param ndd - узел дерева
         * @returns {{id: *, sendData: boolean}}
         */
        offElementAndAllParent: function(ndd){
            var obj = this,
                nodParent = ndd.parent,
                temp;
            if(nodParent.name !== undefined && obj.name == nodParent.name){
                temp = ndd.id;
                ndd.panischecked = false;
                obj.hidenCheckedInfo[ndd.id] = false;
            }
            this.putElementInArray(ndd);
            while (nodParent !== obj) {
                temp = nodParent.id;
                ndd.panischecked = false;
                nodParent.panischecked = false;
                obj.hidenCheckedInfo[nodParent.id] = false;
                this.putElementInArray(nodParent);
                nodParent = nodParent.parent;
            }
            //???????? ??????? ? ??? ????????? ??????? ??????? ???????? true
            return {id: temp, sendData: false};
        },
        // 28/03/16
        /**
         * Включает все дочерние узла выбранного узла
         * @param ndd - узел дерева
         * @returns {*}
         */
        onAllChildren: function(ndd){
            var obj = this,
                nodParent = ndd.parent,
                temp = true;
            if(ndd.nodes.length === 0) {
                return false;
            }
            while (nodParent !== obj) {
                if(nodParent !== obj && nodParent.panischecked !== undefined && nodParent.panischecked === false && nodParent.gClickable !== false){
                    temp = false;
                    break;
                }
                nodParent = nodParent.parent;
            }

            if (ndd.nodes.length > 0) {
                this.putElementInArray(ndd);
                var len = ndd.nodes.length, node, ii, refreshId = ndd.id;
                if (ndd.gClickable) {
                    ndd.panischecked = true;
                    obj.hidenCheckedInfo[ndd.id] = true;
                }
                for (ii = 0; ii < len; ii++) {
                    node = ndd.nodes[ii];
                    node.panischecked = true;
                    obj.hidenCheckedInfo[node.id] = true;
                    if (node.panischecked == true) {
                        this.putElementInArray(node);
                        this.recurs(node, true);
                    }
                }
                this.checkeditemTemp = refreshId;
                return {id: refreshId, sendData: temp} ;
            }

        },
        // 28/03/16
        /**
         * Выключает все дочерние узла выбранного узла
         * @param ndd - узел дерева
         * @returns {*}
         */
        offAllChildren: function(ndd){
            var obj = this,
                nodParent = ndd.parent,
                temp = false;
            if(ndd.nodes.length === 0) {
                return false;
            }
            if (ndd.nodes.length > 0) {
                this.putElementInArray(ndd);
                var len = ndd.nodes.length, node, ii, refreshId = ndd.id;
                if (ndd.gClickable) {
                    ndd.panischecked = false;
                    obj.hidenCheckedInfo[ndd.id] = false;
                }
                for (ii = 0; ii < len; ii++) {
                    node = ndd.nodes[ii];
                    node.panischecked = false;
                    obj.hidenCheckedInfo[node.id] = false;
                    if (node.panischecked == false) {
                        this.putElementInArray(node);
                        this.recurs(node, false);
                    }
                }
                this.checkeditemTemp = refreshId;
                return {id: refreshId, sendData: temp} ;
            }
        },
        // 28/03/16
        /**
         * Включить/выключить узел дерева
         * @param id {string/object} идентификатор или узел дерева
         * @param mode {string} режим работы метода:
         *        'n'    - onElementAndAllParent
         *        's'    - onAllChildren
         *        'offn' - offElementAndAllParent
         *        'offs' - offAllChildren
         *        'offns' - offElementAndAllParent, offAllChildren
         * @param forFirstStart {Boolean} для состава карты
         */
        setCheckedMode: function(id, mode, forFirstStart){
            this.checkeditem = [];
            var ndd, idRefresh;
            if( typeof id == 'object'){
                ndd  = id;
            }else{
                ndd  = this.get(id);
            }
            if(!ndd) return false;
            if(mode === 'n'){
                if(forFirstStart){
                    idRefresh = this.onElementAndAllParent(ndd, false, forFirstStart);
                }else{
                    idRefresh = this.onElementAndAllParent(ndd);
                }
            }
            if(mode === 's'){
                idRefresh = this.onAllChildren(ndd);
            }
            if(mode === 'ns'){
                idRefresh = this.onElementAndAllParent(ndd);
                this.onAllChildren(ndd);
            }
            if(mode === 'offn'){
                idRefresh = this.offElementAndAllParent(ndd);
            }
            if(mode === 'offs'){
                idRefresh = this.offAllChildren(ndd);
            }
            if(mode === 'offns'){
                idRefresh = this.offElementAndAllParent(ndd);
                this.offAllChildren(ndd);
            }
            if(idRefresh.sendData === true){
                this.returnElementArray(true);
            }else{
                this.returnElementArray(false);
            }
            if(idRefresh.id !== null){
                this.refresh(idRefresh.id);
            }
        },
        // 28/03/16
        /**
         * Функция для оптимизации работы 2х деревьев
         * @param add_remove
         * @param data
         * @param selectedId
         * @returns {boolean}
         */
        integrationRight: function(add_remove, data, selectedId){

            //console.time("qqq");
            if(data === undefined || data.lenth == 0 || !data){
                console.log("Data is " + data);
                return false
            }
            var len = data.length;              /*????? ???????*/
            var node = this.get(data[0].id);    /*?????? ???????*/
            node.showsettings = data[0].showsettings;//TODO уточнить для других приложений
            if(node === null) {
                console.log("Node is " + node);
                return false;
            }
            var nodParent = node.parent;        /*???????? ???????*/
            var temp;                           /*?????? id ???????? ???????? ????*/
            var i;
            var j;
            var obj = this;                     /*?????? ??????*/

            if(len == 1){

                node.expanded = add_remove;
                node.hidden = !add_remove;
                node.checkedIsReady = add_remove;
                nodParent.counCheckChildren = 1;
                //while (nodParent.panischecked !== undefined) {
                while (nodParent !== obj) {
                    if(nodParent.group == false){
                        temp = nodParent.id;
                    }
                    if(nodParent.expanded == true && nodParent.hidden == false){
                        break;
                    }
                    nodParent.checkedIsReady = add_remove;//??????? ???? ??? ? ???????? ??????????? ????????
                    nodParent.expanded = add_remove;
                    nodParent.hidden = !add_remove;
                    nodParent.gClickable = !add_remove;
                    nodParent = nodParent.parent;
                }
                if(!add_remove){
                    var leng = node.parent.nodes.length, checkTempParre = node.parent, count = 0, refParent;
                    //while(checkTempParre.panischecked !== undefined){
                    while(checkTempParre !== obj){
                        if(checkTempParre.group == false){
                            refParent = checkTempParre.id;
                        }
                        leng = checkTempParre.nodes.length;
                        for(j = 0; j < leng; j++){
                            if(!checkTempParre.nodes[j].hidden){//???? ???? ?? ?????
                                count++;
                                break;
                            }
                        }
                        if(count == 0){
                            checkTempParre.expanded = add_remove;
                            checkTempParre.hidden = !add_remove;
                            checkTempParre.panischecked = add_remove;
                            checkTempParre.gClickable = !add_remove;
                        }
                        checkTempParre = checkTempParre.parent;
                    }
                }
                if(add_remove){
                    this.refresh(temp);
                }else{
                    this.refresh(refParent);
                }
                //add_remove ? this.refresh(temp) : this.refresh(refParent);
                //return true;
            }
            if(len > 1){
                if(add_remove){
                    var k, takeObj, takeParent;
                    for(k = 0; k < len; k++){
                        takeObj = this.get(data[k].id);
                        takeObj.expanded = add_remove;
                        takeObj.hidden = !add_remove;
                        takeParent = takeObj.parent;
                        while(takeParent !== obj){
                            if(takeParent.group == false){
                                temp = takeParent.id;
                            }
                            takeParent.expanded = add_remove;
                            takeParent.hidden = !add_remove;
                            takeParent.massCheckReady = true;
                            takeParent.gClickable = !add_remove;
                            takeParent = takeParent.parent;
                        }
                    }
                }
                if(!add_remove){
                    var t, nObjRemove, r, nlen, rInd = false, indGetParent = false;
                    for(t = 0; t < len; t++){
                        nObjRemove = this.get(data[t].id);
                        nObjRemove.expanded = add_remove;
                        nObjRemove.hidden = !add_remove;
                        nObjRemove.parent.expanded = add_remove;
                        nObjRemove.parent.hidden = !add_remove;

                        var leng2 , checkTempParre2 = nObjRemove.parent, count2 = 0, refParent2;
                        while(checkTempParre2 !== obj){
                            if(t == 0 && checkTempParre2.group == false){
                                refParent2 = checkTempParre2.id;
                            }
                            leng2 = checkTempParre2.nodes.length;
                            for(j = 0; j < leng2; j++){
                                if(!checkTempParre2.nodes[j].hidden){
                                    count2++;
                                    break;
                                }
                            }
                            if(count2 == 0){
                                checkTempParre2.expanded = add_remove;
                                checkTempParre2.hidden = !add_remove;
                                checkTempParre2.panischecked = add_remove;
                                checkTempParre2.gClickable = !add_remove;
                            }
                            checkTempParre2 = checkTempParre2.parent;
                        }
                    }
                }
                if(add_remove){
                    this.refresh(temp);
                }else{
                    this.refresh(refParent2);
                }


            }
            //console.timeEnd('qqq');
        },
        // 28/03/16
        saveLocalSt: function(){
            //    TODO "!"
        },
        // 28/03/16
        /**
         * Метод устанавливает,снимает,запоминает галочки в составке карты
         * @param object - объект с идентификатором или объектом
         * @param checkedStatus - признак включения/выключения узла
         */
        checkRefreshChildren: function(object, checkedStatus){
            var ndd = null;
            if(object.node){
                ndd = object.node;
            }else{
                ndd  = this.get(object.id);//poluchili element idem po recors i vistavliaem galochki
            }
            object.id = ndd.id;
            var obj = this;
            if(checkedStatus){
                function recursNode(ndd, obj){
                    for(var j = 0; j < ndd.nodes.length; j++){
                        if(ndd.nodes[j].gClickable && obj.hidenCheckedInfo[ndd.nodes[j].id]){
                            if(obj.hidenCheckedInfo[ndd.nodes[j].id] !== undefined){
                                ndd.nodes[j].panischecked = obj.hidenCheckedInfo[ndd.nodes[j].id];
                                obj.putElementInArray(ndd.nodes[j]);
                                obj.hidenCheckedInfo.layerVisible[ndd.nodes[j].id] = true;
                            }
                        }
                        if(ndd.nodes[j].nodes.length > 0 && ndd.nodes[j].panischecked){
                            recursNode(ndd.nodes[j],obj);
                        }
                    }
                }
				this.hidenCheckedInfo.layerVisible[ndd.id] = checkedStatus;
                this.putElementInArray(ndd);
                for(var i = 0; i < ndd.nodes.length; i++){
                    if(ndd.nodes[i].gClickable && this.hidenCheckedInfo[ndd.nodes[i].id]/*ndd.nodes[i].panischecked*/){
                        if(this.hidenCheckedInfo[ndd.nodes[i].id] !== undefined){
                            ndd.nodes[i].panischecked = this.hidenCheckedInfo[ndd.nodes[i].id];
                            this.putElementInArray(ndd.nodes[i]);
                            this.hidenCheckedInfo.layerVisible[ndd.nodes[i].id] = true;
                        }
                    }
                    if(ndd.nodes[i].nodes.length > 0 && ndd.nodes[i].panischecked){
                        recursNode(ndd.nodes[i], obj);
                    }
                }
                
            }
            /*esli vikluchili idem vniz zapominaem sostoyanie i vikluchaem*/
            if(!checkedStatus){
                function recursB(ndd, obj){
                    for(var j = 0; j < ndd.nodes.length; j++){
                        if(ndd.nodes[j].panischecked != undefined && ndd.nodes[j].gClickable && ndd.nodes[j].panischecked){
                            obj.hidenCheckedInfo[ndd.nodes[j].id] = ndd.nodes[j].panischecked;//zapomnili
                            ndd.nodes[j].panischecked = false;//snialy galochku
                            obj.putElementInArray(ndd.nodes[j]);
                            obj.hidenCheckedInfo.layerVisible[ndd.nodes[j].id] = false;
                        }
                        if(ndd.nodes[j].nodes.length > 0){
                            recursB(ndd.nodes[j], obj);
                        }
                    }
                }
				this.putElementInArray(ndd);
                for(var ii = 0; ii < ndd.nodes.length; ii++){
                    if(ndd.nodes[ii].panischecked != undefined && ndd.nodes[ii].gClickable && ndd.nodes[ii].panischecked){
                        this.hidenCheckedInfo[ndd.nodes[ii].id] = ndd.nodes[ii].panischecked;//zapomnili
                        ndd.nodes[ii].panischecked = false;//snialy galochku
                        this.putElementInArray(ndd.nodes[ii]);
                        this.hidenCheckedInfo.layerVisible[ndd.nodes[ii].id] = false;

                    }
                    if(ndd.nodes[ii].nodes.length > 0){
                        recursB(ndd.nodes[ii], obj);
                    }
                }
                
            }
            /*save curent status*/
            localStorage.setItem('MapContentJSON', JSON.stringify(this.hidenCheckedInfo));
            /*nugno vernut on/off elemtnt soglasno usloviu*/
            this.returnElementArray(checkedStatus);
            this.refresh(object.id);
        },
        // 28/03/16
        /**
         * Метод управляет выбором узла и его родителей и записывает данные в локальное хранилище
         * @param node {object} узел дерева, где произошло событие
         * @param state {boolean} состояние узла: включен/выключен
         */
        mapContent: function (node, state) {
            
            this.mapContentBody = $(this.box).find('.w2ui-sidebar-div');
            this.mapContentNodeCurScroll = this.mapContentBody.scrollTop();
            try{
                localStorage.setItem('MapContentJSON', JSON.stringify(this.hidenCheckedInfo));
            }catch(e){
                console.log('Can not setItem localStorage for MapContent.');
            }
            var idRefresh = {id: node.id};
            
            this.select(node);

            if(state){
                idRefresh = this.onElementAndAllParent(node, true);
            }
            this.checkRefreshChildren(idRefresh, state);

            this.mapContentBody.scrollTop(this.mapContentNodeCurScroll);

            if ($.isFunction(this.onLegendItemClick) && (node.key || node.typename)){
                this.onLegendItemClick(node);
            }
           
        },
        // 28/03/16
        /**
         * Метод обработки галоче для левого дерева
         * @param event - событие
         * @returns {boolean}
         * @constructor
         */
        ItemChecked: function (event) {
            this.checkeditem = [];
            var testArr = [];
            var id = event.target.id;
            var idNode = id.replace('gcheck_node_', '');
            var obj = this;
            var ndd = this.get(idNode);
            if(ndd === null) return false;
            ndd.panischecked = event.target.checked;
            /*24032016*/
            //ndd.layerVisible = event.target.checked;
            //zapominaem sostoianie checboxsov
            obj.hidenCheckedInfo[ndd.id] = event.target.checked;
            var nodParent = ndd.parent;
            var sendTrriger = false;
            var haveWhile = false;

            var refreshId = null;
            /*for mapContent*/
            if (this.hideChecked) {
                this.mapContent(ndd, event.target.checked);
                return false;
            }

            if(event.target.checked){

                if(nodParent.name == undefined){
                    if((nodParent.panischecked == true && nodParent.panischecked !== undefined) || (nodParent.panischecked !== undefined && nodParent.gClickable == false && nodParent.nodes.length > 0)) {
                        haveWhile = true;
                        while (nodParent !== obj) {
                            if (nodParent.panischecked == false && nodParent.group == false && nodParent.gClickable == true) {
                                break;
                            }
                            nodParent = nodParent.parent;
                        }
                        if(nodParent == obj){
                            if(this.returnCondition !== null && typeof this.returnCondition == 'function'){
                                if(this.returnCondition(ndd)){
                                    this.checkeditem.push(ndd);
                                }
                            }else{
                                this.checkeditem.push(ndd);
                            }
                            sendTrriger = true;
                        }
                    }

                }
                if(!haveWhile){
                    if(nodParent == obj){
                        if(this.returnCondition !== null && typeof this.returnCondition == 'function'){
                            if(this.returnCondition(ndd)){
                                this.checkeditem.push(ndd);
                            }
                        }else{
                            this.checkeditem.push(ndd);
                        }
                        sendTrriger = true;
                    }
                }

                if(sendTrriger){
                    if (ndd.nodes.length > 0) {
                        var len = ndd.nodes.length;
                        for (var ii = 0; ii < len; ii++) {
                            var node = ndd.nodes[ii];
                            if (node.panischecked == true) {
                                if(this.returnCondition !== null && typeof this.returnCondition == 'function'){
                                    if(this.returnCondition(node)){
                                        this.checkeditem.push(node);
                                    }
                                }else{
                                    this.checkeditem.push(node);
                                }
                                this.recurs(node, false);
                            }
                        }
                    }
                }
            }
            if(!event.target.checked){

                //obj.hidenCheckedInfo[ndd.id] = event.target.checked;

                var sendRep = false;
                var indDown = false;
                var weWasWhile = false;
                /*if(ndd){
                 this.putElementInArray(ndd);
                 }*/
                if(nodParent !== obj){
                    if((nodParent.panischecked == true && nodParent.panischecked !== undefined) || (nodParent.panischecked !== undefined && nodParent.gClickable == false && nodParent.nodes.length > 0)) {
                        weWasWhile = true;
                        while (nodParent !== obj) {
                            if (nodParent.panischecked == false && nodParent.group == false && nodParent.gClickable == true) {
                                break;
                            }
                            nodParent = nodParent.parent;
                        }
                        if(nodParent == obj && ndd.nodes.length  > 0){
                            /*GIMAN NEW*/
                            this.putElementInArray(ndd);
                            /*GIMAN NEW*/
                            indDown = true;
                        }
                        if(nodParent == obj && ndd.nodes.length  == 0){
                            sendRep = true;
                            if(this.returnCondition !== null && typeof this.returnCondition == 'function'){
                                if(this.returnCondition(ndd)){
                                    this.checkeditem.push(ndd);
                                }
                            }else{
                                this.checkeditem.push(ndd);
                            }
                        }
                    }
                }
                if(nodParent == obj && ndd.nodes.length > 0 && weWasWhile !== true){
                    indDown = true;
                }
                if(!weWasWhile){
                    if(ndd.parent == obj){
                        this.putElementInArray(ndd);
                    }
                }

                if(indDown){
                    if(ndd.nodes.length > 0){
                        var lenOff = ndd.nodes.length;
                        for (var iii = 0; iii < lenOff; iii++) {
                            var nodeOff = ndd.nodes[iii];
                            if (nodeOff.panischecked == true) {
                                if(this.returnCondition !== null && typeof this.returnCondition == 'function'){
                                    if(this.returnCondition(nodeOff)){
                                        this.checkeditem.push(nodeOff);
                                    }
                                }else{
                                    this.checkeditem.push(nodeOff);
                                }
                                if(nodeOff && nodeOff.gClickable ){
                                    this.recurs(nodeOff, false);
                                }

                            }
                        }
                    }
                }

            }
            if (refreshId) {
                this.refresh(refreshId);
            }
            if(this.checkeditem.length > 0){
                if(this.returnElement !== null && typeof this.returnElement == 'function'){
                    this.returnElement(event.target.checked, this.checkeditem);
                }
            }
            //console.timeEnd('test');
        },

        add: function (parent, nodes) {
            if (arguments.length == 1) {
                // need to be in reverse order
                nodes  = arguments[0];
                parent = this;
            }
            if (typeof parent == 'string') parent = this.get(parent);
            return this.insert(parent, null, nodes);
        },

        insert: function (parent, before, nodes) {
            var txt, ind, tmp, node, nd;
            if (arguments.length == 2) {
                // need to be in reverse order
                nodes  = arguments[1];
                before = arguments[0];
                ind    = this.get(before);
                if (ind === null) {
                    if (!$.isArray(nodes)) nodes = [nodes];
                    txt = (nodes[0].caption != null ? nodes[0].caption : nodes[0].text);
                    console.log('ERROR: Cannot insert node "'+ txt +'" because cannot find node "'+ before +'" to insert before.');
                    return null;
                }
                parent = this.get(before).parent;
            }
            if (typeof parent == 'string') parent = this.get(parent);
            if (!$.isArray(nodes)) nodes = [nodes];
            for (var o in nodes) {
                node = nodes[o];
                if (typeof node.id == null) {
                    txt = (node.caption != null ? node.caption : node.text);
                    console.log('ERROR: Cannot insert node "'+ txt +'" because it has no id.');
                    continue;
                }
                if (this.get(this, node.id) !== null) {
                    txt = (node.caption != null ? node.caption : node.text);
                    console.log('ERROR: Cannot insert node with id='+ node.id +' (text: '+ txt + ') because another node with the same id already exists.');
                    continue;
                }
                tmp = $.extend({}, w2sidebarGWTK.prototype.node, node);
                tmp.sidebar = this;
                tmp.parent  = parent;
                nd = tmp.nodes || [];
                tmp.nodes = []; // very important to re-init empty nodes array
                if (before === null) { // append to the end
                    parent.nodes.push(tmp);
                } else {
                    ind = this.get(parent, before, true);
                    if (ind === null) {
                        txt = (node.caption != null ? node.caption : node.text);
                        console.log('ERROR: Cannot insert node "'+ txt +'" because cannot find node "'+ before +'" to insert before.');
                        return null;
                    }
                    parent.nodes.splice(ind, 0, tmp);
                }
                if (nd.length > 0) {
                    this.insert(tmp, null, nd);
                }
            }
            this.refresh(parent.id);
            return tmp;
        },

        remove: function () { // multiple arguments
	        this.mapContentBody = $(this.box).find('.w2ui-sidebar-div');
	        this.mapContentNodeCurScroll = this.mapContentBody.scrollTop();
            
            var deleted = 0;
            var tmp;
            for (var a = 0; a < arguments.length; a++) {
                tmp = this.get(arguments[a]);
                if (tmp === null) continue;
                if (this.selected !== null && this.selected === tmp.id) {
                    this.selected = null;
                }
                var ind  = this.get(tmp.parent, arguments[a], true);
                if (ind === null) continue;
                if (tmp.parent.nodes[ind].selected)    tmp.sidebar.unselect(tmp.id);
                tmp.parent.nodes.splice(ind, 1);
                deleted++;
            }
            if (deleted > 0 && arguments.length == 1) this.refresh(tmp.parent.id); else this.refresh();
	        this.mapContentBody.scrollTop(this.mapContentNodeCurScroll);
            return deleted;
        },

        set: function (parent, id, node) {
            if (arguments.length == 2) {
                // need to be in reverse order
                node    = id;
                id        = parent;
                parent    = this;
            }
            // searches all nested nodes
            if (typeof parent == 'string') parent = this.get(parent);
            if (parent.nodes == null) return null;
            for (var i = 0; i < parent.nodes.length; i++) {
                if (parent.nodes[i].id === id) {
                    // make sure nodes inserted correctly
                    var nodes = node.nodes;
                    $.extend(parent.nodes[i], node, { nodes: [] });
                    if (nodes != null) {
                        this.add(parent.nodes[i], nodes);
                    }
                    this.refresh(id);
                    return true;
                } else {
                    var rv = this.set(parent.nodes[i], id, node);
                    if (rv) return true;
                }
            }
            return false;
        },

        get: function (parent, id, returnIndex) { // can be just called get(id) or get(id, true)
            if (arguments.length === 0) {
                var all = [];
                var tmp = this.find({});
                for (var t = 0; t < tmp.length; t++) {
                    if (tmp[t].id != null) all.push(tmp[t].id);
                }
                return all;
            } else {
                if (arguments.length == 1 || (arguments.length == 2 && id === true) ) {
                    // need to be in reverse order
                    returnIndex    = id;
                    id            = parent;
                    parent        = this;
                }
                // searches all nested nodes
                if (typeof parent == 'string') parent = this.get(parent);
                if (parent.nodes == null) return null;
                for (var i = 0; i < parent.nodes.length; i++) {
                    if (parent.nodes[i].id == id) {
                        if (returnIndex === true) return i; else return parent.nodes[i];
                    } else {
                        var rv = this.get(parent.nodes[i], id, returnIndex);
                        if (rv || rv === 0) return rv;
                    }
                }
                return null;
            }
        },

        find: function (parent, params, results) { // can be just called find({ selected: true })
            if (arguments.length == 1) {
                // need to be in reverse order
                params = parent;
                parent = this;
            }
            if (!results) results = [];
            // searches all nested nodes
            if (typeof parent == 'string') parent = this.get(parent);
            if (parent.nodes == null) return results;
            for (var i = 0; i < parent.nodes.length; i++) {
                var match = true;
                for (var prop in params) {
                    if (parent.nodes[i][prop] != params[prop]) match = false;
                }
                if (match) results.push(parent.nodes[i]);
                if (parent.nodes[i].nodes.length > 0) results = this.find(parent.nodes[i], params, results);
            }
            return results;
        },

        hide: function () { // multiple arguments
            var hidden = 0;
            for (var a = 0; a < arguments.length; a++) {
                var tmp = this.get(arguments[a]);
                if (tmp === null) continue;
                tmp.hidden = true;
                hidden++;
            }
            if (arguments.length == 1) this.refresh(arguments[0]); else this.refresh();
            return hidden;
        },

        show: function () { // multiple arguments
            var shown = 0;
            for (var a = 0; a < arguments.length; a++) {
                var tmp = this.get(arguments[a]);
                if (tmp === null) continue;
                tmp.hidden = false;
                shown++;
            }
            if (arguments.length == 1) this.refresh(arguments[0]); else this.refresh();
            return shown;
        },

        disable: function () { // multiple arguments
            var disabled = 0;
            for (var a = 0; a < arguments.length; a++) {
                var tmp = this.get(arguments[a]);
                if (tmp === null) continue;
                tmp.disabled = true;
                if (tmp.selected) this.unselect(tmp.id);
                disabled++;
            }
            if (arguments.length == 1) this.refresh(arguments[0]); else this.refresh();
            return disabled;
        },

        enable: function () { // multiple arguments
            var enabled = 0;
            for (var a = 0; a < arguments.length; a++) {
                var tmp = this.get(arguments[a]);
                if (tmp === null) continue;
                tmp.disabled = false;
                enabled++;
            }
            if (arguments.length == 1) this.refresh(arguments[0]); else this.refresh();
            return enabled;
        },

        select: function (id) {
            var new_node /*= this.get(id)*/;
            if( typeof id == 'object'){
                new_node  = id;
            }else{
                new_node  = this.get(id);
            }
            if (!new_node) return false;
            if (this.selected == id && new_node.selected) return false;
            this.unselect(this.selected);
            $(this.box).find('#node_'+ w2utils.escapeId(id))
                .addClass('w2ui-selected')
                .find('.w2ui-icon').addClass('w2ui-icon-selected');
            new_node.selected = true;
            this.selected = id;
            return true;
        },

        unselect: function (id) {
            var current = this.get(id);
            if (!current) return false;
            current.selected = false;
            $(this.box).find('#node_'+ w2utils.escapeId(id))
                .removeClass('w2ui-selected')
                .find('.w2ui-icon').removeClass('w2ui-icon-selected');
            if (this.selected == id) this.selected = null;
            return true;
        },

        toggle: function(id) {
            var nd = this.get(id);
            if (nd === null) return false;
            if (nd.plus) {
                this.set(id, { plus: false });
                this.expand(id);
                this.refresh(id);
                return;
            }
            if (nd.nodes.length === 0) return false;
            if (this.get(id).expanded) return this.collapse(id); else return this.expand(id);
        },

        collapse: function (id) {
            var obj = this;
            var nd  = this.get(id);
            // event before
            var eventData = this.trigger({ phase: 'before', type: 'collapse', target: id, object: nd });
            if (eventData.isCancelled === true) return;
            // default action
            $(this.box).find('#node_'+ w2utils.escapeId(id) +'_sub').slideUp(200);
            $(this.box).find('#node_' + w2utils.escapeId(id) + ' .w2ui-node-dots:first-child').html('<div class="w2ui-expand">+</div>');
            nd.expanded = false;
            // event after
            this.trigger($.extend(eventData, { phase: 'after' }));
            setTimeout(function () { obj.refresh(id); }, 200);
            return true;
        },

        collapseAll: function (parent) {
            if (typeof parent == 'undefined') parent = this;
            if (typeof parent == 'string') parent = this.get(parent);
            if (parent.nodes == null) return false;
            for (var i = 0; i < parent.nodes.length; i++) {
                if (parent.nodes[i].expanded === true) parent.nodes[i].expanded = false;
                if (parent.nodes[i].nodes && parent.nodes[i].nodes.length > 0) this.collapseAll(parent.nodes[i]);
            }
            this.refresh(parent.id);
            return true;
        },

        expand: function (id) {
            // 28/03/16
            var obj = this, nd;
            if( typeof id == 'object'){
                nd  = id;
                id = nd.id;
            }else{
                nd  = this.get(id);
            }

            // event before
            var eventData = this.trigger({ phase: 'before', type: 'expand', target: id, object: nd });
            if (eventData.isCancelled === true) return;
            // default action
            $(this.box).find('#node_'+ w2utils.escapeId(id) +'_sub').slideDown(200);
            $(this.box).find('#node_' + w2utils.escapeId(id) + ' .w2ui-node-dots:first-child').html('<div class="w2ui-expand">-</div>');
            nd.expanded = true;
            // event after
            this.trigger($.extend(eventData, { phase: 'after' }));
            setTimeout(function () { obj.refresh(id); }, 200);
            return true;
        },

        expandAll: function (parent) {
            if (typeof parent == 'undefined') parent = this;
            if (typeof parent == 'string') parent = this.get(parent);
            if (parent.nodes == null) return false;
            for (var i = 0; i < parent.nodes.length; i++) {
                if (parent.nodes[i].expanded === false) parent.nodes[i].expanded = true;
                if (parent.nodes[i].nodes && parent.nodes[i].nodes.length > 0) this.collapseAll(parent.nodes[i]);
            }
            this.refresh(parent.id);
        },

        expandParents: function (id) {
            var node = this.get(id);
            if (node === null) return false;
            if (node.parent) {
                node.parent.expanded = true;
                this.expandParents(node.parent.id);
            }
            this.refresh(id);
            return true;
        },

        click: function (id, event) {
            var obj = this;
            var nd  = this.get(id);
            if (nd === null) return;
            if (nd.disabled || nd.group) return; // should click event if already selected
            // unselect all previsously
            $(obj.box).find('.w2ui-node.w2ui-selected').each(function (index, el) {
                var oldID     = $(el).attr('id').replace('node_', '');
                var oldNode = obj.get(oldID);
                if (oldNode != null) oldNode.selected = false;
                $(el).removeClass('w2ui-selected').find('.w2ui-icon').removeClass('w2ui-icon-selected');
            });
            // select new one
            var newNode = $(obj.box).find('#node_'+ w2utils.escapeId(id));
            var oldNode = $(obj.box).find('#node_'+ w2utils.escapeId(obj.selected));
            newNode.addClass('w2ui-selected').find('.w2ui-icon').addClass('w2ui-icon-selected');
            // need timeout to allow rendering
            setTimeout(function () {
                // event before
                var eventData = obj.trigger({ phase: 'before', type: 'click', target: id, originalEvent: event, node: nd, object: nd });
                if (eventData.isCancelled === true) {
                    // restore selection
                    newNode.removeClass('w2ui-selected').find('.w2ui-icon').removeClass('w2ui-icon-selected');
                    oldNode.addClass('w2ui-selected').find('.w2ui-icon').addClass('w2ui-icon-selected');
                    return;
                }
                // default action
                if (oldNode !== null) oldNode.selected = false;
                obj.get(id).selected = true;
                obj.selected = id;
                // route processing
                if (nd.route) {
                    var route = String('/'+ nd.route).replace(/\/{2,}/g, '/');
                    var info  = w2utils.parseRoute(route);
                    if (info.keys.length > 0) {
                        for (var k = 0; k < info.keys.length; k++) {
                            if (obj.routeData[info.keys[k].name] == null) continue;
                            route = route.replace((new RegExp(':'+ info.keys[k].name, 'g')), obj.routeData[info.keys[k].name]);
                        }
                    }
                    setTimeout(function () { window.location.hash = route; }, 1);
                }
                // event after
                obj.trigger($.extend(eventData, { phase: 'after' }));
            }, 1);
        },

        keydown: function (event) {
            var obj = this;
            var nd  = obj.get(obj.selected);
            if (!nd || obj.keyboard !== true) return;
            // trigger event
            var eventData = obj.trigger({ phase: 'before', type: 'keydown', target: obj.name, originalEvent: event });
            if (eventData.isCancelled === true) return;
            // default behaviour
            if (event.keyCode == 13 || event.keyCode == 32) { // enter or space
                if (nd.nodes.length > 0) obj.toggle(obj.selected);
            }
            if (event.keyCode == 37) { // left
                if (nd.nodes.length > 0 && nd.expanded) {
                    obj.collapse(obj.selected);
                } else {
                    selectNode(nd.parent);
                    if (!nd.parent.group) obj.collapse(nd.parent.id);
                }
            }
            if (event.keyCode == 39) { // right
                if ((nd.nodes.length > 0 || nd.plus) && !nd.expanded) obj.expand(obj.selected);
            }
            if (event.keyCode == 38) { // up
                selectNode(neighbor(nd, prev));
            }
            if (event.keyCode == 40) { // down
                selectNode(neighbor(nd, next));
            }
            // cancel event if needed
            if ($.inArray(event.keyCode, [13, 32, 37, 38, 39, 40]) != -1) {
                if (event.preventDefault) event.preventDefault();
                if (event.stopPropagation) event.stopPropagation();
            }
            // event after
            obj.trigger($.extend(eventData, { phase: 'after' }));

            function selectNode (node, event) {
                if (node !== null && !node.hidden && !node.disabled && !node.group) {
                    obj.click(node.id, event);
                    setTimeout(function () { obj.scrollIntoView(); }, 50);
                }
            }

            function neighbor (node, neighborFunc) {
                node = neighborFunc(node);
                while (node !== null && (node.hidden || node.disabled)) {
                    if (node.group) break; else node = neighborFunc(node);
                }
                return node;
            }

            function next (node, noSubs) {
                if (node === null) return null;
                var parent   = node.parent;
                var ind      = obj.get(node.id, true);
                var nextNode = null;
                // jump inside
                if (node.expanded && node.nodes.length > 0 && noSubs !== true) {
                    var t = node.nodes[0];
                    if (t.hidden || t.disabled || t.group) nextNode = next(t); else nextNode = t;
                } else {
                    if (parent && ind + 1 < parent.nodes.length) {
                        nextNode = parent.nodes[ind + 1];
                    } else {
                        nextNode = next(parent, true); // jump to the parent
                    }
                }
                if (nextNode !== null && (nextNode.hidden || nextNode.disabled || nextNode.group)) nextNode = next(nextNode);
                return nextNode;
            }

            function prev (node) {
                if (node === null) return null;
                var parent   = node.parent;
                var ind      = obj.get(node.id, true);
                var prevNode = (ind > 0) ? lastChild(parent.nodes[ind - 1]) : parent;
                if (prevNode !== null && (prevNode.hidden || prevNode.disabled || prevNode.group)) prevNode = prev(prevNode);
                return prevNode;
            }

            function lastChild (node) {
                if (node.expanded && node.nodes.length > 0) {
                    var t = node.nodes[node.nodes.length - 1];
                    if (t.hidden || t.disabled || t.group) return prev(t); else return lastChild(t);
                }
                return node;
            }
        },

        scrollIntoView: function (id) {
            if (typeof id == 'undefined') id = this.selected;
            var nd = this.get(id);
            if (nd === null) return;
            var body   = $(this.box).find('.w2ui-sidebar-div');
            var item   = $(this.box).find('#node_'+ w2utils.escapeId(id));
            var offset = item.offset().top - body.offset().top;
            if (offset + item.height() > body.height()) {
                body.animate({ 'scrollTop': body.scrollTop() + body.height() / 1.3 }, 250, 'linear');
            }
            if (offset <= 0) {
                body.animate({ 'scrollTop': body.scrollTop() - body.height() / 1.3 }, 250, 'linear');
            }
        },

        dblClick: function (id, event) {
            // if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection
            var nd = this.get(id);
            // event before
            var eventData = this.trigger({ phase: 'before', type: 'dblClick', target: id, originalEvent: event, object: nd });
            if (eventData.isCancelled === true) return;
            // default action
            this.toggle(id);
            // event after
            this.trigger($.extend(eventData, { phase: 'after' }));
        },

        contextMenu: function (id, event) {
            var obj = this;
            var nd  = obj.get(id);
            if (id != obj.selected) obj.click(id);
            // need timeout to allow click to finish first
            setTimeout(function () {
                // event before
                var eventData = obj.trigger({ phase: 'before', type: 'contextMenu', target: id, originalEvent: event, object: nd });
                if (eventData.isCancelled === true) return;
                // default action
                if (nd.group || nd.disabled) return;
                if (obj.menu.length > 0) {
                    $(obj.box).find('#node_'+ w2utils.escapeId(id))
                        .w2menu(obj.menu, {
                            left    : (event ? event.offsetX || event.pageX : 50) - 25,
                            onSelect: function (event) {
                                obj.menuClick(id, parseInt(event.index), event.originalEvent);
                            }
                        }
                    );
                }
                // event after
                obj.trigger($.extend(eventData, { phase: 'after' }));
            }, 150); // need timer 150 for FF
        },

        menuClick: function (itemId, index, event) {
            var obj = this;
            // event before
            var eventData = obj.trigger({ phase: 'before', type: 'menuClick', target: itemId, originalEvent: event, menuIndex: index, menuItem: obj.menu[index] });
            if (eventData.isCancelled === true) return;
            // default action
            // -- empty
            // event after
            obj.trigger($.extend(eventData, { phase: 'after' }));
        },

        render: function (box) {
            var time = (new Date()).getTime();
            // event before
            var eventData = this.trigger({ phase: 'before', type: 'render', target: this.name, box: box });
            if (eventData.isCancelled === true) return;
            // default action
            if (typeof box != 'undefined' && box !== null) {
                if ($(this.box).find('> div > div.w2ui-sidebar-div').length > 0) {
                    $(this.box)
                        .removeAttr('name')
                        .removeClass('w2ui-reset w2ui-sidebar')
                        .html('');
                }
                this.box = box;
            }
            if (!this.box) return;
            $(this.box)
                .attr('name', this.name)
                .addClass('w2ui-reset w2ui-sidebar')
                .html('<div>'+
                '<div class="w2ui-sidebar-top"></div>' +
                '<div class="w2ui-sidebar-div"></div>'+
                '<div class="w2ui-sidebar-bottom"></div>'+
                '</div>'
            );
            $(this.box).find('> div').css({
                width    : $(this.box).width() + 'px',
                height: $(this.box).height() + 'px'
            });
            if ($(this.box).length > 0) $(this.box)[0].style.cssText += this.style;
            // adjust top and bottom
            if (this.topHTML !== '') {
                $(this.box).find('.w2ui-sidebar-top').html(this.topHTML);
                $(this.box).find('.w2ui-sidebar-div')
                    .css('top', $(this.box).find('.w2ui-sidebar-top').height() + 'px');
            }
            if (this.bottomHTML !== '') {
                $(this.box).find('.w2ui-sidebar-bottom').html(this.bottomHTML);
                $(this.box).find('.w2ui-sidebar-div')
                    .css('bottom', $(this.box).find('.w2ui-sidebar-bottom').height() + 'px');
            }
            // event after
            this.trigger($.extend(eventData, { phase: 'after' }));
            // ---
            this.refresh();
            return (new Date()).getTime() - time;
        },

        refresh: function (id) {
            var time = (new Date()).getTime();
            // if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection
            // event before
            var eventData = this.trigger({ phase: 'before', type: 'refresh', target: (typeof id != 'undefined' ? id : this.name) });
            if (eventData.isCancelled === true) return;
            // adjust top and bottom
            if (this.topHTML !== '') {
                $(this.box).find('.w2ui-sidebar-top').html(this.topHTML);
                $(this.box).find('.w2ui-sidebar-div')
                    .css('top', $(this.box).find('.w2ui-sidebar-top').height() + 'px');
            }
            if (this.bottomHTML !== '') {
                $(this.box).find('.w2ui-sidebar-bottom').html(this.bottomHTML);
                $(this.box).find('.w2ui-sidebar-div')
                    .css('bottom', $(this.box).find('.w2ui-sidebar-bottom').height() + 'px');
            }
            // default action
            $(this.box).find('> div').css({
                width : $(this.box).width() + 'px',
                height: $(this.box).height() + 'px'
            });
            var obj = this;
            var node, nd;
            var nm;
            if (typeof id == 'undefined') {
                node = this;
                nm   = '.w2ui-sidebar-div';
            } else {
                node = this.get(id);
                if (node === null) return;
                nm   = '#node_'+ w2utils.escapeId(node.id) + '_sub';
            }
            var nodeHTML;
            if (node !== this) {
                var tmp    = '#node_'+ w2utils.escapeId(node.id);
                nodeHTML    = getNodeHTML(node);
                $(this.box).find(tmp).before('<div id="sidebar_'+ this.name + '_tmp"></div>');
                $(this.box).find(tmp).remove();
                $(this.box).find(nm).remove();
                $('#sidebar_'+ this.name + '_tmp').before(nodeHTML);
                $('#sidebar_'+ this.name + '_tmp').remove();
            }
            // refresh sub nodes
            $(this.box).find(nm).html('');
            for (var i = 0; i < node.nodes.length; i++) {
                nd = node.nodes[i];
                nodeHTML = getNodeHTML(nd);
                $(this.box).find(nm).append(nodeHTML);
                if (nd.nodes.length !== 0) { this.refresh(nd.id); }
            }
            // event after
            this.trigger($.extend(eventData, { phase: 'after' }));
            return (new Date()).getTime() - time;

            function getNodeHTML(nd) {
                var html = '';
                var img  = nd.img;
                if (img === null) img = this.img;
                var icon = nd.icon;
                if (icon === null) icon = this.icon;
                // -- find out level
                var tmp   = nd.parent;
                var level = 0;
                while (tmp && tmp.parent !== null) {
                    if (tmp.group) level--;
                    tmp = tmp.parent;
                    level++;
                }
                if (typeof nd.caption != 'undefined') nd.text = nd.caption;
                if (nd.group) {
                    html =
                        '<div class="w2ui-node-group"  id="node_'+ nd.id +'"'+
                        '        onclick="w2ui[\''+ obj.name +'\'].toggle(\''+ nd.id +'\')"'+
                        '        onmouseout="$(this).find(\'span:nth-child(1)\').css(\'color\', \'transparent\')" '+
                        '        onmouseover="$(this).find(\'span:nth-child(1)\').css(\'color\', \'inherit\')">'+
                        (nd.groupShowHide ? '<span>'+ (!nd.hidden && nd.expanded ? w2utils.lang('Hide') : w2utils.lang('Show')) +'</span>' : '<span></span>') +
                        '    <span>'+ nd.text +'</span>'+
                        '</div>'+
                        '<div class="w2ui-node-sub" id="node_'+ nd.id +'_sub" style="'+ nd.style +';'+ (!nd.hidden && nd.expanded ? '' : 'display: none;') +'"></div>';
                } else {
                    if (nd.selected && !nd.disabled) obj.selected = nd.id;
                    tmp = '';
                    if (img) tmp = '<div class="w2ui-node-image w2ui-icon '+ img +    (nd.selected && !nd.disabled ? " w2ui-icon-selected" : "") +'"></div>';
                    if (icon) tmp = '<div class="w2ui-node-image"><span class="'+ icon +'"></span></div>';

                    if (nd.gClickable) {
                        var che = '<td  class="w2ui-expand-check-td w2ui-node-dots" nowrap >' +
                            '<input id="gcheck_node_' + nd.id + '" ' + 'onchange="w2ui[\'' + obj.name + '\'].ItemChecked(event);" ' +
                            (nd.panischecked ? 'checked' : '')
                            + ' class="w2ui-expand-check w2ui-node-dots" type="checkbox">' +
                            '</td>';
                    } else {
                        nd.panischecked = true;
                        che = '';
                    }
                    
                    if (nd.showsettings || nd.save || nd.remove) {
                        var che2 = '<td  class="w2ui-expand-check-td" nowrap align="right">';
                        if (nd.remove && nd.eventPanelId) {
                            nd.subtype = nd.subtype ? nd.subtype : 'All';
                            che2 += '<div onclick="$(\'#' + nd.eventPanelId + '\').trigger({ type: \'layercommand\', maplayer: { id: \'' + nd.id +
                                    '\', act: \'remove\', subtype: \'' + nd.subtype + '\' }});" class="sidebar-node-button sidebar-node-remove-button" >' + '</div>';
                        }
                        if (nd.save && nd.eventPanelId && nd.saveFileName) {
                            nd.subtype = nd.subtype ? nd.subtype : 'All';
                            che2 += '<div name="' + nd.saveFileName + '" id="btsave_' + nd.id + '" onclick="$(\'#' + nd.eventPanelId +
                                    '\').trigger({ type: \'layercommand\', maplayer: { id: \'' + nd.id + '\', act: \'save\', subtype: \'' + nd.subtype + '\' }});" class="sidebar-node-button sidebar-node-save-button" >' + '</div>';
                        }
                        if (nd.showsettings) {
                            che2 += '<div id=gcheck_node_opacity_' + nd.id
                            + ' class="sidebar-node-button sidebar-node-opacity-button"></div>';
                        }
                        che2 += '</td>';
                    }
                    else {
                        if (nd.ndcommand) {
                            nd.ndClass = nd.ndClass ? nd.ndClass : '';
                            if (nd.ndact) {
                                var onclick = ' onclick="$(\'#' + nd.eventPanelId + '\').trigger({ type: \'layercommand\', maplayer: { id: \'' + nd.id + '\', act: \'' + nd.ndact + '\', subtype: \'' + nd.subtype + '\' }});"';
                            }
                            else {
                                onclick = '';
                            }
                            if (nd.ndTitle) {
                                var title = ' title="' + nd.ndTitle + '"';
                            }
                            else {
                                title = '';
                            }

                            che2 = '<td  class="w2ui-expand-check-td" nowrap align="right">';
                            che2 += '<div class="sidebar-node-button sidebar-node-command-button ' + nd.ndClass + '"' + title + onclick + '>' + '</div>';
                            che2 += '</td>';
                        }
                        else {
                            che2 = '';
                        }
                    }

                    html =
                        //'<div class="w2ui-node ' + (nd.selected ? 'w2ui-selected' : '') + ' ' + (nd.disabled ? 'w2ui-disabled' : '') + '" id="node_' + nd.id + '" style="' + (nd.hidden ? 'display: none;' : '') + '"' +  // 22/10/2015
                        '<div ' + (nd.hint ? ('title="' + nd.hint+'"') : '') + ' class="w2ui-node ' + (nd.selected ? 'w2ui-selected' : '') + ' ' + (nd.disabled ? 'w2ui-disabled' : '') + '" id="node_' + nd.id + '" style="' + (nd.hidden ? 'display: none;' : '') + '"' +
                        '    ondblclick="w2ui[\''+ obj.name +'\'].dblClick(\''+ nd.id +'\', event);"'+
                        '    oncontextmenu="w2ui[\''+ obj.name +'\'].contextMenu(\''+ nd.id +'\', event); '+
                        '        if (event.preventDefault) event.preventDefault();"'+
                        '    onClick="w2ui[\''+ obj.name +'\'].click(\''+ nd.id +'\', event); ">'+
                        '<table cellpadding="0" cellspacing="0" style="margin-left:'+ (level*18) +'px; padding-right:'+ (level*18) +'px"><tr>'+
                        '<td class="w2ui-node-dots" nowrap onclick="w2ui[\''+ obj.name +'\'].toggle(\''+ nd.id +'\'); '+
                        '        if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;">'+
                        '    <div class="w2ui-expand">' + (nd.nodes.length > 0 ? (nd.expanded ? '-' : '+') : (nd.plus ? '+' : '')) + '</div>' +
                        '</td>' +
                            //che + '<td class="w2ui-node-data" nowrap>'+  // 28/03/2016
                            //che + '<td style="max-width: 70px; overflow: hidden;" class="w2ui-node-data" nowrap>'+  // 28/03/2016

                        // /*che +*/ '<td style="width: 24px">' + tmp + '</td>' + che  + '<td style="max-width: 70px; overflow: hidden;" class="w2ui-node-data" >'+  // 28/03/2016
                        /*che +*/ '<td style="width:' + (tmp != '' ? 24 : 0) + 'px">' + tmp + '</td>' + che  + '<td style="max-width: 70px; overflow: hidden;" class="w2ui-node-data" >'+  // 28/03/2016
                            //tmp +
                        (nd.count || nd.count === 0 ? '<div class="w2ui-node-count">'+ nd.count +'</div>' : '') +
                        '<div class="w2ui-node-caption w2ui-node-caption-gwtk">'+ nd.text +'</div>'+
                        '</td>' + che2 +
                        '</tr></table>'+
                        '</div>'+
                        '<div class="w2ui-node-sub" id="node_'+ nd.id +'_sub" style="'+ nd.style +';'+ (!nd.hidden && nd.expanded ? '' : 'display: none;') +'"></div>';
                }
                return html;
            }
        },

        resize: function () {
            var time = (new Date()).getTime();
            // if (window.getSelection) window.getSelection().removeAllRanges(); // clear selection
            // event before
            var eventData = this.trigger({ phase: 'before', type: 'resize', target: this.name });
            if (eventData.isCancelled === true) return;
            // default action
            $(this.box).css('overflow', 'hidden');    // container should have no overflow
            //$(this.box).find('.w2ui-sidebar-div').css('overflow', 'hidden');
            $(this.box).find('> div').css({
                width        : $(this.box).width() + 'px',
                height    : $(this.box).height() + 'px'
            });
            //$(this.box).find('.w2ui-sidebar-div').css('overflow', 'auto');
            // event after
            this.trigger($.extend(eventData, { phase: 'after' }));
            return (new Date()).getTime() - time;
        },

        destroy: function () {
            // event before
            var eventData = this.trigger({ phase: 'before', type: 'destroy', target: this.name });
            if (eventData.isCancelled === true) return;
            // clean up
            if ($(this.box).find('> div > div.w2ui-sidebar-div').length > 0) {
                $(this.box)
                    .removeAttr('name')
                    .removeClass('w2ui-reset w2ui-sidebar')
                    .html('');
            }
            delete w2ui[this.name];
            // event after
            this.trigger($.extend(eventData, { phase: 'after' }));
        },

        lock: function (msg, showSpinner) {
            var box = $(this.box).find('> div:first-child');
            var args = Array.prototype.slice.call(arguments, 0);
            args.unshift(box);
            w2utils.lock.apply(window, args);
        },

        unlock: function () {
            w2utils.unlock(this.box);
        }
    };
    w2utils && $.extend(w2sidebarGWTK.prototype, w2utils.event);
    w2obj.sidebar = w2sidebarGWTK;
})();
