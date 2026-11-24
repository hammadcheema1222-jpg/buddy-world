# 🚉 Catch It

**Which departure can I actually make, and how?** Catch It shows every bus and train you could catch by walking, running, cycling or getting a lift, with a live chance for each, and lets you watch the vehicle coming.

▶ **Open it:** https://hammadcheema1222-jpg.github.io/buddy-world/catch-it/

| Page | What it does |
|---|---|
| `index.html` Board | Live departures (TfL buses, Elizabeth line, Tube, Overground; National Rail with your own free key), a race strip per departure, catch chance per mode, leave-now countdown, follow-a-bus, bus-to-train connection chances, platform prediction, learns your real walking/running times |
| `map.html` Map | Map, Satellite or 3D world (satellite imagery + real terrain + 3D buildings + real-time sky). Every live bus and train as a 3D model on its real road or OpenStreetMap track. Ride a real vehicle live (outside chase cam or left/right/front window) or a fast preview; which side to sit on (sun glare + parks and water) |
| `station.html` Station | Entrance-to-platform time from OpenStreetMap indoor data: quickest, step-free or no-lift routes, crowd-adjusted walking speed, live TfL lift problems |

## Making the train
- **Physics of getting there**: live wind (Open-Meteo) in a power balance c·v + ½ρ·CdA·(v+w)²·v = P; hills with Tobler's hiking function e^(−3.5·|grade+0.05|) and climbing force for bikes; Riegel's tiredness law for longer runs. The catch rings bend with the wind.
- **Learns each train**: Welford running stats of "real departure − first shown" and (with Darwin) lateness vs timetable, per stop/line/weekday/hour, shrunk toward zero with a 3-sighting prior. You see things like "usually 2 min late".
- **Soonest stop map**: a live time-based Voronoi map that colours every spot by the stop that gets you onto something soonest if you walk from there.
- **Energy and time value**: calories (MET × kg × hours), CO₂ saved vs a car (0.17 kg/km), and minutes saved valued at your hourly rate (default £12.71, the National Living Wage from April 2026).
- **Ideas borrowed from loved apps that shut down**: a Dark Sky-style one-line "next hour" summary and a 60-minute departure strip; Google Now-style trips that open by themselves when you usually make them (after 2+ days at the same time); a Moves-style "Your trips" storyline with minutes saved; Inbox-style trip bundles (every step in one card) and Snooze.
- **Catch zone** (Board): a live isochrone around your station. Each ring is how far away you could be and still make the departure at that speed: r = v × (time left − platform walk − buffer − pick-up) ÷ 1.3. The rings shrink every second, everything outside them is greyed out, and it tells you which ring you're in.
- **Route draw** (Where to?): the fastest journey draws itself leg by leg in official line colours, using MapLibre `line-progress` gradients.
- **Where to?** (top of the Board): search any place, station or postcode. Map apps plan as if you walk to the first stop. Catch It also asks TfL's Journey Planner for journeys that started up to 15 minutes ago, then re-times your first walk at your own run, bike or lift speed. That shows the trains other apps hide, and how many minutes sooner you'd arrive, e.g. "Run and you're there 8 min sooner". Tap Go and the run coach takes over.
- **Live run coach**: tap "I'm going" and GPS follows your real pace. Needed speed = distance left (straight line × 1.3 street detour) ÷ time left (departure − now − platform walk − buffer). Your chance = Φ(slack ÷ σ), where σ = 15% of your ETA + 15 s. The phone speaks and buzzes "speed up", "keep this pace" or "you've got it, ease off", and the screen stays awake. If you miss it, it names the next train you can still catch.
- **Ask a friend for a lift**: one tap shares a message with the exact pick-up time, worked out from the live departure and the drive time.
- **Delay money**: every train you catch is logged. Pick where you got off and the live expected time there estimates your lateness, or tap how late you were. It shows what you're owed: Greater Anglia Delay Repay pays 25%, 50% or 100% of a single for 15, 30 or 60 minutes late; the Elizabeth line refunds a single for 30+ minutes within TfL's control. Both have a 28-day claim deadline, and there's a copy-ready summary for the claim form.
- **Best carriage** (Station page): your fastest route's arrival point is projected onto the platform's centre line, so you know which carriage to stand at, and which one to ride in to step off right by the exit.

## The real 3D world (map → 3D world)
- **Buildings from OpenStreetMap** (via Overpass), built in Three.js from their true footprints. Curved outlines stay curved, and courtyards stay hollow. Height comes from `height`, or `building:levels` × 3.2 m.
- **Real roof shapes** from `roof:shape`: dome/onion (rings scaled by cos θ, lifted by sin θ, which is how the O2's dome is drawn), gabled, hipped, mansard, pyramidal, cone and skillion (which follows `roof:direction`). Untagged UK houses get a gabled or hipped roof.
- `building:part` pieces replace the plain outline, so towers and spires show their real shapes. Colours come from `building:colour` and `roof:colour`, or from the material.
- **Trees, woods, masts and chimneys** come from OSM. The woodland is scattered inside its real boundary.
- **Real terrain**: AWS Terrarium elevation tiles with hillshade. A slider exaggerates hills and mountains up to 3×. Buildings, trees and masts re-settle onto the ground once the terrain loads.
- **Sun and sky** use the solar-position formula for your time and place, and windows light up at night.
- **Go anywhere**: search any place on Earth (Photon/OSM geocoder) and fly there.

- **Photo-real mode (optional)**: Google Photorealistic 3D Tiles drawn with deck.gl inside MapLibre, the same textured city mesh Google Earth uses. You add your own free Map Tiles API key (1,000 free sessions a month, 3 hours each). Google's heights are measured from the WGS84 ellipsoid, so the app measures the local geoid offset by sampling the mesh against the terrain, then puts the trains and buses on it.
- **No white blocks**: before the real buildings load, simple blocks are coloured by height (brick terraces → stone → glass towers), or by OSM `building:colour`.

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
