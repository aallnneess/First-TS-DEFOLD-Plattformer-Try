export interface action {
    value: number,
    pressed: boolean,
    released: boolean,
    repeated: boolean,
    x: number,
    y: number,
    screen_x: number,
    screen_y: number,
    dx: number,
    dy: number,
    screen_dx: number,
    screen_dy: number,
    // touch: list -> https://defold.com/ref/go/#on_input
}