import * as THREE from 'three';

const snoise = `
// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

export function setupRoadMaterial(shader: THREE.Shader, type: 'major' | 'minor' | 'service') {
  shader.vertexShader = `
    varying vec3 vLocalPosition;
    varying vec3 vWorldPosition;
    varying float vInstanceLength;
    ${shader.vertexShader}
  `.replace(
    '#include <worldpos_vertex>',
    `
    #include <worldpos_vertex>
    vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
    vLocalPosition = position;
    #ifdef USE_INSTANCING
      vInstanceLength = length(instanceMatrix[2].xyz);
    #else
      vInstanceLength = 1.0;
    #endif
    `
  );

  shader.fragmentShader = `
    varying vec3 vLocalPosition;
    varying vec3 vWorldPosition;
    varying float vInstanceLength;
    ${snoise}
    ${shader.fragmentShader}
  `.replace(
    '#include <color_fragment>',
    `
    #include <color_fragment>
    
    // Add procedural wear and tear using world position
    float noise1 = snoise(vWorldPosition.xz * 1.5) * 0.5 + 0.5;
    float noise2 = snoise(vWorldPosition.xz * 5.0) * 0.5 + 0.5;
    float noise3 = snoise(vWorldPosition.xz * 20.0) * 0.5 + 0.5;
    
    ${type === 'service' ? `
      // Gravel/dirt look
      float wear = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
      diffuseColor.rgb *= mix(0.7, 1.3, wear);
    ` : `
      // Asphalt wear
      float wear = noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1;
      
      // Edge wear
      float edgeDist = abs(vLocalPosition.x) * 2.0; // 0 at center, 1 at edge
      wear += pow(edgeDist, 4.0) * 0.5;
      
      diffuseColor.rgb *= mix(0.7, 1.3, wear);
      // Potholes/cracks
      if (noise3 > 0.8 && noise1 < 0.3) {
         diffuseColor.rgb *= 0.5;
      }
    `}
    
    ${type === 'major' ? `
      // Draw dashed center line
      float zDist = vLocalPosition.z * vInstanceLength;
      
      // Dash pattern: e.g. 2m dash, 2m gap
      float dash = mod(zDist, 4.0);
      
      if (abs(vLocalPosition.x) < 0.02 && dash < 2.0 && vLocalPosition.y > 0.49) {
        // Yellow-ish white for lines with some wear
        diffuseColor.rgb = mix(vec3(0.9, 0.85, 0.7), diffuseColor.rgb, noise3 * 0.5);
      }
      
      // Side lines (solid)
      if (abs(abs(vLocalPosition.x) - 0.45) < 0.015 && vLocalPosition.y > 0.49) {
        diffuseColor.rgb = mix(vec3(0.9, 0.9, 0.9), diffuseColor.rgb, noise3 * 0.5);
      }
    ` : ''}
    
    ${type === 'minor' ? `
      // Minor road: dashed line, no side lines
      float zDist2 = vLocalPosition.z * vInstanceLength;
      float dash2 = mod(zDist2, 6.0);
      if (abs(vLocalPosition.x) < 0.02 && dash2 < 3.0 && vLocalPosition.y > 0.49) {
        diffuseColor.rgb = mix(vec3(0.8, 0.8, 0.8), diffuseColor.rgb, noise3 * 0.5);
      }
    ` : ''}

    `
  );
}
