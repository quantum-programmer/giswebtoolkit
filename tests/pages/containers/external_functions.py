from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait

from time import sleep

explicit_wait = 10  # sec


class ExternalFunctions:
    def __init__(self, driver):
        self.driver = driver
        self.action = ActionChains(self.driver)

    def click_element(self, locator, class_name, offSetX=1, offSetY=1,):
        self.driver.implicitly_wait(10)
        element = self.driver.find_element(locator, class_name)
        sleep(0.1)
        self.action.move_to_element(element).move_by_offset(
            offSetX, offSetY).click().perform()

    def is_element_visible(self, xpath):
        wait = WebDriverWait(self.driver, explicit_wait)
        try:
            wait.until(EC.visibility_of_element_located((By.XPATH, xpath)))
            return True
        except Exception:
            return False

    def exist(self):
        # Ждем загрузки страницы
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)
        print('START: Тест по работе внешних функций')

        try:
            self.click_element(
                By.CLASS_NAME, "event-panel", 40, 40)
            sleep(0.1)
            element = self.driver.find_element(
                By.XPATH, "//div[@class='v-virtual-scroll']")
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            sleep(0.1)
            while not self.is_element_visible("//div[contains(text(), 'Города')]"):
                action.send_keys(Keys.PAGE_DOWN).perform()
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Города')]/../..//i")
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-external-function')][1]")
            sleep(1.5)
            action.send_keys(Keys.PAGE_DOWN).perform()
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-external-function')][2]")
            action.send_keys(Keys.PAGE_DOWN).perform()
            sleep(5)
            print('SUCCESS: Тест по работе внешних функций')
            return True
        except:
            print('---->FAILED: Тест по работе внешних функций')
            self.driver.save_screenshot(
                '/usr/src/app/gwtk/error_external_functions.png')
            return False
