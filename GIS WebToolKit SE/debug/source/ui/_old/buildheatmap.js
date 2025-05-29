/**************************************** Помозов Е.   12/03/21 ****
***************************************** Нефедьева О. 07/04/20 ****
*                                                                  *
*              Copyright (c) PANORAMA Group 1991-2022              *
*                       All Rights Reserved                        *
*                                                                  *
********************************************************************
*                                                                  *
*                    Построение тепловой карты                     *
*                                                                  *
*******************************************************************/
if (window.GWTK) {
    /**
     * Элемент управления Построение тепловой карты
     * @class GWTK.BuildHeatmapControl
     * @constructor GWTK.BuildHeatmapControl
     * @param map {GWTK.Map} карта
    */
    GWTK.BuildHeatmapControl = function (map) {

        this.toolname = 'buildheatmap';   // имя компонента

        this.map = map;                   // карта
        if (!this.map) {
            console.log("GWTK.BuildHeatmapControl. " + w2utils.lang("Not defined a required parameter") + " Map.");
            return;
        }

        this.options = this.map.options.hm_options;     // параметры тепловых карт
        if (!this.options) return;

        this.layer_num = 1;            // порядковый номер следующей карты
        this.existing_heatmaps = {};   // описание созданных тепловых карт (id слоя => порядковый номер)

        this.id = null;                // id панели
        this.pane = null;              // панель
        this.$pane = null;             // объект jquery панели

        this.xid = '';
        this.init();                   // инициализация
    }
    GWTK.BuildHeatmapControl.prototype = {
        /**
	     * Инициализация
	     */
        init: function () {
            this.createPane();             // создать панель
            this.createtoolbarsButton();   // создать кнопку
            this.map.maptools.push(this);  // добавить в карту

			this.restoreHeatMaps();        // восстановление дерева тепловых карт при загрузке
        },

        /**
	     * создать кнопку в панели карты
	     */
        createtoolbarsButton: function () {
            if (!this.map || !this.map.panes.toolbarPane || !this.pane)
                return;
            this.bt = GWTK.DomUtil.create('div', 'control-button control-button-buildheatmap clickable', this.map.panes.toolbarPane);
            this.bt.id = 'panel_button_buildheatmap';
            this.bt.disabled = true;
            this.bt.title = w2utils.lang('Build heat map');
            if (this.pane.id) {                        // идентификатор панели
                this.bt._pane = this.pane.id;
                this.bt.disabled = false;
            }
            $(this.bt).attr('toolname', this.toolname);
            var map = this.map;
            // обработчик клика на кнопке (включить режим, показать панель)
            $(this.bt).on("click", function (event) {
                if (map) map.handlers.toolbar_button_click(event);
            });
            if (this.map.hasMenu()) {
                $(this.bt).css("display", "none");
            }
        },

        /**
	     * Создать панель "Построение тепловой карты"
	     */
        createPane: function () {
            this.id = 'buildheatmapPanel';
            this.pane = GWTK.DomUtil.create('div', 'panel-buildheatmap map-panel-def', this.map.mapPaneOld);
            this.pane.id = this.id;
            this.$pane = $(this.pane);
            this.$pane.hide();
            // заголовок
            GWTK.Util.createHeaderForComponent({
                map: this.map,
                parent: this.pane,
                context:this.toolname,
                name: w2utils.lang("Heat Map Building"),
                callback: function () { $('#panel_button_buildheatmap').click(); return; }
            });
            // body
            var frame = document.createElement('div');
            frame.id = "buildheatmap_container";
            $(frame).html('<div id="buildheatmap_info" class="panel-buildheatmap-info"></div><div class="panel-buildheatmap-name"><label style="left:2px">' + w2utils.lang('Heat Map Name') + '</label></div>');

            // поле ввода названия карты
            var heatmapname = document.createElement('input');
            heatmapname.className = 'panel-buildheatmap-input';
            heatmapname.setAttribute('type', "text");
            heatmapname.setAttribute('name', 'buildheatmap_name');
            heatmapname.setAttribute('id', 'buildheatmap_name');
            heatmapname.value = w2utils.lang('Heat Map ') + this.layer_num;
            heatmapname.title = w2utils.lang('Heat Map Name');
            frame.appendChild(heatmapname);
            $(frame).append('<div style="height:5px;"></div>');
            // поле ввода идентификатора слоя
            var heatmaplayerid = document.createElement('fieldset');
            heatmaplayerid.className = 'panel-buildheatmap-layerid';
            var legend = document.createElement('legend');
            legend.innerHTML = w2utils.lang('Layer');
            $(legend).css('margin-left', '5px');
            heatmaplayerid.appendChild(legend);

            for (var i = 0; i < this.options.length; i++) {
			  var div = document.createElement('div');
              var item = document.createElement('input');
			  item.setAttribute('type', "radio");
			  item.setAttribute('name', 'LayerId');
			  item.setAttribute('value', 'heatmap_' + (i+1));
			  item.setAttribute('layerid', this.options[i]['LayerName']);
			  item.setAttribute('heatmapindex', i);
			  var lay = this.map.tiles.getLayerByxId(this.options[i]['LayerName']);
			  if (lay == null) {
				console.log(w2utils.lang('Error: Layer with ID') + ' "' + this.options[i]['LayerName'] + '" ' + w2utils.lang('not found!'));
			  }
			  else {
				item.setAttribute('layerName', lay.alias + '(' + this.options[i]['alias'] + ')');
				div.appendChild(item);
				$(div).append(' ' + lay.alias + ' (' + this.options[i]['alias'] + ')');
                $(div).css('margin-left', '5px');
			  }
              $(heatmaplayerid).append(div);
			}
			$(heatmaplayerid).find(':radio:first').prop('checked', true);

			frame.appendChild(heatmaplayerid);

            // кнопка Добавить тепловую карту
            elem = document.createElement('div');
            $(elem).html('<div style="width:100%;padding-top: 6px">' +
                         '<input type="button" class="control-button control-button_addmenu panel-buildheatmap-control-button-build clickable" id="buildheatmap_build" title="' + w2utils.lang('Build') + '"/></div>');

            $(frame).append(elem);
            // body --> панель
            this.$pane.append(frame);
            // назначить обработчики событий
            this.initEvents();
        },

		/**
		 * восстановление дерева тепловых карт при загрузке
		 */
		restoreHeatMaps: function () {
			//  кол-во сохраненных карт
            var hm_count = this.get_heatmaps_count('heatmap');
            if (hm_count > 0) {
              // номера созданных карт
              var heatmap_nums = [];
              for (var i = 0; i < document.cookie.split('; ').length; i++) {
                if (document.cookie.split('; ')[i].indexOf('heatmap') == 0)
                  heatmap_nums.push(parseInt(document.cookie.split('; ')[i].substr(document.cookie.split('; ')[i].indexOf('_') + 1, document.cookie.split('; ')[i].indexOf('=') - document.cookie.split('; ')[i].indexOf('_') - 1)));
              }
              for (var i = 0; i < hm_count; i++) {
                if (typeof GWTK.cookie('heatmap_' + heatmap_nums[i]) == 'undefined')
                  continue;
                // параметры слоя
                var layer_params = GWTK.cookie('heatmap_' + heatmap_nums[i], GWTK.cookies.converter);
                var id = layer_params[0][1];
                var selectObject = layer_params[1][1];
                var hidden = false;
                if (layer_params[2][1] == 'true')
                  hidden = true;
                var url = decodeURIComponent(layer_params[3][1]);
                var heatmap_name = layer_params[4][1];
                this.existing_heatmaps[id] = layer_params[5][1];

			    var options = {
                  "layers": [
                    {
                      id: id, selectObject: 0,
                      hidden: hidden,
                      alias: heatmap_name,
                      url: url
                    }
                  ]
                }

				var lay = this.map.openLayer(options.layers[0]);
				if (lay){
				  // формирование записи в дереве и отображение слоя на карте
                  this.show_heatmap(options, false);
				}
              }
              // имя след. карты по умолчанию
              var layer_num_max = 0;
              for (var name in this.existing_heatmaps) {
                layer_num_max++;
              }
              this.layer_num = layer_num_max + 1;
              // имя тепловой карты по умолчанию
              $('#buildheatmap_name').val(w2utils.lang('Heat Map ') + this.layer_num);
            }
		},

		/**
	      * Получить алиас слоя
	      * @method get_layername_byId
		  * @param id идентификатор слоя
		  * @returns {string} алиас слоя
	     */
        get_layername_byId: function (id) {
            var layer_name = '';
            for (var j = 0; j < this.map.options.layers.length; j++) {
                if (this.map.options.layers[j]['id'] == id) {
                    layer_name = this.map.options.layers[j]['alias'];
                    break;
                }
            }
            return layer_name;
        },

		/**
	      * Определить кол-во сохраненных тепловых карт
	      * @method get_heatmaps_count
		  * @param param имя cookie набора
		  * @returns {int} кол-во тепловых карт
	     */
        get_heatmaps_count: function (param) {
            var heatmaps_count = 0;
            var cookie = document.cookie.split(';');
            for (var i = 0; i < cookie.length; i++) {
                if (cookie[i].trim().indexOf(param) == 0)
                    heatmaps_count++;
            }
            return heatmaps_count;
        },

		/**
	      * Определить параметры тепловой карты
	      * @method get_heatmap_params
		  * @param heatmap_name имя тепловой карты
		  * @returns {string} строка с параметрами карты
	     */
        get_heatmap_params: function (heatmap_name) {
            var cookie = document.cookie.split(';');
            for (var i = 0; i < cookie.length; i++) {
                if (cookie[i].trim().indexOf(heatmap_name) == 0)
                    return cookie[i].substr(cookie[i].indexOf('=') + 1);
            }
            return false;
        },

        /**
	      * Назначить обработчики событий
          * @method initEvents
	     */
        initEvents: function () {
            var that = this;
            $(this.map.eventPane).on('layerlistchanged', function (e) {
				if (e.maplayer.act == 'remove') {
				    GWTK.cookie('heatmap_' + that.existing_heatmaps[e.maplayer.id], '', { expires: 0, path: '/' });
				    delete that.existing_heatmaps[e.maplayer.id];
				}
			});

            $(this.map.eventPane).on('layercommand.buildheatmap', function (e) {
                // изменение слоя
            });

            // закрытие панели
            $('#buildheatmap_close').on('click', function (e) { $('#buildheatmapPanel').hide(); });

            // построить тепловую карту
			$('#buildheatmap_build').on('click', function (e) {
                // заблокировать повторное нажатие кнопки построить
                $(this).attr('disabled', true);
                // имя тепловой карты
                var heatmap_name = $('#buildheatmap_name').val();

                // запрещаем создание одинаковых тепловых карт
                var heatmap_index = that.$pane.find(':radio[name="LayerId"]').index(that.$pane.find(':radio[name="LayerId"]:checked'));
				var layerName, hm_Alias, hm_found = false;

                for (var id in that.existing_heatmaps) {
                    if(that.existing_heatmaps.hasOwnProperty(id)){
                        if (that.existing_heatmaps[id] == (heatmap_index + 1)) {
                          hm_found = true;
						  layerName = that.map.tiles.getLayerByxId(that.options[heatmap_index].LayerName).alias + '(' + that.options[heatmap_index].alias + ')';
						  hm_Alias = that.map.tiles.getLayerByxId(id).alias;
                          break;
                        }
                    }
                }
                if (hm_found) {
					w2alert(w2utils.lang('For layer ') + '"' + layerName + '"' + w2utils.lang(' heat map already added ') + '"' + hm_Alias + '"!');
                    $(this).attr('disabled', false);
                    return;
                }

                // параметры создаваемой карты
                var req_params = [], srvUrl = that.map.options.url,
				token = that.map.getToken(), tokens = [];
                that.xid = '';

                for (var param in that.options[heatmap_index]) {
                    if(that.options[heatmap_index].hasOwnProperty(param)){
                    if (param == 'LayerName') {
                            that.xid = that.options[heatmap_index][param];
                            var lay = that.map.tiles.getLayerByxId(that.xid);
							srvUrl = GWTK.Util.getServerUrl(lay.options.url);
							if (token){
                              if (lay.options.token)
                                tokens.push(token);
                              else{
                                tokens.push(undefined);
                              }
                            }
                            lay = that.map.tiles.getIdServiceByLayer(lay);
                        req_params.push('Layers=' + lay);
                        continue;
                    }
                        req_params.push(param + '=' + that.options[heatmap_index][param]);
                    }
                }
				GWTK.Util.showWait();
				var button = this;
				GWTK.Util.doPromise( [srvUrl + '?' + 'RestMethod=BuildHeatMap&' + req_params.join('&')],
                function(data, err){
                    $(button).attr('disabled', false);
					if (err && err.length > 0){
                        if (err.text) {
						  w2alert(w2utils.lang(err.text));
						  console.log(err.text);
						}
						else {
						  w2alert(w2utils.lang("Error when getting data!"));
						  console.log(w2utils.lang("Error when getting data!"));
						}

                        if (!data || data.length == 0){
                            GWTK.Util.hideWait();
                            return;
                        }
                    }
                    if (data && typeof data[0] != "undefined") {
						var response = data[0].text;

		                var $tmlay = $(response).find('NewLayer'),
                            layerId = $tmlay.attr('ID'),
                            url = srvUrl +
                            "?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&FORMAT=image/png" +
                            "&BBOX=%bbox&HEIGHT=%h&WIDTH=%w&CRS=%crs&LAYERS=" + encodeURIComponent(layerId);

						var heatmapId = GWTK.Util.createGUID();
						var options = {
                            "layers": [
							  { 'alias': heatmap_name,
                                'id': heatmapId,
                                'url': url,
							    'hidden': false,
                                'selectObject': 0
                              }
							]
						};

			            var lay = this.map.openLayer(options.layers[0]);

				        if (lay){
						  // сохранить параметры тепловой карты и обновить кол-во тепловых карт
						  var hm_index = this.$pane.find(':radio[name="LayerId"]').index(this.$pane.find(':radio[name="LayerId"]:checked')) + 1;
						  this.existing_heatmaps[heatmapId] = hm_index;

					      this.show_heatmap(options, true);

						  GWTK.cookie('heatmap_' + this.existing_heatmaps[heatmapId], 'id=' + heatmapId + '&selectObject=' + options.layers[0]['selectObject'] + '&hidden=' + options.layers[0]['hidden'] + '&url=' + encodeURIComponent(options.layers[0]['url']) + '&name=' + options.layers[0]['alias'] + '&order_num=' + this.existing_heatmaps[heatmapId], { expires: 5, path: '/' });

                          // порядковый номер следующей тепловой карты
                          this.layer_num++;
                          // имя следующей тепловой карты по умолчанию
                          $('#buildheatmap_name').val(w2utils.lang('Heat Map ')  + (this.layer_num));
				        }

						GWTK.Util.hideWait();
					}
                    else {
                        console.log(w2utils.lang("Error when getting data!"));
                        GWTK.Util.hideWait();
                        return;
                    }
                }.bind(that), tokens, that.map);

            });

			$(this.map.eventPane).on('mapcontentloaded.buildheatmap', function (e) {
				// обновить	дерево
                var hm_count = that.get_heatmaps_count('heatmap');
                if (hm_count > 0) {
                  // номера созданных карт
                  var heatmap_nums = [];
                  for (var i = 0; i < document.cookie.split('; ').length; i++) {
                    if (document.cookie.split('; ')[i].indexOf('heatmap') == 0)
                      heatmap_nums.push(parseInt(document.cookie.split('; ')[i].substr(document.cookie.split('; ')[i].indexOf('_') + 1, document.cookie.split('; ')[i].indexOf('=') - document.cookie.split('; ')[i].indexOf('_') - 1)));
                  }
                  for (var i = 0; i < hm_count; i++) {
                    if (typeof GWTK.cookie('heatmap_' + heatmap_nums[i]) == 'undefined')
                      continue;
                    // параметры слоя
                    var layer_params = GWTK.cookie('heatmap_' + heatmap_nums[i], GWTK.cookies.converter);
                    var id = layer_params[0][1];
                    var hidden = false;
                    if (layer_params[2][1] == 'true')
                      hidden = true;
                    var url = decodeURIComponent(layer_params[3][1]);
                    var heatmap_name = layer_params[4][1];
					var options = {
                      "layers": [
                        {
                           "id": id,
                           "selectObject": 0,
                           hidden: hidden,
                           alias: heatmap_name,
                           "url": url
                        }
                      ]
                    }
					var lay = that.map.tiles.getLayerByxId(options.layers[0].id);
					if (lay) {
					    that.show_heatmap(options, false);
					}
                  }
                }
			});
        },

		/**
	      * Отобразить тепловую карту (добавить в дерево карт)
          * @method show_heatmap
		  * @param options параметры слоя
		  * @param scrollintoview признак необходимости прокрутки дерева
	     */
		show_heatmap: function (options, scrollintoview) {
            this.map.onLayerListChanged( {
                id: options.layers[0]['id'],
                clickable: true,
                expanded: false,
                text: options.layers[0]['alias'],
                parentId: 'userlayers'
             });
        },

		/**
	     * Освободить ресурсы
	     */
        destroy: function () {
            $(this.map.eventPane).off('layercommand.buildheatmap');
            this.$pane.find('.panel-info-close').off();
            $('#buildheatmap_build').off();
            $(this.map.eventPane).off('mapcontentloaded.buildheatmap');
            this.$pane.empty();
            this.$pane.remove();
            $(this.bt).off();
            $(this.bt).remove();
            return;
        }
    }
}