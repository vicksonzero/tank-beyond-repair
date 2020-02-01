export enum collisionCategory {
    WORLD = 1 << 0,
    PLAYER = 1 << 1,
    PLAYER_BULLET = 1 << 2,
    ENEMY = 1 << 3,
    ENEMY_BULLET = 1 << 4,
}