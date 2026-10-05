# ⚙️ Technical System Architecture & Algorithmic Pipelines

## Deep Engineering Specification for Vision-Based Autonomous Navigation

---

## 1. End-to-End System Dataflow Architecture

The autonomous software stack is designed on **ROS 2 (Robot Operating System)** utilizing **Zero-Copy Shared Memory (Eclipse Iceoryx)** over DDS to eliminate CPU serialization overhead when passing high-bandwidth $1080p$ camera frames and 3D voxel grids across nodes.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 SENSOR ACQUISITION LAYER                               │
│  Stereo CMOS Imagers (30-60 FPS) │ Tactical 6-Axis IMU (200-500 Hz) │ Wheel Encoders   │
└───────────────────┬───────────────────────────────┬──────────────────────┬─────────────┘
                    │ Raw BGR8 / NV12 Frames        │ Accel/Gyro Data      │ Tick Counts
                    ▼                               ▼                      ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│       MODULE 1: PERCEPTION AI         │ │     MODULE 2: VISUAL SLAM & LOCALIZATION     │
│                                       │ │                                              │
│ ┌───────────────────────────────────┐ │ │ ┌──────────────────────────────────────────┐ │
│ │ TensorRT FP16/INT8 Inference      │ │ │ │ Stereo Feature Extraction & Tracking     │ │
│ │ • YOLOv8/v10 (Obstacles: 35 FPS)  │ │ │ │ (ORB / SuperPoint / FAST Keypoints)      │ │
│ │ • SegFormer-B0 (Terrain: 20 FPS)  │ │ │ └────────────────────┬─────────────────────┘ │
│ └─────────────────┬─────────────────┘ │ │                      │ Keypoints + Descriptors
│                   ▼                   │ │ ┌────────────────────▼─────────────────────┐ │
│ ┌───────────────────────────────────┐ │ │ │ IMU Pre-Integration & Manifold State    │ │
│ │ Metric Depth Estimation           │ │ │ │ (Position, Velocity, Orientation, Biases)│ │
│ │ (Stereo Semi-Global Matching SGM) │ │ │ └────────────────────┬─────────────────────┘ │
│ └─────────────────┬─────────────────┘ │ │                      │ 6-DoF Pose Transform
│                   ▼                   │ │ ┌────────────────────▼─────────────────────┐ │
│ ┌───────────────────────────────────┐ │ │ │ Pose Graph Optimization & Loop Closure   │ │
│ │ 2.5D Elevation & Traversability   │ │ │ │ (DBoW2 / NetVLAD Place Recog + GTSAM)   │ │
│ │ Costmap Projection (BEV Grid)     │ │ │ └────────────────────┬─────────────────────┘ │
│ └─────────────────┬─────────────────┘ │ └──────────────────────┼───────────────────────┘
└───────────────────┼───────────────────┘                        │
                    │ 20 Hz Local Traversability Grid            │ 30-50 Hz Odometry Pose
                    └─────────────────────┬──────────────────────┘
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        MODULE 3: MOTION PLANNING & VEHICLE CONTROL                     │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Global Path Planner (1 – 2 Hz)                                                   │  │
│  │ • Algorithm: Hybrid A* / Kinodynamic RRT*                                        │  │
│  │ • Input: Current Pose + Goal Waypoint + Global Costmap Accumulator                │  │
│  │ • Output: C²-continuous geometric spline path waypoints                         │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ Reference Global Path                    │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Local Reactive Planner (20 – 30 Hz)                                              │  │
│  │ • Algorithm: Timed-Elastic-Band (TEB) / Model Predictive Path Integral (MPPI)    │  │
│  │ • Constraints: Non-holonomic kinematics, chassis roll/pitch limits, obstacle dist│  │
│  │ • Output: Kinematically feasible velocity trajectory {v(t), ω(t)}                │  │
│  └──────────────────────────────────────────┬───────────────────────────────────────┘  │
│                                             │ Twist Command (Linear v, Angular ω)      │
│                                             ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Non-Linear Model Predictive Controller (NMPC) / Slip Compensator (50 – 100 Hz)   │  │
│  │ • Input: Commanded Twist + IMU Dynamic Roll/Pitch + Wheel Encoder Velocity        │  │
│  │ • Output: PWM / CAN-Bus Motor Driver Commands to Left & Right Wheel Tracks       │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Module 1: Perception AI & Traversability Generation

### 2.1 Model Selection & Edge Optimization
To operate within a strict power budget ($15 - 30\,\text{W}$ on an edge accelerator such as an NVIDIA Jetson Orin Nano/NX), inference is split into a **dual-head heterogeneous pipeline**:

1. **Obstacle Detection (YOLOv8-Nano / YOLOv10-Nano):**
   * *Classes:* Human, Animal, Vehicle, Tree Trunk, Large Rock, Fence, Building.
   * *Inference Latency:* $\approx 12\,\text{ms}$ at $640 \times 640$ resolution under TensorRT INT8 quantization.
   * *Output:* 2D bounding boxes with class confidence scores and 3D bounding frustums generated by reprojecting bounding box pixel coordinates against stereo depth.

2. **Terrain Semantic Segmentation (SegFormer-B0 / MobileNetV4-UNet):**
   * *Trained on:* Off-road benchmark datasets (**RUGD**, **RELLIS-3D**, **DeepScene**).
   * *Classes:*
     - Class 0: Asphalt / Paved Concrete ($\text{Cost} = 0.05$)
     - Class 1: Hard-Packed Soil / Gravel ($\text{Cost} = 0.15$)
     - Class 2: Short Grass ($\text{Cost} = 0.20$)
     - Class 3: Tall Grass / Soft Vegetation ($\text{Cost} = 0.45$)
     - Class 4: Mud / Wet Clay ($\text{Cost} = 0.75$)
     - Class 5: Standing Water / Puddle ($\text{Cost} = 0.95$)
     - Class 6: Solid Boulders / Stumps ($\text{Cost} = 1.00$ - Non-traversable)
   * *Inference Latency:* $\approx 22\,\text{ms}$ at $512 \times 512$ resolution.

### 2.2 Depth Estimation & 3D Point-Cloud Reconstruction
* **Stereo Disparity Computation:** Semi-Global Matching (SGM) or TensorRT-accelerated lightweight neural stereo matching.
* For each pixel $(u, v)$ with disparity $d$, 3D coordinates $(X, Y, Z)$ in the camera frame are computed:

$$X = \frac{(u - c_x) \cdot B}{d}, \quad Y = \frac{(v - c_y) \cdot B}{d}, \quad Z = \frac{f \cdot B}{d}$$

Where $B$ is the stereo baseline ($120\,\text{mm}$), $f$ is camera focal length, and $(c_x, c_y)$ is the principal point.

### 2.3 2.5D Elevation & Traversability Costmap Projection
The 3D point cloud is transformed from the camera optical frame into the UGV's gravity-aligned base footprint frame using the current IMU orientation. It is quantized into a $20\,\text{m} \times 20\,\text{m}$ grid with a cell resolution of $0.05\,\text{m}$ ($400 \times 400$ cells):
1. **Geometric Slope Filter:** For each cell, local surface normal $\vec{n} = [n_x, n_y, n_z]^T$ is fit using PCA on points within a $15\,\text{cm}$ neighborhood. If the angle $\theta = \arccos(n_z) > 22^\circ$, the cell is marked untraversable.
2. **Step Height / Negative Obstacle Filter:** If the maximum height difference $\Delta z = z_{\max} - z_{\min}$ within a cell exceeds chassis ground clearance ($15\,\text{cm}$), or drops sharply below the ground manifold by $>20\,\text{cm}$ (ditch), it is tagged as a hazard.
3. **Semantic Fusion:** The semantic segmentation mask is projected onto the grid, modulating the geometric cost with the surface material friction cost.

---

## 3. Module 2: GPS-Denied Visual SLAM & State Estimation

### 3.1 State Representation & Kinematic Model
The full vehicle navigation state vector $\mathbf{x}_k \in \mathbb{R}^{16}$ at time $t_k$ is defined as:

$$\mathbf{x}_k = \begin{bmatrix} \mathbf{p}_{wb}^T & \mathbf{v}_{wb}^T & \mathbf{q}_{wb}^T & \mathbf{b}_a^T & \mathbf{b}_g^T \end{bmatrix}^T$$

Where:
* $\mathbf{p}_{wb} \in \mathbb{R}^3$: Position of the body frame $\{b\}$ in the fixed world frame $\{w\}$.
* $\mathbf{v}_{wb} \in \mathbb{R}^3$: Linear velocity in the world frame.
* $\mathbf{q}_{wb} \in \mathrm{SO}(3)$: Unit quaternion representing body orientation.
* $\mathbf{b}_a, \mathbf{b}_g \in \mathbb{R}^3$: Dynamic accelerometer and gyroscope zero-bias vectors.

### 3.2 Visual-Inertial Optimization (VIO Frontend)
* Visual features (ORB / FAST corners with BRIEF descriptors) are extracted across the stereo pair at $30\,\text{Hz}$ and tracked across consecutive frames using Lucas-Kanade optical flow.
* **IMU Pre-Integration:** Between keyframe $i$ and $j$, raw high-frequency IMU measurements ($\tilde{\boldsymbol{\omega}}, \tilde{\mathbf{a}}$) are pre-integrated into relative motion constraints on the manifold, decoupling state estimation from continuous re-propagation during non-linear optimization.
* **Local Bundle Adjustment (BA):** Over a sliding window of the last $N = 10$ keyframes, a non-linear least-squares cost function is minimized:

$$\min_{\mathbf{x}} \left( \sum_{k \in \mathcal{K}} \|\mathbf{r}_{\text{IMU}}^{k-1, k}\|^2_{\boldsymbol{\Sigma}_{\text{IMU}}} + \sum_{k \in \mathcal{K}} \sum_{j \in \mathcal{F}} \|\mathbf{r}_{\text{visual}}^{k, j}\|^2_{\boldsymbol{\Sigma}_{\text{visual}}} \right)$$

Where $\mathbf{r}_{\text{IMU}}$ is the IMU pre-integration residual and $\mathbf{r}_{\text{visual}}$ is the visual reprojection error.

### 3.3 Loop Closure & Drift Elimination (Backend)
1. When a new keyframe is added, its visual appearance is converted into a Bag-of-Words vector via **DBoW2** vocabulary trees.
2. Candidate matches are retrieved from past keyframes beyond a temporal distance threshold.
3. Geometric consistency is verified using RANSAC-based 3D-to-3D pose alignment.
4. Upon loop validation, a **Global Pose Graph Optimization** (implemented in **GTSAM** or **g2o**) is executed in a background thread, distributing accumulated drift across the entire historical trajectory.

---

## 4. Module 3: Motion Planning & Motion Control

### 4.1 Global Planning: Hybrid A* on 2.5D Surface
* Standard 2D grid A* fails on vehicles with non-holonomic turning radii and steep slopes.
* **Hybrid A*** searches in continuous 3D configuration space $(x, y, \theta)$:
  - Node expansion uses forward and reverse Reeds-Shepp or Dubins vehicle motion primitives.
  - Heuristics combine non-holonomic distance (ignoring obstacles) and 2D Dijkstra distance (accounting for obstacles).
  - Generates kinematically executable reference paths that naturally respect the vehicle's minimum turning radius.

### 4.2 Local Reactive Planning: Timed Elastic Band (TEB)
The TEB planner deforms the global path locally in real time ($20\,\text{Hz}$) to evade sudden dynamic obstacles:
* Represents the trajectory as an augmented sequence of configurations and time intervals: $\mathcal{B} = \{(\mathbf{s}_i, \Delta t_i)\}_{i=0}^N$.
* Solves a multi-objective non-linear optimization problem balancing:
  - Minimum travel time: $\sum \Delta t_i \to \min$
  - Obstacle separation distance: $d(\mathbf{s}_i, \mathcal{O}) > d_{\text{safe}}$
  - Kinematic velocity & acceleration bounds: $v_i \le v_{\max}$, $a_i \le a_{\max}$, $\omega_i \le \omega_{\max}$
  - Non-holonomic constraint satisfaction: $\dot{y}_i = 0$

### 4.3 Motor Control & Traction Slip Management
For a differential/skid-steer UGV with track width $L$ and wheel radius $R$, commanded linear velocity $v$ and angular velocity $\omega$ translate to individual wheel angular speeds:

$$\omega_L = \frac{v - \frac{\omega L}{2}}{R}, \quad \omega_R = \frac{v + \frac{\omega L}{2}}{R}$$

To prevent loss of control on muddy or gravelly slopes:
* **Slip Estimation:** Compares visual odometry forward velocity $v_{\text{VIO}}$ against wheel encoder velocity $v_{\text{enc}} = \frac{R}{2}(\omega_L + \omega_R)$.
* If slip ratio $s = \frac{|v_{\text{enc}} - v_{\text{VIO}}|}{v_{\text{enc}}} > 0.25$, an active anti-slip traction controller throttles motor torque and commands a momentary rocking counter-torque before wheel spin digs a rut.
