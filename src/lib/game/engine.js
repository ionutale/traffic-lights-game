import { LOGICAL_WIDTH, LOGICAL_HEIGHT, CENTER_X, CENTER_Y, ROAD_WIDTH, LANE_OFFSET, STOP_DISTANCE, LEVELS, PHASES } from './levels.js';
import { playScreechSound, playScoreSound } from './audio.js';

export class Car {
  constructor(dir, speedMult) {
    this.dir = dir;
    this.length = 45;
    this.breadth = 22;
    this.maxSpeed = speedMult * (3.5 + Math.random() * 1.5);
    this.speed = this.maxSpeed;
    this.acceleration = 0.1 * (speedMult > 1 ? speedMult * 0.8 : 1);
    this.color = this.getRandomColor();
    this.passedStopLine = false;
    this.decidedToRunYellow = false;
    this.screechCooldown = 0;

    if (dir === 'E') {
      this.x = -this.length; this.y = CENTER_Y + LANE_OFFSET;
    } else if (dir === 'W') {
      this.x = LOGICAL_WIDTH + this.length; this.y = CENTER_Y - LANE_OFFSET;
    } else if (dir === 'S') {
      this.x = CENTER_X - LANE_OFFSET; this.y = -this.length;
    } else if (dir === 'N') {
      this.x = CENTER_X + LANE_OFFSET; this.y = LOGICAL_HEIGHT + this.length;
    }
    const drift = (Math.random() * 8 - 4);
    if (dir === 'E' || dir === 'W') this.y += drift;
    else this.x += drift;
  }

  getRandomColor() {
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f8fafc', '#1e293b'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  update(leaderCar, currentPhase) {
    let targetSpeed = this.maxSpeed;
    let obstacleDist = Infinity;
    const forwardSign = (this.dir === 'E' || this.dir === 'S') ? 1 : -1;
    const axis = (this.dir === 'E' || this.dir === 'W') ? 'x' : 'y';
    const frontPos = this[axis] + forwardSign * (this.length / 2);
    const stopLinePos = (axis === 'x' ? CENTER_X : CENTER_Y) - forwardSign * STOP_DISTANCE;
    const distToStop = (stopLinePos - frontPos) * forwardSign;
    const safeDistance = 18;
    const slowdownDistance = 120 * (this.maxSpeed / 3.5);

    const lightState = (this.dir === 'N' || this.dir === 'S') ? PHASES[currentPhase].ns : PHASES[currentPhase].ew;

    if (!this.passedStopLine) {
      if (distToStop < 0) {
        this.passedStopLine = true;
      } else {
        let forceStop = false;
        if (lightState !== 'GREEN') {
          if (lightState === 'YELLOW') {
            const noReturnDist = 50 * (this.maxSpeed / 3.5);
            if (this.decidedToRunYellow || (distToStop < noReturnDist && this.speed > 2.0)) {
              this.decidedToRunYellow = true;
            } else {
              forceStop = true;
            }
          } else if (lightState === 'RED') {
            forceStop = true;
            this.decidedToRunYellow = false;
          }
        }
        if (forceStop) obstacleDist = Math.min(obstacleDist, distToStop);
      }
    }

    if (leaderCar) {
      const leaderRearPos = leaderCar[axis] - forwardSign * (leaderCar.length / 2);
      const distToLeader = (leaderRearPos - frontPos) * forwardSign;
      if (distToLeader > 0) obstacleDist = Math.min(obstacleDist, distToLeader);
      else if (distToLeader > -this.length) obstacleDist = 0;
    }

    if (obstacleDist <= safeDistance) {
      targetSpeed = 0;
    } else if (obstacleDist < slowdownDistance) {
      let speedRatio = (obstacleDist - safeDistance) / (slowdownDistance - safeDistance);
      targetSpeed = this.maxSpeed * (speedRatio * speedRatio);
    }

    const oldSpeed = this.speed;

    if (this.speed < targetSpeed) {
      this.speed = Math.min(this.speed + this.acceleration, targetSpeed);
    } else {
      let brakeForce = this.acceleration * 4;
      if (obstacleDist < safeDistance * 2) brakeForce = this.acceleration * 8;
      this.speed = Math.max(this.speed - brakeForce, targetSpeed);
    }

    if (obstacleDist !== Infinity) {
      const minGap = 4;
      if (obstacleDist - minGap < this.speed) {
        this.speed = Math.max(0, obstacleDist - minGap);
      }
    }

    if (this.speed < 0) this.speed = 0;

    if (this.screechCooldown > 0) this.screechCooldown--;
    if (oldSpeed - this.speed > this.acceleration * 6 && this.screechCooldown <= 0) {
      playScreechSound(oldSpeed - this.speed);
      this.screechCooldown = 30;
    }

    this[axis] += this.speed * forwardSign;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.dir === 'W') ctx.rotate(Math.PI);
    else if (this.dir === 'S') ctx.rotate(Math.PI / 2);
    else if (this.dir === 'N') ctx.rotate(-Math.PI / 2);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-this.length / 2 + 2, -this.breadth / 2 + 5, this.length, this.breadth);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.roundRect(-this.length / 2, -this.breadth / 2, this.length, this.breadth, 4);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.roundRect(-this.length / 2 + this.length * 0.6, -this.breadth / 2 + 2, this.length * 0.25, this.breadth - 4, 2); ctx.fill();
    ctx.beginPath(); ctx.roundRect(-this.length / 2 + this.length * 0.1, -this.breadth / 2 + 2, this.length * 0.15, this.breadth - 4, 1); ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.fillRect(this.length / 2 - 2, -this.breadth / 2 + 2, 2, 4);
    ctx.fillRect(this.length / 2 - 2, this.breadth / 2 - 6, 2, 4);

    ctx.fillStyle = (this.speed < this.maxSpeed * 0.8 && this.speed > 0) || this.speed === 0 ? '#ff0000' : '#7f1d1d';
    ctx.fillRect(-this.length / 2, -this.breadth / 2 + 2, 2, 4);
    ctx.fillRect(-this.length / 2, this.breadth / 2 - 6, 2, 4);

    ctx.restore();
  }
}

export function createGameEngine() {
  return {
    cars: { N: [], S: [], E: [], W: [] },
    currentPhase: 0,
    lightTimer: 0,
    crashPoint: null,
    currentLevel: 1,
    score: 0,
    gameState: 'START',

    getState() {
      return {
        score: this.score,
        currentLevel: this.currentLevel,
        gameState: this.gameState,
        crashPoint: this.crashPoint
      };
    },

    requestLightSwap() {
      if (this.gameState !== 'PLAYING') return false;
      if (this.currentPhase === 0) {
        this.currentPhase = 1;
        this.lightTimer = 0;
        return true;
      } else if (this.currentPhase === 3) {
        this.currentPhase = 4;
        this.lightTimer = 0;
        return true;
      }
      return false;
    },

    initLevel(level) {
      this.cars = { N: [], S: [], E: [], W: [] };
      this.currentPhase = 0;
      this.lightTimer = 0;
      this.crashPoint = null;
      this.currentLevel = level;
      this.gameState = 'PLAYING';
    },

    restart() {
      this.score = 0;
      this.currentLevel = 1;
      this.initLevel(1);
    },

    getCarRect(car) {
      let w, h;
      if (car.dir === 'N' || car.dir === 'S') { w = car.breadth; h = car.length; }
      else { w = car.length; h = car.breadth; }
      return {
        left: car.x - w / 2 + 2, right: car.x + w / 2 - 2,
        top: car.y - h / 2 + 2, bottom: car.y + h / 2 - 2
      };
    },

    checkCollisions() {
      let nsCars = [...this.cars.N, ...this.cars.S];
      let ewCars = [...this.cars.E, ...this.cars.W];
      for (let c1 of nsCars) {
        let r1 = this.getCarRect(c1);
        for (let c2 of ewCars) {
          let r2 = this.getCarRect(c2);
          if (!(r2.left > r1.right || r2.right < r1.left || r2.top > r1.bottom || r2.bottom < r1.top)) {
            return { x: (c1.x + c2.x) / 2, y: (c1.y + c2.y) / 2 };
          }
        }
      }
      return null;
    },

    updateLogic() {
      if (this.gameState !== 'PLAYING') return;

      const lvlData = LEVELS[this.currentLevel];

      if (PHASES[this.currentPhase].duration !== Infinity) {
        this.lightTimer++;
        if (this.lightTimer >= PHASES[this.currentPhase].duration) {
          this.lightTimer = 0;
          this.currentPhase = (this.currentPhase + 1) % PHASES.length;
        }
      }

      ['N', 'S', 'E', 'W'].forEach(dir => {
        if (Math.random() < lvlData.spawn / 4) {
          let canSpawn = true;
          if (this.cars[dir].length > 0) {
            const lastCar = this.cars[dir][this.cars[dir].length - 1];
            let distFromSpawn = 0;
            if (dir === 'E') distFromSpawn = lastCar.x - (-45);
            else if (dir === 'W') distFromSpawn = (LOGICAL_WIDTH + 45) - lastCar.x;
            else if (dir === 'S') distFromSpawn = lastCar.y - (-45);
            else if (dir === 'N') distFromSpawn = (LOGICAL_HEIGHT + 45) - lastCar.y;
            if (distFromSpawn < 120) canSpawn = false;
          }
          if (canSpawn) this.cars[dir].push(new Car(dir, lvlData.speedMult));
        }
      });

      ['N', 'S', 'E', 'W'].forEach(dir => {
        for (let i = 0; i < this.cars[dir].length; i++) {
          const leaderCar = i > 0 ? this.cars[dir][i - 1] : null;
          this.cars[dir][i].update(leaderCar, this.currentPhase);
        }

        if (this.cars[dir].length > 0) {
          const fc = this.cars[dir][0];
          const offScreen = (dir === 'E' && fc.x > LOGICAL_WIDTH + 100) ||
            (dir === 'W' && fc.x < -100) ||
            (dir === 'S' && fc.y > LOGICAL_HEIGHT + 100) ||
            (dir === 'N' && fc.y < -100);
          if (offScreen) {
            this.cars[dir].shift();
            this.score++;
            playScoreSound();
          }
        }
      });

      const crash = this.checkCollisions();
      if (crash) {
        this.crashPoint = crash;
        this.gameState = 'GAME_OVER';
        return;
      }

      if (this.score >= lvlData.target) {
        if (this.currentLevel >= 8) {
          this.gameState = 'VICTORY';
        } else {
          this.currentLevel++;
          this.gameState = 'LEVEL_UP';
        }
      }
    },

    drawScene(ctx, scaleX, scaleY, timestamp) {
      ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      ctx.save();
      ctx.scale(scaleX, scaleY);

      ctx.fillStyle = '#334155';
      ctx.fillRect(CENTER_X - ROAD_WIDTH / 2, 0, ROAD_WIDTH, LOGICAL_HEIGHT);
      ctx.fillRect(0, CENTER_Y - ROAD_WIDTH / 2, LOGICAL_WIDTH, ROAD_WIDTH);
      ctx.fillRect(CENTER_X - ROAD_WIDTH / 2, CENTER_Y - ROAD_WIDTH / 2, ROAD_WIDTH, ROAD_WIDTH);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      const ylOffset = 2;
      ctx.beginPath();
      ctx.moveTo(CENTER_X - ylOffset, 0); ctx.lineTo(CENTER_X - ylOffset, CENTER_Y - ROAD_WIDTH / 2);
      ctx.moveTo(CENTER_X + ylOffset, 0); ctx.lineTo(CENTER_X + ylOffset, CENTER_Y - ROAD_WIDTH / 2);
      ctx.moveTo(CENTER_X - ylOffset, CENTER_Y + ROAD_WIDTH / 2); ctx.lineTo(CENTER_X - ylOffset, LOGICAL_HEIGHT);
      ctx.moveTo(CENTER_X + ylOffset, CENTER_Y + ROAD_WIDTH / 2); ctx.lineTo(CENTER_X + ylOffset, LOGICAL_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, CENTER_Y - ylOffset); ctx.lineTo(CENTER_X - ROAD_WIDTH / 2, CENTER_Y - ylOffset);
      ctx.moveTo(0, CENTER_Y + ylOffset); ctx.lineTo(CENTER_X - ROAD_WIDTH / 2, CENTER_Y + ylOffset);
      ctx.moveTo(CENTER_X + ROAD_WIDTH / 2, CENTER_Y - ylOffset); ctx.lineTo(LOGICAL_WIDTH, CENTER_Y - ylOffset);
      ctx.moveTo(CENTER_X + ROAD_WIDTH / 2, CENTER_Y + ylOffset); ctx.lineTo(LOGICAL_WIDTH, CENTER_Y + ylOffset);
      ctx.stroke();

      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(CENTER_X, CENTER_Y + STOP_DISTANCE); ctx.lineTo(CENTER_X + ROAD_WIDTH / 2, CENTER_Y + STOP_DISTANCE);
      ctx.moveTo(CENTER_X - ROAD_WIDTH / 2, CENTER_Y - STOP_DISTANCE); ctx.lineTo(CENTER_X, CENTER_Y - STOP_DISTANCE);
      ctx.moveTo(CENTER_X - STOP_DISTANCE, CENTER_Y); ctx.lineTo(CENTER_X - STOP_DISTANCE, CENTER_Y + ROAD_WIDTH / 2);
      ctx.moveTo(CENTER_X + STOP_DISTANCE, CENTER_Y - ROAD_WIDTH / 2); ctx.lineTo(CENTER_X + STOP_DISTANCE, CENTER_Y);
      ctx.stroke();

      this.drawCrosswalk(ctx, CENTER_X, CENTER_Y - STOP_DISTANCE - 15, ROAD_WIDTH, 20, false);
      this.drawCrosswalk(ctx, CENTER_X, CENTER_Y + STOP_DISTANCE + 15, ROAD_WIDTH, 20, false);
      this.drawCrosswalk(ctx, CENTER_X - STOP_DISTANCE - 15, CENTER_Y, ROAD_WIDTH, 20, true);
      this.drawCrosswalk(ctx, CENTER_X + STOP_DISTANCE + 15, CENTER_Y, ROAD_WIDTH, 20, true);

      this.drawTrafficLight(ctx, CENTER_X - ROAD_WIDTH / 2 - 25, CENTER_Y - ROAD_WIDTH / 2 - 35, PHASES[this.currentPhase].ns);
      this.drawTrafficLight(ctx, CENTER_X + ROAD_WIDTH / 2 + 25, CENTER_Y + ROAD_WIDTH / 2 + 35, PHASES[this.currentPhase].ns);
      this.drawTrafficLight(ctx, CENTER_X - ROAD_WIDTH / 2 - 35, CENTER_Y + ROAD_WIDTH / 2 + 25, PHASES[this.currentPhase].ew);
      this.drawTrafficLight(ctx, CENTER_X + ROAD_WIDTH / 2 + 35, CENTER_Y - ROAD_WIDTH / 2 - 25, PHASES[this.currentPhase].ew);

      ['N', 'S', 'E', 'W'].forEach(dir => {
        for (let car of this.cars[dir]) car.draw(ctx);
      });

      if (this.crashPoint) {
        ctx.save();
        ctx.translate(this.crashPoint.x, this.crashPoint.y);
        const pulse = Math.sin(timestamp / 100) * 15;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.beginPath(); ctx.arc(0, 0, 50 + pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
        ctx.beginPath(); ctx.arc(0, 0, 30 - pulse * 0.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      ctx.restore();
    },

    drawCrosswalk(ctx, x, y, width, length, isVertical) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const stripes = 8;
      const stripeWidth = width / (stripes * 2);
      ctx.save();
      ctx.translate(x, y);
      for (let i = 0; i < stripes; i++) {
        if (isVertical) ctx.fillRect(-width / 2 + (i * 2 + 0.5) * stripeWidth, -length / 2, stripeWidth, length);
        else ctx.fillRect(-length / 2, -width / 2 + (i * 2 + 0.5) * stripeWidth, length, stripeWidth);
      }
      ctx.restore();
    },

    drawTrafficLight(ctx, x, y, state) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.ellipse(0, 10, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-3, -20, 6, 30);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(-12, -75, 24, 60, 6);
      ctx.fill();
      const drawBulb = (cy, color, isActive) => {
        ctx.beginPath(); ctx.arc(0, cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? color : '#334155'; ctx.fill();
        if (isActive) {
          ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.beginPath(); ctx.arc(-2, cy - 2, 2, 0, Math.PI * 2); ctx.fill();
        }
      };
      drawBulb(-61, '#ef4444', state === 'RED');
      drawBulb(-45, '#eab308', state === 'YELLOW');
      drawBulb(-29, '#22c55e', state === 'GREEN');
      ctx.restore();
    }
  };
}
