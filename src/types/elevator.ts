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
  arriveTime?: number // 送達時間（統計用）
}

export interface ElevatorState {
  id: number
  currentFloor: number
  direction: Direction
  status: ElevatorStatus
  passengers: Person[]
  targetFloors: Set<number>
  tripCount: number // 該電梯完成的載客次數
  totalFloorsMoving: number // 該電梯總共移動的樓層數
}

/** 模擬參數設定 */
export interface SimulationConfig {
  maxCapacity: number // 每台電梯容量
  maxFloor: number // 大樓總樓層
  targetPeople: number // 模擬總人數
  elevatorCount: number // 電梯數量
}

/** 模擬結束後的統計結果 */
export interface SimulationStats {
  totalTime: number // 總耗時
  avgWaitTime: number // 平均等待時間
  maxWaitTime: number // 最長等待時間
  perElevator: {
    id: number
    tripCount: number
    totalFloorsMoved: number
  }[]
}
