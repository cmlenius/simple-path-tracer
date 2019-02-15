const vsSource =
    `#version 300 es
      precision highp float;

      in vec2 vPos;
      
      void main() {
          gl_Position = vec4(vPos, 0.0, 1.0);
          
      }`;

const fsSource =
    ` #version 300 es
      #define MAX_FLOAT 1e7
      #define MAX_RECURSION 5
      precision highp float;
      out vec4 outColor;
      
      float g_seed = 0.0; 
      int count = 0;
     
      float rand() {
        g_seed += 0.13;
        vec2 st = vec2(gl_FragCoord.x / 400.0, gl_FragCoord.y / 300.0);
        return fract(sin(g_seed + dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
      }


      vec3 random_in_unit_sphere() {
          vec3 p;
          do {
             p = 2.0*vec3(rand(),rand(),rand()) - vec3(1.0);
               count += 1;
               if (count >= 5000) break;
          } while (p.x*p.x + p.y*p.y + p.z*p.z >= 1.0);
          return p;
      }
      
      struct camera {
        vec3 origin, lower_left_corner, horizontal, vertical;
      };

      struct ray {
        vec3 origin, direction;
      };
      
      struct hit_record {
        float t;
        vec3 p, normal;
      };
      
      struct hitable {
        vec3 center;
        float radius;
      };
      
      ray get_ray(in camera cam, in vec2 uv) {
        return ray(cam.origin, normalize(cam.lower_left_corner + uv.x*cam.horizontal + uv.y*cam.vertical - cam.origin));
      }
      
      bool hit_sphere(const in hitable hb, const in ray r, in float t_min, in float t_max, inout hit_record rec) {
        vec3 oc = r.origin - hb.center;
        float a = dot(r.direction, r.direction);
        float b = dot(oc, r.direction);
        float c = dot(oc, oc) - hb.radius*hb.radius;
        float discriminant = b*b - a*c;
        if (discriminant > 0.0) {
            float tmp = (-1.0*b - sqrt(discriminant)) / a;
            if (tmp < t_max && tmp > t_min) {
                rec.t = tmp;
                rec.p = r.origin + rec.t*r.direction;
                rec.normal = (rec.p - hb.center) / hb.radius;
                return true;
            }
            tmp = (-1.0*b + sqrt(discriminant)) / a; 
            if (tmp < t_max && tmp > t_min) {
                rec.t = tmp;
                rec.p = r.origin + rec.t*r.direction;
                rec.normal = (rec.p - hb.center) / hb.radius;
                return true;
            }
        }
        return false;
      }
      
      bool hit_world(const in ray r, in float t_min, in float t_max, inout hit_record rec) {
          rec.t = t_max;
          bool hit = false;
  
	      hit = hit_sphere(hitable(vec3(0.0,0.0,-1.0), 0.75), r, t_min, rec.t, rec) || hit;
  	      hit = hit_sphere(hitable(vec3(0.0,-100.5,-1.0),100.0), r, t_min, rec.t, rec) || hit;
          
          return hit;
       }
        
      
      
      vec3 color(in ray r) {
          vec3 col = vec3(1.0);  
	      hit_record rec;
          
          for (int i=0; i<MAX_RECURSION; i++) {
          	  if (hit_world(r, 0.001, MAX_FLOAT, rec)) {
              	vec3 rd = normalize(rec.normal + random_in_unit_sphere());
                  col *= 0.5;
                  r.origin = rec.p;
                  r.direction = rd;
	          } else {
                  float t = 0.5 * r.direction.y + 0.5;
                  col *= mix(vec3(1.0),vec3(0.5,0.7,1.0), t);
                  return col;
          	  }
          }
          return col;
      }


      void main() {
        
        float nx = 400.0;
        float ny = 300.0;
        float ns = 200.0;
        
        
        camera cam = camera(vec3(0.0), vec3(-4.0,-3.0,-1.0), vec3(8.0,0.0,0.0), vec3(0.0,6.0,0.0));
        vec3 colour = vec3(0.0);
        
        for (int s=0; s<int(ns); s++) {
            float u = (gl_FragCoord.x + rand()) / nx;
            float v = (gl_FragCoord.y + rand()) / ny;
            ray r = get_ray(cam, vec2(u,v));
           
            colour = colour + color(r);
         }
         
        colour = vec3(colour.x/ns, colour.y/ns, colour.z/ns);
	    outColor = vec4(sqrt(colour.x),sqrt(colour.y),sqrt(colour.z), 1.0);
	  }
`;


var glUtils = {
    loadShader: function (gl, type, source) {
        const shader = gl.createShader(type);

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            alert('Error compiling shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }

        return shader;
    },

    initShaderProgram: function (gl) {
        const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
        const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
        const shaderProgram = gl.createProgram();

        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Error initializing shader program: ' + gl.getProgramInfoLog(shaderProgram));
            return null;
        }

        return shaderProgram;
    },



    updateTexture: function (gl, texture, video) {
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, video);
    },

    initTexture: function (gl) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([255, 255, 255, 255]);  // opaque blue pixel
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        return texture;
    },

    loadTexture: function (gl, url) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        const level = 0;
        const internalFormat = gl.RGBA;
        const width = 1;
        const height = 1;
        const border = 0;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;
        const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue pixel
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel);

        const image = new Image();
        image.src = url;
        image.onload = function () {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image);

            if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
                // Yes, it's a power of 2. Generate mips.
                gl.generateMipmap(gl.TEXTURE_2D);
            } else {
                // No, it's not a power of 2. Turn off mips and set
                // wrapping to clamp to edge
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            }
        };

        function isPowerOf2(value) {
            return (value & (value - 1)) === 0;
        }

        return texture;
    }
};