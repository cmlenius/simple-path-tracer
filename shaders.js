const vsSource =
    `#version 300 es
      precision highp float;

      in vec2 vPos;
      
      void main() {
          gl_Position = vec4(vPos, 0.0, 1.0);
          
      }`;

const fsSource =
    `#version 300 es
    precision highp float;
    
    uniform vec2 viewportDimensions;
    uniform vec3 eye;
    uniform float sampleCount;
    out vec4 outColor;
 
    #define PI 3.14159265359
    #define MAX_FLOAT 1e5
    #define MAX_RECURSION 5
    #define LAMBERTIAN 0
    #define METAL 1
    #define DIELECTRIC 2
    #define MAX_OBJECTS 5
     
    /*
     * STRUCTS
     */
    
    struct camera {
        vec3 origin, lower_left_corner, horizontal, vertical;
    };
    
    struct ray {
        vec3 origin, direction;
    };
    
    struct material {
        int type;
        vec3 albedo;
        float v;
    };
    
    struct hit_record {
        float t;
        vec3 p, normal;
        material mat;
    };
    
    struct sphere {
        vec3 center;
        float radius;
        material mat;
    };
    
    /* 
     * PSUEDO RANDOM GENERATORS 
     */
     
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
             count++;
             if (count >= 100) return vec3(0.5);
        } while (p.x*p.x + p.y*p.y + p.z*p.z >= 1.0);
        count = 0;
        return p;
    }
    
    /* 
     * RAY TRACING 
     */
     
    vec3 reflection(in vec3 v, in vec3 n) {
        return v - 2.0 * dot(v,n) * n;
    }
    
    bool refraction(in vec3 v, in vec3 n, in float ni_over_nt, inout vec3 refracted) {
        vec3 uv = normalize(v);
        float dt = dot(uv, n);
        float discriminant = 1.0 - ni_over_nt * ni_over_nt * (1.0 - dt*dt);
        if (discriminant > 0.0) {
            refracted = ni_over_nt * (uv - n*dt) - n*sqrt(discriminant);
            return true;
        } 
        
        return false;
    }     
     
    float schlick(float cosine, float ior) {
        float r0 = (1.-ior)/(1.+ior);
        r0 = r0*r0;
        return r0 + (1.-r0)*pow((1.-cosine),5.);
    }
    
     
    bool mat_scatter(const in ray r, const in hit_record rec, out vec3 attenuation, out ray scattered) {
      if (rec.mat.type == LAMBERTIAN) {
          vec3 target = rec.p + rec.normal + random_in_unit_sphere();
          scattered = ray(rec.p, target - rec.p);
          attenuation = rec.mat.albedo;
          return true;
          
      } else if (rec.mat.type == METAL) {
          vec3 reflected = reflection(normalize(r.direction), rec.normal);
          scattered = ray(rec.p, reflected + rec.mat.v * random_in_unit_sphere());
          attenuation = rec.mat.albedo;
          return (dot(scattered.direction, rec.normal) > 0.0);
          
      } else if (rec.mat.type == DIELECTRIC) {
          vec3 outward_normal, refracted, reflected = reflection(r.direction, rec.normal);
          float ni_over_nt, reflect_prob, cosine;
          attenuation = vec3(1.0);
          
          if (dot(r.direction,rec.normal) > 0.0) {
              outward_normal = -1.0 * rec.normal;
              ni_over_nt = rec.mat.v;
              cosine = dot(r.direction, rec.normal);
              cosine = sqrt(1.0 - rec.mat.v*rec.mat.v * (1.0 - cosine*cosine));
          } else {
              outward_normal = rec.normal;
              ni_over_nt = 1.0 / rec.mat.v;
              cosine = -dot(r.direction, rec.normal);
          }
          
          if (refraction(r.direction, outward_normal, ni_over_nt, refracted)) { 
              reflect_prob = schlick(cosine, rec.mat.v);
          } else {
              scattered = ray(rec.p, reflected);
              reflect_prob = 1.0;
          }
          
          if (rand() < reflect_prob) {
              scattered = ray(rec.p, reflected);
          } else {
              scattered = ray(rec.p, refracted);
          }
          
          return true;
      }
      
      return false;
    }
    
    bool hit_sphere(const in sphere obj, const in ray r, in float t_min, in float t_max, inout hit_record rec) {
      vec3 oc = r.origin - obj.center;
      float a = dot(r.direction, r.direction);
      float b = dot(oc, r.direction);
      float c = dot(oc, oc) - obj.radius*obj.radius;
      float discriminant = b*b - a*c;
      if (discriminant > 0.0) {
          float tmp = (-1.0*b - sqrt(discriminant)) / a;
          if (tmp < t_max && tmp > t_min) {
              rec.t = tmp;
              rec.p = r.origin + rec.t*r.direction;
              rec.normal = (rec.p - obj.center) / obj.radius;
              return true;
          }
          tmp = (-1.0*b + sqrt(discriminant)) / a; 
          if (tmp < t_max && tmp > t_min) {
              rec.t = tmp;
              rec.p = r.origin + rec.t*r.direction;
              rec.normal = (rec.p - obj.center) / obj.radius;
              return true;
          }
      }
      return false;
    }
    

    bool hit_world(const in ray r, const in sphere[MAX_OBJECTS] objects, in float t_min, in float t_max, inout hit_record rec) {
        rec.t = t_max;
        bool hit = false;

        for(int i=0; i<objects.length(); i++) {
            if (hit_sphere(objects[i], r, t_min, rec.t, rec)) {
                hit = true;
                rec.mat = objects[i].mat;
            }
        }
        
        return hit;
    }
    
    vec3 color(in ray r, in sphere[MAX_OBJECTS] objects) {
        vec3 col = vec3(1.0);  
        hit_record rec;
        
        for (int i=0; i<MAX_RECURSION; i++) {
            if (hit_world(r, objects, 0.001, MAX_FLOAT, rec)) {
        	    ray scattered;
        	    vec3 attenuation;
        	    if (mat_scatter(r, rec, attenuation, scattered)) {
        	        col *= attenuation;
        	        r = scattered;
        	    } else {
        	        return vec3(.0);
        	    }
            } else {
                float t = 0.5 * r.direction.y + 0.5;
                col *= mix(vec3(1.0),vec3(0.5,0.7,1.0), t);
                return col;
        	}
        }
        return col;
    }
    
    sphere[MAX_OBJECTS] create_scene() {
        sphere objects[MAX_OBJECTS];
        objects[0] = sphere(vec3(0.0, -100.5, -1.0), 100.0, material(LAMBERTIAN , vec3(0.2, 0.2, 0.2), 0.05));
        objects[1] = sphere(vec3(-0.866, 0.0, 0.5), 0.5, material(METAL, vec3(0.7, 0.2, 0.2), 0.0));
        objects[2] = sphere(vec3(0.0, 0.0, -1.0), 0.5, material(METAL, vec3(0.2, 0.7, 0.2), 0.0));
        objects[3] = sphere(vec3(0.866, 0.0, 0.5), 0.5, material(METAL, vec3(0.2, 0.2, 0.7), 0.0));
        objects[4] = sphere(vec3(0.0, 1.0, 0.0), 0.5, material(METAL, vec3(0.5, 0.5, 0.5), 0.0));
         
        /* 
        for(int a=-2; a<2; a++) {
            for(int b=-2; b<2; b++) {
                float rand_mat = rand();
                vec3 rand_center = vec3(float(a) + 0.9 * rand(), 0.2, float(b) + 0.9 * rand());
                
                if (distance(rand_center, vec3(4.0, 0.2, 0.0)) > 0.9) {
                    if (rand_mat <= 0.99) { 
                        if (hit_sphere(sphere(rand_center, 0.2),r,t_min,rec.t,rec)) {
                            hit = true;
                            rec.mat = material(LAMBERTIAN, vec3(rand(),rand(),rand()) ,0.0);
                        }
                    } else if (rand_mat < 0.95) { 
                        if (hit_sphere(sphere(rand_center, 0.2),r,t_min,rec.t,rec)) {
                            hit = true;
                            rec.mat = material(METAL, vec3(rand(),rand(),rand()), rand());
                        }
                    } else { 
                        if (hit_sphere(sphere(rand_center, 0.2),r,t_min,rec.t,rec)) {
                            hit= true;
                            rec.mat = material(DIELECTRIC, vec3(0.0), 1.5);
                        }
                    }
                }
            }
        }
        */ 
        return objects;
    }

    ray get_ray(in camera cam, in vec2 uv) {
        return ray(cam.origin, normalize(cam.lower_left_corner + uv.x*cam.horizontal + uv.y*cam.vertical - cam.origin));
    }
    
    camera get_camera(in vec3 eye, in vec3 lookat, in vec3 vup, in float vfov, in float aspect) {
        vec3 x, y, z;
        camera cam;
        
        float theta = vfov * PI/180.0;
        float half_height = tan(theta/2.0);
        float half_width = aspect * half_height;
        
        z = normalize(eye - lookat);
        x = normalize(cross(vup, z));
        y = cross(z, x);
        
        cam.origin = eye;
        cam.lower_left_corner = cam.origin - half_width*x - half_height*y - z;
        cam.horizontal = 2.0 * half_width * x;
        cam.vertical = 2.0 * half_height * y;
        
        return cam;
    }
    
    void main() {
        float nx = viewportDimensions.x;
        float ny = viewportDimensions.y;
        float ns = sampleCount;
        
        camera cam = get_camera(eye, vec3(0.0,0.0,0.0), vec3(0.0,1.0,0.0), 90.0, nx/ny);
        vec3 col = vec3(0.0);

        sphere objects[MAX_OBJECTS] = create_scene();
        
        for (int s=0; s<int(ns); s++) {
            float u = (gl_FragCoord.x + rand()) / nx;
            float v = (gl_FragCoord.y + rand()) / ny;
            ray r = get_ray(cam, vec2(u,v));
           
            col += color(r, objects);
         }
         
        col = vec3(sqrt(col.x/ns), sqrt(col.y/ns), sqrt(col.z/ns));
        outColor = vec4(col, 1.0);
    }
`;
