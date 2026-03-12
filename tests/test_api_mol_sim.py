import requests
import numpy as np

# vector = np.random.rand(768).tolist()

response = requests.post(
    "http://localhost:8000/molecules/similar",
    json={"smiles": "CCO", "top_k": 5}
)

print(response.json())