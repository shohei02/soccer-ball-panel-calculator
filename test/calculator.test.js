const assert = require("node:assert/strict");

const {
  calculateDimensions,
  THICKNESS_STATUS
} = require("../js/calculator.js");

const TOLERANCE = 1e-9;
const EXPECTED_MINIMUM_THICKNESS = 9.896456552852264;
const EXPECTED_MAXIMUM_THICKNESS = 113.3641971114256;

function assertApproximatelyEqual(actual, expected, message) {
  const difference = Math.abs(actual - expected);
  assert.ok(
    difference <= TOLERANCE,
    `${message}: expected ${expected}, received ${actual}`
  );
}

function testRepresentativeDimensions() {
  const result = calculateDimensions(50);

  assertApproximatelyEqual(
    result.pentagon.diagonal,
    80.90169943749474,
    "正五角形の対角線"
  );
  assertApproximatelyEqual(
    result.pentagon.circumradius,
    42.53254041760199,
    "正五角形の外接円半径"
  );
  assertApproximatelyEqual(result.hexagon.side, 50, "正六角形の一辺");
  assertApproximatelyEqual(
    result.hexagon.shortDiagonal,
    86.60254037844386,
    "正六角形の短い対角線"
  );
  assertApproximatelyEqual(
    result.hexagon.longDiagonal,
    100,
    "正六角形の長い対角線"
  );
  assertApproximatelyEqual(
    result.hexagon.circumradius,
    50,
    "正六角形の外接円半径"
  );
  assertApproximatelyEqual(
    result.sphere.assembledDiameter,
    247.80186590676158,
    "組立時の最大外径"
  );
  assertApproximatelyEqual(
    result.sphere.maximumDiameter,
    226.7283942228512,
    "削り出せる最大球径"
  );
  assertApproximatelyEqual(
    result.minimumThickness,
    EXPECTED_MINIMUM_THICKNESS,
    "最大球径まで削るための最低板厚"
  );
  assertApproximatelyEqual(
    result.maximumThickness,
    EXPECTED_MAXIMUM_THICKNESS,
    "板厚上限"
  );
}

function testCutbacks() {
  const result = calculateDimensions(50, 10);

  assertApproximatelyEqual(
    result.pentagon.cutback,
    2.9568599940788918,
    "正五角形の削り込み量"
  );
  assertApproximatelyEqual(
    result.hexagon.cutback,
    3.819660112501051,
    "正六角形の削り込み量"
  );
}

function testThicknessStatuses() {
  assert.equal(
    calculateDimensions(50, EXPECTED_MINIMUM_THICKNESS - 0.001)
      .thicknessStatus,
    THICKNESS_STATUS.INSUFFICIENT,
    "最低板厚未満は板厚不足になる"
  );
  assert.equal(
    calculateDimensions(50, EXPECTED_MINIMUM_THICKNESS).thicknessStatus,
    THICKNESS_STATUS.CAUTION,
    "最低板厚付近は注意になる"
  );
  assert.equal(
    calculateDimensions(50, EXPECTED_MINIMUM_THICKNESS + 10 - 0.001)
      .thicknessStatus,
    THICKNESS_STATUS.CAUTION,
    "最薄部が10 mm未満なら注意になる"
  );
  assert.equal(
    calculateDimensions(50, EXPECTED_MINIMUM_THICKNESS + 10)
      .thicknessStatus,
    THICKNESS_STATUS.SAFE,
    "最薄部が10 mm以上なら余裕ありになる"
  );
  assert.notEqual(
    calculateDimensions(50, EXPECTED_MAXIMUM_THICKNESS - 0.001)
      .thicknessStatus,
    THICKNESS_STATUS.TOO_THICK,
    "板厚上限未満は上限超過にならない"
  );
  assert.equal(
    calculateDimensions(50, EXPECTED_MAXIMUM_THICKNESS).thicknessStatus,
    THICKNESS_STATUS.TOO_THICK,
    "板厚上限では加工不可になる"
  );
  assert.equal(
    calculateDimensions(50, EXPECTED_MAXIMUM_THICKNESS + 1)
      .thicknessStatus,
    THICKNESS_STATUS.TOO_THICK,
    "板厚上限を超えると加工不可になる"
  );
  assert.equal(
    calculateDimensions(50).thicknessStatus,
    THICKNESS_STATUS.NOT_PROVIDED,
    "板厚未入力では判定しない"
  );
}

testRepresentativeDimensions();
testCutbacks();
testThicknessStatuses();

console.log("All calculator tests passed.");
