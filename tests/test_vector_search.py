import numpy as np
from pymilvus import connections, Collection

connections.connect(host="127.0.0.1", port="19530")

collection = Collection("molecule_embeddings")

query = np.random.rand(768).astype("float32").tolist()
metric = collection.indexes[0].params.get("metric_type", "COSINE")
results = collection.search(
    data=[query],
    anns_field="embedding",
    param={"metric_type": metric, "params": {"nprobe": 10}},
    limit=3
)

print("Search successful")
print(results)