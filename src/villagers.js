// The people of the camp and of Steinborg: they turn to face you when you come close, breathe a
// little, and show a '!' or '?' bubble over their head. Each stands on their own map.
import * as THREE from 'three';
import { NPCS } from './quests.js';
import { dirFor, dirFor8 } from './noise.js';

const HEIGHT = 1.38;  // standing height in world units, same as the player
const NOTICE = 4.5;   // turn towards the player within this distance

export class Villagers {
  constructor(scene, world, lib) {
    this.lib = lib;
    this.scene = scene;
    this.world = world;
    this.list = [];
    this.groups = {}; // map id -> group of the people standing there
    this.kindOf = null; // the last setMarks
    const sg = new THREE.PlaneGeometry(0.9, 0.55);
    sg.rotateX(-Math.PI / 2);
    this.sg = sg;
    this.shadowMat = new THREE.MeshBasicMaterial({
      map: lib.shadow, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2,
    });
    // everyone is listed at once (where they stand), but stood on their map, sprite and all, when the
    // map is built (world.js builds a map the first time it is entered)
    for (const [id, n] of Object.entries(NPCS)) this.list.push({ id, map: n.map || 'camp', x: n.x, z: n.z, top: HEIGHT, face: { x: 0, z: 1 }, t: Math.random() * 6 });
    world.onBuild = (map) => this.build(map);
    for (const map of world.built) this.build(map);
  }

  build(map) {
    const { lib, world, sg, shadowMat } = this, where = world.maps[map];
    if (this.groups[map]) return;
    this.groups[map] = new THREE.Group();
    this.groups[map].visible = this.map === map;
    this.scene.add(this.groups[map]);
    for (const v of this.list) {
      if (v.map !== map) continue;
      const n = NPCS[v.id];
      const art = lib.villagers[v.id];
      const mat = new THREE.SpriteMaterial({ map: art.anims.down.idle[0], alphaTest: 0.5 });
      world.tintMats.push(mat); // darkens with the night like the rest of the world
      const s = new THREE.Sprite(mat);
      const upp = HEIGHT / art.body[1];
      const h = art.fh * upp;
      s.scale.set(art.fw * upp, h, 1);
      s.center.set(0.5, art.anchor);
      const y = where.heightAt(n.x, n.z);
      s.position.set(n.x, y, n.z);
      s.renderOrder = 2;
      const shadow = new THREE.Mesh(sg, shadowMat);
      shadow.position.set(n.x, y + 0.03, n.z);
      const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: lib.marks.offer, alphaTest: 0.5 }));
      mark.scale.set(0.5, 0.56, 1);
      mark.center.set(0.5, 0);
      mark.renderOrder = 3;
      mark.visible = false;
      this.groups[map].add(s, shadow, mark);
      let tag = null; // a raid guide wears a RAID tag over their head, always
      if (n.raid) {
        tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: lib.marks.raid, transparent: true, alphaTest: 0.05, depthWrite: false }));
        tag.scale.set(1.2, 0.36, 1);
        tag.center.set(0.5, 0);
        tag.renderOrder = 3;
        tag.position.set(n.x, y + HEIGHT + 0.12, n.z);
        this.groups[map].add(tag);
      }
      where.addSolid(n.x, n.z, 0.35);
      if (n.pet) { // a tame beast sitting by them, that never fights (Bjarki's wolf)
        const pa = lib.mobs[n.pet.art], pm = new THREE.SpriteMaterial({ map: pa.anims.down.idle[0], alphaTest: 0.5 });
        world.tintMats.push(pm);
        const ps = new THREE.Sprite(pm), pu = 0.68 / pa.body[0], px = n.x + n.pet.dx, pz = n.z + n.pet.dz;
        ps.scale.set(pa.fw * pu, pa.fh * pu, 1);
        ps.center.set(0.5, pa.anchor);
        ps.position.set(px, where.heightAt(px, pz), pz);
        ps.renderOrder = 2;
        const pshadow = new THREE.Mesh(sg, shadowMat);
        pshadow.position.set(px, where.heightAt(px, pz) + 0.03, pz);
        this.groups[map].add(ps, pshadow);
        where.addSolid(px, pz, 0.3);
      }
      Object.assign(v, { y, h, art, mat, s, mark, tag });
    }
    if (this.kindOf) this.setMarks(this.kindOf);
  }

  // show the people of one map
  show(map) {
    this.map = map;
    if (map && !this.groups[map]) void this.world.maps[map]; // (building the map stands its people)
    for (const [k, g] of Object.entries(this.groups)) g.visible = k === map;
  }

  // kind per villager id: 'offer' | 'ready' | null
  setMarks(kindOf) {
    this.kindOf = kindOf;
    for (const v of this.list) {
      if (!v.mark) continue; // not stood on their map yet
      const k = kindOf(v.id);
      v.mark.visible = !!k;
      if (k) v.mark.material.map = this.lib.marks[k];
    }
  }

  update(dt, player, cam) {
    for (const v of this.list) {
      if (v.map !== this.map || !v.s) continue;
      v.t += dt;
      const dx = player.x - v.x, dz = player.z - v.z, d = Math.hypot(dx, dz);
      v.face = d < NOTICE && d > 0.01 ? { x: dx / d, z: dz / d } : { x: 0, z: 1 };
      const turn = 'downright' in v.art.anims ? dirFor8 : dirFor;
      const tex = v.art.anims[turn(v.face.x, v.face.z, cam)].idle[0];
      if (v.mat.map !== tex) { v.mat.map = tex; v.s.center.y = tex.userData.anchor; }
      v.s.scale.y = v.h * (1 + Math.sin(v.t * 2.2) * 0.015);
      v.mark.position.set(v.x, v.y + v.top + (v.tag ? 0.55 : 0.15) + Math.sin(v.t * 3) * 0.06, v.z); // a quest mark sits over a RAID tag
    }
  }
}
