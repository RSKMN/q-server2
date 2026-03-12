import psycopg2

conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="research_lab",
    user="postgres",
    password="postgres"
)

cur = conn.cursor()
cur.execute("SELECT 1;")

print("Postgres connection OK")

cur.close()
conn.close()