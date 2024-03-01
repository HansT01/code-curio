import p5 from 'p5'

interface Touch {
  x: number
  y: number
  winX: number
  winY: number
  id: number
}

export class Camera2D {
  p: p5
  x: number
  y: number
  zoom: number
  prevX: number | null
  prevY: number | null
  prevTouches: Touch[] | null
  isDragging: boolean
  preventLeftPan: boolean

  constructor(p: p5, preventLeftPan: boolean = false) {
    this.p = p
    this.x = 0
    this.y = 0
    this.zoom = 1
    this.prevX = null
    this.prevY = null
    this.prevTouches = null
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

  mouseReleased() {
    this.isDragging = false
    this.prevX = null
    this.prevY = null
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

  touchStarted() {
    const touches = this.p.touches as Touch[]
    if (touches[0].x < 0 || touches[0].x > this.p.width || touches[0].y < 0 || touches[0].y > this.p.height) {
      return
    }
    if (touches.length < 2) {
      return
    }
    this.isDragging = true
    this.prevX = this.p.mouseX
    this.prevY = this.p.mouseY
    this.prevTouches = touches
  }

  touchEnded() {
    const touches = this.p.touches as Touch[]
    if (touches.length >= 2) {
      return
    }
    this.isDragging = false
    this.prevX = null
    this.prevY = null
    this.prevTouches = null
  }

  touchMoved(e: TouchEvent) {
    const touches = this.p.touches as Touch[]
    if (touches[0].x < 0 || touches[0].x > this.p.width || touches[0].y < 0 || touches[0].y > this.p.height) {
      return
    }
    e.preventDefault()
    if (touches.length < 2 || this.prevTouches === null || this.prevTouches.length < 2) {
      this.prevTouches = touches
      return
    }

    const x = (touches[0].x + touches[1].x) / 2
    const y = (touches[0].y + touches[1].y) / 2

    const dx = x - (this.prevX || 0)
    const dy = y - (this.prevY || 0)
    this.x += dx
    this.y += dy
    this.prevX = x
    this.prevY = y

    const prevDistance = this.p.dist(
      this.prevTouches[0].x,
      this.prevTouches[0].y,
      this.prevTouches[1].x,
      this.prevTouches[1].y,
    )
    const distance = this.p.dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y)
    const factor = distance / prevDistance
    const zoom = this.p.constrain(this.zoom + factor, 0.1, 10.0) - this.zoom

    const wx = (x - this.x) / this.zoom
    const wy = (y - this.y) / this.zoom
    this.x -= wx * zoom
    this.y -= wy * zoom
    this.zoom += zoom

    this.prevTouches = touches
  }
}
