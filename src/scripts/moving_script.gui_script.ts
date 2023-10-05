import { action } from "../modules/action";

interface props {
    buttons: number
}

export function init(this: props) {
    msg.post('.', 'acquire_input_focus');

    msg.post("onscreen", "register");
}

export function on_input(this: props, action_id: hash, action: action) {
    if (action_id === hash('touch_multi')) {
        print('touch_multi');
    }

    if (action_id === hash('touch') && !action.released) {
        let left = gui.get_node('left');
        let right = gui.get_node('right');

        if (gui.pick_node(left, action.x, action.y)) {
            msg.post('/player/player#player', 'move_left');
        }

        if (gui.pick_node(right, action.x, action.y)) {
            msg.post('/player/player#player', 'move_right');
        }


    }
}

