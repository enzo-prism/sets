import type { WorkoutType } from "@/lib/types"

export type WorkoutOption = {
  value: string
  label: string
  workoutType: WorkoutType
}

export type WorkoutGroup = {
  id: string
  label: string
  emoji: string
  items: WorkoutOption[]
}

export const WORKOUT_GROUPS: WorkoutGroup[] = [
  {
    id: "upper",
    label: "Upper",
    emoji: "💪",
    items: [
      { value: "bench press", label: "Bench press", workoutType: "bench press" },
      {
        value: "should press",
        label: "Shoulder press",
        workoutType: "should press",
      },
      {
        value: "rear delt fly",
        label: "Rear delt fly",
        workoutType: "rear delt fly",
      },
      {
        value: "cable face pull",
        label: "Cable face pull",
        workoutType: "cable face pull",
      },
    ],
  },
  {
    id: "lower",
    label: "Lower",
    emoji: "🦵",
    items: [
      { value: "squat", label: "Squat", workoutType: "squat" },
      {
        value: "single leg squat",
        label: "Single leg squat",
        workoutType: "single leg squat",
      },
      { value: "good morning", label: "Good morning", workoutType: "good morning" },
      { value: "calf raises", label: "Calf raises", workoutType: "calf raises" },
      {
        value: "calf raises (seated)",
        label: "Calf raises (seated)",
        workoutType: "calf raises (seated)",
      },
    ],
  },
  {
    id: "power",
    label: "Power",
    emoji: "⚡️",
    items: [
      { value: "hang clean", label: "Hang clean", workoutType: "hang clean" },
      { value: "clean-power", label: "Clean", workoutType: "clean" },
      { value: "hang snatch", label: "Hang snatch", workoutType: "hang snatch" },
      { value: "snatch", label: "Snatch", workoutType: "snatch" },
    ],
  },
  {
    id: "core",
    label: "Core",
    emoji: "🧘",
    items: [
      { value: "leg lifts", label: "Leg lifts", workoutType: "leg lifts" },
      { value: "plank", label: "Plank", workoutType: "plank" },
      { value: "toe touches", label: "Toe touches", workoutType: "toe touches" },
      { value: "bicycles", label: "Bicycles", workoutType: "bicycles" },
    ],
  },
  {
    id: "bar",
    label: "Bar",
    emoji: "🤸",
    items: [
      { value: "pull up", label: "Pull ups", workoutType: "pull up" },
      { value: "true bubka", label: "True bubka", workoutType: "true bubka" },
      { value: "wipers", label: "Wipers", workoutType: "wipers" },
      {
        value: "down pressure",
        label: "Down pressure",
        workoutType: "down pressure",
      },
    ],
  },
  {
    id: "recover",
    label: "Recover",
    emoji: "♨️",
    items: [{ value: "sauna", label: "Sauna", workoutType: "sauna" }],
  },
  {
    id: "supplement",
    label: "Supplement",
    emoji: "🧪",
    items: [
      { value: "creatine", label: "Creatine", workoutType: "creatine" },
      { value: "protein", label: "Protein", workoutType: "protein" },
    ],
  },
]

const WORKOUT_VALUE_MAP = new Map<string, WorkoutType>()
const WORKOUT_TYPE_MAP = new Map<WorkoutType, string>()
const WORKOUT_GROUP_BY_VALUE = new Map<string, string>()
const WORKOUT_GROUP_BY_TYPE = new Map<WorkoutType, string>()

for (const group of WORKOUT_GROUPS) {
  for (const item of group.items) {
    WORKOUT_VALUE_MAP.set(item.value, item.workoutType)
    WORKOUT_TYPE_MAP.set(item.workoutType, item.value)
    WORKOUT_GROUP_BY_VALUE.set(item.value, group.id)
    WORKOUT_GROUP_BY_TYPE.set(item.workoutType, group.id)
  }
}

export function workoutValueToType(value?: string | null): WorkoutType | null {
  if (!value) {
    return null
  }
  return WORKOUT_VALUE_MAP.get(value) ?? null
}

export function workoutTypeToValue(type?: WorkoutType | null) {
  if (!type) {
    return ""
  }
  return WORKOUT_TYPE_MAP.get(type) ?? type
}

export function getWorkoutGroupIdForType(type?: WorkoutType | null) {
  if (!type) {
    return null
  }
  return WORKOUT_GROUP_BY_TYPE.get(type) ?? null
}

export function getWorkoutGroupIdForValue(value?: string | null) {
  if (!value) {
    return null
  }
  return WORKOUT_GROUP_BY_VALUE.get(value) ?? null
}

export function getWorkoutGroupById(id?: string | null) {
  if (!id) {
    return null
  }
  return WORKOUT_GROUPS.find((group) => group.id === id) ?? null
}

export function isRecoveryWorkout(type?: WorkoutType | null) {
  return getWorkoutGroupIdForType(type) === "recover"
}

export function isSupplementWorkout(type?: WorkoutType | null) {
  return getWorkoutGroupIdForType(type) === "supplement"
}
