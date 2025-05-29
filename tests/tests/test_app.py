import re
from time import sleep
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager

from ..pages.home_page import HomePage


def read_host(docker):
    host = '127.0.0.1'

    if (docker):
        f = open("/etc/hosts", "r")
        for x in f:
            if "gwtk-serve" in x:
                host = re.findall("[\d\.]+", x)[0]
                break
        f.close()
    else:
        host = 'localhost'

    return host


def test_driver(docker):
    driver = None
    if docker:
        options = webdriver.ChromeOptions()
        capabilities = {
            "browserName": "chrome",
            "browserVersion": "102.0",
            "selenoid:options": {
                "enableVideo": True
            }
        }

        driver = webdriver.Remote(
            command_executor=f'http://selenoid:4444/wd/hub',
            options=options
        )

    else:
        service = ChromeService(ChromeDriverManager(driver_version="132.0").install())
        options = webdriver.ChromeOptions()
        driver = webdriver.Chrome(service=service, options=options)

    return driver

# docker = True - для запуска теста внутри докера
# docker = False - для запуска теста локально


def test_load_rsw(docker=True):
    host = read_host(docker)

    # Тест карты

    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    canvas = home_page.get_mapCanvas()
    assert canvas.exist()

    assert canvas.click(home_page)
    driver.quit()

    # запуск теста для панели объектов (быстрый поиск, фильтры)
    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    objectPanel = home_page.get_objectPanel()
    assert objectPanel.exist()
    driver.quit()


    # запуск теста тепловой карты
    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    heatmap = home_page.get_heatmap()
    assert heatmap.exist()
    driver.quit()

    # запуск теста списка объектов

    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    itemList = home_page.get_itemList()
    assert itemList.exist()

    driver.quit()

    # запуск теста пространственной базы данных

    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    mapdb = home_page.get_mapdb()
    assert mapdb.exist()
    driver.quit()

    # запуск теста поиска по названию
    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    searchByName = home_page.get_searchByName()
    assert searchByName.exist()
    driver.quit()

    # запуск теста по сохранению параметров проекта
    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    mapOptions = home_page.get_mapOptions()
    assert mapOptions.exist()
    driver.quit()

    # запуск теста поиска по семантике
    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    searchBySemantic = home_page.get_searchBySemantic()
    assert searchBySemantic.exist()
    driver.quit()


    # запуск теста по работе внешних функций
    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    externalFunctions = home_page.get_externalFunctions()
    assert externalFunctions.exist()
    driver.quit()


    # запуск теста компонента состав карты
    # Открыть домашнюю страницу
    driver = test_driver(docker)
    home_page = HomePage(driver, host)
    home_page.open()

    mapContent = home_page.get_mapContent()
    assert mapContent.exist()
    driver.quit()

    print("SUCCESS: Все тесты выполнены!")
