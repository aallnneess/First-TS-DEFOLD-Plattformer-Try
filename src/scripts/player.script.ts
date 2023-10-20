import { contact_point_response } from "../modules/contact_responses/contact_point_response";
import { action } from "../modules/action";
import {onscreenData} from "../modules/onscreenData";

interface props {
  air_acceleration_factor: number;
  max_speed: number;
  gravity: number;
  jump_takeoff_speed: number;

  velocity: vmath.vector3;
  facing_direction: number;
  correction: vmath.vector3;
  ground_contact: boolean;
  wall_contact: boolean;
  anim: hash;
                                        // pre-hashing ids improves performance
  msg_contact_point_response: hash;
  msg_animation_done: hash;
  group_obstacle: hash;
  input_left: hash;
  input_right: hash;
  input_jump: hash;
  anim_walk: hash;
  anim_idle: hash;
  anim_jump: hash;
  anim_fall: hash;
}

export function init(this: props): void {
  print('<Player> init');

  this.air_acceleration_factor = 0.8;
  this.max_speed = 450;
  this.gravity = -1900;
  this.jump_takeoff_speed = 1200;

  this.msg_contact_point_response = hash("contact_point_response");
  this.msg_animation_done = hash("animation_done");
  this.group_obstacle = hash("ground");
  this.input_left = hash("left");
  this.input_right = hash("right");
  this.input_jump = hash("jump");
  this.anim_walk = hash("walk");
  this.anim_idle = hash("idle");
  this.anim_jump = hash("jump");
  this.anim_fall = hash("fall");

  // this lets us handle input in this script
  msg.post(".", "acquire_input_focus");

  // activate camera attached to the player collection
	// this will send camera updates to the render script
	msg.post("#camera", "acquire_camera_focus");
	msg.post("@render:", "use_camera_projection");

  // initial player velocity
	this.velocity = vmath.vector3(0, 0, 0);
	// the direction the player is facing
	this.facing_direction = 0;
	// support variable to keep track of collisions and separation
	this.correction = vmath.vector3();

	// if the player stands on ground or not
	this.ground_contact = false;
	// the currently playing animation
	this.anim = hash('');

  msg.post("/level#control_gui", "register");


  msg.post("/level#control_gui", "register_button", { id: "jump" });
  msg.post("/level#control_gui", "register_analog", {id: "analog", radius: 60});




}

function play_animation(this: props, anim: hash) {
  // only play animations which are not already playing
  if(this.anim !== anim) {
    // tell the sprite to play the animation
    sprite.play_flipbook("#sprite", anim);
    // remember which animation is playing
    this.anim = anim;
  }

}

function update_animations(this: props) {
  // make sure the player character faces the right way
  sprite.set_hflip("#sprite", this.facing_direction < 0);

  // make sure the right animation is playing
  if(this.ground_contact) {

    if(this.velocity.x === 0) {
      play_animation.call(this, this.anim_idle);
    }else{
      play_animation.call(this, this.anim_walk);
    }
  }else {

    if(this.velocity.y > 0) {
      play_animation.call(this, this.anim_jump);
    }else {
      play_animation.call(this, this.anim_fall);
    }
  }
}

/*
fixed_update: On the other hand, the fixed_update function is called at regular intervals and is used for updating physics game objects. It is ideal for calculating collisions, movements, or other physics calculations that require a consistent update rate. The fixed_update function is called at a fixed frequency, regardless of the system's performance.
*/


export function fixed_update(this: props, _dt: number): void {

  // apply gravity
  this.velocity.y = this.velocity.y + this.gravity * _dt;

  // move player
  let pos = go.get_position();
  pos = pos + this.velocity * _dt as vmath.vector3;
  go.set_position(pos);

  // // update animations based on state (ground, air, move and idle)
  // update_animations.call(this);

  // reset volatile state
  this.correction = vmath.vector3();
  this.ground_contact = false;
  this.wall_contact = false;
  this.velocity.x = 0;

}


export function update(this: props, _dt: number): void {

  // update animations based on state (ground, air, move and idle)
  update_animations.call(this);

}



// handle_obstacle_contact method....
function handle_obstacle_contact(this: props, normal: vmath.vector3, distance: number) {

  if (distance > 0) {
    // First, project the accumulated correction onto the penetration vector
    const proj = vmath.project(this.correction, (normal * distance) as vmath.vector3);

    if(proj < 1) {
      // Only care for projections that does not overshoot.
      const comp = (distance - distance * proj) * normal as vmath.vector3;

      // Apply compensation
      go.set_position((go.get_position() + comp) as vmath.vector3);

      // Accumulate correction done
      this.correction = (this.correction + comp) as vmath.vector3;
    }
  }

  // collided with a wall -> stop horizontal movement
  if (math.abs(normal.x) > 0.7) {

    this.wall_contact = true;
    this.velocity.x = 0;
  }

  // collided with the ground -> stop vertical movement
  if (normal.y > 0.7) {
    this.ground_contact = true;
    this.velocity.y = 0;
  }

  // collided with the ceiling -> stop vertical movement
  if (normal.y < -0.7) {
    this.velocity.y = 0;
  }


}

export function on_message(
  this: props,
  message_id: hash,
  _message: string | contact_point_response | onscreenData,
  _sender: url
): void {

  if (message_id === hash('onscreen_button')) {

    const message = _message as onscreenData;

    if (message.id === hash('jump')) {
      jump.call(this);
    }

  }

  if (message_id === hash('onscreen_analog')) {

    const message = _message as onscreenData;

    walk.call(this,message.x);

  }



  if (message_id === hash('update_screen_width')) {
    print(_message);
  }

  // check if we received a contact point message
  if(message_id === this.msg_contact_point_response) {
    const message = _message as contact_point_response;
    
    // check that the object is something we consider an obstacle
    if (message.group === this.group_obstacle) {
      handle_obstacle_contact.call(this,message.normal,message.distance);
    }
    
  }

}

function jump(this: props) {
  // only allow jump from ground
  if(this.ground_contact) {
    // set take-off speed
    this.velocity.y = this.jump_takeoff_speed;
    print('jump. set velocity');
    // play animation
    play_animation.call(this, this.anim_jump);

    this.ground_contact = false;
  }
}

function abort_jump(this: props) {
  // cut the jump short if we are still going up
  if(this.velocity.y > 0) {
    // scale down the upwards speed
    this.velocity.y = this.velocity.y * 0.5;
  }
}

function walk(this: props, direction: number) {
  // only change facing direction if direction is other than 0
  if(direction !== 0) this.facing_direction = direction;

  // update velocity and use different velocity on ground and in air
  if(this.ground_contact) {
    this.velocity.x = this.max_speed * direction;
  }else {
    // move slower in the air
    this.velocity.x = this.max_speed * this.air_acceleration_factor * direction;
  }
}

export function on_input(this: props, action_id: hash, action: action) {

  if(action_id === this.input_left) {
    walk.call(this, -action.value);
  }else if(action_id === this.input_right) {
    walk.call(this, action.value);
  }else if(action_id === this.input_jump) {
    if(action.pressed) {
      jump.call(this);
    }else if(action.released) {
      abort_jump.call(this);
    }
  }
}
