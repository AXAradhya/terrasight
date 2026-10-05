# TERRA-VISION → TerraSight

### Vision-Based Autonomous Navigation for UGVs in GPS-Denied Outdoor Environments

|  |  |
| --- | --- |
| **Problem Statement** | 26126 — Vision Based Autonomous Navigation for UGV, Outdoor Environment |
| **Domain** | Robotics · Computer Vision · Edge AI · Autonomous Systems |
| **Core bet** | **Cameras are enough.** Replace GPS + LiDAR stacks with intelligent, low-cost vision |
| **Lineage** | TERRA-VISION (software platform, now → 2028) → **TerraSight** (2031 product generation) |
| **Horizon** | MVP (0–3 mo) → Field Prototype (9 mo) → Product (Yr 2) → Platform (Yr 3) → TerraSight (2031) |

> Note: all numbers below are **design targets and gates**, not measured results. The MVP section marks exactly what is built first.

---

## 1. Executive Summary

TERRA-VISION is a full-stack autonomy platform that drives an Unmanned Ground Vehicle from Point A to Point B across **unstructured, GPS-denied terrain** using **cameras as the primary sensor**, with a low-cost IMU and wheel encoders as support. It answers the three pillars of the problem statement:

1. **Perception AI** — where can I drive, what is dangerous?
2. **Visual localization (VIO/SLAM)** — where am I, without GPS?
3. **Path planning and control** — how do I reach B safely and turn that into wheel commands?

What makes it a winning design rather than a research survey:

| Differentiator | Why it matters to a judge |
| --- | --- |
| **Negative-obstacle detection** (ditches, drop-offs) treated as first-class, via depth geometry | The hardest real failure case; most teams ignore it |
| **Two-layer safety**: a learned stack plus an independent, ML-free geometric stop layer and hardware E-stop | Safety is demonstrable, not claimed |
| **Self-supervised traversability**: what the wheels actually drove over becomes training labels | Genuine novelty, improves with every run |
| **Graceful degradation**: confidence-gated speed, dead-reckoning fallback, relocalization | The vehicle never fails silently |
| **Explainable autonomy**: every stop or replan is narrated ("slowing: low traversability, possible ditch") | Trust, and a strong live-demo moment |
| **Simulation-first, hardware-optional MVP** | Feasible within hackathon time and budget |
| **10–30x lower cost** than LiDAR-centric autonomy | Real commercial and social value |

---

## 2. Problem Analysis

### 2.1 One-line understanding

Build a software stack that drives a ground robot from A to B outdoors, with cameras as the primary sensor and no GPS, while detecting safe paths, tracking its own position, and avoiding obstacles that appear suddenly.

### 2.2 Why it is hard

| Constraint | Design implication |
| --- | --- |
| GPS-denied | All localization from visual, inertial and odometric fusion; drift, scale ambiguity and tracking loss are real |
| Unstructured terrain | No lanes or curbs; "drivable" is fuzzy (mud, tall grass, gravel, slopes, puddles) |
| Lighting and weather | Shadows, glare, dusk, dust, fog and rain constantly change the image |
| Sudden obstacles | People, animals, debris: perception-to-replan latency must stay under about 150–200 ms |
| Negative obstacles | Ditches look like flat ground; semantics alone fails, depth geometry is required |
| Edge compute | Everything onboard and real-time within roughly 15–30 W |
| Safety | One missed obstacle fails the run and can damage hardware |
| Cost | The camera-first approach must stay far cheaper than LiDAR, or it has no point |

### 2.3 Pillars to deliverables

| Pillar | Input | Output | Stated deliverable |
| --- | --- | --- | --- |
| Perception | Camera frames | Traversability map, obstacles, depth | Lightweight obstacle/path AI model |
| Localization | Frames + IMU + encoders | 6-DoF pose, trajectory, map | Visual SLAM/odometry pipeline |
| Planning | Pose, costmap, goal | (v, ω) → wheel speeds | Path planner for wheel/motor commands |

### 2.4 Decision log (ambiguities settled up front)

| # | Question | Decision |
| --- | --- | --- |
| 1 | How is Point B given without GPS? | Coordinates in the SLAM frame via click-on-map in the dashboard; goal-image or landmark goals as stretch features |
| 2 | Are IMU and encoders allowed? | Yes ("camera as primary sensor"). Use stereo + IMU + encoders (VIO); monocular-only is a degraded fallback |
| 3 | Where is it evaluated? | Staged: simulation → closed course → open field → wild terrain |
| 4 | Static or moving "sudden obstacles"? | Static in MVP; moving people and animals with motion prediction from Phase 1 |
| 5 | Speed envelope? | Walking pace, 0.5–1.5 m/s; stopping distance tied to perception range |

---

## 3. System Architecture

```
SENSORS: Stereo/RGB-D · (later: 4x mono, thermal) · IMU · Encoders · E-stop/Bumper
        │                                                   │
        ▼                                                   ▼
┌──────────── ONBOARD EDGE COMPUTE ────────────┐   ┌─ SAFETY MCU ──────┐
│ 0 Preprocess: sync, undistort, auto-exposure │   │ Independent       │
│ 1 PERCEPTION: segmentation, detection, depth,│   │ watchdog +        │
│   negative obstacles, tracking, uncertainty  │   │ heartbeat monitor │
│ 2 LOCALIZATION: VO → VIO → V-SLAM + EKF      │   │ + hardware E-stop │
│ 3 MAPPING: local BEV costmap + global map    │   │ (cuts motor power)│
│ 4 PLANNING: global (Hybrid A*/D* Lite) +     │   └───────────────────┘
│   local (DWA/MPPI) + behavior tree           │
│ 5 CONTROL: path tracking → (v, ω) → PWM/CAN  │
│ 6 SAFETY SUPERVISOR: confidence gating,      │
│   geofence, tilt cutoff, black-box recorder  │
│ 7 LOGGING + TELEMETRY (rosbag2, WebSocket)   │
└───────────────────┬──────────────────────────┘
                    ▼
        Motor drivers → PID wheel loops (MCU)
                    ▲
   OPERATOR DASHBOARD (MVP) · CLOUD FLEET LAYER (later)
```

**Backbone:** ROS 2 (Humble/Jazzy) modular nodes, Nav2, behavior-tree orchestration, and **rosbag2 record/replay of every run** for regression testing and black-box debugging.

**Mission state machine:** `IDLE → PLANNING → NAVIGATING → AVOIDING → RECOVERING → ARRIVED / FAILED` (plus `E-STOPPED`, reachable from any state).

---

## 4. Module Specifications

### 4.1 Perception AI — "The Eyes"

| Task | Approach |
| --- | --- |
| Traversability segmentation | Per-pixel traversable / risky / non-traversable, with fine classes (grass, dirt, gravel, mud, sand, water, rock, log, tree, sky, person, vehicle) |
| Obstacle detection | Boxes for rocks, logs, trees, poles, ditches, people, animals, vehicles |
| Depth | Stereo matching (primary), monocular depth as fallback |
| **Negative obstacles** | Slope discontinuities and roughness from depth, plus a conservative geometric buffer |
| Dynamic objects | Multi-object tracker with Kalman velocity prediction (about 1.5 s ahead) |
| Output | **BEV traversability costmap** with continuous cost and per-cell confidence |

**Edge-ready models:** BiSeNet, PIDNet, ENet, SegFormer-B0, LR-ASPP (MobileNetV3) for segmentation; YOLOv8-n or RT-DETR-small for detection; Depth Anything V2 (small) or MiDaS (small) for monocular depth; SuperPoint + LightGlue as the SLAM feature upgrade. Deploy via PyTorch → ONNX → TensorRT (FP16/INT8) with pruning and distillation.

**Datasets:** RUGD, RELLIS-3D, Freiburg Forest, GOOSE, TartanDrive, Yamaha-CMU Off-Road; Cityscapes and the **India Driving Dataset (IDD)** for diversity; plus self-collected field data.

**Robustness:** photometric augmentation (shadow, glare, haze, dusk), temporal smoothing, **uncertainty estimation** (MC-dropout or ensemble disagreement) fed to the planner, and the **self-supervised loop** where wheel-slip and IMU-impact signals from real driving become traversability pseudo-labels.

### 4.2 Visual Localization — "The Memory"

| Level | Purpose | Options |
| --- | --- | --- |
| Visual odometry | Frame-to-frame motion | Stereo VO, SVO, DSO/DPVO |
| Visual-inertial odometry | Metric-scale, robust | VINS-Fusion, OpenVINS, Basalt, ORB-SLAM3 (VI mode) |
| Full V-SLAM | Drift correction, persistent map | ORB-SLAM3, RTAB-Map; DROID-SLAM as research baseline |
| Fusion | Combine sources | EKF/UKF (`robot_localization`) over wheels + IMU + visual pose |

| Issue | Engineered answer |
| --- | --- |
| Monocular scale ambiguity | Stereo baseline + IMU + wheel odometry |
| Repetitive vegetation | **Semantic masking**: exclude foliage, people and moving classes from feature tracking |
| Lighting change | Auto-exposure, global-shutter cameras, learned features |
| Tracking loss | Detect via inlier count and covariance → wheel+IMU dead reckoning → relocalize against keyframes; log the event |
| Loop closure | Place recognition (DBoW2/NetVLAD-style) + pose-graph optimization (g2o/GTSAM) |
| Degeneracy (mud, sand, snow) | Weight encoder odometry more; if unresolved, safe stop |
| Evaluation | ATE, RPE and drift % with the `evo` toolkit |

### 4.3 Mapping and World Model

- **Local costmap:** rolling 20 m x 20 m grid, 5–10 cm cells, about 5 Hz
- **Layers:** static obstacles, traversability, slope/roughness, inflation, unknown
- **Global map:** SLAM keyframe map plus a coarse cost map for long-range routing
- **Semantic layer:** terrain type per cell, so costs prefer gravel over tall grass and avoid mud

### 4.4 Planning and Collision Avoidance — "The Brain"

| Layer | Algorithms | Role |
| --- | --- | --- |
| Global | A\*, Dijkstra, **D\* Lite**, Hybrid A\* | Coarse route to B with efficient replanning |
| Local | DWA, TEB, **MPPI**, VFH | Real-time avoidance on the live costmap (20+ Hz) |
| **Reactive safety layer** | Independent geometric stop zone, no ML | Guaranteed stop for anything inside stopping range |
| Behavior tree | Mission logic | Waypoint chains, retreat, return-home |

**Cost function:** inflated obstacle distance, terrain cost and slope, path smoothness, goal progress, and **localization uncertainty** (prefer paths where tracking is reliable).

**Behaviors:** sudden obstacle → slow, replan, stop if no safe path; stuck → rotate, back up, alternate route; goal reached → tolerance radius and controlled stop.

### 4.5 Control and Actuation

Pure Pursuit, Stanley or MPC tracking; differential/skid-steer kinematics converting (v, ω) to wheel speeds; PID on encoder feedback on an STM32/ESP32 MCU over serial, CAN or micro-ROS; acceleration caps, **speed ceiling tied to perception confidence**, tilt/roll cutoff, slip-aware compensation.

### 4.6 Safety Supervisor (non-negotiable)

- **Layered stop chain:** planner → geometric safety layer → software watchdog (any module stops publishing → stop) → independent hardware E-stop that bypasses all software
- Confidence gating, geofence in the SLAM frame, mission timeout, battery-aware return-to-home, IMU rollover protection
- **Failure playbook:** comms loss → return-home; perception failure → stop and retry; stuck too long → alert operator
- **Vision black-box recorder** (aviation-FDR style): the last N minutes of sensor data saved on any anomaly, the foundation of a future safety case

---

## 5. The Hackathon MVP (what we actually build)

**Principle:** prove the full loop (perceive → localize → plan → act) end to end, measurably, and make it demonstrable even if the field is unavailable.

| Tier | Setup | Purpose |
| --- | --- | --- |
| **Sim (always available)** | Gazebo or Isaac Sim, ROS 2, same code as the real robot, scripted scenarios | Guaranteed demo, repeatable metrics |
| **Budget hardware** | 4WD skid-steer RC chassis with encoders, Jetson Orin Nano or Raspberry Pi 5 + accelerator, one stereo/RGB-D camera (e.g. OAK-D class), IMU, E-stop relay + MCU watchdog | Proves it works on a real vehicle |
| **Dashboard** | React web app over WebSocket, runnable on mock data | Visible proof for evaluators |

**MVP scope:** one camera, binary traversable segmentation plus obstacle detection, visual (inertial) odometry, reactive avoidance (steer around or stop), click-to-set goal, controlled outdoor course in daylight, full logging.

**Suggested 5-minute demo story:** (1) click Point B on the map; (2) the vehicle navigates with the segmentation overlay on; (3) a rock appears, the state flips to **Avoiding**, the route visibly replans; (4) localization confidence dips in shadow, speed drops automatically, then recovers; (5) arrival, KPI card shows zero collisions; (6) open **Replay** to scrub the same run and show the explained events; (7) press the E-stop to prove the safety path.

---

## 6. Operator Dashboard — "Mission Control"

**Purpose:** let an operator plan, launch, watch, intervene in and review missions, and understand *why* the vehicle acts as it does. **Goals:** trust, control, proof, learning, demo-readiness. **Non-goals for MVP:** fleet management, accounts and roles, cloud sync, any AI computation in the browser.

### 6.1 Screens

| Screen | MVP content |
| --- | --- |
| **Mission Control (home)** | Live camera with toggle overlays (traversability, obstacle boxes with distance, depth, projected path, confidence shading); top-down map (pose + uncertainty, start/goal, route, trail, costmap, obstacles, loop-closure markers; click to set goal); control panel (Start / Pause / Resume / Abort / Return-to-start, pre-flight checklist that gates Start and explains why it is disabled, speed limit and safety margin); telemetry strip; state indicator with plain-language reason; event log with severity filter; live run summary |
| **Replay and Analysis** | Play, pause, scrub, slow-motion and frame step; synchronized camera, map and telemetry; event markers; planned-vs-actual path; compare two runs |
| **Run History and Reports** | Sortable, filterable run table; single-run report with pass/fail, KPIs, route map, key events, charts, export |
| **Diagnostics (lite)** | Health cards for camera, localization, perception, planner, motor interface; confidence and latency over time |
| **Scenarios** | 3–5 simulation scenarios (terrain, lighting, difficulty) that drive mock data |
| **Settings and Help** | Units, theme, alert sounds, shortcuts, onboarding tour, legend |

**Global top bar (every screen):** vehicle name, connection mode (Live / Simulated / Replay / Disconnected), autonomy mode, current state, battery, always-visible one-click **Emergency Stop**, alert bell with unacknowledged count.

**Extra field-friendly features:** latency indicator (warns when video lag makes manual control unsafe), **Record Bag** toggle for post-mission training data, and a lighting-adaptation toggle (histogram equalization) to help the operator when the vehicle moves from sun into shade.

### 6.2 Telemetry

Speed, heading, turn rate, pitch/roll, battery, distance travelled, distance to goal, ETA, localization confidence, perception confidence, left/right motor commands, FPS, end-to-end latency, with "updated X s ago" on every live value.

### 6.3 Safety UX principles

1. E-stop: always visible, one action, no confirmation, visually unlike every other control; reset is a separate deliberate action.
2. Colour is never the only signal; always pair it with an icon, shape or label.
3. The UI shows the vehicle's **real** state, not the commanded one.
4. Critical alerts persist until acknowledged; stale data is greyed out and flagged; a bad connection never looks healthy.
5. Disabled controls always say why.

### 6.4 Visual design and accessibility

Calm control-room mood; dark default, plus light and a **high-contrast outdoor** theme. Semantic colours used consistently across camera, map and charts: **green** traversable/healthy, **amber** caution, **red** hazard/critical, **blue** planned path/info, **grey** unknown/inactive. Tabular numerals for live values. Desktop primary, tablet for the field (large touch targets), mobile monitor-only (state, key telemetry, map, E-stop). WCAG AA contrast, colour-blind-safe overlays (patterns and outlines), keyboard shortcuts including E-stop, screen-reader labels, reduced-motion support.

### 6.5 Data modes

Three modes switch without changing the UI: **Live**, **Simulated** (a believable scripted story, not random noise: start → rock → avoid → confidence dip → arrive), and **Replay**. Include at least one failed-then-recovered historical run so failure analysis can be shown.

---

## 7. Data, Training and Simulation

1. **Bootstrap** with transfer learning from public off-road datasets and IDD.
2. **Sim pre-training** with domain randomization (textures, lighting, weather) to narrow the sim-to-real gap.
3. **Field collection curriculum:** campus → farm → forest → training grounds, always recorded as rosbag2.
4. **Annotation:** CVAT or Label Studio with SAM-assisted labelling; DVC-versioned datasets and models.
5. **Active learning:** low-confidence frames are auto-flagged, labelled, retrained and redeployed.
6. **Hard-case mining:** deliberate dusk, rain, glare, mud-on-lens and fog campaigns.
7. **Self-supervised loop:** driving experience becomes traversability labels.

---

## 8. Testing, Validation and KPIs

### 8.1 Test matrix

| Axis | Variations |
| --- | --- |
| Terrain | Paved, dirt trail, grass, gravel, sand, slope, mud, mixed |
| Lighting | Noon, low sun, overcast, dusk, shade patches, night (thermal, later) |
| Obstacles | Static rocks, logs, ditches, trees; moving people and animals; dropped objects |
| Route | Short, long, loop (tests loop closure), narrow passage |

### 8.2 Staged gates

| Stage | Method | Gate |
| --- | --- | --- |
| Regression | Automated CV/SLAM suites on recorded bags per commit | No KPI regression |
| Ablations | VO vs VIO; semantic masking on/off; uncertainty gating on/off | Quantified contribution of each |
| Simulation | 10,000+ randomized missions | 99.5% collision-free |
| Field | Closed course → open field → wild terrain | 0 collisions per 50 runs |
| Adversarial | Rain, dusk, smoke, dynamic actors, mud-on-lens | Graceful degradation, never unsafe |
| Soak | 8-hour continuous run | No leaks or lock-ups |
| Fault injection | Kill perception/SLAM/comms mid-run | Correct failsafe, logged |

### 8.3 KPIs (tiered)

| Metric | MVP gate | Product | TerraSight 2031 |
| --- | --- | --- | --- |
| Mission success (A→B, collision-free) | ≥ 90% | ≥ 95% over 50 diverse runs | ≥ 99%, unattended |
| Collisions per run | **0 (hard gate)** | **0** | **0, certified** |
| Path efficiency (actual ÷ shortest) | ≤ 1.3 | ≤ 1.2 | ≤ 1.1 |
| Localization drift | ≤ 3% of distance | \< 1% | \< 10 cm over 1 km (loop-closed) |
| Segmentation | Binary IoU ≥ 85% | mIoU ≥ 75%, 12+ classes | 50+ classes, open-vocabulary |
| Obstacle recall in stopping range | ≥ 95% | ≥ 98% at 8 m | ≥ 99.5% incl. negative obstacles |
| Perception speed on edge | ≥ 15 FPS | ≥ 30 FPS | 60 FPS |
| End-to-end latency | \< 200 ms | \< 150 ms | \< 100 ms |
| Tracking-loss recovery | Automatic, logged | Automatic, logged | Automatic, self-narrated |
| Night/thermal | n/a | ≥ 80% of day performance | Full parity |

---

## 9. Risk Register

| Risk | Likelihood | Mitigation |
| --- | --- | --- |
| Tracking lost in glare or featureless ground | High | VIO + wheel fusion, exposure control, semantic masking, auto-fallback and relocalization |
| Model fails on unseen terrain | High | Diverse data, domain randomization, uncertainty gating, conservative speed |
| Lighting extremes | High | Photometric augmentation, histogram normalization, thermal and HDR/event cameras later |
| Missed negative obstacles | Medium | Depth slope/roughness layers, geometric buffer |
| Compute or latency bottleneck | Medium | TensorRT INT8, distillation, pruning, lower resolution, pipeline parallelism |
| Sim-to-real gap | Medium | Domain randomization, weekly small real-world tests |
| Drift on long routes | Medium | Loop closure, waypoint decomposition, multi-session maps |
| Mud on lens | Medium | Hydrophobic coating, self-inspection, stop-and-alert |
| Hardware failure | Medium | Watchdog, E-stop, spares, health logs |
| Regulatory liability (2030+) | Medium | Black-box recorder, sim-verified safety case, staged autonomy, ISO 3691-4 / ISO 21448 (SOTIF) / ISO 18497 alignment |

---

## 10. Roadmap

| Phase | When | Deliverables |
| --- | --- | --- |
| **P0 — MVP** | 0–3 mo | One camera, segmentation + odometry + reactive planner, single-screen dashboard, A→B demo in sim and on a controlled course |
| **P1 — Field prototype** | 3–9 mo | Stereo depth, full VIO + EKF, costmap + local planner, full safety stack, 50+ logged field runs on 2–3 terrains |
| **P2 — Product** | Yr 1–2 | 360° multi-camera, optional thermal, loop closure and persistent maps, learned traversability, weatherproof enclosure, SDK and API |
| **P3 — Platform** | Yr 2–3 | Fleet cloud, OTA continual learning, UAV–UGV teaming (a drone scouts ahead), terrain auto-adaptation, predictive maintenance |
| **P4 — TerraSight** | to 2031 | See Section 11 |

---

## 11. TerraSight — the 2031 Product

### 11.1 Form factor

A weatherproof, modular **six-wheel UGV** (suitcase-sized, 50–80 cm) with rocker-bogie or active suspension; a camera head with sun/rain hood and **self-cleaning, hydrophobic lens**; solar-assisted batteries (8–12 h); swappable payload bays (sprayer, medical box, cargo tray, sensor mast); optional 5G/mesh remote assist, never required; 2030-era edge AI compute in a 15–30 W envelope.

### 11.2 How it behaves

You say or type: *"Go to the second water tank, avoid the muddy field, take the shaded route."* It builds a plan from a shared digital twin, drives itself, narrates decisions ("slowing: low confidence in the dust"), and reports to a fleet dashboard. Overnight the fleet learns from the day's hard cases and receives a validated update.

### 11.3 Technology shifts that enable it

| Shift | What changes |
| --- | --- |
| **Foundation-model perception** | One distilled backbone does segmentation, depth, obstacles and open-vocabulary recognition ("find the orange rescue marker"), handling unseen terrain |
| **Vision-language mission copilot** | Natural-language intent becomes a semantic plan |
| **Neural / Gaussian-splat maps** | Dense photorealistic 3D maps built onboard, multi-session and shareable (semantic NeRF-style SLAM) |
| **Event cameras + HDR + thermal** | Glare, tunnels, dusk, smoke and night handled |
| **Physics-aware world-model planning** | Predicts wheel slip, sinkage and stability from a patch of terrain before driving on it |
| **Learned VLA policies + classical safety net** | End-to-end navigation with the verified classical stack as backstop |
| **Federated and continual learning** | Fleet-wide improvement, raw video never leaves the device |
| **Digital-twin operations** | Replay incidents and stress-test updates in sim before OTA rollout |
| **Neuromorphic / low-power NPUs** | Large cut in energy per inference, longer missions |

### 11.4 Operational features

- **Swarm autonomy:** shared live maps, so if UGV-1 finds a ditch, UGV-2 avoids it; distributed task allocation, convoy and formation
- **Self-diagnostic degraded mode:** if a camera is damaged, compensate with remaining sensors and limp to a safe extraction point
- **Energy-aware routing:** accept a slightly longer path through sunlight to recharge rather than a short path through energy-draining terrain
- **Season-invariant place recognition** and a **skill marketplace** of mission packages ("vineyard scout", "SAR sweep", "solar-farm inspector")
- **Moonshot (research track):** polarized-light/sun-compass fallback for whiteout or fog, inspired by insect navigation

### 11.5 Prototype today vs TerraSight

| Aspect | Hackathon prototype | TerraSight (2031) |
| --- | --- | --- |
| Perception | Lightweight segmentation + detection | Unified foundation backbone, open-vocabulary, uncertainty-aware |
| Localization | VO/VIO + loop closure | Neural/Gaussian-splat SLAM, multi-session, any lighting |
| Terrain | Classes + costmap | Physics-aware slip/sinkage/stability prediction |
| Planning | A\* + DWA/MPPI | World-model MPC with learned + verified safety layers |
| Interface | Dashboard, click goals | Voice/text missions, digital twin, fleet orchestration |
| Weather | Fair weather | Rain, dust, fog, snow, night |
| Autonomy | One vehicle, supervised | Fleet, mostly unsupervised, remote assist on demand |
| Safety | E-stop, watchdog, geometric layer | Certified safety case, redundant stop channels, runtime monitors |
| Endurance | Minutes to an hour | Full-day with solar top-up |
| Updates | Manual flash | Signed OTA, staged rollout and rollback |
| Map scale | About 200 m radius | More than 1 sq km, swarm-shared |

---

## 12. Complete Feature List

| Group | Features |
| --- | --- |
| **Core (required)** | Real-time traversable-path segmentation; obstacle detection (rocks, ditches, trees, people); stereo/mono depth; GPS-free visual odometry/SLAM pose; local costmap; global A→B planning; dynamic avoidance and replanning; wheel-command generation; collision-free completion reporting |
| **Perception** | Terrain classes; negative-obstacle detection; slope and roughness; moving-object tracking with prediction; low-light/glare/shadow handling; uncertainty maps; semantic masking for SLAM; self-supervised traversability |
| **Localization and mapping** | VIO + wheel fusion; loop closure and pose graph; relocalization after tracking loss; multi-session maps; drift monitoring; semantic 3D map |
| **Planning and control** | Terrain- and uncertainty-aware costs; recovery behaviors; multi-waypoint missions; confidence-based speed; Pure Pursuit/MPC + PID; rollover prevention |
| **Safety** | Hardware and software E-stop; per-module watchdog; fail-safe state machine; geofence, timeout, battery-aware return; black-box recorder |
| **Operator tooling** | Mission-control dashboard; click-to-set goals; replay and annotated playback; KPI reports; scenario library and simulation mode; teleop takeover; latency indicator; record-bag toggle |
| **MLOps** | Data capture, auto-labelling, active learning; model versioning and regression benchmarks; TensorRT/quantization; on-device profiling |
| **Future (2031)** | Voice/text missions; open-vocabulary search; digital twin and fleet orchestration; federated learning and OTA; thermal/event fusion; predictive terrain and weather adaptation; swarm coordination; modular payloads; explainable decisions; cybersecurity; certification path |

---

## 13. Technology Stack

| Layer | Tools |
| --- | --- |
| Middleware | ROS 2 (Humble/Jazzy), Nav2, behavior_tree_cpp, micro-ROS |
| Perception | PyTorch → ONNX → TensorRT, OpenCV |
| SLAM | ORB-SLAM3, VINS-Fusion, OpenVINS; baselines DROID-SLAM, DPVO |
| Planning/control | Nav2, Hybrid A\*, MPPI/TEB, custom MPC, PID |
| Simulation | Gazebo, Isaac Sim, Webots |
| Frontend | React, WebSocket telemetry, WebRTC video, Three.js for 3D maps (later) |
| Backend (later) | FastAPI, PostgreSQL + TimescaleDB, MQTT, Kubernetes |
| MLOps | DVC, Weights & Biases, CVAT/Label Studio, ONNX registry, OTA (Mender-style) |
| Hardware tiers | **Budget:** Jetson Orin Nano / RPi 5 + OAK-D, 4WD RC chassis. **Mid:** Orin Nano 8 GB + hardware-synced stereo + IMU. **Pro:** Orin NX 16 GB + global-shutter stereo, 4 mono cams, thermal, IP-rated chassis |
| Safety hardware | Physical E-stop relay, bumper switch, STM32 watchdog MCU, fused power distribution |

---

## 14. Use Cases and Impact

| Sector | Mission | Value |
| --- | --- | --- |
| Agriculture | Row-following, crop scouting, coverage spraying | Round-the-clock operation, lower labour cost |
| Search and rescue | GPS-denied disaster sweeps, thermal victim detection, supply drop | Faster response in the critical first hours |
| Last-mile delivery | Campus, village and rural off-road delivery | 10–30x cheaper than LiDAR fleets |
| Mining and construction | Site survey, material delivery, persistent progress maps | Safer, repeatable site operations |
| Defense and security | Perimeter patrol where GPS is jammed | Denial-resistant autonomy |
| Inspection | Solar farms, pipelines, border and mine sites | Change detection from persistent maps |
| Conservation | Remote wildlife and forest monitoring | Minimal-impact access |

---

## 15. Conclusion

TERRA-VISION starts as a focused, measurable answer to Problem Statement 26126: camera-primary perception, layered visual localization and hierarchical planning proving **collision-free A→B autonomy, with zero collisions as the hard gate**. Along a risk-managed roadmap it grows into **TerraSight**: UGVs that see with foundation models, remember in neural 3D maps, reason in natural language, learn from each other without sharing raw video, and carry a certifiable safety case. Every phase de-risks the next, and every field run feeds the data flywheel.

**The bet:** as vision foundation models and edge compute keep improving, cameras become the only sensor a ground vehicle needs.

*— End of Master Documentation —*