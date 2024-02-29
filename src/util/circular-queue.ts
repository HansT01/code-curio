export class CircularQueue<T> {
  capacity: number
  queue: T[]
  front: number
  rear: number
  size: number

  constructor(capacity: number) {
    this.capacity = capacity
    this.queue = new Array(capacity)
    this.front = 0
    this.rear = -1
    this.size = 0
  }

  enqueue(item: T): void {
    if (this.size === this.capacity) {
      throw new Error('Queue is full')
    }
    this.rear = (this.rear + 1) % this.capacity
    this.queue[this.rear] = item
    this.size++
  }

  dequeue(): T {
    if (this.size === 0) {
      throw new Error('Queue is empty')
    }
    const item = this.queue[this.front]
    this.front = (this.front + 1) % this.capacity
    this.size--
    return item
  }

  *[Symbol.iterator](): Iterator<T> {
    let index = this.front
    let count = 0
    while (count < this.size) {
      yield this.queue[index]
      index = (index + 1) % this.capacity
      count++
    }
  }

  *reverseIter(): IterableIterator<T> {
    let index = this.rear
    let count = 0
    while (count < this.size) {
      yield this.queue[index]
      index = (index - 1 + this.capacity) % this.capacity
      count++
    }
  }

  isFull() {
    return this.size === this.capacity
  }
}
