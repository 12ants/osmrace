import * as THREE from 'three';

// Generate procedural textures for building facades
export function setupBuildingMaterial(shader: THREE.Shader, hasWindows: boolean, shop: boolean) {
  shader.vertexShader = `
    varying vec3 vLocalPosition;
    varying vec3 vWorldNormal;
    ${shader.vertexShader}
  `.replace(
    '#include <worldpos_vertex>',
    `
    #include <worldpos_vertex>
    vLocalPosition = position;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    `
  );

  shader.fragmentShader = `
    varying vec3 vLocalPosition;
    varying vec3 vWorldNormal;
    
    // Hash function for random noise
    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    ${shader.fragmentShader}
  `.replace(
    '#include <color_fragment>',
    `
    #include <color_fragment>
    
    // Building height is along local Z axis (due to ExtrudeGeometry and -PI/2 rotation on X)
    float height = vLocalPosition.z;
    
    // Side walls vs Roof
    // If the normal is mostly pointing up in world space (Y > 0.9), it's the roof.
    bool isRoof = vWorldNormal.y > 0.9;
    
    if (!isRoof) {
       // We are on a side wall. We can generate procedural windows and materials.
       // Because walls are extruded, the distance along the wall is either based on X or Y
       // but since edges can be arbitrary, we need a 1D mapping along the perimeter.
       // A simple approach is to use the local angle around the building center, or just world coordinates.
       
       // Using world or local X/Y to wrap a texture can be tricky, but we can compute a wall UV based on normal
       vec2 wallUV;
       if (abs(vWorldNormal.x) > abs(vWorldNormal.z)) {
         wallUV = vec2(vLocalPosition.y, vLocalPosition.z); // use local Y (which is world Z) and local Z (height)
       } else {
         wallUV = vec2(vLocalPosition.x, vLocalPosition.z); // use local X and local Z (height)
       }
       
       ${shop ? `
         // Commercial buildings get glass/panel look or brick
         float pType = hash(floor(wallUV.xx * 0.001)); // Just a varied property
         if (pType > 0.5) {
            // Concrete panels
            float panelX = mod(wallUV.x, 3.0);
            float panelY = mod(wallUV.y, 1.5);
            if (panelX < 0.05 || panelY < 0.05) {
               diffuseColor.rgb *= 0.8; // Panel grooves
            }
         } else {
            // Brick look
            float brickX = mod(wallUV.x + (mod(floor(wallUV.y * 3.0), 2.0) * 0.2), 0.4);
            float brickY = mod(wallUV.y, 0.2);
            if (brickX < 0.02 || brickY < 0.015) {
               diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.6, 0.6), 0.5); // Mortar
            } else {
               diffuseColor.rgb *= mix(0.9, 1.1, hash(floor(wallUV * vec2(2.5, 5.0))));
            }
         }
       ` : `
         // Residential brick or concrete
         float brickX = mod(wallUV.x + (mod(floor(wallUV.y * 2.5), 2.0) * 0.25), 0.5);
         float brickY = mod(wallUV.y, 0.2);
         if (brickX < 0.02 || brickY < 0.02) {
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5), 0.4);
         } else {
            diffuseColor.rgb *= mix(0.85, 1.05, hash(floor(wallUV * vec2(2.0, 5.0))));
         }
       `}

       ${hasWindows ? `
          // Procedural Windows
          // Use floor height = 3 units
          float floorId = floor(wallUV.y / 3.0);
          float inFloorY = mod(wallUV.y, 3.0);
          
          float windowSpacing = 2.0;
          float inWindowX = mod(wallUV.x, windowSpacing);
          
          // Conditions for window:
          // Not ground floor sometimes? (Actually ground floor windows are ok)
          bool isWindowArea = inWindowX > 0.4 && inWindowX < 1.6 && inFloorY > 1.0 && inFloorY < 2.5;
          
          if (isWindowArea && height > 0.5) { // don't put windows near the very bottom edge
            // Give windows a darker, glassy look or yellow if lit at night
            float r = hash(vec2(floorId, floor(wallUV.x / windowSpacing)));
            if (r > 0.2) {
              diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.1, 0.15, 0.2), 0.8);
            }
          }
       ` : ''}
    } else {
       // Roof texture
       diffuseColor.rgb *= 0.9;
       float roofTile = mod(vLocalPosition.x * 2.0 + vLocalPosition.y * 2.0, 1.0);
       if (roofTile < 0.1) diffuseColor.rgb *= 0.8;
    }
    `
  );
}
