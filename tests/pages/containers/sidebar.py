from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from time import sleep

explicit_wait = 10  # sec


class Sidebar:
    def __init__(self, driver):
        self.driver = driver

    def exist(self):
        # Ждем загрузки страницы
        WebDriverWait(self.driver, explicit_wait)

        try:
            self.driver.implicitly_wait(10)
            self.driver.find_element(By.CSS_SELECTOR, 'div.gwtk-navigation-drawer')
        except:
            self.driver.save_screenshot('/usr/src/app/gwtk/error_sidebar.png')
            return False

        return True
