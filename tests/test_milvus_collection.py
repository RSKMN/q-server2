from pymilvus import connections, utility

connections.connect(
    host="127.0.0.1",
    port="19530"
)

collections = utility.list_collections()

print("Collections:", collections)