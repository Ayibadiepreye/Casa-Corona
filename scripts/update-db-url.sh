#!/bin/bash
# Reads password from arg 1, updates .env in place
PWD_VAL="$1"
ROOT="C:/Users/bonni/Downloads/Casa-Corona-main"
python3 -c "
import re, sys
pwd = sys.argv[1]
path = sys.argv[2]
with open(path, 'r') as f:
    c = f.read()
new_url = 'DATABASE_URL=\"postgresql://neondb_owner:' + pwd + '@ep-long-dew-aikmkda6-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require\"'
c = re.sub(r'^DATABASE_URL=.*$', new_url, c, flags=re.MULTILINE)
with open(path, 'w') as f:
    f.write(c)
print('Updated', path)
" "$PWD_VAL" "$ROOT/.env"
cp "$ROOT/.env" "$ROOT/apps/api/.env" && echo "Copied to apps/api/.env"