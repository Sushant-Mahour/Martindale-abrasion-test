# Martindale Abrasion Test – Virtual Lab (v2)

A fully rebuilt interactive simulation of the Martindale Abrasion Test,
faithful to the original PowerPoint presentation with all animations and triggers.

## Folder Structure

```
martindale-sim/
├── index.html                  ← Landing page
├── css/
│   └── main.css                ← Shared stylesheet
├── js/
│   └── sim-engine.js           ← Animation engine (sequential + interactive modes)
├── slides/                     ← All slide images (copy from original repo)
│   ├── slide_01.png
│   ├── slide_01_s00.png
│   ├── slide_01_s01.png
│   └── ... (all slide_XX_sYY.png files)
└── steps-files/
    ├── step1.html  → Step 1:  Introduction & Standards
    ├── step2.html  → Step 2:  Cut Woven Felt Disc (140mm)
    ├── step3.html  → Step 3:  Cut Abrading Paper / Wool Abradant (140mm)
    ├── step4.html  → Step 4:  Sample Preparation (section break)
    ├── step5.html  → Step 5:  Conditioning of Sample (20–22°C, 65±2% RH)
    ├── step6.html  → Step 6:  Cut Leather Specimen (38mm)
    ├── step7.html  → Step 7:  Cut Three 38mm Specimens
    ├── step8.html  → Step 8:  Machine Set-Up (section break)
    ├── step9.html  → Step 9:  Remove Auxiliary Weights (795g)
    ├── step10.html → Step 10: Remove Top Plate, Sample Holder & Clamp
    ├── step11.html → Step 11: Place Felt + Paper + Fix Clamping Rings [4-click fade-in]
    ├── step12.html → Step 12: Fixing Specimen in Holder (section break)
    ├── step13.html → Step 13: Load Specimen – Steps 1–6 + Final [8 interactive buttons]
    ├── step14.html → Step 14: Fix All Specimens on Apparatus
    ├── step15.html → Step 15: Set Parameters & Start Apparatus
    └── step16.html → Step 16: Observations & Evaluation of Results

```

## Setup Instructions

1. **Copy slides**: Copy all image files from the original repo's `slides/` folder
   into `martindale-sim/slides/`

   You can copy from: `C:\Users\ASUS\OneDrive\Documents\mart\slides\`
   or download from: https://github.com/sushant-mahour/Martindale-abrasion-test/tree/main/slides

2. **Open locally**: Open `index.html` in a browser directly, or use a local server.

3. **Deploy to GitHub Pages**: Push the entire `martindale-sim/` folder contents
   to your GitHub repository root.

## Animation Details (matching PPT)

| Step | PPT Slide | Animation Type | Details |
|------|-----------|----------------|---------|
| 1  | Slide 1  | Sequential click | 2 frames, fade-in 500ms |
| 2  | Slide 2  | Sequential click | 4 frames (2 auto-seqs from PPT) |
| 3  | Slide 3  | Sequential click | 4 frames |
| 4  | Slide 4  | Sequential click | 2 frames (section break) |
| 5  | Slide 5  | Sequential click | 4 frames (temperature → humidity callouts) |
| 6  | Slide 6  | Sequential click | 4 frames |
| 7  | Slide 7  | Sequential click | 2 frames |
| 8  | Slide 8  | Sequential click | 2 frames (section break) |
| 9  | Slide 9  | Sequential click | 4 frames |
| 10 | Slide 10 | Sequential click | 5 frames (3 removal steps) |
| **11** | **Slide 11** | **Sequential click** | **5 frames — 4 click-triggered Fade In sequences (felt → paper → ring → complete)** |
| 12 | Slide 12 | Sequential click | 2 frames (section break) |
| **13** | **Slide 13** | **Interactive onClick buttons** | **8 step buttons — each triggers Fade In (500ms) of corresponding image. Matches PPT interactiveSeq with cancelBubble** |
| 14 | Slide 14 | Sequential click | 3 frames |
| 15 | Slide 15 | Sequential click | 3 frames |
| 16 | Slide 17 | Sequential click | 4 frames (PPT slide 16 was blank, skipped) |

## Keyboard Navigation

- **Space / ArrowRight** → Advance to next frame
- **ArrowLeft** → Go back one frame
- **ArrowDown** → Go to next step page
- **ArrowUp** → Go to previous step page
- **Escape** → Return to Home page

## GitHub Pages Deployment

Your `index.html` at the repo root will be served automatically.
Ensure all paths use relative paths (already done: `../css/`, `../js/`, `../slides/`).
