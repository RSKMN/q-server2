import requests
import numpy as np

vector = np.random.rand(768).tolist()

response = requests.post(
    "http://localhost:8000/embeddings",
    json={"ids": ["string"], "vectors": [vector]}
)

print(response.json())