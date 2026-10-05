# 🛰️ SIH Problem Statement 26126: Vision-Based Autonomous Navigation for Outdoor UGV

## Deep Technical Problem Breakdown & Domain Analysis

---

### Executive Metadata
* **Problem Statement ID:** 26126
* **Title:** Vision-Based Autonomous Navigation for Unmanned Ground Vehicle for Outdoor Environment
* **Target Domain:** Field Robotics, Mobile Autonomous Systems, Computer Vision, State Estimation
* **Operating Constraint:** Fully GPS-Denied / GPS-Spoofed, Unstructured Outdoor Environments
* **Primary Sensing Modality:** Passive & Active Optical Vision (Monocular / Stereo / Multi-Spectral Camera Feeds)
* **Core Deliverable:** Autonomous software stack (Perception, Visual SLAM/Odometry, Motion Planning, Motor Control) navigating safely from Point A to Point B.

---

## 1. Problem Decomposition & Anatomy

Outdoor autonomous ground navigation is fundamentally different and significantly more complex than structured road autonomy (e.g., self-driving cars on paved highways) or indoor mobile robotics (e.g., warehouse AMRs on polished concrete floors). 

In an outdoor, unstructured, GPS-denied scenario:
1. **Geometric Priors Do Not Exist:** There are no painted lane lines, curbs, standardized traffic signs, or planar reference surfaces.
2. **Terrain is Non-Rigid & Highly Variable:** Ground composition alternates between hard-packed soil, tall grass, deep mud, loose scree, sandy gravel, leaf litter, and standing water.
3. **Lighting & Optical Phenomena are Non-Stationary:** High-dynamic-range sunlight transitions into deep forest shadows, direct solar glare blinds front-facing CMOS imagers, and adverse weather (rain, mist, fog, dust) introduces particulate backscatter.
4. **GPS Signals Are Completely Denied or Unreliable:** Under dense tree canopies, mountain valleys, urban canyons, or military electronic warfare jamming, satellite triangulation (GNSS) experiences total outage, multi-path reflections, or deliberate spoofing.

The problem statement directly identifies **three fundamental engineering challenges** that must be solved synchronously in a closed control loop:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PROBLEM 26126: CLOSED AUTONOMY LOOP                            │
│                                                                                        │
│               ┌─────────────────────────────────────────────────────────┐              │
│               │         UNSTRUCTURED OUTDOOR PHYSICAL WORLD            │              │
│               │  (Slopes, Mud, Rocks, Shadows, Sun Glare, Dynamic Obs) │              │
│               └──────────────────────────┬──────────────────────────────┘              │
│                                          │ Optical Photons                             │
│                                          ▼                                             │
│               ┌─────────────────────────────────────────────────────────┐              │
│               │             SENSOR SUBSYSTEM (CAMERAS + IMU)            │              │
│               └─────────────┬─────────────────────────────┬─────────────┘              │
│                             │ Raw Frames                  │ Synchronized Frames + IMU  │
│                             ▼                             ▼                            │
│    ┌──────────────────────────────────┐        ┌──────────────────────────────────┐    │
│    │     CHALLENGE 1: PERCEPTION      │        │ CHALLENGE 2: VISUAL LOCALIZATION │    │
│    │ • Path vs. Hazard Classification │        │ • GPS-Denied 6-DoF Ego-Motion    │    │
│    │ • Positive/Negative Obstacles    │        │ • Drift-Bounded Pose Estimation  │    │
│    │ • Continuous Traversability Cost │        │ • Dense/Semi-Dense Mapping       │    │
│    └────────────────┬─────────────────┘        └────────────────┬─────────────────┘    │
│                     │ Traversability Grid                       │ 6-DoF Pose + Map     │
│                     └───────────────────┬───────────────────────┘                      │
│                                         ▼                                              │
│                        ┌──────────────────────────────────┐                            │
│                        │ CHALLENGE 3: COLLISION AVOIDANCE │                            │
│                        │ • Dynamic Obstacle Avoidance     │                            │
│                        │ • Kinodynamic Trajectory Gen     │                            │
│                        │ • Motor Command Generation       │                            │
│                        └────────────────┬─────────────────┘                            │
│                                         │ Twist Commands (v, ω)                        │
│                                         ▼                                              │
│                        ┌──────────────────────────────────┐                            │
│                        │ UGV ACTUATION & MOTOR DRIVERS    │                            │
│                        └──────────────────────────────────┘                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Challenge 1 Deep-Dive: Real-Time Path Detection & Traversability

### 2.1 The Core Scientific Question
> *"Given a 2D pixel stream from an onboard camera, which regions of physical 3D space can the UGV's wheels safely traverse, which will cause immobilization, and which will cause catastrophic damage?"*

### 2.2 Taxonomy of Outdoor Obstacles
Outdoor hazards differ drastically from indoor obstacles:

| Obstacle Category | Real-World Examples | Optical Failure Mode | Mitigation Approach |
|:---|:---|:---|:---|
| **Positive Rigid Obstacles** | Boulders, tree trunks, concrete barriers, metal posts | Misclassified when camouflaged or covered in moss/dirt | High-confidence instance segmentation + stereo depth disparity |
| **Negative Obstacles (Drop-offs)** | Ditches, trenches, bomb craters, steep downward steps, ravines | **Invisible until close**: Appears as continuous ground plane in monocular vision | Dual stereo baseline triangulation, optical flow shear analysis, geometry-based plane fitting |
| **Traversable vs. Non-Traversable Vegetation** | Tall green grass vs. dense woody shrubs & thorn bushes | Traditional 2D bounding boxes treat both as solid obstacles | Geometric compliance modeling, semantic texture classification, stiffness estimation |
| **Non-Rigid / Deformable Surfaces** | Deep mud, quicksand, loose pea gravel, marshland | Look visually identical to dry packed dirt | Multi-spectral infrared reflectance, slip-ratio feedback correlation |
| **Specular / Liquid Hazards** | Standing puddles, muddy ponds, flooded paths | Sky reflections cause depth sensors to see "sky below ground" | Polarization sensing, specular reflection filtering, semantic water segmentation |

### 2.3 Mathematical Formulation of Traversability Cost
Traversability cannot be modeled as a naive binary boolean ($0 = \text{free}, 1 = \text{occupied}$). In rough outdoor environments, it is a continuous cost function $C(x, y) \in [0, 1]$ over the ground manifold:

$$C(x, y) = w_s \cdot S(x, y) + w_r \cdot R(x, y) + w_c \cdot (1 - K_c(x, y)) + w_o \cdot O(x, y)$$

Where:
* $S(x, y) \in [0, 1]$ is the local terrain **slope** relative to gravity vector $\vec{g}$ (exceeding critical tip-over angle $\theta_{\text{crit}} \approx 25^\circ$ yields $C = 1$).
* $R(x, y) \in [0, 1]$ is terrain **roughness** (standard deviation of elevation within the wheel footprint patch).
* $K_c(x, y) \in [0, 1]$ is semantic **class traversability** (e.g., asphalt = 1.0, short grass = 0.9, tall grass = 0.6, mud = 0.2, boulder = 0.0).
* $O(x, y) \in \{0, 1\}$ is strict **obstacle occupancy** (positive obstacles exceeding chassis clearance height $h_{\text{clear}} \approx 0.15\,\text{m}$).
* $w_s, w_r, w_c, w_o$ are normalized tuning weights balancing energy expenditure vs. collision risk.

---

## 3. Challenge 2 Deep-Dive: Visual Localization in GPS-Denied Environments

### 3.1 The Core Scientific Question
> *"Without satellite GNSS signals, how does the vehicle accurately track its position $[x, y, z]^T$ and orientation $[\phi, \theta, \psi]^T$ (6-Degrees-of-Freedom) over hundreds of meters without unbounded cumulative drift?"*

### 3.2 The Fundamental Drift Dilemma
In dead reckoning or pure frame-to-frame Visual Odometry (VO), the relative transformation $\mathbf{T}_{k-1, k} \in \mathrm{SE}(3)$ between consecutive timesteps is concatenated:

$$\mathbf{T}_k = \mathbf{T}_0 \prod_{i=1}^k \mathbf{T}_{i-1, i}$$

Small measurement errors $\delta \mathbf{T}$ accumulate monotonically:
* A tiny rotational drift of $0.5^\circ$ per meter causes a position error exceeding $8.7\,\text{m}$ after just $100\,\text{m}$ of linear travel.
* Without global ground-truth anchors (GPS), error covariance expands unboundedly unless bounded by **topological loop closures** and **multi-sensor inertial fusion**.

### 3.3 Outdoor Visual Degeneracy Modes
1. **Low-Texture Environments:** Dry dirt roads, barren sand dunes, or monoculture wheat fields lack corner points (Harris/FAST/ORB features fail to find sufficient distinct keypoints).
2. **Repetitive Textures:** Forest canopies and dense foliage contain thousands of identical leaves, triggering massive false-positive feature correspondences.
3. **Motion Blur & Rolling Shutter Distortion:** High-speed traversal over rough stones produces high-frequency rotational vibrations ($\omega > 200^\circ/\text{s}$), smearing pixels across CMOS rows.
4. **Dynamic Lighting Transitions:** Moving from open sunlight into dense forest canopies causes temporary imager underexposure/overexposure, blowing out dynamic range and destroying tracking.

### 3.4 Technological Solution Structure
* **Front-End:** Stereo Visual-Inertial Odometry (VIO) fusing stereo optical keypoints with 200–500 Hz IMU linear acceleration and angular velocity via pre-integration on $\mathrm{SO}(3)$ manifolds.
* **Back-End:** Keyframe-based Factor Graph Optimization / Bundle Adjustment minimizing reprojection error and IMU bias drift over a sliding temporal window.
* **Global Loop Closure:** DBoW2 / NetVLAD bag-of-visual-words or deep neural place recognition detecting re-visited territory and solving pose-graph optimization to snap accumulated drift to zero.

---

## 4. Challenge 3 Deep-Dive: Dynamic Collision Avoidance & Motion Planning

### 4.1 The Core Scientific Question
> *"How does the vehicle synthesize a kinematically feasible, dynamically stable trajectory toward a global waypoint while reactively dodging unexpected obstacles appearing within the camera's field of view?"*

### 4.2 Non-Holonomic Kinematic Constraints
UGVs are non-holonomic systems (typically differential-drive, skid-steer, or Ackermann-steered). They cannot move instantaneously sideways ($\dot{y}_{\text{local}} = 0$):

$$\begin{bmatrix} \dot{x} \\ \dot{y} \\ \dot{\theta} \end{bmatrix} = \begin{bmatrix} \cos\theta & 0 \\ \sin\theta & 0 \\ 0 & 1 \end{bmatrix} \begin{bmatrix} v \\ \omega \end{bmatrix}$$

Furthermore, outdoor wheel-ground interaction introduces **significant wheel slip**:
* In mud or loose sand, commanded linear velocity $v_{\text{cmd}}$ differs from actual ground velocity $v_{\text{actual}}$ by slip ratio $s = \frac{v_{\text{wheel}} - v_{\text{actual}}}{v_{\text{wheel}}}$.
* Turning in skid-steer chassis on high-friction rock requires excessive motor torque, whereas turning on wet grass causes uncontrolled understeer.

### 4.3 Hierarchical Motion Planning Architecture
To maintain real-time responsiveness and global convergence without getting trapped in local minima (dead ends):

```
┌────────────────────────────────────────────────────────────────────────┐
│                      HIERARCHICAL PLANNER PIPELINE                     │
│                                                                        │
│   [ Global Goal Point B ] + [ Topological/Topographic Coarse Map ]     │
│                              │                                         │
│                              ▼                                         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 1. GLOBAL PLANNER (0.5 – 2 Hz)                                 │   │
│   │ • Algorithms: Hybrid A*, D* Lite, Informed-RRT*                │   │
│   │ • Output: Coarse, collision-free geometric path waypoints      │   │
│   └──────────────────────────┬─────────────────────────────────────┘   │
│                              │ Waypoint Path                           │
│                              ▼                                         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 2. LOCAL KINODYNAMIC PLANNER (10 – 30 Hz)                      │   │
│   │ • Algorithms: Timed-Elastic-Band (TEB), MPPI, Dynamic Window   │   │
│   │ • Inputs: Traversability Costmap + Dynamic Obstacle Vectors    │   │
│   │ • Output: Smooth, kinematically valid trajectory (x(t), y(t))  │   │
│   └──────────────────────────┬─────────────────────────────────────┘   │
│                              │ Velocity Trajectory (v(t), ω(t))        │
│                              ▼                                         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ 3. VEHICLE CONTROLLER & MOTOR PID (50 – 100 Hz)                │   │
│   │ • Algorithms: Model Predictive Control (MPC) / Pure Pursuit    │   │
│   │ • Inputs: Wheel Encoders, IMU Yaw Rate, Motor Currents         │   │
│   │ • Output: Individual Wheel RPM / Torque Commands               │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Summary of System Requirements & Success Criteria

According to Problem Statement 26126:
* **Input:** Pure onboard camera feeds (RGB/Stereo/Depth) + auxiliary low-cost IMU/wheel encoders.
* **Environment:** Fully outdoor, GPS-denied, unstructured, irregular illumination.
* **Primary Mission:** Navigate from starting pose Point A to target destination Point B without human teleoperation, zero collisions, and zero immobilization.
* **Architecture:** Must integrate Perception AI, Visual SLAM/Odometry, and Path Planner into a unified, high-reliability software stack.
