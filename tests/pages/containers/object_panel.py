from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait

from time import sleep

explicit_wait = 10  # sec

class ObjectPanel:
    def __init__(self, driver):
        self.driver = driver
        self.action = ActionChains(self.driver)

    def click_element(
        self,
        locator,
        class_name,
        offSetX=1,
        offSetY=1,
    ):
        self.driver.implicitly_wait(5)
        element = self.driver.find_element(locator, class_name)
        sleep(3)
        self.action.move_to_element(element).move_by_offset(
            offSetX, offSetY
        ).click().perform()

    def exist(self):
        # Ждем загрузки страницы
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)
        print("START: Тест по работе панели объектов")
        try:
            # Развернем окно браузера
            self.driver.maximize_window()
            # Клик по карте
            sleep(3.0)
            self.click_element(By.CLASS_NAME, "event-panel", 40, 40)
            circle = True
            self.driver.implicitly_wait(1)
            while circle:
                try:
                    element = self.driver.find_element(
                        By.TAG_NAME, "circle")
                except:
                    circle = False
                    break
            print("START: Тест по работе быстрого поиска")
            self.driver.implicitly_wait(5)
            element = self.driver.find_element(
                By.XPATH, "//input[@placeholder='Значение']"
            )
            action.move_to_element(element).move_by_offset(1, 1).click().send_keys(
                "Город"
            ).perform()
            sleep(0.2)
            action.send_keys(Keys.ENTER).perform()
            try:
                self.driver.implicitly_wait(5)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]"
                )
                if element:
                    print("---->FAILED: Тест по работе быстрого поиска")
                    return False
            except:
                pass
            # Очистим поле значение
            self.click_element(By.XPATH, "//button[contains(@class, 'mdi-close')]")
            sleep(3.0)
            print("START: Тест по работе типа и порядка сортировки")
            # Иконка сортировки
            self.click_element(By.XPATH, "//span[@class='gwtk-test-map-object-sort']/button")
            # Найдем все элементы в перечне сортировок
            list = self.driver.find_element(
                By.XPATH, "//div[@role='menu']/div/div"
            )
            itemList = list.find_elements(
                By.XPATH, ".//div[@role='menuitem']"
            )
            count = len(itemList)
            self.driver.implicitly_wait(0.5)
            for item in itemList:
                action.move_to_element(item).move_by_offset(1, 1).click().perform()
                circle = True
                while circle:
                    try:
                        element = self.driver.find_element(
                            By.TAG_NAME, "circle")
                    except:
                        circle = False
                        break
                if (count > 1 ):
                    self.click_element(By.XPATH, "//span[@class='gwtk-test-map-object-sort']/button")
                    count=count-1
                    sleep(0.5)

            sleep(0.5)
            print("START: Тест по выбору семантик для сортировки")
            self.click_element(By.CLASS_NAME, "mdi-sort-alphabetical-variant")
            sleep(3)
            # Найдем все элементы в перечне семантик
            self.driver.implicitly_wait(1.0)
            list = self.driver.find_element(By.CLASS_NAME, "gwtk-test-map-object-semantic-list")
            itemList = list.find_elements(By.XPATH, ".//div[@role='menuitem']")[0:3]
            count = len(itemList) - 1

            while count >= 0:
                list = self.driver.find_element(By.CLASS_NAME, "gwtk-test-map-object-semantic-list")
                itemList = list.find_elements(By.XPATH, ".//div[@role='menuitem']")[0:3]
                action.move_to_element(itemList[count]).move_by_offset(1, 1).click().perform()
                circle = True
                while circle:
                    try:
                        element = self.driver.find_element(By.TAG_NAME, "circle")
                    except:
                        circle = False
                        break

                if (count >= 1 ):
                    self.click_element(By.CLASS_NAME, "mdi-sort-alphabetical-variant")
                    sleep(2)

                count = count - 1

            print("START: Тест по работе фильтров")
            self.click_element(By.XPATH, "//span[contains(text(), 'Фильтры')]")
            self.click_element(By.XPATH, "//span[contains(text(), 'Тип объектов')]")
            # Выберем первый элемент в меню Тип объектов ("Гидрография")
            self.click_element(
                By.XPATH, "(//span[contains(text(), 'Тип объектов')]/ancestor::div[2]//input[@role='checkbox'])[1]"
            )
            self.click_element(By.XPATH, "//span[contains(text(), 'Применить')]")
            try:
                self.driver.explicit_wait
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]"
                )
                if element:
                    print(
                        "---->FAILED: Тест по работе фильтров - 'Тип объектов'"
                    )
                    return False
            except:
                print("SUCCESS: Тест по работе фильтров  - 'Тип объектов'")
                pass

            self.click_element(
                By.XPATH,
                "//div[@class='v-virtual-scroll']//div[@class='v-virtual-scroll__item'][1]",
            )
            self.click_element(By.XPATH, "//span[contains(text(), 'Выбрать')]/..")
            sleep(1)
            # Клик по карте
            self.click_element(By.CLASS_NAME, "event-panel", 40, 40)
            sleep(1)
            self.click_element(By.XPATH, "//span[contains(text(), 'Фильтры')]")
            self.click_element(
                By.XPATH,
                "//span[contains(text(), 'Объекты')]/../..//i[contains(@class, 'mdi-chevron-down')]",
            )
            # Выберем первый элемент в меню Объекты ("Административный район")
            self.click_element(
                By.XPATH,
                "(//span[contains(text(), 'Объекты')]/ancestor::div[2]//input[@role='checkbox'])[1]",
            )
            self.click_element(By.XPATH, "//span[contains(text(), 'Применить')]")
            try:
                self.driver.implicitly_wait(5)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]"
                )
                if element:
                    print("---->FAILED: Тест по работе фильтров - 'Объекты'")
                    return False
            except:
                print("SUCCESS: Тест по работе фильтров  - 'Объекты'")
                pass
            # Удалим фильтр
            self.click_element(
                By.XPATH, "//span[contains(@class, 'gwtk-chip')]//button"
            )
            sleep(0.5)
            self.click_element(By.XPATH, "//span[contains(text(), 'Фильтры')]")
            self.click_element(By.XPATH, "//span[contains(text(), 'Локализация')]")
            # Выберем первый элемент в меню Локализация ("Линейные")
            self.click_element(
                By.XPATH, "(//span[contains(text(), 'Локализация')]/ancestor::div[2]//input[@role='checkbox'])[1]"
            )
            self.click_element(By.XPATH, "//span[contains(text(), 'Применить')]")
            try:
                self.driver.implicitly_wait(5)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]"
                )
                if element:
                    print("---->FAILED: Тест по работе фильтров - 'Локализация'")
                    return False
            except:
                print("SUCCESS: Тест по работе фильтров  - 'Локализация'")
                pass
            # Удалим фильтр
            self.click_element(By.XPATH, "//span[contains(@class, 'gwtk-chip')]//button")
            sleep(2.0)
            self.click_element(By.XPATH, "//span[contains(text(), 'Фильтры')]")
            self.click_element(By.XPATH, "//span[contains(text(), 'Семантики')]")
            self.click_element(
                By.XPATH,
                "//div[contains(text(), 'Только заполненные')]/..//input[@role='switch']",
            )
            self.click_element(
                By.XPATH,
                "//div[contains(text(), 'Только заполненные')]/..//input[@role='switch']",
            )
            element = self.driver.find_element(
                By.XPATH, "//label[contains(text(),'Поиск')]/following-sibling::input[1]"
            )
            action.move_to_element(element).move_by_offset(1, 1).click().send_keys(
                "Собственное название"
            ).perform()
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Собственное название')]"
            )
            action.send_keys(Keys.PAGE_DOWN).perform()
            sleep(0.5)
            element = self.driver.find_element(
                By.XPATH, "//input[@placeholder='Собственное название, текст подписи']"
            )
            action.move_to_element(element).move_by_offset(1, 1).click().send_keys(
                "НОГИНСК*"
            ).perform()
            self.click_element(By.XPATH, "//span[contains(text(), 'Применить')]")
            try:
                self.driver.implicitly_wait(5)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]"
                )
                if element:
                    print(
                        "---->FAILED: Тест по работе фильтров - 'Собственное название'"
                    )
                    return False
            except:
                print("SUCCESS: Тест по работе фильтров  - 'Собственное название'")
                pass
            # Удалим фильтр
            self.click_element(
                By.XPATH, "//span[contains(@class, 'gwtk-chip')]//button"
            )
            sleep(2)
            self.click_element(By.XPATH, "//span[contains(text(), 'Выделить все')]/..")
            sleep(3)
            # Клик по карте
            self.click_element(By.CLASS_NAME, "event-panel", 40, 40)
            sleep(2)
            print("START: Тест по работе функций экспорта")
            self.click_element(By.XPATH, "//i[contains(@class, 'mdi-microsoft-excel')]")
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Экспорт загруженных объектов')]"
            )
            self.click_element(
                By.XPATH,
                "//div[contains(text(), 'Экспорт загруженных объектов')]/../../..//div[contains(text(), 'CSV')]",
            )
#             self.click_element(
#                 By.XPATH,
#                 "//div[contains(text(), 'Экспорт загруженных объектов')]/../../..//div[contains(text(), 'Таблица в буфер обмена')]",
#             )
            self.click_element(
                By.XPATH,
                "//div[contains(text(), 'Экспорт загруженных объектов')]/../../..//div[contains(text(), 'XLSX')]",
            )
            self.click_element(By.XPATH, "//i[contains(@class, 'mdi-microsoft-excel')]")
            self.click_element(
                By.XPATH,
                "//div[@class='v-virtual-scroll']//div[@class='v-virtual-scroll__item'][1]",
            )
            self.click_element(
                By.XPATH,
                "//div[@class='v-virtual-scroll']//div[@class='v-virtual-scroll__item'][2]",
            )
            self.click_element(By.XPATH, "//i[contains(@class, 'mdi-microsoft-excel')]")
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Экспорт указанных объектов')]"
            )
            self.click_element(
                By.XPATH,
                "//div[contains(text(), 'Экспорт указанных объектов')]/../../..//div[contains(text(), 'CSV')]",
            )
#             self.click_element(
#                 By.XPATH,
#                 "//div[contains(text(), 'Экспорт указанных объектов')]/../../..//div[contains(text(), 'Таблица в буфер обмена')]",
#             )
            self.click_element(
                By.XPATH,
                "//div[contains(text(), 'Экспорт указанных объектов')]/../../..//div[contains(text(), 'XLSX')]",
            )
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Экспорт всех объектов')]"
            )
            self.click_element(
                By.XPATH,
                "//div[contains(text(), 'Экспорт всех объектов')]/../../..//div[contains(text(), 'CSV')]",
            )
#             self.click_element(
#                 By.XPATH,
#                 "//div[contains(text(), 'Экспорт всех объектов')]/../../..//div[contains(text(), 'Таблица в буфер обмена')]",
#             )
            self.click_element(
                By.XPATH,
                "//div[contains(text(), 'Экспорт всех объектов')]/../../..//div[contains(text(), 'XLSX')]",
            )

            print("START: Тест по работе в режиме таблицы")
            sleep(1.0)
            self.click_element(By.XPATH, "//i[contains(@class, 'mdi-table-large')]")

            self.click_element(By.XPATH, "//*[@href[contains(., 'settings--sprite')]]")
            sleep(0.5)
            self.click_element(By.CLASS_NAME, "v-input--selection-controls__input")
            sleep(0.5)
            self.click_element(By.CLASS_NAME, "v-input--selection-controls__input")
            sleep(0.5)
            self.click_element(By.CLASS_NAME, "v-select__selections")
            self.click_element(By.XPATH, "//div[@class='v-list-item__content']/div[contains(text(),'5')]")
            sleep(0.5)
            self.click_element(By.XPATH, "//i[contains(@class, 'mdi-arrow-left')]")

            paginationList = self.driver.find_element(
                By.XPATH, "//ul[contains(@class, 'v-pagination')]"
            )
            pages = paginationList.find_elements(
                By.XPATH, ".//button[contains(@class, 'v-pagination__item')]"
            )
            for page in pages:
                action.move_to_element(page).move_by_offset(1, 1).click().perform()
                sleep(0.5)
            sleep(1.0)
            print("SUCCESS: Тест по работе панели объектов")
            return True
        except:
            print("---->FAILED: Тест по работе панели объектов")
            self.driver.save_screenshot("/usr/src/app/gwtk/error_object_panel.png")
            return False
