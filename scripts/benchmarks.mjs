/**
 * Benchmark data from the Daggerheart SRD and "Making Custom Adversaries" guide.
 * Used to auto-populate stat lines when a tier/role combination is selected.
 */
export const BENCHMARKS = {
  bruiser: {
    1: { difficulty: [12, 14], major: [7, 9], severe: [13, 15], hp: [5, 7], stress: [3, 4], atk: [0, 2], dice: ["1d12+2", "1d10+4", "1d8+6"] },
    2: { difficulty: [14, 16], major: [12, 14], severe: [23, 26], hp: [5, 7], stress: [4, 6], atk: [2, 4], dice: ["2d12+3", "2d10+2", "2d8+6"] },
    3: { difficulty: [16, 18], major: [19, 22], severe: [35, 40], hp: [6, 8], stress: [4, 6], atk: [3, 5], dice: ["3d12+1", "3d10+4", "3d8+8"] },
    4: { difficulty: [18, 20], major: [30, 37], severe: [63, 70], hp: [7, 9], stress: [4, 6], atk: [5, 8], dice: ["4d12+15", "4d10+10", "4d8+12"] },
  },
  horde: {
    1: { difficulty: [10, 12], major: [5, 10], severe: [8, 12], hp: [4, 6], stress: [2, 3], atk: [-2, 0], dice: ["1d10+2", "1d8+3", "1d6+4"] },
    2: { difficulty: [12, 14], major: [10, 15], severe: [16, 20], hp: [5, 6], stress: [2, 3], atk: [-1, 1], dice: ["2d10+2", "2d8+6", "2d6+3"] },
    3: { difficulty: [14, 16], major: [15, 25], severe: [26, 32], hp: [6, 7], stress: [3, 4], atk: [0, 2], dice: ["3d10+2", "3d8+4", "3d6+6"] },
    4: { difficulty: [16, 18], major: [20, 30], severe: [35, 45], hp: [7, 8], stress: [4, 5], atk: [1, 3], dice: ["4d10+4", "4d8+8", "4d6+10"] },
  },
  leader: {
    1: { difficulty: [12, 14], major: [7, 9], severe: [13, 15], hp: [5, 7], stress: [3, 4], atk: [2, 4], dice: ["1d12+1", "1d10+3", "1d8+5"] },
    2: { difficulty: [14, 16], major: [12, 14], severe: [23, 26], hp: [5, 7], stress: [4, 5], atk: [3, 5], dice: ["2d12+1", "2d10+3", "2d8+6"] },
    3: { difficulty: [17, 19], major: [19, 22], severe: [35, 40], hp: [6, 8], stress: [5, 6], atk: [5, 7], dice: ["3d10+1", "3d8+8"] },
    4: { difficulty: [19, 21], major: [30, 37], severe: [63, 70], hp: [7, 9], stress: [6, 8], atk: [8, 10], dice: ["4d12+6", "4d10+8", "4d8+10"] },
  },
  minion: {
    1: { difficulty: [9, 11], major: null, severe: null, hp: [1, 1], stress: [1, 1], atk: [-2, 0], dice: ["1d4+1", "1d6", "2 phy"] },
    2: { difficulty: [12, 13], major: null, severe: null, hp: [1, 1], stress: [1, 1], atk: [-1, 1], dice: ["1d6+1", "1d8", "4 phy"] },
    3: { difficulty: [15, 17], major: null, severe: null, hp: [1, 1], stress: [1, 2], atk: [1, 3], dice: ["1d10+1", "1d8+2", "6 phy"] },
    4: { difficulty: [17, 19], major: null, severe: null, hp: [1, 1], stress: [1, 2], atk: [2, 4], dice: ["1d12+2", "1d10+4", "10 phy"] },
  },
  ranged: {
    1: { difficulty: [11, 13], major: [4, 7], severe: [8, 12], hp: [3, 5], stress: [2, 3], atk: [-1, 1], dice: ["1d10+2", "1d8+4", "1d6+3"] },
    2: { difficulty: [13, 15], major: [7, 10], severe: [16, 20], hp: [3, 5], stress: [3, 4], atk: [0, 2], dice: ["2d10+2", "2d8+3", "2d6+4"] },
    3: { difficulty: [15, 17], major: [15, 20], severe: [26, 32], hp: [4, 6], stress: [4, 5], atk: [2, 4], dice: ["3d10+2", "3d8+4", "3d6+6"] },
    4: { difficulty: [17, 19], major: [20, 30], severe: [35, 45], hp: [5, 7], stress: [4, 6], atk: [3, 5], dice: ["4d10+4", "4d8+6", "4d6+10"] },
  },
  skulk: {
    1: { difficulty: [10, 12], major: [5, 7], severe: [8, 12], hp: [3, 4], stress: [2, 3], atk: [1, 2], dice: ["1d8+3", "1d6+2", "1d4+4"] },
    2: { difficulty: [12, 14], major: [7, 9], severe: [16, 20], hp: [3, 5], stress: [3, 4], atk: [2, 5], dice: ["2d8+3", "2d6+3", "2d4+6"] },
    3: { difficulty: [14, 16], major: [15, 20], severe: [27, 32], hp: [4, 6], stress: [4, 5], atk: [3, 7], dice: ["3d8+4", "3d6+5", "3d4+10"] },
    4: { difficulty: [16, 18], major: [20, 30], severe: [35, 45], hp: [4, 6], stress: [4, 6], atk: [4, 8], dice: ["4d12+10", "4d10+4", "4d6+10"] },
  },
  solo: {
    1: { difficulty: [12, 14], major: [7, 9], severe: [13, 15], hp: [8, 10], stress: [3, 4], atk: [3, 3], dice: ["1d20", "1d12+2", "1d10+4"] },
    2: { difficulty: [14, 16], major: [12, 14], severe: [23, 26], hp: [8, 10], stress: [4, 5], atk: [3, 4], dice: ["2d20+3", "2d10+2", "2d8+6"] },
    3: { difficulty: [17, 19], major: [19, 22], severe: [35, 40], hp: [10, 12], stress: [5, 6], atk: [4, 7], dice: ["3d20", "3d12+6", "3d10+8"] },
    4: { difficulty: [19, 21], major: [30, 37], severe: [63, 70], hp: [10, 12], stress: [6, 8], atk: [7, 10], dice: ["4d12+15", "4d10+10", "4d8+12"] },
  },
  standard: {
    1: { difficulty: [11, 13], major: [4, 7], severe: [8, 12], hp: [3, 5], stress: [2, 3], atk: [0, 2], dice: ["1d10+2", "1d8+3", "1d6+4"] },
    2: { difficulty: [13, 15], major: [7, 10], severe: [16, 20], hp: [3, 5], stress: [2, 3], atk: [1, 3], dice: ["2d10+2", "2d8+3", "2d6+4"] },
    3: { difficulty: [15, 17], major: [14, 22], severe: [31, 35], hp: [4, 6], stress: [3, 4], atk: [2, 4], dice: ["3d10+2", "3d8+4", "3d6+6"] },
    4: { difficulty: [17, 19], major: [24, 32], severe: [46, 50], hp: [4, 6], stress: [4, 5], atk: [3, 5], dice: ["4d10+4", "4d8+6", "4d6+8"] },
  },
  social: {
    1: { difficulty: [11, 13], major: [4, 7], severe: [8, 12], hp: [3, 4], stress: [2, 3], atk: [-4, -2], dice: ["1d6+1", "1d4+2"] },
    2: { difficulty: [12, 14], major: [7, 10], severe: [13, 18], hp: [3, 4], stress: [3, 4], atk: [-3, -1], dice: ["1d8+1", "1d6+2"] },
    3: { difficulty: [14, 16], major: [10, 15], severe: [20, 25], hp: [3, 5], stress: [4, 5], atk: [-2, 0], dice: ["1d10+2", "1d8+3"] },
    4: { difficulty: [16, 18], major: [15, 20], severe: [25, 35], hp: [4, 5], stress: [4, 5], atk: [-1, 1], dice: ["2d8+1", "1d10+3"] },
  },
  support: {
    1: { difficulty: [11, 13], major: [4, 7], severe: [8, 12], hp: [3, 5], stress: [2, 4], atk: [0, 2], dice: ["1d8+2", "1d6+3", "1d4+4"] },
    2: { difficulty: [13, 15], major: [7, 10], severe: [16, 20], hp: [4, 6], stress: [3, 5], atk: [1, 3], dice: ["2d8+2", "2d6+3", "2d4+3"] },
    3: { difficulty: [15, 17], major: [14, 22], severe: [28, 32], hp: [4, 5], stress: [4, 5], atk: [2, 4], dice: ["3d6+3", "3d4+6"] },
    4: { difficulty: [17, 19], major: [22, 30], severe: [38, 42], hp: [5, 6], stress: [5, 6], atk: [3, 5], dice: ["4d6+4", "3d8+4"] },
  },
};

export const ROLES = [
  "bruiser", "horde", "leader", "minion", "ranged", "skulk", "solo", "standard", "social", "support"
];

export const RANGES = ["melee", "very close", "close", "far"];

export function mid(range) {
  if (!range) return 0;
  return Math.round((range[0] + range[1]) / 2);
}

export function rangeStr(range) {
  if (!range) return "N/A";
  return `${range[0]}–${range[1]}`;
}
