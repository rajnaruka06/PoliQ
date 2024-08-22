#PMJ 22/8/2024: script to test if backend connection to postgresDB is working

import os
from dotenv import load_dotenv

load_dotenv()

print(os.environ.get('POSTGRES_USER'))
print(os.environ.get('POSTGRES_PASSWORD'))
print(os.environ.get('POSTGRES_HOST'))
print(os.environ.get('POSTGRES_PORT'))
print(os.environ.get('ELECDATA_DB_NAME'))
