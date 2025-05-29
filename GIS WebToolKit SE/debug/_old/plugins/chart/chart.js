/***************************************************** 25/06/20 *****
 *                                                                  *
 *              Copyright (c) PANORAMA Group 1991-2019              *
 *                       All Rights Reserved                        *
 *                                                                  *
 ********************************************************************
 *                                                                  *
 *                        GIS WebServer SE                          *
 *                    Компонент Диаграмма                           *
 *                                                                  *
 ********************************************************************/
// Plugin Prototype: protoChart

// Plugin Name: Chart
// Plugin URI: www.gisinfo.ru
// Version: 1.1.0
// Description: Creating chart
// Author: Pomozov
// Author URI: www.gisinfo.ru

var chartSettings = {
  chartData: {   
    labels: null,
    datasets: null	
  },
  chartOptions: {
	responsive: false,
    maintainAspectRatio: false
  },
  chartTitle: null,
  chartType: 'bar',
  chartError: {
    message: 'Undefined chart type',
    description: 'Supported chart types'			
  }
};

var protoChart = {
    title: w2utils.lang('Chart'),
    source: './plugins/chart/',    
    panel_options: {
        id: 'panel_ctrl_chart',
        parent: 'map-pane-main',
        class: 'map-panel-def-task map-panel-def',
        display: 'none',
        header: true,
        hidable: true,
        draggable: true,
        resizable: true
    },
    
    /**
     * Инициализация
     * @method init
     */
    // ===============================================================
    init: function() {
        // подключить стили компонента
        this.appendCss();
        // подключить файл локалей
        if (w2utils.settings.locale.toLowerCase() != 'en-us') {
            w2utils.locale(this.source + 'locale/' + w2utils.settings.locale.toLowerCase() + '.json');
        }
        this.title = '';        		
        // создать панель компонента
        this.createPanel();
        // создать события компонента
        this.initEvents();
        // создать содержимое панели компонента
        var that = this;
        that.createPanelContent();
        this.map.toolChart = this;		
		$(document).trigger({
          type: 'pluginloaded.chart',
          plugin: 'chart',
		  map: this.map          
        });
    },
    
    /**
     * Назначение обработчиков событий
     * @method initEvents
     */
    // ===============================================================
    initEvents: function() {
        var tool = this;
        // Обработчик изменения размера панели компонента
        this.$panel.on('resize', function (event) {
            // ...
        });
    },
    /**
     * Создать содержимое панели компонента
     * @method createGeocodeContent
     */
    // ===============================================================
    createPanelContent: function() {        
        // установить размер панели контейнера (основная панель)
        var w = this.panel_options.width;
        var h = this.panel_options.height;
        $(this.$panel).width(w);
        $(this.$panel).height(h);
        $(this.$panel).css({ 'min-width': 700, 'min-height': 800 });
        
        var div = document.createElement('div');        
        $(div).width('100%');
		
        this.$panel.append(div);
        
        var script = document.createElement('script');
        script.src = './plugins/chart/js/chart.umd.min.js';
        this.$panel.append(script);		
		var script = document.createElement('script');
        script.src = './plugins/chart/js/vue.min.js';
        this.$panel.append(script);
		chartSettings.chartError.message = w2utils.lang('Undefined chart type');
		chartSettings.chartError.description = w2utils.lang('Supported chart types');
		
        new Vue({
            template: '<chart :chart-data="chartData" :chart-title="chartTitle" :chart-type="chartType" :chart-error="chartError"/>',			
            data: chartSettings,
            components: {
                chart: chart
            }
        }).$mount(div)
        
        return;
    },
    
    /**
     * Подключить файл стилей css
     * @method appendCss
     */
    // ===============================================================
    appendCss: function () {
        var $links = $('head').find('link'), 
            href = '/chart.css',
            not = true;
        $links.each(function (index) {
            if (this.href.indexOf(href) !== -1) {
                not = false;
            }
        });
        if (!not) {
            return;
        }
        $('head').append($('<link rel="stylesheet" href="' + this.source + 'chart.css" type="text/css" />'));
    }
    
}