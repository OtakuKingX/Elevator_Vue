import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Person, ElevatorState } from '../types/elevator'

export const useElevatorStore = defineStore('elevator', () => {
  // --- 常數設定 ---
  const MAX_CAPACITY = 5 // 電梯只可容納5人
  const MAX_FLOOR = 10 // 大樓共10層樓
  const TARGET_PEOPLE = 40 // 模擬放進40人次

  // --- State ---
  const time = ref(0)
  const isRunning = ref(false)
  const finishedPeopleCount = ref(0) // 用於統計是否達成目標人數
  const totalGeneratedCount = ref(0) // 確保只產生指定的人數

  const logs = ref<string[]>([])
  const waitingQueue = ref<Person[]>([]) // 每層共用1組按鈕 (共用佇列)

  // 2部電梯
  const elevators = ref<ElevatorState[]>([
    {
      id: 1,
      currentFloor: 1,
      direction: 0,
      status: 'IDLE',
      passengers: [],
      targetFloors: new Set(),
    },
    {
      id: 2,
      currentFloor: 1,
      direction: 0,
      status: 'IDLE',
      passengers: [],
      targetFloors: new Set(),
    },
  ])

  // --- Actions ---

  // 系統時鐘：驅動核心
  const tick = () => {
    if (!isRunning.value) return

    time.value++

    // 每秒產生1個人 (直到滿 40 人)
    if (totalGeneratedCount.value < TARGET_PEOPLE) {
      generatePerson()
    }

    // 清理過期的指派：若被指派的電梯已不再以該樓層為目標，重設指派
    waitingQueue.value.forEach((p) => {
      if (p.assignedElevatorId != null) {
        const assigned = elevators.value.find((e) => e.id === p.assignedElevatorId)
        if (!assigned || !assigned.targetFloors.has(p.fromFloor)) {
          p.assignedElevatorId = undefined
        } else {
          // 等待超過 10 秒且有閒置電梯時，強制重新評估分配
          // 防止乘客鎖死在忙碌電梯上，而另一台空閒電梯就在旁邊
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

    // 依等待時間排序（最久優先），防止有人等太久問題
    const sortedWaiting = [...waitingQueue.value].sort(
      (a, b) => (a.spawnTime ?? time.value) - (b.spawnTime ?? time.value),
    )
    sortedWaiting.forEach((p) => dispatchElevator(p))

    // 驅動電梯運作
    elevators.value.forEach(processElevator)

    // 結束條件：所有人都已產生並送達，且佇列和電梯皆清空
    if (
      totalGeneratedCount.value >= TARGET_PEOPLE &&
      finishedPeopleCount.value >= TARGET_PEOPLE &&
      waitingQueue.value.length === 0 &&
      elevators.value.every((e) => e.passengers.length === 0)
    ) {
      stopSimulation()
      addLog(`🎉 模擬結束！總耗時：${time.value} 秒`)
    }
  }

  // 產生隨機樓層乘客
  const generatePerson = () => {
    const from = Math.floor(Math.random() * MAX_FLOOR) + 1
    let to = Math.floor(Math.random() * MAX_FLOOR) + 1
    while (to === from) to = Math.floor(Math.random() * MAX_FLOOR) + 1

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
    // 如果這個人已經有電梯要來接了，就跳過
    if (person.assignedElevatorId != null) return

    // 篩選未滿載
    const available = elevators.value.filter((e) => e.passengers.length < MAX_CAPACITY)
    if (available.length === 0) return

    // 等待時間因素：等越久的人，懲罰越低，更容易被服務
    const waitTime = time.value - (person.spawnTime ?? time.value)
    // 每等 5 秒減少 2 點方向懲罰，最多減 10
    const urgencyReduction = Math.min(10, Math.floor(waitTime / 5) * 2)

    let bestElevator = null as ElevatorState | null
    let minCost = Infinity

    available.forEach((e: ElevatorState) => {
      let cost = Math.abs(e.currentFloor - person.fromFloor)

      // 原地反向死鎖保護
      const isAtFloorButWrongDir =
        e.currentFloor === person.fromFloor && e.direction !== 0 && e.direction !== person.direction

      if (isAtFloorButWrongDir) {
        cost = Infinity
      } else {
        // 方向懲罰邏輯
        if (e.direction !== 0) {
          // 電梯正在遠離乘客 (反向)
          const isWrongDir =
            (e.direction === 1 && person.fromFloor < e.currentFloor) ||
            (e.direction === -1 && person.fromFloor > e.currentFloor)

          if (isWrongDir) {
            // 反向懲罰隨等待時間遞減，等越久越能容忍反方向的電梯
            cost += Math.max(8, 20 - urgencyReduction)
          } else if (e.direction === person.direction) {
            // 電梯方向與乘客方向一致
            const isOnTheWay =
              (e.direction === 1 && person.fromFloor > e.currentFloor) ||
              (e.direction === -1 && person.fromFloor < e.currentFloor)
            if (isOnTheWay) {
              // 超級順路：電梯往上，人也在上方且要去更上面
              cost -= 5
            }
          } else {
            // 電梯會經過乘客樓層，但方向不符 (如電梯上行、人想下行)
            // 到了也大概率無法上車 → 重懲罰避免白跑一趟
            cost += Math.max(5, 15 - urgencyReduction)
          }
        }

        // 考慮電梯的現有負載，負載越高成本越高
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

    // 有人要離開？
    const anyoneToDrop = e.passengers.some((p) => p.toFloor === e.currentFloor)

    // 原定要來這層接人？
    const isTargetedToPick = e.targetFloors.has(e.currentFloor)

    // 有人在等，且跟我同向，且我還沒滿員
    const canPickUpOnTheWay = waitingQueue.value.some(
      (p) =>
        p.fromFloor === e.currentFloor &&
        (e.direction === 0 || p.direction === e.direction) && // 方向一致或我目前無方向
        e.passengers.length < MAX_CAPACITY, // 電梯還有位子
    )

    // 只要符合其中一個條件，就停下來
    if (anyoneToDrop || isTargetedToPick || canPickUpOnTheWay) {
      e.status = 'PROCESSING'
      return
    }

    // 移動邏輯...
    updateDirection(e)
    if (e.direction !== 0) {
      e.status = 'MOVING'
      e.currentFloor += e.direction
    } else {
      e.status = 'IDLE'
    }
  }

  const handleBoardingAndAlighting = (e: ElevatorState) => {
    // 先放人
    const alighting = e.passengers.filter((p) => p.toFloor === e.currentFloor)
    if (alighting.length > 0) {
      e.passengers = e.passengers.filter((p) => p.toFloor !== e.currentFloor)
      finishedPeopleCount.value += alighting.length
      addLog(`E${e.id} 放下 ${alighting.length} 人 (剩 ${e.passengers.length} 人)`)
    }

    // 再接人 — 統一收集後批次移除，避免每次都產生新陣列
    const waitingHere = waitingQueue.value.filter((p) => p.fromFloor === e.currentFloor)
    const boardedIds: number[] = []

    waitingHere.forEach((p) => {
      if (e.passengers.length < MAX_CAPACITY) {
        // 基本條件：方向相同
        const isSameDir = e.direction === p.direction

        // 空電梯條件：如果放完人後車是空的，這台車就是自由的，誰都可以上！
        // (這解決了 10F 放完人後，可以直接載下樓的人)
        const isEmpty = e.passengers.length === 0

        // 觸底/觸頂條件：如果在 10 樓，不管原本方向為何，現在一定要往下；反之亦然。
        const isTopTurnaround = e.currentFloor === MAX_FLOOR // 在頂樓，必定接下樓客
        const isBottomTurnaround = e.currentFloor === 1 // 在一樓，必定接上樓客

        // IDLE 條件：電梯原本就沒事做
        const isIdle = e.direction === 0

        // 只要符合上述任一條件，就接人
        if (isSameDir || isEmpty || isTopTurnaround || isBottomTurnaround || isIdle) {
          e.passengers.push(p)
          e.targetFloors.add(p.toFloor)
          boardedIds.push(p.id)
          addLog(`E${e.id} 接走 #${p.id} (去 ${p.toFloor}F)`)

          // 如果電梯原本是空的被叫來，或者在轉折點，接了人之後要立刻更新電梯方向
          if (isEmpty || isIdle) {
            e.direction = p.direction
          }
        }
      }
    })

    // 批次移除已上車的人
    if (boardedIds.length > 0) {
      const boardedSet = new Set(boardedIds)
      waitingQueue.value = waitingQueue.value.filter((x) => !boardedSet.has(x.id))
    }

    // 重設未能上車者的指派（電梯已滿或方向不符），讓他們下輪可被重新分配
    waitingQueue.value.forEach((p) => {
      if (p.assignedElevatorId === e.id && p.fromFloor === e.currentFloor) {
        p.assignedElevatorId = undefined
      }
    })

    // 移除這層樓的停靠目標
    e.targetFloors.delete(e.currentFloor)
  }

  const updateDirection = (e: ElevatorState) => {
    // 收集所有要去的地方 (乘客目標 + 接人目標)
    const destinations = [...Array.from(e.targetFloors), ...e.passengers.map((p) => p.toFloor)]

    if (destinations.length === 0) {
      e.direction = 0
      return
    }

    // 往第一個目標走 (或是保持當前方向直到無目標)
    // 為了符合連續性，若上方有目標就往上，下方有目標就往下
    const hasAbove = destinations.some((f) => f > e.currentFloor)
    const hasBelow = destinations.some((f) => f < e.currentFloor)

    if (e.direction === 1 && hasAbove) e.direction = 1
    else if (e.direction === -1 && hasBelow) e.direction = -1
    else if (hasAbove) e.direction = 1
    else if (hasBelow) e.direction = -1
    else e.direction = 0 // 應該不會發生
  }

  const addLog = (msg: string) => {
    logs.value.push(`[T=${time.value}] ${msg}`)
  }

  const startSimulation = () => {
    if (isRunning.value) return
    // 重置數據以符合新的一輪測試
    time.value = 0
    totalGeneratedCount.value = 0
    finishedPeopleCount.value = 0
    waitingQueue.value = []
    logs.value = []
    elevators.value.forEach((e) => {
      e.currentFloor = 1
      e.direction = 0
      e.status = 'IDLE'
      e.passengers = []
      e.targetFloors.clear()
    })
    isRunning.value = true
  }

  const stopSimulation = () => {
    isRunning.value = false
  }

  return {
    time,
    elevators,
    waitingQueue,
    finishedPeopleCount,
    isRunning,
    logs,
    tick,
    startSimulation,
    stopSimulation,
  }
})
