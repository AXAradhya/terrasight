# 🖥️ MVP Prototype Specification & Ground Control Station Frontend

---

## 1. The MVP Frontend: Dedicated Visual Description (1 Paragraph)

> **MVP Frontend Visual Description:**  
> The MVP frontend is a high-contrast, sunlight-readable dark-slate web command console (built with React and communicating over a low-latency rosbridge WebSocket / WebRTC channel) designed for a field tablet or laptop, split cleanly into two primary operational viewports: the left pane hosts an interactive 2D/2.5D topological tactical map (powered by Leaflet/MapLibre) rendering a high-contrast satellite or grid tile layer overlaid with the UGV's real-time position as a luminous cyan directional glyph, its traversed historical trail as a solid amber spline, the computed global reference trajectory as an electric-blue dashed line, and localized obstacles depicted as pulsating amber and crimson hazard clusters; the right pane streams the real-time $1080p$ front-facing camera feed with interactive HUD toggle layers that project translucent colored semantic masks over traversable terrain (bright green for clear path, yellow for tall grass, red for impassable rocks/ditches) alongside tight bounding boxes and distance tags over detected dynamic obstacles; directly beneath the camera stream sits a compact industrial telemetry status strip displaying real-time metrics for battery voltage and percentage, vehicle ground speed in meters per second, Visual SLAM tracking health (a bold green "VIO LOCKED" vs. flashing red "LOST" badge), heading angle, and network round-trip ping; along the bottom of the display runs a persistent tactical command strip equipped with five large, touch-safe action buttons—a prominent, guarded crimson **Emergency Stop (E-STOP)** button, a vibrant green **Start Autonomous Mission** button, a yellow **Pause / Hold Position** button, a blue **Return-to-Home (RTH)** automated backtrack button, and a **Manual Teleop Override** toggle—accompanied by a collapsible right-hand notification drawer that displays chronological, color-coded diagnostic system alerts (e.g., *"Dynamic Obstacle Detected at 3.2m - Replanning Local Path"*), giving a single field operator total situational awareness and effortless one-touch control during live outdoor trials.

---

## 2. MVP System Scope & Hackathon Deliverable (Phase 1 — 2026)

The Minimum Viable Product (MVP) focuses on building a rock-solid, verifiable demonstration prototype that directly solves the SIH Problem Statement 26126 requirements within realistic edge compute and budget constraints.

### 2.1 Hardware Bill of Materials (BOM) — 2026 MVP

| Subsystem | Component | Specifications | Justification |
|:---|:---|:---|:---|
| **Primary Compute** | NVIDIA Jetson Orin Nano (8GB) / Orin NX (16GB) | 40–100 Sparse TOPS, 1024 CUDA Cores, 15–25W | Edge GPU capable of concurrent TensorRT INT8 inference and stereo processing |
| **Vision Sensor** | Stereolabs ZED 2i / Intel RealSense D435i | Stereo CMOS, built-in hardware sync IMU, IP66 rating | Provides synchronized stereo pairs + factory-calibrated metric depth |
| **Secondary IMU** | SparkFun BNO085 (9-DoF) | Accelerometer, Gyroscope, Magnetometer with onboard sensor fusion | Redundant orientation and high-frequency angular velocity |
| **Microcontroller / Low-Level** | STM32F401 / Teensy 4.1 | ARM Cortex-M7 running FreeRTOS at 600 MHz | Hardware PWM generation, quadrature encoder decoding, fail-safe watchdog |
| **Mobility Base** | 4WD All-Terrain Heavy-Duty UGV Chassis | 4x 12V/24V High-Torque DC Geared Motors with 1024-CPR Hall Encoders | Rugged outdoor mobility across grass, soil, and gravel |
| **Motor Drivers** | Dual VESC 6 / Cytron MD30C | 30A Continuous, CAN-bus / UART control with regenerative braking | Precise wheel velocity and current monitoring |
| **Power Distribution** | 4S/6S LiFePO4 or LiPo Battery (14.8V – 22.2V, 10,000 mAh) | High-discharge C-rating, regulated buck converters (5V, 12V, 19V) | 90–120 minutes continuous testing autonomy |
| **Telemetry Radio** | Ubiquiti Bullet M2 / 5.8 GHz Wi-Fi Bridge + LoRa 915 MHz | High-gain omni-directional antenna | Low-latency local field connectivity up to 300 meters |

---

## 3. UI/UX Wireframe & Layout Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  TERRA-NAV GCS (Ground Control Station) — v1.0.4 [CONNECTED: 192.168.1.105]           [BATTERY: 84% 23.4V] [●]   │
├──────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────┤
│                                                      │                                                           │
│  VIEWPORT A: 2D/2.5D TOPOLOGICAL MISSION MAP         │  VIEWPORT B: REAL-TIME OPTICAL HUD FEED (1080p @ 30 FPS) │
│                                                      │                                                           │
│  ┌────────────────────────────────────────────────┐  │  ┌─────────────────────────────────────────────────────┐  │
│  │  [Mode: GPS-Denied Visual Localization]        │  │  │ [OVERLAYS: [x] BBoxes  [x] SegMask  [x] Trajectory] │  │
│  │                                                │  │  │                                                     │  │
│  │                   (Goal Point B) 🎯             │  │  │            ▲ Dynamic Obstacle (Person: 4.1m)       │  │
│  │                          /                     │  │  │            │ [Box: Crimson 94% conf]                │  │
│  │                         / [Global Plan]        │  │  │                                                     │  │
│  │             ▲ Hazard   /                       │  │  │                 [ GREEN TRAVERSABLE CORRIDOR ]      │  │
│  │             [Boulders]/                        │  │  │                  /////////////////////////////      │  │
│  │                      /                         │  │  │                 ///////////////////////////////     │  │
│  │          ▲───▲──────* (Current Replanned Waypt)│  │  │                /////////////////////////////////    │  │
│  │          │   │                                 │  │  │  [Yellow Mud] //////////////////////////////////    │  │
│  │          │   └── (Traversed Trail)             │  │  │                                                     │  │
│  │          │                                     │  │  │                                                     │  │
│  │     (UGV Pose: ▲ 24.3m N, 12.1m E, Yaw 42°)    │  │  │                                                     │  │
│  └────────────────────────────────────────────────┘  │  └─────────────────────────────────────────────────────┘  │
│  Scale: 1 grid = 2.0m  │  Relocalization: STABLE     │  AI Latency: 28ms │ FPS: 29.8 │ Resolution: 1280x720   │
├──────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────┤
│  TELEMETRY & HEALTH BAR:                                                                                         │
│  SPEED: 1.25 m/s │ SLIP RATIO: 4.2% │ VIO CONFIDENCE: 98% [LOCKED] │ PITCH: +3.2° │ ROLL: -1.1° │ CPU TEMP: 56°C │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  PERSISTENT TACTICAL COMMAND STRIP:                                                                              │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────┐ ┌───────────────────┐ ┌────────────────────────┐  │
│  │  🚨 EMERGENCY     │ │  ▶ START MISSION  │ │  ⏸ PAUSE     │ │  ↩ RETURN TO HOME │ │  🕹 MANUAL OVERRIDE    │  │
│  │     E-STOP        │ │     (AUTO A→B)    │ │     HOLD      │ │     (RTH BACK)    │ │     (TELEOPERATION)  │  │
│  └───────────────────┘ └───────────────────┘ └───────────────┘ └───────────────────┘ └────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend Data Communication Architecture

The web dashboard is fully decoupled from the onboard ROS 2 system, communicating across standard WebSocket and WebRTC protocols:

```
┌──────────────────────────────────────────────┐
│       ONBOARD COMPUTE (ROS 2 Humble)         │
│                                              │
│  [ /camera/image_raw ] ──▶ [ WebRTC Streamer ]─── (Direct H.264 Video Stream) ──┐
│                                              │                                  │
│  [ /nav2/global_plan ]                       │                                  │
│  [ /tf (Pose)        ]                       │                                  │
│  [ /local_costmap    ] ──▶ [ rosbridge_suite ]─── (JSON over WebSocket :9090) ──┤
│  [ /ugv/telemetry    ]                       │                                  │
│  [ /diagnostics      ]                       │                                  │
│                                              │                                  │
│  [ /cmd_vel          ] ◀── [ rosbridge_suite ]◀── (Drive Commands / Controls) ──┤
│  [ /ugv/mission_cmd  ]                       │                                  │
└──────────────────────────────────────────────┘                                  │
                                                                                  │ Wi-Fi Link
                                                                                  ▼
                                               ┌──────────────────────────────────────┐
                                               │    FIELD GCS DASHBOARD (Browser)     │
                                               │  • React.js / Vite SPA               │
                                               │  • roslibjs (WebSocket client)       │
                                               │  • Leaflet.js / HTML5 Canvas Map     │
                                               │  • WebRTC Video Player Component     │
                                               └──────────────────────────────────────┘
```

### 4.1 Key WebSocket Message Topics
* `/ugv/pose` (`geometry_msgs/PoseStamped`): 6-DoF position and orientation calculated by Visual SLAM.
* `/ugv/telemetry` (`custom_msgs/UGVTelemetry`): Battery voltage, wheel current, speed, slip ratio, temperatures.
* `/nav2/global_plan` (`nav_msgs/Path`): Array of coordinate waypoints forming the path from A to B.
* `/local_costmap/costmap` (`nav_msgs/OccupancyGrid`): $400 \times 400$ grid of obstacle traversability cells.
* `/ugv/mission_cmd` (`std_msgs/String`): Commands dispatched from UI buttons (`"START"`, `"PAUSE"`, `"RTH"`, `"ESTOP"`).

---

## 5. Live Demonstration & Evaluation Protocol (Point A to Point B)

For the SIH competition evaluation, the prototype is subjected to a **3-stage obstacle course**:

1. **Course 1: The Traversability Gauntlet (Path Detection)**
   * *Terrain:* Mixed grass, dirt ruts, gravel transitions, and steep earthen mounds.
   * *Success Criterion:* UGV must stay within safe traversable corridors without high-centering or bogging down.
2. **Course 2: GPS-Denied Blind Zone (Visual Localization)**
   * *Terrain:* Heavy tree canopy or enclosed tunnel/canyon where GPS lock is $0\%$.
   * *Success Criterion:* Traverse a $150\,\text{m}$ closed loop and return to starting point with $<1.5\,\text{m}$ end-point drift error without any GNSS signals.
3. **Course 3: The Pop-Up Ambush (Collision Avoidance)**
   * *Scenario:* While moving at $1.5\,\text{m/s}$ toward Point B, a sudden obstacle (cardboard box / mock pedestrian) is placed directly in the UGV's forward path at $4\,\text{m}$ range.
   * *Success Criterion:* UGV must detect the obstacle in $<150\,\text{ms}$, smoothly steer around it without stopping if a lateral corridor is clear, or execute a hard stop at least $1.0\,\text{m}$ before impact.
