// The logo grows on load: the spiral winds out from its center, then the
// vine-letters sprout from it with a glowing tip. Runs on the graphics chip
// (WebGL) so it stays smooth, then hands over to the crisp SVG logo.
(() => {
  const root = document.documentElement;
  const wrap = document.querySelector('.logo-wrap');
  const done = () => root.classList.add('logo-done');
  if (!wrap || !root.classList.contains('grow')) { done(); return; }

  const MAP = wrap.dataset.map;
  const TEX = 768, PAD = 35, ROWS = 698;   // must match build output of the growth map
  const DURATION = 4600;                   // ms

  const cv = document.createElement('canvas');
  cv.className = 'logo-grow';
  cv.setAttribute('aria-hidden', 'true');
  const gl = cv.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) { done(); return; }
  wrap.appendChild(cv);

  const VS = `attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.,1.); }`;
  const FS = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
    uniform sampler2D tex; uniform float T; uniform vec2 sc, off; varying vec2 v;
    void main(){
      vec2 uv = v * sc + off;
      vec4 s = texture2D(tex, uv);
      float t = s.r * (65280.0/65535.0) + s.g * (255.0/65535.0);
      float cov = s.b;
      float halo = 0.55 * texture2D(tex, uv, 3.0).b + 0.45 * texture2D(tex, uv, 5.0).b;
      float d = T - t;
      float rev = smoothstep(0.0, 0.007, d);
      float front = rev * exp(-d / 0.035);
      vec3 col = mix(vec3(0.933, 0.941, 0.902), vec3(0.82, 1.0, 0.64), clamp(front * 1.2, 0.0, 1.0));
      float a = cov * rev;
      float h = clamp(halo * rev * (0.22 + front * 1.4), 0.0, 1.0);
      vec3 rgb = col * a + vec3(0.70, 0.88, 0.58) * h * (1.0 - a);
      gl_FragColor = vec4(rgb, a + h * (1.0 - a) * 0.75);
    }`;
  function sh(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { cv.remove(); done(); return; }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); done(); return; }
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(prog, 'T');
  gl.uniform2f(gl.getUniformLocation(prog, 'sc'), 1, ROWS / TEX);
  gl.uniform2f(gl.getUniformLocation(prog, 'off'), 0, PAD / TEX);
  gl.clearColor(0, 0, 0, 0);

  function size() {
    const r = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.min(1600, Math.round(r.width * dpr));
    cv.height = Math.round(cv.width * ROWS / TEX);
    gl.viewport(0, 0, cv.width, cv.height);
  }

  const img = new Image();
  img.decoding = 'async';
  img.onerror = () => { cv.remove(); done(); };
  img.onload = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // Blurred glow needs mipmaps, which need a power-of-two size: stretch to 1024.
    const pot = document.createElement('canvas');
    pot.width = pot.height = 1024;
    const pctx = pot.getContext('2d');
    pctx.imageSmoothingQuality = 'high';
    pctx.drawImage(img, 0, 0, 1024, 1024);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, pot);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    size();
    addEventListener('resize', size);
    root.classList.add('logo-growing');
    let start = 0;
    const frame = (now) => {
      if (!start) start = now;
      const k = Math.min(1, (now - start) / DURATION);
      // slow, deliberate start for the spiral; the letters rush out after
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const T = e * 1.05;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uT, T);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (k < 1) requestAnimationFrame(frame);
      else {
        done();
        // let the crisp logo fade in over the canvas, then free the canvas
        setTimeout(() => {
          removeEventListener('resize', size);
          const lose = gl.getExtension('WEBGL_lose_context');
          cv.remove();
          if (lose) lose.loseContext();
        }, 1200);
      }
    };
    requestAnimationFrame(frame);
  };
  img.src = MAP;
})();
