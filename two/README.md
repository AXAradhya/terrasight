# 📚 SIH Problem Statement 26126: Vision-Based Autonomous Navigation for Outdoor UGV

## Research Dossier & Future Prototype Engineering Specification

---

### Project Repository Overview
This directory (`z:/SIH26126/two/`) contains the complete technical research breakdown, algorithmic architecture, 5-year prototype vision (2031), and MVP specifications for **SIH Problem Statement 26126: Vision Based Autonomous Navigation for Unmanned Ground Vehicle for Outdoor environment**.

---

### Master Index of Documentation

| Document File | Purpose & Contents | Primary Focus Areas |
|:---|:---|:---|
| [01_PROBLEM_BREAKDOWN.md](file:///z:/SIH26126/two/01_PROBLEM_BREAKDOWN.md) | **Problem Decomposition & Scientific Anatomy** | Breakdown of the 3 core challenges: Real-Time Path Detection, GPS-Denied Visual Localization, and Dynamic Collision Avoidance. Mathematical formulation of continuous traversability cost, non-holonomic kinematics, and optical failure modes. |
| [02_5_YEAR_PROTOTYPE_VISION_2031.md](file:///z:/SIH26126/two/02_5_YEAR_PROTOTYPE_VISION_2031.md) | **The 5-Year Prototype Vision ("TERRA-VIPER X5")** | Exhaustive vision of the 2031 production prototype. Neuromorphic event cameras, polarimetric multi-spectral vision, real-time 4D Gaussian Splatting SLAM, Spatial Foundation World Models, parasitic UAV reconnaissance scout, and 25-point exhaustive feature matrix. |
| [03_SYSTEM_ARCHITECTURE_AND_ALGORITHMS.md](file:///z:/SIH26126/two/03_SYSTEM_ARCHITECTURE_AND_ALGORITHMS.md) | **Technical System Architecture & Algorithms** | End-to-end ROS 2 zero-copy pipeline, TensorRT deep learning (YOLOv8/v10 + SegFormer), Stereo-Inertial VIO (ORB-SLAM3 / GTSAM), 2.5D BEV costmaps, Hybrid A* global planner, TEB/MPPI local reactive planners, and active anti-slip traction control. |
| [04_MVP_SPECIFICATION_AND_FRONTEND.md](file:///z:/SIH26126/two/04_MVP_SPECIFICATION_AND_FRONTEND.md) | **MVP Specification & Dedicated Frontend Description** | Contains the exact 1-paragraph frontend visual description for the 2026 hackathon MVP, full hardware Bill of Materials (BOM), UI/UX wireframes, WebRTC/rosbridge communication architecture, and live competition test course protocols. |
| [05_ROADMAP_KPIS_AND_RISK_MATRIX.md](file:///z:/SIH26126/two/05_ROADMAP_KPIS_AND_RISK_MATRIX.md) | **Strategic Roadmap, KPIs & FMEA Risk Matrix** | 5-phase timeline (2026 MVP → 2031 TERRA-VIPER), 10-point quantitative KPI benchmark matrix (drift, speed, range, latency), and comprehensive Failure Modes and Effects Analysis (FMEA) with automated mitigations. |

---

### Key Highlights

#### 1. The Core Problem
To achieve true autonomy without relying on GPS, the UGV must convert passive/active optical camera streams into continuous traversability costmaps, track 6-DoF pose without cumulative drift, and dynamically steer around sudden hazards while navigating from Point A to Point B.

#### 2. The 5-Year Vision (2031)
The **TERRA-VIPER X5** transcends traditional 2D computer vision by utilizing:
* **Neuromorphic Event Vision:** Zero motion blur, $>140\,\text{dB}$ dynamic range.
* **4D Gaussian Splatting SLAM:** Dense, millimeter-accurate 3D reconstruction at $60\,\text{Hz}$ online.
* **Spatial Foundation World Models:** Open-vocabulary reasoning and predictive terramechanics.
* **Parasitic Micro-UAV Scout:** Automated aerial scouting over blind ridges and ravines.

#### 3. The 2026 MVP Frontend (In Brief)
A sunlight-readable dark-slate web console featuring a split-screen layout with an interactive 2D/2.5D tactical map on the left and a live $1080p$ optical stream with translucent semantic segmentation overlays on the right, supported by a real-time telemetry strip and a persistent 5-button emergency and mission control bar.
