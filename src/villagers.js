// Villagers standing around camp: idle bob and blink, plus a '!' or '?' bubble over their head.
import * as THREE from 'three';
import { NPCS } from './quests.js';

export class Villagers {
  constructor(scene, world, lib) {
    this.lib = lib;
    this.list = [];
    const sg = new THREE.PlaneGeometry(0.9, 0.55);
    sg.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: lib.shadow, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    });
    for (const [id, n] of Object.entries(NPCS)) {
      const art = lib.villagers[id];
      const mat = new THREE.SpriteMaterial({ map: art.frames[0], alphaTest: 0.5 });
      world.tintMats.push(mat); // darkens with the night like the rest of the world
      const s = new THREE.Sprite(mat);
      const h = art.w * art.aspect;
      s.scale.set(art.w, h, 1);
      s.center.set(0.5, 0.03);
      const y = world.heightAt(n.x, n.z);
      s.position.set(n.x, y, n.z);
      s.renderOrder = 2;
      const shadow = new THREE.Mesh(sg, shadowMat);
      shadow.position.set(n.x, y + 0.03, n.z);
      const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: lib.marks.offer, alphaTest: 0.5 }));
      mark.scale.set(0.5, 0.56, 1);
      mark.center.set(0.5, 0);
      mark.renderOrder = 3;
      mark.visible = false;
      scene.add(s, shadow, mark);
      world.addSolid(n.x, n.z, 0.35);
      this.list.push({ id, x: n.x, z: n.z, y, h, art, mat, s, mark, t: Math.random() * 6, blink: 1 + Math.random() * 3 });
    }
  }

  // kind per villager id: 'offer' | 'ready' | null
  setMarks(kindOf) {
    for (const v of this.list) {
      const k = kindOf(v.id);
      v.mark.visible = !!k;
      if (k) v.mark.material.map = this.lib.marks[k];
    }
  }

  update(dt) {
    for (const v of this.list) {
      v.t += dt;
      v.blink -= dt;
      if (v.blink < -0.12) v.blink = 2 + Math.random() * 3;
      const tex = v.art.frames[v.blink < 0 ? 1 : 0];
      if (v.mat.map !== tex) v.mat.map = tex;
      v.s.scale.y = v.h * (1 + Math.sin(v.t * 2.2) * 0.015);
      v.mark.position.set(v.x, v.y + v.h + 0.12 + Math.sin(v.t * 3) * 0.06, v.z);
    }
  }
}
