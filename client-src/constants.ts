export const SPAWN_INTERVAL = 10000; // ms
export const SPAWN_DELAY = 5000; // ms
export const WORLD_WIDTH = 1366; // px
export const WORLD_HEIGHT = 768 // px
export const BASE_LINE_WIDTH = 100; // px

export const PLAYER_MOVE_SPEED = 0.7; // px per second
export const TANK_SPEED = 0.3; // px / s
export const BULLET_SPEED = 0.06; // px / s

export const ITEM_LIFESPAN = 10 * 1000; // ms
export const ITEM_LIFESPAN_WARNING = 7 * 1000; // ms

export const DEBUG_DISABLE_SPAWNING = false; // default false
export const DEBUG_PHYSICS = true; // default false, draws the physics bodies and constraints

// physics
export const PHYSICS_FRAME_SIZE = 16; // ms
export const PHYSICS_ALLOW_SLEEPING = false; // default false
export const PHYSICS_MAX_FRAME_CATCHUP = 10; // times, default 10 times (10*16 = 160ms)
export const METER_TO_PIXEL = 20; // pixel per meter
export const PIXEL_TO_METER = 1 / METER_TO_PIXEL; // meter per pixel

export const AUDIO_START_MUTED = true; // bool
