from time import sleep
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains

explicit_wait = 10  # sec


class Heatmap:
    def __init__(self, driver):
        self.driver = driver

    def exist(self):

        # Ждем загрузки страницы
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)

        print('START: Тест построения тепловых карт')

        try:
            self.driver.implicitly_wait(10)
            menu = self.driver.find_element(By.CLASS_NAME, "gwtk-test-tool-mdi-menu")

            action.move_to_element(menu).move_by_offset(
                    1, 1).click().perform()
            heatmapButton = self.driver.find_element(By.CLASS_NAME, "gwtk-test-tool-heatmap")
            heatmapButton.location_once_scrolled_into_view
            sleep(0.5)

            action.move_to_element(heatmapButton).move_by_offset(
                1, 1).click().perform()

            inputLayer = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-heatmap-selectLayer")

            action.move_to_element(inputLayer).move_by_offset(
                1, 1).click().perform()

            self.driver.implicitly_wait(10)
            elem = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'Топографическая карта Ногинска')]")

            action.move_to_element(elem).move_by_offset(
                1, 1).click().perform()
            clearText = self.driver.find_element(
                By.CLASS_NAME, "v-input__icon--clear")
            action.move_to_element(clearText).move_by_offset(
                1, 1).click().perform()

            self.driver.find_element(
                By.XPATH, "//input[@required='required']").send_keys('test-name')

            build = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-heatmap-buildButton")

            action.move_to_element(build).move_by_offset(
                2, 2).click().perform()
            circle = True
            sleep(1)
            while circle:
                try:
                    self.driver.implicitly_wait(5)
                    element = self.driver.find_element(
                        By.TAG_NAME, "circle")
                except:
                    circle = False
                    break
            self.driver.implicitly_wait(1)
            mapLayer = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-tool-layers")

            action.move_to_element(mapLayer).move_by_offset(
                1, 1).click().perform()
            self.driver.implicitly_wait(1)

            userLayer = mapLayer = self.driver.find_element(
                By.CLASS_NAME, "gwtk-test-mapContent-layer-Пользовательские")

            action.move_to_element(userLayer).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)

            self.driver.implicitly_wait(1)
            self.driver.find_element(By.XPATH, "//div[contains(text(), ' test-name ')]")

            print('SUCCESS: Тест построения тепловых карт')
            return True
        except:
            print('---->FAILED: Тест построения тепловых карт')
            self.driver.save_screenshot('/usr/src/app/gwtk/error_heatmap.png')
            return False
