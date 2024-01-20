Add this JSON to mongodb atlas Search Index

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