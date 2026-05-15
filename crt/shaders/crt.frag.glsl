#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926538

varying vec2 vTexCoord;

uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;

vec2 curveRemapUV(vec2 uv) {
  uv = uv * 2.0 - 1.0;
  vec2 curvature = vec2(4.5);
  vec2 offset = abs(uv.yx) / curvature;
  uv = uv + uv * offset * offset * u_intensity;
  return uv * 0.5 + 0.5;
}

float random(vec2 co) {
  return fract(sin(dot(co.xy, vec2(12.9898, 78.233)) + u_time) * 43758.5453);
}

void main() {
  vec2 uv = vTexCoord;
  vec2 remappedUV = curveRemapUV(uv);

  if (remappedUV.x < 0.0 || remappedUV.y < 0.0 || remappedUV.x > 1.0 || remappedUV.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }

  float chroma = 0.0018 * u_intensity;
  vec4 baseColor;
  baseColor.r = texture2D(u_tex, remappedUV + vec2(chroma, 0.0)).r;
  baseColor.g = texture2D(u_tex, remappedUV).g;
  baseColor.b = texture2D(u_tex, remappedUV - vec2(chroma, 0.0)).b;
  baseColor.a = 1.0;

  float line_count = 420.0;
  float y_lines = sin(remappedUV.y * line_count * PI * 2.0);
  y_lines = (y_lines * 0.5 + 0.5) * 0.85 + 0.15;

  float x_lines = sin(remappedUV.x * line_count * PI * 2.0);
  x_lines = (x_lines * 0.5 + 0.5) * 0.85 + 0.15;

  float scanline = pow(y_lines, 0.65);
  float grille = mix(1.0, pow(x_lines, 0.85), 0.35 * u_intensity);
  float vignette = smoothstep(0.82, 0.18, distance(remappedUV, vec2(0.5)));
  float flicker = 0.96 + 0.04 * sin(u_time * 48.0);
  float noise = (random(gl_FragCoord.xy) - 0.5) * 0.035 * u_intensity;

  vec3 terminalTint = vec3(0.25, 1.15, 1.35);
  vec3 color = baseColor.rgb * terminalTint * (1.4 + 1.2 * u_intensity);
  color *= scanline * grille * vignette * flicker;
  color += noise;

  gl_FragColor = vec4(color, 1.0);
}
