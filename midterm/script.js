const heroSection = document.getElementById("hero");
const movementSection = document.getElementById("movement");
const heroName = document.querySelector(".hero-name");
const firstName = document.getElementById("first-name");
const lastName = document.getElementById("last-name");
const navBrand = document.getElementById("nav-brand");
const movementLines = Array.from(document.querySelectorAll(".movement-line")).map(
  (line) => ({
    element: line,
    from: line.dataset.from === "right" ? "right" : "left",
    text: (line.dataset.text || "").trim(),
  }),
);
const leftLines = movementLines.filter((line) => line.from === "left");
const rightLines = movementLines.filter((line) => line.from === "right");

const heroBaseText = {
  first: "Bryan",
  last: "Xu",
};
const NAV_BRAND_TEXT = "Bryan Xu";
const NAV_BRAND_TYPE_INTERVAL_MS = 70;
let navBrandTypeTimer = null;
let navBrandTypingTriggered = false;

function buildNameLetters(element, baseText) {
  element.textContent = "";
  return baseText.split("").map((char) => {
    const span = document.createElement("span");
    span.className = "name-letter";
    span.dataset.base = char;
    span.textContent = char;
    element.appendChild(span);
    return span;
  });
}

const firstLetters = buildNameLetters(firstName, heroBaseText.first);
const lastLetters = buildNameLetters(lastName, heroBaseText.last);
const allNameLetters = [...firstLetters, ...lastLetters];

const STYLE_RATE_MULTIPLIER = 3.6;
const TARGET_STYLE_STEPS = 30;
const STYLE_POOL_LENGTH = Math.ceil(TARGET_STYLE_STEPS / STYLE_RATE_MULTIPLIER) + 2;
const ORIGINAL_FONT_PHASE_END = 0.72;
const FONT_PHASE_LENGTH_FACTOR = 0.45;
const FONT_PHASE_END = ORIGINAL_FONT_PHASE_END * FONT_PHASE_LENGTH_FACTOR;
const BASE_HOLD_SPAN_FACTOR = 0.1;
const HOLD_SCROLL_MULTIPLIER = 2.5;
const FINAL_HOLD_LENGTH_MULTIPLIER = 0.8;
const HOLD_SPACING_DRIFT_MULTIPLIER = 0.5;
const HOLD_SPACING_DRIFT_BASE = 0.9;
const HOLD_WORD_SCALE_DELTA = 0.012;
const HOLD_GAP_SCALE_DELTA = 0.012;
const HOLD_GROUP_SCALE_DELTA = 0;
const FLY_IN_LENGTH_MULTIPLIER = 0.6;
const FINAL_STYLE_SWITCH_AT_FLYIN = 0.92;

const familyPool = [
  '"Instrument Serif", serif',
  '"Parabolica", "Instrument Serif", serif',
  '"Redaction 50", "Redaction", "Instrument Serif", serif',
  '"Voyage", "Instrument Serif", serif',
];
const stylePairs = [
  ["normal", "normal"],
  ["italic", "normal"],
  ["normal", "italic"],
  ["italic", "italic"],
];
const weightPairs = [
  ["200", "900"],
  ["300", "800"],
  ["400", "700"],
  ["500", "600"],
  ["700", "400"],
  ["800", "300"],
  ["900", "200"],
  ["600", "500"],
];

function getTrackedSpacingForFamily(family, fallback) {
  if (family.includes("Parabolica")) return "-0.06em";
  if (family.trim().startsWith('"Instrument Serif"')) return "-0.05em";
  return fallback;
}

const shuffledIndices = Array.from({ length: STYLE_POOL_LENGTH }, (_, index) => index).sort(
  () => Math.random() - 0.5,
);

const heroStyleCycle = shuffledIndices.map((seed) => {
  const [leftStyle, rightStyle] = stylePairs[seed % stylePairs.length];
  const [leftWeight, rightWeight] = weightPairs[(seed * 3 + 1) % weightPairs.length];
  return {
    family: familyPool[seed % familyPool.length],
    leftStyle,
    rightStyle,
    leftWeight,
    rightWeight,
    spacing: getTrackedSpacingForFamily(
      familyPool[seed % familyPool.length],
      ["-0.033em", "-0.028em", "-0.024em", "-0.02em", "-0.015em", "-0.01em"][
        (seed * 2 + 3) % 6
      ],
    ),
  };
});

const finalHeroStyle = {
  family: '"Instrument Serif", serif',
  leftStyle: "normal",
  rightStyle: "normal",
  leftWeight: "400",
  rightWeight: "400",
  spacing: "-0.05em",
};

const letterBurstVectors = allNameLetters.map((_, index) => {
  const direction = index < firstLetters.length ? -1 : 1;
  const angle = (-65 + index * 18) * (Math.PI / 180);
  const distance = 150 + (index % 5) * 42 + index * 16;
  return {
    x: Math.cos(angle) * distance + direction * (110 + (index % 3) * 45),
    y: -Math.abs(Math.sin(angle) * distance) - 120 - (index % 4) * 32,
    rotate: direction * (42 + index * 16) + (index % 2 === 0 ? -14 : 18),
    scale: 1.28 + (index % 6) * 0.17,
    delay: (index % 3) * 0.045 + Math.floor(index / 3) * 0.02,
  };
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeOutQuint = (t) => 1 - (1 - t) ** 5;
const easeInPower = (t, power) => t ** power;

const spaceMeasure = document.createElement("span");
spaceMeasure.style.position = "fixed";
spaceMeasure.style.left = "-9999px";
spaceMeasure.style.top = "-9999px";
spaceMeasure.style.visibility = "hidden";
spaceMeasure.style.whiteSpace = "pre";
spaceMeasure.style.pointerEvents = "none";
document.body.appendChild(spaceMeasure);

function measurePairSpace(referenceElement, firstWord, lastWord) {
  const style = window.getComputedStyle(referenceElement);
  spaceMeasure.style.fontFamily = style.fontFamily;
  spaceMeasure.style.fontStyle = style.fontStyle;
  spaceMeasure.style.fontWeight = style.fontWeight;
  spaceMeasure.style.fontSize = style.fontSize;
  spaceMeasure.style.letterSpacing = style.letterSpacing;
  spaceMeasure.style.lineHeight = style.lineHeight;

  spaceMeasure.textContent = `${firstWord} ${lastWord}`;
  const full = spaceMeasure.getBoundingClientRect().width;
  spaceMeasure.textContent = firstWord;
  const first = spaceMeasure.getBoundingClientRect().width;
  spaceMeasure.textContent = lastWord;
  const last = spaceMeasure.getBoundingClientRect().width;
  return Math.max(4, full - first - last);
}

function getHeroPhaseTimings() {
  const baselineFinalHoldStart = FONT_PHASE_END;
  const baseHoldSpan = 0.8 - FONT_PHASE_END;
  const previousBurstStart = baselineFinalHoldStart + baseHoldSpan * 0.25;
  const previousFadeStart = 0.925;
  const baseFadeDuration = (1 - previousFadeStart) * 0.5;
  const baseBurstDuration = (previousFadeStart - previousBurstStart) * 0.5;
  const baseHoldDuration = Math.max(0, previousBurstStart - baselineFinalHoldStart);

  const spanScale = 0.3;
  const holdSpan =
    baseHoldDuration *
    spanScale *
    BASE_HOLD_SPAN_FACTOR *
    HOLD_SCROLL_MULTIPLIER *
    FINAL_HOLD_LENGTH_MULTIPLIER;
  const burstDuration = baseBurstDuration * spanScale;
  const fadeDuration = baseFadeDuration * spanScale;
  const fadeEnd = 0.985;
  const fadeStart = fadeEnd - fadeDuration;
  const burstStart = fadeStart - burstDuration;
  const finalHoldStart = burstStart - holdSpan;
  const baselineFlyInEnd = Math.max(0.2, burstStart - 0.03);
  const flyInEnd = clamp(baselineFlyInEnd * FLY_IN_LENGTH_MULTIPLIER, 0.12, 0.95);
  return {
    flyInEnd,
    finalHoldStart,
    burstStart,
    fadeStart,
    fadeEnd,
    holdSpan,
  };
}

function sectionProgress(section) {
  const rect = section.getBoundingClientRect();
  const maxScroll = rect.height - window.innerHeight;
  if (maxScroll <= 0) {
    return rect.top <= 0 ? 1 : 0;
  }
  return clamp(-rect.top / maxScroll, 0, 1);
}

function applyCase(text, mode) {
  if (mode === "lower") return text.toLowerCase();
  if (mode === "upper") return text.toUpperCase();
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function setHeroCase(mode) {
  const firstCased = applyCase(heroBaseText.first, mode);
  const lastCased = applyCase(heroBaseText.last, mode);
  firstLetters.forEach((letter, index) => {
    letter.textContent = firstCased[index] || "";
  });
  lastLetters.forEach((letter, index) => {
    letter.textContent = lastCased[index] || "";
  });
}

function stopNavBrandTyping() {
  if (navBrandTypeTimer != null) {
    window.clearInterval(navBrandTypeTimer);
    navBrandTypeTimer = null;
  }
}

function startNavBrandTyping() {
  if (!navBrand) return;
  stopNavBrandTyping();
  navBrand.classList.remove("is-ready");
  navBrand.classList.add("visible", "typing");
  navBrand.textContent = "";
  let typedChars = 0;

  navBrandTypeTimer = window.setInterval(() => {
    typedChars += 1;
    navBrand.textContent = NAV_BRAND_TEXT.slice(0, typedChars);
    if (typedChars >= NAV_BRAND_TEXT.length) {
      stopNavBrandTyping();
      navBrand.classList.remove("typing");
      navBrand.classList.add("is-ready");
    }
  }, NAV_BRAND_TYPE_INTERVAL_MS);
}

function updateNavBrand(heroProgress, movementProgress) {
  if (!navBrand) return;

  const { fadeEnd } = getHeroPhaseTimings();
  const visible = heroProgress >= fadeEnd || movementProgress > 0.01;

  if (!visible) {
    stopNavBrandTyping();
    navBrandTypingTriggered = false;
    navBrand.textContent = "";
    navBrand.classList.remove("visible");
    navBrand.classList.remove("is-ready");
    navBrand.classList.remove("typing");
    return;
  }

  navBrand.classList.add("visible");
  if (!navBrandTypingTriggered) {
    navBrandTypingTriggered = true;
    startNavBrandTyping();
  }
}

function updateHero(progress) {
  const {
    flyInEnd,
    finalHoldStart,
    burstStart,
    fadeStart,
    fadeEnd,
  } = getHeroPhaseTimings();
  const flyLocal = clamp(progress / flyInEnd, 0, 1);
  const flyEased = easeOutCubic(flyLocal);
  const styleLocal = clamp(progress / finalHoldStart, 0, 1);
  const totalStyleSteps = Math.max(
    1,
    Math.floor(heroStyleCycle.length * STYLE_RATE_MULTIPLIER),
  );
  const styleStep = Math.floor(styleLocal * totalStyleSteps);
  const styleIndex = styleStep % heroStyleCycle.length;
  const finalStyleStart = clamp(
    flyInEnd * FINAL_STYLE_SWITCH_AT_FLYIN,
    0,
    burstStart - 0.001,
  );
  const burstLocal = clamp((progress - burstStart) / (fadeStart - burstStart), 0, 1);
  const burstEased = easeInPower(burstLocal, 1.85);
  const fadeLocal = clamp((progress - fadeStart) / (fadeEnd - fadeStart), 0, 1);
  const fadeEased = easeInPower(fadeLocal, 2.2);
  const throwLocal = clamp((progress - burstStart) / (fadeEnd - burstStart), 0, 1);
  const throwEased = easeInPower(throwLocal, 1.8);
  const preBurstLocal = clamp(progress / burstStart, 0, 1);
  const finalHoldLocal = clamp((progress - finalHoldStart) / (burstStart - finalHoldStart), 0, 1);
  const shouldUseFinalStyle = progress >= finalStyleStart;
  const style = shouldUseFinalStyle ? finalHeroStyle : heroStyleCycle[styleIndex];
  const caseMode = shouldUseFinalStyle
    ? "title"
    : ["title", "lower", "upper"][(styleIndex * 2) % 3];

  setHeroCase(caseMode);

  const startGap = clamp(window.innerWidth * 0.042, 26, 56);
  const measuredPairGap = measurePairSpace(
    firstName,
    firstName.textContent || "Bryan",
    lastName.textContent || "Xu",
  );
  const fontSize = parseFloat(window.getComputedStyle(firstName).fontSize) || 0;
  const opticalGapBoost = fontSize * 0.14;
  const nearFinalGap = measuredPairGap + opticalGapBoost;
  const preFinalLocal = clamp(progress / finalHoldStart, 0, 1);
  const preFinalGap =
    startGap + (nearFinalGap - startGap) * easeOutCubic(preFinalLocal);
  const holdSpacingDrift = HOLD_SPACING_DRIFT_BASE * HOLD_SPACING_DRIFT_MULTIPLIER;
  const holdGapScale = 1 + finalHoldLocal * HOLD_GAP_SCALE_DELTA;
  const gap =
    progress < finalHoldStart
      ? preFinalGap
      : (nearFinalGap + (1 - finalHoldLocal) * holdSpacingDrift) * holdGapScale;
  const offscreenMargin = clamp(window.innerWidth * 0.16, 140, 340);

  firstName.style.fontFamily = style.family;
  firstName.style.fontStyle = style.leftStyle;
  firstName.style.fontWeight = style.leftWeight;
  firstName.style.letterSpacing = style.spacing;
  lastName.style.fontFamily = style.family;
  lastName.style.fontStyle = style.rightStyle;
  lastName.style.fontWeight = style.rightWeight;
  lastName.style.letterSpacing = style.spacing;

  const firstWidth = firstName.getBoundingClientRect().width;
  const lastWidth = lastName.getBoundingClientRect().width;
  const halfViewport = window.innerWidth * 0.5;
  const centeredGroupLeft = -(firstWidth + gap + lastWidth) * 0.5;

  const firstStart = -(halfViewport + firstWidth + offscreenMargin);
  const firstEnd = centeredGroupLeft;
  const lastStart = halfViewport + offscreenMargin;
  const lastEnd = centeredGroupLeft + firstWidth + gap;

  const firstX = firstStart + (firstEnd - firstStart) * flyEased;
  const lastX = lastStart + (lastEnd - lastStart) * flyEased;
  const skewValue = 9 * (1 - flyEased);

  const holdTextScale = 1 + finalHoldLocal * HOLD_WORD_SCALE_DELTA;
  firstName.style.transform =
    `translate3d(${firstX.toFixed(1)}px, -50%, 0) ` +
    `skewX(${(-skewValue).toFixed(2)}deg) ` +
    `scale(${holdTextScale.toFixed(3)})`;
  lastName.style.transform =
    `translate3d(${lastX.toFixed(1)}px, -50%, 0) ` +
    `skewX(${skewValue.toFixed(2)}deg) ` +
    `scale(${holdTextScale.toFixed(3)})`;

  const settleOpacity = 0.2 + 0.8 * flyEased;
  const groupOpacity = clamp(settleOpacity * (1 - fadeEased), 0, 1);
  const combinedMotion = clamp(0.35 * burstEased + 0.65 * throwEased, 0, 1);
  const nameBlur = clamp((1 - flyEased) * 4.6 + fadeEased * 1.8, 0, 8);
  // Burst scale extends directly from the hold endpoint for continuity.
  const preBurstScale = 1 + finalHoldLocal * HOLD_GROUP_SCALE_DELTA;
  const burstScale = preBurstScale + combinedMotion * 0.46;
  const slowRise = -preBurstLocal * 7;
  const burstRise = -combinedMotion * window.innerHeight * 0.4;
  const groupBlur = combinedMotion * 3.2;

  heroName.style.transform =
    `translate3d(0, ${(slowRise + burstRise).toFixed(1)}px, 0) ` +
    `scale(${burstScale.toFixed(3)})`;
  heroName.style.opacity = groupOpacity.toFixed(3);
  heroName.style.filter = `blur(${groupBlur.toFixed(2)}px)`;
  firstName.style.opacity = "1";
  lastName.style.opacity = "1";
  firstName.style.filter = `blur(${nameBlur.toFixed(2)}px)`;
  lastName.style.filter = `blur(${nameBlur.toFixed(2)}px)`;

  allNameLetters.forEach((letter, index) => {
    const vector = letterBurstVectors[index];
    const stagedProgress = clamp((combinedMotion - vector.delay * 0.18), 0, 1);
    if (stagedProgress <= 0) {
      letter.style.transform = "translate3d(0, 0, 0) rotate(0deg) scale(1)";
      letter.style.opacity = "1";
      letter.style.filter = "blur(0)";
      return;
    }

    const letterEased = easeOutQuint(stagedProgress);
    const motionMix = letterEased;
    const throwScaleX = 0.72 + window.innerWidth / 3600;
    const throwScaleY = 0.8 + window.innerHeight / 3200;
    const x = vector.x * throwScaleX * motionMix;
    const y = vector.y * throwScaleY * motionMix;
    const rotate = vector.rotate * motionMix;
    const scale = 1 + (vector.scale - 1) * motionMix;

    letter.style.transform =
      `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) ` +
      `rotate(${rotate.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
    letter.style.opacity = (1 - fadeEased).toFixed(3);
    letter.style.filter = `blur(${(motionMix * 2.4).toFixed(2)}px)`;
  });
}

function updateMovement(progress) {
  const { holdSpan } = getHeroPhaseTimings();
  const heroSpanPx = heroSection.getBoundingClientRect().height;
  const movementSpanPx = movementSection.getBoundingClientRect().height;
  const MIN_CENTER_HOLD = 0.12;
  const holdSpanAbsolute = movementSpanPx > 0
    ? clamp((holdSpan * heroSpanPx) / movementSpanPx, MIN_CENTER_HOLD, 0.85)
    : holdSpan;
  const paragraphLocal = clamp(progress / (1 - holdSpanAbsolute), 0, 1);
  const eased = easeOutCubic(paragraphLocal);
  const travel = window.innerWidth + 360;

  const updateParagraph = (lines, direction) => {
    const offset = direction * (1 - eased) * travel;
    const linesCount = lines.length;
    const lineSweep = paragraphLocal * linesCount;
    let activeLineFound = false;

    lines.forEach((line, index) => {
      const lineLocal = clamp(lineSweep - index, 0, 1);
      const chars = Math.floor(line.text.length * lineLocal);
      const isTyping = !activeLineFound && lineLocal > 0 && lineLocal < 1 && chars > 0;
      if (isTyping) activeLineFound = true;

      line.element.textContent = line.text.slice(0, chars);
      line.element.classList.toggle("typing", isTyping);
      line.element.style.transform = `translate3d(${offset.toFixed(1)}px, 0, 0)`;
      line.element.style.opacity = (0.12 + 0.88 * eased).toFixed(3);
      line.element.style.filter = `blur(${((1 - eased) * 3.5).toFixed(2)}px)`;
    });
  };

  updateParagraph(leftLines, -1);
  updateParagraph(rightLines, 1);
}

function render() {
  const heroProgress = sectionProgress(heroSection);
  const movementProgress = sectionProgress(movementSection);
  updateHero(heroProgress);
  updateMovement(movementProgress);
  updateNavBrand(heroProgress, movementProgress);
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  firstName.style.transform = "translate3d(calc(-100% - 32px), -50%, 0)";
  lastName.style.transform = "translate3d(32px, -50%, 0)";
  heroName.style.transform = "translate3d(0, 0, 0) scale(1)";
  heroName.style.opacity = "1";
  heroName.style.filter = "blur(0)";
  setHeroCase("title");
  firstName.style.fontFamily = '"Instrument Serif", serif';
  firstName.style.fontStyle = "normal";
  firstName.style.fontWeight = "400";
  lastName.style.fontFamily = '"Instrument Serif", serif';
  lastName.style.fontStyle = "normal";
  lastName.style.fontWeight = "400";
  allNameLetters.forEach((letter) => {
    letter.style.transform = "translate3d(0, 0, 0) rotate(0deg) scale(1)";
    letter.style.opacity = "1";
    letter.style.filter = "blur(0)";
  });
  movementLines.forEach((line) => {
    line.element.textContent = line.text;
    line.element.classList.remove("typing");
    line.element.style.transform = "translate3d(0, 0, 0)";
    line.element.style.opacity = "1";
    line.element.style.filter = "blur(0)";
  });
  if (navBrand) {
    stopNavBrandTyping();
    navBrandTypingTriggered = true;
    navBrand.textContent = NAV_BRAND_TEXT;
    navBrand.classList.add("visible");
    navBrand.classList.add("is-ready");
    navBrand.classList.remove("typing");
  }
} else {
  let isTicking = false;
  const schedule = () => {
    if (isTicking) return;
    isTicking = true;
    window.requestAnimationFrame(() => {
      render();
      isTicking = false;
    });
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  render();
}
