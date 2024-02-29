import p5 from 'p5'

export class Camera2D {
  p: p5
  x: number
  y: number
  zoom: number
  prevX: number | null
  prevY: number | null
  isDragging: boolean
  preventLeftPan: boolean

  constructor(p: p5, preventLeftPan: boolean = false) {
    this.p = p
    this.x = 0
    this.y = 0
    this.zoom = 1
    this.prevX = null
    this.prevY = null
    this.isDragging = false
    this.preventLeftPan = preventLeftPan
  }

  mouseInWorld() {
    const x = (this.p.mouseX - this.x) / this.zoom
    const y = (this.p.mouseY - this.y) / this.zoom
    return [x, y] as const
  }

  mousePressed() {
    if (this.p.mouseX < 0 || this.p.mouseX > this.p.width || this.p.mouseY < 0 || this.p.mouseY > this.p.height) {
      return
    }
    this.isDragging = true
    this.prevX = this.p.mouseX
    this.prevY = this.p.mouseY
  }

  mouseDragged() {
    if (!this.isDragging) {
      return
    }
    if (this.p.mouseButton === this.p.LEFT && this.preventLeftPan) {
      return
    }
    const x = this.p.mouseX
    const y = this.p.mouseY
    const dx = x - (this.prevX || 0)
    const dy = y - (this.prevY || 0)
    this.x += dx
    this.y += dy
    this.prevX = this.p.mouseX
    this.prevY = this.p.mouseY
  }

  mouseReleased() {
    this.isDragging = false
    this.prevX = null
    this.prevY = null
  }

  mouseWheel(e: WheelEvent) {
    if (this.p.mouseX < 0 || this.p.mouseX > this.p.width || this.p.mouseY < 0 || this.p.mouseY > this.p.height) {
      return
    }
    e.preventDefault()

    const direction = e.deltaY > 0 ? -1 : 1
    const factor = 0.1
    const zoom = this.p.constrain(this.zoom + direction * factor, 0.1, 10.0) - this.zoom

    const wx = (this.p.mouseX - this.x) / this.zoom
    const wy = (this.p.mouseY - this.y) / this.zoom

    this.x -= wx * zoom
    this.y -= wy * zoom
    this.zoom += zoom
  }
}
