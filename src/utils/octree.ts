interface Positional3D {
  position: { x: number; y: number; z: number }
}

export class Octree<T extends Positional3D> {
  boundary: Box<T>
  capacity: number
  entities: T[]
  divided: boolean
  nw?: Octree<T>
  ne?: Octree<T>
  sw?: Octree<T>
  se?: Octree<T>
  nw_z?: Octree<T>
  ne_z?: Octree<T>
  sw_z?: Octree<T>
  se_z?: Octree<T>

  constructor(boundary: Box<T>, capacity: number) {
    this.boundary = boundary
    this.capacity = capacity
    this.entities = []
    this.divided = false
  }

  subdivide() {
    const x = this.boundary.x
    const y = this.boundary.y
    const z = this.boundary.z
    const w = this.boundary.w / 2
    const h = this.boundary.h / 2
    const d = this.boundary.d / 2
    this.nw = new Octree<T>(new Box(x - w, y - h, z - d, w, h, d), this.capacity)
    this.ne = new Octree<T>(new Box(x + w, y - h, z - d, w, h, d), this.capacity)
    this.sw = new Octree<T>(new Box(x - w, y + h, z - d, w, h, d), this.capacity)
    this.se = new Octree<T>(new Box(x + w, y + h, z - d, w, h, d), this.capacity)
    this.nw_z = new Octree<T>(new Box(x - w, y - h, z + d, w, h, d), this.capacity)
    this.ne_z = new Octree<T>(new Box(x + w, y - h, z + d, w, h, d), this.capacity)
    this.sw_z = new Octree<T>(new Box(x - w, y + h, z + d, w, h, d), this.capacity)
    this.se_z = new Octree<T>(new Box(x + w, y + h, z + d, w, h, d), this.capacity)
    this.divided = true
  }

  insert(entity: T) {
    if (!this.boundary.contains(entity)) {
      return false
    }
    if (this.entities.length < this.capacity) {
      this.entities.push(entity)
      return true
    } else {
      if (!this.divided) {
        this.subdivide()
      }
      if (this.nw!.insert(entity)) return true
      if (this.ne!.insert(entity)) return true
      if (this.sw!.insert(entity)) return true
      if (this.se!.insert(entity)) return true
      if (this.nw_z!.insert(entity)) return true
      if (this.ne_z!.insert(entity)) return true
      if (this.sw_z!.insert(entity)) return true
      if (this.se_z!.insert(entity)) return true
    }
  }

  query(range: Box<T>, found?: T[]) {
    if (!found) {
      found = []
    }
    if (!this.boundary.intersects(range)) {
      return found
    } else {
      for (let particle of this.entities) {
        if (range.contains(particle)) {
          found.push(particle)
        }
      }
      if (this.divided) {
        this.nw!.query(range, found)
        this.ne!.query(range, found)
        this.sw!.query(range, found)
        this.se!.query(range, found)
        this.nw_z!.query(range, found)
        this.ne_z!.query(range, found)
        this.sw_z!.query(range, found)
        this.se_z!.query(range, found)
      }
      return found
    }
  }
}

export class Box<T extends Positional3D> {
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number

  constructor(x: number, y: number, z: number, w: number, h: number, d: number) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
    this.h = h
    this.d = d
  }

  contains(entity: T) {
    return (
      entity.position.x >= this.x - this.w &&
      entity.position.x <= this.x + this.w &&
      entity.position.y >= this.y - this.h &&
      entity.position.y <= this.y + this.h &&
      entity.position.z >= this.z - this.d &&
      entity.position.z <= this.z + this.d
    )
  }

  intersects(range: Box<T>) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h ||
      range.z - range.d > this.z + this.d ||
      range.z + range.d < this.z - this.d
    )
  }
}
