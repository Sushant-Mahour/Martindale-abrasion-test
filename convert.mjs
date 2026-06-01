import { readFile, writeFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { pptxToHtml } from "@jvmr/pptx-to-html";

const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.DOMParser = dom.window.DOMParser;
global.XMLSerializer = dom.window.XMLSerializer;

async function main() {
  console.log("Reading PPTX file...");
  const file = await readFile("C:/Users/ASUS/OneDrive/Documents/Presentation1.pptx");
  
  console.log("Converting to HTML with absolute positioning...");
  const dom = new JSDOM();
  const slidesHtml = await pptxToHtml(file.buffer, {
    width: 960,
    height: 540,
    scaleToFit: true,
    domParserFactory: () => new dom.window.DOMParser(),
  });

  console.log("Generating final HTML with Animation Triggers...");
  
  // Wrap the slides in an HTML skeleton with GSAP animations
  const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Pixel Perfect Presentation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            margin: 0;
            background-color: #1a1a1a;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
            font-family: sans-serif;
        }
        #slide-container {
            width: 960px;
            height: 540px;
            position: relative;
            background-color: white; /* Default PPT background */
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            overflow: hidden;
        }
        .my-slide-wrapper {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
            display: none; /* Hide all initially */
        }
        .my-slide-wrapper.active {
            display: block;
        }
        
        /* The magical animation class - hidden until triggered */
        .animatable {
            opacity: 0;
            visibility: hidden;
            transform: translateY(10px);
            transition: all 0.5s ease-out;
        }
        .animatable.visible {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
    </style>
</head>
<body>
    
    <div id="slide-container">
        ${slidesHtml.map((html, idx) => `<div class="my-slide-wrapper" id="slide-${idx}">${html}</div>`).join('\n')}
    </div>

    <!-- GSAP for advanced animations -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const slides = document.querySelectorAll('.my-slide-wrapper');
            let currentSlideIdx = 0;
            let animatableElements = [];
            let currentAnimIdx = 0;

            // Initialize the presentation
            function initSlide(idx) {
                // Hide all slides
                slides.forEach(s => s.classList.remove('active'));
                
                // Show current slide
                const currentSlide = slides[idx];
                currentSlide.classList.add('active');
                
                // Find all direct children elements to animate (shapes, text boxes, images)
                // The structure is .my-slide-wrapper > .slide-container > .slide > [elements]
                let elements = [];
                try {
                    const innerSlide = currentSlide.querySelector('.slide-container > .slide');
                    if (innerSlide) {
                        elements = Array.from(innerSlide.children);
                    }
                } catch(e) {
                    console.error("Could not find inner elements", e);
                }
                
                // Tag them for animation
                elements.forEach(el => el.classList.add('animatable', 'visible'));
                // Make them hidden by default for the "trigger" effect
                elements.forEach(el => el.classList.remove('visible'));
                
                animatableElements = elements;
                currentAnimIdx = 0;
                
                // Automatically show the first background elements (like titles)
                if (animatableElements.length > 0) {
                    animatableElements[0].classList.add('visible');
                    currentAnimIdx = 1;
                }
            }

            // Click Trigger Logic (Mimics PPT click-to-animate)
            document.body.addEventListener('click', () => {
                // If there are still elements to animate on the current slide
                if (currentAnimIdx < animatableElements.length) {
                    // Trigger the next animation
                    animatableElements[currentAnimIdx].classList.add('visible');
                    currentAnimIdx++;
                } 
                // If all elements are shown, go to the next slide
                else if (currentSlideIdx < slides.length - 1) {
                    currentSlideIdx++;
                    initSlide(currentSlideIdx);
                }
            });
            
            // Allow arrow keys to navigate
            document.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowRight' || e.key === ' ') {
                    // Trigger click logic
                    document.body.click();
                } else if (e.key === 'ArrowLeft') {
                    // Go back a slide
                    if (currentSlideIdx > 0) {
                        currentSlideIdx--;
                        initSlide(currentSlideIdx);
                    }
                }
            });

            // Start on slide 0
            if (slides.length > 0) {
                initSlide(0);
            }
        });
    </script>
</body>
</html>`;

  await writeFile("exact_layout.html", finalHtml);
  console.log("Successfully created exact_layout.html with custom animation engine!");
}

main().catch(console.error);
