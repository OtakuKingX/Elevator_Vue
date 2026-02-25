import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Person, ElevatorState, SimulationConfig, SimulationStats } from '../types/elevator'

export const DEFAULT_CONFIG: SimulationConfig = {
  maxCapacity: 5,
  maxFloor: 10,
  targetPeople: 40,
  elevatorCount: 2,
}

export const useElevatorStore = defineStore('elevator', () => {
  // --- 可調參數 ---
  const config = ref<SimulationConfig>({ ...DEFAULT_CONFIG })

  // --- State ---
  const time = ref(0)
  const isRunning = ref(false)
  const finishedPeopleCount = ref(0)
  const totalGeneratedCount = ref(0)

  const logs = ref<string[]>([])
  const waitingQueue = ref<Person[]>([])
  const arrivedPeople = ref<Person[]>([]) // 已送達的人（統計用）

  // 動態建立電梯
  const createElevators = (count: number): ElevatorState[] =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      currentFloor: 1,
      direction: 0 as const,
      status: 'IDLE' as const,
      passengers: [],
      targetFloors: new Set<number>(),
      tripCount: 0,
      totalFloorsMoving: 0,
    }))

  const elevators = ref<ElevatorState[]>(createElevators(DEFAULT_CONFIG.elevatorCount))

  // --- 統計 (computed) ---
  const stats = computed<SimulationStats | null>(() => {
    if (arrivedPeople.value.length === 0) return null
    const waitTimes = arrivedPeople.value
      .filter((p) => p.spawnTime != null && p.arriveTime != null)
      .map((p) => p.arriveTime! - p.spawnTime!)
    const avgWaitTime = waitTimes.length
      ? Math.round((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) * 10) / 10
      : 0
    const maxWaitTime = waitTimes.length ? Math.max(...waitTimes) : 0

    return {
      totalTime: time.value,
      avgWaitTime,
      maxWaitTime,
      perElevator: elevators.value.map((e) => ({
        id: e.id,
        tripCount: e.tripCount,
        totalFloorsMoved: e.totalFloorsMoving,
      })),
    }
  })

  // --- Actions ---

  const tick = () => {
    if (!isRunning.value) return

    time.value++

    if (totalGeneratedCount.value < config.value.targetPeople) {
      generatePerson()
    }

    // 清理過期的指派
    waitingQueue.value.forEach((p) => {
      if (p.assignedElevatorId != null) {
        const assigned = elevators.value.find((e) => e.id === p.assignedElevatorId)
        if (!assigned || !assigned.targetFloors.has(p.fromFloor)) {
          p.assignedElevatorId = undefined
        } else {
          const waitTime = time.value - (p.spawnTime ?? time.value)
          if (waitTime >= 10) {
            const hasIdleCloser = elevators.value.some(
              (e) =>
                e.id !== p.assignedElevatorId && e.direction === 0 && e.passengers.length === 0,
            )
            if (hasIdleCloser) {
              p.assignedElevatorId = undefined
            }
          }
        }
      }
    })

    const sortedWaiting = [...waitingQueue.value].sort(
      (a, b) => (a.spawnTime ?? time.value) - (b.spawnTime ?? time.value),
    )
    sortedWaiting.forEach((p) => dispatchElevator(p))

    elevators.value.forEach(processElevator)

    // 結束條件
    if (
      totalGeneratedCount.value >= config.value.targetPeople &&
      finishedPeopleCount.value >= config.value.targetPeople &&
      waitingQueue.value.length === 0 &&
      elevators.value.every((e) => e.passengers.length === 0)
    ) {
      stopSimulation()
      addLog(`🎉 模擬結束！總耗時：${time.value} 秒`)
    }
  }

  const generatePerson = () => {
    const { maxFloor } = config.value
    const from = Math.floor(Math.random() * maxFloor) + 1
    let to = Math.floor(Math.random() * maxFloor) + 1
    while (to === from) to = Math.floor(Math.random() * maxFloor) + 1

    const person: Person = {
      id: totalGeneratedCount.value + 1,
      fromFloor: from,
      toFloor: to,
      direction: to > from ? 1 : -1,
      status: 'WAITING',
      spawnTime: time.value,
    }

    waitingQueue.value.push(person)
    totalGeneratedCount.value++
    addLog(`乘客 #${person.id} 出現: ${from}F -> ${to}F`)
  }

  const dispatchElevator = (person: Person) => {
    if (person.assignedElevatorId != null) return

    const available = elevators.value.filter((e) => e.passengers.length < config.value.maxCapacity)
    if (available.length === 0) return

    const waitTime = time.value - (person.spawnTime ?? time.value)
    const urgencyReduction = Math.min(10, Math.floor(waitTime / 5) * 2)

    let bestElevator = null as ElevatorState | null
    let minCost = Infinity

    available.forEach((e: ElevatorState) => {
      let cost = Math.abs(e.currentFloor - person.fromFloor)

      const isAtFloorButWrongDir =
        e.currentFloor === person.fromFloor && e.direction !== 0 && e.direction !== person.direction

      if (isAtFloorButWrongDir) {
        cost = Infinity
      } else {
        if (e.direction !== 0) {
          const isWrongDir =
            (e.direction === 1 && person.fromFloor < e.currentFloor) ||
            (e.direction === -1 && person.fromFloor > e.currentFloor)

          if (isWrongDir) {
            cost += Math.max(8, 20 - urgencyReduction)
          } else if (e.direction === person.direction) {
            const isOnTheWay =
              (e.direction === 1 && person.fromFloor > e.currentFloor) ||
              (e.direction === -1 && person.fromFloor < e.currentFloor)
            if (isOnTheWay) {
              cost -= 5
            }
          } else {
            cost += Math.max(5, 15 - urgencyReduction)
          }
        }
        cost += e.passengers.length * 2
      }

      if (cost < minCost) {
        minCost = cost
        bestElevator = e
      }
    })

    if (bestElevator && minCost < Infinity) {
      bestElevator.targetFloors.add(person.fromFloor)
      person.assignedElevatorId = bestElevator.id
    }
  }

  const processElevator = (e: ElevatorState) => {
    if (e.status === 'PROCESSING') {
      handleBoardingAndAlighting(e)
      e.status = 'IDLE'
      return
    }

    const anyoneToDrop = e.passengers.some((p) => p.toFloor === e.currentFloor)
    const isTargetedToPick = e.targetFloors.has(e.currentFloor)

    const canPickUpOnTheWay = waitingQueue.value.some(
      (p) =>
        p.fromFloor === e.currentFloor &&
        (e.direction === 0 || p.direction === e.direction) &&
        e.passengers.length < config.value.maxCapacity,
    )

    if (anyoneToDrop || isTargetedToPick || canPickUpOnTheWay) {
      e.status = 'PROCESSING'
      return
    }

    updateDirection(e)
    if (e.direction !== 0) {
      e.status = 'MOVING'
      e.currentFloor += e.direction
      e.totalFloorsMoving++ // 統計移動樓層數
    } else {
      e.status = 'IDLE'
    }
  }

  const handleBoardingAndAlighting = (e: ElevatorState) => {
    const { maxCapacity, maxFloor } = config.value

    // 先放人
    const alighting = e.passengers.filter((p) => p.toFloor === e.currentFloor)
    if (alighting.length > 0) {
      e.passengers = e.passengers.filter((p) => p.toFloor !== e.currentFloor)
      finishedPeopleCount.value += alighting.length
      e.tripCount += alighting.length // 統計該電梯載客次數

      // 記錄到達時間並存入已送達清單
      alighting.forEach((p) => {
        p.arriveTime = time.value
        p.status = 'ARRIVED'
        arrivedPeople.value.push(p)
      })

      addLog(`E${e.id} 放下 ${alighting.length} 人 (剩 ${e.passengers.length} 人)`)
    }

    // 再接人
    const waitingHere = waitingQueue.value.filter((p) => p.fromFloor === e.currentFloor)
    const boardedIds: number[] = []

    waitingHere.forEach((p) => {
      if (e.passengers.length < maxCapacity) {
        const isSameDir = e.direction === p.direction
        const isEmpty = e.passengers.length === 0
        const isTopTurnaround = e.currentFloor === maxFloor
        const isBottomTurnaround = e.currentFloor === 1
        const isIdle = e.direction === 0

        if (isSameDir || isEmpty || isTopTurnaround || isBottomTurnaround || isIdle) {
          e.passengers.push(p)
          e.targetFloors.add(p.toFloor)
          boardedIds.push(p.id)
          addLog(`E${e.id} 接走 #${p.id} (去 ${p.toFloor}F)`)

          if (isEmpty || isIdle) {
            e.direction = p.direction
          }
        }
      }
    })

    if (boardedIds.length > 0) {
      const boardedSet = new Set(boardedIds)
      waitingQueue.value = waitingQueue.value.filter((x) => !boardedSet.has(x.id))
    }

    waitingQueue.value.forEach((p) => {
      if (p.assignedElevatorId === e.id && p.fromFloor === e.currentFloor) {
        p.assignedElevatorId = undefined
      }
    })

    e.targetFloors.delete(e.currentFloor)
  }

  const updateDirection = (e: ElevatorState) => {
    const destinations = [...Array.from(e.targetFloors), ...e.passengers.map((p) => p.toFloor)]

    if (destinations.length === 0) {
      e.direction = 0
      return
    }

    const hasAbove = destinations.some((f) => f > e.currentFloor)
    const hasBelow = destinations.some((f) => f < e.currentFloor)

    if (e.direction === 1 && hasAbove) e.direction = 1
    else if (e.direction === -1 && hasBelow) e.direction = -1
    else if (hasAbove) e.direction = 1
    else if (hasBelow) e.direction = -1
    else e.direction = 0
  }

  const addLog = (msg: string) => {
    logs.value.push(`[T=${time.value}] ${msg}`)
  }

  const updateConfig = (newConfig: Partial<SimulationConfig>) => {
    if (isRunning.value) return // 執行中不允許修改
    config.value = { ...config.value, ...newConfig }
    // 電梯數量變更時立即重建電梯陣列，讓 UI 即時反映
    if (newConfig.elevatorCount != null) {
      elevators.value = createElevators(config.value.elevatorCount)
    }
  }

  const startSimulation = () => {
    if (isRunning.value) return
    time.value = 0
    totalGeneratedCount.value = 0
    finishedPeopleCount.value = 0
    waitingQueue.value = []
    arrivedPeople.value = []
    logs.value = []
    elevators.value = createElevators(config.value.elevatorCount)
    isRunning.value = true
  }

  const stopSimulation = () => {
    isRunning.value = false
  }

  return {
    config,
    time,
    elevators,
    waitingQueue,
    finishedPeopleCount,
    isRunning,
    logs,
    stats,
    arrivedPeople,
    tick,
    updateConfig,
    startSimulation,
    stopSimulation,
  }
})
