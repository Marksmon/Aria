import * as THREE from 'three';

const SPEED = 4.2;     // world units per second
const RADIUS = 0.3;    // collision radius
const WALK_SEQ = [1, 0, 2, 0];

export class Player {
  constructor(scene, world, art, shadowTex) {
    this.world = world;
    this.art = art;
    this.x = 0;
    this.z = 0;
    this.dir = 'down';
    this.moving = false;
    this.animT = 0;

    this.mat = new THREE.SpriteMaterial({ map: art.frames.down[0], alphaTest: 0.5 });
    this.sprite = new THREE.Sprite(this.mat);
    this.sprite.scale.set(art.w, art.w * art.aspect, 1);
    this.sprite.center.set(0.5, 0.03);
    this.sprite.renderOrder = 2;
    scene.add(this.sprite);

    const sg = new THREE.PlaneGeometry(0.9, 0.55);
    sg.rotateX(-Math.PI / 2);
    this.shadow = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({
      map: shadowTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    }));
    scene.add(this.shadow);
  }

  setPos(x, z) {
    if (!this.world.walkable(x, z)) { x = this.world.spawn.x; z = this.world.spawn.z; }
    this.x = x;
    this.z = z;
    this.sync();
  }

  tryMove(dx, dz) {
    const w = this.world;
    const attempt = (tx, tz) => {
      const [rx, rz] = w.resolve(tx, tz, RADIUS);
      if (w.walkable(rx, rz)) { this.x = rx; this.z = rz; return true; }
      return false;
    };
    if (attempt(this.x + dx, this.z + dz)) return;
    if (attempt(this.x + dx, this.z)) return;
    attempt(this.x, this.z + dz);
  }

  // move: {x, z} world-space direction (length 0..1). cam: {fx, fz, rx, rz} camera basis on the ground plane.
  update(dt, move, cam) {
    const mag = Math.hypot(move.x, move.z);
    this.moving = mag > 0.08;
    if (this.moving) {
      this.tryMove(move.x * SPEED * dt, move.z * SPEED * dt);
      // facing relative to the camera so the sprite turns the right way when the view rotates
      const f = move.x * cam.fx + move.z * cam.fz;
      const r = move.x * cam.rx + move.z * cam.rz;
      this.dir = Math.abs(r) > Math.abs(f) * 0.9 ? (r > 0 ? 'right' : 'left') : (f > 0 ? 'up' : 'down');
      this.animT += dt * 9 * Math.min(1, mag + 0.3);
    } else {
      this.animT = 0;
    }
    const frame = this.moving ? WALK_SEQ[Math.floor(this.animT) % 4] : 0;
    const tex = this.art.frames[this.dir][frame];
    if (this.mat.map !== tex) this.mat.map = tex;

    // idle breathing
    const breathe = this.moving ? 1 : 1 + Math.sin(performance.now() / 420) * 0.015;
    this.sprite.scale.y = this.art.w * this.art.aspect * breathe;
    this.sync();
  }

  sync() {
    const y = this.world.heightAt(this.x, this.z);
    this.sprite.position.set(this.x, y, this.z);
    this.shadow.position.set(this.x, y + 0.03, this.z);
  }
}
