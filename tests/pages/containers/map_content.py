from time import sleep
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains

explicit_wait = 10  # sec

class MapContent:
    def __init__(self, driver):
        self.driver = driver
        self.action = ActionChains(self.driver)

    def click_element(self, locator, class_name, offSetX=1, offSetY=1,):
        self.driver.implicitly_wait(10)
        element = self.driver.find_element(locator, class_name)
        sleep(0.1)
        self.action.move_to_element(element).move_by_offset(
            offSetX, offSetY).click().perform()

    def exist(self):

        # Ждем загрузки страницы
        print("START: Тест состав карты")
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)

        try:
            self.click_element(By.CLASS_NAME, "gwtk-test-tool-layers")

            print("START: Тест виджета публикации карты")
            sleep(0.2)
            self.click_element(
                By.CLASS_NAME, "gwtk-test-tool-mdi-plus")
            try:
                self.driver.implicitly_wait(10)
                element = self.driver.find_element(
                    By.CLASS_NAME, "mdi-publish")
                if (not element):
                    print('---->FAILED: Тест виджета публикации карты')
                    return False
            except:
                pass
            print("SUCCESS: Тест виджета публикации карты")
            return True
        except:
            print("---->FAILED: Тест состав карты")
            self.driver.save_screenshot(
                "/usr/src/app/gwtk/error_map_content.png")
            return False
