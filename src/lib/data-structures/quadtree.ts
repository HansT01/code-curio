interface Positional2D {
  position: { x: number; y: number; z: number }
}

export class Quadtree<T extends Positional2D> {
  boundary: Rectangle<T>
  capacity: number
  entities: T[]
  divided: boolean
  nw?: Quadtree<T>
  ne?: Quadtree<T>
  sw?: Quadtree<T>
  se?: Quadtree<T>

  constructor(boundary: Rectangle<T>, capacity: number) {
    this.boundary = boundary
    this.capacity = capacity
    this.entities = []
    this.divided = false
  }

  subdivide() {
    const x = this.boundary.x
    const y = this.boundary.y
    const w = this.boundary.w / 2
    const h = this.boundary.h / 2
    this.nw = new Quadtree<T>(new Rectangle(x - w, y - h, w, h), this.capacity)
    this.ne = new Quadtree<T>(new Rectangle(x + w, y - h, w, h), this.capacity)
    this.sw = new Quadtree<T>(new Rectangle(x - w, y + h, w, h), this.capacity)
    this.se = new Quadtree<T>(new Rectangle(x + w, y + h, w, h), this.capacity)
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
    }
  }

  query(range: Rectangle<T>, found?: T[]) {
    if (!found) {
      found = []
    }
    if (!this.boundary.intersects(range)) {
      return found
    } else {
      for (let entity of this.entities) {
        if (range.contains(entity)) {
          found.push(entity)
        }
      }
      if (this.divided) {
        this.nw!.query(range, found)
        this.ne!.query(range, found)
        this.sw!.query(range, found)
        this.se!.query(range, found)
      }
      return found
    }
  }
}

export class Rectangle<T extends Positional2D> {
  x: number
  y: number
  w: number
  h: number

  constructor(x: number, y: number, w: number, h: number) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
  }

  contains(entity: T) {
    return (
      entity.position.x >= this.x - this.w &&
      entity.position.x <= this.x + this.w &&
      entity.position.y >= this.y - this.h &&
      entity.position.y <= this.y + this.h
    )
  }

  intersects(range: Rectangle<T>) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    )
  }
}
