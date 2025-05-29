from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.keys import Keys
from time import sleep

explicit_wait = 10  # sec


class MapOptions:
    def __init__(self, driver):
        self.driver = driver
        self.action = ActionChains(self.driver)

    def click_element(self, locator, class_name, offSetX=1, offSetY=1,):
        self.driver.implicitly_wait(10)
        element = self.driver.find_element(locator, class_name)
        element.location_once_scrolled_into_view
        sleep(0.1)
        self.action.move_to_element(element).move_by_offset(
            offSetX, offSetY).click().perform()

    def dragAndDrop_element(self, locator, class_name, offSetX=1):
        self.driver.implicitly_wait(10)
        element = self.driver.find_element(locator, class_name)
        self.action.drag_and_drop_by_offset(element, offSetX, 0).perform()

    def exist(self):
        # Ждем загрузки страницы
        WebDriverWait(self.driver, explicit_wait)
        action = ActionChains(self.driver)

        try:
            # Параметры приложения

            print('START: Тест по сохранению параметров приложения')
            # Открытие меню Параметры
            self.click_element(By.CLASS_NAME, "gwtk-test-tool-mdi-menu")
            sleep(0.1)
            self.click_element(By.CLASS_NAME, "gwtk-test-tool-settings")

            # Период обновления слоев
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Период обновления слоев')]")
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//div[contains(text(), 'Период обновления (секунды)')]/../..//input")
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys("5").perform()
            print('SUCCESS: => Период обновления слоев')

            # Система координат
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Система координат')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Проекция карты:')]/../..//div[contains(@class, 'v-input__append-inner')]/div[1]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Радианы')]")
            sleep(0.1)
            print('SUCCESS: => Система координат')

            # Единицы измерения
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Единицы измерения')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//input[@value='KMT']/..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'миля')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//input[@value='SKMT']/..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'га')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//input[@value='DEG']/..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[starts-with(text(),' рад ')]")
            print('SUCCESS: => Единицы измерения')

            # Выделение объектов
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Выделение объектов')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Цвет линии')]/../..//div[contains(@class, 'v-input__append-inner')]/div[1]")
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-selection')]//div[@aria-valuemax='360']", -40
            )
            print('SUCCESS: => Выделение объектов')

            # Применим изменения
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'При включенном редакторе')]/..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(),'Никогда')]")
            print('SUCCESS: => Применить')

            # Поиск объектов
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Поиск объектов')]")
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(text(), 'Радиус захвата (пикселы)')]//div[@role='slider']", 30
            )
            print('SUCCESS: => Поиск объектов')

            # Измерения
            sleep(0.5)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Измерения')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Цвет заливки')]/../..//div[contains(@class, 'v-input__append-inner')]/div[1]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-measurements-1')]/div[contains(@class, 'v-color-picker__canvas')]", 50, -20)
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-measurements-1')]//div[@aria-valuemax='360']", 30
            )
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Непрозрачность')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Цвет заливки')]/../../following-sibling::fieldset//div[contains(@class, 'v-input__append-inner')]/div[1]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-measurements-2')]/div[contains(@class, 'v-color-picker__canvas')]", 50, -20)
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-measurements-2')]//div[@aria-valuemax='360']", -50
            )
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(text(), 'Непрозрачность')]//div[@role='slider']", -30
            )
            print('SUCCESS: => Измерения')

            # Пользовательский интерфейс
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), 'Пользовательский интерфейс')]")
            element.location_once_scrolled_into_view
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            # Скрол вниз
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            element.location_once_scrolled_into_view

            # Темная тема
            sleep(0.1)
            self.click_element(By.XPATH, "//input[@role='switch']")

            # Выбор основного цвета
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-ui-primaryColor')]")

            # Поле с цветом
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-1')]/div[contains(@class, 'v-color-picker__canvas')]", 50, -20)
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-1')]//div[@aria-valuemax='360']", 10
            )
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-1')]//div[@aria-valuemax='1']", -30
            )
            # Применим изменения
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")

            # Выбор дополнительного цвета
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-ui-secondaryColor')]")
            # Поле с цветом
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-2')]/div[contains(@class, 'v-color-picker__canvas')]", 50, -20)
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-2')]//div[@aria-valuemax='360']", 30
            )
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-2')]//div[@aria-valuemax='1' ]", -30
            )
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Средний шрифт')]/../..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[starts-with(text(),'Крупный шрифт')]")

            # Применим изменения
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//i[contains(@class, 'mdi-chevron-left')]")
            sleep(0.5)
            print('SUCCESS: => Пользовательский интерфейс')

            # Перезагрузка
            self.driver.get(self.driver.current_url)
            self.driver.refresh()
            print('SUCCESS: Тест по сохранению параметров приложения')

            # Параметры проекта

            print('START: Тест по сохранению параметров проекта')

            # Открытие меню Параметры
            self.click_element(By.CLASS_NAME, "gwtk-test-tool-mdi-menu")
            sleep(0.1)
            self.click_element(By.CLASS_NAME, "gwtk-test-tool-settings")
            # Скрол вниз
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            element.location_once_scrolled_into_view
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Сформировать параметры проекта')]")
            sleep(0.5)

            # Период обновления слоев
            self.click_element(
                By.XPATH, "(//span[contains(text(), 'Период обновления слоев')])[2]")
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "(//div[contains(text(), 'Период обновления (секунды)')]/../..//input)")
            action.move_to_element(element).move_by_offset(
                1, 1).click().send_keys(Keys.BACK_SPACE, '1').perform()
            # Система координат
            sleep(0.1)
            self.click_element(
                By.XPATH, "(//span[contains(text(), 'Система координат')])[2]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "(//div[contains(text(), 'Проекция карты:')]/../..//div[contains(@class, 'v-input__append-inner')]/div[1])")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Градусы, минуты, секунды')]")
            sleep(0.1)

            # Единицы измерения
            sleep(0.1)
            self.click_element(
                By.XPATH, "(//span[contains(text(), 'Единицы измерения')])[2]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//input[@value='NMI']/..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'фут')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//input[@value='HA']/..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'км²')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//input[@value='RAD']/..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[starts-with(text(),' град мин сек ')]")
            # Выделение объектов
            sleep(0.1)
            self.click_element(
                By.XPATH, "(//span[contains(text(), 'Выделение объектов')])[2]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Цвет линии')]/../..//div[contains(@class, 'v-input__append-inner')]/div[1]")
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-selection')]//div[@aria-valuemax='360']", 40
            )
            # Применим изменения
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Никогда')]/..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(),'При включенном редакторе')]")
            # Поиск объектов
            sleep(0.1)
            self.click_element(
                By.XPATH, "(//span[contains(text(), 'Поиск объектов')])[2]")
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(text(), 'Радиус захвата (пикселы)')]//div[@role='slider']", -30
            )
            # Измерения
            sleep(0.5)
            self.click_element(
                By.XPATH, "(//span[contains(text(), 'Измерения')])[2]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Цвет заливки')]/../..//div[contains(@class, 'v-input__append-inner')]/div[1]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-measurements-1')]/div[contains(@class, 'v-color-picker__canvas')]", -50, 20)
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-measurements-1')]//div[@aria-valuemax='360']", -30
            )
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Непрозрачность')]")
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Цвет заливки')]/../../following-sibling::fieldset//div[contains(@class, 'v-input__append-inner')]/div[1]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-measurements-2')]/div[contains(@class, 'v-color-picker__canvas')]", -50, 20)
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-measurements-2')]//div[@aria-valuemax='360']", 50
            )
            # Непрозрачность
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(text(), 'Непрозрачность')]//div[@role='slider']", 30
            )

            # Пользовательский интерфейс
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "(//span[contains(text(), 'Пользовательский интерфейс')])[2]")
            element.location_once_scrolled_into_view
            action.move_to_element(element).move_by_offset(
                1, 1).click().perform()
            # Скрол вниз
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            element.location_once_scrolled_into_view

            # Темная тема
            sleep(0.1)
            self.click_element(By.XPATH, "//input[@role='switch']")

            # Выбор основного цвета
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-ui-primaryColor')]")

            # Поле с цветом
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-1')]/div[contains(@class, 'v-color-picker__canvas')]", -50, 20)
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-1')]//div[@aria-valuemax='360']", -10
            )
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-1')]//div[@aria-valuemax='1']", 10
            )
            # Применим изменения
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")

            # Выбор дополнительного цвета
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-ui-secondaryColor')]")
            # Поле с цветом
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-2')]/div[contains(@class, 'v-color-picker__canvas')]", -50, 20)
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-2')]//div[@aria-valuemax='360']", -30
            )
            sleep(0.1)
            self.dragAndDrop_element(
                By.XPATH, "//div[contains(@class, 'gwtk-test-color-picker-ui-2')]//div[@aria-valuemax='1' ]", 10
            )
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[contains(text(), 'Крупный шрифт')]/../..//i")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//div[starts-with(text(),'Средний шрифт')]")

            # Применим изменения
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            sleep(0.5)
            self.click_element(
                By.XPATH, "//i[contains(@class, 'mdi-chevron-left')]")
            # Перезагрузка
            self.driver.get(self.driver.current_url)
            self.driver.refresh()
            print('SUCCESS: => Сохранение параметров проекта')

            # Удалим параметры проекта

            self.click_element(By.CLASS_NAME, "gwtk-test-tool-mdi-menu")
            sleep(0.1)
            self.click_element(By.CLASS_NAME, "gwtk-test-tool-settings")
            sleep(0.1)
            # Скрол вниз
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            element.location_once_scrolled_into_view
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Удалить параметры проекта')]")
            sleep(0.5)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Выполнить')]/../..")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            sleep(0.1)
            self.click_element(
                By.XPATH, "//i[contains(@class, 'mdi-chevron-left')]")
            sleep(0.5)
            # Перезагрузка
            self.driver.get(self.driver.current_url)
            self.driver.refresh()
            print('SUCCESS: => Удаление параметров проекта')

            self.click_element(By.CLASS_NAME, "gwtk-test-tool-mdi-menu")
            sleep(0.1)
            self.click_element(By.CLASS_NAME, "gwtk-test-tool-settings")
            sleep(0.1)
            self.driver.implicitly_wait(10)
            element = self.driver.find_element(
                By.XPATH, "//span[contains(text(), 'Применить')]")
            element.location_once_scrolled_into_view
            sleep(0.1)
            self.click_element(
                By.XPATH, "//span[contains(text(), 'Отменить')]")
            sleep(0.5)
            self.click_element(
                By.XPATH, "//i[contains(@class, 'mdi-chevron-left')]")
            sleep(5)
            print('SUCCESS: Тест по сохранению параметров проекта')
            return True
        except:
            print('---->FAILED: Тест по сохранению параметров')
            self.driver.save_screenshot(
                '/usr/src/app/gwtk/error_mapOptions.png')
            return False
