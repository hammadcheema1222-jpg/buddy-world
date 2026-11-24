# Community mall layouts

Many shopping centres have no indoor map anywhere online. Buddy World builds a 3D layout from
OpenStreetMap first, then adds shops from these community files so everyone can find a shop inside.

**File name:** the centre's name in lowercase with dashes, e.g. `liberty-shopping-centre.json`
(the app shows the exact name in the "Add a shop" form).

```json
{
  "mall": "Liberty Shopping Centre",
  "shops": [
    { "name": "Example Shoes", "level": 0, "unit": "12", "lat": 51.5801, "lon": 0.1832, "category": "fashion",
      "opening_hours": "Mo-Sa 09:00-18:00", "website": "https://example.com", "added_by": "your-github-name" }
  ]
}
```
- `level`: 0 = ground floor, 1 = first floor, -1 = lower ground
- `category`: food, fashion, tech, food shop, health & beauty, money, leisure, shop
- Only shops and public facilities. No personal details.
- Even better: add the shops to [OpenStreetMap](https://www.openstreetmap.org) with a `level` tag, so every map app benefits.
