from time import sleep
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


explicit_wait = 10  # sec


class SearchByName:
    def __init__(self, driver):
        self.driver = driver

    def is_element_visible(self, xpath):
        wait = WebDriverWait(self.driver, explicit_wait)
        try:
            wait.until(EC.visibility_of_element_located((By.XPATH, xpath)))
            return True
        except Exception:
            return False

    def exist(self):

        # Ждем загрузки страницы
        print('START: Тест поиска по названию')
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)

        try:
            # поиск по 1 слою
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CSS_SELECTOR, '.gwtk-test-tool-mdi-menu')
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-tool-search_lightning")
            element.location_once_scrolled_into_view
            sleep(0.1)
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-selectlayer")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div/span[contains(text(), 'Карта Ногинска (По всем семантикам)')]")
            element.location_once_scrolled_into_view
            sleep(0.1)
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-byallmaps")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-textfield")
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys('а').perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-searchbutton")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            try:
                self.driver.implicitly_wait(10)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]")
                if (element):
                    print('---->FAILED: Тест поиска по названию 1')
                    return False
            except:
                print("SUCCESS: Тест поиска по названию 1")
                pass
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-selectsemantic")
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys('Собственное назва').perform()
            sleep(1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div/div/div/span[contains(text(), 'Собственное назва')]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-searchbutton")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            try:
                self.driver.implicitly_wait(10)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]")
                if (element):
                    print('---->FAILED: Тест поиска по названию 2')
                    return False
            except:
                print("SUCCESS: Тест поиска по названию 2")
                pass
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            # полное совпадение
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-complatematch")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-searchbutton")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]")
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "mdi-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-textfield")
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys('Новое строение').perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-searchbutton")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            try:
                self.driver.implicitly_wait(10)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]")
                if (element):
                    print('---->FAILED: Тест поиска по названию 3')
                    return False
            except:
                print("SUCCESS: Тест поиска по названию 3")
                pass
            sleep(0.2)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            # только видимые
            sleep(0.2)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-visibleonly")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-searchbutton")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]")

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            # поиск по всем слоям
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-byallmaps")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-visibleonly")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-complatematch")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "mdi-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-textfield")
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys('222222').perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-searchbutton")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            try:
                self.driver.implicitly_wait(10)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), ' Объекты (0/0) ')]")
                if (element):
                    print('---->FAILED: Тест поиска по названию 4')
                    return False
            except:
                print("SUCCESS: Тест поиска по названию 4")
                pass
            sleep(0.2)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-selectlayer")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div/span[contains(text(), 'Карелия (По всем семантикам)')]")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-selectsemantic")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.2)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'По всем семантикам')]/../../../..")
            while not self.is_element_visible("//div[contains(text(), 'Идентификатор OSM')]"):
                self.driver.execute_script(
                    'arguments[0].scrollTop = arguments[0].scrollHeight', element)

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'Идентификатор OSM')]")
            element.location_once_scrolled_into_view
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            # поиск по всем слоям
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-byallmaps")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "mdi-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-textfield")
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys('4264312').perform()
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-searchbyname-searchbutton")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.2)
            self.driver.implicitly_wait(30)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), ' Объекты (1/1) ')]")
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()

            print('SUCCESS: Тест поиска по названию')
            return True
        except:
            print('---->FAILED: Тест поиска по названию 5')
            self.driver.save_screenshot(
                '/usr/src/app/gwtk/error_search_by_name.png')
            return False
