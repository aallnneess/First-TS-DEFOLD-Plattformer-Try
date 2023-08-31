export interface contact_point_response {
  position: vmath.vector3;
  normal: vmath.vector3;
  relative_velocity: vmath.vector3;
  distance: number;
  applied_impulse: number;
  life_time: number;
  mass: number;
  other_mass: number;
  other_id: hash;
  other_position: vmath.vector3;
  group: hash;
}