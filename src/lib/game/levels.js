export const LOGICAL_WIDTH = 800;
export const LOGICAL_HEIGHT = 800;
export const CENTER_X = LOGICAL_WIDTH / 2;
export const CENTER_Y = LOGICAL_HEIGHT / 2;
export const ROAD_WIDTH = 120;
export const LANE_OFFSET = 30;
export const STOP_DISTANCE = 80;

export const LEVELS = [
  { target: 0, spawn: 0, speedMult: 0 },
  { target: 15, spawn: 0.015, speedMult: 0.9 },
  { target: 35, spawn: 0.025, speedMult: 1.1 },
  { target: 65, spawn: 0.035, speedMult: 1.3 },
  { target: 105, spawn: 0.045, speedMult: 1.5 },
  { target: 155, spawn: 0.060, speedMult: 1.7 },
  { target: 215, spawn: 0.080, speedMult: 2.0 },
  { target: 285, spawn: 0.100, speedMult: 2.3 },
  { target: 375, spawn: 0.120, speedMult: 2.7 }
];

export const PHASES = [
  { ns: 'GREEN', ew: 'RED', duration: Infinity },
  { ns: 'YELLOW', ew: 'RED', duration: 60 },
  { ns: 'RED', ew: 'RED', duration: 30 },
  { ns: 'RED', ew: 'GREEN', duration: Infinity },
  { ns: 'RED', ew: 'YELLOW', duration: 60 },
  { ns: 'RED', ew: 'RED', duration: 30 }
];
