export function drawCar(ctx, car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  if (car.dir === 'W') ctx.rotate(Math.PI);
  else if (car.dir === 'S') ctx.rotate(Math.PI / 2);
  else if (car.dir === 'N') ctx.rotate(-Math.PI / 2);

  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-car.length / 2 + 2, -car.breadth / 2 + 5, car.length, car.breadth);

  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.roundRect(-car.length / 2, -car.breadth / 2, car.length, car.breadth, 4);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath(); ctx.roundRect(-car.length / 2 + car.length * 0.6, -car.breadth / 2 + 2, car.length * 0.25, car.breadth - 4, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(-car.length / 2 + car.length * 0.1, -car.breadth / 2 + 2, car.length * 0.15, car.breadth - 4, 1); ctx.fill();

  ctx.fillStyle = '#fef08a';
  ctx.fillRect(car.length / 2 - 2, -car.breadth / 2 + 2, 2, 4);
  ctx.fillRect(car.length / 2 - 2, car.breadth / 2 - 6, 2, 4);

  ctx.fillStyle = (car.speed < car.maxSpeed * 0.8 && car.speed > 0) || car.speed === 0 ? '#ff0000' : '#7f1d1d';
  ctx.fillRect(-car.length / 2, -car.breadth / 2 + 2, 2, 4);
  ctx.fillRect(-car.length / 2, car.breadth / 2 - 6, 2, 4);

  ctx.restore();
}
