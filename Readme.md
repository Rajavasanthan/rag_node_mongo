Add this JSON to mongodb atlas

```JSON
{
  "mappings": {
    "fields": {
      "embedding": [
        {
          "dimensions": 1536,
          "similarity": "euclidean",
          "type": "knnVector"
        }
      ]
    }
  }
}
```