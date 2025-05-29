from time import sleep
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

explicit_wait = 10  # sec


class MapCanvas:
    def __init__(self, driver):
        self.driver = driver

    def exist(self):

        WebDriverWait(self.driver, explicit_wait)

        print('START: Тест отображения карты')

        try:
            self.driver.implicitly_wait(10)
            self.driver.find_element(By.CLASS_NAME, 'map-canvas')

            print('SUCCESS: Тест отображения карты')
            return True
        except:
            print('---->FAILED: Тест отображения карты')
            self.driver.save_screenshot('/usr/src/app/gwtk/error_canvas_map.png')
            return False

    def click(self, home_page):
        print('START: Тест клика по карте')

        try:
            sidebar = home_page.get_sidebar()
            # Ждем загрузки страницы
            self.driver.implicitly_wait(10)
            WebDriverWait(self.driver, explicit_wait)
            action = ActionChains(self.driver)

            elem = self.driver.find_element(By.CLASS_NAME, 'event-panel')
            action.move_to_element(elem).move_by_offset(40, 40).click().perform()

            sleep(5)

            if sidebar.exist():
                print('SUCCESS: Тест клика по карте')
                return True
            else:
                raise Exception
        except:
            print('---->FAILED: Тест клика по карте')
            self.driver.save_screenshot('/usr/src/app/gwtk/error_canvas_click.png')
            return False
