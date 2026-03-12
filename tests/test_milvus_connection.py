from pymilvus import connections

connections.connect(
    host="127.0.0.1",
    port="19530"
)

print("Milvus connection OK")