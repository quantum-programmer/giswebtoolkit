from tests.pages.containers.heatmap import Heatmap
from tests.pages.containers.item_list import ItemList
from ..pages.containers.sidebar import Sidebar
from ..pages.containers.map_canvas import MapCanvas
from ..pages.containers.heatmap import Heatmap
from ..pages.containers.mapdb import Mapdb
from ..pages.containers.search_by_name import SearchByName
from ..pages.containers.map_options import MapOptions
from ..pages.containers.search_by_semantic import SearchBySemantic
from ..pages.containers.external_functions import ExternalFunctions
from ..pages.containers.map_content import MapContent
from ..pages.containers.object_panel import ObjectPanel


explicit_wait = 10  # sec


class HomePage:
    def __init__(self, driver, host='localhost'):
        self.driver = driver
        self.url = "http://{}:8080/".format(host)
        self.mapCanvas = MapCanvas(driver)
        self.sidebar = Sidebar(driver)
        self.heatmap = Heatmap(driver)
        self.itemList = ItemList(driver)
        self.mapdb = Mapdb(driver)
        self.searchByName = SearchByName(driver)
        self.mapOptions = MapOptions(driver)
        self.searchBySemantic = SearchBySemantic(driver)
        self.externalFunctions = ExternalFunctions(driver)
        self.mapContent = MapContent(driver)
        self.objectPanel = ObjectPanel(driver)

    def open(self):
        self.driver.get(self.url)

    def get_mapCanvas(self):
        return self.mapCanvas

    def get_sidebar(self):
        return self.sidebar

    def get_heatmap(self):
        return self.heatmap

    def get_itemList(self):
        return self.itemList

    def get_mapdb(self):
        return self.mapdb

    def get_searchByName(self):
        return self.searchByName

    def get_mapOptions(self):
        return self.mapOptions

    def get_searchBySemantic(self):
        return self.searchBySemantic

    def get_externalFunctions(self):
        return self.externalFunctions

    def get_mapContent(self):
        return self.mapContent

    def get_objectPanel(self):
        return self.objectPanel
