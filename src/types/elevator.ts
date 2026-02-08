export type Direction = 1 | -1 | 0 // 1: 上, -1: 下, 0: 停止
export type ElevatorStatus = 'IDLE' | 'MOVING' | 'PROCESSING'
export type PersonStatus = 'WAITING' | 'RIDING' | 'ARRIVED'

export interface Person {
  id: number
  fromFloor: number
  toFloor: number
  direction: Direction
  status: PersonStatus
  assignedElevatorId?: number // 追蹤已分配的電梯，避免重複指派
  spawnTime?: number // 出現時間（統計用）
}

export interface ElevatorState {
  id: number
  currentFloor: number
  direction: Direction
  status: ElevatorStatus
  passengers: Person[]
  targetFloors: Set<number>
}
