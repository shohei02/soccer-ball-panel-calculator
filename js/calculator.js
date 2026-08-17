const SQRT5 = Math.sqrt(5);
const COMPARISON_EPSILON = 1e-9;

// 最薄部がこの値以上なら、加工時の余裕がある目安として扱う。
const SAFE_REMAINING_THICKNESS_MM = 10;

// 辺長1の切頂二十面体における、中心から各面・頂点までの距離
const PENTAGON_FACE_DISTANCE_FACTOR =
  0.5 * Math.sqrt((125 + 41 * SQRT5) / 10);
const HEXAGON_FACE_DISTANCE_FACTOR =
  0.5 * Math.sqrt(1.5 * (7 + 3 * SQRT5));
const VERTEX_RADIUS_FACTOR =
  0.25 * Math.sqrt(58 + 18 * SQRT5);

// 平面の正多角形を墨付けするための比率
const PHI = (1 + SQRT5) / 2;
const PENTAGON_CIRCUMRADIUS_FACTOR =
  1 / (2 * Math.sin(Math.PI / 5));
const HEXAGON_SHORT_DIAGONAL_FACTOR = Math.sqrt(3);
const HEXAGON_LONG_DIAGONAL_FACTOR = 2;

// 側面を中心へ向けるときの「板厚 → 裏面の削り込み量」の比率
// 五角形: tan(傾斜角) = (9 + √5) / 38
// 六角形: tan(傾斜角) = (3 - √5) / 2
const PENTAGON_CUTBACK_FACTOR = (9 + SQRT5) / 38;
const HEXAGON_CUTBACK_FACTOR = (3 - SQRT5) / 2;

const PENTAGON_BEVEL_ANGLE_DEG =
  Math.atan(PENTAGON_CUTBACK_FACTOR) * 180 / Math.PI;
const HEXAGON_BEVEL_ANGLE_DEG =
  Math.atan(HEXAGON_CUTBACK_FACTOR) * 180 / Math.PI;

// 最大球径まで削るために必要な最小板厚 / 一辺
// 最も厳しい五角形の頂点側を基準にする。
const MIN_THICKNESS_FACTOR =
  PENTAGON_FACE_DISTANCE_FACTOR *
  (1 - HEXAGON_FACE_DISTANCE_FACTOR / VERTEX_RADIUS_FACTOR);

const THICKNESS_STATUS = {
  NOT_PROVIDED: "notProvided",
  TOO_THICK: "tooThick",
  INSUFFICIENT: "insufficient",
  CAUTION: "caution",
  SAFE: "safe"
};

function getThicknessStatus(thickness, minimumThickness, maximumThickness) {
  if (thickness === null) {
    return THICKNESS_STATUS.NOT_PROVIDED;
  }

  if (thickness >= maximumThickness - COMPARISON_EPSILON) {
    return THICKNESS_STATUS.TOO_THICK;
  }

  const remainingThickness = thickness - minimumThickness;

  if (remainingThickness < -COMPARISON_EPSILON) {
    return THICKNESS_STATUS.INSUFFICIENT;
  }

  if (
    remainingThickness <
    SAFE_REMAINING_THICKNESS_MM - COMPARISON_EPSILON
  ) {
    return THICKNESS_STATUS.CAUTION;
  }

  return THICKNESS_STATUS.SAFE;
}

// sideは正の有限値、thicknessはnullまたは0以上の有限値を前提とする。
// 入力値の検証はUI側で行う。
function calculateDimensions(side, thickness = null) {
  const hexagonFaceDistance =
    HEXAGON_FACE_DISTANCE_FACTOR * side;
  const vertexRadius = VERTEX_RADIUS_FACTOR * side;
  const minimumThickness = MIN_THICKNESS_FACTOR * side;
  const maximumThickness = hexagonFaceDistance;
  const remainingThickness =
    thickness === null ? null : thickness - minimumThickness;

  return {
    pentagon: {
      side,
      diagonal: side * PHI,
      circumradius: side * PENTAGON_CIRCUMRADIUS_FACTOR,
      cutback:
        thickness === null ? null : thickness * PENTAGON_CUTBACK_FACTOR,
      bevelAngleDeg: PENTAGON_BEVEL_ANGLE_DEG
    },
    hexagon: {
      side,
      shortDiagonal: side * HEXAGON_SHORT_DIAGONAL_FACTOR,
      longDiagonal: side * HEXAGON_LONG_DIAGONAL_FACTOR,
      circumradius: side,
      cutback:
        thickness === null ? null : thickness * HEXAGON_CUTBACK_FACTOR,
      bevelAngleDeg: HEXAGON_BEVEL_ANGLE_DEG
    },
    sphere: {
      assembledDiameter: 2 * vertexRadius,
      maximumDiameter: 2 * hexagonFaceDistance
    },
    minimumThickness,
    maximumThickness,
    remainingThickness,
    thicknessStatus: getThicknessStatus(
      thickness,
      minimumThickness,
      maximumThickness
    )
  };
}

function initializeCalculator() {
  const sideInput = document.getElementById("side");
  const thicknessInput = document.getElementById("thickness");
  const errorBox = document.getElementById("error");

  const elements = {
    diameter: document.getElementById("diameter"),
    sphereDiameter: document.getElementById("sphereDiameter"),
    thicknessRequirement: document.getElementById("thicknessRequirement"),
    thicknessStatus: document.getElementById("thicknessStatus"),
    p5Outer: document.getElementById("p5Outer"),
    p5Angle: document.getElementById("p5Angle"),
    p5Cutback: document.getElementById("p5Cutback"),
    p6Outer: document.getElementById("p6Outer"),
    p6Angle: document.getElementById("p6Angle"),
    p6Cutback: document.getElementById("p6Cutback"),
    markP5Side: document.getElementById("markP5Side"),
    markP5Diagonal: document.getElementById("markP5Diagonal"),
    markP5Circumradius: document.getElementById("markP5Circumradius"),
    markP6Side: document.getElementById("markP6Side"),
    markP6Circumradius: document.getElementById("markP6Circumradius"),
    markP6ShortDiagonal: document.getElementById("markP6ShortDiagonal"),
    markP6LongDiagonal: document.getElementById("markP6LongDiagonal")
  };

  function formatNumber(value, digits = 2) {
    return value.toLocaleString("ja-JP", {
      maximumFractionDigits: digits
    });
  }

  function formatMillimeters(value) {
    return `${formatNumber(value)} mm`;
  }

  function hideError() {
    errorBox.textContent = "";
    errorBox.hidden = true;
  }

  function showError(message, input) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    input.setAttribute("aria-invalid", "true");
  }

  function resetResults() {
    elements.diameter.textContent = "—";
    elements.sphereDiameter.textContent = "—";
    elements.thicknessRequirement.textContent =
      "最大球径まで削るための必要板厚：一辺を入力";
    elements.thicknessStatus.textContent = "—";
    elements.p5Outer.textContent = "—";
    elements.p5Angle.textContent = "—";
    elements.p6Outer.textContent = "—";
    elements.p6Angle.textContent = "—";
    elements.p5Cutback.textContent = "板厚を入力";
    elements.p6Cutback.textContent = "板厚を入力";
    elements.markP5Side.textContent = "—";
    elements.markP5Diagonal.textContent = "—";
    elements.markP5Circumradius.textContent = "—";
    elements.markP6Side.textContent = "—";
    elements.markP6Circumradius.textContent = "—";
    elements.markP6ShortDiagonal.textContent = "—";
    elements.markP6LongDiagonal.textContent = "—";
  }

  function renderDimensions(result) {
    elements.markP5Side.textContent =
      formatMillimeters(result.pentagon.side);
    elements.markP5Diagonal.textContent =
      formatMillimeters(result.pentagon.diagonal);
    elements.markP5Circumradius.textContent =
      formatMillimeters(result.pentagon.circumradius);

    elements.markP6Side.textContent =
      formatMillimeters(result.hexagon.side);
    elements.markP6Circumradius.textContent =
      formatMillimeters(result.hexagon.circumradius);
    elements.markP6ShortDiagonal.textContent =
      formatMillimeters(result.hexagon.shortDiagonal);
    elements.markP6LongDiagonal.textContent =
      formatMillimeters(result.hexagon.longDiagonal);

    elements.p5Outer.textContent =
      formatMillimeters(result.pentagon.side);
    elements.p6Outer.textContent =
      formatMillimeters(result.hexagon.side);
    elements.p5Angle.textContent =
      `${formatNumber(result.pentagon.bevelAngleDeg, 4)}°`;
    elements.p6Angle.textContent =
      `${formatNumber(result.hexagon.bevelAngleDeg, 4)}°`;

    elements.diameter.textContent =
      formatMillimeters(result.sphere.assembledDiameter);
    elements.sphereDiameter.textContent =
      formatMillimeters(result.sphere.maximumDiameter);
    elements.thicknessRequirement.textContent =
      `最大球径まで削るには ${formatMillimeters(result.minimumThickness)} 以上必要。`;

    renderThickness(result);
  }

  function renderThickness(result) {
    if (result.thicknessStatus === THICKNESS_STATUS.NOT_PROVIDED) {
      elements.p5Cutback.textContent = "板厚を入力";
      elements.p6Cutback.textContent = "板厚を入力";
      elements.thicknessStatus.textContent = "—";
      return;
    }

    if (result.thicknessStatus === THICKNESS_STATUS.TOO_THICK) {
      elements.p5Cutback.textContent = "—";
      elements.p6Cutback.textContent = "—";
      elements.thicknessStatus.textContent =
        `❌ 板厚が大きすぎる：${formatMillimeters(result.maximumThickness)} 未満にする必要がある。`;
      return;
    }

    elements.p5Cutback.textContent =
      formatMillimeters(result.pentagon.cutback);
    elements.p6Cutback.textContent =
      formatMillimeters(result.hexagon.cutback);

    if (result.thicknessStatus === THICKNESS_STATUS.INSUFFICIENT) {
      elements.thicknessStatus.textContent =
        "❌ 板厚不足：最大球径まで削ると板材を削り抜ける。";
    } else if (result.thicknessStatus === THICKNESS_STATUS.CAUTION) {
      elements.thicknessStatus.textContent =
        `⚠️ 注意：最薄部は ${formatMillimeters(Math.max(0, result.remainingThickness))}。`;
    } else {
      elements.thicknessStatus.textContent =
        `✅ 余裕あり：最薄部は ${formatMillimeters(result.remainingThickness)}。`;
    }
  }

  function updateCalculator() {
    const sideText = sideInput.value.trim();
    const thicknessText = thicknessInput.value.trim();

    hideError();
    sideInput.setAttribute("aria-invalid", "false");
    thicknessInput.setAttribute("aria-invalid", "false");

    if (sideText === "") {
      resetResults();
      return;
    }

    const side = Number(sideText);

    if (!Number.isFinite(side) || side <= 0) {
      resetResults();
      showError(
        "一辺は 0 より大きい数値を入力してください。",
        sideInput
      );
      return;
    }

    const thickness = thicknessText === "" ? null : Number(thicknessText);

    if (
      thickness !== null &&
      (!Number.isFinite(thickness) || thickness < 0)
    ) {
      renderDimensions(calculateDimensions(side));
      elements.p5Cutback.textContent = "—";
      elements.p6Cutback.textContent = "—";
      elements.thicknessStatus.textContent = "—";
      showError(
        "板厚は 0 以上の数値を入力してください。",
        thicknessInput
      );
      return;
    }

    renderDimensions(calculateDimensions(side, thickness));
  }

  sideInput.addEventListener("input", updateCalculator);
  thicknessInput.addEventListener("input", updateCalculator);

  hideError();
  resetResults();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    calculateDimensions,
    THICKNESS_STATUS,
    COMPARISON_EPSILON,
    SAFE_REMAINING_THICKNESS_MM
  };
}

if (typeof document !== "undefined") {
  initializeCalculator();
}
