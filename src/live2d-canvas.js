/**
 * Real-Time Interactive Live2D Canvas Renderer & Physics Engine
 * Handles continuous parameters: gaze tracking, auto-blinking, breathing,
 * 2.5D head rotation, hair sway, expression morphing, and anime feature overlays.
 */

export class Live2DCanvasEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext("2d") : null;
    this.width = 2048;
    this.height = 2048;
    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }

    // Image cache to avoid re-fetching assets
    this.imageCache = new Map();

    // State & Selection
    this.selection = null;
    this.parameters = {};
    this.hairMix = {};
    this.eyeMix = {};

    // Live Physics & Motion Parameters
    this.params = {
      angleX: 0,        // Head turn X (-30 to +30)
      angleY: 0,        // Head turn Y (-30 to +30)
      angleZ: 0,        // Head tilt Z (-15 to +15)
      eyeLOpen: 1.0,    // Left eye open factor (0 to 1)
      eyeROpen: 1.0,    // Right eye open factor (0 to 1)
      eyeBallX: 0,      // Pupil X offset (-1 to +1)
      eyeBallY: 0,      // Pupil Y offset (-1 to +1)
      breath: 0,        // Chest/body breathing cycle (0 to 1)
      mouthOpenY: 0,    // Lip-sync / open mouth (0 to 1)
      hairSwayX: 0,     // Hair physics offset
      blushOpacity: 0.6, // Cheek blush intensity
      eyebrowStyle: "gentle" // gentle, happy, angry, surprised, wink
    };

    // Animation & Interactive Controls
    this.isAnimating = true;
    this.isGazeTracking = true;
    this.activeExpression = "neutral"; // neutral, happy, wink, surprised, shy, angry
    this.activeBackdrop = "studio"; // studio, classroom, sunset, cyberpunk, transparent
    this.activePose = "natural"; // natural, t-pose

    // Mouse tracking targets
    this.mouseTarget = { x: 0, y: 0 };
    this.currentMouse = { x: 0, y: 0 };

    // Auto-blink timer state
    this.nextBlinkTime = Date.now() + 3000;
    this.blinkProgress = 0;
    this.isBlinking = false;

    // Start render loop
    this.lastTimestamp = performance.now();
    this.bindEvents();
    this.startLoop();
  }

  bindEvents() {
    if (typeof window === "undefined" || !this.canvas) return;
    window.addEventListener("mousemove", (e) => {
      if (!this.isGazeTracking || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;
      this.mouseTarget.x = (mouseX - 0.5) * 2; // -1 to +1
      this.mouseTarget.y = (mouseY - 0.5) * 2; // -1 to +1
    });
  }

  loadImage(src) {
    if (!src || typeof Image === "undefined") return Promise.resolve(null);
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src));
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  updateData(selectionData, parametersData, hairMixData, eyeMixData) {
    this.selection = selectionData;
    this.parameters = parametersData || {};
    this.hairMix = hairMixData || {};
    this.eyeMix = eyeMixData || {};
    this.preloadCurrentAssets();
  }

  async preloadCurrentAssets() {
    if (!this.selection || typeof Image === "undefined") return;
    const paths = [];
    if (this.selection.anatomy) paths.push(this.selection.anatomy.asset, this.selection.anatomy.handAsset);
    if (this.selection.base) paths.push(this.selection.base.asset);
    if (this.selection.outfit) paths.push(this.selection.outfit.asset);
    if (this.selection.eyes) paths.push(this.selection.eyes.asset);
    if (this.selection.mouth) paths.push(this.selection.mouth.asset);
    if (this.selection.bust) paths.push(this.selection.bust.asset, this.selection.bust.leftAsset, this.selection.bust.rightAsset);

    // Preload hair parts
    if (this.hairMix) {
      const backStyle = this.hairMix.backStyle || "long-straight";
      const frontStyle = this.hairMix.frontStyle || "long-straight";
      ["left", "center", "right"].forEach((p) => {
        paths.push(`./assets/parts/hair/${backStyle}/back-hair/back-${p}.png`);
        paths.push(`./assets/parts/hair/${frontStyle}/front-hair/front-${p}.png`);
        paths.push(`./assets/parts/hair/${frontStyle}/side-locks/side-lock-${p}.png`);
      });
      paths.push(`./assets/parts/hair/${frontStyle}/source/source.png`);
    }

    await Promise.all(paths.map((p) => this.loadImage(p)));
  }

  setExpression(exprName) {
    this.activeExpression = exprName;
    if (exprName === "happy") {
      this.params.eyebrowStyle = "happy";
      this.params.blushOpacity = 0.8;
      this.params.mouthOpenY = 0.4;
      this.params.eyeLOpen = 1.0;
      this.params.eyeROpen = 1.0;
    } else if (exprName === "wink") {
      this.params.eyebrowStyle = "happy";
      this.params.blushOpacity = 0.7;
      this.params.eyeLOpen = 0.0;
      this.params.eyeROpen = 1.0;
    } else if (exprName === "surprised") {
      this.params.eyebrowStyle = "surprised";
      this.params.blushOpacity = 0.5;
      this.params.mouthOpenY = 0.8;
      this.params.eyeLOpen = 1.0;
      this.params.eyeROpen = 1.0;
    } else if (exprName === "shy") {
      this.params.eyebrowStyle = "gentle";
      this.params.blushOpacity = 0.95;
      this.params.mouthOpenY = 0.2;
      this.params.eyeLOpen = 1.0;
      this.params.eyeROpen = 1.0;
    } else if (exprName === "angry") {
      this.params.eyebrowStyle = "angry";
      this.params.blushOpacity = 0.3;
      this.params.mouthOpenY = 0.1;
      this.params.eyeLOpen = 1.0;
      this.params.eyeROpen = 1.0;
    } else {
      // neutral
      this.params.eyebrowStyle = "gentle";
      this.params.blushOpacity = 0.6;
      this.params.eyeLOpen = 1.0;
      this.params.eyeROpen = 1.0;
      this.params.mouthOpenY = 0.0;
    }
  }

  setBackdrop(theme) {
    this.activeBackdrop = theme;
  }

  setPose(pose) {
    this.activePose = pose;
  }

  toggleGaze(enable) {
    this.isGazeTracking = enable !== undefined ? enable : !this.isGazeTracking;
  }

  toggleAnimation(enable) {
    this.isAnimating = enable !== undefined ? enable : !this.isAnimating;
  }

  updatePhysics(delta) {
    if (!this.isAnimating) return;

    const time = performance.now() * 0.001;

    // Smooth mouse interpolation for 2.5D head & eye tracking
    const lerpSpeed = 0.08;
    this.currentMouse.x += (this.mouseTarget.x - this.currentMouse.x) * lerpSpeed;
    this.currentMouse.y += (this.mouseTarget.y - this.currentMouse.y) * lerpSpeed;

    this.params.eyeBallX = this.currentMouse.x * 0.6;
    this.params.eyeBallY = this.currentMouse.y * 0.6;
    this.params.angleX = this.currentMouse.x * 12;
    this.params.angleY = -this.currentMouse.y * 10;
    this.params.angleZ = this.currentMouse.x * 5;

    // Breathing sine cycle
    this.params.breath = Math.sin(time * 2.2) * 0.5 + 0.5;

    // Hair sway inertia
    this.params.hairSwayX = Math.sin(time * 1.5) * 4 + this.currentMouse.x * 8;

    // Auto-blink logic
    const now = Date.now();
    if (this.activeExpression !== "wink") {
      if (now > this.nextBlinkTime && !this.isBlinking) {
        this.isBlinking = true;
        this.blinkProgress = 0;
      }

      if (this.isBlinking) {
        this.blinkProgress += delta * 7;
        if (this.blinkProgress <= 1) {
          const val = 1 - Math.sin(this.blinkProgress * Math.PI);
          this.params.eyeLOpen = val;
          this.params.eyeROpen = val;
        } else {
          this.isBlinking = false;
          this.params.eyeLOpen = 1.0;
          this.params.eyeROpen = 1.0;
          this.nextBlinkTime = now + 2500 + Math.random() * 3500;
        }
      }
    }
  }

  drawBackdrop() {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.activeBackdrop === "transparent") return;

    if (this.activeBackdrop === "studio") {
      const grad = ctx.createRadialGradient(1024, 800, 100, 1024, 1024, 1200);
      grad.addColorStop(0, "#f8f5f2");
      grad.addColorStop(1, "#dfd7cf");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      // Floor shadow
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(1024, 1850, 420, 50, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(70, 55, 65, 0.15)";
      if (typeof ctx.filter !== "undefined") ctx.filter = "blur(12px)";
      ctx.fill();
      ctx.restore();
    } else if (this.activeBackdrop === "classroom") {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#eef3f7");
      grad.addColorStop(0.6, "#d5e2ec");
      grad.addColorStop(1, "#b0c4d4");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.activeBackdrop === "sunset") {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#ffd1a9");
      grad.addColorStop(0.5, "#ff9e80");
      grad.addColorStop(1, "#603866");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.activeBackdrop === "cyberpunk") {
      const grad = ctx.createLinearGradient(0, 0, 0, this.height);
      grad.addColorStop(0, "#1a0b2e");
      grad.addColorStop(0.7, "#11051e");
      grad.addColorStop(1, "#05000a");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawAnimeFeatures(headCenterX, headCenterY) {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.save();
    ctx.translate(headCenterX, headCenterY);

    // 1. Soft Warm Anime Blush on Cheeks
    if (this.params.blushOpacity > 0.05) {
      const blushOpacity = this.params.blushOpacity;
      let gradL = ctx.createRadialGradient(-110, 45, 5, -110, 45, 42);
      gradL.addColorStop(0, `rgba(255, 110, 140, ${blushOpacity * 0.65})`);
      gradL.addColorStop(1, "rgba(255, 110, 140, 0)");
      ctx.fillStyle = gradL;
      ctx.beginPath();
      ctx.arc(-110, 45, 42, 0, Math.PI * 2);
      ctx.fill();

      let gradR = ctx.createRadialGradient(110, 45, 5, 110, 45, 42);
      gradR.addColorStop(0, `rgba(255, 110, 140, ${blushOpacity * 0.65})`);
      gradR.addColorStop(1, "rgba(255, 110, 140, 0)");
      ctx.fillStyle = gradR;
      ctx.beginPath();
      ctx.arc(110, 45, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 255, 255, ${blushOpacity * 0.8})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      [-125, -115, -105, 95, 105, 115].forEach((x) => {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.lineTo(x + 6, 52);
        ctx.stroke();
      });
    }

    // 2. Anime Nose Bridge & Tip Shadow
    ctx.strokeStyle = "rgba(160, 90, 80, 0.45)";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-2, 32);
    ctx.lineTo(2, 42);
    ctx.lineTo(-4, 46);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.beginPath();
    ctx.arc(1, 40, 2, 0, Math.PI * 2);
    ctx.fill();

    // 3. Eyebrows
    const browColor = (this.hairMix && this.hairMix.color) ? this.hairMix.color : "#3a2b38";
    ctx.strokeStyle = browColor;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";

    const browStyle = this.params.eyebrowStyle;
    let browYOffset = 0;
    let browAngleL = 0;
    let browAngleR = 0;

    if (browStyle === "happy") {
      browYOffset = -6;
      browAngleL = -0.08;
      browAngleR = 0.08;
    } else if (browStyle === "surprised") {
      browYOffset = -14;
    } else if (browStyle === "angry") {
      browYOffset = 2;
      browAngleL = 0.15;
      browAngleR = -0.15;
    }

    ctx.save();
    ctx.translate(-95, -75 + browYOffset);
    ctx.rotate(browAngleL);
    ctx.beginPath();
    ctx.moveTo(-35, 5);
    ctx.quadraticCurveTo(0, -10, 35, 0);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(95, -75 + browYOffset);
    ctx.rotate(browAngleR);
    ctx.beginPath();
    ctx.moveTo(-35, 0);
    ctx.quadraticCurveTo(0, -10, 35, 5);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  renderFrame() {
    if (!this.selection || !this.ctx) return;

    this.drawBackdrop();

    const ctx = this.ctx;
    const p = this.params;

    const breathY = p.breath * 8;
    const headTiltX = p.angleX * 1.5 + p.hairSwayX * 0.3;
    const headTiltY = p.angleY * 1.2 - breathY * 0.3;
    const headAngleZ = p.angleZ * (Math.PI / 180);

    // Layer 1: Back Hair
    if (this.hairMix) {
      const backStyle = this.hairMix.backStyle || "long-straight";
      ctx.save();
      ctx.translate(1024 + headTiltX * 0.6, 920 + headTiltY * 0.6);
      ctx.rotate(headAngleZ * 0.5);
      ["left", "center", "right"].forEach((part) => {
        const img = this.imageCache.get(`./assets/parts/hair/${backStyle}/back-hair/back-${part}.png`);
        if (img) ctx.drawImage(img, -1024, -1024, 2048, 2048);
      });
      ctx.restore();
    }

    // Layer 2: Body
    if (this.selection.anatomy) {
      const bodyImg = this.imageCache.get(this.selection.anatomy.asset);
      if (bodyImg) {
        ctx.save();
        ctx.translate(1024, 1024 - breathY);
        ctx.drawImage(bodyImg, -1024, -1024, 2048, 2048);
        ctx.restore();
      }
    }

    // Layer 3: Bust
    if (this.selection.bust) {
      const bustImg = this.imageCache.get(this.selection.bust.asset);
      if (bustImg) {
        ctx.save();
        ctx.translate(1024, 1024 - breathY * 1.2);
        ctx.drawImage(bustImg, -1024, -1024, 2048, 2048);
        ctx.restore();
      }
    }

    // Layer 4: Outfit
    if (this.selection.outfit) {
      const outfitImg = this.imageCache.get(this.selection.outfit.asset);
      if (outfitImg) {
        ctx.save();
        ctx.translate(1024, 1024 - breathY);
        ctx.drawImage(outfitImg, -1024, -1024, 2048, 2048);
        ctx.restore();
      }
    }

    // Layer 5: Hands
    if (this.selection.anatomy) {
      const handImg = this.imageCache.get(this.selection.anatomy.handAsset);
      if (handImg) {
        ctx.save();
        if (this.activePose === "natural") {
          ctx.translate(1024, 1060 - breathY);
          ctx.save();
          ctx.translate(-520, -60);
          ctx.rotate(0.35);
          ctx.scale(0.82, 0.82);
          ctx.drawImage(handImg, 0, 0, 1024, 2048, -512, -1024, 1024, 2048);
          ctx.restore();

          ctx.save();
          ctx.translate(520, -60);
          ctx.rotate(-0.35);
          ctx.scale(0.82, 0.82);
          ctx.drawImage(handImg, 1024, 0, 1024, 2048, -512, -1024, 1024, 2048);
          ctx.restore();
        } else {
          ctx.translate(1024, 1024 - breathY);
          ctx.drawImage(handImg, -1024, -1024, 2048, 2048);
        }
        ctx.restore();
      }
    }

    // Layer 6: Face Base
    const headX = 1024 + headTiltX;
    const headY = 328 + headTiltY;

    if (this.selection.base) {
      const faceImg = this.imageCache.get(this.selection.base.asset);
      if (faceImg) {
        ctx.save();
        ctx.translate(headX, headY);
        ctx.rotate(headAngleZ);
        ctx.drawImage(faceImg, -140, -140, 280, 320);
        ctx.restore();
      }
    }

    // Layer 7: Eyes
    if (this.selection.eyes) {
      const eyeImg = this.imageCache.get(this.selection.eyes.asset);
      if (eyeImg) {
        ctx.save();
        ctx.translate(headX, headY - 12);
        ctx.rotate(headAngleZ);

        const eyeGazeX = p.eyeBallX * 8;
        const eyeGazeY = p.eyeBallY * 5;

        ctx.scale(1.0, (p.eyeLOpen + p.eyeROpen) * 0.5);
        ctx.drawImage(eyeImg, -130 + eyeGazeX, -130 + eyeGazeY, 260, 260);
        ctx.restore();
      }
    }

    // Layer 8: Anime Features
    this.drawAnimeFeatures(headX, headY - 10);

    // Layer 9: Mouth
    if (this.selection.mouth) {
      const mouthImg = this.imageCache.get(this.selection.mouth.asset);
      if (mouthImg) {
        ctx.save();
        ctx.translate(headX, headY + 52);
        ctx.rotate(headAngleZ);
        const mouthScaleY = 1.0 + p.mouthOpenY * 0.5;
        ctx.scale(1.0, mouthScaleY);
        ctx.drawImage(mouthImg, -70, -70, 140, 140);
        ctx.restore();
      }
    }

    // Layer 10: Front Hair
    if (this.hairMix) {
      const frontStyle = this.hairMix.frontStyle || "long-straight";
      ctx.save();
      ctx.translate(headX, headY);
      ctx.rotate(headAngleZ);

      ["side-locks", "front-hair"].forEach((folder) => {
        ["left", "center", "right"].forEach((part) => {
          const img = this.imageCache.get(`./assets/parts/hair/${frontStyle}/${folder}/${folder.slice(0, -1)}-${part}.png`);
          if (img) ctx.drawImage(img, -210, -220, 420, 440);
        });
      });
      ctx.restore();
    }
  }

  startLoop() {
    const loop = (now) => {
      const delta = (now - this.lastTimestamp) * 0.001;
      this.lastTimestamp = now;

      this.updatePhysics(delta);
      this.renderFrame();

      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(loop);
      }
    };
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(loop);
    }
  }

  exportPNG() {
    return this.canvas ? this.canvas.toDataURL("image/png") : "";
  }

  exportLive2DManifest() {
    return JSON.stringify({
      version: "Cubism 4.0 / Live2D Web 2026 Spec",
      model: {
        name: this.selection ? `${this.selection.base.name} Avatar` : "Anime Model",
        parameters: [
          { id: "ParamAngleX", val: this.params.angleX, min: -30, max: 30 },
          { id: "ParamAngleY", val: this.params.angleY, min: -30, max: 30 },
          { id: "ParamAngleZ", val: this.params.angleZ, min: -15, max: 15 },
          { id: "ParamEyeLOpen", val: this.params.eyeLOpen, min: 0, max: 1 },
          { id: "ParamEyeROpen", val: this.params.eyeROpen, min: 0, max: 1 },
          { id: "ParamEyeBallX", val: this.params.eyeBallX, min: -1, max: 1 },
          { id: "ParamEyeBallY", val: this.params.eyeBallY, min: -1, max: 1 },
          { id: "ParamBreath", val: this.params.breath, min: 0, max: 1 },
          { id: "ParamMouthOpenY", val: this.params.mouthOpenY, min: 0, max: 1 }
        ],
        partsSelection: this.selection
      }
    }, null, 2);
  }
}
