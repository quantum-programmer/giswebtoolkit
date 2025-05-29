from time import sleep
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys


explicit_wait = 10  # sec


class SearchBySemantic:
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
        print("START: Тест поиска по семантике")
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)

        try:
            self.click_element(By.CSS_SELECTOR, ".gwtk-test-tool-mdi-menu")
            self.click_element(
                By.CLASS_NAME, "gwtk-test-tool-search-by-semantic")
            # Выполним поиск по номеру объекта
            print("START: Тест поиска по номеру объекта")
            sleep(0.2)
            self.click_element(
                By.XPATH, "//input[@placeholder = 'Выберите слой']")
            self.click_element(
                By.XPATH, "//div[text()='Карта Ногинска']")
            sleep(0.2)
            self.click_element(By.XPATH, "//input[@type='number']")
            sleep(0.1)
            self.driver.implicitly_wait(5)
            element = self.driver.find_element(
                By.XPATH, "//input[@type='number']")
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys("157737").perform()
            self.click_element(By.XPATH, "//span[contains(text(), 'Найти')]")
            try:
                self.driver.implicitly_wait(5)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), 'Объекты (0/0)')]")
                print("element", element)
                if (element):
                    print("---->FAILED: Тест поиска по номеру объекта 1")
                    return False
            except:
                print("SUCCESS: Тест поиска по номеру объекта 1")
                pass
            self.click_element(By.CSS_SELECTOR, ".gwtkmapobject .gwtk-test-sideSheetItem-close")
            # повторим поиск с другим значением для дальнейшей проверки истории поиска
            sleep(0.2)
            self.driver.implicitly_wait(5)
            element = self.driver.find_element(
                By.XPATH, "//input[@type='number']")
            sleep(0.2)
            element.send_keys(Keys.CONTROL + "a")
            sleep(0.2)
            element.send_keys(Keys.DELETE)
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys("108").perform()
            self.click_element(By.CLASS_NAME, "gwtk-test-searchbynumber-byallmaps")
            self.click_element(By.XPATH, "//span[contains(text(), 'Найти')]")
            try:
                self.driver.implicitly_wait(10)
                element = self.driver.find_element(By.XPATH, "//span[contains(text(), 'Объекты (0/0)')]")
                if (element):
                    print("---->FAILED: Тест поиска по номеру объекта 2")
                    return False
            except:
                print("SUCCESS: Тест поиска по номеру объекта 2")
                pass
            self.click_element(By.CSS_SELECTOR, ".gwtkmapobject .gwtk-test-sideSheetItem-close")
            # проверим историю поиска
            self.click_element(By.CLASS_NAME, "gwtk-test-searchbynumber-history")
            sleep(0.1)
            try:
                self.driver.implicitly_wait(5)
                element = self.driver.find_element(
                    By.XPATH, "//div[contains(text(),'157737')]")
                if (element):
                    action.move_to_element(element).move_by_offset(1, 1).click().perform()
                    self.click_element(By.XPATH, "//span[contains(text(), 'Найти')]")
                    print("SUCCESS: Тест поиска по номеру объекта 3")
            except:
                print("---->FAILED: Тест поиска по номеру объекта 3")
                return False
            try:
                self.driver.implicitly_wait(5)
                element = self.driver.find_element(
                    By.XPATH, "//span[contains(text(), 'Объекты (0/0)')]")
                print("element", element)
                if (element):
                    print("---->FAILED: Тест поиска по номеру объекта 4")
                    return False
            except:
                print("SUCCESS: Тест поиска по номеру объекта 4")
                pass
            self.click_element(By.CSS_SELECTOR, ".gwtkmapobject .gwtk-test-sideSheetItem-close")
            self.click_element(By.CLASS_NAME, "gwtk-test-searchbynumber-history")
            # удалим запись из истории поиска
            self.click_element(By.XPATH, "//div[contains(text(),'108')]")
            self.click_element(By.CLASS_NAME, "gwtk-test-searchbynumber-history")
            self.click_element(By.XPATH, "//span[contains(text(),'Очистить')]")
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Сбросить все')]")
            print("SUCCESS: Тест поиска по номеру объекта")
            return True
        except:
            print("---->FAILED: Тест поиска по семантике")
            self.driver.save_screenshot(
                "/usr/src/app/gwtk/error_search_by_semantic.png")
            return False
