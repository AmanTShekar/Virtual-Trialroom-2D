/**
 * bodyModelRenderer.js
 * --------------------
 * Canvas-based parametric body model renderer using bezier curves.
 * Renders a realistic body silhouette + garment drape from measurement sliders.
 * Inspired by Plan.md Phase 3 / Prompt 3 spec.
 */

// ── Body landmark builder from measurements ───────────────────────────────────
export function buildBodyLandmarks(measurements, canvasW, canvasH) {
  const { height, chest, waist, hips, shoulder, inseam } = measurements;

  // Scale to canvas
  const bodyH = canvasH * 0.88;
  const scale = bodyH / 185; // Reference height 185cm

  const cx = canvasW / 2;
  const topY = canvasH * 0.05;

  // Proportional scaling from measurements
  const headR = 22 * scale;
  const headY = topY + headR;
  const neckY = headY + headR * 0.9;
  const shY = neckY + headR * 1.1;
  const shW = (shoulder / 2) * scale * 1.15;
  const bustY = shY + headR * 1.3;
  const bustW = (chest / 2) * scale * 0.55;
  const waistY = bustY + headR * 1.6 * (height / 170);
  const waistW = (waist / 2) * scale * 0.5;
  const hipY = waistY + headR * 1.2;
  const hipW = (hips / 2) * scale * 0.52;
  const crotchY = hipY + headR * 0.7;
  const kneeY = crotchY + (inseam / 2) * scale * 0.9;
  const ankleY = crotchY + inseam * scale * 0.95;

  return { cx, headY, headR, neckY, shY, shW, bustY, bustW, waistY, waistW, hipY, hipW, crotchY, kneeY, ankleY };
}

// ── Skin tone to CSS color ────────────────────────────────────────────────────
function skinColor(faceProfile) {
  if (faceProfile?.skin_tone?.hex) return faceProfile.skin_tone.hex;
  return "#c68642"; // Default medium skin tone
}

// ── Main render function ──────────────────────────────────────────────────────
export function renderBodyModel(canvas, {
  measurements,
  garmentType = "tshirt",
  garmentColor = "#378ADD",
  pattern = "solid",
  drapeStyle = "relaxed",
  faceProfile = null,
  showSkeleton = false,
  keypoints = null,
  userImage = null, // New: Original uploaded image element
}) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const body = buildBodyLandmarks(measurements, W, H);
  const skin = skinColor(faceProfile);
  const ease = drapeStyle === "fitted" ? 0.9 : drapeStyle === "loose" ? 1.2 : 1.05;

  // ── Background gradient ─────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#1a1a2e");
  bg.addColorStop(1, "#0f0f1a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Drop shadow for body ────────────────────────────────────────────────────
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 8;
  ctx.shadowOffsetY = 12;

  // ── Body silhouette ─────────────────────────────────────────────────────────
  const bodyGrad = ctx.createLinearGradient(body.cx - body.shW, 0, body.cx + body.shW, 0);
  bodyGrad.addColorStop(0, shadeColor(skin, -20));
  bodyGrad.addColorStop(0.4, skin);
  bodyGrad.addColorStop(0.6, shadeColor(skin, 10));
  bodyGrad.addColorStop(1, shadeColor(skin, -25));

  ctx.beginPath();
  ctx.moveTo(body.cx, body.neckY); // Start at neck

  // Right side: neck → shoulder → bust → waist → hip → crotch
  ctx.bezierCurveTo(
    body.cx + body.shW * 0.5, body.neckY,
    body.cx + body.shW, body.shY - 5,
    body.cx + body.shW, body.shY
  );
  ctx.bezierCurveTo(
    body.cx + body.shW * 1.02, body.shY + (body.bustY - body.shY) * 0.4,
    body.cx + body.bustW, body.bustY - 5,
    body.cx + body.bustW, body.bustY
  );
  ctx.bezierCurveTo(
    body.cx + body.bustW * 0.9, body.waistY - (body.waistY - body.bustY) * 0.3,
    body.cx + body.waistW, body.waistY,
    body.cx + body.waistW, body.waistY
  );
  ctx.bezierCurveTo(
    body.cx + body.waistW * 1.05, body.waistY + (body.hipY - body.waistY) * 0.5,
    body.cx + body.hipW, body.hipY - 4,
    body.cx + body.hipW, body.hipY
  );
  ctx.bezierCurveTo(
    body.cx + body.hipW * 0.98, body.hipY + (body.crotchY - body.hipY) * 0.7,
    body.cx + body.hipW * 0.5, body.crotchY,
    body.cx + 2, body.crotchY
  );

  // Left side (mirror)
  ctx.bezierCurveTo(
    body.cx - body.hipW * 0.5, body.crotchY,
    body.cx - body.hipW * 0.98, body.hipY + (body.crotchY - body.hipY) * 0.7,
    body.cx - body.hipW, body.hipY
  );
  ctx.bezierCurveTo(
    body.cx - body.hipW, body.hipY - 4,
    body.cx - body.waistW * 1.05, body.waistY + (body.hipY - body.waistY) * 0.5,
    body.cx - body.waistW, body.waistY
  );
  ctx.bezierCurveTo(
    body.cx - body.bustW * 0.9, body.waistY - (body.waistY - body.bustY) * 0.3,
    body.cx - body.bustW, body.bustY,
    body.cx - body.bustW, body.bustY
  );
  ctx.bezierCurveTo(
    body.cx - body.shW * 1.02, body.shY + (body.bustY - body.shY) * 0.4,
    body.cx - body.shW, body.shY - 5,
    body.cx - body.shW, body.shY
  );
  ctx.bezierCurveTo(
    body.cx - body.shW, body.shY - 5,
    body.cx - body.shW * 0.5, body.neckY,
    body.cx, body.neckY
  );

  ctx.closePath();
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.restore();

  // ── Arms ────────────────────────────────────────────────────────────────────
  const armW = body.headR * 0.45;
  const armBottomY = garmentType === "tshirt" ? body.bustY + body.headR * 1.2 : body.waistY + body.headR * 2;

  for (const side of [-1, 1]) {
    const armX = body.cx + side * (body.shW + armW * 0.3);
    const armGrad = ctx.createLinearGradient(armX - armW, 0, armX + armW, 0);
    armGrad.addColorStop(0, shadeColor(skin, -15));
    armGrad.addColorStop(1, shadeColor(skin, 5));

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(body.cx + side * body.shW, body.shY);
    ctx.bezierCurveTo(
      body.cx + side * (body.shW + armW * 0.6), body.shY + body.headR * 0.5,
      armX + side * armW * 0.3, body.bustY,
      armX, armBottomY
    );
    ctx.lineTo(armX + side * armW, armBottomY + 2);
    ctx.bezierCurveTo(
      armX + side * armW * 0.3, body.bustY,
      body.cx + side * (body.shW + armW * 1.0), body.shY + body.headR * 0.4,
      body.cx + side * body.shW, body.shY
    );
    ctx.closePath();
    ctx.fillStyle = armGrad;
    ctx.fill();
    ctx.restore();
  }

  // ── Legs ─────────────────────────────────────────────────────────────────────
  const legW = body.hipW * 0.38;
  for (const side of [-1, 1]) {
    const lx = body.cx + side * legW * 0.6;
    const legGrad = ctx.createLinearGradient(lx - legW, 0, lx + legW, 0);
    legGrad.addColorStop(0, shadeColor(skin, -20));
    legGrad.addColorStop(0.5, skin);
    legGrad.addColorStop(1, shadeColor(skin, -15));

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(lx - legW * 0.5, body.crotchY + 2);
    ctx.bezierCurveTo(
      lx - legW * 0.6, body.kneeY - body.headR,
      lx - legW * 0.45, body.kneeY,
      lx - legW * 0.4, body.ankleY
    );
    ctx.lineTo(lx + legW * 0.4, body.ankleY);
    ctx.bezierCurveTo(
      lx + legW * 0.45, body.kneeY,
      lx + legW * 0.6, body.kneeY - body.headR,
      lx + legW * 0.5, body.crotchY + 2
    );
    ctx.closePath();
    ctx.fillStyle = legGrad;
    ctx.fill();
    ctx.restore();
  }

  // ── Neck ─────────────────────────────────────────────────────────────────────
  const neckW = body.headR * 0.45;
  const neckGrad = ctx.createLinearGradient(body.cx - neckW, 0, body.cx + neckW, 0);
  neckGrad.addColorStop(0, shadeColor(skin, -10));
  neckGrad.addColorStop(1, shadeColor(skin, 5));
  ctx.beginPath();
  ctx.moveTo(body.cx - neckW, body.headY + body.headR * 0.65);
  ctx.bezierCurveTo(body.cx - neckW * 0.9, body.neckY, body.cx + neckW * 0.9, body.neckY, body.cx + neckW, body.headY + body.headR * 0.65);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();

  // ── Head / Face ──────────────────────────────────────────────────────────────
  if (userImage && keypoints && keypoints[0]) {
    drawRealFace(ctx, userImage, keypoints, body, W, H);
  } else {
    // Standard parametric head (fallback)
    const headGrad = ctx.createRadialGradient(
      body.cx - body.headR * 0.2, body.headY - body.headR * 0.2, 2,
      body.cx, body.headY, body.headR
    );
    headGrad.addColorStop(0, shadeColor(skin, 15));
    headGrad.addColorStop(1, shadeColor(skin, -10));
    ctx.beginPath();
    ctx.ellipse(body.cx, body.headY, body.headR * 0.85, body.headR, 0, 0, Math.PI * 2);
    ctx.fillStyle = headGrad;
    ctx.fill();
    
    // Subtle facial features (fallback)
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); // Smile
    ctx.arc(body.cx, body.headY + body.headR * 0.3, body.headR * 0.3, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // ── Garment drape ─────────────────────────────────────────────────────────────
  drawGarment(ctx, body, {
    type: garmentType,
    color: garmentColor,
    pattern,
    ease,
    W, H,
  });

  // ── Skeleton overlay (debug) ─────────────────────────────────────────────────
  if (showSkeleton && keypoints) {
    drawSkeletonOverlay(ctx, keypoints, W, H);
  }

  // ── Subtle body highlight ─────────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(body.cx - body.shW * 0.3, body.bustY, body.shW * 0.25, body.headR * 0.7, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}


// ── Garment renderer ──────────────────────────────────────────────────────────
function drawGarment(ctx, body, { type, color, pattern, ease, W, H }) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 5;

  const garmentStyle = makeGarmentFill(ctx, color, pattern, body, W, H);
  ctx.fillStyle = garmentStyle;

  switch (type) {
    case "tshirt": drawTshirt(ctx, body, ease); break;
    case "shirt": drawShirt(ctx, body, ease); break;
    case "jacket": drawJacket(ctx, body, ease); break;
    case "dress": drawDress(ctx, body, ease); break;
    case "pants": drawPants(ctx, body, ease); break;
    case "skirt": drawSkirt(ctx, body, ease); break;
    default: drawTshirt(ctx, body, ease);
  }

  // Fabric fold lines
  ctx.restore();
  drawFabricFolds(ctx, body, type, color);
}

function drawTshirt(ctx, body, ease) {
  const sw = body.shW * ease;
  const bw = body.bustW * ease;
  const ww = body.waistW * ease;
  const hemY = body.waistY + (body.hipY - body.waistY) * 0.2;

  ctx.beginPath();
  // Collar
  ctx.moveTo(body.cx - body.headR * 0.45, body.neckY + 2);
  ctx.bezierCurveTo(body.cx - body.headR * 0.3, body.shY - 8, body.cx + body.headR * 0.3, body.shY - 8, body.cx + body.headR * 0.45, body.neckY + 2);
  // Right sleeve
  ctx.lineTo(body.cx + sw, body.shY);
  ctx.bezierCurveTo(body.cx + sw * 1.05, body.shY + body.headR * 0.4, body.cx + sw * 0.95, body.shY + body.headR * 0.9, body.cx + sw * 0.85, body.shY + body.headR * 1.1);
  // Right torso
  ctx.bezierCurveTo(body.cx + bw, body.bustY, body.cx + ww, body.waistY, body.cx + ww * 1.02, hemY);
  // Hem
  ctx.lineTo(body.cx - ww * 1.02, hemY);
  // Left torso
  ctx.bezierCurveTo(body.cx - ww, body.waistY, body.cx - bw, body.bustY, body.cx - sw * 0.85, body.shY + body.headR * 1.1);
  // Left sleeve
  ctx.bezierCurveTo(body.cx - sw * 0.95, body.shY + body.headR * 0.9, body.cx - sw * 1.05, body.shY + body.headR * 0.4, body.cx - sw, body.shY);
  ctx.closePath();
  ctx.fill();
}

function drawShirt(ctx, body, ease) {
  drawTshirt(ctx, body, ease * 1.02);
  // Collar points
  ctx.strokeStyle = shadeColor(ctx.fillStyle || "#fff", -30);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(body.cx, body.neckY + body.headR * 0.3);
  ctx.lineTo(body.cx - body.headR * 0.35, body.neckY + body.headR * 0.7);
  ctx.moveTo(body.cx, body.neckY + body.headR * 0.3);
  ctx.lineTo(body.cx + body.headR * 0.35, body.neckY + body.headR * 0.7);
  ctx.stroke();
  // Button line
  ctx.beginPath();
  ctx.moveTo(body.cx, body.neckY + body.headR * 0.8);
  ctx.lineTo(body.cx, body.waistY);
  ctx.stroke();
}

function drawJacket(ctx, body, ease) {
  drawTshirt(ctx, body, ease * 1.08);
  // Lapels
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.moveTo(body.cx, body.neckY + 4);
  ctx.lineTo(body.cx - body.headR * 0.5, body.shY + body.headR * 0.5);
  ctx.lineTo(body.cx - body.headR * 0.2, body.bustY - body.headR * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(body.cx, body.neckY + 4);
  ctx.lineTo(body.cx + body.headR * 0.5, body.shY + body.headR * 0.5);
  ctx.lineTo(body.cx + body.headR * 0.2, body.bustY - body.headR * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawDress(ctx, body, ease) {
  const sw = body.shW * ease;
  const bw = body.bustW * ease;
  const ww = body.waistW * ease * 0.95;
  const hw = body.hipW * ease * 1.15;

  ctx.beginPath();
  ctx.moveTo(body.cx - body.headR * 0.4, body.neckY + 2);
  ctx.bezierCurveTo(body.cx - body.headR * 0.25, body.shY - 8, body.cx + body.headR * 0.25, body.shY - 8, body.cx + body.headR * 0.4, body.neckY + 2);
  ctx.lineTo(body.cx + sw, body.shY);
  ctx.bezierCurveTo(body.cx + bw, body.bustY, body.cx + ww, body.waistY, body.cx + hw, body.ankleY - body.headR);
  ctx.lineTo(body.cx - hw, body.ankleY - body.headR);
  ctx.bezierCurveTo(body.cx - ww, body.waistY, body.cx - bw, body.bustY, body.cx - sw, body.shY);
  ctx.closePath();
  ctx.fill();
}

function drawPants(ctx, body, ease) {
  const hw = body.hipW * ease * 1.05;
  const lw = hw * 0.44;

  for (const side of [-1, 1]) {
    const lx = body.cx + side * lw * 0.55;
    ctx.beginPath();
    ctx.moveTo(body.cx + side * hw * 0.5, body.hipY);
    ctx.bezierCurveTo(body.cx + side * hw * 0.52, body.hipY + body.headR, lx + side * lw * 0.4, body.kneeY, lx + side * lw * 0.38, body.ankleY);
    ctx.lineTo(lx - side * lw * 0.38, body.ankleY);
    ctx.bezierCurveTo(lx - side * lw * 0.4, body.kneeY, body.cx + side * hw * 0.1, body.crotchY, body.cx, body.crotchY);
    if (side === -1) {
      ctx.lineTo(body.cx, body.crotchY);
      ctx.bezierCurveTo(body.cx + hw * 0.1, body.crotchY, body.cx + hw * 0.3, body.hipY, body.cx + hw * 0.5, body.hipY);
    }
    ctx.closePath();
    ctx.fill();
  }
}

function drawSkirt(ctx, body, ease) {
  const ww = body.waistW * ease;
  const hw = body.hipW * ease * 1.3;

  ctx.beginPath();
  ctx.moveTo(body.cx - ww, body.waistY);
  ctx.bezierCurveTo(body.cx - hw * 1.1, body.hipY, body.cx - hw * 1.2, body.kneeY, body.cx - hw, body.kneeY + body.headR);
  ctx.lineTo(body.cx + hw, body.kneeY + body.headR);
  ctx.bezierCurveTo(body.cx + hw * 1.2, body.kneeY, body.cx + hw * 1.1, body.hipY, body.cx + ww, body.waistY);
  ctx.closePath();
  ctx.fill();
}

function drawFabricFolds(ctx, body, type, color) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = shadeColor(color, -30);
  ctx.lineWidth = 1.5;
  ctx.lineCap = "round";

  if (["tshirt", "shirt", "jacket"].includes(type)) {
    // Side seam folds
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(body.cx + side * body.bustW * 0.7, body.bustY + 4);
      ctx.bezierCurveTo(
        body.cx + side * body.waistW * 0.65, body.waistY - 5,
        body.cx + side * body.waistW * 0.7, body.waistY + 5,
        body.cx + side * body.waistW * 0.75, body.waistY + body.headR * 0.5
      );
      ctx.stroke();
    }
  }

  if (["dress", "skirt"].includes(type)) {
    // Vertical drape lines
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      ctx.beginPath();
      ctx.moveTo(body.cx + i * body.waistW * 0.25, body.waistY);
      ctx.bezierCurveTo(
        body.cx + i * body.hipW * 0.3, body.hipY,
        body.cx + i * body.hipW * 0.4, body.kneeY,
        body.cx + i * body.hipW * 0.35, body.ankleY - body.headR
      );
      ctx.stroke();
    }
  }

  ctx.restore();
}

// ── Pattern fills ─────────────────────────────────────────────────────────────
function makeGarmentFill(ctx, color, pattern, body, W, H) {
  if (pattern === "solid") {
    const grad = ctx.createLinearGradient(body.cx - body.shW, body.shY, body.cx + body.shW, body.shY);
    grad.addColorStop(0, shadeColor(color, -15));
    grad.addColorStop(0.4, color);
    grad.addColorStop(0.6, shadeColor(color, 10));
    grad.addColorStop(1, shadeColor(color, -20));
    return grad;
  }

  // For patterns, create an OffscreenCanvas tile
  const tileSize = 12;
  const oc = document.createElement("canvas");
  oc.width = tileSize;
  oc.height = tileSize;
  const oc_ctx = oc.getContext("2d");

  if (pattern === "stripe") {
    oc_ctx.fillStyle = color;
    oc_ctx.fillRect(0, 0, tileSize, tileSize);
    oc_ctx.fillStyle = shadeColor(color, -35);
    oc_ctx.fillRect(0, 0, tileSize / 2, tileSize);
  } else if (pattern === "check") {
    oc_ctx.fillStyle = color;
    oc_ctx.fillRect(0, 0, tileSize, tileSize);
    oc_ctx.fillStyle = shadeColor(color, -40);
    oc_ctx.fillRect(0, 0, tileSize / 2, tileSize / 2);
    oc_ctx.fillRect(tileSize / 2, tileSize / 2, tileSize / 2, tileSize / 2);
  } else if (pattern === "dot") {
    oc_ctx.fillStyle = color;
    oc_ctx.fillRect(0, 0, tileSize, tileSize);
    oc_ctx.fillStyle = shadeColor(color, -40);
    oc_ctx.beginPath();
    oc_ctx.arc(tileSize / 2, tileSize / 2, tileSize * 0.25, 0, Math.PI * 2);
    oc_ctx.fill();
  }

  return ctx.createPattern(oc, "repeat");
}

// ── Skeleton overlay ──────────────────────────────────────────────────────────
function drawSkeletonOverlay(ctx, keypoints, W, H) {
  const CONNECTIONS = [[11, 12],[11, 13],[13, 15],[12, 14],[14, 16],[11, 23],[12, 24],[23, 24],[23, 25],[24, 26],[25, 27],[26, 28]];

  ctx.save();
  ctx.strokeStyle = "#5DCAA5";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;

  CONNECTIONS.forEach(([a, b]) => {
    const pa = keypoints[a], pb = keypoints[b];
    if (!pa || !pb || pa.visibility < 0.5 || pb.visibility < 0.5) return;
    ctx.beginPath();
    ctx.moveTo(pa.x * W, pa.y * H);
    ctx.lineTo(pb.x * W, pb.y * H);
    ctx.stroke();
  });

  ctx.fillStyle = "#5DCAA5";
  keypoints.forEach((kp) => {
    if (kp.visibility < 0.5) return;
    ctx.beginPath();
    ctx.arc(kp.x * W, kp.y * H, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// ── Real Face Overlay ────────────────────────────────────────────────────────
function drawRealFace(ctx, userImage, keypoints, body, canvasW, canvasH) {
  const kps = keypoints;
  // Face points: 0=nose, 1-4=eyes, 5-8=ears
  const faceIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  let minX = 1, maxX = 0, minY = 1, maxY = 0;

  faceIndices.forEach(i => {
    if (kps[i]) {
      minX = Math.min(minX, kps[i].x);
      maxX = Math.max(maxX, kps[i].x);
      minY = Math.min(minY, kps[i].y);
      maxY = Math.max(maxY, kps[i].y);
    }
  });

  // Add padding to face crop
  const padX = (maxX - minX) * 0.35;
  const padY = (maxY - minY) * 0.6;
  minX = Math.max(0, minX - padX);
  maxX = Math.min(1, maxX + padX);
  minY = Math.max(0, minY - padY * 1.2);
  maxY = Math.min(1, maxY + padY * 0.8);

  const imgW = userImage.naturalWidth || userImage.width;
  const imgH = userImage.naturalHeight || userImage.height;

  const sx = minX * imgW;
  const sy = minY * imgH;
  const sw = (maxX - minX) * imgW;
  const sh = (maxY - minY) * imgH;

  const dx = body.cx - body.headR * 0.95;
  const dy = body.headY - body.headR * 1.1;
  const dw = body.headR * 1.9;
  const dh = body.headR * 2.2;

  ctx.save();
  // Clip to head shape for smooth edges
  ctx.beginPath();
  ctx.ellipse(body.cx, body.headY, body.headR * 0.85, body.headR, 0, 0, Math.PI * 2);
  ctx.clip();

  try {
    ctx.drawImage(userImage, sx, sy, sw, sh, dx, dy, dw, dh);
    
    // Overlay a subtle gradient to blend skin edges
    const blend = ctx.createRadialGradient(body.cx, body.headY, body.headR * 0.6, body.cx, body.headY, body.headR);
    blend.addColorStop(0, "rgba(0,0,0,0)");
    blend.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = blend;
    ctx.fill();
  } catch (e) {
    console.warn("Face overlay failed:", e);
  }
  ctx.restore();
}

// ── Utility: shade a hex color ────────────────────────────────────────────────
function shadeColor(hex, amount) {
  if (!hex || !hex.startsWith("#")) return hex;
  let c = hex.slice(1);
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export { shadeColor };
