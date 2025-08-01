# Data Directory

This directory contains data files and sample datasets for the application.

## Structure

- `sample/` - Sample observation data
- `config/` - Data configuration files
- `cache/` - Cached data (should be in .gitignore)

## File Formats

- JSON files for observation data
- GeoJSON for geographic data
- Configuration files for data sources

## Example Data Structure

```json
{
  "obs": [
    {
      "file": "sample-radar-data.png",
      "timestamp": "2025-01-01T12:00:00Z",
      "type": "nexrad"
    }
  ]
}
```
