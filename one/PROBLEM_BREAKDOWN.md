# 🚗 SIH Problem Statement 26126 — Comprehensive Research & Breakdown

## Vision-Based Autonomous Navigation for Unmanned Ground Vehicle (Outdoor Environment)

> **Date:** October 2026  
> **Horizon:** 5-Year Prototype Vision (→ October 2031)  
> **Status:** Research & Planning Phase

---

## Table of Contents

1. [Problem Decomposition](#1-problem-decomposition)
2. [Core Challenges Deep-Dive](#2-core-challenges-deep-dive)
3. [System Architecture (Current & 2031 Vision)](#3-system-architecture)
4. [Technology Stack & Algorithms](#4-technology-stack--algorithms)
5. [Full Feature List — 5-Year Prototype (2031)](#5-full-feature-list--5-year-prototype-2031)
6. [Perception AI Module](#6-perception-ai-module)
7. [Visual SLAM / Odometry Module](#7-visual-slam--odometry-module)
8. [Path Planner & Motion Control Module](#8-path-planner--motion-control-module)
9. [Ground Control Station (GCS) & Dashboard](#9-ground-control-station--dashboard)
10. [Safety & Fail-Safe Systems](#10-safety--fail-safe-systems)
11. [Multi-Agent & Swarm Capabilities](#11-multi-agent--swarm-capabilities)
12. [Hardware Roadmap](#12-hardware-roadmap)
13. [5-Year Evolution Roadmap](#13-5-year-evolution-roadmap)
14. [Success Criteria & KPIs](#14-success-criteria--kpis)
15. [MVP Frontend Description](#15-mvp-frontend-description)
16. [References & Research Sources](#16-references--research-sources)

---

## 1. Problem Decomposition

The problem statement demands a **fully autonomous, camera-first navigation stack** for a UGV operating in **GPS-denied, unstructured outdoor environments**. This breaks down into **three tightly coupled sub-problems**, each of which is a research domain in itself:

### 1.1 Sub-Problem Map

```
┌──────────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS UGV NAVIGATION                        │
│                                                                      │
│   ┌─────────────┐    ┌──────────────────┐    ┌────────────────┐     │
│   │ PERCEPTION  │───▶│  LOCALIZATION     │───▶│ PATH PLANNING  │    │
│   │ "What do I  │    │  "Where am I?"    │    │ "How do I get  │    │
│   │  see?"      │    │                    │    │  there?"       │    │
│   └─────┬───────┘    └────────┬─────────┘    └───────┬────────┘    │
│         │                     │                       │             │
│   • Path Detection       • Visual SLAM           • Global Plan     │
│   • Obstacle Detect.     • Visual Odometry        • Local Avoidance│
│   • Terrain Class.       • Loop Closure           • Motor Commands │
│   • Semantic Seg.        • Map Management         • Trajectory Opt.│
│   • Depth Estimation     • Pose Graph Opt.        • Fail-Safes     │
│                                                                      │
│   ────────────────── SENSOR LAYER ──────────────────                │
│   RGB Camera(s) │ Stereo Camera │ IMU │ Wheel Encoders              │
│   (Optional: Thermal │ Event Camera │ Depth Sensor)                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Domain Classification

| Sub-Problem | Domain | Difficulty | Real-Time Requirement |
|:---|:---|:---|:---|
| Path/Obstacle Detection | Computer Vision, Deep Learning | High | **Critical** (>15 FPS) |
| Terrain Classification | Semantic Segmentation | Medium–High | High (>10 FPS) |
| Visual SLAM | Robotics, Geometry, Optimization | Very High | **Critical** (<50ms per frame) |
| Visual Odometry | Feature Tracking, Optical Flow | High | **Critical** (<30ms per frame) |
| Global Path Planning | Graph Theory, Sampling-Based Search | Medium | Low (runs periodically) |
| Local Collision Avoidance | Reactive Planning, Potential Fields | High | **Critical** (<20ms loop) |
| Motor Control Translation | Control Theory, Kinematics | Medium | **Critical** (real-time) |

### 1.3 Application Domains

The problem statement explicitly targets:
- 🔍 **Search & Rescue** — Navigate rubble, forest, disaster zones
- 🌾 **Agriculture** — Row-following, field traversal, crop monitoring
- 📦 **Last-Mile Delivery** — Sidewalk/campus navigation
- 🛡️ **Defense & Surveillance** — Patrol, perimeter monitoring
- 🏗️ **Construction & Mining** — Site inspection, material transport

---

## 2. Core Challenges Deep-Dive

### 2.1 Challenge 1: Path Detection

**What it means:** Real-time identification of safe, traversable paths vs. hazards (rocks, ditches, trees, water, steep slopes).

**Why it's hard outdoors:**
- No lane markings, curbs, or structured road geometry
- Terrain textures are highly variable (mud, gravel, grass, leaves, sand)
- Lighting changes drastically (shadows, sun glare, rain, dusk/dawn)
- Seasonal changes alter appearance entirely (snow, autumn leaves)
- Dynamic obstacles: animals, people, other vehicles

**Sub-components:**
1. **Binary Traversability Map** — pixel-level classification: safe / unsafe
2. **Multi-Class Terrain Segmentation** — grass, gravel, rock, water, mud, pavement, vegetation
3. **Traversability Cost Estimation** — continuous cost field (not just binary)
4. **Negative Obstacle Detection** — potholes, ditches, drop-offs (especially hard with monocular cameras)
5. **Dynamic Object Detection** — moving people, animals, vehicles

### 2.2 Challenge 2: Visual Localization

**What it means:** Estimating the UGV's position and orientation (6-DOF pose) without GPS using visual data alone.

**Why it's hard outdoors:**
- GPS-denied → no absolute position reference
- Large-scale environments → cumulative drift over long distances
- Feature-poor regions (e.g., uniform grass field, snow)
- Dynamic elements corrupt feature matching
- Scale ambiguity with monocular cameras

**Sub-components:**
1. **Visual Odometry (VO)** — frame-to-frame ego-motion estimation
2. **Visual SLAM** — simultaneous map building + localization
3. **Loop Closure Detection** — recognizing previously visited places to correct drift
4. **Relocalization** — recovering position after tracking loss
5. **Map Management** — building, storing, and updating persistent maps
6. **Pose Graph Optimization** — globally consistent trajectory estimation

### 2.3 Challenge 3: Collision Avoidance

**What it means:** Dynamically routing the vehicle around sudden obstacles toward a destination.

**Why it's hard outdoors:**
- Obstacles appear suddenly (animal crossing, falling branches)
- Terrain is non-planar (slopes, bumps affect turning radius)
- Vehicle dynamics constraints (skid-steer, Ackermann, differential drive)
- Must balance safety (large clearance) with progress (reach destination)
- Sensor latency and processing time create a reaction-time budget

**Sub-components:**
1. **Global Path Planning** — long-range route from A to B
2. **Local Reactive Avoidance** — short-range obstacle dodging
3. **Trajectory Optimization** — smooth, dynamically feasible paths
4. **Velocity Profiling** — speed adaptation based on terrain and obstacle proximity
5. **Emergency Stop / Fail-Safe** — hard braking when all else fails

---

## 3. System Architecture

### 3.1 Current (2026) — MVP Architecture

```
┌───────────────────────────────────────────────────────────┐
│                   ONBOARD COMPUTE (Jetson Orin)           │
│                                                           │
│  ┌──────────┐   ┌────────────┐   ┌──────────────────┐    │
│  │ Camera   │──▶│ Perception │──▶│  Traversability   │   │
│  │ Driver   │   │ (YOLOv8+   │   │  Map Generator    │   │
│  │          │   │  SegFormer)│   │                    │   │
│  └──────────┘   └─────┬──────┘   └────────┬───────────┘  │
│                       │                    │               │
│  ┌──────────┐   ┌─────▼──────┐   ┌────────▼───────────┐  │
│  │ IMU      │──▶│ Visual     │──▶│  Path Planner      │  │
│  │ Driver   │   │ SLAM       │   │  (Hybrid A* +      │  │
│  │          │   │ (ORB-SLAM3 │   │   DWA / TEB)       │  │
│  └──────────┘   │  / RTAB)   │   └────────┬───────────┘  │
│                 └────────────┘            │               │
│  ┌──────────┐                   ┌────────▼───────────┐   │
│  │ Wheel    │──────────────────▶│  Motor Controller   │  │
│  │ Encoders │                   │  (PID / MPC)        │  │
│  └──────────┘                   └────────────────────┘   │
│                                                           │
│  ┌────────────────────────────────────────────────────┐   │
│  │ ROS 2 (Humble/Iron) — Middleware & Communication   │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────┘
          │  Wi-Fi / 4G Link
          ▼
┌────────────────────────┐
│  Ground Control Station│
│  (Web Dashboard)       │
└────────────────────────┘
```

### 3.2 Five-Year Vision (2031) — Full Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│               ONBOARD COMPUTE (Next-Gen Edge AI SoC)               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              MULTI-MODAL SENSOR FUSION LAYER                │    │
│  │  RGB Stereo │ Thermal IR │ Event Cam │ IMU │ Encoders       │    │
│  │  Radar │ Ultra-Wideband │ Barometer │ Compass               │    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │                  PERCEPTION ENGINE                          │    │
│  │                                                              │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │    │
│  │  │ Multi-Class  │ │ 3D Object    │ │ Monocular Depth  │     │    │
│  │  │ Terrain Seg. │ │ Detection    │ │ Estimation       │     │    │
│  │  │ (SegFormer+) │ │ (Hybrid-Det) │ │ (MiDaS v4+)     │     │    │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘     │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │    │
│  │  │ Panoptic     │ │ Traversab.   │ │ Weather/Light    │     │    │
│  │  │ Segmentation │ │ Cost Field   │ │ Adaptation       │     │    │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘     │    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │               LOCALIZATION ENGINE                           │    │
│  │                                                              │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │    │
│  │  │ Semantic     │ │ Visual-      │ │ Digital Twin     │     │    │
│  │  │ Visual SLAM  │ │ Inertial     │ │ Alignment        │     │    │
│  │  │              │ │ Odometry     │ │ (Pre-Built Map)  │     │    │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘     │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │    │
│  │  │ Neural Loop  │ │ Multi-Map    │ │ Cross-Season     │     │    │
│  │  │ Closure      │ │ Manager      │ │ Relocalization   │     │    │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘     │    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │              PLANNING & CONTROL ENGINE                      │    │
│  │                                                              │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │    │
│  │  │ Global Plan  │ │ Local Plan   │ │ Trajectory       │     │    │
│  │  │ (VD-RRT* /   │ │ (MPPI / DWA) │ │ Optimization     │     │    │
│  │  │  D* Lite)    │ │              │ │ (MPC)            │     │    │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘     │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │    │
│  │  │ Terrain-     │ │ Multi-Vehicle│ │ RL-Based         │     │    │
│  │  │ Aware Vel.   │ │ Coordination │ │ Adaptive Policy  │     │    │
│  │  │ Profiling    │ │              │ │                  │     │    │
│  │  └──────────────┘ └──────────────┘ └──────────────────┘     │    │
│  └─────────────────────────┬───────────────────────────────────┘    │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐    │
│  │             SAFETY & REDUNDANCY LAYER                       │    │
│  │  E-Stop │ Watchdog │ Heartbeat │ Geo-Fence │ Health Mon.    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │   ROS 2 (Rolling) + DDS + CycloneDDS — Real-Time Middleware │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │  5G / Mesh Radio / LoRa
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│              GROUND CONTROL STATION (Cloud-Edge Hybrid)            │
│                                                                     │
│  Mission Planner │ Fleet Manager │ Digital Twin Viewer │ Analytics  │
│  AR Overlay │ Predictive Maintenance │ Regulatory Compliance       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Stack & Algorithms

### 4.1 Perception AI — Algorithm Comparison

| Algorithm | Type | FPS (Jetson Orin) | Accuracy | Use Case |
|:---|:---|:---|:---|:---|
| **YOLOv8-nano** | Object Detection | 45–60 | Good | Obstacle detection (rocks, people) |
| **YOLOv9-small** | Object Detection | 30–40 | Very Good | Multi-class hazard detection |
| **HybriDet** | Hybrid CNN-Transformer | 20–30 | Excellent | Complex scene understanding |
| **SegFormer-B0** | Semantic Segmentation | 25–35 | Very Good | Terrain classification |
| **DeepLabv3+ (MobileNet)** | Semantic Segmentation | 30–40 | Good | Lightweight path segmentation |
| **MiDaS v3.1** | Monocular Depth | 15–25 | Good | Depth estimation from single camera |
| **Depth Anything v2** | Monocular Depth | 20–30 | Very Good | Dense depth maps |
| **EfficientPS** | Panoptic Segmentation | 10–15 | Excellent | Full scene parsing (2031 target) |

### 4.2 Visual SLAM — Algorithm Comparison

| Algorithm | Type | Strengths | Weaknesses | Recommendation |
|:---|:---|:---|:---|:---|
| **ORB-SLAM3** | Feature-based V-SLAM | Best-in-class accuracy, VI fusion, multi-map | Sparse map, complex integration | ✅ Primary for localization |
| **RTAB-Map** | Graph-based V-SLAM | Turnkey ROS2, dense maps, Nav2 ready | Slightly less precise trajectory | ✅ Primary for mapping |
| **VINS-Fusion** | Visual-Inertial Odometry | Excellent VI fusion, GPU-optimized | No dense mapping | Good VO front-end |
| **OpenVINS** | VIO | Lightweight, well-documented | Research-focused | Good alternative VO |
| **DROID-SLAM** | Deep Learning SLAM | End-to-end, handles textureless | Heavy compute, not real-time on edge | 2031 target |
| **Gaussian Splatting SLAM** | Neural Radiance SLAM | Photo-realistic reconstruction | Very new, heavy compute | 2031 experimental |

### 4.3 Path Planning — Algorithm Comparison

| Algorithm | Type | Strengths | Best For |
|:---|:---|:---|:---|
| **Hybrid A*** | Grid-based, kinematic-aware | Smooth, feasible paths | Global planning with vehicle constraints |
| **RRT*** | Sampling-based | Handles complex spaces | Large outdoor exploration |
| **D* Lite** | Incremental replanning | Fast re-route on map changes | Dynamic obstacle response |
| **VD-RRT* + VD-D* Lite** | Hybrid global+local | Vehicle dynamics + fast repair | Off-road terrain navigation |
| **DWA (Dynamic Window)** | Reactive local | Simple, fast, ROS-native | Local obstacle avoidance |
| **TEB (Timed Elastic Band)** | Local trajectory | Smooth, time-optimal | Local planning with dynamics |
| **MPPI** | Model Predictive | Handles uncertainty, terrain-aware | Advanced local planning (2031) |
| **MPC** | Optimal control | Precise trajectory tracking | Motor command generation |

### 4.4 Software Stack

| Layer | Current (2026) | 5-Year Target (2031) |
|:---|:---|:---|
| **Middleware** | ROS 2 Humble / Iron | ROS 2 Rolling + Real-Time DDS |
| **Deep Learning** | PyTorch + TensorRT | ONNX Runtime + Custom NPU Kernels |
| **Edge Inference** | NVIDIA TensorRT 8.x | TensorRT 10+ / Qualcomm AI Engine |
| **SLAM Framework** | ORB-SLAM3 + RTAB-Map | Semantic Neural SLAM (custom) |
| **Navigation** | Nav2 (ROS 2) | Nav2 + Custom RL Controllers |
| **Simulation** | Gazebo + CARLA | NVIDIA Isaac Sim + Digital Twin |
| **GCS Frontend** | React + WebSocket | React + WebGL + AR.js + WebRTC |
| **Communication** | Wi-Fi + 4G | 5G + Mesh Radio + LoRa Fallback |
| **CI/CD** | GitHub Actions | OTA Update Pipeline (Mender.io) |

### 4.5 Hardware Stack

| Component | Current (2026) | 5-Year Target (2031) |
|:---|:---|:---|
| **Primary Compute** | NVIDIA Jetson Orin NX (8GB) | Next-gen Edge AI SoC (Orin successor / Qualcomm RB7+) |
| **Primary Camera** | Intel RealSense D435i (Stereo+IMU) | Custom stereo + event camera module |
| **Secondary Camera** | Logitech C920 (wide-angle) | Thermal IR + Ultra-wide RGB |
| **IMU** | BNO055 / ICM-20948 | Tactical-grade MEMS IMU |
| **Chassis** | 4WD Differential / Ackermann RC platform | Custom suspension, all-terrain tracked/wheeled hybrid |
| **Motor Controller** | Arduino + ROS Bridge | Integrated CAN-bus motor drivers |
| **Power** | 3S–6S LiPo (30–60 min) | Solid-state battery (2–4 hr runtime) |
| **Communication** | Wi-Fi 6 + USB 4G dongle | 5G modem + mesh radio + UWB for swarm |

---

## 5. Full Feature List — 5-Year Prototype (2031)

### 5.1 🧠 Perception & Scene Understanding

| # | Feature | Description | Priority |
|:---|:---|:---|:---|
| P1 | **Real-Time Obstacle Detection** | Detect and classify rocks, trees, people, animals, vehicles, ditches at >30 FPS | 🔴 Critical |
| P2 | **Multi-Class Terrain Segmentation** | Pixel-level classification: grass, gravel, mud, water, pavement, sand, rock, vegetation | 🔴 Critical |
| P3 | **Continuous Traversability Cost Map** | Physics-informed cost field (not binary) — slope, roughness, soil type → continuous [0, 1] cost | 🔴 Critical |
| P4 | **Monocular Depth Estimation** | Dense depth maps from single RGB camera for obstacle ranging | 🟡 High |
| P5 | **Stereo Depth Fusion** | Hardware stereo disparity + learned depth → fused depth map | 🟡 High |
| P6 | **Negative Obstacle Detection** | Identify potholes, ditches, drop-offs, cliffs — the "invisible" hazards | 🟡 High |
| P7 | **Dynamic Object Tracking** | Track moving objects (people, animals) with velocity estimation | 🟡 High |
| P8 | **Panoptic Scene Segmentation** | Unified instance + semantic segmentation for full scene parsing | 🟢 Medium |
| P9 | **Weather & Lighting Adaptation** | Auto-adjust perception pipeline for rain, fog, glare, dusk, night | 🟢 Medium |
| P10 | **Thermal IR Perception** | Night-vision capable obstacle detection using thermal camera | 🟢 Medium |
| P11 | **Event Camera Integration** | High-dynamic-range, motion-robust perception for extreme conditions | 🔵 Future |
| P12 | **3D Scene Reconstruction** | Real-time dense 3D reconstruction from stereo/multi-view | 🔵 Future |
| P13 | **VLM-Powered Scene Understanding** | Use Vision-Language Models for semantic queries ("Is that a puddle or a pond?") | 🔵 Future |

### 5.2 📍 Localization & Mapping

| # | Feature | Description | Priority |
|:---|:---|:---|:---|
| L1 | **Visual-Inertial Odometry** | Tightly coupled camera + IMU ego-motion estimation (<1% drift) | 🔴 Critical |
| L2 | **Feature-Based Visual SLAM** | Real-time map building + localization using ORB/SuperPoint features | 🔴 Critical |
| L3 | **Loop Closure Detection** | Automatic recognition of revisited locations to eliminate drift | 🔴 Critical |
| L4 | **Relocalization after Tracking Loss** | Recover position from map when tracking fails (occlusion, motion blur) | 🔴 Critical |
| L5 | **Multi-Map Management** | Handle multiple disconnected map regions, merge when loop-closed | 🟡 High |
| L6 | **Semantic Map Building** | Maps enriched with semantic labels (road, tree, building, water) | 🟡 High |
| L7 | **Occupancy Grid Generation** | 2D/2.5D occupancy grid for path planner consumption | 🟡 High |
| L8 | **Persistent Map Storage & Loading** | Save maps to disk, reload for repeat missions in same area | 🟡 High |
| L9 | **Cross-Session Relocalization** | Localize against a previously built map (days/weeks later) | 🟢 Medium |
| L10 | **Cross-Season Relocalization** | Handle appearance changes (summer → winter → monsoon) | 🟢 Medium |
| L11 | **Digital Twin Alignment** | Match real-time observations against pre-built 3D maps or satellite imagery | 🔵 Future |
| L12 | **Neural Loop Closure** | Deep learning-based place recognition (NetVLAD, Patch-NetVLAD++) | 🔵 Future |
| L13 | **Crowd-Sourced Map Updates** | Multiple UGVs contribute to a shared, ever-improving map | 🔵 Future |

### 5.3 🗺️ Path Planning & Navigation

| # | Feature | Description | Priority |
|:---|:---|:---|:---|
| N1 | **Global Path Planning** | Long-range route from start to goal using Hybrid A* / RRT* | 🔴 Critical |
| N2 | **Local Reactive Avoidance** | Short-range obstacle dodging at >20 Hz using DWA / TEB | 🔴 Critical |
| N3 | **Dynamic Re-Planning** | Automatic re-route when new obstacles block the planned path | 🔴 Critical |
| N4 | **Waypoint Mission Execution** | Follow a sequence of waypoints with configurable behavior at each | 🔴 Critical |
| N5 | **Terrain-Aware Cost Planning** | Plan paths that prefer easy terrain (paved > gravel > mud) | 🟡 High |
| N6 | **Velocity Profiling** | Slow down on rough terrain, near obstacles, or on slopes | 🟡 High |
| N7 | **Kinematic Constraint Compliance** | Respect vehicle turning radius, max speed, acceleration limits | 🟡 High |
| N8 | **Trajectory Optimization (MPC)** | Smooth, dynamically feasible trajectories for comfortable traversal | 🟡 High |
| N9 | **Multi-Goal Missions** | Plan and execute complex routes with multiple stops and priorities | 🟢 Medium |
| N10 | **Formation/Convoy Driving** | Follow another vehicle or maintain formation in multi-UGV ops | 🟢 Medium |
| N11 | **Return-to-Home (RTH)** | Automatic return to start on low battery or comms loss | 🟢 Medium |
| N12 | **RL-Based Adaptive Navigation** | Reinforcement learning policy that improves with experience | 🔵 Future |
| N13 | **Predictive Obstacle Avoidance** | Anticipate obstacle trajectories (people, animals) and pre-plan | 🔵 Future |
| N14 | **VLM-Guided Exploration** | Natural language goals ("Go to the red barn past the field") | 🔵 Future |

### 5.4 🖥️ Ground Control Station (GCS) — Dashboard & UI

| # | Feature | Description | Priority |
|:---|:---|:---|:---|
| G1 | **Live Camera Feed** | Real-time video stream from UGV with <200ms latency | 🔴 Critical |
| G2 | **Real-Time Map View** | Top-down map with UGV position, heading, path, and obstacles | 🔴 Critical |
| G3 | **Telemetry Dashboard** | Battery, speed, motor current, temperature, CPU/GPU load, signal strength | 🔴 Critical |
| G4 | **Mission Planner** | Click-to-set waypoints, define routes, configure behaviors | 🔴 Critical |
| G5 | **Mode Switching** | Toggle Manual / Semi-Autonomous / Full Autonomous | 🔴 Critical |
| G6 | **Emergency Stop Button** | One-click hard stop accessible from any screen | 🔴 Critical |
| G7 | **Alarm & Alert System** | Priority-coded alerts (critical/warning/info) with audio | 🟡 High |
| G8 | **Perception Overlay** | Overlay semantic segmentation, bounding boxes, depth on video feed | 🟡 High |
| G9 | **3D Map Viewer** | Interactive 3D point cloud / mesh viewer of built map | 🟡 High |
| G10 | **Mission Timeline** | Visual progress bar with waypoints, ETA, elapsed time | 🟡 High |
| G11 | **Path History Trail** | Show the UGV's past trajectory on the map | 🟡 High |
| G12 | **Multi-Vehicle Fleet View** | Monitor and command multiple UGVs from single dashboard | 🟢 Medium |
| G13 | **Geofence Editor** | Draw virtual boundaries the UGV must not cross | 🟢 Medium |
| G14 | **Sensor Health Monitor** | Per-sensor status (camera, IMU, encoder) with fault indicators | 🟢 Medium |
| G15 | **Video Recording & Playback** | Record missions, replay with synchronized telemetry | 🟢 Medium |
| G16 | **AR-Enhanced Video Feed** | Augmented reality overlay with navigation hints and hazard highlights | 🔵 Future |
| G17 | **Digital Twin Viewer** | Real-time 3D digital twin of UGV and environment | 🔵 Future |
| G18 | **Voice Command Interface** | "Go to waypoint 3" / "Stop" / "Return home" via speech | 🔵 Future |
| G19 | **Predictive Analytics** | Battery life prediction, maintenance alerts, mission feasibility scoring | 🔵 Future |
| G20 | **Regulatory Compliance Dashboard** | Operational logs, safety reports, audit trails for certification | 🔵 Future |

### 5.5 🛡️ Safety & Fail-Safe Systems

| # | Feature | Description | Priority |
|:---|:---|:---|:---|
| S1 | **Hardware E-Stop** | Physical kill switch on vehicle + remote trigger | 🔴 Critical |
| S2 | **Software E-Stop** | Immediate motor kill via ROS 2 service | 🔴 Critical |
| S3 | **Watchdog Timer** | Automatic stop if no valid control command received within timeout | 🔴 Critical |
| S4 | **Heartbeat Monitor** | Continuous health check between all software modules | 🔴 Critical |
| S5 | **Geofencing** | Hard boundary enforcement — vehicle cannot leave defined area | 🟡 High |
| S6 | **Low Battery RTH** | Auto-trigger Return-to-Home when battery below threshold | 🟡 High |
| S7 | **Comms Loss Protocol** | Stop / RTH / hold position when communication link lost | 🟡 High |
| S8 | **Sensor Degradation Handling** | Graceful degradation — switch to backup sensors or reduce speed | 🟡 High |
| S9 | **Collision Detection (Post-Fact)** | IMU-based bump/collision detection with auto-stop | 🟢 Medium |
| S10 | **Redundant Localization** | Dual SLAM pipelines — if one fails, the other takes over | 🔵 Future |
| S11 | **Cybersecurity Hardening** | Encrypted comms, authenticated commands, intrusion detection | 🔵 Future |

### 5.6 🤖 Multi-Agent & Swarm Capabilities (2031 Vision)

| # | Feature | Description | Priority |
|:---|:---|:---|:---|
| M1 | **Decentralized Communication** | Peer-to-peer mesh networking between UGVs | 🔵 Future |
| M2 | **Collaborative Mapping** | Multiple UGVs build a shared map | 🔵 Future |
| M3 | **Task Allocation** | Automatic division of mission area among fleet | 🔵 Future |
| M4 | **UAV-UGV Teaming** | Drone provides aerial view to assist UGV navigation | 🔵 Future |
| M5 | **Swarm Formation** | Coordinated movement patterns (line, wedge, search pattern) | 🔵 Future |
| M6 | **Leader-Follower Convoy** | One UGV leads, others follow in formation | 🔵 Future |

---

## 6. Perception AI Module — Deep Dive

### 6.1 Pipeline Architecture

```
                    ┌──────────────┐
                    │  RGB Frame   │
                    │  (640x480)   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────┐
     │ YOLOv8-nano│ │ SegFormer │ │ MiDaS    │
     │ Obstacle   │ │ Terrain   │ │ Depth    │
     │ Detection  │ │ Segment.  │ │ Estimate │
     └─────┬──────┘ └─────┬─────┘ └────┬─────┘
           │              │             │
           ▼              ▼             ▼
     ┌─────────────────────────────────────┐
     │    FUSION: Traversability Cost Map   │
     │                                      │
     │  For each pixel:                     │
     │  cost = f(terrain_class, depth,      │
     │           slope, obstacle_proximity, │
     │           confidence)                │
     │                                      │
     │  Output: 2D Cost Grid (BEV)          │
     └─────────────────────────────────────┘
```

### 6.2 Terrain Classes (Segmentation Labels)

| Class ID | Label | Color Code | Traversability Cost |
|:---|:---|:---|:---|
| 0 | Paved Road | `#808080` (Gray) | 0.1 (easy) |
| 1 | Gravel/Dirt | `#C8A96E` (Tan) | 0.25 |
| 2 | Grass (Short) | `#4CAF50` (Green) | 0.3 |
| 3 | Grass (Tall) | `#2E7D32` (Dark Green) | 0.5 |
| 4 | Sand | `#F5DEB3` (Wheat) | 0.6 |
| 5 | Mud / Wet Soil | `#8B4513` (Brown) | 0.7 |
| 6 | Rock / Boulder | `#696969` (Dim Gray) | 0.9 (hard) |
| 7 | Water / Puddle | `#1E90FF` (Blue) | 1.0 (impassable) |
| 8 | Tree / Dense Vegetation | `#006400` (Dark Green) | 1.0 (impassable) |
| 9 | Building / Wall | `#8B0000` (Dark Red) | 1.0 (impassable) |
| 10 | Person / Animal | `#FF4500` (Red) | 1.0 (dynamic obstacle) |
| 11 | Vehicle | `#FFD700` (Gold) | 1.0 (dynamic obstacle) |
| 12 | Ditch / Drop-off | `#000000` (Black) | 1.0 (negative obstacle) |
| 13 | Sky | `#87CEEB` (Sky Blue) | N/A (ignored) |

### 6.3 Training Data Strategy

| Dataset | Purpose | Size | Environment |
|:---|:---|:---|:---|
| **RUGD** | Unstructured terrain segmentation | 7,456 images | Forest trails, creeks |
| **RELLIS-3D** | Off-road terrain, multi-modal | 13,556 frames | Rough outdoor |
| **Cityscapes** | Urban segmentation (transfer learning) | 25,000 images | Urban roads |
| **COCO** | Object detection pre-training | 330,000 images | General |
| **Custom Field Data** | Site-specific fine-tuning | Ongoing collection | Target deployment site |
| **Synthetic (CARLA/Isaac)** | Data augmentation, edge cases | Unlimited | Simulated |

### 6.4 Model Optimization for Edge Deployment

```
Training (Cloud/GPU Server)
    │
    ▼
Full Model (FP32, ~50M params)
    │
    ├──▶ Pruning (remove redundant channels)         → 30M params
    ├──▶ Knowledge Distillation (teacher → student)  → 8M params
    ├──▶ Quantization (FP32 → FP16 → INT8)          → 4x smaller
    ├──▶ TensorRT Optimization (layer fusion, etc.)  → 2-3x faster
    │
    ▼
Deployed Model (INT8, ~8M params, 40+ FPS on Jetson Orin)
```

---

## 7. Visual SLAM / Odometry Module — Deep Dive

### 7.1 Recommended Pipeline: ORB-SLAM3 + RTAB-Map Hybrid

```
┌──────────────────────────────────────────────────────────────┐
│                    SLAM PIPELINE                             │
│                                                              │
│  ┌───────────┐     ┌──────────────────────────────────┐      │
│  │ Camera    │────▶│ ORB-SLAM3 (Visual-Inertial Mode) │      │
│  │ + IMU     │     │                                    │     │
│  │           │     │ Output:                            │     │
│  │           │     │ - 6-DOF Pose (position + orient.)  │    │
│  │           │     │ - Sparse Feature Map               │    │
│  │           │     │ - Loop Closure Events              │     │
│  └───────────┘     └──────────────┬─────────────────────┘    │
│                                   │                          │
│  ┌───────────┐     ┌──────────────▼─────────────────────┐    │
│  │ Depth     │────▶│ RTAB-Map (Dense Mapping Mode)      │   │
│  │ (Stereo / │     │                                     │   │
│  │  Learned) │     │ Input: Pose from ORB-SLAM3 + Depth  │   │
│  │           │     │ Output:                              │   │
│  │           │     │ - Dense 3D Point Cloud               │   │
│  │           │     │ - 2D Occupancy Grid (for Nav2)       │   │
│  │           │     │ - Persistent Map Database             │  │
│  └───────────┘     └─────────────────────────────────────┘   │
│                                                              │
│  Key Metrics:                                                │
│  - Absolute Trajectory Error (ATE): <0.5m per 100m traveled  │
│  - Relocalization Success Rate: >95%                         │
│  - Loop Closure Latency: <500ms                              │
│  - Tracking Frequency: >20 Hz                                │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Visual Odometry — Frame-by-Frame Pipeline

```
Frame t-1                     Frame t
    │                              │
    ▼                              ▼
┌──────────┐               ┌──────────┐
│ Feature  │               │ Feature  │
│ Extract  │               │ Extract  │
│ (ORB /   │               │ (ORB /   │
│ SuperPt) │               │ SuperPt) │
└────┬─────┘               └────┬─────┘
     │                          │
     └──────────┬───────────────┘
                ▼
        ┌──────────────┐
        │   Feature    │
        │   Matching   │
        │  (BF / FLANN)│
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │   Essential  │
        │   Matrix     │
        │   (RANSAC)   │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │   Decompose  │
        │   R, t       │  ← Rotation & Translation
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │   IMU Fusion │  ← Tightly coupled with gyro/accel
        │   (EKF/UKF)  │
        └──────┬───────┘
               ▼
        ┌──────────────┐
        │  Pose Update │  ← New 6-DOF pose estimate
        │  x, y, z,    │
        │  roll,pitch,  │
        │  yaw          │
        └──────────────┘
```

### 7.3 Drift Mitigation Strategies

| Strategy | How It Works | Drift Reduction |
|:---|:---|:---|
| **IMU Pre-Integration** | Use accelerometer/gyroscope between keyframes to constrain motion | 40–60% |
| **Loop Closure** | Detect revisited places, add graph constraint | 80–95% (when triggered) |
| **Wheel Odometry Fusion** | Encoder-based ground-truth scale correction | 20–30% |
| **Pose Graph Optimization** | Global bundle adjustment / g2o optimization | 50–70% |
| **Map Prior (Digital Twin)** | Localize against pre-built map for drift-free operation | ~100% (when map available) |

---

## 8. Path Planner & Motion Control Module — Deep Dive

### 8.1 Planning Hierarchy

```
┌──────────────────────────────────────────────────────────────────┐
│  LEVEL 1: MISSION PLANNER (Cloud / GCS)                        │
│  - Multi-waypoint route                                         │
│  - Task sequencing                                              │
│  - No-go zone enforcement                                       │
│  - Frequency: On mission start or operator command               │
├──────────────────────────────────────────────────────────────────┤
│  LEVEL 2: GLOBAL PLANNER (Onboard, 1-5 Hz)                     │
│  - Hybrid A* / RRT* / D* Lite on occupancy grid                │
│  - Terrain-cost-aware path                                      │
│  - Re-plans when map changes significantly                      │
│  - Output: Sequence of waypoints                                │
├──────────────────────────────────────────────────────────────────┤
│  LEVEL 3: LOCAL PLANNER (Onboard, 20-50 Hz)                    │
│  - DWA / TEB / MPPI                                             │
│  - Reacts to dynamic obstacles in sensor range                  │
│  - Generates velocity commands (v, w)                           │
│  - Output: cmd_vel → motor controller                           │
├──────────────────────────────────────────────────────────────────┤
│  LEVEL 4: MOTOR CONTROLLER (Microcontroller, 100+ Hz)          │
│  - PID / MPC velocity tracking                                  │
│  - Wheel-level PWM generation                                   │
│  - Current limiting, thermal protection                         │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 Traversability-Aware Planning

Traditional planners treat the world as binary: free or occupied. Our 2031 system uses **continuous traversability cost fields**:

```
Cost(cell) = w1 x terrain_difficulty     (from segmentation)
           + w2 x slope_penalty          (from elevation map)
           + w3 x roughness_penalty      (from point cloud variance)
           + w4 x proximity_penalty      (distance to nearest obstacle)
           + w5 x visibility_penalty     (prefer open areas with good sensor coverage)
           + w6 x historical_penalty     (learned from past traversal failures)
```

Weights `w1...w6` are tunable per mission profile:
- **Search & Rescue:** Aggressive — accept high cost to reach destination
- **Agriculture:** Conservative — protect crops, prefer rows
- **Delivery:** Balanced — prefer roads, avoid off-road

### 8.3 Collision Avoidance Decision Tree

```
                    ┌──────────────────┐
                    │ Obstacle Detected │
                    │ in planned path   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Distance > 5m?   │
                    └──┬──────────┬────┘
                   Yes │          │ No
                       ▼          ▼
              ┌──────────┐  ┌──────────────┐
              │ Re-Plan  │  │ Distance > 1m│
              │ Global   │  └──┬───────┬───┘
              │ Path     │  Yes│       │No
              └──────────┘     ▼       ▼
                       ┌──────────┐ ┌──────┐
                       │ Local    │ │ E-   │
                       │ Avoidance│ │ STOP │
                       │ (DWA)   │ └──────┘
                       └──────────┘
```

---

## 9. Ground Control Station & Dashboard — Feature Deep-Dive

### 9.1 Dashboard Layout (2031 Vision)

```
┌────────────────────────────────────────────────────────────────────┐
│ ⚡ UGV COMMAND CENTER                    🔋 87%  📶 -42dB  ⏱ 12:34│
├──────────────────────────┬─────────────────────────────────────────┤
│                          │  ┌─────────────────────────────────┐   │
│    🗺️ LIVE MAP VIEW      │  │     📹 CAMERA FEED              │   │
│                          │  │                                  │   │
│    ┌──────────────────┐  │  │  [Live Video with AR Overlay]   │   │
│    │  ╔═══╗           │  │  │                                  │   │
│    │  ║UGV║→→→→→→●B   │  │  │  ┌Obstacle┐  ┌Terrain──────┐   │   │
│    │  ╚═══╝           │  │  │  │🟥 Rock  │  │🟩 Grass 0.3 │   │   │
│    │    ↑             │  │  │  └─────────┘  │🟫 Mud  0.7  │   │   │
│    │  ●A (Start)      │  │  │               └──────────────┘   │   │
│    │                  │  │  │                                  │   │
│    │  --- Planned     │  │  │  Speed: 1.2 m/s                 │   │
│    │  === Traveled    │  │  │  Heading: 045 NE                │   │
│    └──────────────────┘  │  └─────────────────────────────────┘   │
│                          │                                        │
│  Zoom: [+][-] Layer:     │  Mode: [Manual] [Semi] [🟢 AUTO]      │
│  ☑ Obstacles ☑ Path      │                                        │
│  ☑ Terrain ☐ Grid        │  ┌──────────────────────────────────┐  │
│                          │  │  🚨 ALERTS                       │  │
├──────────────────────────┤  │  ⚠ Obstacle 3.2m ahead (rock)   │  │
│  📊 TELEMETRY            │  │  ℹ Loop closure detected          │  │
│                          │  │  ✅ Waypoint 2/5 reached          │  │
│  Speed ████████░░ 1.2m/s │  └──────────────────────────────────┘  │
│  Batt  ████████░░ 87%    │                                        │
│  CPU   ██████░░░░ 62%    │  ┌──────────────────────────────────┐  │
│  GPU   ████████░░ 78%    │  │  📋 MISSION PROGRESS              │  │
│  Temp  ████░░░░░░ 43C    │  │                                    │  │
│  SLAM  ✅ Tracking        │  │  ●──●──●──◐──○──○                │  │
│  Link  ✅ -42dB           │  │  1  2  3  4  5  6                │  │
│  IMU   ✅ Calibrated      │  │  ETA: 4m 22s                     │  │
│  Enc   ✅ 24.3 r/s        │  └──────────────────────────────────┘  │
├──────────────────────────┴────────────────────────────────────────┤
│ [🔴 E-STOP] [▶ Start] [⏸ Pause] [🏠 RTH] [📹 Record] [⚙ Config] │
└────────────────────────────────────────────────────────────────────┘
```

### 9.2 GCS Technology Stack

| Component | Technology | Purpose |
|:---|:---|:---|
| Frontend Framework | React 19+ / Next.js | Component-based reactive UI |
| State Management | Zustand / Redux Toolkit | Real-time state synchronization |
| Map Rendering | MapLibre GL JS / Leaflet | 2D/3D geospatial map rendering |
| 3D Visualization | Three.js / React Three Fiber | 3D point cloud and digital twin viewer |
| Video Streaming | WebRTC + MediaSoup | Ultra-low-latency video feed |
| Data Communication | ROS2 WebSocket Bridge (rosbridge) | ROS 2 topic subscription from browser |
| Charts and Gauges | Recharts / D3.js | Telemetry visualization |
| Notifications | Web Audio API + Toast System | Multi-priority alert system |
| Styling | CSS Modules + Design Tokens | Dark-mode, sunlight-readable theme |

---

## 10. Safety & Fail-Safe Systems — Deep Dive

### 10.1 Safety State Machine

```
                    ┌─────────┐
                    │  IDLE   │
                    └────┬────┘
                         │ Mission Start
                    ┌────▼────┐
              ┌─────│ RUNNING │─────┐
              │     └────┬────┘     │
   Comms Loss │          │          │ Low Battery
              ▼          │          ▼
     ┌──────────────┐    │   ┌──────────────┐
     │ COMMS_LOST   │    │   │ LOW_BATTERY  │
     │ (Hold 30s    │    │   │ (RTH Auto)   │
     │  then RTH)   │    │   └──────────────┘
     └──────────────┘    │
                         │ Obstacle < 1m
                    ┌────▼────┐
                    │ E-STOP  │
                    │ (Motors │
                    │  killed)│
                    └────┬────┘
                         │ Operator Reset
                    ┌────▼────┐
                    │  IDLE   │
                    └─────────┘
```

### 10.2 Redundancy Matrix

| System | Primary | Backup | Emergency |
|:---|:---|:---|:---|
| Localization | ORB-SLAM3 (camera) | Wheel Odometry | Dead Reckoning (IMU only) |
| Obstacle Detection | YOLOv8 + SegFormer | Stereo Depth Only | Ultrasonic proximity |
| Communication | Wi-Fi / 5G | LoRa (low bandwidth) | Autonomous RTH |
| Compute | Main SoC (Jetson) | Safety MCU (STM32) | Hardware E-Stop circuit |
| Power | Main battery | Backup cell (safety MCU only) | Capacitor (E-Stop relay) |

---

## 11. Multi-Agent & Swarm Capabilities (2031 Vision)

### 11.1 Fleet Architecture

```
                    ┌──────────────────┐
                    │  FLEET MANAGER   │  (Cloud / Edge Server)
                    │                  │
                    │ - Task Allocation│
                    │ - Map Merger     │
                    │ - Conflict Res.  │
                    └──────┬───────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  UGV-1   │ │  UGV-2   │ │  UAV-1   │
        │ (Scout)  │ │ (Carrier)│ │ (Aerial) │
        └──────────┘ └──────────┘ └──────────┘
              ▲            ▲            │
              │            │            │
              └────── Mesh Network ─────┘
                    (Peer-to-Peer)

    UAV provides:
    - Bird's-eye view for UGV path planning
    - GPS coordinates (relay to GPS-denied UGV)
    - Wide-area obstacle map
```

### 11.2 Collaborative Mapping Protocol

1. Each UGV runs local SLAM independently
2. Descriptors from keyframes are shared over mesh network
3. Central/decentralized map merger detects inter-robot loop closures
4. Merged global map is redistributed to all agents
5. All UGVs benefit from collectively explored map

---

## 12. Hardware Roadmap

### 12.1 Platform Evolution

| Year | Platform | Sensors | Compute | Autonomy Level |
|:---|:---|:---|:---|:---|
| **2026 (Y1)** | 4WD RC chassis, differential drive | Stereo camera + IMU | Jetson Orin NX 8GB | SAE Level 2 (assisted) |
| **2027 (Y2)** | Custom aluminum chassis, Ackermann steering | + Wheel encoders + wide-angle | Jetson Orin NX 16GB | SAE Level 3 (conditional) |
| **2028 (Y3)** | Ruggedized chassis, suspension, IP65 | + Thermal camera + barometer | Jetson AGX Orin 64GB | SAE Level 3+ |
| **2029 (Y4)** | All-terrain tracked/wheeled hybrid | + Event camera + radar | Dual compute (main + safety) | SAE Level 4 (high) |
| **2030-31 (Y5)** | Production-grade platform, modular payload | Full multi-modal suite | Next-gen Edge AI SoC | SAE Level 4+ (full outdoor) |

### 12.2 Sensor Specification Sheet (2031 Target)

| Sensor | Model (Target) | Resolution | FPS | FOV | Purpose |
|:---|:---|:---|:---|:---|:---|
| Stereo Camera | Custom global-shutter pair | 1280x720 | 60 | 90 deg H | Primary perception + VO |
| Thermal Camera | FLIR Lepton 3.5 | 160x120 | 9 | 57 deg H | Night vision, heat detection |
| Event Camera | iniVation DVXplorer | 640x480 events | >10K ev/s | 65 deg H | HDR, motion-robust tracking |
| IMU | Bosch BMI270 | 6-axis | 400 Hz | N/A | Motion sensing, VO fusion |
| Wheel Encoders | Quadrature (1024 CPR) | N/A | 1 kHz | N/A | Odometry, scale correction |
| Ultra-Wideband | DWM1001 modules | N/A | 10 Hz | N/A | Swarm relative positioning |
| Barometric Altimeter | BMP390 | +/-0.5m | 25 Hz | N/A | Altitude estimation for slopes |
| Compass | QMC5883L | +/-1 deg | 100 Hz | N/A | Heading reference |

---

## 13. 5-Year Evolution Roadmap

```
2026 ─────────── 2027 ─────────── 2028 ─────────── 2029 ─────────── 2030-31
  │                │                │                │                │
  ▼                ▼                ▼                ▼                ▼
┌──────────┐  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────┐
│ PHASE 1  │  │ PHASE 2  │   │ PHASE 3  │   │ PHASE 4  │   │ PHASE 5      │
│ FOUNDATION│  │ ROBUSTNESS│  │ INTELLIGENCE│ │ FLEET    │   │ PRODUCTION   │
├──────────┤  ├──────────┤   ├──────────┤   ├──────────┤   ├──────────────┤
│- Basic   │  │- Terrain │   │- Semantic│   │- Multi-  │   │- Certified   │
│  obstacle│  │  classif.│   │  SLAM    │   │  UGV     │   │  safety      │
│  detect. │  │- Weather │   │- RL-based│   │  swarm   │   │- OTA updates │
│- ORB-SLAM│  │  handling│   │  planning│   │- UAV-UGV │   │- Digital twin│
│  basic   │  │- Night   │   │- Predict.│   │  teaming │   │- VLM-guided  │
│- Simple  │  │  mode    │   │  avoidance│  │- Shared  │   │  navigation  │
│  A*+DWA  │  │- Longer  │   │- 3D scene│   │  mapping │   │- Regulatory  │
│- Basic   │  │  missions│   │  recon.  │   │- Leader- │   │  compliance  │
│  GCS     │  │- Enhanced│   │- Voice   │   │  follower│   │- Production  │
│- E-Stop  │  │  safety  │   │  command │   │- Mesh    │   │  hardware    │
│          │  │- Path    │   │- AR feed │   │  network │   │- Full fleet  │
│          │  │  history │   │          │   │          │   │  management  │
└──────────┘  └──────────┘   └──────────┘   └──────────┘   └──────────────┘
```

### 13.1 Phase Details

#### Phase 1: Foundation (2026) — SIH Prototype

**Goal:** Demonstrate basic A to B navigation in a controlled outdoor environment.

- Monocular/stereo camera + IMU only
- YOLOv8-nano for obstacle detection
- ORB-SLAM3 (monocular-inertial) for localization
- Simple A* global planner + DWA local planner via Nav2
- Basic web dashboard: video feed, map, E-stop
- Controlled environment: campus path, daylight, no rain
- **Success Metric:** Navigate 100m with <3 human interventions

#### Phase 2: Robustness (2027)

**Goal:** Handle diverse outdoor conditions reliably.

- Add SegFormer terrain segmentation
- Add wheel encoder fusion for reduced drift
- Night mode via learned depth estimation
- Weather-adaptive perception (rain/fog detection + parameter adjustment)
- Enhanced GCS: mission planner, telemetry, alert system
- Extended missions: 30+ minutes, 500m+ range
- **Success Metric:** 90% success rate across 5 different outdoor environments

#### Phase 3: Intelligence (2028)

**Goal:** Smarter decision-making, richer perception.

- Semantic Visual SLAM (object-level landmarks)
- RL-based local planner (trained in simulation, fine-tuned in real-world)
- Predictive obstacle avoidance (trajectory prediction for dynamic objects)
- 3D dense scene reconstruction
- Voice command interface for GCS
- AR-enhanced video feed
- **Success Metric:** Navigate complex forest/construction site without intervention

#### Phase 4: Fleet (2029)

**Goal:** Multi-vehicle operations and collaboration.

- 2-3 UGV fleet with mesh networking
- Collaborative map building
- Task allocation and area division
- UAV-UGV teaming prototype
- Leader-follower convoy mode
- **Success Metric:** 3 UGVs collaboratively map a 1 sq km area

#### Phase 5: Production (2030-2031)

**Goal:** Field-deployable, certified, production-grade system.

- Production-quality ruggedized hardware
- Full multi-modal sensor suite (stereo + thermal + event + radar)
- Digital twin integration
- VLM-guided natural language navigation
- OTA update pipeline
- Safety certification and regulatory compliance
- Fleet management dashboard with analytics
- **Success Metric:** 1000+ hours of autonomous operation across diverse environments with <0.1% failure rate

---

## 14. Success Criteria & KPIs

### 14.1 Navigation Performance

| KPI | Phase 1 (2026) | Phase 3 (2028) | Phase 5 (2031) |
|:---|:---|:---|:---|
| **Point-to-Point Success Rate** | >80% | >95% | >99.5% |
| **Collision Rate** | <5 per 100 runs | <0.5 per 100 runs | <0.01 per 100 runs |
| **Max Autonomous Range** | 200m | 2 km | 10+ km |
| **Max Mission Duration** | 15 min | 60 min | 4+ hours |
| **Localization Drift** | <2m per 100m | <0.5m per 100m | <0.1m per 100m |
| **Obstacle Detection Range** | 3-5m | 10-15m | 20-30m |
| **Reaction Time (Obstacle)** | <500ms | <200ms | <100ms |
| **Operating Conditions** | Daylight, dry, flat | Day/night, light rain | All-weather, all-terrain |

### 14.2 System Performance

| KPI | Phase 1 (2026) | Phase 3 (2028) | Phase 5 (2031) |
|:---|:---|:---|:---|
| **Perception FPS** | 15-20 | 25-30 | 40-60 |
| **SLAM Frequency** | 15 Hz | 20 Hz | 30+ Hz |
| **Planning Loop** | 10 Hz | 20 Hz | 50 Hz |
| **End-to-End Latency** | <200ms | <100ms | <50ms |
| **Power Consumption** | 30-50W | 25-40W | 20-35W |
| **Mean Time Between Failures** | 2 hours | 20 hours | 200+ hours |

---

## 15. MVP Frontend Description

> **MVP Frontend (2026 SIH Prototype):** The MVP frontend is a **single-page dark-themed web dashboard** accessible from any laptop or tablet over the local network, built with React and WebSocket (rosbridge). It features a **split-screen layout** — the left panel displays a **real-time bird's-eye map view** (using Leaflet/MapLibre) showing the UGV's current position as a directional arrow, the planned path as a dashed line, the traversed trail as a solid line, and detected obstacles as colored markers overlaid on a satellite/grid base layer. The right panel streams the **live camera feed** via WebRTC with optional toggle overlays for bounding boxes (obstacles) and terrain segmentation masks. Below the video sits a compact **telemetry bar** showing battery percentage, vehicle speed, SLAM tracking status (green/red indicator), and signal strength — all updating in real-time. The bottom of the screen has a fixed **control strip** with five large, touch-friendly buttons: a prominent red **Emergency Stop** button, a green **Start Mission** button, a **Pause** button, a **Return-to-Home** button, and a **Settings** gear icon. There is a small **collapsible alert toast panel** on the right edge showing the last 5 system messages (obstacle warnings, waypoint reached, tracking lost, etc.) color-coded by severity. The entire UI is optimized for **sunlight readability** with high-contrast colors, no unnecessary chrome, and a monospace font for telemetry data — it is a functional, operator-focused command interface, not a marketing page, designed to give a single operator full situational awareness and control of the UGV during an outdoor navigation demo.

---

## 16. References & Research Sources

### 16.1 Key Papers & Frameworks

| Reference | Topic | Relevance |
|:---|:---|:---|
| Campos et al. (2021) — *ORB-SLAM3* | Visual-Inertial SLAM | Primary SLAM algorithm |
| Labbe and Michaud (2019) — *RTAB-Map* | Graph-based SLAM | Dense mapping + Nav2 integration |
| Jocher et al. (2023) — *YOLOv8* | Object Detection | Obstacle detection baseline |
| Xie et al. (2021) — *SegFormer* | Semantic Segmentation | Terrain classification |
| Ranft and Stiller (2016) — *Stereo VO* | Visual Odometry | Ego-motion estimation |
| Fox et al. (1997) — *Dynamic Window Approach* | Local Planning | Reactive avoidance |
| Rosmann et al. (2017) — *TEB Planner* | Local Planning | Trajectory optimization |
| Williams et al. (2017) — *MPPI* | Model Predictive Planning | Advanced local planning |
| Dolgov et al. (2010) — *Hybrid A** | Global Planning | Kinematic-aware search |
| Koenig and Likhachev (2002) — *D* Lite* | Incremental Replanning | Dynamic environment adaptation |

### 16.2 Datasets

| Dataset | Link | Purpose |
|:---|:---|:---|
| RUGD | rugd.vision | Off-road terrain segmentation |
| RELLIS-3D | unmannedlab.github.io/research/RELLIS-3D | Multi-modal off-road |
| KITTI | cvlibs.net/datasets/kitti/ | Visual odometry benchmark |
| TartanAir | theairlab.org/tartanair-dataset/ | Diverse SLAM benchmark |
| COCO | cocodataset.org | Object detection pre-training |

### 16.3 Frameworks & Libraries

| Framework | Purpose | License |
|:---|:---|:---|
| ROS 2 (Humble/Iron) | Robot middleware | Apache 2.0 |
| Nav2 | Navigation stack | Apache 2.0 |
| PyTorch | Deep learning training | BSD |
| TensorRT | Edge inference optimization | NVIDIA Proprietary |
| OpenCV | Computer vision utilities | Apache 2.0 |
| Gazebo / Isaac Sim | Simulation | Apache 2.0 / NVIDIA |
| rosbridge_suite | ROS 2 to Web bridge | BSD |

---

## Appendix A: Glossary

| Term | Definition |
|:---|:---|
| **UGV** | Unmanned Ground Vehicle — a robot that operates on the ground without a human driver |
| **SLAM** | Simultaneous Localization And Mapping — building a map while tracking your position within it |
| **VO** | Visual Odometry — estimating ego-motion from camera images |
| **VIO** | Visual-Inertial Odometry — VO fused with IMU data |
| **BEV** | Bird's Eye View — top-down perspective projection |
| **DWA** | Dynamic Window Approach — a local obstacle avoidance algorithm |
| **TEB** | Timed Elastic Band — a local trajectory optimization method |
| **MPPI** | Model Predictive Path Integral — a sampling-based optimal control method |
| **MPC** | Model Predictive Control — an optimization-based control strategy |
| **RRT*** | Rapidly-exploring Random Tree (optimal) — a sampling-based path planner |
| **D* Lite** | An incremental search algorithm for replanning in dynamic environments |
| **FPS** | Frames Per Second — measure of real-time processing speed |
| **6-DOF** | Six Degrees of Freedom — position (x, y, z) + orientation (roll, pitch, yaw) |
| **RTH** | Return to Home — automated return to starting position |
| **GCS** | Ground Control Station — the operator's monitoring and command interface |
| **Nav2** | ROS 2 Navigation Stack — framework for autonomous robot navigation |
| **OTA** | Over-The-Air — remote software updates without physical access |

---

## Appendix B: Risk Matrix

| Risk | Impact | Likelihood | Mitigation |
|:---|:---|:---|:---|
| SLAM tracking loss in feature-poor terrain | High | Medium | IMU fallback, wheel odometry, relocalization |
| Camera failure (lens fog, damage) | Critical | Low | Redundant cameras, thermal fallback |
| Negative obstacle missed (ditch/cliff) | Critical | Medium | Stereo depth, conservative speed limits |
| Dynamic object collision (person) | Critical | Medium | Multi-layer safety: detect then slow then stop |
| Battery depletion mid-mission | High | Medium | Predictive battery model, conservative RTH |
| Communication link failure | Medium | Medium | Autonomous RTH protocol, LoRa backup |
| Computational thermal throttling | High | Medium | Thermal management, model optimization |
| Adversarial attack on perception | High | Low (2031: Medium) | Input validation, ensemble models |
| Regulatory non-compliance | High | Medium | Early engagement with authorities, logging |
| Weather degradation (heavy rain, snow) | High | Medium | Thermal camera, event camera, speed limits |

---

> **Document Version:** 1.0  
> **Last Updated:** October 4, 2026  
> **Authors:** SIH 26126 Research Team  
> **Classification:** Internal — Pre-Development Research
