from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from time import sleep
from selenium.webdriver.support import expected_conditions as EC

explicit_wait = 10  # sec


class Mapdb:
    def __init__(self, driver):
        self.driver = driver

    def exist(self):
        # Ждем загрузки страницы
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)

        print('START: Тест пространственной базы данных')

        try:
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CSS_SELECTOR, '.gwtk-test-tool-mdi-menu')
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-tool-mdi-database-outline")
            element.location_once_scrolled_into_view
            sleep(0.5)
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            circle = True
            self.driver.implicitly_wait(1)
            while circle:
                try:
                    element = self.driver.find_element(
                        By.TAG_NAME, "circle")
                except:
                    circle = False
                    break
            sleep(3)
            print('START: Выбор слоя')
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-selectLayer")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)

            self.driver.implicitly_wait(10)
            try:
                element = self.driver.find_element(
                    By.XPATH, "//div[contains(text(), 'Карелия')]"
                )
            except:
                element = self.driver.find_element(
                    By.XPATH, "//div[contains(text(), 'Карелия')]"
                )
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)

            print('START: Выбор типа объекта')
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-selectObjectType")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[@class='v-list-item__title'][contains(text(), 'Территории')]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(2)

            print('START: Выбор типа быстрого фильтра')
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-selectFastSearchFilter")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'id')]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//input[@placeholder='Значение']").send_keys('5')
            sleep(0.5)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-fastSearchButton")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(2.0)

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-info")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), '5')]")
            sleep(0.1)
            print('SUCCESS: Работа фильтра')
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-back")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-geolocation")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "vector-polyline")

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-reset")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-advancedSearch")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, '//span[contains(text(), "Добавить")]')
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'id')]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(1.0)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-operator")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(1.0)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'равняется')]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = (
                self.driver.find_element(By.CLASS_NAME, "gwtk-test-mapdb-field")
                .find_element(By.XPATH, ".//input[@type='text']")
            ).send_keys("5")
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-search")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(1.0)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-info")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), '5')]")
            sleep(0.1)
            print('SUCCESS: Работа поиска 1')
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-back")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-reset")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//tbody//tr[1]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//tbody//tr[2]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//tbody//tr[3]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(By.CLASS_NAME, "gwtk-test-mapdb-select")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-mapSearch")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapdb-info")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), '1')]")
            print('SUCCESS: Работа поиска 2')

            print('SUCCESS: Тест пространственной базы данных')
            return True
        except:
            print('---->FAILED: Тест пространственной базы данных')
            self.driver.save_screenshot('/usr/src/app/gwtk/error_mapdb.png')
            return False
