# 🚉 Catch It

**Which departure can I actually make, and how?** Catch It shows every bus and train you could catch by walking, running, cycling or getting a lift, with a live chance for each, and lets you watch the vehicle coming.

▶ **Open it:** https://hammadcheema1222-jpg.github.io/buddy-world/catch-it/

| Page | What it does |
|---|---|
| `index.html` Board | Live departures (TfL buses, Elizabeth line, Tube, Overground; National Rail with your own free key), a race strip per departure, catch chance per mode, leave-now countdown, follow-a-bus, bus-to-train connection chances, platform prediction, learns your real walking/running times |
| `map.html` Map | Map, Satellite or 3D world (satellite imagery + real terrain + 3D buildings + real-time sky). Every live bus and train as a 3D model on its real road or OpenStreetMap track. Ride a real vehicle live (outside chase cam or left/right/front window) or a fast preview; which side to sit on (sun glare + parks and water) |
| `station.html` Station | Entrance-to-platform time from OpenStreetMap indoor data: quickest, step-free or no-lift routes, crowd-adjusted walking speed, live TfL lift problems |

## The maths inside
- **Catch chance:** both your trip time and the vehicle's time are uncertain (normal curves); P(catch) = Φ((T_vehicle − T_you − buffer) / √(σ_v² + σ_you²)).
- **Kalman filter** smooths jumpy live predictions so vehicles glide instead of jumping.
- **Monte Carlo** (4,000 simulated trips) for bus-then-train connections.
- **Weidmann's speed–density law** for walking in crowds; **Dijkstra** shortest paths through the station.
- **Solar position** for real sunlight on 3D buildings and the seat advisor.

## Privacy and cost
Your stops, times and keys are saved only in your browser (localStorage). No server, no paid APIs, no secret keys in the code.

Data: Powered by TfL Open Data · Imagery © Esri, Maxar, Earthstar Geographics · Terrain: AWS Terrain Tiles · postcodes.io · National Rail station codes © Trainline EU and contributors (ODbL)

Also: Powered by TfL Open Data · National Rail Darwin (Rail Data Marketplace, your own key) · © OpenStreetMap contributors · OpenFreeMap · Open-Meteo.
