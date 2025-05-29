FROM python:3.9.19-alpine

# создание директории приложения
WORKDIR /usr/src/app

RUN pip install --upgrade pip

RUN pip install selenium
RUN pip install webdriver-manager

CMD python gwtk/main_test.py && exit 0
