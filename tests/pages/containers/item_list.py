from time import sleep
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains

explicit_wait = 10  # sec


class ItemList:
    def __init__(self, driver):
        self.driver = driver

    def exist(self):

        # Ждем загрузки страницы
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)

        print('START: Тест списка объектов')

        try:
            self.driver.implicitly_wait(10)

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-tool-mdi-menu")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)

            self.driver.implicitly_wait(10)
            elem = self.driver.find_element(
                By.CLASS_NAME, 'gwtk-test-tool-mdi-format-list-bulleted-type')
            elem.location_once_scrolled_into_view
            sleep(0.5)
            action.move_to_element(elem).move_by_offset(1, 1).click().perform()
            sleep(10.)
            elem = self.driver.find_element(By.CLASS_NAME, 'event-panel')
            action.move_to_element(elem).move_by_offset(40, 40).click().perform()
            sleep(3.)
            elem = self.driver.find_elements(By.CSS_SELECTOR, '.gwtk-selectable-parent')[0]
            action.move_to_element(elem).move_by_offset(1, 1).click().perform()
            elem = self.driver.find_elements(By.CSS_SELECTOR, '.gwtk-selectable-parent')[1]
            action.move_to_element(elem).move_by_offset(1, 1).click().perform()

            elem = self.driver.find_element(
                By.CSS_SELECTOR, '.gwtk-test-mapOnjectPanelControl-select')
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-featureSamples-create")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)

            sleep(0.5)
            elem = self.driver.find_element(
                By.CSS_SELECTOR, '.test-confirm-apply')
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            sleep(0.1)
            self.driver.implicitly_wait(10)
            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-featureSamples-group0")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-featureSamples-group0")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            try:
                self.driver.implicitly_wait(0.1)
                elem = self.driver.find_element(
                By.XPATH, "//main/div/div[2]/div/div[10]/svg/g/g/g[1]")
                if (elem):
                    print("---->FAILED: Тест списка объектов 1")
                    return False
            except:
                print("SUCCESS: Тест списка объектов 1")
                pass

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-featureSamples-showItem")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            sleep(0.1)
            self.driver.implicitly_wait(10)
            elem = self.driver.find_element(
                By.XPATH, "//span[contains(text(), '2')]")

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            elem = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'Список 1')]")

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-tool-mdi-menu")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-tool-mdi-format-list-bulleted-type")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            elem = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'Список 1')]")

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-featurSamples-deleteGroup")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-featureSamples-confirmDelete")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            try:
                self.driver.implicitly_wait(1)
                elem = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'Список 1')]")
                if (elem):
                    print("---->FAILED: Тест списка объектов 2")
                    return False
            except:
                print("SUCCESS: Тест списка объектов 2")
                pass

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-sideSheetItem-close")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-tool-mdi-menu")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)

            elem = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-tool-mdi-format-list-bulleted-type")
            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()

            try:
                self.driver.implicitly_wait(0.1)
                elem = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'Список 1')]")
                if (elem):
                    print("---->FAILED: Тест списка объектов 3")
                    return False
            except:
                print("SUCCESS: Тест списка объектов 3")
                pass

            # sleep(2)
            print('SUCCESS:  Тест списка объектов')
            return True
        except:
            print('---->FAILED: Тест списка объектов')
            self.driver.save_screenshot('/usr/src/app/gwtk/error_item_list.png')
            return False
