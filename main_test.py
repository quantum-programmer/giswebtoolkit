import sys
from tests.tests.test_app import test_load_rsw


test_load_rsw('-local' not in sys.argv)
