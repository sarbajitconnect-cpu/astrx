//#region \0rolldown/runtime.js
var e = Object.defineProperty, t = (e, t, n) => () => {
	if (n) throw n[0];
	try {
		return e && (t = e(e = 0)), t;
	} catch (e) {
		throw n = [e], e;
	}
}, n = (t, n) => {
	let r = {};
	for (var i in t) e(r, i, {
		get: t[i],
		enumerable: !0
	});
	return n || e(r, Symbol.toStringTag, { value: "Module" }), r;
}, r = {
	version: 1,
	wgsl: "// vgsl-module: /Users/sounak/Documents/Astrx/optimized-black-hole/bake.wgsl\n// One-shot geodesic bake: store two disk crossings, the lensed sky, and view directions.\n\n        \n\nstruct _vgsl_8ae11f46__Bake {\n  resolution: vec2f,\n  yaw: f32,\n  pitch: f32,\n  orbitRadius: f32,\n  diskOuter: f32,\n  fov: f32,\n  centerX: f32,\n  centerY: f32,\n  roll: f32,\n}\n\n@group(0) @binding(0) var<uniform> bake: _vgsl_8ae11f46__Bake;\n\nconst _vgsl_8ae11f46__FLAG_HOLE: f32 = 1.0;\n\nconst _vgsl_8ae11f46__FLAG_ESCAPED: f32 = 2.0;\n\nstruct _vgsl_8ae11f46__GBuffer {\n  @location(0) hit1: vec2f,\n  @location(1) hit2: vec2f,\n  @location(2) sky: vec4f,\n  @location(3) view: vec4f,\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> _vgsl_8ae11f46__GBuffer {\n  let ray = _vgsl_03a22785__cameraRay(\n    uv,\n    bake.resolution,\n    bake.yaw,\n    bake.pitch,\n    bake.orbitRadius,\n    bake.fov,\n    bake.centerX,\n    bake.centerY,\n    bake.roll,\n  );\n  var traced = _vgsl_03a22785__traceRay(ray.position, ray.velocity, bake.diskOuter, _vgsl_03a22785__escapeRadiusFor(bake.orbitRadius));\n\n  if (traced.swallowed < 0.5 && traced.escaped < 0.5) {\n    traced.swallowed = 1.0;\n  }\n\n  return _vgsl_8ae11f46__GBuffer(\n    traced.hit1Plane,\n    traced.hit2Plane,\n    vec4f(traced.finalVelocity, traced.swallowed * _vgsl_8ae11f46__FLAG_HOLE + traced.escaped * _vgsl_8ae11f46__FLAG_ESCAPED),\n    vec4f(traced.hit1Direction, traced.hit2Direction),\n  );\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/optimized-black-hole/geodesic.wgsl\n// Shared Schwarzschild-like ray integration used by the bake and refinement passes.\n\n const _vgsl_03a22785__HORIZON: f32 = 1.0;\n\n const _vgsl_03a22785__ISCO: f32 = 3.0;\n\n const _vgsl_03a22785__MAX_STEPS: i32 = 768;\n\n struct _vgsl_03a22785__TraceResult {\n  hit1Plane: vec2f,\n  hit1Direction: vec2f,\n  hit2Plane: vec2f,\n  hit2Direction: vec2f,\n  hitCount: i32,\n  swallowed: f32,\n  escaped: f32,\n\n  finalVelocity: vec3f,\n}\n\n struct _vgsl_03a22785__CameraRay {\n  position: vec3f,\n  velocity: vec3f,\n}\n\n fn _vgsl_03a22785__escapeRadiusFor(orbitRadius: f32) -> f32 {\n  return max(120.0, orbitRadius + 8.0);\n}\n\n fn _vgsl_03a22785__encodeDirection(direction: vec3f) -> vec2f {\n  return vec2f(direction.y, atan2(direction.z, direction.x));\n}\n\nfn _vgsl_03a22785__geodesicAcceleration(position: vec3f, velocity: vec3f) -> vec3f {\n  let r2 = max(dot(position, position), 0.0001);\n  let angularMomentum = cross(position, velocity);\n  let h2 = dot(angularMomentum, angularMomentum);\n  return -1.5 * h2 * position / (r2 * r2 * sqrt(r2));\n}\n\n fn _vgsl_03a22785__cameraRay(\n  uv: vec2f,\n  resolution: vec2f,\n  yaw: f32,\n  pitch: f32,\n  orbitRadius: f32,\n  fov: f32,\n  centerX: f32,\n  centerY: f32,\n  roll: f32,\n) -> _vgsl_03a22785__CameraRay {\n  let aspect = resolution.x / max(resolution.y, 1.0);\n  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);\n  let screenPlane = (ndc - vec2f(centerX, centerY)) * vec2f(aspect, 1.0);\n  let cosine = cos(roll);\n  let sine = sin(roll);\n  let screen = vec2f(\n    screenPlane.x * cosine - screenPlane.y * sine,\n    screenPlane.x * sine + screenPlane.y * cosine,\n  );\n\n  let clampedPitch = clamp(pitch, -1.319, 1.319);\n  let cameraPosition = vec3f(\n    sin(yaw) * cos(clampedPitch) * orbitRadius,\n    sin(clampedPitch) * orbitRadius,\n    cos(yaw) * cos(clampedPitch) * orbitRadius,\n  );\n  let forward = normalize(vec3f(0.0) - cameraPosition);\n  let right = normalize(cross(forward, vec3f(0.0, 1.0, 0.0)));\n  let up = cross(right, forward);\n\n  var ray: _vgsl_03a22785__CameraRay;\n  ray.position = cameraPosition;\n  ray.velocity = normalize(forward * fov + right * screen.x + up * screen.y);\n  return ray;\n}\n\n fn _vgsl_03a22785__traceRay(cameraPosition: vec3f, initialVelocity: vec3f, diskOuter: f32, escapeRadius: f32) -> _vgsl_03a22785__TraceResult {\n  var position = cameraPosition;\n  var velocity = initialVelocity;\n\n  var result: _vgsl_03a22785__TraceResult;\n  result.hit1Plane = vec2f(0.0);\n  result.hit1Direction = vec2f(0.0);\n  result.hit2Plane = vec2f(0.0);\n  result.hit2Direction = vec2f(0.0);\n  result.hitCount = 0;\n  result.swallowed = 0.0;\n  result.escaped = 0.0;\n\n  for (var stepIndex = 0; stepIndex < _vgsl_03a22785__MAX_STEPS; stepIndex++) {\n    let radius = length(position);\n    if (radius < _vgsl_03a22785__HORIZON * 1.004) {\n      result.swallowed = 1.0;\n      break;\n    }\n    if (radius > escapeRadius && dot(position, velocity) > 0.0) {\n      result.escaped = 1.0;\n      break;\n    }\n\n    let stepSize = clamp((radius - _vgsl_03a22785__HORIZON) * 0.035, 0.0045, 0.075 * max(1.0, radius / 6.0));\n\n    let previousPosition = position;\n    let previousVelocity = velocity;\n\n    let acceleration0 = _vgsl_03a22785__geodesicAcceleration(position, velocity);\n    velocity += acceleration0 * (0.5 * stepSize);\n    position += velocity * stepSize;\n    let acceleration1 = _vgsl_03a22785__geodesicAcceleration(position, velocity);\n    velocity += acceleration1 * (0.5 * stepSize);\n    velocity = normalize(velocity);\n\n    if (result.hitCount < 2) {\n      let previousSide = select(-1.0, 1.0, previousPosition.y >= 0.0);\n      let currentSide = select(-1.0, 1.0, position.y >= 0.0);\n      if (previousSide != currentSide) {\n        let t = clamp(previousPosition.y / (previousPosition.y - position.y), 0.0, 1.0);\n        let crossing = mix(previousPosition, position, t);\n        let planeRadius = length(crossing.xz);\n        if (planeRadius >= _vgsl_03a22785__ISCO && planeRadius <= diskOuter) {\n          let direction = _vgsl_03a22785__encodeDirection(normalize(mix(previousVelocity, velocity, t)));\n          if (result.hitCount == 0) {\n            result.hit1Plane = crossing.xz;\n            result.hit1Direction = direction;\n          } else {\n            result.hit2Plane = crossing.xz;\n            result.hit2Direction = direction;\n          }\n          result.hitCount += 1;\n        }\n      }\n    }\n  }\n\n  result.finalVelocity = velocity;\n  return result;\n}\n",
	functionExports: [
		{
			name: "escapeRadiusFor",
			resolvedName: "_vgsl_03a22785__escapeRadiusFor",
			parameterNames: ["orbitRadius"]
		},
		{
			name: "encodeDirection",
			resolvedName: "_vgsl_03a22785__encodeDirection",
			parameterNames: ["direction"]
		},
		{
			name: "cameraRay",
			resolvedName: "_vgsl_03a22785__cameraRay",
			parameterNames: [
				"uv",
				"resolution",
				"yaw",
				"pitch",
				"orbitRadius",
				"fov",
				"centerX",
				"centerY",
				"roll"
			]
		},
		{
			name: "traceRay",
			resolvedName: "_vgsl_03a22785__traceRay",
			parameterNames: [
				"cameraPosition",
				"initialVelocity",
				"diskOuter",
				"escapeRadius"
			]
		}
	]
}, i = {
	version: 1,
	wgsl: "// HDR bloom downsample and separable Gaussian blur.\n\nstruct Bloom {\n  sourceSize: vec2f,\n  direction: vec2f,\n  params: vec4f,\n}\n\n@group(0) @binding(0) var<uniform> bloom: Bloom;\n@group(0) @binding(1) var source: texture_2d<f32>;\n@group(0) @binding(2) var linearSampler: sampler;\n\nfn softThreshold(color: vec3f) -> vec3f {\n  let threshold = bloom.params.x;\n  if (threshold <= 0.0) {\n    return color;\n  }\n\n  let brightness = dot(color, vec3f(0.2126, 0.7152, 0.0722));\n  let knee = max(min(bloom.params.y, threshold), 0.000001);\n  let soft = clamp(brightness - threshold + knee, 0.0, 2.0 * knee);\n  let softContribution = soft * soft / (4.0 * knee + 0.0001);\n  let contribution = max(brightness - threshold, softContribution) / max(brightness, 0.0001);\n  return color * contribution;\n}\n\nfn downsample(uv: vec2f) -> vec3f {\n  let texel = 1.0 / bloom.sourceSize;\n  let offset = texel * 0.5;\n  let color = (\n    textureSample(source, linearSampler, uv + vec2f(-offset.x, -offset.y)).rgb +\n    textureSample(source, linearSampler, uv + vec2f( offset.x, -offset.y)).rgb +\n    textureSample(source, linearSampler, uv + vec2f(-offset.x,  offset.y)).rgb +\n    textureSample(source, linearSampler, uv + vec2f( offset.x,  offset.y)).rgb\n  ) * 0.25;\n  return softThreshold(color);\n}\n\nfn gaussianBlur(uv: vec2f) -> vec3f {\n  let sigma = max(bloom.params.z, 0.5);\n  let inverseTwoSigmaSquared = 0.5 / (sigma * sigma);\n  let w0 = 1.0;\n  let w1 = exp(-1.0 * inverseTwoSigmaSquared);\n  let w2 = exp(-4.0 * inverseTwoSigmaSquared);\n  let w3 = exp(-9.0 * inverseTwoSigmaSquared);\n  let w4 = exp(-16.0 * inverseTwoSigmaSquared);\n\n  let pair12 = w1 + w2;\n  let pair34 = w3 + w4;\n  let offset12 = (w1 + 2.0 * w2) / max(pair12, 0.000001);\n  let offset34 = (3.0 * w3 + 4.0 * w4) / max(pair34, 0.000001);\n  let normalization = w0 + 2.0 * (pair12 + pair34);\n  let texel = bloom.direction / bloom.sourceSize;\n\n  var color = textureSample(source, linearSampler, uv).rgb * w0;\n  color += textureSample(source, linearSampler, uv + texel * offset12).rgb * pair12;\n  color += textureSample(source, linearSampler, uv - texel * offset12).rgb * pair12;\n  color += textureSample(source, linearSampler, uv + texel * offset34).rgb * pair34;\n  color += textureSample(source, linearSampler, uv - texel * offset34).rgb * pair34;\n  return color / normalization;\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {\n  var color: vec3f;\n  if (bloom.params.w > 0.5) {\n    color = gaussianBlur(uv);\n  } else {\n    color = downsample(uv);\n  }\n  return vec4f(color, 1.0);\n}\n",
	functionExports: []
}, a = {
	version: 1,
	wgsl: "// Combine bloom levels, tone map, vignette, and convert to display output.\n\nstruct Composite {\n  params: vec4f,\n}\n\n@group(0) @binding(0) var<uniform> composite: Composite;\n@group(0) @binding(1) var scene: texture_2d<f32>;\n@group(0) @binding(2) var bloomNear: texture_2d<f32>;\n@group(0) @binding(3) var bloomMedium: texture_2d<f32>;\n@group(0) @binding(4) var bloomFar: texture_2d<f32>;\n@group(0) @binding(5) var linearSampler: sampler;\n\nconst EXPOSURE: f32 = 1.15;\nconst SATURATION: f32 = 0.0;\n\nfn aces(x: vec3f) -> vec3f {\n  let a = 2.51;\n  let b = 0.03;\n  let c = 2.43;\n  let d = 0.59;\n  let e = 0.14;\n  return clamp((x * (a * x + vec3f(b))) / (x * (c * x + vec3f(d)) + vec3f(e)), vec3f(0.0), vec3f(1.0));\n}\n\nfn tonemap(linearColor: vec3f, uv: vec2f) -> vec3f {\n  var color = aces(linearColor * EXPOSURE);\n\n  let centered = uv - vec2f(0.5);\n  let vignette = 1.0 - smoothstep(0.55, 1.15, length(centered) * 1.6);\n  color *= mix(0.72, 1.0, vignette);\n\n  color = pow(color, vec3f(1.0 / 2.2));\n  let luma = dot(color, vec3f(0.2126, 0.7152, 0.0722));\n  return mix(vec3f(luma), color, SATURATION);\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {\n  let sceneColor = textureSample(scene, linearSampler, uv).rgb;\n  let bloom =\n    textureSample(bloomNear, linearSampler, uv).rgb * 0.50 +\n    textureSample(bloomMedium, linearSampler, uv).rgb * 0.32 +\n    textureSample(bloomFar, linearSampler, uv).rgb * 0.18;\n  let hdr = sceneColor + bloom * composite.params.x;\n  return vec4f(tonemap(hdr, uv), 1.0);\n}\n",
	functionExports: []
}, o = "r8unorm", s = 13, c = Math.fround, l = (e) => c(e - Math.floor(e)), u = c(.1031), d = c(.103), f = c(.0973), p = c(33.33);
function m(e, t, n) {
	let r = l(c(e * u)), i = l(c(t * d)), a = l(c(n * f)), o = c(c(c(r * c(i + p)) + c(i * c(a + p))) + c(a * c(r + p)));
	return r = c(r + o), i = c(i + o), a = c(a + o), l(c(c(r + i) * a));
}
function h(e, t) {
	return e < t / 2 ? e : e - t;
}
function g(e, t) {
	let n = new Uint8Array(e * e * e), r = t * 1024, i = 0;
	for (let t = 0; t < e; t++) {
		let a = h(t, e) + r;
		for (let t = 0; t < e; t++) {
			let r = h(t, e);
			for (let t = 0; t < e; t++) n[i++] = Math.min(255, Math.round(m(h(t, e), r, a) * 255));
		}
	}
	return n;
}
var _ = /* @__PURE__ */ new Map();
function v(e, t) {
	let n = `${e}:${t}`, r = _.get(n);
	return r || (r = g(e, t), _.set(n, r)), r;
}
function y(e, t = 64, n = "black-hole-noise") {
	let r = e.device.createTexture({
		kind: "3d",
		size: [
			t,
			t,
			t
		],
		format: o,
		usage: ["texture_binding", "copy_dst"],
		label: n
	});
	try {
		return e.gpu.queue.writeTexture({ texture: r.gpu }, v(t, s), {
			offset: 0,
			bytesPerRow: t,
			rowsPerImage: t
		}, {
			width: t,
			height: t,
			depthOrArrayLayers: t
		}), r;
	} catch (e) {
		try {
			r.destroy();
		} catch {}
		throw e;
	}
}
function ee(e, t) {
	return e.sampler(t, {
		addressModeU: "repeat",
		addressModeV: "repeat",
		addressModeW: "repeat",
		minFilter: "linear",
		magFilter: "linear"
	});
}
//#endregion
//#region optimized-black-hole/refine.wgsl
var b = {
	version: 1,
	wgsl: "// vgsl-module: /Users/sounak/Documents/Astrx/optimized-black-hole/refine.wgsl\n// One-shot photon-ring refinement: measure sub-pixel coverage and synthesize missed crossings.\n\n          \n\nstruct _vgsl_03789845__Refine {\n  resolution: vec2f,\n  yaw: f32,\n  pitch: f32,\n  orbitRadius: f32,\n  diskOuter: f32,\n  fov: f32,\n  centerX: f32,\n  centerY: f32,\n  roll: f32,\n}\n\n@group(0) @binding(0) var<uniform> refine: _vgsl_03789845__Refine;\n\n@group(0) @binding(1) var gHit1: texture_2d<f32>;\n\n@group(0) @binding(2) var gSky: texture_2d<f32>;\n\nconst _vgsl_03789845__SUB_STEPS: i32 = 4;\n\nconst _vgsl_03789845__MASK_RADIUS: i32 = 2;\n\nconst _vgsl_03789845__GRADIENT_LIMIT: f32 = 0.12;\n\nconst _vgsl_03789845__B_CRIT: f32 = 2.59807621;\n\nconst _vgsl_03789845__CRITICAL_BAND: f32 = 0.06;\n\nfn _vgsl_03789845__isHitAt(plane: vec2f) -> bool {\n  return length(plane) > _vgsl_03a22785__ISCO * 0.5;\n}\n\nstruct _vgsl_03789845__RefineOut {\n  @location(0) coverage: vec2f,\n  @location(1) geometry: vec4f,\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> _vgsl_03789845__RefineOut {\n  let dimensions = vec2i(textureDimensions(gHit1, 0));\n  let texel = vec2i(clamp(uv * refine.resolution, vec2f(0.0), refine.resolution - vec2f(1.0)));\n  let annulus = max(refine.diskOuter - _vgsl_03a22785__ISCO, 0.001);\n\n  let centerPlane = textureLoad(gHit1, texel, 0).xy;\n  let centerHit = _vgsl_03789845__isHitAt(centerPlane);\n  let centerHole = (i32(textureLoad(gSky, texel, 0).w + 0.5) & 1) != 0;\n  let centerRadiusNorm = clamp((length(centerPlane) - _vgsl_03a22785__ISCO) / annulus, 0.0, 1.0);\n\n  let centerRay = _vgsl_03a22785__cameraRay(\n    uv,\n    refine.resolution,\n    refine.yaw,\n    refine.pitch,\n    refine.orbitRadius,\n    refine.fov,\n    refine.centerX,\n    refine.centerY,\n    refine.roll,\n  );\n  let impactParameter = length(cross(centerRay.position, centerRay.velocity));\n\n  var boundary = abs(impactParameter - _vgsl_03789845__B_CRIT) < _vgsl_03789845__CRITICAL_BAND * _vgsl_03a22785__HORIZON;\n  for (var dy = -_vgsl_03789845__MASK_RADIUS; dy <= _vgsl_03789845__MASK_RADIUS; dy++) {\n    for (var dx = -_vgsl_03789845__MASK_RADIUS; dx <= _vgsl_03789845__MASK_RADIUS; dx++) {\n      let neighbor = clamp(texel + vec2i(dx, dy), vec2i(0), dimensions - vec2i(1));\n      let plane = textureLoad(gHit1, neighbor, 0).xy;\n      let hit = _vgsl_03789845__isHitAt(plane);\n      let hole = (i32(textureLoad(gSky, neighbor, 0).w + 0.5) & 1) != 0;\n      if (hit != centerHit || hole != centerHole) {\n        boundary = true;\n      }\n      if (hit && centerHit) {\n        let radiusNorm = clamp((length(plane) - _vgsl_03a22785__ISCO) / annulus, 0.0, 1.0);\n        if (abs(radiusNorm - centerRadiusNorm) > _vgsl_03789845__GRADIENT_LIMIT) {\n          boundary = true;\n        }\n      }\n    }\n  }\n\n  if (!boundary) {\n    return _vgsl_03789845__RefineOut(vec2f(select(0.0, 1.0, centerHit), 0.0), vec4f(0.0));\n  }\n\n  let escapeRadius = _vgsl_03a22785__escapeRadiusFor(refine.orbitRadius);\n  var hits = 0.0;\n  var minRadius = 1e9;\n  var maxRadius = -1e9;\n  var bestPlane = vec2f(0.0);\n  var bestDirection = vec2f(0.0);\n  var bestRadius = 0.0;\n  var bestDistance = 1e9;\n  for (var sy = 0; sy < _vgsl_03789845__SUB_STEPS; sy++) {\n    for (var sx = 0; sx < _vgsl_03789845__SUB_STEPS; sx++) {\n      let offset = (vec2f(f32(sx), f32(sy)) + vec2f(0.5)) / f32(_vgsl_03789845__SUB_STEPS);\n      let subUv = (vec2f(texel) + offset) / refine.resolution;\n      let ray = _vgsl_03a22785__cameraRay(\n        subUv,\n        refine.resolution,\n        refine.yaw,\n        refine.pitch,\n        refine.orbitRadius,\n        refine.fov,\n        refine.centerX,\n        refine.centerY,\n        refine.roll,\n      );\n      let traced = _vgsl_03a22785__traceRay(ray.position, ray.velocity, refine.diskOuter, escapeRadius);\n      if (traced.hitCount > 0) {\n        let radius = length(traced.hit1Plane);\n        hits += 1.0;\n        minRadius = min(minRadius, radius);\n        maxRadius = max(maxRadius, radius);\n        let distance = length(offset - vec2f(0.5));\n        if (distance < bestDistance) {\n          bestDistance = distance;\n          bestPlane = traced.hit1Plane;\n          bestDirection = traced.hit1Direction;\n          bestRadius = radius;\n        }\n      }\n    }\n  }\n\n  let coverage = hits / f32(_vgsl_03789845__SUB_STEPS * _vgsl_03789845__SUB_STEPS);\n  if (hits < 0.5) {\n    return _vgsl_03789845__RefineOut(vec2f(0.0, 0.0), vec4f(0.0));\n  }\n\n  var r0 = length(centerPlane);\n  var span = 0.0;\n  var geometry = vec4f(0.0);\n  if (centerHit) {\n    span = 2.0 * max(abs(maxRadius - r0), abs(r0 - minRadius));\n  } else {\n    r0 = 0.5 * (minRadius + maxRadius);\n    span = maxRadius - minRadius;\n    geometry = vec4f(bestPlane * (r0 / max(bestRadius, _vgsl_03a22785__ISCO)), bestDirection);\n  }\n  return _vgsl_03789845__RefineOut(vec2f(coverage, clamp(span / annulus, 0.0, 1.0)), geometry);\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/optimized-black-hole/geodesic.wgsl\n// Shared Schwarzschild-like ray integration used by the bake and refinement passes.\n\n const _vgsl_03a22785__HORIZON: f32 = 1.0;\n\n const _vgsl_03a22785__ISCO: f32 = 3.0;\n\n const _vgsl_03a22785__MAX_STEPS: i32 = 768;\n\n struct _vgsl_03a22785__TraceResult {\n  hit1Plane: vec2f,\n  hit1Direction: vec2f,\n  hit2Plane: vec2f,\n  hit2Direction: vec2f,\n  hitCount: i32,\n  swallowed: f32,\n  escaped: f32,\n\n  finalVelocity: vec3f,\n}\n\n struct _vgsl_03a22785__CameraRay {\n  position: vec3f,\n  velocity: vec3f,\n}\n\n fn _vgsl_03a22785__escapeRadiusFor(orbitRadius: f32) -> f32 {\n  return max(120.0, orbitRadius + 8.0);\n}\n\n fn _vgsl_03a22785__encodeDirection(direction: vec3f) -> vec2f {\n  return vec2f(direction.y, atan2(direction.z, direction.x));\n}\n\nfn _vgsl_03a22785__geodesicAcceleration(position: vec3f, velocity: vec3f) -> vec3f {\n  let r2 = max(dot(position, position), 0.0001);\n  let angularMomentum = cross(position, velocity);\n  let h2 = dot(angularMomentum, angularMomentum);\n  return -1.5 * h2 * position / (r2 * r2 * sqrt(r2));\n}\n\n fn _vgsl_03a22785__cameraRay(\n  uv: vec2f,\n  resolution: vec2f,\n  yaw: f32,\n  pitch: f32,\n  orbitRadius: f32,\n  fov: f32,\n  centerX: f32,\n  centerY: f32,\n  roll: f32,\n) -> _vgsl_03a22785__CameraRay {\n  let aspect = resolution.x / max(resolution.y, 1.0);\n  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);\n  let screenPlane = (ndc - vec2f(centerX, centerY)) * vec2f(aspect, 1.0);\n  let cosine = cos(roll);\n  let sine = sin(roll);\n  let screen = vec2f(\n    screenPlane.x * cosine - screenPlane.y * sine,\n    screenPlane.x * sine + screenPlane.y * cosine,\n  );\n\n  let clampedPitch = clamp(pitch, -1.319, 1.319);\n  let cameraPosition = vec3f(\n    sin(yaw) * cos(clampedPitch) * orbitRadius,\n    sin(clampedPitch) * orbitRadius,\n    cos(yaw) * cos(clampedPitch) * orbitRadius,\n  );\n  let forward = normalize(vec3f(0.0) - cameraPosition);\n  let right = normalize(cross(forward, vec3f(0.0, 1.0, 0.0)));\n  let up = cross(right, forward);\n\n  var ray: _vgsl_03a22785__CameraRay;\n  ray.position = cameraPosition;\n  ray.velocity = normalize(forward * fov + right * screen.x + up * screen.y);\n  return ray;\n}\n\n fn _vgsl_03a22785__traceRay(cameraPosition: vec3f, initialVelocity: vec3f, diskOuter: f32, escapeRadius: f32) -> _vgsl_03a22785__TraceResult {\n  var position = cameraPosition;\n  var velocity = initialVelocity;\n\n  var result: _vgsl_03a22785__TraceResult;\n  result.hit1Plane = vec2f(0.0);\n  result.hit1Direction = vec2f(0.0);\n  result.hit2Plane = vec2f(0.0);\n  result.hit2Direction = vec2f(0.0);\n  result.hitCount = 0;\n  result.swallowed = 0.0;\n  result.escaped = 0.0;\n\n  for (var stepIndex = 0; stepIndex < _vgsl_03a22785__MAX_STEPS; stepIndex++) {\n    let radius = length(position);\n    if (radius < _vgsl_03a22785__HORIZON * 1.004) {\n      result.swallowed = 1.0;\n      break;\n    }\n    if (radius > escapeRadius && dot(position, velocity) > 0.0) {\n      result.escaped = 1.0;\n      break;\n    }\n\n    let stepSize = clamp((radius - _vgsl_03a22785__HORIZON) * 0.035, 0.0045, 0.075 * max(1.0, radius / 6.0));\n\n    let previousPosition = position;\n    let previousVelocity = velocity;\n\n    let acceleration0 = _vgsl_03a22785__geodesicAcceleration(position, velocity);\n    velocity += acceleration0 * (0.5 * stepSize);\n    position += velocity * stepSize;\n    let acceleration1 = _vgsl_03a22785__geodesicAcceleration(position, velocity);\n    velocity += acceleration1 * (0.5 * stepSize);\n    velocity = normalize(velocity);\n\n    if (result.hitCount < 2) {\n      let previousSide = select(-1.0, 1.0, previousPosition.y >= 0.0);\n      let currentSide = select(-1.0, 1.0, position.y >= 0.0);\n      if (previousSide != currentSide) {\n        let t = clamp(previousPosition.y / (previousPosition.y - position.y), 0.0, 1.0);\n        let crossing = mix(previousPosition, position, t);\n        let planeRadius = length(crossing.xz);\n        if (planeRadius >= _vgsl_03a22785__ISCO && planeRadius <= diskOuter) {\n          let direction = _vgsl_03a22785__encodeDirection(normalize(mix(previousVelocity, velocity, t)));\n          if (result.hitCount == 0) {\n            result.hit1Plane = crossing.xz;\n            result.hit1Direction = direction;\n          } else {\n            result.hit2Plane = crossing.xz;\n            result.hit2Direction = direction;\n          }\n          result.hitCount += 1;\n        }\n      }\n    }\n  }\n\n  result.finalVelocity = velocity;\n  return result;\n}\n",
	functionExports: [
		{
			name: "escapeRadiusFor",
			resolvedName: "_vgsl_03a22785__escapeRadiusFor",
			parameterNames: ["orbitRadius"]
		},
		{
			name: "encodeDirection",
			resolvedName: "_vgsl_03a22785__encodeDirection",
			parameterNames: ["direction"]
		},
		{
			name: "cameraRay",
			resolvedName: "_vgsl_03a22785__cameraRay",
			parameterNames: [
				"uv",
				"resolution",
				"yaw",
				"pitch",
				"orbitRadius",
				"fov",
				"centerX",
				"centerY",
				"roll"
			]
		},
		{
			name: "traceRay",
			resolvedName: "_vgsl_03a22785__traceRay",
			parameterNames: [
				"cameraPosition",
				"initialVelocity",
				"diskOuter",
				"escapeRadius"
			]
		}
	]
}, x = {
	version: 1,
	wgsl: "// vgsl-module: /Users/sounak/Documents/Astrx/optimized-black-hole/shade.wgsl\n// Per-frame shading: decode the bake, shade stars and disk layers, then composite them.\n\n           \n        \n      \n\nstruct _vgsl_9b9a4da2__Shade {\n  resolution: vec2f,\n  time: f32,\n  diskOuter: f32,\n  sceneYaw: f32,\n  centerFade: f32,\n}\n\nconst _vgsl_9b9a4da2__DISK_GAIN: f32 = 1.35;\n\nfn _vgsl_9b9a4da2__centeredCopyFade(uvY: f32) -> f32 {\n  let distanceFromCenter = abs(uvY - 0.5);\n  return pow(smoothstep(0.08, 0.38, distanceFromCenter), 2.2);\n}\n\n@group(0) @binding(0) var<uniform> shade: _vgsl_9b9a4da2__Shade;\n@group(0) @binding(1) var gHit1: texture_2d<f32>;\n@group(0) @binding(2) var gHit2: texture_2d<f32>;\n@group(0) @binding(3) var gSky: texture_2d<f32>;\n@group(0) @binding(4) var gView: texture_2d<f32>;\n@group(0) @binding(5) var<uniform> disk: _vgsl_a8cf4048__DiskLook;\n@group(0) @binding(6) var<uniform> stars: _vgsl_ea21f6a6__StarLook;\n\n@group(0) @binding(7) var noiseVolume: texture_3d<f32>;\n@group(0) @binding(8) var noiseSampler: sampler;\n\n@group(0) @binding(9) var gAa: texture_2d<f32>;\n\n@group(0) @binding(10) var gAaGeom: texture_2d<f32>;\n\nfn _vgsl_9b9a4da2__diskFootprintAxes(g: _vgsl_95c7f85b__GBufferSample) -> vec2f {\n  let angular = max(disk.stretch, 0.05);\n  let noiseAngle = g.diskPolar.y\n    - min(shade.time, _vgsl_a8cf4048__SHEAR_PERIOD * 0.5) * (disk.speed * 0.55 / pow(g.diskPolar.x, 1.5));\n  let noiseCoords = vec3f(\n    cos(noiseAngle) * angular,\n    sin(noiseAngle) * angular,\n    g.diskPolar.x * disk.detail,\n  );\n  return vec2f(\n    max(fwidth(noiseCoords.x), fwidth(noiseCoords.y)),\n    fwidth(noiseCoords.z),\n  );\n}\n\nfn _vgsl_9b9a4da2__diskFootprint(axes: vec2f) -> f32 {\n  return min(max(axes.x, axes.y), 4.0);\n}\n\nfn _vgsl_9b9a4da2__rotateY(v: vec3f, angle: f32) -> vec3f {\n  let c = cos(angle);\n  let s = sin(angle);\n  return vec3f(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);\n}\n\nfn _vgsl_9b9a4da2__wrapAngle(angle: f32) -> f32 {\n  return angle - _vgsl_95c7f85b__TAU * floor((angle + _vgsl_95c7f85b__PI_CONST) / _vgsl_95c7f85b__TAU);\n}\n\nfn _vgsl_9b9a4da2__rotateSample(g: _vgsl_95c7f85b__GBufferSample, angle: f32) -> _vgsl_95c7f85b__GBufferSample {\n  var rotated = g;\n  rotated.position = _vgsl_9b9a4da2__rotateY(g.position, angle);\n  rotated.viewDirection = _vgsl_9b9a4da2__rotateY(g.viewDirection, angle);\n  rotated.rayDirection = _vgsl_9b9a4da2__rotateY(g.rayDirection, angle);\n  let azimuth = _vgsl_9b9a4da2__wrapAngle(g.diskPolar.y - angle);\n  rotated.diskPolar = vec2f(g.diskPolar.x, azimuth);\n  rotated.diskUv = vec2f(g.diskUv.x, (azimuth + _vgsl_95c7f85b__PI_CONST) / _vgsl_95c7f85b__TAU);\n  return rotated;\n}\n\nfn _vgsl_9b9a4da2__rotateLayers(layers: _vgsl_95c7f85b__GBufferLayers, angle: f32) -> _vgsl_95c7f85b__GBufferLayers {\n  var rotated: _vgsl_95c7f85b__GBufferLayers;\n  rotated.front = _vgsl_9b9a4da2__rotateSample(layers.front, angle);\n  rotated.back = _vgsl_9b9a4da2__rotateSample(layers.back, angle);\n  return rotated;\n}\n\nconst _vgsl_9b9a4da2__AA_TAPS: i32 = 6;\n\nconst _vgsl_9b9a4da2__AA_SPAN_MIN: f32 = 0.15;\n\nfn _vgsl_9b9a4da2__shadeFront(g: _vgsl_95c7f85b__GBufferSample, footprint: f32, angularFootprint: f32) -> _vgsl_a8cf4048__DiskSample {\n  let annulus = max(shade.diskOuter - _vgsl_95c7f85b__ISCO, 0.001);\n  let spanWorld = g.span * annulus;\n  if (g.span <= _vgsl_9b9a4da2__AA_SPAN_MIN) {\n    return _vgsl_a8cf4048__shadeDisk(g, disk, shade.time, footprint, noiseVolume, noiseSampler);\n  }\n\n  let tapFootprint = min(max(angularFootprint, max(disk.detail, 0.05) * (spanWorld / f32(_vgsl_9b9a4da2__AA_TAPS))), 4.0);\n  let step = spanWorld / f32(_vgsl_9b9a4da2__AA_TAPS);\n  let start = g.diskPolar.x - spanWorld * 0.5;\n\n  var sumEmission = vec3f(0.0);\n  var sumAlpha = 0.0;\n  var taps = 0.0;\n  for (var i = 0; i < _vgsl_9b9a4da2__AA_TAPS; i++) {\n    let radius = start + (f32(i) + 0.5) * step;\n    if (radius < _vgsl_95c7f85b__ISCO || radius > shade.diskOuter) {\n      continue;\n    }\n    let tap = _vgsl_a8cf4048__shadeDisk(\n      _vgsl_95c7f85b__sampleAtRadius(g, radius, shade.diskOuter), disk, shade.time,\n      tapFootprint, noiseVolume, noiseSampler,\n    );\n    sumEmission += tap.color * tap.alpha;\n    sumAlpha += tap.alpha;\n    taps += 1.0;\n  }\n  if (taps < 0.5) {\n    return _vgsl_a8cf4048__shadeDisk(g, disk, shade.time, footprint, noiseVolume, noiseSampler);\n  }\n\n  var sample: _vgsl_a8cf4048__DiskSample;\n  let meanAlpha = sumAlpha / taps;\n  sample.alpha = meanAlpha;\n  sample.color = select(vec3f(0.0), (sumEmission / taps) / max(meanAlpha, 1e-6), meanAlpha > 1e-6);\n  return sample;\n}\n\nfn _vgsl_9b9a4da2__emptyDiskSample() -> _vgsl_a8cf4048__DiskSample {\n  var sample: _vgsl_a8cf4048__DiskSample;\n  sample.color = vec3f(0.0);\n  sample.alpha = 0.0;\n  return sample;\n}\n\nfn _vgsl_9b9a4da2__compositeDisk(under: vec3f, sample: _vgsl_a8cf4048__DiskSample) -> vec3f {\n  return sample.color * sample.alpha * _vgsl_9b9a4da2__DISK_GAIN + under * (1.0 - sample.alpha);\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {\n  let dimensions = vec2f(textureDimensions(gHit1, 0));\n  let texel = vec2i(clamp(uv * dimensions, vec2f(0.0), dimensions - vec2f(1.0)));\n\n  let aa = textureLoad(gAa, texel, 0).xy;\n  let aaGeom = textureLoad(gAaGeom, texel, 0);\n\n  let baked = _vgsl_95c7f85b__decodeGBuffer(\n    textureLoad(gHit1, texel, 0).xy,\n    textureLoad(gHit2, texel, 0).xy,\n    textureLoad(gSky, texel, 0),\n    textureLoad(gView, texel, 0),\n    shade.diskOuter,\n    aa,\n    aaGeom,\n  );\n\n  let frontAxes = _vgsl_9b9a4da2__diskFootprintAxes(baked.front);\n  let backAxes = _vgsl_9b9a4da2__diskFootprintAxes(baked.back);\n  let frontFootprint = _vgsl_9b9a4da2__diskFootprint(frontAxes);\n  let backFootprint = _vgsl_9b9a4da2__diskFootprint(backAxes);\n\n  let bakedRayDirection = baked.front.rayDirection;\n  let skyDdx = dpdx(bakedRayDirection);\n  let skyDdy = dpdy(bakedRayDirection);\n\n  let layers = _vgsl_9b9a4da2__rotateLayers(baked, -shade.sceneYaw);\n  let g = layers.front;\n  let skyDdxRotated = _vgsl_9b9a4da2__rotateY(skyDdx, -shade.sceneYaw);\n  let skyDdyRotated = _vgsl_9b9a4da2__rotateY(skyDdy, -shade.sceneYaw);\n\n  var background = vec3f(0.0);\n  if (!g.isBlackHole && g.escaped) {\n    background = _vgsl_ea21f6a6__shadeStars(g.rayDirection, stars, shade.time, skyDdxRotated, skyDdyRotated);\n  }\n\n  var backSample = _vgsl_9b9a4da2__emptyDiskSample();\n  var frontSample = _vgsl_9b9a4da2__emptyDiskSample();\n  if (layers.back.isHit) {\n    backSample = _vgsl_a8cf4048__shadeDisk(layers.back, disk, shade.time, backFootprint, noiseVolume, noiseSampler);\n  }\n  if (layers.front.isHit) {\n    frontSample = _vgsl_9b9a4da2__shadeFront(layers.front, frontFootprint, frontAxes.x);\n    frontSample.alpha *= layers.front.coverage;\n  }\n\n  var color = background;\n  color = _vgsl_9b9a4da2__compositeDisk(color, backSample);\n  color = _vgsl_9b9a4da2__compositeDisk(color, frontSample);\n\n  let centerMask = mix(\n    1.0,\n    _vgsl_9b9a4da2__centeredCopyFade(uv.y),\n    clamp(shade.centerFade, 0.0, 1.0),\n  );\n  let heroFade = centerMask;\n\n  color *= heroFade;\n\n  return vec4f(color, 1.0);\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/optimized-black-hole/gbuffer.wgsl\n// Shared decoding contract for the baked crossings consumed by the frame shader.\n\n const _vgsl_95c7f85b__HORIZON: f32 = 1.0;\n\n const _vgsl_95c7f85b__ISCO: f32 = 3.0;\n const _vgsl_95c7f85b__TAU: f32 = 6.28318530718;\n const _vgsl_95c7f85b__PI_CONST: f32 = 3.14159265359;\n\n struct _vgsl_95c7f85b__GBufferSample {\n  position: vec3f,\n  normal: vec3f,\n  diskUv: vec2f,\n  diskPolar: vec2f,\n  rayDirection: vec3f,\n  viewDirection: vec3f,\n  side: f32,\n  coverage: f32,\n  span: f32,\n  isHit: bool,\n  synthesized: bool,\n  isBlackHole: bool,\n  escaped: bool,\n}\n\n struct _vgsl_95c7f85b__GBufferLayers {\n  front: _vgsl_95c7f85b__GBufferSample,\n  back: _vgsl_95c7f85b__GBufferSample,\n}\n\nfn _vgsl_95c7f85b__decodeDirection(encoded: vec2f) -> vec3f {\n  let horizontal = sqrt(max(1.0 - encoded.x * encoded.x, 0.0));\n  return vec3f(cos(encoded.y) * horizontal, encoded.x, sin(encoded.y) * horizontal);\n}\n\nfn _vgsl_95c7f85b__decodeLayer(\n  plane: vec2f, encodedDirection: vec2f, sky: vec4f, flags: i32,\n  diskOuter: f32, aa: vec2f, synthesized: bool,\n) -> _vgsl_95c7f85b__GBufferSample {\n  var sample: _vgsl_95c7f85b__GBufferSample;\n  let planeRadius = length(plane);\n  let isHit = planeRadius > _vgsl_95c7f85b__ISCO * 0.5;\n  let radius = max(planeRadius, _vgsl_95c7f85b__ISCO);\n  let azimuth = atan2(plane.y, plane.x);\n  let direction = _vgsl_95c7f85b__decodeDirection(encodedDirection);\n  let side = select(1.0, -1.0, direction.y > 0.0);\n\n  sample.position = select(vec3f(0.0), vec3f(plane.x, 0.0, plane.y), isHit);\n  sample.normal = select(vec3f(0.0), vec3f(0.0, side, 0.0), isHit);\n  sample.diskUv = vec2f(\n    clamp((radius - _vgsl_95c7f85b__ISCO) / max(diskOuter - _vgsl_95c7f85b__ISCO, 0.001), 0.0, 1.0),\n    (azimuth + _vgsl_95c7f85b__PI_CONST) / _vgsl_95c7f85b__TAU,\n  );\n  sample.diskPolar = vec2f(radius, azimuth);\n  sample.rayDirection = sky.xyz;\n  sample.viewDirection = direction;\n  sample.side = select(0.0, side, isHit);\n  sample.coverage = clamp(aa.x, 0.0, 1.0);\n  sample.span = clamp(aa.y, 0.0, 1.0);\n  sample.isHit = isHit;\n  sample.synthesized = synthesized && isHit;\n  sample.isBlackHole = (flags & 1) != 0;\n  sample.escaped = (flags & 2) != 0;\n  return sample;\n}\n\n fn _vgsl_95c7f85b__decodeGBuffer(\n  hit1: vec2f, hit2: vec2f, sky: vec4f, view: vec4f,\n  diskOuter: f32, aa: vec2f, aaGeom: vec4f,\n) -> _vgsl_95c7f85b__GBufferLayers {\n  let flags = i32(sky.w + 0.5);\n  let substitute = length(hit1) <= _vgsl_95c7f85b__ISCO * 0.5 && length(aaGeom.xy) > _vgsl_95c7f85b__ISCO * 0.5;\n  let frontPlane = select(hit1, aaGeom.xy, substitute);\n  let frontDirection = select(view.xy, aaGeom.zw, substitute);\n  var layers: _vgsl_95c7f85b__GBufferLayers;\n  layers.front = _vgsl_95c7f85b__decodeLayer(frontPlane, frontDirection, sky, flags, diskOuter, aa, substitute);\n  layers.back = _vgsl_95c7f85b__decodeLayer(hit2, view.zw, sky, flags, diskOuter, vec2f(1.0, 0.0), false);\n  if (!layers.front.isHit) {\n    layers.back.isHit = false;\n    layers.back.side = 0.0;\n    layers.back.normal = vec3f(0.0);\n  }\n  return layers;\n}\n\n fn _vgsl_95c7f85b__sampleAtRadius(g: _vgsl_95c7f85b__GBufferSample, radius: f32, diskOuter: f32) -> _vgsl_95c7f85b__GBufferSample {\n  var moved = g;\n  let clamped = clamp(radius, _vgsl_95c7f85b__ISCO, max(diskOuter, _vgsl_95c7f85b__ISCO));\n  let azimuth = g.diskPolar.y;\n  moved.position = vec3f(cos(azimuth) * clamped, 0.0, sin(azimuth) * clamped);\n  moved.diskPolar = vec2f(clamped, azimuth);\n  moved.diskUv = vec2f(\n    clamp((clamped - _vgsl_95c7f85b__ISCO) / max(diskOuter - _vgsl_95c7f85b__ISCO, 0.001), 0.0, 1.0),\n    g.diskUv.y,\n  );\n  return moved;\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/optimized-black-hole/disk.wgsl\n// Accretion-disk material with deterministic tiled noise and radial prefiltering.\n\n       \n\n struct _vgsl_a8cf4048__DiskLook {\n  brightness: f32,\n  speed: f32,\n  stretch: f32,\n  detail: f32,\n  turbulence: f32,\n  density: f32,\n  doppler: f32,\n  cloudScale: f32,\n  cloudSpeed: f32,\n  cloudStrength: f32,\n  spare0: f32,\n  spare1: f32,\n  spare2: f32,\n  spare3: f32,\n}\n\n struct _vgsl_a8cf4048__DiskSample {\n  color: vec3f,\n  alpha: f32,\n}\n\nstruct _vgsl_a8cf4048__NoiseLattice {\n  invSize: f32,\n}\n\nfn _vgsl_a8cf4048__noise3(tex: texture_3d<f32>, samp: sampler, lattice: _vgsl_a8cf4048__NoiseLattice, p: vec3f) -> f32 {\n  let i = floor(p);\n  let f = p - i;\n  let u = f * f * (3.0 - 2.0 * f);\n  return textureSampleLevel(tex, samp, (i + u + vec3f(0.5)) * lattice.invSize, 0.0).r;\n}\n\nfn _vgsl_a8cf4048__streakFbm(\n  tex: texture_3d<f32>,\n  samp: sampler,\n  lattice: _vgsl_a8cf4048__NoiseLattice,\n  angle: f32,\n  radius: f32,\n  angScale: f32,\n  radScale: f32,\n  octaves: i32,\n  dAngle: f32,\n  dRadius: f32,\n  lacAng: f32,\n  lacRad: f32,\n  seed: f32,\n) -> f32 {\n  var value: f32 = 0.0;\n  var total: f32 = 0.0;\n  var amplitude: f32 = 0.5;\n  var a = angScale;\n  var r = radScale;\n  var offset = seed;\n  for (var i = 0; i < octaves; i++) {\n    let visible = clamp(1.0 - 1.7 * max(dAngle * a, dRadius * r), 0.0, 1.0);\n    var sampleValue: f32 = 0.5;\n    if (visible > 0.004) {\n      sampleValue = mix(\n        0.5,\n        _vgsl_a8cf4048__noise3(tex, samp, lattice, vec3f(cos(angle) * a, sin(angle) * a, radius * r + offset)),\n        visible,\n      );\n    }\n    value += amplitude * sampleValue;\n    total += amplitude;\n    a *= lacAng;\n    r *= lacRad;\n    offset += 23.7;\n    amplitude *= 0.55;\n  }\n  return value / max(total, 0.0001);\n}\n\nfn _vgsl_a8cf4048__ridgeFbm(\n  tex: texture_3d<f32>,\n  samp: sampler,\n  lattice: _vgsl_a8cf4048__NoiseLattice,\n  angle: f32,\n  radius: f32,\n  angScale: f32,\n  radScale: f32,\n  octaves: i32,\n  dAngle: f32,\n  dRadius: f32,\n  lacAng: f32,\n  lacRad: f32,\n  seed: f32,\n) -> f32 {\n  var value: f32 = 0.0;\n  var total: f32 = 0.0;\n  var amplitude: f32 = 0.5;\n  var a = angScale;\n  var r = radScale;\n  var offset = seed;\n  for (var i = 0; i < octaves; i++) {\n    let visible = clamp(1.0 - 1.7 * max(dAngle * a, dRadius * r), 0.0, 1.0);\n    var crest: f32 = 0.42;\n    if (visible > 0.004) {\n      let n = _vgsl_a8cf4048__noise3(tex, samp, lattice, vec3f(cos(angle) * a, sin(angle) * a, radius * r + offset));\n      crest = mix(0.42, pow(1.0 - abs(n * 2.0 - 1.0), 1.35), visible);\n    }\n    value += amplitude * crest;\n    total += amplitude;\n    a *= lacAng;\n    r *= lacRad;\n    offset += 41.9;\n    amplitude *= 0.62;\n  }\n  return value / max(total, 0.0001);\n}\n\nstruct _vgsl_a8cf4048__FieldParams {\n  angBase: f32,\n  radBase: f32,\n  flowRad: f32,\n  chaos: f32,\n  outward: f32,\n  dAngle: f32,\n  dRadius: f32,\n}\n\nfn _vgsl_a8cf4048__smokeField(\n  tex: texture_3d<f32>, samp: sampler, lattice: _vgsl_a8cf4048__NoiseLattice,\n  angle: f32, radius: f32, p: _vgsl_a8cf4048__FieldParams,\n) -> vec2f {\n  let warpA = (_vgsl_a8cf4048__streakFbm(\n    tex, samp, lattice, angle, radius, p.angBase * 0.55, p.flowRad * 1.6,\n    2, p.dAngle, p.dRadius, 1.6, 2.0, 3.7,\n  )) - 0.5;\n  let warpB = (_vgsl_a8cf4048__streakFbm(\n    tex, samp, lattice, angle + 2.4, radius * 1.13,\n    p.angBase * 2.8, p.radBase * 0.45, 3, p.dAngle, p.dRadius,\n    1.7, 2.0, 61.3,\n  )) - 0.5;\n  let radiusW = radius + (warpA * 1.9 + warpB * 1.25 * p.outward) * p.chaos;\n  let angleW = angle + (warpB * 0.9 - warpA * 0.35) * p.chaos * 0.55 / max(radius * 0.22, 0.35);\n\n  let flow = _vgsl_a8cf4048__streakFbm(\n    tex, samp, lattice, angleW, radiusW, p.angBase, p.flowRad,\n    3, p.dAngle, p.dRadius, 2.0, 1.12, 131.7,\n  );\n  let threads = _vgsl_a8cf4048__ridgeFbm(\n    tex, samp, lattice, angleW, radiusW, p.angBase * 0.85, p.radBase,\n    5, p.dAngle, p.dRadius, 1.26, 2.05, 0.0,\n  );\n\n  let fineVis = clamp(1.0 - 1.7 * max(p.dAngle * p.angBase * 0.85, p.dRadius * p.radBase), 0.0, 1.0);\n  let field = mix(flow, flow * 0.22 + threads * 1.05, fineVis);\n  let rim = (warpA + warpB * 0.5) * 0.9;\n  return vec2f(f32(field), rim);\n}\n\nconst _vgsl_a8cf4048__FIELD_MEAN = 0.52;\n\nconst _vgsl_a8cf4048__SHEAR_REF_RADIUS = 6.5;\n\n const _vgsl_a8cf4048__SHEAR_PERIOD: f32 = 10.0;\nconst _vgsl_a8cf4048__TWO_PI = 6.283185307;\n\n fn _vgsl_a8cf4048__shadeDisk(\n  g: _vgsl_95c7f85b__GBufferSample,\n  look: _vgsl_a8cf4048__DiskLook,\n  time: f32,\n  footprint: f32,\n  noiseTex: texture_3d<f32>,\n  noiseSampler: sampler,\n) -> _vgsl_a8cf4048__DiskSample {\n  var lattice: _vgsl_a8cf4048__NoiseLattice;\n  lattice.invSize = 1.0 / f32(textureDimensions(noiseTex).x);\n\n  let plane = vec2f(g.position.x, g.position.z);\n  let radius = g.diskPolar.x;\n  let azimuth = g.diskPolar.y;\n  let radiusNorm = clamp(g.diskUv.x, 0.0, 1.0);\n  let viewDirection = g.viewDirection;\n\n  let slant = max(abs(viewDirection.y), 0.022);\n  let grazing = min(1.0 / slant, 34.0);\n\n  let viewPlane = normalize(vec2f(viewDirection.x, viewDirection.z) + vec2f(1e-6, 0.0));\n  let radialDir = normalize(plane + vec2f(1e-6, 0.0));\n  let alignR = clamp(abs(dot(radialDir, viewPlane)), 0.0, 1.0);\n  let alignT = sqrt(max(1.0 - alignR * alignR, 0.0));\n  let stretchSq = grazing * grazing - 1.0;\n  let kR = sqrt(1.0 + stretchSq * alignR * alignR);   // radial elongation\n  let kT = sqrt(1.0 + stretchSq * alignT * alignT);   // tangential elongation\n  let baseScaleR = max(look.detail, 0.05);\n  let baseScaleA = max(look.stretch, 0.05);\n  let pixelWorld = footprint / max(baseScaleR * kR, baseScaleA * kT / max(radius, _vgsl_95c7f85b__ISCO));\n  let dRadius = pixelWorld * kR;\n  let dAngle = pixelWorld * kT / max(radius, _vgsl_95c7f85b__ISCO);\n\n  let omega = look.speed * 0.55 / pow(radius, 1.5);\n  let omegaRef = look.speed * 0.55 / pow(_vgsl_a8cf4048__SHEAR_REF_RADIUS, 1.5);\n  let dOmega = omega - omegaRef;\n  let rigid = fract(time * omegaRef / _vgsl_a8cf4048__TWO_PI) * _vgsl_a8cf4048__TWO_PI;\n  let swirl = max(0.0, 0.85 + look.spare1);\n  let flowBase = azimuth - rigid + swirl * log(radius / _vgsl_95c7f85b__ISCO);\n\n  let cycle = time / _vgsl_a8cf4048__SHEAR_PERIOD;\n  let u0 = fract(cycle);\n  let u1 = fract(cycle + 0.5);\n  let shear0 = (u0 - 0.5) * _vgsl_a8cf4048__SHEAR_PERIOD;\n  let shear1 = (u1 - 0.5) * _vgsl_a8cf4048__SHEAR_PERIOD;\n  let w0 = 1.0 - abs(2.0 * u0 - 1.0);\n  let w1 = 1.0 - w0;\n  let angle0 = flowBase - dOmega * shear0;\n  let angle1 = flowBase - dOmega * shear1;\n\n  let outward = smoothstep(0.0, 0.92, radiusNorm);\n  let fray = max(0.0, 1.0 + look.spare3);\n  let chaos = look.turbulence * (0.08 + 2.10 * outward * outward) * fray;\n\n  let angBase = max(look.stretch, 0.05) * 0.45 * (0.80 + 1.45 * outward * fray);\n  let radBase = max(look.detail, 0.05) * 2.35;\n  let flowRad = max(look.detail, 0.05) * 0.105;\n\n  var params: _vgsl_a8cf4048__FieldParams;\n  params.angBase = angBase;\n  params.radBase = radBase;\n  params.flowRad = flowRad;\n  params.chaos = chaos;\n  params.outward = outward;\n  params.dAngle = dAngle;\n  params.dRadius = dRadius;\n  let lobeShift = abs(dOmega) * _vgsl_a8cf4048__SHEAR_PERIOD * 0.5 * angBase * 0.85;\n  let rho = 1.0 - smoothstep(0.12, 1.1, lobeShift);\n\n  var blended: vec2f;\n  var lobeVariance = 1.0;\n  if (rho > 0.98) {\n    let angleMerged = mix(angle1, angle0, w0);\n    blended = _vgsl_a8cf4048__smokeField(noiseTex, noiseSampler, lattice, angleMerged, radius, params);\n  } else {\n    let lobe0 = _vgsl_a8cf4048__smokeField(noiseTex, noiseSampler, lattice, angle0, radius, params);\n    let lobe1 = _vgsl_a8cf4048__smokeField(noiseTex, noiseSampler, lattice, angle1, radius, params);\n    blended = mix(lobe1, lobe0, w0);\n    lobeVariance = sqrt(max(w0 * w0 + w1 * w1 + 2.0 * rho * w0 * w1, 0.25));\n  }\n  var field = _vgsl_a8cf4048__FIELD_MEAN + (blended.x - _vgsl_a8cf4048__FIELD_MEAN) / lobeVariance;\n\n  let cloudRate = omegaRef * look.cloudSpeed;\n  let cloudRigid = fract(time * cloudRate / _vgsl_a8cf4048__TWO_PI) * _vgsl_a8cf4048__TWO_PI;\n  let cloudAngle = azimuth - cloudRigid + 0.32 * log(radius / _vgsl_95c7f85b__ISCO);\n  let cloudScale = max(look.cloudScale, 0.05);\n  let cloudRaw = _vgsl_a8cf4048__streakFbm(\n    noiseTex,\n    noiseSampler,\n    lattice,\n    cloudAngle,\n    radius,\n    cloudScale,\n    cloudScale * 0.34,\n    2,\n    dAngle,\n    dRadius,\n    1.72,\n    1.86,\n    211.7,\n  );\n  let cloud = smoothstep(0.28, 0.72, cloudRaw);\n  let cloudStrength = clamp(look.cloudStrength, 0.0, 0.95);\n  let cloudMultiplier = mix(1.0 - cloudStrength, 1.0 + cloudStrength, cloud);\n  field *= cloudMultiplier;\n\n  let rimNoise = blended.y;\n  let innerEdge = smoothstep(0.0, 0.055, radiusNorm);\n  let outerEdge = 1.0 - smoothstep(0.42 + rimNoise * 0.30 * fray, 1.0, radiusNorm);\n  let envelope = innerEdge * outerEdge * mix(1.0, 0.62, outward);\n\n  let contrast = max(0.2, 1.0 + look.spare2);\n  let lo = 0.50 - 0.16 / contrast;\n  let hi = 0.50 + 0.21 / contrast;\n  var smoke = clamp(pow(smoothstep(lo, hi, field), 1.0 + 0.9 * contrast) * envelope, 0.0, 1.0);\n\n  let fieldN = clamp((field - (lo - 0.10)) / max(hi - lo + 0.26, 0.02), 0.0, 1.0);\n  let emissivity = (mix(0.05, 1.0, pow(fieldN, 1.35)) + 2.2 * pow(fieldN, 5.0)) * envelope;\n\n  let path = pow(grazing, 0.62);\n  let thickness = mix(0.30, 0.85, radiusNorm);\n  let opticalDepth = smoke * thickness * path * look.density * 0.95;\n  let coverage = 1.0 - exp(-opticalDepth);\n\n  let heat = pow(1.0 - radiusNorm, 1.25);\n  var thermal = mix(vec3f(0.52, 0.14, 0.03), vec3f(1.0, 0.56, 0.17), smoothstep(0.03, 0.5, heat));\n  thermal = mix(thermal, vec3f(1.0, 0.94, 0.83), pow(heat, 2.2));\n\n  let tangent = normalize(vec3f(-plane.y, 0.0, plane.x));\n  let orbitalSpeed = min(0.64, 0.94 / sqrt(max(radius - _vgsl_95c7f85b__HORIZON, 0.25)));\n  let towardObserver = dot(tangent, -normalize(viewDirection));\n  let beaming = pow(clamp(1.0 / (1.0 - orbitalSpeed * towardObserver), 0.72, 1.55), 1.5 * look.doppler);\n  let redshift = sqrt(max(1.0 - _vgsl_95c7f85b__HORIZON / radius, 0.025));\n\n  let facing = mix(0.82, 1.0, step(0.0, g.side));\n\n  let flux = pow(clamp(_vgsl_95c7f85b__ISCO / radius, 0.0, 1.0), 1.7);\n  let core = 1.0 + 2.6 * pow(1.0 - radiusNorm, 5.0);\n\n  let arcLift = max(0.0, 1.0 + look.spare0);\n  let faceOn = smoothstep(0.16, 0.75, abs(viewDirection.y));\n  let lift = 1.0 + 1.55 * arcLift * faceOn;\n  let edgeGlow = 1.0 + 0.55 * smoothstep(6.0, 26.0, grazing);\n\n  let source = thermal * beaming * redshift * facing * flux * lift * edgeGlow * core * emissivity;\n  let emission = source * look.brightness * 1.35;\n\n  var sample: _vgsl_a8cf4048__DiskSample;\n  sample.color = vec3f(emission);\n  sample.alpha = coverage;\n  return sample;\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/optimized-black-hole/stars.wgsl\n// Procedural lensed star field with anisotropic footprint prefiltering.\n\n      \n\nconst _vgsl_ea21f6a6__STAR_INTENSITY: f32 = 1.9;\n\nconst _vgsl_ea21f6a6__ANCHOR_CELLS: f32 = 36.0;\nconst _vgsl_ea21f6a6__ANCHOR_FILL: f32 = 0.75;\nconst _vgsl_ea21f6a6__ANCHOR_RADIUS: f32 = 0.00110;\nconst _vgsl_ea21f6a6__ANCHOR_PEAK: f32 = 1.0;\n\nconst _vgsl_ea21f6a6__FIELD_CELLS: f32 = 93.0;\nconst _vgsl_ea21f6a6__FIELD_FILL: f32 = 0.75;\nconst _vgsl_ea21f6a6__FIELD_RADIUS: f32 = 0.00070;\nconst _vgsl_ea21f6a6__FIELD_PEAK: f32 = 0.45;\n\nconst _vgsl_ea21f6a6__DUST_CELLS: f32 = 151.0;\nconst _vgsl_ea21f6a6__DUST_FILL: f32 = 0.75;\nconst _vgsl_ea21f6a6__DUST_RADIUS: f32 = 0.00040;\nconst _vgsl_ea21f6a6__DUST_PEAK: f32 = 0.22;\n\nconst _vgsl_ea21f6a6__COUNT_SLOPE: f32 = 2.0;\n\nconst _vgsl_ea21f6a6__STAR_FLUX_AREA: f32 = 0.5385;\n\nconst _vgsl_ea21f6a6__MAX_PREFILTER_PIXELS: f32 = 4.0;\n\nconst _vgsl_ea21f6a6__STAR_WARM: vec3f = vec3f(1.1741, 0.9745, 0.7397);\nconst _vgsl_ea21f6a6__STAR_COOL: vec3f = vec3f(0.8954, 1.0131, 1.1781);\n\n struct _vgsl_ea21f6a6__StarLook {\n  brightness: f32,\n  density: f32,\n  contrast: f32,\n  warmth: f32,\n  twinkle: f32,\n}\n\nfn _vgsl_ea21f6a6__faceCoords(direction: vec3f) -> vec3f {\n  let magnitude = abs(direction);\n  if (magnitude.x >= magnitude.y && magnitude.x >= magnitude.z) {\n    return vec3f(direction.yz / magnitude.x, select(1.0, 0.0, direction.x > 0.0));\n  }\n  if (magnitude.y >= magnitude.z) {\n    return vec3f(direction.xz / magnitude.y, select(3.0, 2.0, direction.y > 0.0));\n  }\n  return vec3f(direction.xy / magnitude.z, select(5.0, 4.0, direction.z > 0.0));\n}\n\nfn _vgsl_ea21f6a6__faceProject(direction: vec3f, axis: i32) -> vec2f {\n  if (axis == 0) {\n    return direction.yz / abs(direction.x);\n  }\n  if (axis == 1) {\n    return direction.xz / abs(direction.y);\n  }\n  return direction.xy / abs(direction.z);\n}\n\nstruct _vgsl_ea21f6a6__SkyFilter {\n  inverseJacobian: mat2x2f,\n  pixelsPerFace: f32,\n  faceMajor: f32,\n}\n\nfn _vgsl_ea21f6a6__skyFilter(direction: vec3f, axis: i32, ddx: vec3f, ddy: vec3f) -> _vgsl_ea21f6a6__SkyFilter {\n  let base = _vgsl_ea21f6a6__faceProject(direction, axis);\n  let jx = _vgsl_ea21f6a6__faceProject(direction + ddx, axis) - base;\n  let jy = _vgsl_ea21f6a6__faceProject(direction + ddy, axis) - base;\n\n  let determinant = jx.x * jy.y - jx.y * jy.x;\n  let safeDeterminant = select(determinant, 1.0e-24, abs(determinant) < 1.0e-24);\n  let inverse = mat2x2f(vec2f(jy.y, -jx.y), vec2f(-jy.x, jx.x)) * (1.0 / safeDeterminant);\n\n  var prefilter: _vgsl_ea21f6a6__SkyFilter;\n  prefilter.inverseJacobian = inverse;\n  prefilter.pixelsPerFace = 1.0 / sqrt(max(abs(determinant), 1.0e-24));\n  prefilter.faceMajor = max(length(jx), length(jy));\n  return prefilter;\n}\n\nstruct _vgsl_ea21f6a6__SkyState {\n  brightness: f32,\n  rangePower: f32,\n  meanFlux: f32,\n  warmth: f32,\n  twinkle: f32,\n  time: f32,\n  fillScale: f32,\n  radiusScale: f32,\n}\n\nfn _vgsl_ea21f6a6__resolveSky(look: _vgsl_ea21f6a6__StarLook, face: vec2f, time: f32) -> _vgsl_ea21f6a6__SkyState {\n  let range = clamp(look.contrast, 1.0, 512.0);\n  let rangePower = range * range;\n\n  let compression = 1.0 + dot(face, face);\n  let root = sqrt(compression);\n\n  var sky: _vgsl_ea21f6a6__SkyState;\n  sky.brightness = max(0.0, look.brightness) * _vgsl_ea21f6a6__STAR_INTENSITY;\n  sky.rangePower = rangePower;\n  sky.meanFlux = _vgsl_ea21f6a6__COUNT_SLOPE / (range + _vgsl_ea21f6a6__COUNT_SLOPE - 1.0);\n  sky.warmth = clamp(look.warmth, 0.0, 1.0);\n  sky.twinkle = clamp(look.twinkle, 0.0, 1.0);\n  sky.time = time;\n  sky.fillScale = max(0.0, look.density) / (compression * root);\n  sky.radiusScale = sqrt(compression * root);\n  return sky;\n}\n\nstruct _vgsl_ea21f6a6__Species {\n  cells: f32,\n  fill: f32,\n  peak: f32,\n  faceRadius: f32,\n  radiusPixels: f32,\n  gain: f32,\n}\n\nfn _vgsl_ea21f6a6__resolveSpecies(\n  cells: f32,\n  fill: f32,\n  peak: f32,\n  angularRadius: f32,\n  sky: _vgsl_ea21f6a6__SkyState,\n  prefilter: _vgsl_ea21f6a6__SkyFilter,\n) -> _vgsl_ea21f6a6__Species {\n  let faceRadius = angularRadius * sky.radiusScale;\n  let starPixels = faceRadius * prefilter.pixelsPerFace;\n\n  var species: _vgsl_ea21f6a6__Species;\n  species.cells = cells;\n  species.fill = clamp(fill * sky.fillScale, 0.0, 1.0);\n  species.peak = peak * sky.brightness;\n  species.faceRadius = faceRadius;\n  species.radiusPixels = clamp(starPixels, 1.0, _vgsl_ea21f6a6__MAX_PREFILTER_PIXELS);\n  species.gain = min(1.0, starPixels * starPixels);\n  return species;\n}\n\nfn _vgsl_ea21f6a6__starPoint(\n  cell: vec2f,\n  grid: vec2f,\n  faceIndex: i32,\n  seed: i32,\n  species: _vgsl_ea21f6a6__Species,\n  sky: _vgsl_ea21f6a6__SkyState,\n  prefilter: _vgsl_ea21f6a6__SkyFilter,\n) -> vec3f {\n  let hashed = _vgsl_7d0c4946__pcg3d(bitcast<vec3u>(vec3i(vec2i(cell), faceIndex * 131 + seed)));\n  let presence = _vgsl_7d0c4946__unitFloat(hashed.x);\n  if (presence > species.fill) {\n    return vec3f(0.0);\n  }\n\n  let jitter = vec2f(_vgsl_7d0c4946__unitFloat(hashed.y), _vgsl_7d0c4946__unitFloat(hashed.z)) - vec2f(0.5);\n  let center = cell + vec2f(0.5) + jitter * 0.8;\n  let offsetPixels = prefilter.inverseJacobian * ((grid - center) / species.cells);\n  let falloff = 1.0 - smoothstep(0.0, species.radiusPixels, length(offsetPixels));\n\n  let uniform01 = presence / max(species.fill, 1.0e-6);\n  let flux = inverseSqrt(1.0 + uniform01 * (sky.rangePower - 1.0));\n\n  let tint = mix(vec3f(1.0), mix(_vgsl_ea21f6a6__STAR_WARM, _vgsl_ea21f6a6__STAR_COOL, _vgsl_7d0c4946__unitFloat(hashed.y ^ hashed.z)), sky.warmth);\n\n  let phase = _vgsl_7d0c4946__unitFloat(hashed.y) * 6.2831853;\n  let shimmer = 1.0 + sky.twinkle * 0.06 * sin(sky.time * (0.35 + _vgsl_7d0c4946__unitFloat(hashed.z) * 0.4) + phase);\n  return tint * (falloff * falloff * species.peak * flux * shimmer * species.gain);\n}\n\nfn _vgsl_ea21f6a6__starSpecies(\n  face: vec3f,\n  seed: i32,\n  species: _vgsl_ea21f6a6__Species,\n  sky: _vgsl_ea21f6a6__SkyState,\n  prefilter: _vgsl_ea21f6a6__SkyFilter,\n) -> vec3f {\n  let faceIndex = i32(face.z);\n  let grid = face.xy * species.cells;\n  let total = _vgsl_ea21f6a6__starPoint(floor(grid), grid, faceIndex, seed, species, sky, prefilter);\n\n  let extent = species.faceRadius * species.cells;\n  let mean = species.peak * sky.meanFlux * species.fill * _vgsl_ea21f6a6__STAR_FLUX_AREA * extent * extent;\n  let meanTint = mix(vec3f(1.0), 0.5 * (_vgsl_ea21f6a6__STAR_WARM + _vgsl_ea21f6a6__STAR_COOL), sky.warmth);\n  let cellsPerPixel = species.cells * prefilter.faceMajor;\n  return mix(total, meanTint * mean, smoothstep(1.0, 3.0, cellsPerPixel));\n}\n\n fn _vgsl_ea21f6a6__shadeStars(direction: vec3f, look: _vgsl_ea21f6a6__StarLook, time: f32, ddx: vec3f, ddy: vec3f) -> vec3f {\n  let d = normalize(direction);\n  let face = _vgsl_ea21f6a6__faceCoords(d);\n  let prefilter = _vgsl_ea21f6a6__skyFilter(d, i32(face.z) / 2, ddx, ddy);\n  let sky = _vgsl_ea21f6a6__resolveSky(look, face.xy, time);\n\n  return _vgsl_ea21f6a6__starSpecies(\n    face, 17,\n    _vgsl_ea21f6a6__resolveSpecies(_vgsl_ea21f6a6__ANCHOR_CELLS, _vgsl_ea21f6a6__ANCHOR_FILL, _vgsl_ea21f6a6__ANCHOR_PEAK, _vgsl_ea21f6a6__ANCHOR_RADIUS, sky, prefilter),\n    sky, prefilter,\n  ) + _vgsl_ea21f6a6__starSpecies(\n    face, 71,\n    _vgsl_ea21f6a6__resolveSpecies(_vgsl_ea21f6a6__FIELD_CELLS, _vgsl_ea21f6a6__FIELD_FILL, _vgsl_ea21f6a6__FIELD_PEAK, _vgsl_ea21f6a6__FIELD_RADIUS, sky, prefilter),\n    sky, prefilter,\n  ) + _vgsl_ea21f6a6__starSpecies(\n    face, 149,\n    _vgsl_ea21f6a6__resolveSpecies(_vgsl_ea21f6a6__DUST_CELLS, _vgsl_ea21f6a6__DUST_FILL, _vgsl_ea21f6a6__DUST_PEAK, _vgsl_ea21f6a6__DUST_RADIUS, sky, prefilter),\n    sky, prefilter,\n  );\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/node_modules/@vgpu/wgsl-std/src/hash/index.wgsl\n// Wellons lowbias32: https://github.com/skeeto/hash-prospector\n \n\n \n\n fn _vgsl_7d0c4946__pcg3d(value: vec3u) -> vec3u {\n  var hashed = value * 1664525u + 1013904223u;\n  hashed.x = hashed.x + hashed.y * hashed.z;\n  hashed.y = hashed.y + hashed.z * hashed.x;\n  hashed.z = hashed.z + hashed.x * hashed.y;\n  hashed = hashed ^ (hashed >> vec3u(16u));\n  hashed.x = hashed.x + hashed.y * hashed.z;\n  hashed.y = hashed.y + hashed.z * hashed.x;\n  hashed.z = hashed.z + hashed.x * hashed.y;\n  hashed = hashed ^ (hashed >> vec3u(16u));\n  return hashed;\n}\n\n fn _vgsl_7d0c4946__unitFloat(hash: u32) -> f32 {\n  return f32(hash >> 8u) * (1.0 / 16777216.0);\n}\n\n \n\n \n\n \n",
	functionExports: [
		{
			name: "decodeGBuffer",
			resolvedName: "_vgsl_95c7f85b__decodeGBuffer",
			parameterNames: [
				"hit1",
				"hit2",
				"sky",
				"view",
				"diskOuter",
				"aa",
				"aaGeom"
			]
		},
		{
			name: "sampleAtRadius",
			resolvedName: "_vgsl_95c7f85b__sampleAtRadius",
			parameterNames: [
				"g",
				"radius",
				"diskOuter"
			]
		},
		{
			name: "shadeDisk",
			resolvedName: "_vgsl_a8cf4048__shadeDisk",
			parameterNames: [
				"g",
				"look",
				"time",
				"footprint",
				"noiseTex",
				"noiseSampler"
			]
		},
		{
			name: "shadeStars",
			resolvedName: "_vgsl_ea21f6a6__shadeStars",
			parameterNames: [
				"direction",
				"look",
				"time",
				"ddx",
				"ddy"
			]
		},
		{
			name: "pcg3d",
			resolvedName: "_vgsl_7d0c4946__pcg3d",
			parameterNames: ["value"]
		},
		{
			name: "unitFloat",
			resolvedName: "_vgsl_7d0c4946__unitFloat",
			parameterNames: ["hash"]
		}
	]
}, S = [
	"rg32float",
	"rg32float",
	"rgba16float",
	"rgba16float"
], C = ["rg8unorm", "rgba16float"], w = [
	0,
	0,
	0,
	1
];
function te(e, t) {
	let n = e.sampler(t, {
		minFilter: "linear",
		magFilter: "linear"
	}), o = ee(e, t);
	return {
		bake: e.effect(t, r),
		refine: e.effect(t, b),
		shade: e.effect(t, x),
		bloomExtract: e.effect(t, i),
		bloomBlurH0: e.effect(t, i),
		bloomBlurV0: e.effect(t, i),
		bloomDown1: e.effect(t, i),
		bloomBlurH1: e.effect(t, i),
		bloomBlurV1: e.effect(t, i),
		bloomDown2: e.effect(t, i),
		bloomBlurH2: e.effect(t, i),
		bloomBlurV2: e.effect(t, i),
		composite: e.effect(t, a),
		postSampler: n,
		noiseSampler: o,
		noiseVolume: y(t, 64)
	};
}
function ne(e, t, n) {
	let r = fe(n), i = pe(r, 2), a = pe(r, 4), o = pe(r, 8), s = (n) => e.target(t, {
		size: n,
		colors: [{ format: "rgba16float" }]
	}), c = [], l = (e) => (c.push(e), e);
	try {
		return {
			gbuffer: l(e.target(t, {
				size: r,
				colors: S.map((e) => ({ format: e }))
			})),
			aa: l(e.target(t, {
				size: r,
				colors: C.map((e) => ({ format: e }))
			})),
			scene: l(s(r)),
			bloom0: l(s(i)),
			bloomPing0: l(s(i)),
			bloom1: l(s(a)),
			bloomPing1: l(s(a)),
			bloom2: l(s(o)),
			bloomPing2: l(s(o))
		};
	} catch (e) {
		try {
			ie(c.reverse());
		} catch {}
		throw e;
	}
}
function re(e) {
	ie([
		e.gbuffer,
		e.aa,
		e.scene,
		e.bloom0,
		e.bloomPing0,
		e.bloom1,
		e.bloomPing1,
		e.bloom2,
		e.bloomPing2
	]);
}
function ie(e) {
	let t = !1, n;
	for (let r of e) try {
		ae(r);
	} catch (e) {
		t || (n = e), t = !0;
	}
	if (t) throw n;
}
function ae(e) {
	e?.destroy?.();
}
function oe(e, t) {
	let [n, r, i, a] = t.gbuffer.colors, [o, s] = t.aa.colors;
	e.bake.set({ bake: { resolution: t.gbuffer.size } }), e.refine.set({
		gHit1: n,
		gSky: i,
		refine: { resolution: t.gbuffer.size }
	}), e.shade.set({
		gHit1: n,
		gHit2: r,
		gSky: i,
		gView: a,
		gAa: o,
		gAaGeom: s,
		noiseVolume: e.noiseVolume,
		noiseSampler: e.noiseSampler,
		shade: { resolution: t.gbuffer.size }
	});
	let c = t.scene.colors[0], l = t.bloom0.colors[0], u = t.bloomPing0.colors[0], d = t.bloom1.colors[0], f = t.bloomPing1.colors[0], p = t.bloom2.colors[0], m = t.bloomPing2.colors[0];
	e.bloomExtract.set({
		source: c,
		linearSampler: e.postSampler
	}), e.bloomBlurH0.set({
		source: l,
		linearSampler: e.postSampler
	}), e.bloomBlurV0.set({
		source: u,
		linearSampler: e.postSampler
	}), e.bloomDown1.set({
		source: l,
		linearSampler: e.postSampler
	}), e.bloomBlurH1.set({
		source: d,
		linearSampler: e.postSampler
	}), e.bloomBlurV1.set({
		source: f,
		linearSampler: e.postSampler
	}), e.bloomDown2.set({
		source: d,
		linearSampler: e.postSampler
	}), e.bloomBlurH2.set({
		source: p,
		linearSampler: e.postSampler
	}), e.bloomBlurV2.set({
		source: m,
		linearSampler: e.postSampler
	}), e.composite.set({
		scene: c,
		bloomNear: l,
		bloomMedium: d,
		bloomFar: p,
		linearSampler: e.postSampler
	});
}
function se(e, t, n) {
	let r = {
		resolution: t.gbuffer.size,
		yaw: 0,
		pitch: n.cameraY,
		orbitRadius: n.distance,
		diskOuter: n.diskRadius,
		fov: n.fov,
		centerX: n.centerX,
		centerY: n.centerY,
		roll: n.cameraRoll
	};
	e.bake.set({ bake: r }), e.refine.set({ refine: r });
}
function ce(e, t, n, r, i) {
	e.shade.set({
		shade: {
			resolution: t.gbuffer.size,
			time: r,
			diskOuter: n.diskRadius,
			sceneYaw: i,
			centerFade: n.centerFade
		},
		disk: n.disk,
		stars: n.stars
	});
}
function le(e, t, n) {
	let r = Math.max(0, n.bloom.threshold), i = Math.max(1e-4, n.bloom.knee), a = Math.max(.1, n.bloom.radius), o = (e, t) => ({
		sourceSize: e,
		direction: [0, 0],
		params: [
			t ? r : -1,
			i,
			a,
			0
		]
	}), s = (e, t, n) => ({
		sourceSize: e,
		direction: [t, n],
		params: [
			-1,
			i,
			a,
			1
		]
	});
	e.bloomExtract.set({ bloom: o(t.scene.size, !0) }), e.bloomBlurH0.set({ bloom: s(t.bloom0.size, 1, 0) }), e.bloomBlurV0.set({ bloom: s(t.bloomPing0.size, 0, 1) }), e.bloomDown1.set({ bloom: o(t.bloom0.size, !1) }), e.bloomBlurH1.set({ bloom: s(t.bloom1.size, 1, 0) }), e.bloomBlurV1.set({ bloom: s(t.bloomPing1.size, 0, 1) }), e.bloomDown2.set({ bloom: o(t.bloom1.size, !1) }), e.bloomBlurH2.set({ bloom: s(t.bloom2.size, 1, 0) }), e.bloomBlurV2.set({ bloom: s(t.bloomPing2.size, 0, 1) }), e.composite.set({ composite: { params: [
		Math.max(0, n.bloom.strength),
		0,
		0,
		0
	] } });
}
async function ue(e, t, n) {
	let r = { colors: [t.bloom0.format] };
	await Promise.all([
		e.bake.compile(t.gbuffer),
		e.refine.compile(t.aa),
		e.shade.compile(t.scene),
		e.bloomExtract.compile(r),
		e.bloomBlurH0.compile(r),
		e.bloomBlurV0.compile(r),
		e.bloomDown1.compile(r),
		e.bloomBlurH1.compile(r),
		e.bloomBlurV1.compile(r),
		e.bloomDown2.compile(r),
		e.bloomBlurH2.compile(r),
		e.bloomBlurV2.compile(r),
		e.composite.compile({ colors: [n.format] })
	]);
}
function de(e, t, n, r, i) {
	i && (e.pass({
		target: n.gbuffer,
		clear: w
	}, (e) => e.draw(t.bake)), e.pass({
		target: n.aa,
		clear: w
	}, (e) => e.draw(t.refine))), e.pass({
		target: n.scene,
		clear: w
	}, (e) => e.draw(t.shade)), e.pass({
		target: n.bloom0,
		clear: w
	}, (e) => e.draw(t.bloomExtract)), e.pass({
		target: n.bloomPing0,
		clear: w
	}, (e) => e.draw(t.bloomBlurH0)), e.pass({
		target: n.bloom0,
		clear: w
	}, (e) => e.draw(t.bloomBlurV0)), e.pass({
		target: n.bloom1,
		clear: w
	}, (e) => e.draw(t.bloomDown1)), e.pass({
		target: n.bloomPing1,
		clear: w
	}, (e) => e.draw(t.bloomBlurH1)), e.pass({
		target: n.bloom1,
		clear: w
	}, (e) => e.draw(t.bloomBlurV1)), e.pass({
		target: n.bloom2,
		clear: w
	}, (e) => e.draw(t.bloomDown2)), e.pass({
		target: n.bloomPing2,
		clear: w
	}, (e) => e.draw(t.bloomBlurH2)), e.pass({
		target: n.bloom2,
		clear: w
	}, (e) => e.draw(t.bloomBlurV2)), e.pass({
		target: r,
		clear: w
	}, (e) => e.draw(t.composite));
}
function fe(e) {
	return [Math.max(1, Math.floor(e[0])), Math.max(1, Math.floor(e[1]))];
}
function pe(e, t) {
	return [Math.max(1, Math.floor(e[0] / t)), Math.max(1, Math.floor(e[1] / t))];
}
//#endregion
//#region optimized-black-hole/settings.ts
function me() {
	return {
		cameraY: .12,
		distance: 13.5,
		diskRadius: 9,
		fov: 3,
		centerX: 0,
		centerY: 0,
		cameraRoll: 0,
		mouseYaw: .12,
		centerFade: 0,
		bloom: {
			strength: 1,
			threshold: 0,
			knee: .18,
			radius: 1.5
		},
		disk: {
			brightness: .75,
			speed: .75,
			stretch: 5.75,
			detail: 3.44,
			turbulence: 4.46,
			density: 1.38,
			doppler: 1.21,
			cloudScale: 20,
			cloudSpeed: .3,
			cloudStrength: .2,
			spare0: .43,
			spare1: -.25,
			spare2: -.67,
			spare3: .69
		},
		stars: {
			brightness: 1,
			density: 1,
			contrast: 13,
			warmth: .5,
			twinkle: 0
		}
	};
}
//#endregion
//#region node_modules/@vgpu/core/dist/errors.js
function he(e) {
	return new _e({
		code: "VGPU-FEATURE-UNSUPPORTED",
		message: `Adapter does not support requested feature(s): ${e.map((e) => `"${e}"`).join(", ")}.`,
		fix: "Remove the unsupported name(s) from init({ requiredFeatures: [...] }) or run on an adapter that supports them; gate optional code paths on device.features after init.",
		where: "init"
	});
}
function ge(e, t) {
	if (!e) return;
	let n = (t ?? []).filter((t) => !e.has(t));
	if (n.length) throw he(n);
}
var _e, T, E = t((() => {
	_e = class extends Error {
		code;
		severity;
		fix;
		where;
		cause;
		detail;
		constructor(e) {
			super(e.message, { cause: e.cause }), this.name = "VGPUError", this.code = e.code, this.severity = e.severity ?? "error", this.fix = e.fix, this.where = e.where, this.cause = e.cause, this.detail = e.detail;
		}
	}, T = class extends _e {
		constructor(e) {
			super({
				...e,
				severity: "error"
			}), this.name = "ValidationError";
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/core/dist/gpu-constants.js
function ve(e) {
	let t = globalThis.GPUBufferUsage;
	return e.reduce((e, n) => e | ye(n, t), 0);
}
function ye(e, t) {
	let n = e.toUpperCase();
	return t?.[n] ?? Ce[e];
}
function be() {
	return globalThis.GPUMapMode?.READ ?? 1;
}
function xe(e) {
	let t = globalThis.GPUTextureUsage;
	return e.reduce((e, n) => e | Se(n, t), 0);
}
function Se(e, t) {
	let n = e.toUpperCase();
	return t?.[n] ?? we[e];
}
var Ce, we, Te = t((() => {
	Ce = {
		map_read: 1,
		map_write: 2,
		copy_src: 4,
		copy_dst: 8,
		index: 16,
		vertex: 32,
		uniform: 64,
		storage: 128,
		indirect: 256,
		query_resolve: 512
	}, we = {
		copy_src: 1,
		copy_dst: 2,
		texture_binding: 4,
		storage_binding: 8,
		render_attachment: 16
	};
}));
//#endregion
//#region node_modules/@vgpu/core/dist/mock-gpu-storage.js
function Ee(e) {
	return "__vgpuMockBytes" in e;
}
function De(e) {
	return "__vgpuMockBytes" in e;
}
var Oe = t((() => {}));
//#endregion
//#region node_modules/@vgpu/core/dist/resource-lifecycle.js
function ke(e) {
	return Object.freeze({
		kind: e,
		id: Ae++
	});
}
var Ae, je, Me = t((() => {
	Ae = 1, je = class {
		callbacks = /* @__PURE__ */ new Set();
		destroyed = !1;
		onDestroy(e, t) {
			return this.destroyed ? (t(e), () => void 0) : (this.callbacks.add(t), () => {
				this.callbacks.delete(t);
			});
		}
		emit(e) {
			if (this.destroyed) return !1;
			this.destroyed = !0;
			let t = [...this.callbacks];
			this.callbacks.clear();
			let n = [];
			for (let r of t) try {
				r(e);
			} catch (e) {
				n.push(e);
			}
			if (n.length) throw n[0];
			return !0;
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/core/dist/buffer.js
function Ne(e, t, n) {
	return new T({
		code: "VGPU-EXTERNAL-BUFFER-VALIDATION",
		message: t,
		where: e,
		cause: n,
		fix: "Use a buffer with the required usage flags and an aligned in-range operation."
	});
}
var D, Pe = t((() => {
	E(), Te(), Oe(), Me(), D = class {
		device;
		gpu;
		options;
		ownership;
		destroySignal = new je();
		identity = ke("buffer");
		destroyed = !1;
		constructor(e, t, n, r = "owned") {
			this.device = e, this.gpu = t, this.options = n, this.ownership = r, Object.defineProperty(this, "assertUsable", { value: (e) => this.#e(e) });
		}
		get resourceIdentity() {
			return this.identity;
		}
		onDestroy(e) {
			return this.destroySignal.onDestroy(this, e);
		}
		#e(e = "Buffer") {
			if (this.destroyed) throw new T({
				code: "VGPU-BUFFER-DISPOSED",
				message: "Buffer is destroyed.",
				where: e,
				fix: "Wrap or create a live GPUBuffer before using it."
			});
			this.device.assertUsable(e);
		}
		write(e, t = 0) {
			this.#e("Buffer.write"), this.ownership === "external" && this.validateExternalOperation("write", t, e.byteLength, "copy_dst");
			try {
				this.device.queue.writeBuffer(this.gpu, t, e);
			} catch (e) {
				throw this.ownership === "external" ? Ne("Buffer.write", "The external GPUBuffer rejected the write operation.", e) : e;
			}
		}
		async read(e, t = 0) {
			this.#e("Buffer.read"), this.ownership === "external" && this.validateExternalOperation("read", t, e, "copy_src");
			try {
				let n = await this.device.readback.read(this.gpu, e, t);
				return this.#e("Buffer.read"), n;
			} catch (e) {
				throw e instanceof T || this.ownership !== "external" ? e : Ne("Buffer.read", "The external GPUBuffer rejected the read operation.", e);
			}
		}
		destroy() {
			this.destroyed || (this.destroyed = !0, this.destroySignal.emit(this), this.ownership === "owned" && !Ee(this.gpu) && this.gpu.destroy());
		}
		dispose() {
			this.destroy();
		}
		validateExternalOperation(e, t, n, r) {
			if (!(Number.isSafeInteger(t) && t >= 0 && t % 4 == 0 && Number.isSafeInteger(n) && n >= 0 && n % 4 == 0 && t <= this.options.size && n <= this.options.size - t)) throw Ne(`Buffer.${e}`, "External buffer offsets and lengths must be non-negative, 4-byte aligned, and within the buffer size.");
			if ((this.gpu.usage & ve([r])) === 0) throw Ne(`Buffer.${e}`, `External buffer is missing ${r.toUpperCase()} usage.`);
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/compile.js
function Fe(e) {
	if (Re(e)) throw ze();
	let t = {
		version: 1,
		mappings: []
	}, n = {
		version: 1,
		modules: [{
			path: "<runtime>",
			text: e
		}],
		diagnostics: [],
		sourceMap: t,
		cacheKey: Ie(e)
	};
	return {
		kind: "wgsl",
		wgsl: e,
		source: {
			text: e,
			path: "<runtime>",
			imports: []
		},
		ast: n,
		sourceMap: t,
		diagnostics: [],
		cacheKey: n.cacheKey,
		entryPoints: Le(e),
		stats: {
			lines: e.split(/\r?\n/).length,
			bytes: new TextEncoder().encode(e).byteLength,
			bindGroups: 0
		}
	};
}
function Ie(e) {
	let t = 2166136261;
	for (let n = 0; n < e.length; n++) t = Math.imul(t ^ e.charCodeAt(n), 16777619);
	return { default: `vgpu-wgsl-1:${(t >>> 0).toString(16).padStart(8, "0")}` };
}
function Le(e) {
	let t = [];
	for (let n of e.matchAll(/@(vertex|fragment|compute)\s+fn\s+([A-Za-z_][A-Za-z0-9_]*)/g)) t.push(n[2]);
	return t;
}
function Re(e) {
	let t = e.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "").trimStart();
	return t.startsWith("import ") || t.startsWith("import{");
}
function ze() {
	let e = /* @__PURE__ */ Error("Runtime WGSL strings cannot contain import statements. Use a build-time loader or @vgpu/wgsl/runtime.");
	return e.name = "VGPUWGSLRuntimeImportError", e.code = "VGPU-WGSL-RUNTIME-IMPORT", e.severity = "error", e.source = "wgsl", e;
}
var Be = t((() => {}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/wgsl-identifier-rules.js
function Ve(e) {
	return /^[A-Za-z_][A-Za-z0-9_]*$/u.test(e) && e !== "_" && !e.startsWith("__") && !We.has(e) && !Ge.has(e) && !Ke.has(e);
}
var He, Ue, We, Ge, Ke, qe = t((() => {
	He = /* @__PURE__ */ new Set(/* @__PURE__ */ "alias.break.case.const.const_assert.continue.continuing.default.diagnostic.discard.else.enable.false.fn.for.if.let.loop.override.requires.return.struct.switch.true.var.while".split(".")), Ue = /* @__PURE__ */ new Set([
		"import",
		"export",
		"from",
		"as"
	]), We = /* @__PURE__ */ new Set([...He, ...Ue]), Ge = /* @__PURE__ */ new Set(/* @__PURE__ */ "NULL.Self.abstract.active.alignas.alignof.as.asm.asm_fragment.async.attribute.auto.await.become.cast.catch.class.co_await.co_return.co_yield.coherent.column_major.common.compile.compile_fragment.concept.const_cast.consteval.constexpr.constinit.crate.debugger.decltype.delete.demote.demote_to_helper.do.dynamic_cast.enum.explicit.export.extends.extern.external.fallthrough.filter.final.finally.friend.from.fxgroup.get.goto.groupshared.highp.impl.implements.import.inline.instanceof.interface.layout.lowp.macro.macro_rules.match.mediump.meta.mod.module.move.mut.mutable.namespace.new.nil.noexcept.noinline.nointerpolation.non_coherent.noncoherent.noperspective.null.nullptr.of.operator.package.packoffset.partition.pass.patch.pixelfragment.precise.precision.premerge.priv.protected.pub.public.readonly.ref.regardless.register.reinterpret_cast.require.resource.restrict.self.set.shared.sizeof.smooth.snorm.static.static_assert.static_cast.std.subroutine.super.target.template.this.thread_local.throw.trait.try.type.typedef.typeid.typename.typeof.union.unless.unorm.unsafe.unsized.use.using.varying.virtual.volatile.wgsl.where.with.writeonly.yield".split(".")), Ke = /* @__PURE__ */ new Set(["binding_array"]);
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/shader-function-export.js
function Je(e) {
	if (typeof e != "object" || !e) return !1;
	try {
		let { name: t, resolvedName: n, parameterNames: r } = e;
		return Ye(t) && Ye(n) && Xe(r);
	} catch {
		return !1;
	}
}
function Ye(e) {
	return typeof e == "string" && Ve(e);
}
function Xe(e) {
	if (!Array.isArray(e)) return !1;
	let t = /* @__PURE__ */ new Set();
	for (let n = 0; n < e.length; n++) {
		let r = e[n];
		if (!Ye(r) || t.has(r)) return !1;
		t.add(r);
	}
	return !0;
}
var Ze = t((() => {
	qe();
})), Qe = t((() => {
	Be(), Ze();
}));
//#endregion
//#region node_modules/@vgpu/core/dist/texture-read-selection.js
function $e(e, t) {
	let n = 2 ** t;
	return [
		Math.max(1, Math.floor(e.width / n)),
		Math.max(1, Math.floor(e.height / n)),
		e.dimension === "3d" ? Math.max(1, Math.floor(e.depthOrArrayLayers / n)) : e.depthOrArrayLayers
	];
}
function et(e, t, n) {
	let r = (e) => {
		throw new T({
			code: "VGPU-CORE-TEXTURE-READ-INVALID",
			where: n,
			message: e,
			fix: "Select an allocated mip and an in-bounds region on a single-sample texture with usage \"copy_src\"."
		});
	};
	(!t || !Number.isSafeInteger(t.mipLevel) || t.mipLevel < 0 || t.mipLevel >= e.mipLevelCount) && r("mipLevel must select an allocated mip using a nonnegative safe integer."), e.sampleCount !== 1 && r("Texture readback requires sampleCount 1; resolve multisampled textures explicitly before reading."), e.usage & xe(["copy_src"]) || r("Texture readback requires explicit \"copy_src\" usage.");
	let i = $e(e, t.mipLevel), a = t.region === "all" ? [
		0,
		0,
		0
	] : t.region?.origin, o = t.region === "all" ? i : t.region?.size;
	(!Array.isArray(a) || a.length !== 3 || !Array.isArray(o) || o.length !== 3) && r("region must be \"all\" or contain origin and size triples.");
	for (let e = 0; e < 3; e++) {
		let n = a[e], s = o[e];
		(!Number.isSafeInteger(n) || n < 0 || !Number.isSafeInteger(s) || s <= 0 || n > i[e] || s > i[e] - n) && r(`Read region axis ${e} is outside mip ${t.mipLevel} extent [${i}].`);
	}
	return {
		mipLevel: t.mipLevel,
		origin: [...a],
		size: [...o],
		extent: i
	};
}
function tt(e, t, n) {
	let r = Math.min(t ?? 4294967295, 4294967295);
	if (!Number.isSafeInteger(e) || e <= 0 || e > r) throw new T({
		code: "VGPU-CORE-TEXTURE-READ-INVALID",
		where: n,
		message: `Readback allocation of ${e} bytes exceeds the supported limit (${r}).`,
		fix: "Read a smaller region or a higher mip level."
	});
}
var nt = t((() => {
	E(), Te();
}));
//#endregion
//#region node_modules/@vgpu/core/dist/readback.js
function rt(e) {
	try {
		e.unmap();
	} catch {}
}
function it(e) {
	try {
		e.destroy();
	} catch {}
}
function at(e, t) {
	return Math.ceil(e / t) * t;
}
function ot(e, t) {
	let n = pt[e];
	if (n) return n;
	throw new T({
		code: "VGPU-CORE-UNSUPPORTED-FORMAT",
		message: `Texture.read does not support format ${e}. Supported formats: ${Object.keys(pt).join(", ")}.`,
		where: t
	});
}
function st(e, t, n = "Texture.readFloats") {
	let r = ot(t, n), i = r.bytesPerPixel / r.components, a = Math.floor(e.byteLength / i), o = new Float32Array(a), s = new DataView(e.buffer, e.byteOffset, e.byteLength);
	for (let e = 0; e < a; e++) r.componentType === "unorm8" ? o[e] = s.getUint8(e) / 255 : r.componentType === "float16" ? o[e] = ct(s.getUint16(e * 2, !0)) : o[e] = s.getFloat32(e * 4, !0);
	return o;
}
function ct(e) {
	let t = e & 32768 ? -1 : 1, n = e >> 10 & 31, r = e & 1023;
	return n === 0 ? t * r * 2 ** -24 : n === 31 ? r === 0 ? t * Infinity : NaN : t * (r + 1024) * 2 ** (n - 25);
}
function lt(e, t, n) {
	let { size: [r, i, a], origin: [o, s, c], extent: l } = t, u = r * n.bytesPerPixel, d = new Uint8Array(u * i * a);
	for (let t = 0; t < a; t++) for (let r = 0; r < i; r++) {
		let a = (((c + t) * l[1] + s + r) * l[0] + o) * n.bytesPerPixel;
		d.set(e.subarray(a, a + u), (t * i + r) * u);
	}
	return n.swizzle === "bgra-to-rgba" && ut(d), d;
}
function ut(e) {
	for (let t = 0; t < e.length; t += 4) {
		let n = e[t];
		e[t] = e[t + 2], e[t + 2] = n;
	}
}
var dt, ft, pt, mt = t((() => {
	E(), Te(), Oe(), nt(), dt = ve(["copy_dst", "map_read"]), ft = class {
		device;
		constructor(e) {
			this.device = e;
		}
		async read(e, t, n) {
			if (Ee(e)) return e.__vgpuMockBytes.slice(n, n + t).buffer;
			let r = this.device.createBuffer({
				size: t,
				usage: dt
			});
			try {
				let i = this.device.createCommandEncoder();
				i.copyBufferToBuffer(e, n, r, 0, t), this.device.queue.submit([i.finish()]), await r.mapAsync(be());
				let a = r.getMappedRange().slice(0);
				return rt(r), a;
			} finally {
				it(r);
			}
		}
		async readTexture(e, t) {
			let n = ot(e.format, "Readback.readTexture"), r = et(e, t, "Readback.readTexture"), [i, a, o] = r.size, s = n.bytesPerPixel, c = at(i * s, 256), l = c * a * o;
			if (tt(l, this.device.limits?.maxBufferSize, "Readback.readTexture"), De(e)) {
				let t = e.__vgpuMockMips?.[r.mipLevel] ?? (r.mipLevel === 0 ? e.__vgpuMockBytes : void 0);
				if (!t) throw Error("Mock texture has no storage for the selected mip.");
				return lt(t, r, n);
			}
			let u = this.device.createBuffer({
				size: l,
				usage: dt
			}), d;
			try {
				let t = this.device.createCommandEncoder();
				t.copyTextureToBuffer({
					texture: e,
					mipLevel: r.mipLevel,
					origin: r.origin
				}, {
					buffer: u,
					bytesPerRow: c,
					rowsPerImage: a
				}, {
					width: i,
					height: a,
					depthOrArrayLayers: o
				}), this.device.queue.submit([t.finish()]), await u.mapAsync(be());
				let n = new Uint8Array(u.getMappedRange());
				d = new Uint8Array(i * a * o * s);
				for (let e = 0; e < a * o; e++) {
					let t = e * c, r = e * i * s;
					d.set(n.subarray(t, t + i * s), r);
				}
				rt(u);
			} finally {
				it(u);
			}
			return n.swizzle === "bgra-to-rgba" && ut(d), d;
		}
		destroy() {}
	}, pt = {
		r8unorm: {
			bytesPerPixel: 1,
			components: 1,
			componentType: "unorm8"
		},
		rg8unorm: {
			bytesPerPixel: 2,
			components: 2,
			componentType: "unorm8"
		},
		rgba8unorm: {
			bytesPerPixel: 4,
			components: 4,
			componentType: "unorm8"
		},
		"rgba8unorm-srgb": {
			bytesPerPixel: 4,
			components: 4,
			componentType: "unorm8"
		},
		bgra8unorm: {
			bytesPerPixel: 4,
			components: 4,
			componentType: "unorm8",
			swizzle: "bgra-to-rgba"
		},
		"bgra8unorm-srgb": {
			bytesPerPixel: 4,
			components: 4,
			componentType: "unorm8",
			swizzle: "bgra-to-rgba"
		},
		r16float: {
			bytesPerPixel: 2,
			components: 1,
			componentType: "float16"
		},
		rg16float: {
			bytesPerPixel: 4,
			components: 2,
			componentType: "float16"
		},
		rgba16float: {
			bytesPerPixel: 8,
			components: 4,
			componentType: "float16"
		},
		r32float: {
			bytesPerPixel: 4,
			components: 1,
			componentType: "float32"
		},
		rg32float: {
			bytesPerPixel: 8,
			components: 2,
			componentType: "float32"
		},
		rgba32float: {
			bytesPerPixel: 16,
			components: 4,
			componentType: "float32"
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/core/dist/mock-gpu.js
function ht(e) {
	return {
		size: e,
		usage: ve(["copy_src", "copy_dst"])
	};
}
var gt = t((() => {
	Te();
})), _t, vt = t((() => {
	_t = class {
		gpu;
		guard;
		constructor(e, t = () => void 0) {
			this.gpu = e, this.guard = t;
		}
		writeBuffer(e, t, n) {
			this.guard("Queue.writeBuffer"), this.gpu.writeBuffer(e, t, n);
		}
		async flush() {
			this.guard("Queue.flush"), await this.gpu.onSubmittedWorkDone?.(), this.guard("Queue.flush");
		}
	};
})), yt, bt = t((() => {
	yt = class {
		gpu;
		resolved;
		constructor(e, t) {
			this.gpu = e, this.resolved = t;
		}
		dispose() {}
		get kind() {
			return this.resolved.kind;
		}
		get source() {
			return this.resolved.source;
		}
		get code() {
			return this.resolved.wgsl;
		}
		get entryPoints() {
			return this.resolved.entryPoints;
		}
		get stats() {
			return this.resolved.stats;
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/core/dist/texture-options.js
function xt(e) {
	return Object.freeze({
		...e,
		size: Object.freeze([...e.size]),
		usage: Object.freeze([...e.usage]),
		...e.viewFormats === void 0 ? {} : { viewFormats: Object.freeze([...e.viewFormats]) }
	});
}
function St(e) {
	return [
		e.size[0],
		e.kind === "1d" ? 1 : e.size[1],
		e.kind === "2d-array" ? e.layers : e.kind === "3d" ? e.size[2] : 1
	];
}
function Ct(e, t) {
	let n = (e, t, n) => {
		throw new T({
			code: e,
			message: t,
			fix: n,
			where: "Device.createTexture"
		});
	};
	(!e || ![
		"1d",
		"2d",
		"3d",
		"2d-array"
	].includes(e.kind)) && n("VGPU-TEXTURE-KIND-REQUIRED", "Texture kind must be explicit.", "Pass kind: \"1d\", \"2d\", \"3d\", or \"2d-array\"."), "dimension" in e && n("VGPU-TEXTURE-KIND-REQUIRED", "Texture dimension has been replaced by kind.", "Use kind and, for \"2d-array\", a separate layers count.");
	let r = e.kind === "1d" ? 1 : e.kind === "3d" ? 3 : 2;
	(!Array.isArray(e.size) || e.size.length !== r || !Array.from(e.size).every(wt)) && n("VGPU-TEXTURE-SIZE-REQUIRED", `Texture ${e.kind} needs ${r} positive integer spatial dimensions.`, "Pass size with exactly the spatial dimensions of kind; put array layers in layers."), (e.kind === "2d-array" ? !wt(e.layers) : e.layers !== void 0) && n("VGPU-TEXTURE-LAYERS-INVALID", "Only 2d-array textures take a positive integer layers count.", "Use kind: \"2d-array\", size: [width, height], layers: count."), (!Array.isArray(e.usage) || e.usage.length === 0 || !Array.from(e.usage).every((e) => Tt.has(e))) && n("VGPU-TEXTURE-USAGE-REQUIRED", "Texture usage must be a nonempty list of known capabilities.", "Pass explicit usage, such as [\"texture_binding\", \"copy_dst\"]. No capabilities are added automatically."), (typeof e.format != "string" || !e.format) && n("VGPU-TEXTURE-FORMAT-REQUIRED", "Texture format is required.", "Pass an explicit GPUTextureFormat, such as \"rgba16float\".");
	let i = e.mipLevelCount ?? 1, a = e.kind === "1d" ? 1 : Math.floor(Math.log2(Math.max(...e.size))) + 1;
	(!wt(i) || i > a) && n("VGPU-TEXTURE-MIPS-INVALID", `mipLevelCount must be between 1 and ${a}.`, "Omit mipLevelCount for the base level, or request a valid allocation count. Contents are not generated automatically.");
	let o = e.sampleCount ?? 1;
	o !== 1 && o !== 4 && n("VGPU-TEXTURE-SAMPLES-INVALID", "sampleCount must be 1 or 4.", "Omit sampleCount for single-sample storage."), o === 4 && (e.kind !== "2d" || i !== 1 || !e.usage.includes("render_attachment") || e.usage.includes("storage_binding")) && n("VGPU-TEXTURE-SAMPLES-INVALID", "MSAA requires a 2d render attachment with one mip and no storage_binding.", "Use a single-sample texture for storage, arrays or volumes; resolve MSAA into a separate texture."), e.kind === "1d" && (e.usage.includes("render_attachment") || /^(depth|stencil|bc|etc2|eac|astc)/.test(e.format)) && n("VGPU-TEXTURE-KIND-INVALID", "1d textures cannot be render attachments or use depth/stencil/compressed formats.", "Use a 2d texture or a plain color format with non-attachment usage.");
	let s = St(e), c = e.kind === "1d" ? "maxTextureDimension1D" : e.kind === "3d" ? "maxTextureDimension3D" : "maxTextureDimension2D", l = t.limits?.[c];
	(l !== void 0 && e.size.some((e) => e > l) || e.kind === "2d-array" && t.limits?.maxTextureArrayLayers !== void 0 && s[2] > t.limits.maxTextureArrayLayers) && n("VGPU-TEXTURE-LIMIT", "Texture dimensions or layers exceed enabled device limits.", "Reduce the allocation or request sufficient limits when initializing the device.");
	let u = (e) => t.features?.has(e) ?? !1;
	e.usage.includes("storage_binding") && !Et.has(e.format) && !(e.format === "bgra8unorm" && u("bgra8unorm-storage")) && !(Dt.has(e.format) && u("texture-formats-tier1")) && n("VGPU-TEXTURE-STORAGE-FORMAT", `Format ${e.format} does not support storage_binding with the enabled features.`, "Choose a supported storage format, enable the required format feature, or explicitly omit storage_binding from usage."), e.viewFormats !== void 0 && (!Array.isArray(e.viewFormats) || !Array.from(e.viewFormats).every((t) => typeof t == "string" && t.replace(/-srgb$/, "") === e.format.replace(/-srgb$/, ""))) && n("VGPU-TEXTURE-VIEW-FORMAT", "viewFormats must list formats compatible with the texture format.", "Only the same format or its compatible linear/sRGB counterpart is allowed; native device restrictions also apply.");
}
function wt(e) {
	return typeof e == "number" && Number.isSafeInteger(e) && e > 0;
}
var Tt, Et, Dt, Ot = t((() => {
	E(), Tt = /* @__PURE__ */ new Set([
		"copy_src",
		"copy_dst",
		"texture_binding",
		"storage_binding",
		"render_attachment"
	]), Et = /* @__PURE__ */ new Set([
		"rgba8unorm",
		"rgba8snorm",
		"rgba8uint",
		"rgba8sint",
		"rgba16float",
		"rgba16uint",
		"rgba16sint",
		"rgba32float",
		"rgba32uint",
		"rgba32sint",
		"r32float",
		"r32uint",
		"r32sint",
		"rg32float",
		"rg32uint",
		"rg32sint"
	]), Dt = /* @__PURE__ */ new Set([
		"r8unorm",
		"r8snorm",
		"r8uint",
		"r8sint",
		"rg8unorm",
		"rg8snorm",
		"rg8uint",
		"rg8sint",
		"r16uint",
		"r16sint",
		"r16float",
		"rg16uint",
		"rg16sint",
		"rg16float",
		"rgb10a2uint",
		"rgb10a2unorm",
		"rg11b10ufloat",
		"r16unorm",
		"r16snorm",
		"rg16unorm",
		"rg16snorm",
		"rgba16unorm",
		"rgba16snorm"
	]);
}));
//#endregion
//#region node_modules/@vgpu/core/dist/texture.js
function kt(e) {
	let [t, n, r] = St(e), i = {
		label: e.label,
		size: {
			width: t,
			height: n,
			depthOrArrayLayers: r
		},
		dimension: e.kind === "2d-array" ? "2d" : e.kind,
		format: e.format,
		usage: xe(e.usage)
	};
	return e.mipLevelCount !== void 0 && (i.mipLevelCount = e.mipLevelCount), e.sampleCount !== void 0 && (i.sampleCount = e.sampleCount), e.viewFormats !== void 0 && (i.viewFormats = [...e.viewFormats]), e.kind === "2d-array" && (i.textureBindingViewDimension = "2d-array"), i;
}
var At, O, jt = t((() => {
	E(), Te(), Oe(), mt(), nt(), Me(), Ot(), At = Symbol.for("vgpu/Texture"), O = class {
		device;
		ownership;
		[At] = !0;
		destroySignal = new je();
		identity = ke("texture");
		currentGpu;
		currentOptions;
		defaultView = null;
		destroyed = !1;
		constructor(e, t, n, r = "owned") {
			this.device = e, this.ownership = r, this.currentGpu = t, this.currentOptions = xt(n);
		}
		get gpu() {
			return this.currentGpu;
		}
		get options() {
			return this.currentOptions;
		}
		get size() {
			return this.options.size;
		}
		get format() {
			return this.options.format;
		}
		get usage() {
			return this.options.usage;
		}
		get mipLevelCount() {
			return this.options.mipLevelCount ?? 1;
		}
		get sampleCount() {
			return this.options.sampleCount ?? 1;
		}
		get kind() {
			return this.options.kind;
		}
		get layers() {
			return this.options.kind === "2d-array" ? this.options.layers : 1;
		}
		get dimension() {
			return this.options.kind === "2d-array" ? "2d" : this.options.kind;
		}
		get viewFormats() {
			return this.options.viewFormats ?? [];
		}
		get label() {
			return this.options.label;
		}
		get resourceIdentity() {
			return this.identity;
		}
		onDestroy(e) {
			return this.destroySignal.onDestroy(this, e);
		}
		get view() {
			return this.assertAlive(), this.defaultView ??= this.createView(), this.defaultView;
		}
		createView(e) {
			return this.assertAlive("Texture.createView"), this.gpu.createView(this.kind === "2d-array" ? {
				...e,
				dimension: e?.dimension ?? "2d-array"
			} : e);
		}
		async read(e) {
			this.assertAlive("Texture.read");
			let t = await this.device.readback.readTexture(this.gpu, e);
			return this.assertAlive("Texture.read"), t;
		}
		async readFloats(e) {
			this.assertAlive("Texture.readFloats");
			let t = ot(this.options.format, "Texture.readFloats"), { size: n } = et(this.gpu, e, "Texture.readFloats");
			return tt(n[0] * n[1] * n[2] * t.components * 4, this.device.gpu.limits?.maxBufferSize, "Texture.readFloats"), st(await this.read(e), this.options.format);
		}
		destroy() {
			if (!this.destroyed) {
				this.destroyed = !0, this.defaultView = null;
				try {
					this.destroySignal.emit(this);
				} finally {
					this.ownership !== "external" && !De(this.gpu) && this.gpu.destroy();
				}
			}
		}
		dispose() {
			this.destroy();
		}
		assertAlive(e = "Texture") {
			if (this.destroyed) throw new T({
				code: "VGPU-CORE-TEXTURE-DESTROYED",
				message: "Texture is destroyed",
				where: e
			});
			this.device.assertUsable?.(e);
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/core/dist/device.js
function Mt(e) {
	return !Number.isFinite(e.size) || e.size <= 0 ? Nt("Buffer size must be greater than zero.") : e.usage.length === 0 ? Nt("Buffer usage must not be empty.") : null;
}
function Nt(e) {
	return new T({
		code: "VGPU-CORE-INVALID-USAGE",
		message: e,
		where: "Device.createBuffer"
	});
}
function Pt(e) {
	return {
		label: e.label,
		size: e.size,
		usage: ve(e.usage)
	};
}
function Ft(e) {
	return e ? new T({
		code: "VGPU-CORE-VALIDATION",
		message: e.message,
		where: "GPUDevice.popErrorScope",
		cause: e
	}) : null;
}
function It(e) {
	if (typeof e != "object" && typeof e != "function" || e === null) return !1;
	let t = e;
	return Number.isSafeInteger(t.size) && (t.size ?? -1) >= 0 && Number.isSafeInteger(t.usage) && (t.usage ?? -1) >= 0 && typeof t.destroy == "function";
}
function Lt(e) {
	return zt.filter((t) => (e & ve([t])) !== 0);
}
var Rt, zt, Bt = t((() => {
	Qe(), Pe(), Te(), gt(), vt(), bt(), jt(), Ot(), mt(), E(), Rt = class {
		gpu;
		adapterInfo;
		queue;
		readback;
		isCompatibilityMode;
		scopes = [];
		ownership;
		state = "alive";
		lossInfo;
		observeLoss = !0;
		constructor(e, t = null, n = "owned", r = {}) {
			this.gpu = e, this.adapterInfo = t, Object.defineProperty(this, "assertUsable", { value: (e) => this.#e(e) }), this.ownership = typeof n == "string" ? n : "owned";
			let i = typeof n == "string" ? r : n;
			this.isCompatibilityMode = i.isCompatibilityMode ?? !1, this.queue = new _t(e.queue, (e) => this.#e(e)), this.readback = new ft(e);
			let a = e.lost;
			a && typeof a.then == "function" && Promise.resolve(a).then((e) => {
				this.observeLoss && this.state === "alive" && (this.lossInfo = e, this.state = "lost");
			}, () => void 0);
		}
		get limits() {
			return this.#e("Device.limits"), this.gpu.limits;
		}
		get features() {
			return this.#e("Device.features"), this.gpu.features;
		}
		createShader(e) {
			this.#e("Device.createShader");
			let t = typeof e == "string" ? Fe(e) : e;
			return new yt(this.gpu.createShaderModule({ code: t.wgsl }), t);
		}
		createTexture(e) {
			this.#e("Device.createTexture"), Ct(e, this.gpu);
			let t = xt(e);
			return new O(this, this.gpu.createTexture(kt(t)), t);
		}
		createBuffer(e) {
			this.#e("Device.createBuffer");
			let t = Mt(e);
			t && this.captureError(t);
			let n = t ? ht(Math.max(4, e.size || 4)) : Pt(e);
			return new D(this, this.gpu.createBuffer(n), e);
		}
		wrapBuffer(e) {
			if (this.#e("Device.wrapBuffer"), !It(e)) throw new T({
				code: "VGPU-EXTERNAL-BUFFER-INVALID",
				message: "Device.wrapBuffer requires a GPUBuffer with finite size and usage properties.",
				where: "Device.wrapBuffer",
				fix: "Pass a live GPUBuffer created for this GPUDevice."
			});
			let t = {
				size: e.size,
				usage: Lt(e.usage),
				...e.label ? { label: e.label } : {}
			};
			return new D(this, e, t, "external");
		}
		pushErrorScope(e) {
			this.#e("Device.pushErrorScope"), this.scopes.push([]), this.gpu.pushErrorScope?.(e);
		}
		async popErrorScope() {
			this.#e("Device.popErrorScope");
			let e = this.scopes.pop(), t = await this.gpu.popErrorScope?.();
			return this.#e("Device.popErrorScope"), e?.[0] ?? Ft(t) ?? null;
		}
		#e(e) {
			if (this.state === "alive") return;
			if (this.state === "disposed") throw new T({
				code: "VGPU-DEVICE-DISPOSED",
				message: "The GPU device wrapper has been disposed.",
				where: e,
				fix: "Create a new Gpu instance before performing more work."
			});
			let t = this.lossInfo?.reason, n = this.lossInfo?.message;
			throw new T({
				code: "VGPU-DEVICE-LOST",
				message: `The GPU device was lost${t ? ` (${t})` : ""}${n ? `: ${n}` : "."}`,
				where: e,
				cause: this.lossInfo
			});
		}
		destroy() {
			if (this.state === "disposed") return;
			let e = this.state === "lost";
			this.state = "disposed", this.observeLoss = !1, this.scopes.length = 0, this.readback.destroy(), this.ownership === "owned" && !e && this.gpu.destroy();
		}
		dispose() {
			this.destroy();
		}
		captureError(e) {
			let t = this.scopes.at(-1);
			if (t) t.push(e);
			else throw e;
		}
	}, zt = [
		"map_read",
		"map_write",
		"copy_src",
		"copy_dst",
		"index",
		"vertex",
		"uniform",
		"storage",
		"indirect",
		"query_resolve"
	];
}));
//#endregion
//#region node_modules/@vgpu/core/dist/bind-group-metadata.js
function Vt(e, t) {
	return Kt.set(e, Gt(t)), e;
}
function Ht(e) {
	return Kt.get(e);
}
function Ut(e, t) {
	let n = Ht(t);
	return n && qt.set(e, { layout: n }), e;
}
function Wt(e) {
	return qt.get(e);
}
function Gt(e) {
	return { entries: e.entries.map((e) => ({ ...e })) };
}
var Kt, qt, Jt = t((() => {
	Kt = /* @__PURE__ */ new WeakMap(), qt = /* @__PURE__ */ new WeakMap();
}));
//#endregion
//#region node_modules/@vgpu/core/dist/bind.js
function Yt(e, t) {
	return Vt(an(e).createBindGroupLayout({
		label: t.label,
		entries: [...t.entries]
	}), { entries: t.entries });
}
function Xt(e, t) {
	if (!t.layout) throw new T({
		code: "VGPU-CORE-BIND-GROUP-LAYOUT-REQUIRED",
		message: "createBindGroup requires an explicit layout. vgpu does not use layout: \"auto\" for bind groups.",
		where: "createBindGroup"
	});
	return Ut(an(e).createBindGroup({
		label: t.label,
		layout: t.layout,
		entries: [...t.entries]
	}), t.layout);
}
function Zt(e, t, n = {}) {
	return {
		binding: dn(e),
		visibility: fn(t),
		buffer: {
			...n,
			type: "uniform"
		}
	};
}
function Qt(e, t, n = {}) {
	return {
		binding: dn(e),
		visibility: fn(t),
		buffer: {
			...n,
			type: "storage"
		}
	};
}
function $t(e, t, n = {}) {
	return {
		binding: dn(e),
		visibility: fn(t),
		buffer: {
			...n,
			type: "read-only-storage"
		}
	};
}
function en(e, t, n = {}) {
	return {
		binding: dn(e),
		visibility: fn(t),
		texture: n
	};
}
function tn(e, t, n) {
	return {
		binding: dn(e),
		visibility: fn(t),
		storageTexture: n
	};
}
function nn(e, t, n = {}) {
	return {
		binding: dn(e),
		visibility: fn(t),
		sampler: n
	};
}
function rn(e, t) {
	return {
		binding: dn(e),
		resource: on(t)
	};
}
function an(e) {
	return e instanceof Rt || "gpu" in e ? e.gpu : e;
}
function on(e) {
	return e instanceof D ? { buffer: e.gpu } : e instanceof O || un(e) ? e.createView() : ln(e) ? { buffer: e.gpu } : sn(e) ? e : cn(e) ? { buffer: e } : e;
}
function sn(e) {
	return mn(e) && "buffer" in e;
}
function cn(e) {
	return mn(e) && "size" in e && "usage" in e && typeof e.destroy == "function";
}
function ln(e) {
	return mn(e) && cn(e.gpu);
}
function un(e) {
	return mn(e) && typeof e.createView == "function" && "gpu" in e;
}
function dn(e) {
	if (!Number.isInteger(e) || e < 0) throw new T({
		code: "VGPU-CORE-BINDING-INVALID",
		message: "Binding entries require an explicit non-negative integer binding number.",
		where: "bind"
	});
	return e;
}
function fn(e) {
	return typeof e == "number" ? e : (typeof e == "string" ? e.split(/[|,\s]+/) : e).reduce((e, t) => e | pn(t), 0);
}
function pn(e) {
	let t = e.trim().toLowerCase(), n = globalThis.GPUShaderStage, r = {
		vertex: n?.VERTEX ?? 1,
		fragment: n?.FRAGMENT ?? 2,
		compute: n?.COMPUTE ?? 4
	}[t];
	if (!r) throw new T({
		code: "VGPU-CORE-VISIBILITY-INVALID",
		message: `Unknown shader stage visibility '${e}'.`,
		where: "bind"
	});
	return r;
}
function mn(e) {
	return typeof e == "object" && !!e;
}
var hn, gn = t((() => {
	Jt(), Pe(), Bt(), E(), jt(), hn = {
		uniform: Zt,
		storage: Qt,
		readonlyStorage: $t,
		texture: en,
		storageTexture: tn,
		sampler: nn,
		resource: rn
	};
})), k = t((() => {
	Pe(), Bt(), vt(), bt(), jt(), Me(), Ot(), E(), gn(), Jt(), gt();
}));
//#endregion
//#region node_modules/vgpu/dist/errors.js
function _n(e, t, n = "resource") {
	return new I({
		code: "VGPU-R1-BINDING-DESTROYED",
		message: `Binding '${t.name}' (@group(${t.group}) @binding(${t.binding})) in '${e}' refers to destroyed resource '${n}'.`,
		where: `${e}.${t.name}`,
		fix: `Create a live resource and call set({ ${t.name}: replacement }). Direct attachment references do not follow target.resize(); bind the Target itself to follow replacements. Re-record bundles that captured the old resource.`,
		detail: {
			binding: t.binding,
			bindingName: t.name,
			resourceName: n
		}
	});
}
function vn(e, t, n, r, i, a) {
	let o = t === "vertex" ? "Vertex" : "Fragment", s = t === "vertex" ? "VERTEX" : "FRAGMENT", c = `maxStorageBuffersIn${o}Stage`;
	return new I({
		code: `VGPU-LIMIT-STORAGE-${s}`,
		message: `${o} entry '${n}' in '${e}' uses ${r} storage buffer(s), but device limit ${c} is ${i}.`,
		fix: t === "vertex" ? `Request init({ requiredLimits: { ${c}: ${r} } }) if the adapter supports it, or move vertex data to geometry(gpu, ...) vertex streams.` : `Request init({ requiredLimits: { ${c}: ${r} } }) if the adapter supports it, or reduce fragment storage buffers.`,
		where: `${e}.pipelineLayout`,
		detail: {
			stage: t,
			entryPoint: n,
			count: r,
			limit: i,
			bindings: a.map(({ name: e, group: t, binding: n }) => ({
				name: e,
				group: t,
				binding: n
			}))
		}
	});
}
function yn(e, t, n, r, i) {
	return new I({
		code: "VGPU-SET-TEXTURE-FILTERABILITY",
		message: `${r} (${n}) cannot satisfy filtering texture '${t.name}' @group(${t.group}) @binding(${t.binding}).`,
		fix: "Use a filterable format; request float32-filterable for rgba32float when supported; or use textureLoad without a sampler.",
		where: `${e}.set`,
		detail: {
			format: n,
			group: t.group,
			binding: t.binding,
			bindingName: t.name,
			resourceName: r,
			samplerName: i?.name,
			samplerGroup: i?.group,
			samplerBinding: i?.binding
		}
	});
}
function bn(e, t) {
	let n = Br(e, t);
	return new I({
		code: "VGPU-R1-BINDING-NEVER-SET",
		message: `Unset \`${t.name}\` @group(${t.group}) @binding(${t.binding}) in '${e}'. Fix: ${n}; or ${e}.group(${t.group}, bindGroup).`,
		where: `${e}.draw`
	});
}
function xn(e, t) {
	let n = t === "lib" ? "lib-owned by its first JS set()" : "user-owned by its first resource set()", r = t === "lib" ? `Fix: pass a resource from the start: wave.set({ ${e}: new Uniform(gpu.device, { size: 4 }) }).` : `Fix: pass JS values from the first set(): wave.set({ ${e}: jsValue }).`;
	return new I({
		code: "VGPU-R1-OWNERSHIP-FLIP",
		message: `\`${e}\` is ${n}; ownership cannot change. ${r}`,
		where: "set"
	});
}
function Sn(e, t) {
	return new I({
		code: "VGPU-R4-GROUP-CLAIMED",
		message: `group ${t} of '${e}' is claimed; set() cannot update it.`,
		fix: `Call set() first, or build from ${e}.layout(${t}); pass dynamic offsets to p.draw().`,
		where: `${e}.set`
	});
}
function Cn(e, t, n, r) {
	return new I({
		code: "VGPU-R4-GROUP-INCOMPATIBLE",
		message: `claimed group ${t} in '${e}' is incompatible: ${n}.`,
		fix: `Build from ${e}.layout(${t}, { dynamicOffsets? }) then call ${e}.group(${t}, bindGroup).`,
		where: `${e}.group`,
		cause: r
	});
}
function wn(e, t, n) {
	return new I({
		code: "VGPU-R4-GROUP-VALIDATION",
		message: `WebGPU rejected claimed group ${t} in '${e}'.`,
		fix: `Build from ${e}.layout(${t}); pass offsets via p.draw(draw, { offsets: { ${t}: [...] } }).`,
		where: `${e}.draw`,
		cause: n,
		detail: {
			drawLabel: e,
			group: t
		}
	});
}
function Tn(e, t) {
	return new I({
		code: "VGPU-BLEND-INVALID",
		message: `Invalid blend '${String(t)}' in '${e}'.`,
		fix: "Use \"alpha\", \"additive\", \"premultiplied\", or { color, alpha? } components.",
		where: "draw"
	});
}
function En(e, t) {
	return new I({
		code: "VGPU-BLEND-CONSTANT-INVALID",
		message: `Invalid blendConstant in '${e}': ${t}`,
		fix: "Use [r, g, b, a] finite numbers with a blend whose color or alpha uses \"constant\"/\"one-minus-constant\"; omit it to keep the pass default (0, 0, 0, 0).",
		where: "draw"
	});
}
function Dn(e, t) {
	return new I({
		code: "VGPU-BUNDLE-BLEND-CONSTANT",
		message: `bundle '${e}' cannot record draw '${t}': blendConstant is render-pass state and render bundle encoders cannot set it.`,
		fix: "Encode the draw with p.draw(...) in a frame pass, or drop blendConstant from the draw.",
		where: "bundle"
	});
}
function On(e, t) {
	return new I({
		code: "VGPU-WRITEMASK-INVALID",
		message: `Invalid writeMask ${t} in '${e}'.`,
		fix: "Use an array of r/g/b/a; omit it for all channels.",
		where: "draw"
	});
}
function kn(e, t, n = "draw") {
	return new I({
		code: "VGPU-COLORS-INVALID",
		message: `Invalid colors in '${e}': ${t}`,
		fix: "Use one { blend?, writeMask? } or null entry per color attachment of the target, aligned by index; omit colors to apply the top-level blend/writeMask to every attachment.",
		where: n
	});
}
function An(e, t) {
	return new I({
		code: "VGPU-CULL-INVALID",
		message: `Invalid cull '${String(t)}' in '${e}'.`,
		fix: "Use \"none\", \"front\", or \"back\"; omit it for no culling.",
		where: "draw"
	});
}
function jn(e, t) {
	return new I({
		code: "VGPU-FRONTFACE-INVALID",
		message: `Invalid frontFace '${String(t)}' in '${e}'.`,
		fix: "Use \"ccw\" or \"cw\"; omit it for counter-clockwise.",
		where: "draw"
	});
}
function Mn(e, t) {
	return new I({
		code: "VGPU-UNCLIPPED-DEPTH-INVALID",
		message: `Invalid unclippedDepth in '${e}': ${t}`,
		fix: "Use a boolean. unclippedDepth: true needs the \"depth-clip-control\" device feature — request it with init({ requiredFeatures: [\"depth-clip-control\"] }) on an adapter that supports it. Omit the option to keep depth clipping.",
		where: "draw"
	});
}
function A(e, t) {
	return new I({
		code: "VGPU-DEPTH-INVALID",
		message: `Invalid depth in '${e}': ${t}`,
		fix: "Use false or { write?, compare?, bias?, biasSlopeScale?, biasClamp? }; omit it for { write: true, compare: \"less-equal\" }.",
		where: "draw"
	});
}
function Nn(e, t, n = "draw") {
	return new I({
		code: "VGPU-STENCIL-INVALID",
		message: `Invalid stencil in '${e}': ${t}`,
		fix: "Use { front?, back?, readMask?, writeMask?, ref? } with GPUCompareFunction/GPUStencilOperation faces and u32 masks, against a target whose depth format has a stencil aspect (depth: \"depth24plus-stencil8\"); omit it for WebGPU's pass-through defaults.",
		where: n
	});
}
function Pn(e, t) {
	return new I({
		code: "VGPU-BUNDLE-STENCIL-REF",
		message: `bundle '${e}' cannot record draw '${t}': stencil.ref is render-pass state and render bundle encoders cannot set it.`,
		fix: "Encode the draw with p.draw(...) in a frame pass, or drop ref from the draw's stencil.",
		where: "bundle"
	});
}
function Fn(e, t, n = "draw") {
	return new I({
		code: "VGPU-MULTISAMPLE-INVALID",
		message: `Invalid multisample in '${e}': ${t}`,
		fix: "Use { alphaToCoverage?, mask? }: alphaToCoverage needs a target created with msaa: true, and mask must be an integer in [0, 0xFFFFFFFF] (bits above the target's sampleCount are ignored). Omit multisample for full-coverage defaults.",
		where: n
	});
}
function In(e, t, n = "draw") {
	return new I({
		code: "VGPU-CONSTANTS-INVALID",
		message: `Invalid constants in '${e}': ${t}`,
		fix: "Key WGSL `override` constants by name, or by the decimal string of N when the declaration has @id(N); values are finite numbers or booleans, converted to the override's WGSL type (bool/i32/u32/f32/f16). Every override without a default value must be provided. Omit constants to keep the WGSL defaults.",
		where: n
	});
}
function Ln(e, t, n = "draw") {
	return new I({
		code: "VGPU-ENTRY-INVALID",
		message: `Invalid entry in '${e}': ${t}`,
		fix: "Name an entry point declared in the shader with the matching stage — { vertex?, fragment? } strings for draw, one @compute name string for compute. Omit entry (or a field) to use the first entry point of that stage.",
		where: n
	});
}
function Rn(e, t, n) {
	return new I({
		code: "VGPU-INDIRECT-INVALID",
		message: `Invalid indirect in '${e}': ${t}`,
		fix: "Pass a storage buffer created with storage(gpu, bytes, { indirect: true }) — bare, or as { buffer, offset? } with a 4-aligned byte offset — sized so the GPU-read arguments fit: 16 bytes for drawIndirect, 20 for drawIndexedIndirect, 12 for dispatchWorkgroupsIndirect. Omit indirect to use CPU-side counts.",
		where: n
	});
}
function zn() {
	return new I({
		code: "VGPU-PASS-PRESERVE-MSAA",
		message: "clear:false cannot preserve MSAA; use a non-MSAA target.",
		fix: "Use non-MSAA for accumulation.",
		where: "Frame.pass"
	});
}
function Bn(e, t = "expected a number in [0, 1].", n = "Use 1 (default), or 0 with depth: { compare: \"greater\" } for reversed-Z.") {
	return new I({
		code: "VGPU-PASS-CLEARDEPTH-INVALID",
		message: `clearDepth received ${String(e)}; ${t}`,
		fix: n,
		where: "Frame.pass"
	});
}
function j(e) {
	return new I({
		code: "VGPU-PASS-VIEWPORT-INVALID",
		message: `Invalid viewport: ${e}`,
		fix: "Use { x?, y?, width, height, minDepth?, maxDepth? } finite numbers within device limits; omit it for the full target.",
		where: "Frame.pass"
	});
}
function Vn(e) {
	return new I({
		code: "VGPU-PASS-SCISSOR-INVALID",
		message: `Invalid scissor: ${e}`,
		fix: "Use [x, y, width, height] non-negative integers with x + width and y + height within the target's current pixel size; omit it for the full target.",
		where: "Frame.pass"
	});
}
function Hn() {
	return new I({
		code: "VGPU-PASS-PRESERVE-CLEARDEPTH",
		message: "clear:false preserves depth; clearDepth cannot apply.",
		fix: "Remove clearDepth, or let the pass clear.",
		where: "Frame.pass"
	});
}
function Un(e) {
	return new I({
		code: "VGPU-PASS-CLEARSTENCIL-INVALID",
		message: `clearStencil ${e}`,
		fix: "Use an integer in [0, 0xFFFFFFFF] on a target whose depth format has a stencil aspect, e.g. depth: \"depth24plus-stencil8\"; the value is masked to the stencil aspect's bit width.",
		where: "Frame.pass"
	});
}
function Wn() {
	return new I({
		code: "VGPU-PASS-PRESERVE-CLEARSTENCIL",
		message: "clear:false preserves stencil; clearStencil cannot apply.",
		fix: "Remove clearStencil, or let the pass clear.",
		where: "Frame.pass"
	});
}
function Gn(e, t, n = "Frame.pass") {
	return new I({
		code: "VGPU-PASS-DEPTH-READONLY",
		message: `depthReadOnly ${e}`,
		fix: t,
		where: n
	});
}
function Kn() {
	return new I({
		code: "VGPU-PASS-DEPTH-READONLY-MSAA",
		message: "depthReadOnly cannot read an MSAA target's depth: multisampled depth is stored with storeOp \"discard\", so a read-only pass tests against discarded contents.",
		fix: "Use a non-MSAA target for read-only depth, or drop depthReadOnly and let the pass own its depth.",
		where: "Frame.pass"
	});
}
function qn(e, t, n = "timer") {
	return new I({
		code: "VGPU-TIMER-INVALID",
		message: `Invalid timer use: ${e}`,
		fix: t,
		where: n
	});
}
function Jn(e, t) {
	return new I({
		code: "VGPU-TIMER-CAPACITY",
		message: `frame exceeds ${e} timed spans; a timer holds one timestamp query set and WebGPU createQuerySet requires count <= ${t} (2 queries per span).`,
		fix: "Time fewer passes per frame, or spread timing across frames.",
		where: "Frame.pass"
	});
}
function Yn(e, t, n = "visibility") {
	return new I({
		code: "VGPU-VIS-INVALID",
		message: `Invalid visibility use: ${e}`,
		fix: t,
		where: n
	});
}
function Xn(e, t) {
	return new I({
		code: "VGPU-VIS-CAPACITY-LIMIT",
		message: `capacity received ${String(e)}; expected an integer in [1, ${t}] — a visibility instance holds one occlusion query set and WebGPU createQuerySet requires count <= ${t}.`,
		fix: `Use visibility(gpu, { capacity }) with an integer capacity of at most ${t} (default 64), or create several visibility instances.`,
		where: "visibility"
	});
}
function Zn(e) {
	return new I({
		code: "VGPU-VIS-CAPACITY",
		message: `frame uses more than the declared ${e} occlusion query slot(s); the query set is bound to this frame's pass descriptors and cannot grow mid-frame.`,
		fix: "Raise visibility(gpu, { capacity }) (max 4096), or dispose() unused query handles so fewer slots are needed per frame.",
		where: "FramePass.occlusion"
	});
}
function Qn(e) {
	return new I({
		code: "VGPU-VIS-LABEL-DUPLICATE",
		message: `query label '${e}' is already live on this visibility instance.`,
		fix: "Reuse the existing handle — vis.query(label) handles are stable, created once outside the loop — or dispose() the old handle first, or pick a distinct label.",
		where: "Visibility.query"
	});
}
function $n(e, t) {
	return new I({
		code: "VGPU-VIS-DISPOSED",
		message: `the ${e} is disposed.`,
		fix: e === "visibility" ? "Create a new instance with visibility(gpu)." : "Create a new handle with vis.query(label).",
		where: t
	});
}
function er() {
	return new I({
		code: "VGPU-VIS-NO-DEPTH",
		message: "visibility is set, but the pass target has no depth attachment; without depth testing an occlusion query passes for anything rasterized, so it always reports \"visible\" and is useless for culling.",
		fix: "Create the target with depth: true (or a depth format), or drop visibility from this pass.",
		where: "Frame.pass"
	});
}
function tr() {
	return new I({
		code: "VGPU-QUERY-NO-VISIBILITY",
		message: "occlusion() needs the pass to be opened with a visibility instance; the render pass has no occlusionQuerySet to write into.",
		fix: "Open the pass with f.pass({ target, visibility: vis }, ...) using the visibility(gpu) instance that created the query handle.",
		where: "FramePass.occlusion"
	});
}
function nr() {
	return new I({
		code: "VGPU-QUERY-NESTED",
		message: "occlusion() cannot nest inside an active occlusion() body; WebGPU allows one active occlusion query per pass at a time.",
		fix: "Encode each occlusion scope sequentially: p.occlusion(a, ...); p.occlusion(b, ...).",
		where: "FramePass.occlusion"
	});
}
function rr(e) {
	return new I({
		code: "VGPU-QUERY-DUPLICATE",
		message: `query '${e}' was already used this frame; a slot holds one result per frame, so reuse would silently overwrite it.`,
		fix: `Use one handle per measured object per frame, e.g. vis.query("${e}-2") for a second scope.`,
		where: "FramePass.occlusion"
	});
}
function ir(e = "Frame.pass") {
	return new I({
		code: "VGPU-TARGET-REQUIRED",
		message: "Target required. Fix: pass surface(gpu, canvas) or target(gpu, { size }) as { target }.",
		where: e
	});
}
function M(e, t, n, r) {
	return new I({
		code: e,
		message: `${e}: ${n}`,
		fix: r,
		where: t
	});
}
function N(e, t) {
	return M("VGPU-MESH-LAYOUT-INVALID", e, t, "Fix attributes/formats/offsets; use non-numeric names and 4-aligned stride <= 2048.");
}
function ar(e, t) {
	return M("VGPU-MESH-LIMIT-EXCEEDED", e, t, "Use <= 8 buffers and <= 16 attributes (or the device limits).");
}
function or(e, t) {
	return M("VGPU-MESH-LOCATION-CONFLICT", e, `Duplicate geometry @location(${t}).`, "Use unique locations, or omit them for name matching.");
}
function sr(e, t) {
	return M("VGPU-MESH-DATA-MISALIGNED", e, t, "Fix: repack data, set matching stride, or give raw buffers an explicit count.");
}
function cr(e, t) {
	return M("VGPU-MESH-RANGE-INVALID", e, t, "Use index ranges for indexed geometries, vertex ranges otherwise, within geometry counts.");
}
function lr(e, t) {
	return M("VGPU-MESH-WRITE-RANGE", e, t, "Write within the buffer byteLength, or create a larger geometry.");
}
function ur(e, t, n = []) {
	return M("VGPU-MESH-ATTRIBUTE-UNMATCHED", e, `Geometry attribute '${t}' has no shader input.`, `Use shader name${n.length ? ` (${n.join(",")})` : ""} or { location:n }.`);
}
function dr(e, t, n) {
	return M("VGPU-MESH-ATTRIBUTE-UNMATCHED", e, `Geometry attribute '${t}' matches locations ${n.join(",")}.`, "Rename inputs or set { location:n }.");
}
function fr(e, t, n = []) {
	return M("VGPU-MESH-INPUT-MISSING", e, `Geometry lacks shader input '${t}'.`, `Add/remove it. Geometry attributes: ${n.join(",") || "none"}.`);
}
function pr(e, t, n, r) {
	return M("VGPU-MESH-FORMAT-MISMATCH", e, `Attribute '${t}' ${n} != shader ${r}.`, "Match the float/sint/uint shader base type; widths may differ.");
}
function mr(e) {
	return new I({
		code: "VGPU-PIPELINE-LAYOUT-GAP",
		message: `Pipeline bind group ${e} is missing.`,
		fix: "Use consecutive @group() indices starting at 0.",
		where: "pipeline layout"
	});
}
function hr(e, t, n) {
	return new I({
		code: "VGPU-COMPILE-FAILED",
		message: "WebGPU pipeline compilation failed.",
		fix: "Check WGSL, vertex layouts, and target signature.",
		where: e,
		cause: t,
		detail: n ? { signature: n } : void 0
	});
}
function gr(e) {
	return new I({
		code: "VGPU-COMPILE-DISPOSED",
		message: "GPU disposed during pipeline compilation.",
		where: e
	});
}
function _r(e, t) {
	return new I({
		code: "VGPU-COMPILE-SIGNATURE-INVALID",
		message: `Invalid TargetSignature: ${t}`,
		fix: "Pass { colors, depth?, sampleCount?:1|4 } or a Target.",
		where: e
	});
}
function vr(e) {
	return new I({
		code: "VGPU-TARGET-DEPTH-STENCIL-ONLY",
		message: `depth received '${e}'; stencil-only depth targets are not supported yet.`,
		fix: "Use a format with a depth aspect such as \"depth24plus\" or \"depth24plus-stencil8\".",
		where: "target"
	});
}
function yr() {
	return new I({
		code: "VGPU-TARGET-SIZE-REQUIRED",
		message: "Target size required. Fix: target(gpu, { size: [w,h] }); update surface-derived targets in onResize.",
		where: "target"
	});
}
function br(e) {
	return new I({
		code: "VGPU-SURFACE-NOT-IN-FRAME",
		message: "Surface targets are only available inside frame(gpu).",
		fix: "surface passes must run inside frame(gpu, ...); precompile against an offscreen target(gpu, ...) instead",
		where: e
	});
}
function xr() {
	return new I({
		code: "VGPU-SURFACE-CONTEXT",
		message: "Canvas WebGPU context failed. Fix: check navigator.gpu and remove any existing 2d/webgl context.",
		where: "surface"
	});
}
function Sr(e) {
	return new I({
		code: "VGPU-SURFACE-DUPLICATE",
		message: `Canvas already has surface${e ? ` '${e}'` : ""}. Fix: reuse or dispose it.`,
		where: "surface"
	});
}
function Cr(e) {
	return new I({
		code: "VGPU-SURFACE-DISPOSED",
		message: `Surface '${e ?? "surface"}' is disposed. Fix: call surface(gpu, canvas).`,
		where: "surface"
	});
}
function wr() {
	return new I({
		code: "VGPU-SURFACE-AUTORESIZE-UNSUPPORTED",
		message: "autoResize needs clientWidth. Fix: call surface.resize([w,h]) for OffscreenCanvas; onResize still fires.",
		where: "surface"
	});
}
function Tr(e) {
	return new I({
		code: "VGPU-SURFACE-RESIZE-REENTRANT",
		message: `Cannot resize this surface${e ? ` '${e}'` : ""} in onResize. Fix: resize derived targets only.`,
		where: "surface.resize"
	});
}
function Er(e) {
	return new I({
		code: "VGPU-CLEAR-COLOR-INVALID",
		message: `Invalid ${e}: expected four finite numbers.`,
		fix: "Assign [r, g, b, a] or a GPUColor object ({ r, g, b, a }).",
		where: e
	});
}
function Dr(e) {
	return new I({
		code: "VGPU-CLOCK-DELTA-INVALID",
		message: `clock.advance() received ${String(e)}; expected a finite, non-negative number of seconds.`,
		fix: "Pass the elapsed seconds, e.g. clock(gpu).advance(1 / 60); use frame(gpu) alone to advance with wall-clock time.",
		where: "clock.advance"
	});
}
function Or() {
	return new I({
		code: "VGPU-FRAME-REENTRANT",
		message: "Nested frame(gpu) is invalid. Fix: queue work for the next frame.",
		where: "frame"
	});
}
function kr(e, t) {
	return new I({
		code: "VGPU-QUERY-READBACK",
		message: `${e} dropped a query readback: ${Lr(t)}`,
		fix: "Usually a lost or destroyed device: recreate the gpu (and the timer/visibility instance) before reading queries again. Results resume on the next successful readback; the frame itself is unaffected.",
		where: "QueryRing.onSubmitted",
		cause: t
	});
}
function Ar(e) {
	return new I({
		code: "VGPU-FRAME-CANCELED",
		message: "the frame was canceled; its command encoder was dropped and nothing more can be encoded or submitted on it.",
		fix: "Open a new frame(gpu) for further work; cancel() is the last operation on a frame.",
		where: e
	});
}
function jr(e) {
	return new I({
		code: "VGPU-FRAME-PASS-ACTIVE",
		message: "the frame cannot be canceled while a pass callback is active.",
		fix: "Return from the frame.pass(...) callback first, then call frame.cancel(); this keeps pass descriptor resources alive until the pass is closed.",
		where: e
	});
}
function Mr(e) {
	return new I({
		code: "VGPU-FRAME-SUBMITTED",
		message: "the frame was already submitted; submitted GPU work cannot be canceled.",
		fix: "Call cancel() only on a frame you decided not to submit; the frame you did submit needs no cleanup.",
		where: e
	});
}
function P(e, t, n) {
	return new I({
		code: "VGPU-R1-BINDING-INCOMPATIBLE-RESOURCE",
		message: `binding \`${e.name}\` @group(${e.group}) @binding(${e.binding}) needs ${t}.`,
		fix: n,
		where: "set"
	});
}
function F(e, t, n) {
	return new I({
		code: "VGPU-RING1-UNSUPPORTED",
		message: t,
		fix: n,
		where: e
	});
}
function Nr(e, t) {
	return new I({
		code: "VGPU-SET-VALUE-INVALID",
		message: `Invalid WGSL value at '${e.path}': ${t}.`,
		fix: "Pass the exact reflected structure, vector, matrix, and array shapes; use integral in-range values for i32/u32.",
		where: "set",
		detail: e
	});
}
function Pr(e) {
	return Rr(e) && e.version !== 1 ? new I({
		code: "VGPU-SHADER-SOURCE-INVALID",
		message: `VGPU-SHADER-SOURCE-INVALID: unsupported ShaderSource v${String(e.version)}; expected v1. Fix: update vgpu or regenerate it.`,
		where: "shader source"
	}) : new I({
		code: "VGPU-SHADER-SOURCE-INVALID",
		message: `VGPU-SHADER-SOURCE-INVALID: expected WGSL or { version, wgsl }, got ${zr(e)}. Fix: configure @vgpu/wgsl loader-vite or loader-webpack.`,
		where: "shader source"
	});
}
function Fr(e) {
	return new I({
		code: "VGPU-R1-STORAGE-ALIASING",
		message: "`src` and writable `dst` alias. Fix: alternate them with pingPongStorage(gpu).",
		where: e
	});
}
function Ir(e) {
	return new I({
		code: "VGPU-R1-SHARED-UNIFORMS-LAYOUT-MISMATCH",
		message: `Uniform '${e.bindingName}' layout ${e.adoptedLayout} from ${e.adoptedSource} != ${e.incomingLayout} from ${e.incomingSource}. Fix: align structs or split uniforms.`,
		where: "uniforms"
	});
}
function Lr(e) {
	return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
}
function Rr(e) {
	return typeof e == "object" && !!e && "version" in e;
}
function zr(e) {
	if (typeof e != "object" || !e) return typeof e;
	try {
		let t = JSON.stringify(e);
		return t.length > 80 ? `${t.slice(0, 77)}...` : t;
	} catch {
		return "object";
	}
}
function Br(e, t) {
	switch (t.kind) {
		case "sampler": return `${e}.set({${t.name}:sampler(gpu)})`;
		case "texture": return `${e}.set({${t.name}:scene.color})`;
		case "buffer": return t.addressSpace === "uniform" ? `${e}.set({${t.name}:{ /* values */ }})` : `${e}.set({${t.name}:buffer})`;
		default: return `${e}.set({${t.name}:resource})`;
	}
}
var I, L = t((() => {
	k(), I = class extends _e {};
}));
//#endregion
//#region node_modules/vgpu/dist/kernel.js
function Vr(e) {
	return { name: e };
}
function Hr(e) {
	let t = Jr.get(e);
	if (!t) throw new I({
		code: "VGPU-GPU-FOREIGN",
		message: "This object was not created by init(); it has no vgpu kernel.",
		fix: "Pass the gpu returned by init() from vgpu, vgpu/node or vgpu/mock.",
		where: "gpu"
	});
	return t;
}
function Ur(e) {
	let t = new Yr(e), n = {
		device: e,
		gpu: e.gpu,
		get disposed() {
			return t.disposed;
		},
		onError: (e) => t.addErrorListener(e),
		settled: () => t.settled(),
		dispose: () => {
			t.dispose();
		}
	};
	return Jr.set(n, t), n;
}
async function Wr(e, t = {}, n) {
	return Ur(await Gr(e, t, n));
}
async function Gr(e, t, n) {
	if (t.adapter || n) return (t.adapter ?? n()).requestDevice(t);
	if (e === "browser") return Kr(t);
	throw F("init", `init(${e}) requires adapterFactory.`);
}
async function Kr(e) {
	let t = await globalThis.navigator.gpu?.requestAdapter({ powerPreference: e.powerPreference });
	if (!t) throw F("init", "navigator.gpu.requestAdapter() returned null.");
	ge(t.features, e.requiredFeatures);
	let n = await t.requestDevice({
		requiredFeatures: e.requiredFeatures,
		requiredLimits: e.requiredLimits
	});
	return new Rt(n, t.info ?? null);
}
var qr, Jr, Yr, Xr = t((() => {
	k(), L(), qr = [
		"scheduler",
		"resource",
		"service"
	], Jr = /* @__PURE__ */ new WeakMap(), Yr = class {
		device;
		#e = /* @__PURE__ */ new Map();
		#t = new Map(qr.map((e) => [e, /* @__PURE__ */ new Set()]));
		#n = /* @__PURE__ */ new Set();
		#r = /* @__PURE__ */ new Set();
		#i = /* @__PURE__ */ new Set();
		#a = !1;
		constructor(e) {
			this.device = e;
		}
		get disposed() {
			return this.#a;
		}
		service(e, t) {
			let n = this.#e.get(e);
			if (n !== void 0) return n;
			let r = t(this);
			return this.#e.set(e, r), r;
		}
		peekService(e) {
			return this.#e.get(e);
		}
		own(e, t) {
			let n = this.#t.get(e);
			return n.add(t), () => {
				n.delete(t);
			};
		}
		addErrorListener(e) {
			return this.#n.add(e), () => {
				this.#n.delete(e);
			};
		}
		reportError(e) {
			if (this.#a) return Promise.resolve();
			let t = Promise.resolve().then(() => {
				let t = [...this.#n];
				if (!t.length) {
					console.error(e);
					return;
				}
				for (let n of t) try {
					n(e);
				} catch (e) {
					console.error(e);
				}
			});
			return this.trackDelivery(t);
		}
		trackDelivery(e) {
			let t = Promise.resolve(e).then(() => void 0, (e) => {
				console.error(e);
			});
			return this.#r.add(t), t.finally(() => this.#r.delete(t)), t;
		}
		registerSettledSource(e) {
			return this.#i.add(e), () => {
				this.#i.delete(e);
			};
		}
		async settled() {
			let e = [...this.#r, ...[...this.#i].flatMap((e) => e())];
			await Promise.allSettled(e);
		}
		dispose() {
			if (!this.#a) {
				this.#a = !0;
				for (let e of qr) {
					let t = this.#t.get(e);
					for (let e of [...t]) e();
					t.clear();
				}
				this.#e.clear(), this.#i.clear(), this.#n.clear(), this.device.dispose();
			}
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/lifecycle.js
function R(e, t) {
	e.assertUsable(t);
}
function Zr(e, t) {
	e.assertUsable(t);
}
var Qr = t((() => {}));
//#endregion
//#region node_modules/vgpu/dist/init-from-device.js
async function $r(e) {
	if (!ei(e)) throw ti("VGPU-INIT-DEVICE-INVALID", "Invalid external GPUDevice shape.");
	let t = new Rt(e, null, "external");
	await Promise.resolve();
	try {
		return R(t, "initFromDevice"), Ur(t);
	} catch (e) {
		throw t.dispose(), e;
	}
}
function ei(e) {
	if (typeof e != "object" && typeof e != "function" || e === null) return !1;
	try {
		let t = e;
		return (typeof t.queue == "object" || typeof t.queue == "function") && t.queue !== null && typeof t.createBuffer == "function" && typeof t.createCommandEncoder == "function" && !!t.lost && typeof t.lost.then == "function";
	} catch {
		return !1;
	}
}
function ti(e, t) {
	return new I({
		code: e,
		message: t,
		where: "initFromDevice"
	});
}
var ni = t((() => {
	k(), Xr(), Qr(), L();
})), ri = t((() => {
	Xr(), ni();
}));
//#endregion
//#region node_modules/vgpu/dist/draw-protocols.js
function ii(e) {
	return typeof (typeof e == "object" && e ? e[ai] : void 0) == "function" ? e : void 0;
}
var ai, oi, si = t((() => {
	ai = Symbol("vgpu.bindingResource"), oi = Symbol("vgpu.geometry.layoutResolver");
}));
//#endregion
//#region node_modules/vgpu/dist/live-kernel.js
function z(e, t) {
	let n = Hr(e);
	if (n.disposed) throw ci(t);
	return n;
}
function ci(e) {
	return new I({
		code: "VGPU-GPU-DISPOSED",
		message: `${e}() ran after gpu.dispose(); the device and everything it owned are gone.`,
		fix: "Create resources before disposing the gpu, or init() a new one.",
		where: e
	});
}
function li(e, t) {
	let n = () => void 0, r = t({
		trackSettled: (t) => {
			e.trackDelivery(t);
		},
		errorSink: (t) => e.reportError(t),
		onDispose: () => {
			n();
		}
	});
	return n = e.own("resource", () => r.dispose()), r;
}
function ui(e, t, n, r) {
	let i = e.own("resource", () => n(t));
	return r?.(i), t;
}
var B = t((() => {
	L(), Xr();
}));
//#endregion
//#region node_modules/vgpu/dist/scene/geometry-descriptor.js
function di(e, t) {
	let n = z(e, "geometry"), r = fi(t) ? t.build(n.device) : t;
	return pi(n, new Oi(n.device, r));
}
function fi(e) {
	return "build" in e && typeof e.build == "function";
}
function pi(e, t) {
	return ui(e, t, (e) => e.destroy(), (e) => {
		t.onDestroy(e);
	});
}
function mi(e) {
	if (e === "unorm10-10-10-2" || e === "unorm8x4-bgra") return 4;
	let t = /^(float|uint|sint|unorm|snorm)(8|16|32)(?:x([234]))?$/.exec(e);
	if (!t) return 0;
	let [, n, r, i] = t;
	return (r === "32" ? /norm/.test(n) : !i || i === "3" || r === "8" && n === "float") ? 0 : Number(r) / 8 * Number(i ?? 1);
}
function hi(e, t, n) {
	if (t.data !== void 0 && t.buffer !== void 0) throw N(n, "Choose data or buffer, not both.");
	let r = t.stepMode ?? "vertex";
	if (r !== "vertex" && r !== "instance") throw N(n, `Invalid stepMode: ${String(r)}.`);
	let i = [], a = [], o = 0;
	for (let [r, s] of Object.entries(t.attributes)) {
		if (/^\d+$/.test(r)) throw N(n, `Attribute '${r}' is numeric; use a non-numeric name.`);
		let t = typeof s == "string" ? { format: s } : s, c = mi(t.format);
		if (!c) throw N(n, `Unknown GPUVertexFormat '${t.format}'.`);
		let l = t.offset ?? o, u = Math.min(4, c);
		if (!Number.isInteger(l) || l < 0 || l % u !== 0) throw N(n, `Attribute '${r}' offset ${String(l)} needs ${u}-byte alignment.`);
		if (t.location !== void 0 && (!Number.isInteger(t.location) || t.location < 0 || t.location >= e.gpu.limits.maxVertexAttributes)) throw N(n, `Location ${String(t.location)} for '${r}' is outside limit ${e.gpu.limits.maxVertexAttributes}.`);
		i.push({
			shaderLocation: t.location ?? i.length,
			offset: l,
			format: t.format
		}), a.push({
			name: r,
			format: t.format,
			location: t.location
		}), o += c;
	}
	let s = t.stride ?? Ci(o);
	if (!Number.isInteger(s) || s <= 0 || s > 2048 || s % 4 != 0) throw N(n, `Stride ${String(s)} must be 4-aligned in [4,2048].`);
	for (let [e, t] of i.entries()) {
		let r = mi(t.format);
		if (t.offset + r > s) throw N(n, `Attribute '${a[e]?.name}' (${t.offset}+${r}) exceeds stride ${s}.`);
	}
	let c = t.data ? Si(t.data) : void 0;
	if (c !== void 0 && c % s !== 0) throw sr(n, `Data byteLength ${c} is not divisible by stride ${s}.`);
	let l = t.data === void 0 ? void 0 : e.createBuffer({
		label: t.label,
		size: Math.max(4, c ?? 0),
		usage: ["vertex", "copy_dst"]
	});
	return l && t.data && l.write(t.data), {
		layout: Object.freeze({
			arrayStride: s,
			...t.stepMode ? { stepMode: r } : {},
			attributes: Object.freeze(i)
		}),
		attributes: Object.freeze(a),
		stride: s,
		stepMode: r,
		byteLength: c,
		gpu: l?.gpu ?? xi(t.buffer, n),
		owned: l
	};
}
function gi(e, t, n) {
	if (t.indices !== void 0 && t.indexBuffer !== void 0) throw N(n, "Choose indices or indexBuffer, not both.");
	if (t.indices === void 0) {
		let e = [
			t.indexBuffer,
			t.indexFormat,
			t.indexCount
		].filter((e) => e !== void 0).length;
		if (e !== 0 && e !== 3) throw N(n, "Provide indexBuffer, indexFormat, and indexCount together.");
		if (t.indexFormat !== void 0 && t.indexFormat !== "uint16" && t.indexFormat !== "uint32") throw N(n, `Unknown index format '${String(t.indexFormat)}'.`);
		return t.indexCount !== void 0 && Ti(n, "indexCount", t.indexCount, 2 ** 53 - 1), {
			gpu: t.indexBuffer,
			format: t.indexFormat,
			count: t.indexCount
		};
	}
	if (t.indexFormat !== void 0) throw N(n, "indices infer format; omit indexFormat.");
	let r = Array.isArray(t.indices) ? new Uint32Array(t.indices) : t.indices, i = r instanceof Uint16Array ? "uint16" : "uint32", a = r.byteLength;
	if (a % (i === "uint16" ? 2 : 4) != 0) throw sr(n, `Index byteLength ${a} is invalid for ${i}.`);
	let o = e.createBuffer({
		label: t.label ? `${t.label}.indices` : void 0,
		size: Math.max(4, a),
		usage: ["index", "copy_dst"]
	});
	return o.write(r), {
		gpu: o.gpu,
		owned: o,
		format: i,
		count: r.length,
		byteLength: a
	};
}
function _i(e, t) {
	let n;
	for (let r of e) r.stepMode === t && r.byteLength !== void 0 && (n = Math.min(n ?? Infinity, Math.floor(r.byteLength / r.stride)));
	return n;
}
function vi(e, t, n, r) {
	if (n === void 0 && e.some((e) => e.stepMode === t && e.byteLength === void 0)) throw N(r, `Raw ${t} buffer needs ${t}Count.`);
}
function yi(e, t, n, r) {
	n !== void 0 && Ti(e, t, n, r ?? 2 ** 53 - 1);
}
function bi(e) {
	for (let t of Object.keys(e)) t !== "destroyed" && Object.defineProperty(e, t, {
		writable: !1,
		configurable: !1
	});
}
function xi(e, t) {
	if (!e) throw N(t, "Provide geometry buffer data or buffer.");
	return e;
}
function Si(e) {
	return e.byteLength;
}
function Ci(e) {
	return e + 3 & -4;
}
function wi(e, t, n, r) {
	if (!Number.isInteger(r) || r < 0 || r % 4 != 0 || n % 4 != 0 || r + n > t) throw lr(e, `Write size ${n}/offset ${String(r)} must be 4-aligned within ${t} bytes.`);
}
function Ti(e, t, n, r) {
	if (!Number.isInteger(n) || n < 0 || n > r) throw cr(e, `${t}=${String(n)} must be an integer in [0,${r}].`);
}
function Ei(e) {
	return e.startsWith("sint") ? "i32" : e.startsWith("uint") ? "u32" : "f32";
}
function Di(e) {
	return e.kind === "scalar" ? e.name : e.kind === "vector" || e.kind === "matrix" || e.kind === "atomic" ? Di(e.element) : e.kind;
}
var Oi, ki, Ai, ji, Mi = t((() => {
	si(), B(), L(), Oi = class {
		vertexCount;
		indexCount;
		instanceCount;
		vertexBuffers;
		indexBuffer;
		indexFormat;
		vertexBufferLayouts;
		topology;
		stripIndexFormat;
		buffers;
		#e;
		#t;
		#n;
		#r = /* @__PURE__ */ new Map();
		#i = /* @__PURE__ */ new Set();
		#a = !1;
		constructor(e, t) {
			let n = "geometry";
			if (t.buffers.length > 8) throw ar(n, `${t.buffers.length} vertex buffers exceed limit 8.`);
			let r = 0, i = /* @__PURE__ */ new Set(), a = t.buffers.map((t, a) => {
				let o = hi(e, t, `${n}.buffers[${a}]`);
				r += o.attributes.length;
				for (let e of o.attributes) if (e.location !== void 0) {
					if (i.has(e.location)) throw or(`${n}.buffers[${a}]`, e.location);
					i.add(e.location);
				}
				return o;
			}), o = e.gpu.limits.maxVertexAttributes;
			if (r > o) throw ar(n, `${r} attributes exceed device limit ${o}.`);
			let s = t.topology ?? "triangle-list";
			if (!ji.has(s)) throw N(n, `Invalid topology: ${String(s)}.`);
			let c = gi(e, t, n), l = _i(a, "vertex"), u = _i(a, "instance");
			vi(a, "vertex", t.vertexCount ?? l, n), vi(a, "instance", t.instanceCount ?? u, n), yi(n, "vertexCount", t.vertexCount, l), yi(n, "instanceCount", t.instanceCount, u), yi(n, "indexCount", t.indexCount, c.count), this.topology = s, this.stripIndexFormat = s.endsWith("strip") ? c.format : void 0, this.#n = a, this.vertexBufferLayouts = Object.freeze(a.map((e) => e.layout)), this.vertexBuffers = Object.freeze(a.map((e) => e.gpu)), this.buffers = Object.freeze(a.map((e, t) => new ki(`${n}.buffers[${t}]`, e))), this.vertexCount = t.vertexCount ?? l, this.instanceCount = t.instanceCount ?? u, this.indexBuffer = c.gpu, this.indexFormat = c.format, this.indexCount = t.indexCount ?? c.count, this.#e = c.owned, this.#t = c.byteLength, bi(this);
		}
		[oi](e, t) {
			if (this.#a) throw N(t, "Geometry is destroyed; create a live geometry.");
			let n = e.map((e) => `${e.name}:${e.location}:${Di(e.type)}`).join("|"), r = this.#r.get(n);
			if (r) return r;
			let i = /* @__PURE__ */ new Set(), a = this.#n.flatMap((e) => e.attributes.map((e) => e.name)), o = this.#n.map((n) => {
				let r = [...n.layout.attributes], a = n.attributes.map((n, a) => {
					let o = n.location === void 0 ? e.filter((e) => e.name === n.name) : [];
					if (n.location === void 0 && o.length === 0) throw ur(t, n.name, e.map((e) => e.name));
					if (o.length > 1) throw dr(t, n.name, o.map((e) => e.location));
					let s = n.location ?? o[0].location;
					if (i.has(s)) throw or(t, s);
					i.add(s);
					let c = e.find((e) => e.location === s);
					if (c && Ei(n.format) !== Di(c.type)) throw pr(t, n.name, n.format, Di(c.type));
					return Object.freeze({
						...r[a],
						shaderLocation: s
					});
				});
				return Object.freeze({
					arrayStride: n.layout.arrayStride,
					...n.layout.stepMode ? { stepMode: n.layout.stepMode } : {},
					attributes: Object.freeze(a)
				});
			});
			for (let n of e) if (!i.has(n.location)) throw fr(t, n.name, a);
			let s = Object.freeze(o);
			return this.#r.set(n, s), s;
		}
		slice(e = {}) {
			return new Ai(this, e);
		}
		write(e, t = 0) {
			let n = this.buffers[0];
			if (!n) throw lr("geometry.write", "No vertex buffer 0; add one before writing.");
			n.write(e, t);
		}
		writeIndices(e, t = 0) {
			if (this.#a) throw lr("geometry.writeIndices", "Geometry is destroyed; create a new geometry before writing.");
			if (!this.#e || this.#t === void 0) throw lr("geometry.writeIndices", "No owned index buffer; write caller-owned buffers directly.");
			wi("geometry.writeIndices", this.#t, e.byteLength, t), this.#e.write(e, t);
		}
		destroy() {
			if (!this.#a) {
				this.#a = !0;
				for (let e of this.buffers) e.destroyOwned();
				this.#e?.destroy();
				for (let e of [...this.#i]) e();
				this.#i.clear();
			}
		}
		onDestroy(e) {
			return this.#a ? (e(), () => void 0) : (this.#i.add(e), () => {
				this.#i.delete(e);
			});
		}
	}, ki = class {
		where;
		inner;
		gpu;
		stride;
		stepMode;
		#e = { destroyed: !1 };
		constructor(e, t) {
			this.where = e, this.inner = t, this.gpu = t.gpu, this.stride = t.stride, this.stepMode = t.stepMode, Object.freeze(this);
		}
		write(e, t = 0) {
			if (this.#e.destroyed) throw lr(this.where, "Geometry is destroyed; create a new geometry before writing.");
			if (!this.inner.owned || this.inner.byteLength === void 0) throw lr(this.where, "Caller-owned buffer; write it directly.");
			wi(this.where, this.inner.byteLength, Si(e), t), this.inner.owned.write(e, t);
		}
		destroyOwned() {
			this.#e.destroyed = !0, this.inner.owned?.destroy();
		}
	}, Ai = class {
		geometry;
		vertexCount;
		indexCount;
		instanceCount;
		vertexBuffers;
		indexBuffer;
		indexFormat;
		vertexBufferLayouts;
		topology;
		stripIndexFormat;
		firstIndex;
		baseVertex;
		firstVertex;
		[oi](e, t) {
			return this.geometry[oi](e, t);
		}
		constructor(e, t) {
			if (this.geometry = e, this.vertexBuffers = e.vertexBuffers, this.indexBuffer = e.indexBuffer, this.indexFormat = e.indexFormat, this.vertexBufferLayouts = e.vertexBufferLayouts, this.topology = e.topology, this.stripIndexFormat = e.stripIndexFormat, e.indexBuffer) {
				if (t.firstVertex !== void 0 || t.vertexCount !== void 0) throw cr("geometry.slice", "Indexed slice needs firstIndex/indexCount/baseVertex; omit vertex range fields.");
				let n = t.firstIndex ?? 0, r = e.indexCount ?? 0, i = t.indexCount ?? r - n;
				Ti("geometry.slice", "firstIndex", n, r), Ti("geometry.slice", "indexCount", i, r - n), Ti("geometry.slice", "baseVertex", t.baseVertex ?? 0, 2 ** 53 - 1), this.firstIndex = n, this.indexCount = i, this.baseVertex = t.baseVertex ?? 0, this.vertexCount = e.vertexCount;
			} else {
				if (t.firstIndex !== void 0 || t.indexCount !== void 0 || t.baseVertex !== void 0) throw cr("geometry.slice", "Non-indexed slice needs firstVertex/vertexCount; omit index range fields.");
				let n = t.firstVertex ?? 0, r = e.vertexCount ?? 0, i = t.vertexCount ?? r - n;
				Ti("geometry.slice", "firstVertex", n, r), Ti("geometry.slice", "vertexCount", i, r - n), this.firstVertex = n, this.vertexCount = i, this.indexCount = e.indexCount;
			}
			Ti("geometry.slice", "instanceCount", t.instanceCount ?? e.instanceCount ?? 0, 2 ** 53 - 1), this.instanceCount = t.instanceCount ?? e.instanceCount, Object.freeze(this);
		}
	}, ji = /* @__PURE__ */ new Set([
		"point-list",
		"line-list",
		"line-strip",
		"triangle-list",
		"triangle-strip"
	]);
})), Ni, Pi, Fi = t((() => {
	k(), Ni = (globalThis.GPUShaderStage?.VERTEX ?? 1) | (globalThis.GPUShaderStage?.FRAGMENT ?? 2), Pi = class {
		device;
		size;
		buffer;
		bindGroupLayout;
		bindGroup;
		#e = !1;
		constructor(e, t) {
			this.device = e, this.size = t.size, this.buffer = e.createBuffer({
				size: t.size,
				usage: ["uniform", "copy_dst"],
				label: t.label
			}), this.bindGroupLayout = t.bindGroupLayout ?? Yt(e, {
				label: t.label ? `${t.label}.bgl` : void 0,
				entries: [hn.uniform(0, t.visibility ?? Ni, { minBindingSize: t.size })]
			}), this.bindGroup = Xt(e, {
				label: t.label ? `${t.label}.bg` : void 0,
				layout: this.bindGroupLayout,
				entries: [hn.resource(0, this.buffer)]
			});
		}
		get gpu() {
			return this.buffer.gpu;
		}
		write(e, t = 0) {
			this.buffer.write(e, t);
		}
		destroy() {
			this.#e || (this.#e = !0, this.buffer.destroy());
		}
		dispose() {
			this.destroy();
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/core/render-bundle.js
function Ii(e, t) {
	let n = e.gpu.createRenderBundleEncoder({
		label: t.label,
		colorFormats: t.colorFormats,
		depthStencilFormat: t.depthStencilFormat,
		sampleCount: t.sampleCount,
		depthReadOnly: t.depthReadOnly,
		stencilReadOnly: t.stencilReadOnly
	});
	return t.record(new Ri(n)), n.finish({ label: t.label });
}
function Li(e) {
	return e instanceof D ? e.gpu : e;
}
var Ri, zi = t((() => {
	k(), Ri = class {
		gpu;
		constructor(e) {
			this.gpu = e;
		}
		setPipeline(e) {
			this.gpu.setPipeline(e);
		}
		setBindGroup(e, t, n) {
			this.gpu.setBindGroup(e, t, n);
		}
		setVertexBuffer(e, t, n = 0, r) {
			this.gpu.setVertexBuffer(e, Li(t), n, r);
		}
		draw(e, t = 1, n = 0, r = 0) {
			if (typeof e == "number") {
				this.gpu.draw(e, t, n, r);
				return;
			}
			this.gpu.draw(e.vertexCount, e.instanceCount ?? 1, e.firstVertex ?? 0, e.firstInstance ?? 0);
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/errors.js
function Bi(e, t, n = {}) {
	let r = new Vi(e, t, n.line ?? 1, n.column ?? 1, n.severity ?? "error");
	return n.fix !== void 0 && (r.fix = n.fix), n.where !== void 0 && (r.where = n.where), n.cause !== void 0 && (r.cause = n.cause), n.metadata !== void 0 && (r.metadata = n.metadata), r;
}
function V(e, t, n = 1, r = 1) {
	return new Vi(e, t, n, r);
}
var Vi, Hi = t((() => {
	Vi = class extends Error {
		code;
		line;
		column;
		severity;
		metadata;
		relatedDiagnostics;
		fix;
		where;
		cause;
		constructor(e, t, n = 1, r = 1, i = "error") {
			super(t), this.name = "VGPUError", this.code = e, this.line = n, this.column = r, this.severity = i;
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/parser.js
function Ui(e) {
	let t = [], n = [], r = [], i = 0, a = !1, o = 0;
	for (; i < e.length;) {
		let s = e[i];
		if (s.text === "{") {
			o++, i++;
			continue;
		}
		if (s.text === "}") {
			o = Math.max(0, o - 1), i++;
			continue;
		}
		if (Xi(s)) {
			i++;
			continue;
		}
		if (o > 0) {
			i++;
			continue;
		}
		if (s.text === "import") {
			if (a) throw V("VGPU-WGSL-IMP-ORDER", "Imports must precede declarations", s.line, s.column);
			let [n, r] = Wi(e, i);
			t.push(n), i = r;
			continue;
		}
		if (s.text === "export" && e[i + 1]?.text === "{") throw V("VGPU-WGSL-EXP-REEXPORT-CYCLE", "Re-export cycles are not supported", s.line, s.column);
		if (s.text === "@" && e[i + 2]?.text === "export" && e[i + 3]?.text === "@") throw V("VGPU-WGSL-EXP-NOTDECL", "Repeated export attributes", s.line, s.column);
		let c = s.text === "export" || s.text === "@" && e[i + 2]?.text === "export", l = c ? Gi(e, s.text === "export" ? i + 1 : i + 3) : i, u = e[l];
		if (u && Zi.has(u.text)) {
			let t = qi(e, l);
			n.push({
				name: t,
				localName: t,
				kind: u.text
			}), c && r.push({
				name: t,
				localName: t,
				kind: u.text
			}), a = !0, i = l + 1;
			continue;
		}
		i++;
	}
	return {
		imports: t,
		exports: r,
		locals: n
	};
}
function Wi(e, t) {
	let n = t + 1, r = [];
	if (e[n]?.text === "{") {
		for (n++; e[n] && e[n].text !== "}";) {
			if (Xi(e[n])) {
				n++;
				continue;
			}
			let t = Yi(e[n]), i = t;
			n++, e[n]?.text === "as" && (i = Yi(e[n + 1]), n += 2), r.push({
				imported: t,
				local: i
			}), e[n]?.text === "," && n++;
		}
		n++, Ji(e[n], "from"), n++;
	} else if (e[n]?.text === "*") Ji(e[n + 1], "as"), r.push({
		imported: "*",
		local: Yi(e[n + 2]),
		namespace: !0
	}), n += 3, Ji(e[n], "from"), n++;
	else if (e[n]?.kind === "string") throw V("VGPU-WGSL-IMP-SIDEEFFECT", "Side-effect imports are not supported", e[n].line, e[n].column);
	else throw V("VGPU-WGSL-IMP-DEFAULT", "Default imports are not supported", e[n]?.line, e[n]?.column);
	let i = e[n];
	if (i?.kind !== "string") throw V("VGPU-WGSL-RES-NOTFOUND", "Import path must be a string", i?.line, i?.column);
	let a = i.text.slice(1, -1);
	return n++, e[n]?.text === ";" && n++, [{
		from: a,
		bindings: r,
		start: e[t].start,
		end: e[n - 1].end
	}, n];
}
function Gi(e, t) {
	for (t = Ki(e, t); e[t]?.text === "@";) if (t = Ki(e, Ki(e, t + 1) + 1), e[t]?.text === "(") {
		let n = 0;
		do
			e[t]?.text === "(" ? n++ : e[t]?.text === ")" && n--, t++;
		while (e[t] && n > 0);
		t = Ki(e, t);
	}
	return t;
}
function Ki(e, t) {
	for (; e[t] && Xi(e[t]);) t++;
	return t;
}
function qi(e, t) {
	let n = t + 1;
	if (e[t]?.text === "var" && e[n]?.text === "<") for (; e[n] && e[n].text !== ">";) n++;
	for (; n < e.length; n++) if (e[n].kind === "ident") return e[n].text;
	throw V("VGPU-WGSL-EXP-NOTDECL", "Exported declaration has no name", e[t]?.line, e[t]?.column);
}
function Ji(e, t) {
	if (e?.text !== t) throw V("VGPU-WGSL-IMP-DEFAULT", `Expected ${t}`, e?.line, e?.column);
}
function Yi(e) {
	if (e?.kind !== "ident") throw V("VGPU-WGSL-IMP-DEFAULT", "Expected identifier", e?.line, e?.column);
	return e.text;
}
function Xi(e) {
	return e.kind === "lineComment" || e.kind === "blockComment";
}
var Zi, Qi = t((() => {
	Hi(), Zi = /* @__PURE__ */ new Set([
		"fn",
		"struct",
		"const",
		"alias",
		"var",
		"override"
	]);
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-bind-layout.js
function $i(e, t) {
	return t === "uniform" || t === "storage" ? "buffer" : e.kind === "sampler" ? "sampler" : e.kind === "texture" ? e.textureKind === "texture_external" ? "externalTexture" : "texture" : "unknown";
}
function ea(e, t, n, r, i) {
	if (e === "buffer") return ta(t, n, i);
	if (r.kind === "sampler") return na(r);
	if (r.kind === "texture") return r.textureKind === "texture_external" ? {
		kind: "externalTexture",
		externalTexture: {}
	} : r.textureKind.startsWith("texture_storage_") ? ra(r) : ia(r);
}
function ta(e, t, n) {
	return {
		kind: "buffer",
		buffer: {
			type: e === "uniform" ? "uniform" : t === "read" ? "read-only-storage" : "storage",
			hasDynamicOffset: !1,
			minBindingSize: n?.size
		}
	};
}
function na(e) {
	return {
		kind: "sampler",
		sampler: { type: e.comparison ? "comparison" : "filtering" }
	};
}
function ra(e) {
	return {
		kind: "storageTexture",
		storageTexture: {
			access: sa(e.access),
			format: e.texelFormat ?? "rgba8unorm",
			viewDimension: oa(e.dimension)
		}
	};
}
function ia(e) {
	return {
		kind: "texture",
		texture: {
			sampleType: aa(e),
			viewDimension: oa(e.dimension),
			multisampled: e.dimension === "multisampled_2d" || e.dimension === "depth_multisampled_2d"
		}
	};
}
function aa(e) {
	if (e.textureKind.startsWith("texture_depth_")) return "depth";
	let t = e.sampleType;
	return t?.kind === "scalar" && t.name === "i32" ? "sint" : t?.kind === "scalar" && t.name === "u32" ? "uint" : "unfilterable-float";
}
function oa(e) {
	switch (e) {
		case "1d": return "1d";
		case "2d_array":
		case "depth_2d_array": return "2d-array";
		case "cube":
		case "depth_cube": return "cube";
		case "cube_array":
		case "depth_cube_array": return "cube-array";
		case "3d": return "3d";
		default: return "2d";
	}
}
function sa(e) {
	return e === "read" ? "read-only" : e === "read_write" ? "read-write" : "write-only";
}
var ca = t((() => {})), la = t((() => {
	qe();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/scanner.js
function ua(e, t) {
	let n = [], r = 0, i = 1, a = 1, o = (t, r, i, a, o) => n.push({
		kind: t,
		text: e.slice(r, i),
		start: r,
		end: i,
		line: a,
		column: o
	}), s = () => {
		e[r] === "\n" ? (i++, a = 1) : a++, r++;
	};
	for (; r < e.length;) {
		let n = e[r];
		if (/\s/.test(n)) {
			s();
			continue;
		}
		let c = r, l = i, u = a;
		if (n === "/" && e[r + 1] === "/") {
			for (; r < e.length && e[r] !== "\n";) s();
			o("lineComment", c, r, l, u);
			continue;
		}
		if (n === "/" && e[r + 1] === "*") {
			let t = 0;
			for (; r < e.length;) {
				if (e[r] === "/" && e[r + 1] === "*") {
					t++, s(), s();
					continue;
				}
				if (e[r] === "*" && e[r + 1] === "/") {
					if (t--, s(), s(), t === 0) {
						o("blockComment", c, r, l, u);
						break;
					}
					continue;
				}
				s();
			}
			if (t !== 0) throw V("VGPU-WGSL-LEX-UNTERM-COMMENT", "Unterminated block comment", l, u);
			continue;
		}
		if (n === "\"" || n === "'") {
			let t = n;
			for (s(); r < e.length && e[r] !== t;) {
				if (e[r] === "\n") throw V("VGPU-WGSL-LEX-UNTERM-STRING", "Unterminated string", l, u);
				e[r] === "\\" && s(), s();
			}
			if (r >= e.length) throw V("VGPU-WGSL-LEX-UNTERM-STRING", "Unterminated string", l, u);
			s(), o("string", c, r, l, u);
			continue;
		}
		if (/[A-Za-z_]/.test(n)) {
			for (; r < e.length && /[A-Za-z0-9_]/.test(e[r]);) s();
			let t = e.slice(c, r);
			o(We.has(t) ? "keyword" : "ident", c, r, l, u);
			continue;
		}
		if (/[0-9]/.test(n) || n === "." && /[0-9]/.test(e[r + 1] ?? "")) {
			for (n === "." && s(); r < e.length;) {
				let t = e[r];
				if (/[A-Za-z0-9_.]/.test(t)) {
					s();
					continue;
				}
				if ((t === "+" || t === "-") && pa(e[r - 1]) && /[0-9]/.test(e[r + 1] ?? "")) {
					s();
					continue;
				}
				break;
			}
			o("number", c, r, l, u);
			continue;
		}
		if (n.charCodeAt(0) > 127) throw da(e, r, i, a, t);
		s(), o("punct", c, r, l, u);
	}
	return n;
}
function da(e, t, n, r, i) {
	let a = t;
	for (; a > 0 && fa(e[a - 1]);) a--;
	let o = t + 1;
	for (; o < e.length && fa(e[o]);) o++;
	let s = e.slice(a, o), c = r - (t - a), l = i === void 0 ? "" : ` in ${i}`, u = Bi(ma, `Non-ASCII identifier '${s}'${l} at line ${n} column ${c}; vgpu's WGSL pipeline supports ASCII identifiers only`, {
		fix: `Rename '${s}' using ASCII letters, digits and '_'. Unicode (XID) identifiers are tracked in ${ha}`,
		line: n,
		column: c
	});
	return u.range = {
		file: i,
		start: {
			line: n,
			column: c
		}
	}, u;
}
function fa(e) {
	return e.charCodeAt(0) > 127 || /[A-Za-z0-9_]/.test(e);
}
function pa(e) {
	return e === "e" || e === "E" || e === "p" || e === "P";
}
var ma, ha, ga = t((() => {
	Hi(), la(), ma = "VGPU-WGSL-IDENT-NONASCII", ha = "https://github.com/vercel-labs/vgpu/issues/294";
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/xxh64.js
function _a(e, t = 0n) {
	let n = new TextEncoder().encode(e), r = 0, i;
	if (n.length >= 32) {
		let e = t + Ca + wa, a = t + wa, o = t, s = t - Ca, c = n.length - 32;
		do
			e = va(e, xa(n, r)), r += 8, a = va(a, xa(n, r)), r += 8, o = va(o, xa(n, r)), r += 8, s = va(s, xa(n, r)), r += 8;
		while (r <= c);
		i = ba(e, 1n) + ba(a, 7n) + ba(o, 12n) + ba(s, 18n), i = ya(i, e), i = ya(i, a), i = ya(i, o), i = ya(i, s);
	} else i = t + Da;
	for (i = i + BigInt(n.length) & H; r + 8 <= n.length;) i ^= va(0n, xa(n, r)), i = ba(i, 27n) * Ca + Ea & H, r += 8;
	for (r + 4 <= n.length && (i ^= Sa(n, r) * Ca & H, i = ba(i, 23n) * wa + Ta & H, r += 4); r < n.length;) i ^= BigInt(n[r]) * Da & H, i = ba(i, 11n) * Ca & H, r++;
	return i ^= i >> 33n, i = i * wa & H, i ^= i >> 29n, i = i * Ta & H, i ^= i >> 32n, i.toString(16).padStart(16, "0");
}
function va(e, t) {
	return ba(e + t * wa & H, 31n) * Ca & H;
}
function ya(e, t) {
	return e ^= va(0n, t), e * Ca + Ea & H;
}
function ba(e, t) {
	return (e << t | e >> 64n - t) & H;
}
function xa(e, t) {
	let n = 0n;
	for (let r = 7; r >= 0; r--) n = (n << 8n) + BigInt(e[t + r]);
	return n;
}
function Sa(e, t) {
	return BigInt(e[t]) | BigInt(e[t + 1]) << 8n | BigInt(e[t + 2]) << 16n | BigInt(e[t + 3]) << 24n;
}
var H, Ca, wa, Ta, Ea, Da, Oa = t((() => {
	H = (1n << 64n) - 1n, Ca = 11400714785074694791n, wa = 14029467366897019727n, Ta = 1609587929392839161n, Ea = 9650029242287828579n, Da = 2870177450012600261n;
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/mangler.js
function ka(e) {
	return _a(e);
}
function Aa(e) {
	return ka(e).slice(0, 8);
}
function ja(e, t) {
	return `_vgsl_${Aa(e)}__${t}`;
}
var Ma = t((() => {
	Oa();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-utils.js
function U(e, t) {
	let n = e.find((e) => e.name === t);
	if (!n) return;
	let r = n.args.map((e) => e.text).join(""), i = Number(r.replace(/[ui]$/, ""));
	return Number.isFinite(i) ? i : void 0;
}
function Na(e) {
	let t = [[]], n = 0, r = 0;
	for (let i of e) {
		if (i.text === "<" ? n++ : i.text === ">" ? n = Math.max(0, n - 1) : i.text === "(" ? r++ : i.text === ")" && (r = Math.max(0, r - 1)), i.text === "," && n === 0 && r === 0) {
			t.push([]);
			continue;
		}
		t[t.length - 1].push(i);
	}
	return t.map(Pa).filter((e) => e.length > 0);
}
function Pa(e) {
	let t = 0, n = e.length;
	for (; t < n && e[t].text === ",";) t++;
	for (; n > t && e[n - 1].text === ",";) n--;
	return e.slice(t, n);
}
function Fa(e) {
	if (e !== void 0 && Ia(e)) return Number(e.replace(/[ui]$/, ""));
}
function Ia(e) {
	return /^(0|[1-9][0-9]*)([ui])?$/.test(e);
}
function La(e) {
	if (e === "read" || e === "write" || e === "read_write") return e;
}
function Ra(e) {
	return [
		"f32",
		"f16",
		"i32",
		"u32",
		"bool"
	].find((t) => t === e);
}
function za(e) {
	return {
		kind: "scalar",
		name: e === "f" ? "f32" : e === "h" ? "f16" : e === "i" ? "i32" : "u32"
	};
}
function Ba(e) {
	return e === "f16" ? 2 : 4;
}
function Va(e, t) {
	return Math.ceil(t / e) * e;
}
var Ha = t((() => {}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-type-parser.js
function W(e) {
	let t = Pa(e);
	if (t.length === 0) throw V("VGPU-WGSL-REFLECT-TYPE", "Expected WGSL type");
	let n = t.map((e) => e.text).join(""), r = Ua(n);
	if (r) return r;
	if (t[1]?.text === "<") {
		let e = t[0].text, n = Wa(e, Na(t.slice(2, -1)));
		if (n) return n;
	}
	return Ga(n) || Ka(n);
}
function Ua(e) {
	let t = Ra(e);
	if (t) return {
		kind: "scalar",
		name: t
	};
	let n = e.match(/^vec([234])([fiuh])$/);
	if (n) return {
		kind: "vector",
		width: Number(n[1]),
		element: za(n[2])
	};
	let r = e.match(/^mat([234])x([234])([fh])$/);
	if (r) {
		let e = r[3] === "h" ? {
			kind: "scalar",
			name: "f16"
		} : {
			kind: "scalar",
			name: "f32"
		};
		return {
			kind: "matrix",
			columns: Number(r[1]),
			rows: Number(r[2]),
			element: e
		};
	}
}
function Wa(e, t) {
	if (e === "array") {
		let e = t[1]?.map((e) => e.text).join(""), n = e === void 0 ? void 0 : Fa(e);
		return {
			kind: "array",
			element: W(t[0] ?? []),
			count: n,
			countExpression: e
		};
	}
	if (e === "atomic") return {
		kind: "atomic",
		element: W(t[0] ?? [])
	};
	if (e === "vec2" || e === "vec3" || e === "vec4") return {
		kind: "vector",
		width: Number(e.slice(3)),
		element: W(t[0] ?? [])
	};
	if (/^mat[234]x[234]$/.test(e)) return {
		kind: "matrix",
		columns: Number(e[3]),
		rows: Number(e[5]),
		element: W(t[0] ?? [])
	};
	if (e === "ptr") return {
		kind: "ptr",
		addressSpace: t[0]?.map((e) => e.text).join("") ?? "",
		element: W(t[1] ?? []),
		access: t[2]?.map((e) => e.text).join("")
	};
	if (e === "sampler") return {
		kind: "sampler",
		comparison: !1
	};
	if (e.startsWith("texture_storage_")) return {
		kind: "texture",
		textureKind: e,
		dimension: e.slice(16),
		texelFormat: t[0]?.map((e) => e.text).join(""),
		access: La(t[1]?.map((e) => e.text).join(""))
	};
	if (e.startsWith("texture_")) return {
		kind: "texture",
		textureKind: e,
		dimension: e.slice(8),
		sampleType: t[0] ? W(t[0]) : void 0
	};
}
function Ga(e) {
	if (e === "sampler" || e === "sampler_comparison") return {
		kind: "sampler",
		comparison: e === "sampler_comparison"
	};
	if (e === "texture_external") return {
		kind: "texture",
		textureKind: e
	};
	if (e.startsWith("texture_depth_") || e.startsWith("texture_")) return {
		kind: "texture",
		textureKind: e,
		dimension: e.slice(8)
	};
}
function Ka(e) {
	return {
		kind: "identifier",
		name: e
	};
}
var qa = t((() => {
	Hi(), Ha();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-token-utils.js
function Ja(e) {
	if (e?.kind !== "ident" && e?.kind !== "keyword") throw V("VGPU-WGSL-REFLECT-PARSE", "Expected identifier", e?.line, e?.column);
	return e.text;
}
function Ya(e, t, n) {
	for (let r = t; r < e.length; r++) if (e[r].text === n) return r;
	throw V("VGPU-WGSL-REFLECT-PARSE", `Expected ${n}`, e[t]?.line, e[t]?.column);
}
function Xa(e, t, n, r) {
	for (let i = t; i < n; i++) if (e[i].text === r) return i;
}
function Za(e, t, n) {
	let r = 0;
	for (let i = t; i < e.length; i++) if ((e[i].text === "{" || e[i].text === "(") && r++, (e[i].text === "}" || e[i].text === ")") && (r = Math.max(0, r - 1)), r === 0 && e[i].text === n) return i;
	return e.length;
}
function Qa(e, t) {
	let n = e[t].text, r = n === "(" ? ")" : n === "{" ? "}" : ">", i = 0;
	for (let a = t; a < e.length; a++) if (e[a].text === n && i++, e[a].text === r && (i--, i === 0)) return a;
	throw V("VGPU-WGSL-REFLECT-PARSE", `Unclosed ${n}`, e[t]?.line, e[t]?.column);
}
function $a(e, t) {
	let n = [], r = t;
	for (; e[r]?.text === "@";) {
		let t = e[r], i = Ja(e[r + 1]);
		r += 2;
		let a = [];
		if (e[r]?.text === "(") {
			let t = Qa(e, r);
			a = e.slice(r + 1, t), r = t + 1;
		}
		n.push({
			name: i,
			args: a,
			token: t
		});
	}
	return [n, r];
}
function eo(e) {
	switch (e.kind) {
		case "scalar": return e.name;
		case "identifier": return e.name;
		case "vector": return `vec${e.width}<${eo(e.element)}>`;
		case "matrix": return `mat${e.columns}x${e.rows}<${eo(e.element)}>`;
		case "array": return `array<${eo(e.element)}${e.count === void 0 ? "" : `,${e.count}`}>`;
		default: return e.kind;
	}
}
var to = t((() => {
	Hi();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-entry-points.js
function no(e) {
	let t = e.find((e) => e.name === "workgroup_size");
	if (!t) return;
	let n = Na(t.args).map((e) => Number(e.map((e) => e.text).join("")));
	return [
		n[0] ?? 1,
		n[1] ?? 1,
		n[2] ?? 1
	];
}
var ro = t((() => {
	Ha();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-vars.js
function io(e, t) {
	if (e[t]?.text !== "<") return { after: t };
	let n = Ya(e, t, ">"), r = Na(e.slice(t + 1, n)).map((e) => e.map((e) => e.text).join(""));
	return {
		addressSpace: r[0],
		access: La(r[1]),
		after: n + 1
	};
}
var ao = t((() => {
	Ha(), to();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-declarations.js
function oo(e) {
	let t = [], n = [], r = [], i = [], a = [], o = [], s = e.tokens.filter((e) => e.kind !== "lineComment" && e.kind !== "blockComment"), c = 0, l = 0;
	for (; c < s.length;) {
		let u = s[c];
		if (u.text === "{") {
			l++, c++;
			continue;
		}
		if (u.text === "}") {
			l = Math.max(0, l - 1), c++;
			continue;
		}
		if (l > 0) {
			c++;
			continue;
		}
		let d = c, f;
		s[c]?.text === "export" ? (c++, [f, c] = $a(s, c)) : ([f, c] = $a(s, c), s[c]?.text === "export" && c++);
		let p = s[c]?.text;
		if (p === "enable") {
			s[c + 1]?.kind === "ident" && o.push(s[c + 1].text), c = Za(s, c, ";") + 1;
			continue;
		}
		if (p === "struct") {
			let n = so(e, s, c, f);
			n.item && t.push(n.item), c = n.next;
			continue;
		}
		if (p === "alias") {
			let t = co(e, s, c, f);
			t.item && n.push(t.item), c = t.next;
			continue;
		}
		if (p === "var") {
			let t = lo(e, s, c, f);
			t.item && r.push(t.item), c = t.next;
			continue;
		}
		if (p === "fn") {
			let t = uo(e, s, c, f, d);
			t.item && i.push(t.item), c = t.next;
			continue;
		}
		if (p === "override") {
			let e = po(s, c, f);
			e.item && a.push(e.item), c = e.next;
			continue;
		}
		c = Math.max(d + 1, c + 1);
	}
	return {
		structs: t,
		aliases: n,
		vars: r,
		entries: i,
		overrides: a,
		features: o
	};
}
function so(e, t, n, r) {
	let i = Ja(t[n + 1]), a = Ya(t, n + 2, "{"), o = Qa(t, a);
	return {
		item: {
			name: i,
			originalName: i,
			mangledName: ho(e, i, "struct"),
			members: mo(t.slice(a + 1, o)),
			path: e.path
		},
		next: o + 1
	};
}
function co(e, t, n, r) {
	let i = Ja(t[n + 1]), a = Ya(t, n + 2, "="), o = Za(t, a + 1, ";");
	return {
		item: {
			name: i,
			originalName: i,
			mangledName: ho(e, i, "alias"),
			target: W(t.slice(a + 1, o)),
			path: e.path
		},
		next: o + 1
	};
}
function lo(e, t, n, r) {
	let { addressSpace: i, access: a, after: o } = io(t, n + 1), s = Ja(t[o]), c = Ya(t, o + 1, ":"), l = Za(t, c + 1, ";");
	return {
		item: {
			path: e.path,
			name: s,
			mangledName: go(r) ? s : ho(e, s, "var"),
			attrs: r,
			addressSpace: i,
			access: a,
			type: W(t.slice(c + 1, l))
		},
		next: l + 1
	};
}
function uo(e, t, n, r, i = n) {
	let a = Ja(t[n + 1]), o = r.find((e) => e.name === "vertex" || e.name === "fragment" || e.name === "compute")?.name;
	if (!o) return {
		item: void 0,
		next: n + 1
	};
	let s = Ya(t, n + 2, "("), c = Qa(t, s), l = Qa(t, Ya(t, c + 1, "{"));
	return {
		item: {
			name: a,
			mangledName: a,
			stage: o,
			workgroupSize: no(r),
			path: e.path,
			params: fo(t.slice(s + 1, c)),
			declarationStartToken: t[i],
			declarationEndToken: t[l]
		},
		next: l + 1
	};
}
function fo(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let [r, i] = $a(e, n);
		if (n = i, !e[n] || e[n].text === ",") {
			n++;
			continue;
		}
		let a = Ja(e[n]), o = Ya(e, n + 1, ":"), s = o + 1, c = 0;
		for (; s < e.length && (e[s].text === "<" && c++, e[s].text === ">" && (c = Math.max(0, c - 1)), c !== 0 || e[s].text !== ",");) s++;
		t.push({
			name: a,
			attrs: r,
			type: W(e.slice(o + 1, s))
		}), n = s + 1;
	}
	return t;
}
function po(e, t, n) {
	let r = Ja(e[t + 1]), i = Za(e, t + 1, ";"), a = Xa(e, t + 2, i, "=");
	return {
		item: {
			name: r,
			mangledName: r,
			id: U(n, "id"),
			defaultValue: a === void 0 ? void 0 : e.slice(a + 1, i).map((e) => e.text).join("")
		},
		next: i + 1
	};
}
function mo(e) {
	let t = [], n = 0;
	for (; n < e.length;) {
		let [r, i] = $a(e, n);
		if (n = i, !e[n] || e[n].text === "," || e[n].text === ";") {
			n++;
			continue;
		}
		let a = Ja(e[n]), o = Ya(e, n + 1, ":"), s = o + 1, c = 0;
		for (; s < e.length && (e[s].text === "<" && c++, e[s].text === ">" && (c = Math.max(0, c - 1)), c !== 0 || e[s].text !== "," && e[s].text !== ";");) s++;
		t.push({
			name: a,
			attrs: r,
			type: W(e.slice(o + 1, s)),
			align: U(r, "align"),
			size: U(r, "size")
		}), n = s + 1;
	}
	return t;
}
function ho(e, t, n) {
	return n === "override" ? t : ja(e.path, t);
}
function go(e) {
	return U(e, "group") !== void 0 || U(e, "binding") !== void 0;
}
var _o = t((() => {
	Ma(), qa(), to(), Ha(), ro(), ao();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/diagnostics.js
function vo(e = 1, t = 1) {
	return V("VGPU-WGSL-REFLECT-ARRAY-LENGTH", Co, e, t);
}
function yo(e = 1, t = 1) {
	return V("VGPU-WGSL-REFLECT-BOOL-HOST-SHAREABLE", wo, e, t);
}
function bo(e, t, n = 1, r = 1) {
	return V("VGPU-WGSL-REFLECT-UNKNOWN-TYPE", `type '${e}' is unknown in ${t}; ${To}`, n, r);
}
function xo(e, t, n = 1, r = 1) {
	return V("VGPU-WGSL-REFLECT-NS-TYPE", `type '${e}' is a namespace-member import; use a named import or manual @group(1+) binding`, n, r);
}
function So(e, t = 1, n = 1) {
	return V("VGPU-WGSL-REFLECT-NON-HOST-SHAREABLE", `Type ${e} is not host-shareable; ${To}`, t, n);
}
var Co, wo, To, Eo = t((() => {
	Hi(), Co = "literal length required for auto layout; use draw.group(n, bg) manual binding", wo = "VGPUError: `bool` is not host-shareable in uniform/storage. Fix: use `u32` (0 | 1) → struct Params { enabled: u32 }", To = "use a manual group claim (`draw.group(n, bg)`)";
})), Do, Oo = t((() => {
	Do = "wgsl-host-shareable-v1";
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-symbols.js
function ko(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let e of t) {
		let t = /* @__PURE__ */ new Map();
		for (let n of [...e.structs, ...e.aliases]) t.set(n.originalName, {
			path: n.path,
			name: n.originalName,
			mangledName: n.mangledName,
			kind: "members" in n ? "struct" : "alias"
		});
		r.set(e.structs[0]?.path ?? e.aliases[0]?.path ?? e.vars[0]?.path ?? "", t);
	}
	let i = new Map(e.map((e) => [e.path, r.get(e.path) ?? /* @__PURE__ */ new Map()])), a = /* @__PURE__ */ new Map();
	for (let t of e) {
		let r = new Map(i.get(t.path));
		for (let a of t.parsed.imports) Ao(t, a, r, e, i, n);
		a.set(t.path, r);
	}
	return a;
}
function Ao(e, t, n, r, i, a) {
	let o = Fo(t, e.path, r, a), s = i.get(o);
	for (let e of t.bindings) {
		if (e.namespace) {
			n.set(e.local, {
				path: o,
				name: e.local,
				mangledName: e.local,
				kind: "namespace"
			});
			continue;
		}
		let t = s?.get(e.imported);
		t && n.set(e.local, t);
	}
}
function jo(e, t) {
	let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map(), a = {
		structs: n,
		aliases: r,
		byMangled: i
	};
	for (let o of e) {
		for (let e of o.structs) {
			let r = {
				name: e.name,
				mangledName: e.mangledName,
				members: e.members.map((n) => ({
					name: n.name,
					type: Mo(n.type, e.path, t, a),
					align: n.align,
					size: n.size
				}))
			};
			n.set(e.mangledName, r), i.set(e.mangledName, r);
		}
		for (let e of o.aliases) {
			let n = {
				name: e.name,
				mangledName: e.mangledName,
				target: Mo(e.target, e.path, t, a)
			};
			r.set(e.mangledName, n), i.set(e.mangledName, n);
		}
	}
	return {
		structs: n,
		aliases: r,
		byMangled: i
	};
}
function Mo(e, t, n, r) {
	switch (e.kind) {
		case "identifier": {
			let r = e.name.indexOf(".");
			if (r > 0) {
				let i = e.name.slice(0, r);
				if (n.get(t)?.get(i)?.kind === "namespace") throw xo(e.name, t);
			}
			let i = n.get(t)?.get(e.name);
			if (i?.kind === "namespace") throw xo(e.name, t);
			if (!i) throw bo(e.name, t);
			return {
				kind: "identifier",
				name: i.name,
				mangledName: i.mangledName
			};
		}
		case "array":
		case "atomic":
		case "vector":
		case "matrix":
		case "ptr": return {
			...e,
			element: Mo(e.element, t, n, r)
		};
		case "texture": return {
			...e,
			sampleType: e.sampleType ? Mo(e.sampleType, t, n, r) : void 0
		};
		default: return e;
	}
}
function No(e, t) {
	if (!t || e.kind !== "identifier") return e;
	let n = t.aliases.get(e.mangledName ?? e.name);
	return n ? No(n.target, t) : e;
}
function Po(e, t) {
	let n = No(e, t);
	switch (n.kind) {
		case "array":
		case "atomic":
		case "vector":
		case "matrix":
		case "ptr": return {
			...n,
			element: Po(n.element, t)
		};
		case "texture": return {
			...n,
			sampleType: n.sampleType ? Po(n.sampleType, t) : void 0
		};
		default: return n;
	}
}
function Fo(e, t, n, r) {
	let i = Io(e, t, r);
	if (i !== void 0 && n.some((e) => e.path === i)) return i;
	let a = e.from, o = t.slice(0, t.lastIndexOf("/") + 1), s = a.startsWith("/") ? a : Lo(`${o}${a}`);
	return [a, s].find((e) => n.some((t) => t.path === e)) ?? i ?? s;
}
function Io(e, t, n) {
	if (n) try {
		return n(t, e);
	} catch {
		return;
	}
}
function Lo(e) {
	let t = e.startsWith("/"), n = [];
	for (let t of e.split("/")) t && t !== "." && (t === ".." ? n.pop() : n.push(t));
	return `${t ? "/" : ""}${n.join("/")}`;
}
var Ro = t((() => {
	Eo();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-layout.js
function zo(e, t = eo(e), n = t, r) {
	return Bo(r ? Po(e, r) : e, t, n, r);
}
function Bo(e, t, n, r) {
	switch (e.kind) {
		case "scalar": return Vo(e, t, n);
		case "atomic": return Ho(e, t, n);
		case "vector": return Uo(e, t, n, r);
		case "matrix": return Wo(e, t, n, r);
		case "array": return Go(e, t, n, r);
		case "identifier": return qo(e, t, n, r);
		default: throw So(eo(e));
	}
}
function Vo(e, t, n) {
	let r = Ba(e.name);
	if (e.name === "bool") throw yo();
	return {
		name: t,
		mangledName: n,
		layoutMode: Do,
		type: e,
		align: r,
		size: r
	};
}
function Ho(e, t, n) {
	return {
		name: t,
		mangledName: n,
		layoutMode: Do,
		type: e,
		align: 4,
		size: 4
	};
}
function Uo(e, t, n, r) {
	let i = zo(e.element, t, n, r).size ?? 4, a = e.width === 2 ? i * 2 : i * 4;
	return {
		name: t,
		mangledName: n,
		layoutMode: Do,
		type: e,
		align: a,
		size: i * e.width
	};
}
function Wo(e, t, n, r) {
	let i = zo({
		kind: "vector",
		width: e.rows,
		element: e.element
	}, `${t}[]`, `${n}[]`, r), a = Va(i.align, i.size ?? 0);
	return {
		name: t,
		mangledName: n,
		layoutMode: Do,
		type: e,
		align: i.align,
		size: a * e.columns,
		stride: a,
		element: i
	};
}
function Go(e, t, n, r) {
	Ko(e.countExpression);
	let i = zo(e.element, `${t}[]`, `${n}[]`, r), a = Va(Yo(e.element, r), i.size ?? 0);
	return {
		name: t,
		mangledName: n,
		layoutMode: Do,
		type: e,
		align: Yo(e, r),
		size: e.count === void 0 ? void 0 : a * e.count,
		stride: a,
		element: i,
		runtimeSized: e.count === void 0
	};
}
function Ko(e) {
	if (e !== void 0 && !Ia(e)) throw vo();
}
function qo(e, t, n, r) {
	if (!r) throw bo(e.name, "<unknown>");
	let i = r.structs.get(e.mangledName ?? e.name);
	if (!i) throw bo(e.name, "<unknown>");
	let a = [], o = 0, s = 1;
	for (let e of i.members) {
		let t = Jo(e, o, r);
		a.push(t.member), o = t.offset + (t.member.size ?? 0), s = Math.max(s, t.member.align);
	}
	return {
		name: t,
		mangledName: n,
		layoutMode: Do,
		type: e,
		align: s,
		size: Va(s, o),
		members: a
	};
}
function Jo(e, t, n) {
	let r = zo(e.type, e.name, e.name, n), i = Math.max(Yo(e.type, n), e.align ?? 1), a = Math.max(r.size ?? 0, e.size ?? 0), o = Va(i, t);
	return {
		member: {
			name: e.name,
			offset: o,
			align: i,
			size: a,
			type: e.type,
			layout: r,
			explicitAlign: e.align,
			explicitSize: e.size
		},
		offset: o
	};
}
function Yo(e, t) {
	let n = t ? Po(e, t) : e;
	switch (n.kind) {
		case "scalar": return Xo(n.name);
		case "atomic": return 4;
		case "vector": return n.width === 2 ? Yo(n.element, t) * 2 : Yo(n.element, t) * 4;
		case "matrix": return Yo({
			kind: "vector",
			width: n.rows,
			element: n.element
		}, t);
		case "array": return Yo(n.element, t);
		case "identifier": return Zo(n, t);
		default: throw So(eo(n));
	}
}
function Xo(e) {
	if (e === "bool") throw yo();
	return Ba(e);
}
function Zo(e, t) {
	let n = t?.structs.get(e.mangledName ?? e.name);
	if (!n) throw bo(e.name, "<unknown>");
	return Math.max(1, ...n.members.map((e) => Math.max(Yo(e.type, t), e.align ?? 1)));
}
var Qo = t((() => {
	Eo(), Oo(), Ro(), Ha(), to();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/scope-walker.js
function $o(e) {
	return new rs(e).analyze();
}
function es(e, t) {
	for (let n = e.length - 1; n >= 0; n--) if (t(e[n])) return e[n];
}
function G(e) {
	return e.kind === "lineComment" || e.kind === "blockComment";
}
var ts, ns, rs, is = t((() => {
	ts = /^_vgsl_[0-9a-f]{8,16}__[A-Za-z_][A-Za-z0-9_]*$/, ns = /* @__PURE__ */ new Set([
		"fn",
		"struct",
		"const",
		"alias",
		"var",
		"override"
	]), rs = class {
		tokens;
		scopes = [];
		declarations = [];
		references = [];
		functions = [];
		preserved = /* @__PURE__ */ new Map();
		symbolsByScope = /* @__PURE__ */ new Map();
		moduleFallbackReasons = [];
		pendingSymbols = [];
		moduleScopeId;
		constructor(e) {
			this.tokens = e, this.moduleScopeId = this.createScope("module", void 0, void 0, 0);
		}
		analyze() {
			this.collectTopLevel();
			for (let e of this.functions) this.walkFunction(e);
			return {
				tokens: this.tokens,
				scopes: this.scopes,
				declarations: this.declarations,
				references: this.references,
				functions: this.functions,
				preservedTokens: [...this.preserved.entries()].map(([e, t]) => ({
					tokenIndex: e,
					reason: t
				})),
				fallback: {
					wholeModule: this.moduleFallbackReasons.length > 0,
					reasons: this.moduleFallbackReasons
				}
			};
		}
		collectTopLevel() {
			let e = 0;
			for (let t = 0; t < this.tokens.length; t++) {
				let n = this.tokens[t];
				if (!G(n)) {
					if (n.text === "{") {
						e++;
						continue;
					}
					if (n.text === "}") {
						e--, e < 0 && (this.moduleFallback("unmatched top-level closing brace", t), e = 0);
						continue;
					}
					if (e === 0) {
						if (n.text === "@") {
							t = this.preserveAttribute(t);
							continue;
						}
						if (n.text === "enable" || n.text === "requires" || n.text === "diagnostic" || n.text === "const_assert") {
							t = this.preserveStatement(t, "directive");
							continue;
						}
						if (n.text !== "export") {
							if (n.text === "struct") {
								t = this.collectStruct(t);
								continue;
							}
							if (n.text === "fn") {
								t = this.collectFunction(t);
								continue;
							}
							if (n.text === "const" || n.text === "alias" || n.text === "var" || n.text === "override") {
								t = this.preserveGlobalDeclaration(t);
								continue;
							}
							n.kind === "keyword" && !ns.has(n.text) && this.moduleFallback(`unexpected top-level keyword '${n.text}'`, t);
						}
					}
				}
			}
			e !== 0 && this.moduleFallback("unclosed top-level brace", this.tokens.length - 1), this.scopes[this.moduleScopeId].endToken = Math.max(0, this.tokens.length - 1);
		}
		collectStruct(e) {
			let t = this.nextSig(e);
			if (t === void 0 || this.tokens[t]?.kind !== "ident") return this.moduleFallback("struct without name", e), e;
			this.preserveToken(t, "global");
			let n = this.nextSig(t);
			if (n === void 0 || this.tokens[n]?.text !== "{") return this.moduleFallback("struct without body", e), t;
			let r = this.findMatching(n, "{", "}");
			if (r === void 0) return this.moduleFallback("unclosed struct body", n), n;
			for (let e = n; e <= r; e++) this.tokens[e]?.kind === "ident" && this.preserveToken(e, "struct");
			return r;
		}
		collectFunction(e) {
			let t = this.nextSig(e);
			if (t === void 0 || this.tokens[t]?.kind !== "ident") return this.moduleFallback("function without name", e), e;
			let n = this.tokens[t].text, r = ts.test(n) && !this.hasEntryAttributeBefore(e);
			this.addDeclaration(n, "function", t, this.moduleScopeId, void 0, r), r || this.preserveToken(t, "global");
			let i = this.nextSig(t);
			if (i === void 0 || this.tokens[i]?.text !== "(") return this.moduleFallback("function without parameter list", t), t;
			let a = this.findMatching(i, "(", ")");
			if (a === void 0) return this.moduleFallback("unclosed function parameter list", i), i;
			let o = this.findNextText(a + 1, "{");
			if (o === void 0) return this.moduleFallback("function without body", a), a;
			this.preserveFunctionSignatureTail(a + 1, o);
			let s = this.findMatching(o, "{", "}");
			if (s === void 0) return this.moduleFallback("unclosed function body", o), o;
			let c = this.createScope("function", this.moduleScopeId, this.functions.length, i);
			return this.functions.push({
				id: this.functions.length,
				name: n,
				nameTokenIndex: t,
				scopeId: c,
				bodyStartToken: o,
				bodyEndToken: s,
				skipped: !1,
				fallbackReasons: []
			}), this.collectParams(i, a, c, this.functions.length - 1), this.scopes[c].endToken = s, s;
		}
		collectParams(e, t, n, r) {
			for (let i = e + 1; i < t; i++) {
				let e = this.tokens[i];
				if (!G(e)) {
					if (e.text === "@") {
						i = this.preserveAttribute(i);
						continue;
					}
					if (e.kind === "ident" && this.nextSig(i) !== void 0 && this.tokens[this.nextSig(i)]?.text === ":") {
						this.addDeclaration(e.text, "param", i, n, r, !0);
						let a = this.nextSig(i);
						i = this.preserveTypeFrom(a + 1, [",", ")"], t);
					}
				}
			}
		}
		preserveFunctionSignatureTail(e, t) {
			for (let n = e; n < t; n++) {
				let e = this.tokens[n];
				if (!G(e)) {
					if (e.text === "@") {
						n = this.preserveAttribute(n);
						continue;
					}
					e.kind === "ident" && this.preserveToken(n, "type");
				}
			}
		}
		preserveGlobalDeclaration(e) {
			let t = e + 1;
			if (this.tokens[e]?.text === "var") {
				let n = this.nextSig(e);
				if (n !== void 0 && this.tokens[n]?.text === "<") {
					let e = this.findMatching(n, "<", ">");
					if (e === void 0) return this.moduleFallback("unparseable top-level var template", n), n;
					this.preserveRange(n, e, "type"), t = e + 1;
				}
			}
			let n = this.findNextIdent(t);
			n !== void 0 && (this.preserveToken(n, "global"), this.addDeclaration(this.tokens[n].text, "global", n, this.moduleScopeId, void 0, !1));
			let r = this.findStatementEnd(e);
			for (let t = e; t <= r; t++) this.tokens[t]?.kind === "ident" && this.preserveToken(t, "global");
			return r;
		}
		walkFunction(e) {
			let t = [this.moduleScopeId, e.scopeId], n = [], r = (n, r) => {
				let i = this.createScope(n, t[t.length - 1], e.id, r);
				return t.push(i), i;
			}, i = (n) => {
				if (t.length <= 2) {
					this.functionFallback(e, "scope frame underflow", n);
					return;
				}
				let r = t.pop();
				return this.scopes[r].endToken = n, r;
			};
			r("block", e.bodyStartToken);
			let a = 1;
			for (let o = e.bodyStartToken + 1; o < e.bodyEndToken; o++) {
				this.activatePendingSymbols(o);
				let s = this.tokens[o];
				if (G(s)) continue;
				if (s.text === "@") {
					o = this.preserveAttribute(o);
					continue;
				}
				if (s.text === ".") {
					let e = this.nextSig(o);
					e !== void 0 && this.tokens[e]?.kind === "ident" && this.preserveToken(e, "member");
					continue;
				}
				if (s.text === "enable" || s.text === "requires" || s.text === "diagnostic") {
					o = this.preserveStatement(o, "directive");
					continue;
				}
				if (s.text === "for") {
					let t = r("for-init", o), i = this.nextSig(o);
					(i === void 0 || this.tokens[i]?.text !== "(") && this.functionFallback(e, "for without parenthesized header", o), n.push({
						scopeId: t,
						headerDepth: 0,
						awaitingBody: !1
					});
					continue;
				}
				let c = n[n.length - 1];
				if (c && c.bodyDepth === void 0 && (s.text === "(" && c.headerDepth++, s.text === ")" && (c.headerDepth--, c.headerDepth <= 0 && (c.awaitingBody = !0))), s.text === "{") {
					a++;
					let e = es(n, (e) => e.awaitingBody && e.bodyDepth === void 0);
					e && (e.bodyDepth = a), r("block", o);
					continue;
				}
				if (s.text === "}") {
					let t = a;
					for (i(o), a--; n.length > 0 && n[n.length - 1].bodyDepth === t;) i(o), n.pop();
					a < 0 && this.functionFallback(e, "unmatched closing brace", o);
					continue;
				}
				if (s.text === ":") {
					o = this.preserveTypeFrom(o + 1, [
						"=",
						";",
						",",
						")",
						"{"
					], e.bodyEndToken);
					continue;
				}
				if (s.text === "-" && this.tokens[this.nextSig(o) ?? -1]?.text === ">") {
					o = this.preserveTypeFrom((this.nextSig(o) ?? o) + 1, ["{"], e.bodyEndToken);
					continue;
				}
				if (s.text === "let" || s.text === "const" || s.text === "var") {
					o = this.collectLocalDeclaration(o, t[t.length - 1], e);
					continue;
				}
				if (s.kind === "ident" && !this.preserved.has(o)) {
					let n = this.resolve(s.text, t);
					n === void 0 ? this.preserveToken(o, "unknown") : this.references.push({
						name: s.text,
						tokenIndex: o,
						declarationId: n,
						scopeId: t[t.length - 1],
						functionId: e.id
					});
				}
			}
			for (; t.length > 2;) i(e.bodyEndToken);
		}
		collectLocalDeclaration(e, t, n) {
			let r = this.tokens[e].text, i = e + 1;
			if (r === "var") {
				let t = this.nextSig(e);
				if (t !== void 0 && this.tokens[t]?.text === "<") {
					let e = this.findMatching(t, "<", ">");
					if (e === void 0) return this.functionFallback(n, "unparseable var template", t), t;
					this.preserveRange(t, e, "type"), i = e + 1;
				}
			}
			let a = this.findNextIdent(i);
			if (a === void 0 || a >= n.bodyEndToken) return this.functionFallback(n, `${r} without identifier`, e), e;
			this.addDeclaration(this.tokens[a].text, r, a, t, n.id, !0, this.findStatementEnd(e));
			let o = this.nextSig(a);
			return o !== void 0 && this.tokens[o]?.text === ":" ? this.preserveTypeFrom(o + 1, [
				"=",
				";",
				",",
				")"
			], n.bodyEndToken) : a;
		}
		addDeclaration(e, t, n, r, i, a, o) {
			let s = this.declarations.length;
			return this.declarations.push({
				id: s,
				name: e,
				kind: t,
				tokenIndex: n,
				scopeId: r,
				functionId: i,
				safeToRename: a
			}), o === void 0 ? this.activateSymbol(e, s, r) : this.pendingSymbols.push({
				name: e,
				id: s,
				scopeId: r,
				activateAfter: o
			}), s;
		}
		activatePendingSymbols(e) {
			for (let t = this.pendingSymbols.length - 1; t >= 0; t--) {
				let n = this.pendingSymbols[t];
				n.activateAfter >= e || (this.activateSymbol(n.name, n.id, n.scopeId), this.pendingSymbols.splice(t, 1));
			}
		}
		activateSymbol(e, t, n) {
			let r = this.symbolsByScope.get(n);
			r || (r = /* @__PURE__ */ new Map(), this.symbolsByScope.set(n, r)), r.has(e) || r.set(e, t);
		}
		resolve(e, t) {
			for (let n = t.length - 1; n >= 0; n--) {
				let r = this.symbolsByScope.get(t[n])?.get(e);
				if (r !== void 0) return r;
			}
		}
		preserveAttribute(e) {
			this.preserveToken(e, "attribute");
			let t = this.nextSig(e);
			if (t === void 0) return e;
			this.preserveToken(t, "attribute");
			let n = this.nextSig(t);
			if (n === void 0 || this.tokens[n]?.text !== "(") return t;
			let r = this.findMatching(n, "(", ")");
			return r === void 0 ? (this.preserveRange(n, n, "attribute"), n) : (this.preserveRange(n, r, "attribute"), r);
		}
		preserveTypeFrom(e, t, n) {
			let r = 0, i = 0, a = 0, o = e - 1;
			for (let s = e; s < n; s++) {
				let n = this.tokens[s];
				if (!G(n)) {
					if (r === 0 && i === 0 && a === 0 && t.includes(n.text)) return Math.max(e - 1, s - 1);
					if (n.text === "<") r++;
					else if (n.text === ">") r = Math.max(0, r - 1);
					else if (n.text === "(") i++;
					else if (n.text === ")") {
						if (i === 0 && t.includes(")")) return Math.max(e - 1, s - 1);
						i = Math.max(0, i - 1);
					} else n.text === "[" ? a++ : n.text === "]" && (a = Math.max(0, a - 1));
					n.kind === "ident" && this.preserveToken(s, "type"), o = s;
				}
			}
			return o;
		}
		preserveStatement(e, t) {
			let n = this.findStatementEnd(e);
			return this.preserveRange(e, n, t), n;
		}
		preserveRange(e, t, n) {
			for (let r = e; r <= t; r++) this.tokens[r] && this.tokens[r].kind !== "lineComment" && this.tokens[r].kind !== "blockComment" && this.preserveToken(r, n);
		}
		preserveToken(e, t) {
			this.preserved.has(e) || this.preserved.set(e, t);
		}
		createScope(e, t, n, r) {
			let i = this.scopes.length;
			return this.scopes.push({
				id: i,
				kind: e,
				parentId: t,
				functionId: n,
				startToken: r
			}), i;
		}
		nextSig(e) {
			for (let t = e + 1; t < this.tokens.length; t++) if (!G(this.tokens[t])) return t;
		}
		findNextIdent(e) {
			for (let t = e; t < this.tokens.length; t++) {
				let e = this.tokens[t];
				if (!G(e)) {
					if (e.kind === "ident") return t;
					if (e.text !== "@") return;
				}
			}
		}
		findNextText(e, t) {
			for (let n = e; n < this.tokens.length; n++) if (!G(this.tokens[n]) && this.tokens[n].text === t) return n;
		}
		findStatementEnd(e) {
			let t = 0;
			for (let n = e; n < this.tokens.length; n++) {
				let e = this.tokens[n].text;
				if (e === "(") t++;
				else if (e === ")") t = Math.max(0, t - 1);
				else if (t === 0 && (e === ";" || e === "{" || e === "}")) return n;
			}
			return this.tokens.length - 1;
		}
		findMatching(e, t, n) {
			let r = 0;
			for (let i = e; i < this.tokens.length; i++) {
				let e = this.tokens[i].text;
				if (e === t && r++, e === n && (r--, r === 0)) return i;
			}
		}
		hasEntryAttributeBefore(e) {
			for (let t = e - 1; t >= 0; t--) {
				let e = this.tokens[t];
				if (!G(e)) {
					if (e.text === ")" || e.kind === "ident" || e.text === "@") {
						let t = e.text;
						if (t === "compute" || t === "vertex" || t === "fragment") return !0;
						continue;
					}
					break;
				}
			}
			return !1;
		}
		moduleFallback(e, t) {
			this.moduleFallbackReasons.push(`${e} at token ${t}`);
		}
		functionFallback(e, t, n) {
			e.skipped = !0, e.fallbackReasons.push(`${t} at token ${n}`);
		}
	};
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-sampling.js
function as(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let i = 0; i < e.length; i++) {
		let a = e[i], o = t[i], s = $o(a.tokens), c = /* @__PURE__ */ new Map();
		for (let e of o.vars) {
			let t = U(e.attrs, "group"), n = U(e.attrs, "binding"), r = s.declarations.find((t) => t.kind === "global" && t.name === e.name);
			t !== void 0 && n !== void 0 && r && c.set(r.id, {
				group: t,
				binding: n
			});
		}
		let l = /* @__PURE__ */ new Map();
		for (let e of s.declarations) {
			if (e.kind !== "function") continue;
			let t = s.functions.find((t) => t.nameTokenIndex === e.tokenIndex);
			t && l.set(e.id, t.id);
		}
		for (let e of o.entries) {
			let t = s.functions.find((t) => t.name === e.name), i = [], a = s.fallback.wholeModule || !t;
			!a && t && (a = !os(t.id, /* @__PURE__ */ new Map(), /* @__PURE__ */ new Set(), s, c, l, i));
			let o = t ? ds(t.id, s, c, l) : n.map(ps);
			r.set(e, a ? fs(n, o) : ms(i));
		}
	}
	return r;
}
function os(e, t, n, r, i, a, o) {
	let s = r.functions[e];
	if (!s || s.skipped) return !1;
	let c = `${e}|${[...t].map(([e, t]) => `${e}:${t.group}:${t.binding}`).join(",")}`;
	if (n.has(c)) return !0;
	n.add(c);
	let l = r.references.filter((t) => t.functionId === e), u = new Map(l.map((e) => [e.tokenIndex, e]));
	for (let e = s.bodyStartToken + 1; e < s.bodyEndToken; e++) {
		let s = r.tokens[e]?.text, c = hs.has(s ?? "") ? "filtering" : gs.has(s ?? "") ? "comparison" : void 0, l = u.get(e), d = l && a.get(l.declarationId);
		if (!c && d === void 0) continue;
		let f = us(r, e);
		if (f === void 0 || r.tokens[f]?.text !== "(") continue;
		let p = ls(r, f);
		if (!p) return !1;
		let m = p.map(([e, n]) => ss(e, n, r, i, t));
		if (c) {
			let e = +(s === "textureGather" && !cs(p[0], r, i, t)), n = m[e], a = m[e + 1];
			if (!n || !a) return !1;
			o.push({
				texture: n,
				sampler: a,
				mode: c
			});
		} else {
			let e = r.declarations.filter((e) => e.kind === "param" && e.functionId === d).sort((e, t) => e.tokenIndex - t.tokenIndex), t = /* @__PURE__ */ new Map();
			for (let n = 0; n < e.length; n++) m[n] && t.set(e[n].id, m[n]);
			if (!os(d, t, n, r, i, a, o)) return !1;
		}
	}
	return !0;
}
function ss(e, t, n, r, i) {
	for (let a of n.references) {
		if (a.tokenIndex < e || a.tokenIndex > t) continue;
		let n = r.get(a.declarationId) ?? i.get(a.declarationId);
		if (n) return n;
	}
}
function cs(e, t, n, r) {
	let i = t.references.find((t) => t.tokenIndex >= e[0] && t.tokenIndex <= e[1]);
	return i?.tokenIndex === e[0] ? n.get(i.declarationId) ?? r.get(i.declarationId) : void 0;
}
function ls(e, t) {
	let n = [], r = 1, i = 0, a = 0, o = 0, s = t + 1;
	for (let c = t + 1; c < e.tokens.length; c++) {
		let t = e.tokens[c].text;
		if (t === "(") r++;
		else if (t === ")") {
			if (r--, r === 0) return n.push([s, c - 1]), n;
		} else t === "[" ? i++ : t === "]" ? i-- : t === "{" ? a++ : t === "}" ? a-- : t === "<" ? o++ : t === ">" ? o-- : t === "," && r === 1 && i === 0 && a === 0 && o === 0 && (n.push([s, c - 1]), s = c + 1);
	}
}
function us(e, t) {
	for (let n = t + 1; n < e.tokens.length; n++) if (e.tokens[n].kind !== "lineComment" && e.tokens[n].kind !== "blockComment") return n;
}
function ds(e, t, n, r) {
	let i = [e], a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Map();
	for (; i.length;) {
		let e = i.pop();
		if (!a.has(e)) {
			a.add(e);
			for (let a of t.references) {
				if (a.functionId !== e) continue;
				let t = n.get(a.declarationId);
				t && o.set(`${t.group}:${t.binding}`, t);
				let s = r.get(a.declarationId);
				s !== void 0 && i.push(s);
			}
		}
	}
	return [...o.values()];
}
function fs(e, t) {
	let n = new Set(t.map((e) => `${e.group}:${e.binding}`)), r = e.filter((e) => n.has(`${e.group}:${e.binding}`)), i = r.filter((e) => e.bindingLayout?.kind === "texture" && e.bindingLayout.texture.sampleType === "unfilterable-float" && !e.bindingLayout.texture.multisampled), a = r.filter((e) => e.bindingLayout?.kind === "sampler" && e.bindingLayout.sampler.type === "filtering");
	return i.flatMap((e) => a.map((t) => ({
		texture: ps(e),
		sampler: ps(t),
		mode: "filtering"
	})));
}
function ps(e) {
	return {
		group: e.group,
		binding: e.binding
	};
}
function ms(e) {
	let t = /* @__PURE__ */ new Set();
	return e.filter((e) => {
		let n = `${e.texture.group}:${e.texture.binding}:${e.sampler.group}:${e.sampler.binding}:${e.mode}`;
		return !t.has(n) && (t.add(n), !0);
	});
}
var hs, gs, _s = t((() => {
	is(), Ha(), hs = /* @__PURE__ */ new Set([
		"textureSample",
		"textureSampleBias",
		"textureSampleLevel",
		"textureSampleGrad",
		"textureGather",
		"textureSampleBaseClampToEdge"
	]), gs = /* @__PURE__ */ new Set([
		"textureSampleCompare",
		"textureSampleCompareLevel",
		"textureGatherCompare"
	]);
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect.js
function vs(e, t) {
	let n = e.map(oo), r = ko(e, n, t), i = jo(n, r), a = [], o = [];
	for (let e of n) for (let t of e.vars) {
		let e = U(t.attrs, "group"), n = U(t.attrs, "binding");
		if (e === void 0 || n === void 0) continue;
		let s = Mo(t.type, t.path, r, i), c = $i(s, t.addressSpace), l = t.addressSpace === "uniform" || t.addressSpace === "storage" ? zo(s, t.name, t.mangledName, i) : void 0;
		l && o.push(l), a.push({
			group: e,
			binding: n,
			name: t.name,
			mangledName: t.mangledName,
			type: s,
			kind: c,
			addressSpace: t.addressSpace,
			access: t.access,
			struct: s.kind === "identifier" ? i.structs.get(s.mangledName ?? s.name) : void 0,
			layout: l,
			bindingLayout: ea(c, t.addressSpace, t.access, s, l)
		});
	}
	a.sort((e, t) => e.group - t.group || e.binding - t.binding);
	let s = ys(e, n, a), c = as(e, n, a);
	return {
		bindings: a,
		entryPoints: n.flatMap((e) => e.entries.map((e) => bs(e, n.flatMap((e) => e.structs), r, i, s.get(e) ?? a, c.get(e) ?? []))),
		overrides: n.flatMap((e) => e.overrides),
		featuresRequired: [...new Set(n.flatMap((e) => e.features))],
		aliases: [...i.aliases.values()],
		structs: [...i.structs.values()],
		hostShareableLayouts: o
	};
}
function ys(e, t, n) {
	let r = /* @__PURE__ */ new Map();
	for (let i = 0; i < e.length; i++) {
		let a = e[i], o = t[i], s = $o(a.tokens), c = s.fallback.wholeModule, l = /* @__PURE__ */ new Map();
		for (let e of s.declarations) {
			if (e.kind !== "function") continue;
			let t = s.functions.find((t) => t.nameTokenIndex === e.tokenIndex);
			t && l.set(e.id, t.id);
		}
		let u = /* @__PURE__ */ new Map();
		for (let e of o.vars) {
			let t = U(e.attrs, "group"), n = U(e.attrs, "binding");
			if (t === void 0 || n === void 0) continue;
			let r = s.declarations.find((t) => t.kind === "global" && t.name === e.name);
			r && u.set(r.id, {
				group: t,
				binding: n
			});
		}
		for (let e of o.entries) {
			let t = s.functions.find((t) => t.name === e.name);
			if (c || !t) {
				r.set(e, n);
				continue;
			}
			let i = [t.id], a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Map();
			for (; i.length;) {
				let e = i.pop();
				if (!a.has(e) && (a.add(e), s.functions[e])) for (let t of s.references) {
					if (t.functionId !== e) continue;
					let n = u.get(t.declarationId);
					n && o.set(`${n.group}:${n.binding}`, n);
					let r = l.get(t.declarationId);
					r !== void 0 && i.push(r);
				}
			}
			r.set(e, [...o.values()].sort((e, t) => e.group - t.group || e.binding - t.binding));
		}
	}
	return r;
}
function bs(e, t, n, r, i, a) {
	return {
		name: e.name,
		mangledName: e.mangledName,
		stage: e.stage,
		...e.workgroupSize ? { workgroupSize: e.workgroupSize } : {},
		bindings: i.map(({ group: e, binding: t }) => ({
			group: e,
			binding: t
		})),
		samplingPairs: a,
		...e.stage === "vertex" ? { inputs: xs(e, t, n, r) } : {}
	};
}
function xs(e, t, n, r) {
	let i = [];
	for (let a of e.params) {
		if (Ss(a.attrs, "builtin")) continue;
		let o = Mo(a.type, e.path, n, r), s = U(a.attrs, "location");
		if (s !== void 0) {
			i.push({
				name: a.name,
				location: s,
				type: o
			});
			continue;
		}
		let c = No(o, r);
		if (c.kind !== "identifier") continue;
		let l = t.find((e) => e.mangledName === (c.mangledName ?? c.name)), u = r.structs.get(c.mangledName ?? c.name);
		if (l) for (let e = 0; e < l.members.length; e++) {
			let t = l.members[e];
			if (Ss(t.attrs, "builtin")) continue;
			let a = U(t.attrs, "location");
			a !== void 0 && i.push({
				name: t.name,
				location: a,
				type: u?.members[e]?.type ?? Mo(t.type, l.path, n, r)
			});
		}
	}
	return i;
}
function Ss(e, t) {
	return e.some((e) => e.name === t);
}
var Cs = t((() => {
	ca(), _o(), Qo(), _s(), Ro(), Ha(), is(), Oo();
}));
//#endregion
//#region node_modules/@vgpu/wgsl/dist/runtime/reflect-source.js
function ws(e, t = "<runtime>") {
	let n = ua(e, t), r = Ui(n);
	if (r.imports.length > 0) throw V("VGPU-WGSL-REFLECT-SOURCE-IMPORT", "reflectSource() accepts a single raw WGSL string; use resolveShader() for WGSL import graphs.");
	return vs([{
		path: t,
		source: e,
		tokens: n,
		parsed: r
	}]);
}
var Ts = t((() => {
	Hi(), Qi(), Cs(), ga();
}));
//#endregion
//#region node_modules/vgpu/dist/bind-cache.js
function Es() {
	let e = /* @__PURE__ */ new Map();
	return {
		getOrCreate(t, n, r, i) {
			let a = r.map(Ds), o = `${t}:${n}:${a.join("|")}`, s = e.get(o);
			if (s) return s.bindGroup;
			let c = i();
			return e.set(o, {
				identities: a,
				bindGroup: c
			}), c;
		},
		evictIdentity(t) {
			let n = Ds(t);
			for (let [t, r] of e) r.identities.includes(n) && e.delete(t);
		},
		clearDraw(t) {
			let n = `${t}:`;
			for (let t of e.keys()) t.startsWith(n) && e.delete(t);
		},
		dispose() {
			e.clear();
		}
	};
}
function Ds(e) {
	return typeof e == "string" || typeof e == "number" ? String(e) : `${e.kind}:${e.id}`;
}
var Os = t((() => {}));
//#endregion
//#region node_modules/vgpu/dist/entry-metadata.js
function ks(e, t, n) {
	let r = e[t];
	if (!r) throw new I({
		code: "VGPU-REFLECT-ENTRY-METADATA-MISSING",
		message: `Entry point '${e.name}' has no reflected ${t}.`,
		fix: "Pass the reflection from reflectSource()/resolveShader().",
		where: n
	});
	return r;
}
var As = t((() => {
	L();
}));
//#endregion
//#region node_modules/vgpu/dist/claim-validation.js
function js(e, t) {
	if (!e.gpu.pushErrorScope || !e.gpu.popErrorScope) return;
	e.gpu.pushErrorScope("validation");
	let n = Hs.get(e.gpu);
	n ? n.push(t) : Hs.set(e.gpu, [t]);
}
function K(e) {
	let t = Hs.get(e.gpu);
	if (!t?.length || !e.gpu.popErrorScope) return;
	let n = t.pop();
	return t.length || Hs.delete(e.gpu), {
		context: n,
		error: e.gpu.popErrorScope()
	};
}
function Ms(e) {
	let t = [], n = K(e);
	for (; n;) t.push(n), n = K(e);
	return t;
}
function Ns(e) {
	let t = K(e);
	t && Bs(t);
}
function Ps(e) {
	for (let t of Ms(e)) Bs(t);
}
function q(e) {
	for (let t of e) Bs(t);
}
function Fs(e) {
	return e.gpu.queue.onSubmittedWorkDone?.() ?? Promise.resolve();
}
function Is(e, t = [], n = {}) {
	return zs(e, t, n.errorSink ?? Vs);
}
function Ls(e, t) {
	return {
		context: e.context,
		error: Rs(e.error, t.error)
	};
}
async function Rs(e, t) {
	let n = await Promise.allSettled([e, t]);
	for (let e of n) if (e.status === "fulfilled" && e.value) return e.value;
	let r = n.find((e) => e.status === "rejected");
	if (r?.status === "rejected") throw r.reason;
	return null;
}
async function zs(e, t, n) {
	await Fs(e);
	for (let e of t) try {
		let t = await e.error;
		t && await n(wn(e.context.label, e.context.group, t));
	} catch (t) {
		await n(wn(e.context.label, e.context.group, t));
	}
}
function Bs(e) {
	e.error.catch(() => void 0);
}
function Vs(e) {
	console.error(e);
}
var Hs, Us = t((() => {
	L(), Hs = /* @__PURE__ */ new WeakMap();
}));
//#endregion
//#region node_modules/vgpu/dist/claim-validation-encode.js
function Ws(e, t, n, r) {
	try {
		t.end();
	} catch (t) {
		let i = Ms(e);
		q(n), q(i), n.length = 0;
		let a = i[0]?.context ?? r;
		throw a ? wn(a.label, a.group, t) : t;
	}
}
var Gs = t((() => {
	Us(), L();
}));
//#endregion
//#region node_modules/vgpu/dist/set-resources.js
function Ks(e) {
	return typeof e != "object" || !e || ArrayBuffer.isView(e) || e instanceof ArrayBuffer || Array.isArray(e) ? !0 : e instanceof D || e instanceof O ? !1 : !lc(e);
}
function qs(e) {
	return typeof e != "object" || !e || Array.isArray(e) || ArrayBuffer.isView(e) || e instanceof ArrayBuffer || e instanceof D || e instanceof O ? !1 : !lc(e);
}
function Js(e, t, n) {
	try {
		return Ys(e, t, n);
	} catch (r) {
		if (r?.code === "VGPU-CORE-TEXTURE-DESTROYED") {
			let r = t instanceof O ? t.label : cc(t)?.color.label;
			throw _n(n.sourceHint, e, r);
		}
		throw r;
	}
}
function Ys(e, t, n) {
	switch (e.bindingLayout?.kind) {
		case "buffer": return Xs(e, t, n);
		case "texture": return Zs(e, t, n);
		case "sampler": return nc(e, t);
		case "storageTexture": return Qs(e, t);
		case "externalTexture": throw P(e, "external texture", "Pass a compatible GPUExternalTexture.");
		default: throw P(e, "reflected resource", "Fix shader reflection bindingLayout.");
	}
}
function Xs(e, t, n) {
	let r = ii(t);
	if (r) return r[ai](e, n.sourceHint);
	if (t instanceof D) return Zr(t, `${n.sourceHint}.set`), ic(e, t.options.usage), {
		resource: { buffer: t.gpu },
		identity: t.resourceIdentity,
		unsubscribe: (e) => t.onDestroy(e)
	};
	if (dc(t)) return Zr(t.buffer, `${n.sourceHint}.set`), {
		resource: {
			buffer: t.gpu,
			offset: 0,
			size: t.size
		},
		identity: t.buffer.resourceIdentity,
		unsubscribe: (e) => t.buffer.onDestroy(e)
	};
	if (pc(t)) return {
		resource: t,
		identity: uc(t.buffer)
	};
	if (mc(t)) return {
		resource: { buffer: t },
		identity: uc(t)
	};
	throw P(e, "buffer", `Pass a compatible Buffer/Uniform: ${e.name}.set({ ${e.name}: gpu.device.createBuffer(...) }).`);
}
function Zs(e, t, n) {
	let r = e.bindingLayout?.kind === "texture" && e.bindingLayout.texture.sampleType === "depth", i = cc(t);
	if (i) {
		if (r && !i.depth) throw P(e, "a target with a depth attachment", `Create it with target(gpu, { size, depth: true }) or bind a Texture: set({ ${e.name}: scene.depth }).`);
		let t = r ? i.depth : i.color;
		oc(e, t, n);
		let a = i.onTexturesRecreated?.bind(i);
		return {
			resourceLabel: t.label,
			resource: t.createView(sc(t)),
			identity: t.resourceIdentity,
			unsubscribe: (e) => {
				let n = i.onDestroy(e), r = t.onDestroy(e);
				return () => {
					n(), r();
				};
			},
			onRecreate: a ? (e) => a(e) : void 0
		};
	}
	if (t instanceof O) return ac(e, t.usage), oc(e, t, n), {
		resourceLabel: t.label,
		resource: t.createView(sc(t)),
		identity: t.resourceIdentity,
		unsubscribe: (e) => t.onDestroy(e)
	};
	if (fc(t)) return {
		resource: t.createView(),
		identity: t.resourceIdentity ?? uc(t)
	};
	if (typeof t == "object" && t) return {
		resource: t,
		identity: uc(t)
	};
	throw P(e, "texture/target", `Pass a Texture or Target: ${e.name}.set({ ${e.name}: scene.color }) or set({ ${e.name}: scene }).`);
}
function Qs(e, t) {
	let n = e.bindingLayout?.kind === "storageTexture" ? e.bindingLayout.storageTexture : void 0, r = {
		format: n?.format,
		viewDimension: n?.viewDimension ?? "2d"
	}, i = `texture(gpu, { kind: "${r.viewDimension}", size${r.viewDimension === "2d-array" ? ", layers" : ""}, format: "${r.format ?? "rgba8unorm"}", usage: ["storage_binding"] })`;
	if (cc(t)) throw P(e, "a storage texture, not a Target", `Render targets are not storage textures. Create one with ${i} and set({ ${e.name}: texture }).`);
	if (t instanceof O) return $s(e, t, r, i), {
		resourceLabel: t.label,
		resource: t.createView(ec(r.viewDimension)),
		identity: t.resourceIdentity,
		unsubscribe: (e) => t.onDestroy(e)
	};
	if (fc(t)) return {
		resource: t.createView(ec(r.viewDimension)),
		identity: t.resourceIdentity ?? uc(t)
	};
	if (typeof t == "object" && t) return {
		resource: t,
		identity: uc(t)
	};
	throw P(e, "a storage texture", `Pass a Texture from ${i}: set({ ${e.name}: texture }).`);
}
function $s(e, t, n, r) {
	let i = t.label ?? "texture";
	if (!t.usage.includes("storage_binding")) throw P(e, "a texture with storage_binding usage", `Create it with ${r}; include texture_binding too if you also sample it.`);
	if (n.format && t.format !== n.format) throw P(e, `format ${n.format}`, `Texture '${i}' is ${t.format}. Create it with ${r} or declare texture_storage_${n.viewDimension.replace("-", "_")}<${t.format}, ...> in WGSL.`);
	let a = tc(n.viewDimension);
	if (a && t.dimension !== a) throw P(e, `dimension "${a}"`, `Texture '${i}' has kind "${t.kind}". Create it with ${r}.`);
}
function ec(e) {
	return {
		dimension: e,
		baseMipLevel: 0,
		mipLevelCount: 1
	};
}
function tc(e) {
	switch (e) {
		case "1d": return "1d";
		case "2d":
		case "2d-array": return "2d";
		case "3d": return "3d";
		default: return;
	}
}
function nc(e, t) {
	if (rc(t)) return {
		resource: t,
		identity: uc(t)
	};
	throw P(e, "sampler", `Use the cached sampler: set({ ${e.name}: sampler(gpu) }).`);
}
function rc(e) {
	return typeof e != "object" || !e || e instanceof D || e instanceof O ? !1 : !mc(e) && !pc(e) && !fc(e) && !cc(e);
}
function ic(e, t) {
	let n = e.bindingLayout?.kind === "buffer" ? e.bindingLayout.buffer.type : void 0;
	if (n === "uniform" && !t.includes("uniform")) throw P(e, "uniform buffer", "Create with usage: ['uniform','copy_dst'].");
	if ((n === "storage" || n === "read-only-storage") && !t.includes("storage")) throw P(e, "storage buffer", "Create with usage: ['storage','copy_dst'].");
}
function ac(e, t) {
	if (!t.includes("texture_binding") && !t.includes("render_attachment")) throw P(e, "sampled texture", "Use texture_binding usage or a sampleable Target.");
}
function oc(e, t, n) {
	if (n.filterableTexture && !n.float32Filterable && (t.format === "r32float" || t.format === "rg32float" || t.format === "rgba32float")) throw yn(n.sourceHint, e, t.format, t.label ?? "texture", n.pairedSampler);
}
function sc(e) {
	return e.format.includes("stencil") ? { aspect: "depth-only" } : void 0;
}
function cc(e) {
	if (typeof e != "object" || !e) return;
	let t = e;
	if (t.resourceIdentity && t.color && typeof t.onDestroy == "function") return t;
}
function lc(e) {
	let t = e;
	return "gpu" in t || "bindGroup" in t || "createView" in t || "resourceIdentity" in t;
}
function uc(e) {
	if (typeof e != "object" || !e) return `value:${String(e)}`;
	let t = gc.get(e);
	return t || (t = {
		kind: "external",
		id: hc++
	}, gc.set(e, t)), t;
}
function dc(e) {
	return typeof e == "object" && !!e && "gpu" in e && "size" in e && "buffer" in e && e.buffer instanceof D;
}
function fc(e) {
	return typeof e == "object" && !!e && typeof e.createView == "function";
}
function pc(e) {
	return typeof e == "object" && !!e && "buffer" in e && mc(e.buffer);
}
function mc(e) {
	return typeof e == "object" && !!e && "size" in e && "usage" in e && typeof e.destroy == "function";
}
var hc, gc, _c = t((() => {
	k(), L(), Qr(), si(), hc = 1, gc = /* @__PURE__ */ new WeakMap();
}));
//#endregion
//#region node_modules/vgpu/dist/set-packing.js
function vc(e, t) {
	yc(e), Oc(e, t, "$", 0, e.size);
	let n = new ArrayBuffer(e.size);
	return bc(new DataView(n), e, 0, t), n;
}
function yc(e) {
	if (e.size === void 0) throw F("set", `No se puede inferir byteLength para layout runtime-sized '${e.name}'.`);
}
function bc(e, t, n, r) {
	if (t.members) return xc(e, t.members, n, r);
	Sc(e, t, n, r);
}
function xc(e, t, n, r) {
	let i = r;
	for (let r of t) bc(e, r.layout, n + r.offset, i?.[r.name]);
}
function Sc(e, t, n, r) {
	switch (t.type.kind) {
		case "scalar": return Cc(e, n, t.type.name, r);
		case "atomic": return wc(e, n, t.type, r);
		case "vector": return Tc(e, n, t.type, r);
		case "matrix": return Ec(e, t, n, r);
		case "array": return Dc(e, t, n, r);
		default: throw F("set", `No hay writer para layout ${t.type.kind}.`);
	}
}
function Cc(e, t, n, r) {
	n === "f32" ? e.setFloat32(t, r, !0) : n === "i32" ? e.setInt32(t, r, !0) : n === "u32" || n === "bool" ? e.setUint32(t, n === "bool" ? +!!r : r, !0) : e.setUint16(t, Hc(r), !0);
}
function wc(e, t, n, r) {
	Cc(e, t, Vc(n.element), r);
}
function Tc(e, t, n, r) {
	let i = r, a = Bc(n.element);
	for (let r = 0; r < n.width; r++) Cc(e, t + r * a, Vc(n.element), i?.[r] ?? 0);
}
function Ec(e, t, n, r) {
	let i = t.type, a = r, o = Bc(i.element), s = t.stride ?? 16;
	for (let t = 0; t < i.columns; t++) for (let r = 0; r < i.rows; r++) Cc(e, n + t * s + r * o, Vc(i.element), a?.[t * i.rows + r] ?? 0);
}
function Dc(e, t, n, r) {
	let i = r, a = t.stride ?? t.element?.size ?? 0;
	if (!t.element) throw F("set", "Array layout sin element layout.");
	for (let r = 0; r < i.length; r++) bc(e, t.element, n + r * a, i[r]);
}
function Oc(e, t, n, r, i) {
	if (e.members) {
		kc(e.members, t, n, r, i);
		return;
	}
	switch (e.type.kind) {
		case "scalar":
			Nc(e.type.name, t, n), Ic(n, r, Bc(e.type), i);
			return;
		case "atomic":
			Nc(Vc(e.type.element), t, n), Ic(n, r, 4, i);
			return;
		case "vector":
			Ac(e.type, t, n, r, i);
			return;
		case "matrix":
			jc(e, t, n, r, i);
			return;
		case "array":
			Mc(e, t, n, r, i);
			return;
		default: throw F("set", `No hay validator para layout ${e.type.kind}.`);
	}
}
function kc(e, t, n, r, i) {
	Rc(t) || J("type", n, "an object", zc(t));
	let a = new Set(e.map((e) => e.name)), o = Object.keys(t).find((e) => !a.has(e));
	o !== void 0 && J("unknown-field", `${n}.${o}`, "a declared field", o);
	for (let a of e) {
		let e = `${n}.${a.name}`;
		Object.hasOwn(t, a.name) || J("missing-field", e, "a required field", "missing"), Oc(a.layout, t[a.name], e, r + a.offset, i);
	}
}
function Ac(e, t, n, r, i) {
	let a = Pc(t, n, e.width), o = Vc(e.element), s = Bc(e.element);
	for (let t = 0; t < e.width; t++) Nc(o, a[t], `${n}[${t}]`), Ic(`${n}[${t}]`, r + t * s, s, i);
}
function jc(e, t, n, r, i) {
	let a = e.type, o = Pc(t, n, a.columns * a.rows), s = Vc(a.element), c = Bc(a.element), l = e.stride;
	if (l === void 0) throw F("set", `Matrix layout '${e.name}' sin stride.`);
	for (let e = 0; e < a.columns; e++) for (let t = 0; t < a.rows; t++) {
		let u = e * a.rows + t, d = `${n}[${e}][${t}]`;
		Nc(s, o[u], d), Ic(d, r + e * l + t * c, c, i);
	}
}
function Mc(e, t, n, r, i) {
	let a = Fc(t, n), o = e.type;
	o.count !== void 0 && a.length !== o.count && J("shape", n, o.count, a.length);
	let s = e.stride;
	if (s === void 0 || !e.element) throw F("set", `Array layout '${e.name}' sin stride o element layout.`);
	if (e.runtimeSized) {
		let t = Lc(s, a.length, n), o = e.size ?? i - r;
		o !== t && J("extent", n, t, o);
	}
	for (let t = 0; t < a.length; t++) Oc(e.element, a[t], `${n}[${t}]`, r + t * s, i);
}
function Nc(e, t, n) {
	if (e === "bool") {
		typeof t != "boolean" && J("type", n, "bool", zc(t), e);
		return;
	}
	typeof t != "number" && J("type", n, e, zc(t), e), e === "i32" && (!Number.isInteger(t) || t < -2147483648 || t > 2147483647) && J("integer-range", n, "an integer in [-2147483648, 2147483647]", String(t), e), e === "u32" && (!Number.isInteger(t) || t < 0 || t > 4294967295) && J("integer-range", n, "an integer in [0, 4294967295]", String(t), e);
}
function Pc(e, t, n) {
	let r = Fc(e, t);
	return r.length !== n && J("shape", t, n, r.length), r;
}
function Fc(e, t) {
	if (Array.isArray(e) || ArrayBuffer.isView(e) && !(e instanceof DataView) && "length" in e) return e;
	J("type", t, "an array or typed array", zc(e));
}
function Ic(e, t, n, r) {
	(!Number.isSafeInteger(t) || !Number.isSafeInteger(n) || t < 0 || n < 0 || t > r - n) && J("buffer-range", e, `${n} bytes inside ${r}`, t);
}
function Lc(e, t, n) {
	let r = e * t;
	return (!Number.isSafeInteger(e) || e < 0 || !Number.isSafeInteger(r)) && J("extent", n, "a safe byte extent", String(r)), r;
}
function J(e, t, n, r, i) {
	let a = e === "shape" ? `expected exactly ${n} values, received ${r}` : e === "missing-field" ? "required field is missing" : e === "unknown-field" ? `field '${r}' is not declared by the layout` : e === "integer-range" ? `${r} is outside the exact ${i} range` : e === "extent" ? `runtime extent requires ${n} bytes, received ${r}` : e === "buffer-range" ? `write at byte ${r} exceeds ${n}` : `expected ${n}, received ${r}`;
	throw Nr(i === void 0 ? {
		reason: e,
		path: t,
		expected: n,
		actual: r
	} : {
		reason: e,
		path: t,
		expected: n,
		actual: r,
		type: i
	}, a);
}
function Rc(e) {
	if (typeof e != "object" || !e || Array.isArray(e) || ArrayBuffer.isView(e)) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
function zc(e) {
	return e === null ? "null" : Array.isArray(e) ? "array" : ArrayBuffer.isView(e) ? e.constructor.name : typeof e;
}
function Bc(e) {
	return Vc(e) === "f16" ? 2 : 4;
}
function Vc(e) {
	if (e.kind !== "scalar") throw F("set", `Expected scalar, got ${e.kind}`);
	return e.name;
}
function Hc(e) {
	let t = /* @__PURE__ */ new Float32Array(1), n = new Uint32Array(t.buffer);
	t[0] = e;
	let r = n[0], i = r >> 16 & 32768, a = r & 8388607, o = r >> 23 & 255;
	if (o === 255) return i | (a ? 32256 : 31744);
	let s = o - 127 + 15;
	if (s >= 31) return i | 31744;
	if (s <= 0) return s < -10 ? i : i | Uc(a | 8388608, 14 - s);
	let c = Uc(a, 13);
	if (c === 1024) {
		let e = s + 1;
		return e >= 31 ? i | 31744 : i | e << 10;
	}
	return i | s << 10 | c;
}
function Uc(e, t) {
	let n = e >>> t, r = e & (1 << t) - 1, i = 1 << t - 1;
	return r > i || r === i && (n & 1) == 1 ? n + 1 : n;
}
var Wc = t((() => {
	L();
}));
//#endregion
//#region node_modules/vgpu/dist/set-layouts.js
function Gc(e, t) {
	let n = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), a = new Set(e.filter((e) => e.bindingLayout?.kind === "texture" && e.bindingLayout.texture.sampleType === "depth").map((e) => `${e.group}:${e.binding}`));
	for (let e of t) {
		let t = e.stage === "vertex" ? 1 : e.stage === "fragment" ? 2 : 4;
		for (let r of ks(e, "bindings", "visibility")) {
			let e = `${r.group}:${r.binding}`;
			n.set(e, (n.get(e) ?? 0) | t);
		}
		for (let t of ks(e, "samplingPairs", "visibility")) {
			if (t.mode !== "filtering") continue;
			let e = `${t.texture.group}:${t.texture.binding}`;
			a.has(e) ? i.add(`${t.sampler.group}:${t.sampler.binding}`) : r.add(e);
		}
	}
	let o = (e) => n.get(`${e.group}:${e.binding}`) ?? 0;
	return Object.defineProperty(o, "filterable", { value: r }), Object.defineProperty(o, "nonFilteringSamplers", { value: i }), o;
}
function Kc(e, t, n = tl) {
	return e.flatMap((e) => {
		if (e.group !== t) return [];
		let r = n(e), i = `${e.group}:${e.binding}`;
		return r === 0 ? [] : [{
			binding: e.binding,
			visibility: r,
			...$c(e, n.filterable?.has(i) ?? !1, n.nonFilteringSamplers?.has(i) ?? !1)
		}];
	});
}
function qc(e, t, n, r = tl) {
	let i = /* @__PURE__ */ new Map(), a = n.bindings.filter((e) => r(e) !== 0).map((e) => e.group), o = Math.max(-1, ...a);
	for (let a = 0; a <= o; a++) i.set(a, Yc(e, t, n, a, r));
	return i;
}
function Jc(e, t) {
	return e.gpu.createPipelineLayout({ bindGroupLayouts: Zc(t) });
}
function Yc(e, t, n, r, i = tl) {
	return Xc(e, `${t}.group${r}.bgl`, Kc(n.bindings, r, i));
}
function Xc(e, t, n) {
	let r = nl.get(e.gpu);
	r || (r = /* @__PURE__ */ new Map(), nl.set(e.gpu, r));
	let i = JSON.stringify(n), a = r.get(i);
	if (a) return a;
	let o = Vt(e.gpu.createBindGroupLayout({
		label: t,
		entries: n
	}), { entries: n });
	return r.set(i, o), o;
}
function Zc(e) {
	let t = Math.max(-1, ...e.keys()), n = [];
	for (let r = 0; r <= t; r++) n.push(Qc(e, r));
	return n;
}
function Qc(e, t) {
	let n = e.get(t);
	if (!n) throw F("pipelineLayout", `Bind groups must be contiguous for pipeline layout; missing group(${t}).`);
	return n;
}
function $c(e, t, n) {
	let r = e.bindingLayout;
	if (!r) throw F("bindGroupLayout", `Binding '${e.name}' does not have a reflected bindingLayout.`);
	return t && r.kind === "texture" && r.texture.sampleType === "unfilterable-float" && !r.texture.multisampled ? { texture: {
		...r.texture,
		sampleType: "float"
	} } : n && r.kind === "sampler" && r.sampler.type === "filtering" ? { sampler: { type: "non-filtering" } } : el(r);
}
function el(e) {
	switch (e.kind) {
		case "buffer": return { buffer: { ...e.buffer } };
		case "sampler": return { sampler: { ...e.sampler } };
		case "texture": return { texture: { ...e.texture } };
		case "storageTexture": return { storageTexture: { ...e.storageTexture } };
		case "externalTexture": return { externalTexture: {} };
	}
}
function tl(e) {
	let t = globalThis.GPUShaderStage, n = t?.VERTEX ?? 1, r = t?.FRAGMENT ?? 2, i = t?.COMPUTE ?? 4;
	return e.kind === "buffer" ? n | r | i : r | i;
}
var nl, rl = t((() => {
	k(), As(), L(), nl = /* @__PURE__ */ new WeakMap();
}));
//#endregion
//#region node_modules/vgpu/dist/set-core.js
function il(e) {
	let t = al(e.reflection), n = [...e.bindGroupLayouts.keys()].sort((e, t) => e - t), r = /* @__PURE__ */ new Map();
	function i(e) {
		let t = [];
		for (let [n, r] of Object.entries(e)) t.push(...o(n, r));
		return t;
	}
	function a(t) {
		let n = e.bindGroupLayouts.get(t.info.group);
		return !!n && !!Ht(n)?.entries.some((e) => e.binding === t.info.binding);
	}
	function o(n, r) {
		let i = t.get(n);
		if (i) return s(i, n, r);
		let a = ol(n, t, e.label);
		if (!a) throw F(`${e.label}.set`, `Binding '${n}' does not exist in '${e.label}'.`);
		return c(a, n, r);
	}
	function s(e, t, n) {
		C(e.info.group);
		let r = sl(e.info, n);
		cl(e, t, r);
		let i = hl(e.identity);
		return r === "lib" ? l(e, gl(e.libValue, n)) : d(e, n), e.ownership ??= r, a(e) ? ml(e, i) : [];
	}
	function c(t, n, r) {
		C(t.info.group);
		let i = sl(t.info, r);
		if (cl(t, n, i), ll(t, n, i), i !== "lib") throw F(`${e.label}.set`, `Member '${n}' needs a JS value; set resource '${t.info.name}' instead.`);
		let o = hl(t.identity);
		return l(t, {
			..._l(t.libValue ?? vl(te(t))),
			[n]: r
		}), t.ownership ??= i, t.memberOwnership.set(n, i), a(t) ? ml(t, o) : [];
	}
	function l(e, t) {
		let n = te(e), r = vc(n, t);
		e.libValue = t, e.buffer || w(e, n.size), e.bytes = r, e.buffer.write(r, 0);
	}
	function u(t) {
		let n = Ht(e.bindGroupLayouts.get(t.group))?.entries.find((e) => e.binding === t.binding), r = e.reflection.entryPoints.flatMap((t) => ks(t, "samplingPairs", e.label)).find((e) => e.mode === "filtering" && e.texture.group === t.group && e.texture.binding === t.binding), i = r && e.reflection.bindings.find((e) => e.group === r.sampler.group && e.binding === r.sampler.binding);
		return {
			sourceHint: e.label,
			filterableTexture: n?.texture?.sampleType === "float",
			float32Filterable: e.device.features.has("float32-filterable"),
			pairedSampler: i
		};
	}
	function d(e, t) {
		let n = Js(e.info, t, u(e.info));
		e.unsubscribe?.(), e.unsubscribeRecreate?.(), e.resource = n.resource, e.identity = n.identity, e.destroyed = !1, e.resourceLabel = n.resourceLabel, e.subscribeDestroy = n.unsubscribe, e.unsubscribe = n.unsubscribe?.(() => m(e)), e.unsubscribeRecreate = n.onRecreate?.(() => f(e, t));
	}
	function f(t, n) {
		let r = hl(t.identity);
		if (t.identity && e.cache.evictIdentity(t.identity), d(t, n), a(t)) for (let n of ml(t, r)) e.onIdentityChange?.(n);
	}
	function p(t, n, i) {
		_(t), ul(e.label, t, n, i);
		let a = r.has(t) ? `claimed-group:${t}` : void 0;
		return r.set(t, n), a;
	}
	function m(t) {
		t.destroyed || (t.destroyed = !0, t.identity && e.cache.evictIdentity(t.identity), a(t) && !r.has(t.info.group) && e.onIdentityChange?.({
			group: t.info.group,
			binding: t.info.binding,
			bindingName: t.info.name,
			bindingKind: t.info.kind,
			previousIdentity: hl(t.identity),
			newIdentity: `destroyed:${hl(t.identity)}`
		}));
	}
	function h() {
		for (let n of t.values()) if (n.destroyed && a(n) && !r.has(n.info.group)) throw _n(e.label, n.info, n.resourceLabel);
	}
	function g(e) {
		h();
		let n = [];
		for (let i of t.values()) {
			if (!a(i) || r.has(i.info.group) || !i.subscribeDestroy) continue;
			let t = hl(i.identity), { group: o, binding: s, name: c, kind: l } = i.info;
			n.push(i.subscribeDestroy(() => e({
				group: o,
				binding: s,
				bindingName: c,
				bindingKind: l,
				previousIdentity: t,
				newIdentity: `destroyed:${t}`
			})));
		}
		return () => {
			for (let e of n.splice(0)) e();
		};
	}
	function _(t) {
		let n = e.bindGroupLayouts.get(t);
		if (!n) throw F(`${e.label}.layout`, `@group(${t}) does not exist in '${e.label}'.`);
		return n;
	}
	function v() {
		return h(), n.map(y);
	}
	function y(t) {
		let n = r.get(t);
		if (n) return {
			group: t,
			bindGroup: n,
			offsets: [],
			claimValidation: ee(n, t)
		};
		let i = new Set(Ht(_(t))?.entries.map((e) => e.binding)), a = e.reflection.bindings.filter((e) => e.group === t && i.has(e.binding)), o = b(a), s = x(a);
		return {
			group: t,
			bindGroup: e.cache.getOrCreate(e.drawId, t, s, () => e.device.gpu.createBindGroup({
				label: `${e.label}.group${t}`,
				layout: _(t),
				entries: o
			})),
			offsets: []
		};
	}
	function ee(t, n) {
		return Wt(t) ? void 0 : {
			label: e.label,
			group: n
		};
	}
	function b(e) {
		return e.map((e) => {
			let t = S(e);
			return {
				binding: e.binding,
				resource: t.resource
			};
		});
	}
	function x(e) {
		return e.map((e) => S(e).identity);
	}
	function S(n) {
		let r = t.get(n.name);
		if (!r?.resource || !r.identity) throw bn(e.label, n);
		return r;
	}
	function C(t) {
		if (r.has(t)) throw Sn(e.label, t);
	}
	function w(t, n) {
		t.buffer = e.device.createBuffer({
			size: n,
			usage: ["uniform", "copy_dst"],
			label: `${e.label}.${t.info.name}`
		}), t.resource = {
			buffer: t.buffer.gpu,
			offset: 0,
			size: n
		}, t.identity = t.buffer.resourceIdentity, t.unsubscribe = t.buffer.onDestroy(() => e.cache.evictIdentity(t.buffer.resourceIdentity));
	}
	function te(t) {
		if (t.info.kind !== "buffer" || !t.info.layout?.size) throw F(`${e.label}.set`, `Binding '${t.info.name}' needs a compatible resource, not JS.`);
		return t.info.layout;
	}
	return {
		assertUsable: h,
		watchResources: g,
		get groups() {
			return n;
		},
		set: i,
		claimGroup: p,
		layout: _,
		bindGroups: v,
		bindingState(e) {
			let n = t.get(e);
			if (n?.ownership && n.resource && n.identity) return {
				info: n.info,
				ownership: n.ownership,
				resource: n.resource,
				identity: n.identity
			};
		}
	};
}
function al(e) {
	return new Map(e.bindings.map((e) => [e.name, {
		info: e,
		memberOwnership: /* @__PURE__ */ new Map()
	}]));
}
function ol(e, t, n) {
	let r;
	for (let i of t.values()) if (i.info.layout?.members?.some((t) => t.name === e)) {
		if (r) throw F(`${n}.set`, `Binding member '${e}' is ambiguous in '${n}'; set the complete binding.`);
		r = i;
	}
	return r;
}
function sl(e, t) {
	return e.bindingLayout?.kind === "buffer" && Ks(t) ? "lib" : "user";
}
function cl(e, t, n) {
	if (e.ownership && e.ownership !== n) throw xn(t, e.ownership);
}
function ll(e, t, n) {
	let r = e.memberOwnership.get(t);
	if (r && r !== n) throw xn(t, r);
}
function ul(e, t, n, r) {
	let i = Wt(n);
	if (!i) return;
	let a = Ht(r);
	if (!a) return;
	let o = dl(a.entries, i.layout.entries);
	if (o) throw Cn(e, t, o);
}
function dl(e, t) {
	if (e.length !== t.length) return `expected ${e.length} bindings and received ${t.length}`;
	let n = fl(e), r = fl(t);
	for (let [e, t] of n) {
		let n = r.get(e);
		if (!n) return `missing @binding(${e})`;
		if (pl(t) !== pl(n)) return `@binding(${e}) does not match the reflected layout`;
	}
}
function fl(e) {
	return new Map(e.map((e) => [e.binding, e]));
}
function pl(e) {
	return JSON.stringify({
		binding: e.binding,
		visibility: e.visibility,
		buffer: e.buffer,
		sampler: e.sampler,
		texture: e.texture,
		storageTexture: e.storageTexture,
		externalTexture: e.externalTexture ? {} : void 0
	});
}
function ml(e, t) {
	let n = hl(e.identity);
	return !n || t === n ? [] : [{
		group: e.info.group,
		binding: e.info.binding,
		bindingName: e.info.name,
		bindingKind: e.info.kind,
		previousIdentity: t,
		newIdentity: n
	}];
}
function hl(e) {
	return e === void 0 ? void 0 : Ds(e);
}
function gl(e, t) {
	return qs(e) && qs(t) ? {
		...e,
		...t
	} : t;
}
function _l(e) {
	return qs(e) ? e : {};
}
function vl(e) {
	if (e.members) return Object.fromEntries(e.members.map((e) => [e.name, vl(e.layout)]));
	switch (e.type.kind) {
		case "scalar":
		case "atomic": return 0;
		case "vector": return Array.from({ length: e.type.width }, () => 0);
		case "matrix": return Array.from({ length: e.type.columns * e.type.rows }, () => 0);
		case "array": {
			let t = e.element;
			return e.type.count === void 0 || !t ? [] : Array.from({ length: e.type.count }, () => vl(t));
		}
		default: return;
	}
}
var yl = t((() => {
	k(), Os(), As(), L(), _c(), Wc(), rl();
}));
//#endregion
//#region node_modules/vgpu/dist/target-utils.js
function bl(e, t) {
	let n = e, r = Array.isArray(e) ? e : [
		n?.r,
		n?.g,
		n?.b,
		n?.a
	];
	if (r.length !== 4 || !r.every((e) => typeof e == "number" && Number.isFinite(e))) throw Er(t);
	return xl(e);
}
function xl(e) {
	let t = e;
	return Array.isArray(e) ? [
		e[0],
		e[1],
		e[2],
		e[3]
	] : {
		r: t.r,
		g: t.g,
		b: t.b,
		a: t.a
	};
}
function Sl(e) {
	return e.colors ?? [{ format: e.format ?? "rgba8unorm" }];
}
function Cl(e) {
	return e.depth === !0 ? "depth24plus" : e.depth || void 0;
}
function wl(e) {
	let t = e.msaa;
	if (t === !0 || t === 4) return 4;
	if (t === void 0 || t === !1) return 1;
	let n = yr();
	throw n.code = "VGPU-TARGET-MSAA-INVALID", n.message = `msaa received ${t}; WebGPU 1|4; use true`, n;
}
function Tl(e, t) {
	if (!Array.isArray(e?.size) || e.size.length !== 2 || !Array.from(e.size).every((e) => Number.isSafeInteger(e) && e > 0)) throw yr();
	let n = Cl(e);
	if (n === "stencil8") throw vr(n);
	if (wl(e) === 4) for (let n of Sl(e)) El(n.format, t);
}
function El(e, t) {
	if (t.isCompatibilityMode && e === "rgba16float") throw F("target", "Dawn compatibility mode does not support rgba16float+msaa.", "Use rgba8unorm for MSAA here, or disable msaa.");
}
function Dl(e, t, n, r) {
	let i = {
		view: (t ?? e).createView(),
		resolveTarget: t ? e.createView() : void 0,
		loadOp: r ? "load" : "clear",
		storeOp: t ? "discard" : "store"
	};
	return r || (i.clearValue = Al(n)), i;
}
function Ol(e, t, n, r, i) {
	if (i) {
		let t = {
			view: e.createView(),
			depthReadOnly: !0
		};
		return kl(e.format) && (t.stencilReadOnly = !0), t;
	}
	let a = {
		view: e.createView(),
		depthLoadOp: t ? "load" : "clear",
		depthStoreOp: e.sampleCount > 1 ? "discard" : "store"
	};
	return t || (a.depthClearValue = n ?? 1), e.format && kl(e.format) && (a.stencilLoadOp = t ? "load" : "clear", a.stencilStoreOp = e.sampleCount > 1 ? "discard" : "store", t || (a.stencilClearValue = r ?? 0)), a;
}
function kl(e) {
	return !!e && e.includes("stencil");
}
function Al(e) {
	return Array.isArray(e) ? {
		r: e[0],
		g: e[1],
		b: e[2],
		a: e[3]
	} : e;
}
function jl(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}
function Ml(e) {
	return typeof e == "object" && !!e && typeof e.renderPassDescriptor == "function";
}
var Nl, Pl = t((() => {
	L(), Nl = Object.freeze([
		0,
		0,
		0,
		1
	]);
}));
//#endregion
//#region node_modules/vgpu/dist/pipeline-store.js
function Fl(e) {
	return Ml(e) ? {
		colors: e.colors.map((e) => e.format),
		depth: e.depth?.format,
		sampleCount: e.sampleCount
	} : typeof e != "object" || !e ? { colors: [] } : {
		colors: Array.isArray(e.colors) ? [...e.colors] : e.colors ?? [],
		depth: e.depth,
		sampleCount: e.sampleCount ?? 1
	};
}
function Il(e) {
	return `${e.colors.join(",")}:${e.depth ?? "none"}:${e.sampleCount ?? 1}`;
}
function Ll(e, t) {
	if (!Array.isArray(e.colors) || e.colors.length === 0) throw _r(t, "colors must be a non-empty array.");
	let n = e.colors.find((e) => typeof e != "string" || e.length === 0);
	if (n !== void 0) throw _r(t, `colors must contain only GPUTextureFormat strings; received ${String(n)}.`);
	if (e.depth !== void 0 && (typeof e.depth != "string" || e.depth.length === 0)) throw _r(t, "depth must be a GPUTextureFormat string.");
	let r = e.sampleCount ?? 1;
	if (r !== 1 && r !== 4) throw _r(t, `sampleCount must be 1 or 4; received ${String(r)}.`);
}
function Rl(e) {
	let t = `${Xl(iu, e.module, () => nu++)}|${Xl(au, e.pipelineLayout, () => ru++)}|${Zl(e.vertexBufferLayouts ?? [])}|${Il(e.signature)}`, n = e.topology || e.stripIndexFormat ? `${t}|${e.topology ?? "triangle-list"}|${e.stripIndexFormat ?? "none"}` : t, r = e.cullMode || e.frontFace ? `${n}|${e.cullMode ?? "none"}|${e.frontFace ?? "ccw"}` : n, i = e.unclippedDepth ? `${r}|unclipped` : r, a = e.depthKey ? `${i}|${e.depthKey}` : i, o = e.stencilKey ? `${a}|${e.stencilKey}` : a, s = e.multisampleKey ? `${o}|${e.multisampleKey}` : o, c = e.constantsKey ? `${s}|${e.constantsKey}` : s, l = e.entryKey ? `${c}|${e.entryKey}` : c;
	return e.fragmentKey ? `${l}|${e.fragmentKey}` : l;
}
function zl(e, t, n, r, i) {
	if (r === void 0) return t.find((e) => e.stage === n);
	if (typeof r != "string") throw Ln(e, `${n} received ${Gl(r)}; expected an entry point name string.`, i);
	let a = t.find((e) => e.name === r);
	if (!a) throw Ln(e, `"${r}" matches no entry point in the shader; available entry points: ${Bl(t)}.`, i);
	if (a.stage !== n) throw Ln(e, `"${r}" is a @${a.stage} entry point, not @${n}; available entry points: ${Bl(t)}.`, i);
	return a;
}
function Bl(e) {
	return e.length ? e.map((e) => `"${e.name}" (@${e.stage})`).join(", ") : "none";
}
function Vl(e, t, n, r) {
	if (t !== void 0 && (typeof t != "object" || !t || Array.isArray(t))) throw In(e, `received ${Gl(t)}; expected { overrideNameOrId: number | boolean }.`, r);
	let i = new Map(n.map((e) => [Hl(e), e])), a = {};
	for (let [o, s] of Object.entries(t ?? {})) {
		if (!i.has(o)) throw In(e, `"${o}" matches no override in the shader; available overrides: ${Ul(n)}.`, r);
		if (typeof s == "boolean") {
			a[o] = +!!s;
			continue;
		}
		if (typeof s != "number" || !Number.isFinite(s)) throw In(e, `"${o}" received ${Gl(s)}; use a finite number or a boolean (WebGPU converts the value to the override's WGSL type, and NaN/Infinity fail that conversion).`, r);
		a[o] = s;
	}
	for (let t of n) {
		let n = Hl(t);
		if (t.defaultValue === void 0 && !(n in a)) throw In(e, `override '${t.name}' has no default value and must be provided; add constants: { "${n}": value }.`, r);
	}
	return Object.keys(a).length === 0 ? {} : {
		constants: a,
		constantsKey: Wl(a)
	};
}
function Hl(e) {
	return e.id === void 0 ? e.name : String(e.id);
}
function Ul(e) {
	return e.length ? e.map((e) => e.id === void 0 ? `"${e.name}"` : `"${e.id}" (@id of ${e.name})`).join(", ") : "none";
}
function Wl(e) {
	return `cn~${Object.entries(e).sort(([e], [t]) => e < t ? -1 : +(e > t)).map(([e, t]) => `${e}=${t}`).join("~")}`;
}
function Gl(e) {
	if (typeof e == "string") return `"${e}"`;
	try {
		return JSON.stringify(e) ?? String(e);
	} catch {
		return String(e);
	}
}
function Kl(e) {
	let t = /* @__PURE__ */ new Map();
	return {
		get(n, r) {
			let i = t.get(n);
			return i || (i = e.gpu.createShaderModule({
				label: r,
				code: n
			}), t.set(n, i)), i;
		},
		dispose() {
			t.clear();
		}
	};
}
function ql(e) {
	let t = /* @__PURE__ */ new Map();
	return {
		get(n) {
			let r = Ql(n), i = t.get(r);
			return i || (i = e.gpu.createPipelineLayout({ bindGroupLayouts: $l(n) }), t.set(r, i)), i;
		},
		dispose() {
			t.clear();
		}
	};
}
function Jl(e, t = {}) {
	return new ou(e, t);
}
function Yl() {
	let e, t, n = new Promise((n, r) => {
		e = n, t = r;
	});
	return n.catch(() => void 0), {
		promise: n,
		resolve: e,
		reject: t
	};
}
function Xl(e, t, n) {
	let r = e.get(t);
	return r || (r = n(), e.set(t, r)), r;
}
function Zl(e) {
	return JSON.stringify(e.map((e) => ({
		arrayStride: e.arrayStride,
		stepMode: e.stepMode ?? "vertex",
		attributes: [...e.attributes].map((e) => ({
			shaderLocation: e.shaderLocation,
			offset: e.offset,
			format: e.format
		}))
	})));
}
function Ql(e) {
	return JSON.stringify([...e.entries()].map(([e, t]) => ({
		group: e,
		entries: tu(t)
	})));
}
function $l(e) {
	let t = Math.max(-1, ...e.keys()), n = [];
	for (let r = 0; r <= t; r++) n.push(eu(e, r));
	return n;
}
function eu(e, t) {
	let n = e.get(t);
	if (!n) throw mr(t);
	return n;
}
function tu(e) {
	return (Ht(e)?.entries ?? []).map((e) => ({
		binding: e.binding,
		visibility: e.visibility,
		buffer: e.buffer ? { ...e.buffer } : void 0,
		sampler: e.sampler ? { ...e.sampler } : void 0,
		texture: e.texture ? { ...e.texture } : void 0,
		storageTexture: e.storageTexture ? { ...e.storageTexture } : void 0,
		externalTexture: e.externalTexture ? { ...e.externalTexture } : void 0
	}));
}
var nu, ru, iu, au, ou, su = t((() => {
	k(), Pl(), L(), nu = 1, ru = 1, iu = /* @__PURE__ */ new WeakMap(), au = /* @__PURE__ */ new WeakMap(), ou = class {
		device;
		#e = /* @__PURE__ */ new Map();
		#t = /* @__PURE__ */ new Set();
		#n;
		#r;
		#i = !1;
		constructor(e, t) {
			this.device = e, this.#n = t.errorSink ?? (() => void 0), this.#r = t.registerSettledSource?.(() => [...this.#t]);
		}
		getReady(e) {
			return this.#e.get(e)?.pipeline;
		}
		getSync(e, t, n) {
			this.#c(n.where);
			let r = this.#e.get(e);
			if (r?.pipeline) return r.pipeline;
			let i = r ?? {};
			r || this.#e.set(e, i);
			let a = this.#a(e, i, t, n);
			if (!a) {
				i.pending || this.#e.delete(e);
				return;
			}
			return i.pipeline = a, i.pending?.resolve(a), i.pending = void 0, a;
		}
		getAsync(e, t, n) {
			this.#c(n.where);
			let r = this.#e.get(e);
			if (r?.pipeline) return Promise.resolve(r.pipeline);
			if (r?.pending) return r.pending.promise;
			let i = {}, a = Yl();
			i.pending = a, this.#e.set(e, i);
			let o;
			try {
				o = t();
			} catch (t) {
				let r = hr(n.where, t, n.signature);
				return a.reject(r), this.#e.delete(e), a.promise;
			}
			return this.#l(o), o.then((t) => {
				this.#e.get(e) !== i || i.pipeline || i.pending !== a || (i.pipeline = t, i.pending = void 0, a.resolve(t));
			}, (t) => {
				this.#e.get(e) !== i || i.pipeline || i.pending !== a || (i.pending = void 0, this.#e.delete(e), a.reject(hr(n.where, t, n.signature)));
			}), a.promise;
		}
		dispose() {
			if (this.#i) return;
			this.#i = !0;
			let e = gr("gpu.dispose");
			for (let t of this.#e.values()) t.pending?.reject(e);
			this.#e.clear(), this.#t.clear(), this.#r?.();
		}
		#a(e, t, n, r) {
			let i = this.device.gpu, a = typeof i.pushErrorScope == "function" && typeof i.popErrorScope == "function";
			a && i.pushErrorScope("validation");
			try {
				let i = n();
				return a && this.#o(e, t, r), i;
			} catch (e) {
				a && this.#s();
				let t = hr(r.where, e, r.signature);
				this.#n(t);
				return;
			}
		}
		#o(e, t, n) {
			let r = this.device.gpu.popErrorScope().then((r) => {
				if (!r) return;
				let i = hr(n.where, r, n.signature);
				return this.#e.get(e) === t && this.#e.delete(e), this.#n(i);
			}, (r) => {
				let i = hr(n.where, r, n.signature);
				return this.#e.get(e) === t && this.#e.delete(e), this.#n(i);
			});
			this.#l(r);
		}
		#s() {
			let e = this.device.gpu.popErrorScope?.();
			e && e.catch(() => void 0);
		}
		#c(e) {
			if (this.#i) throw gr(e);
		}
		#l(e) {
			this.#t.add(e), e.catch(() => void 0).then(() => this.#t.delete(e), () => this.#t.delete(e));
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/frame-state.js
function cu(e) {
	return e.service(du, lu);
}
function lu() {
	let e = /* @__PURE__ */ new Set(), t = uu(), n = !1, r = !1, i = {
		time: 0,
		deltaTime: 0,
		frameCount: 0,
		advanceBy(e) {
			i.deltaTime = e, i.time += e, r = !0;
		},
		tick() {
			if (n) throw Or();
			n = !0;
			try {
				let n = uu();
				r ? r = !1 : (i.deltaTime = Math.max(0, (n - t) / 1e3), i.time += i.deltaTime), t = n, i.frameCount += 1;
				for (let t of [...e]) t();
			} finally {
				n = !1;
			}
		},
		onAdvance(t) {
			return e.add(t), () => {
				e.delete(t);
			};
		}
	};
	return i;
}
function uu() {
	return globalThis.performance?.now?.() ?? Date.now();
}
var du, fu = t((() => {
	Xr(), L(), du = Vr("frame-state");
}));
//#endregion
//#region node_modules/vgpu/dist/surface.js
function pu(e, t, n = {}) {
	let r = z(e, "surface"), i = mu(r), a = i.get(t);
	if (a && !a.disposed) throw Sr(a.label);
	let o = new Mu(r.device, t, n, (e) => {
		i.get(e.canvas) === e && i.delete(e.canvas), s(), c();
	}), s = cu(r).onAdvance(() => o.applyAutoResize()), c = r.own("resource", () => o.dispose());
	return i.set(t, o), o;
}
function mu(e) {
	return e.service(ku, () => /* @__PURE__ */ new Map());
}
function hu() {
	return Au > 0;
}
function gu() {
	return ju > 0;
}
function _u() {
	ju += 1;
}
function vu() {
	--ju;
}
function yu(e) {
	return e instanceof Mu;
}
function bu(e) {
	return typeof e.clientWidth == "number";
}
function xu(e, t, n, r) {
	return t.size ? Tu(t.size) : n ? Su(e, r) : Tu(Cu(e));
}
function Su(e, t) {
	let n = e;
	return Tu([Math.round(n.clientWidth * t), Math.round(n.clientHeight * t)]);
}
function Cu(e) {
	let t = e;
	return [t.width, t.height];
}
function wu(e, t) {
	let n = e;
	n.width = t[0], n.height = t[1];
}
function Tu(e) {
	return [Math.max(1, Math.floor(e[0])), Math.max(1, Math.floor(e[1]))];
}
function Eu(e) {
	let t = globalThis.devicePixelRatio ?? 1;
	return Array.isArray(e) ? Math.min(e[1], Math.max(e[0], t)) : typeof e == "number" ? e : t;
}
function Du() {
	return globalThis.navigator?.gpu?.getPreferredCanvasFormat?.() ?? "bgra8unorm";
}
function Ou() {
	let e = globalThis.GPUTextureUsage;
	return e ? e.RENDER_ATTACHMENT | e.TEXTURE_BINDING | e.COPY_SRC : void 0;
}
var ku, Au, ju, Mu, Nu = t((() => {
	k(), Pl(), L(), fu(), B(), Xr(), ku = Vr("surfaces"), Au = 0, ju = 0, Mu = class {
		device;
		canvas;
		options;
		unregister;
		resourceIdentity = ke("render-target");
		label;
		context;
		autoResize;
		layoutBacked;
		format;
		#e = new je();
		#t = /* @__PURE__ */ new Set();
		#n = /* @__PURE__ */ new Set();
		#r;
		#i;
		#a = !1;
		#o = !1;
		constructor(e, t, n, r) {
			this.device = e, this.canvas = t, this.options = n, this.unregister = r, this.label = n.label, this.#i = n.clearColor === void 0 ? Nl : bl(n.clearColor, "surface.clearColor");
			let i = t.getContext("webgpu");
			if (!i) throw xr();
			if (this.context = i, this.layoutBacked = bu(t), n.autoResize === !0 && !this.layoutBacked) throw wr();
			this.autoResize = n.autoResize ?? (!n.size && this.layoutBacked), this.#r = Eu(n.dpr), this.format = n.format ?? Du();
			let a = xu(t, n, this.layoutBacked, this.#r);
			(n.size || this.layoutBacked) && wu(t, a), i.configure({
				device: e.gpu,
				format: this.format,
				alphaMode: n.alphaMode ?? "premultiplied",
				colorSpace: n.colorSpace ?? "srgb",
				usage: Ou()
			});
		}
		get gpu() {
			return this.context;
		}
		get size() {
			return this.#d(), Cu(this.canvas);
		}
		get texelSize() {
			let e = this.size;
			return [1 / e[0], 1 / e[1]];
		}
		get color() {
			return this.#d(), new O(this.device, this.context.getCurrentTexture(), {
				kind: "2d",
				size: this.size,
				format: this.format,
				usage: [
					"render_attachment",
					"texture_binding",
					"copy_src"
				],
				label: this.options.label ? `${this.options.label}.color` : "surface.color"
			}, "external");
		}
		get colors() {
			return [this.color];
		}
		get depth() {
			this.#d();
		}
		get sampleCount() {
			return this.#d(), 1;
		}
		get dpr() {
			return this.#r;
		}
		get clearColor() {
			return xl(this.#i);
		}
		set clearColor(e) {
			this.#i = bl(e, "surface.clearColor");
		}
		get disposed() {
			return this.#a;
		}
		resize(e) {
			if (this.#d(), this.#o) throw Tr(this.options.label);
			this.#s(Tu(e), this.#r, !0);
		}
		applyAutoResize() {
			if (this.#a || !this.autoResize || !this.layoutBacked) return;
			let e = Eu(this.options.dpr), t = Su(this.canvas, e);
			this.#s(t, e, !0);
		}
		onResize(e) {
			this.#d(), this.#t.add(e), this.#o = !0, Au += 1;
			try {
				e(this.#u());
			} finally {
				--Au, this.#o = !1;
			}
			return () => {
				this.#t.delete(e);
			};
		}
		onDestroy(e) {
			return this.#d(), this.#e.onDestroy(this, e);
		}
		onTexturesRecreated(e) {
			return this.#d(), this.#n.add(e), () => {
				this.#n.delete(e);
			};
		}
		renderPassDescriptor(e = {}) {
			let { clear: t = [
				0,
				0,
				0,
				1
			], preserve: n } = e;
			this.#d();
			let r = {
				view: this.context.getCurrentTexture().createView(),
				loadOp: n ? "load" : "clear",
				storeOp: "store"
			};
			return n || (r.clearValue = Al(t)), { colorAttachments: [r] };
		}
		dispose() {
			if (!this.#a) {
				this.#a = !0;
				try {
					this.context.unconfigure?.();
				} catch {}
				this.unregister(this), this.#t.clear(), this.#n.clear(), this.#e.emit(this);
			}
		}
		#s(e, t, n) {
			let r = !jl(Cu(this.canvas), e);
			this.#r = t, r && (wu(this.canvas, e), this.#c(), n && this.#l());
		}
		#c() {
			for (let e of [...this.#n]) e();
		}
		#l() {
			this.#o = !0, Au += 1;
			try {
				let e = this.#u();
				for (let t of [...this.#t]) t(e);
			} finally {
				--Au, this.#o = !1;
			}
		}
		#u() {
			let e = Cu(this.canvas);
			return {
				width: e[0],
				height: e[1],
				dpr: this.#r,
				surface: this
			};
		}
		#d() {
			if (this.#a) throw Cr(this.options.label);
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/indirect.js
function Pu(e, t, n, r) {
	let i = typeof n == "object" && n ? n.buffer : void 0, a = Fu(n) ? n : Fu(i) ? i : void 0;
	if (!a) throw Rn(e, `received ${Iu(n)}; expected a StorageBuffer or { buffer, offset? }.`, t);
	let o = a === n ? 0 : n.offset ?? 0;
	if (typeof o != "number" || !Number.isInteger(o) || o < 0) throw Rn(e, `offset must be an integer >= 0; received ${Iu(o)}.`, t);
	if (o % 4 != 0) throw Rn(e, `offset must be a multiple of 4 (WebGPU requires "indirectOffset is a multiple of 4"); received ${o}.`, t);
	if (!a.buffer.options.usage.includes("indirect")) throw Rn(e, `the buffer lacks the "indirect" usage (WebGPU requires "indirectBuffer.usage contains INDIRECT"); create it with storage(gpu, ${a.size}, { indirect: true }).`, t);
	let { bytes: s, args: c } = Lu[r];
	if (o + s > a.size) throw Rn(e, `${r} reads ${s} bytes (${c}) at offset ${o}, but offset + ${s} = ${o + s} exceeds the buffer size ${a.size}.`, t);
	return {
		buffer: a.gpu,
		offset: o
	};
}
function Fu(e) {
	return typeof e == "object" && !!e && "gpu" in e && "size" in e && e.buffer instanceof D;
}
function Iu(e) {
	if (typeof e == "string") return `"${e}"`;
	try {
		return JSON.stringify(e) ?? String(e);
	} catch {
		return String(e);
	}
}
var Lu, Ru = t((() => {
	k(), L(), Lu = {
		drawIndirect: {
			bytes: 16,
			args: "4 u32 values: vertexCount, instanceCount, firstVertex, firstInstance"
		},
		drawIndexedIndirect: {
			bytes: 20,
			args: "5 32-bit values: indexCount, instanceCount, firstIndex, baseVertex (signed), firstInstance"
		},
		dispatchWorkgroupsIndirect: {
			bytes: 12,
			args: "3 u32 values: workgroupCountX, workgroupCountY, workgroupCountZ"
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/frame-protocols.js
function zu(e) {
	return e?.[Hu];
}
function Bu(e) {
	return e?.[Uu];
}
function Vu(e) {
	return typeof e?.[Wu] == "function" ? e : void 0;
}
var Hu, Uu, Wu, Gu = t((() => {
	Hu = Symbol("vgpu.frame.drawable"), Uu = Symbol("vgpu.frame.bundle"), Wu = Symbol("vgpu.frame.passAttachment");
}));
//#endregion
//#region node_modules/vgpu/dist/sampler.js
function Ku(e, t) {
	return Zu(z(e, "sampler")).sampler(t);
}
function qu(e) {
	let t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new WeakMap();
	return {
		sampler(r = {}) {
			let i = Ju(r), a = t.get(i);
			return a || (a = e.gpu.createSampler(r), t.set(i, a), n.set(a, {
				kind: "sampler",
				id: Yu++
			})), a;
		},
		identity(e) {
			let t = n.get(e);
			return t || (t = {
				kind: "sampler",
				id: Yu++
			}, n.set(e, t)), t;
		}
	};
}
function Ju(e) {
	if (typeof e != "object" || !e) return JSON.stringify(e);
	if (Array.isArray(e)) return `[${e.map(Ju).join(",")}]`;
	let t = e;
	return `{${Object.keys(t).sort().map((e) => `${JSON.stringify(e)}:${Ju(t[e])}`).join(",")}}`;
}
var Yu, Xu = t((() => {
	B(), ed(), Yu = 1;
}));
//#endregion
//#region node_modules/vgpu/dist/render-service.js
function Zu(e) {
	return e.service($u, Qu);
}
function Qu(e) {
	let t = e.device, n = Es(), r = Jl(t, {
		errorSink: (t) => e.reportError(t),
		registerSettledSource: (t) => e.registerSettledSource(t)
	}), i = Kl(t), a = ql(t), o = qu(t);
	return e.own("service", () => {
		r.dispose(), i.dispose(), a.dispose(), n.dispose();
	}), {
		binds: n,
		pipelines: r,
		shaderModules: i,
		pipelineLayouts: a,
		sampler: (e) => o.sampler(e)
	};
}
var $u, ed = t((() => {
	Os(), Xu(), su(), Xr(), $u = Vr("render-service");
}));
//#endregion
//#region node_modules/vgpu/dist/shader-source.js
function td(e) {
	if (typeof e == "string") return e;
	if (!nd(e) || !("version" in e) || e.version !== 1) throw Pr(e);
	let t = e.wgsl;
	if (typeof t != "string") throw Pr(e);
	return t;
}
function nd(e) {
	return typeof e == "object" && !!e;
}
var rd = t((() => {
	L();
}));
//#endregion
//#region node_modules/vgpu/dist/draw.js
function id(e, t) {
	let n = z(e, "draw"), r = Zu(n), i = td(t.shader);
	return new of(n.device, i, {
		...t,
		shader: i
	}, r.binds, void 0, r.pipelines, r.shaderModules, r.pipelineLayouts, (e) => n.reportError(e), (e) => {
		n.trackDelivery(e);
	});
}
function ad(e, t, n, r, i) {
	let a = e.limits;
	for (let [e, o, s] of [[
		"vertex",
		1,
		"maxStorageBuffersInVertexStage"
	], [
		"fragment",
		2,
		"maxStorageBuffersInFragmentStage"
	]]) {
		let c = r.find((t) => t.stage === e);
		if (!c) continue;
		let l = n.filter((e) => e.bindingLayout?.kind === "buffer" && e.bindingLayout.buffer.type !== "uniform" && i(e) & o), u = a[s] ?? a.maxStorageBuffersPerShaderStage;
		if (u !== void 0 && l.length > u) throw vn(t, e, c.name, l.length, u, l);
	}
}
function od(e, t) {
	return e.colors.map((e, n) => {
		let r = t.colorStates?.[n], i = r?.blendState ?? t.blendState, a = r?.writeMask ?? t.writeMask, o = { format: e };
		return i && (o.blend = i), a !== void 0 && (o.writeMask = a), o;
	});
}
function sd(e, t, n, r) {
	fd(e, "DrawOptions.instances", n.instances), fd(e, "DrawOptions.vertices", n.vertices), fd(e, "DrawOptions.firstInstance", n.firstInstance), fd(e, "DrawCallOptions.instances", r.instances), dd(e, "DrawCallOptions.vertices", r.vertices), dd(e, "DrawCallOptions.indices", r.indices), dd(e, "DrawCallOptions.firstVertex", r.firstVertex), dd(e, "DrawCallOptions.firstIndex", r.firstIndex), dd(e, "DrawCallOptions.baseVertex", r.baseVertex), fd(e, "DrawCallOptions.firstInstance", r.firstInstance), fd(e, "GeometryLike.vertexCount", t?.vertexCount), fd(e, "GeometryLike.indexCount", t?.indexCount), fd(e, "GeometryLike.instanceCount", t?.instanceCount), dd(e, "GeometryLike.firstVertex", t?.firstVertex), dd(e, "GeometryLike.firstIndex", t?.firstIndex), dd(e, "GeometryLike.baseVertex", t?.baseVertex);
	let i = !!t?.indexBuffer, a = t?.geometry ?? (t && oi in t ? t : void 0), o = r.firstVertex ?? t?.firstVertex ?? 0, s = r.vertices ?? t?.vertexCount ?? n.vertices ?? 3, c = r.firstIndex ?? t?.firstIndex ?? 0, l = r.indices ?? t?.indexCount ?? 0, u = r.baseVertex ?? t?.baseVertex ?? 0;
	if (i) ud(e, "index", c, l, a?.indexCount);
	else if (r.indices !== void 0 || r.firstIndex !== void 0 || r.baseVertex !== void 0) throw cr(`${e}.draw`, "Index range needs an indexed geometry.");
	return i || ud(e, "vertex", o, s, a?.vertexCount), {
		instanceCount: r.instances ?? n.instances ?? t?.instanceCount ?? 1,
		firstInstance: r.firstInstance ?? n.firstInstance ?? 0,
		vertexCount: s,
		firstVertex: o,
		indexCount: l,
		firstIndex: c,
		baseVertex: u
	};
}
function cd(e) {
	let t = e?.topology ?? "triangle-list";
	return e?.stripIndexFormat ?? (t.endsWith("strip") ? e?.indexFormat : void 0);
}
function ld(e, t, n, r) {
	let i = e?.topology ?? "triangle-list", a = cd(e), o = a ? {
		topology: i,
		stripIndexFormat: a
	} : { topology: i };
	return t !== void 0 && (o.cullMode = t), n !== void 0 && (o.frontFace = n), r && (o.unclippedDepth = !0), o;
}
function ud(e, t, n, r, i) {
	if (!(i === void 0 || n + r <= i)) throw cr(`${e}.draw`, `${t} range [${n}, ${n + r}) exceeds parent geometry ${t} count ${i}.`);
}
function dd(e, t, n) {
	if (!(n === void 0 || Number.isInteger(n) && n >= 0)) throw cr(`${e}.draw`, `${t} must be an integer >= 0; received ${String(n)}.`);
}
function fd(e, t, n) {
	if (n !== void 0 && !(Number.isInteger(n) && n >= 0)) throw new I({
		code: "VGPU-R1-DRAW-COUNT",
		message: `${t} of '${e}' must be an integer >= 0; received ${String(n)}. Use 0 only when you want to issue a valid draw with no vertices/instances.`,
		where: `${e}.draw`
	});
}
function pd(e, t) {
	let n = t.blend === void 0 ? void 0 : hd(e, t.blend), r = t.writeMask === void 0 ? void 0 : Bd(e, t.writeMask), i = t.colors === void 0 ? void 0 : md(e, t.colors);
	return {
		blendState: n,
		writeMask: r,
		colorStates: i,
		fragmentKey: i ? `${Vd(n, r)}@${i.map(Ud).join("@")}` : n || r !== void 0 ? Vd(n, r) : void 0
	};
}
function md(e, t) {
	if (!Array.isArray(t)) throw kn(e, `colors must be an array; received ${Y(t)}.`);
	return t.map((t, n) => {
		if (t == null) return null;
		if (typeof t != "object" || Array.isArray(t)) throw kn(e, `colors[${n}] must be null or { blend?, writeMask? }; received ${Y(t)}.`);
		let r = t.blend === void 0 ? void 0 : hd(`${e}.colors[${n}]`, t.blend), i = t.writeMask === void 0 ? void 0 : Bd(`${e}.colors[${n}]`, t.writeMask);
		return !r && i === void 0 ? null : {
			blendState: r,
			writeMask: i
		};
	});
}
function hd(e, t) {
	if (t === "alpha") return _d({
		src: "src-alpha",
		dst: "one-minus-src-alpha"
	}, {
		src: "one",
		dst: "one-minus-src-alpha"
	});
	if (t === "premultiplied") return _d({
		src: "one",
		dst: "one-minus-src-alpha"
	}, {
		src: "one",
		dst: "one-minus-src-alpha"
	});
	if (t === "additive") return _d({
		src: "one",
		dst: "one"
	}, {
		src: "one",
		dst: "one"
	});
	if (typeof t != "object" || !t || !gd(t.color)) throw Tn(e, t);
	let n = t.color, r = t.alpha;
	if (r !== void 0 && !gd(r)) throw Tn(e, t);
	return _d(n, r ?? n);
}
function gd(e) {
	return typeof e == "object" && !!e && typeof e.src == "string" && typeof e.dst == "string";
}
function _d(e, t) {
	return {
		color: vd(e),
		alpha: vd(t)
	};
}
function vd(e) {
	return {
		srcFactor: e.src,
		dstFactor: e.dst,
		operation: e.op ?? "add"
	};
}
function yd(e, t, n) {
	if (t.blendConstant === void 0) return {};
	let r = t.blendConstant;
	if (!Array.isArray(r) || r.length !== 4 || r.some((e) => typeof e != "number" || !Number.isFinite(e))) throw En(e, `received ${Y(r)}; expected [r, g, b, a] finite numbers.`);
	if (!bd(n).some((e) => e && xd(e))) throw En(e, "no color target's effective blend uses a \"constant\"/\"one-minus-constant\" factor (colors[i].blend replaces the top-level blend for that target), so blendConstant would have no effect.");
	return { blendConstant: {
		r: r[0],
		g: r[1],
		b: r[2],
		a: r[3]
	} };
}
function bd(e) {
	return e.colorStates ? e.colorStates.map((t) => t?.blendState ?? e.blendState) : [e.blendState];
}
function xd(e) {
	return [
		e.color.srcFactor,
		e.color.dstFactor,
		e.alpha.srcFactor,
		e.alpha.dstFactor
	].some((e) => e === "constant" || e === "one-minus-constant");
}
function Sd(e, t) {
	if (t === void 0) return {};
	if (typeof t != "object" || !t || Array.isArray(t)) throw Ln(e, `received ${Y(t)}; expected { vertex?, fragment? } entry point names.`);
	return t;
}
function Cd(e, t, n) {
	let r = e.entryPoints.find((e) => e.stage === "vertex"), i = e.entryPoints.find((e) => e.stage === "fragment");
	if (t !== r || n !== i) return `en~${t?.name ?? ""}~${n?.name ?? ""}`;
}
function wd(e, t, n) {
	return {
		cullMode: n.cull === void 0 ? void 0 : Ed(t, n.cull),
		frontFace: n.frontFace === void 0 ? void 0 : Dd(t, n.frontFace),
		unclippedDepth: n.unclippedDepth === void 0 ? void 0 : Td(e, t, n.unclippedDepth)
	};
}
function Td(e, t, n) {
	if (typeof n != "boolean") throw Mn(t, `received ${Y(n)}; expected a boolean.`);
	if (n) {
		if (!e.features.has("depth-clip-control")) throw Mn(t, "the device lacks the \"depth-clip-control\" feature; request it at init: init({ requiredFeatures: [\"depth-clip-control\"] }) on an adapter that supports it.");
		return !0;
	}
}
function Ed(e, t) {
	if (t === "none" || t === "front" || t === "back") return t;
	throw An(e, t);
}
function Dd(e, t) {
	if (t === "ccw" || t === "cw") return t;
	throw jn(e, t);
}
function Od(e, t) {
	if (e.depth) return {
		format: e.depth,
		...t.depthState ?? cf,
		...t.stencilState ?? {}
	};
}
function kd(e, t, n) {
	if (n.depth === void 0) return {};
	let r = Ad(e, t, n.depth, n.geometry?.topology ?? "triangle-list");
	return {
		depthState: r,
		depthKey: jd(r)
	};
}
function Ad(e, t, n, r) {
	if (n === !1) return {
		depthWriteEnabled: !1,
		depthCompare: "always"
	};
	if (typeof n != "object" || !n) throw A(t, `received ${Y(n)}.`);
	if (n.write !== void 0 && typeof n.write != "boolean") throw A(t, `write must be a boolean; received ${Y(n.write)}.`);
	if (n.compare !== void 0 && !lf.includes(n.compare)) throw A(t, `compare must be a GPUCompareFunction; received ${Y(n.compare)}.`);
	if (n.bias !== void 0 && !Number.isInteger(n.bias)) throw A(t, `bias must be an integer (WebGPU depthBias is i32); received ${Y(n.bias)}.`);
	if (n.bias !== void 0 && (n.bias < uf || n.bias > df)) throw A(t, `bias must fit in the i32 range [${uf}, ${df}] (WebGPU depthBias is i32); received ${Y(n.bias)}.`);
	if (n.biasSlopeScale !== void 0 && !Number.isFinite(n.biasSlopeScale)) throw A(t, `biasSlopeScale must be a finite number; received ${Y(n.biasSlopeScale)}.`);
	if (n.biasClamp !== void 0 && !Number.isFinite(n.biasClamp)) throw A(t, `biasClamp must be a finite number; received ${Y(n.biasClamp)}.`);
	let i = n.bias ?? 0, a = n.biasSlopeScale ?? 0, o = n.biasClamp ?? 0;
	if ((i !== 0 || a !== 0 || o !== 0) && !r.startsWith("triangle")) throw A(t, `bias, biasSlopeScale, and biasClamp must be 0 for "${r}" topology.`);
	if (o !== 0 && e.isCompatibilityMode) throw A(t, `biasClamp must be 0 on a compatibility-mode device; received ${Y(n.biasClamp)}.`);
	return {
		depthWriteEnabled: n.write ?? !0,
		depthCompare: n.compare ?? "less-equal",
		...i === 0 ? {} : { depthBias: i },
		...a === 0 ? {} : { depthBiasSlopeScale: a },
		...o === 0 ? {} : { depthBiasClamp: o }
	};
}
function jd(e) {
	return `${+!!e.depthWriteEnabled}~${e.depthCompare}~${e.depthBias ?? 0}~${e.depthBiasSlopeScale ?? 0}~${e.depthBiasClamp ?? 0}`;
}
function Md(e, t) {
	if (t.stencil === void 0) return {};
	let n = t.stencil;
	if (typeof n != "object" || !n || Array.isArray(n)) throw Nn(e, `received ${Y(n)}; expected { front?, back?, readMask?, writeMask?, ref? }.`);
	let r = n.front === void 0 ? void 0 : Nd(e, "front", n.front), i = n.back === void 0 ? void 0 : Nd(e, "back", n.back);
	Pd(e, "readMask", n.readMask), Pd(e, "writeMask", n.writeMask), Pd(e, "ref", n.ref);
	let a = {
		...r ? { stencilFront: r } : {},
		...i ?? r ? { stencilBack: i ?? { ...r } } : {},
		...n.readMask === void 0 ? {} : { stencilReadMask: n.readMask },
		...n.writeMask === void 0 ? {} : { stencilWriteMask: n.writeMask }
	}, o = a.stencilFront !== void 0 || a.stencilBack !== void 0 || a.stencilReadMask !== void 0 || a.stencilWriteMask !== void 0;
	return !o && n.ref === void 0 ? {} : {
		...o ? {
			stencilState: a,
			stencilKey: Fd(a)
		} : {},
		...n.ref === void 0 ? {} : { stencilRef: n.ref }
	};
}
function Nd(e, t, n) {
	if (typeof n != "object" || !n || Array.isArray(n)) throw Nn(e, `${t} must be a { compare?, fail?, depthFail?, pass? } object; received ${Y(n)}.`);
	if (n.compare !== void 0 && !lf.includes(n.compare)) throw Nn(e, `${t}.compare must be a GPUCompareFunction; received ${Y(n.compare)}.`);
	for (let [r, i] of [
		["fail", n.fail],
		["depthFail", n.depthFail],
		["pass", n.pass]
	]) if (i !== void 0 && !ff.includes(i)) throw Nn(e, `${t}.${r} must be a GPUStencilOperation; received ${Y(i)}.`);
	return {
		compare: n.compare ?? "always",
		failOp: n.fail ?? "keep",
		depthFailOp: n.depthFail ?? "keep",
		passOp: n.pass ?? "keep"
	};
}
function Pd(e, t, n) {
	if (n !== void 0 && (typeof n != "number" || !Number.isInteger(n) || n < 0 || n > 4294967295)) throw Nn(e, `${t} must be an integer in [0, 0xFFFFFFFF] (WebGPU GPUStencilValue is u32); received ${Y(n)}.`);
}
function Fd(e) {
	return `st~${Id(e.stencilFront)}~${Id(e.stencilBack)}~${e.stencilReadMask ?? 4294967295}~${e.stencilWriteMask ?? 4294967295}`;
}
function Id(e) {
	return e ? `${e.compare},${e.failOp},${e.depthFailOp},${e.passOp}` : "default";
}
function Ld(e, t) {
	return {
		count: e.sampleCount ?? 1,
		...t.multisampleState ?? {}
	};
}
function Rd(e, t) {
	if (t.multisample === void 0) return {};
	let n = t.multisample;
	if (typeof n != "object" || !n || Array.isArray(n)) throw Fn(e, `received ${Y(n)}; expected { alphaToCoverage?, mask? }.`);
	if (n.alphaToCoverage !== void 0 && typeof n.alphaToCoverage != "boolean") throw Fn(e, `alphaToCoverage must be a boolean; received ${Y(n.alphaToCoverage)}.`);
	if (n.mask !== void 0 && (typeof n.mask != "number" || !Number.isInteger(n.mask) || n.mask < 0 || n.mask > 4294967295)) throw Fn(e, `mask must be an integer in [0, 0xFFFFFFFF] (WebGPU GPUSampleMask is u32); received ${Y(n.mask)}.`);
	let r = {
		...n.alphaToCoverage === void 0 ? {} : { alphaToCoverageEnabled: n.alphaToCoverage },
		...n.mask === void 0 ? {} : { mask: n.mask }
	};
	return r.alphaToCoverageEnabled === void 0 && r.mask === void 0 ? {} : {
		multisampleState: r,
		multisampleKey: zd(r)
	};
}
function zd(e) {
	return `ms~${+!!e.alphaToCoverageEnabled}~${e.mask ?? 4294967295}`;
}
function Bd(e, t) {
	if (!Array.isArray(t)) throw On(e, Y(t));
	let n = 0;
	for (let r of t) if (r === "r") n |= 1;
	else if (r === "g") n |= 2;
	else if (r === "b") n |= 4;
	else if (r === "a") n |= 8;
	else throw On(e, Y(r));
	return n;
}
function Vd(e, t) {
	return `${Hd(e)};${t ?? 15}`;
}
function Hd(e) {
	if (!e) return "none;none";
	let t = e.color, n = e.alpha;
	return `${t.srcFactor},${t.dstFactor},${t.operation};${n.srcFactor},${n.dstFactor},${n.operation}`;
}
function Ud(e) {
	return e ? `${e.blendState ? Hd(e.blendState) : "inherit"};${e.writeMask ?? "inherit"}` : "inherit";
}
function Y(e) {
	if (typeof e == "string") return `"${e}"`;
	try {
		return JSON.stringify(e) ?? String(e);
	} catch {
		return String(e);
	}
}
function Wd(e, t) {
	return X(e).setCore.watchResources((n) => t({
		kind: "binding-identity",
		drawLabel: e.label,
		...n
	}));
}
function Gd(e, t) {
	X(e).recordedIn.add(t);
}
function Kd(e) {
	return X(e).blendConstant !== void 0;
}
function qd(e) {
	return X(e).stencilRef !== void 0;
}
function Jd(e) {
	return (X(e).depthState ?? cf).depthWriteEnabled;
}
function Yd(e) {
	let t = X(e), n = t.stencilState;
	if (!n || n.stencilWriteMask === 0) return [];
	let r = t.cullMode ?? "none", i = [], a = (e, t) => {
		if (t) for (let [n, r] of [
			["fail", t.failOp],
			["depthFail", t.depthFailOp],
			["pass", t.passOp]
		]) r !== void 0 && r !== "keep" && i.push(`${e}.${n}: "${r}"`);
	};
	return r !== "front" && a("front", n.stencilFront), r !== "back" && a("back", n.stencilBack), i;
}
function Xd(e, t, n, r = {}, i) {
	e.encode(t, n, r, i);
}
function X(e) {
	let t = af.get(e);
	if (!t) throw TypeError("Invalid Draw instance");
	return t;
}
function Zd(e, t, n, r) {
	let i = (async () => {
		await Fs(e.device), R(e.device, `${t}.validation`);
		let i = wn(t, n, r);
		e.errorSink ? await e.errorSink(i) : console.error(i);
	})();
	return e.trackSettled?.(i), i;
}
function Qd() {
	let e = /* @__PURE__ */ new Set();
	return {
		add(t) {
			e.add(t);
		},
		delete(t) {
			e.delete(t);
		},
		list() {
			return [...e];
		},
		markStale(t) {
			for (let n of e) n.markStale(t);
		}
	};
}
function $d(e, t, n) {
	return e ? Array.isArray(e) ? e : e[t] ?? n : n;
}
function ef(e, t) {
	let n = X(e);
	return Kc(n.reflection.bindings, t, n.visibility).map(tf);
}
function tf(e) {
	return e.buffer ? {
		...e,
		buffer: {
			...e.buffer,
			hasDynamicOffset: !0
		}
	} : e;
}
function nf(e, t) {
	if (yu(e) && !gu()) throw br(t);
}
var rf, af, of, sf, cf, lf, uf, df, ff, pf = t((() => {
	Ts(), Os(), As(), Us(), Gs(), yl(), rl(), su(), Pl(), L(), Nu(), Qr(), si(), Ru(), Gu(), B(), ed(), rd(), rf = 1, af = /* @__PURE__ */ new WeakMap(), of = class {
		source;
		label;
		#e = /* @__PURE__ */ new Map();
		constructor(e, t, n, r = Es(), i, a = Jl(e), o = Kl(e), s = ql(e), c, l) {
			this.source = t, R(e, "Draw.constructor"), this.label = n.label ?? "draw";
			let u = rf++, d = ws(t, `${this.label}.wgsl`), f = Sd(this.label, n.entry), p = zl(this.label, d.entryPoints, "vertex", f.vertex, "draw"), m = zl(this.label, d.entryPoints, "fragment", f.fragment, "draw"), h = Cd(d, p, m), g = [p, m].filter((e) => !!e), _ = Gc(d.bindings, g);
			ad(e, this.label, d.bindings, g, _);
			let v = n.geometry, y = p ? ks(p, "inputs", this.label) : [], ee = v && oi in v ? v[oi](y, `${this.label}.geometry`) : v?.vertexBufferLayouts, b = new Map(qc(e, this.label, d, _)), x = s.get(b), S = o.get(t, `${this.label}.shader`), C = Qd(), w = pd(this.label, n), te = yd(this.label, n, w), ne = wd(e, this.label, n), re = kd(e, this.label, n), ie = Md(this.label, n), ae = Rd(this.label, n), oe = Vl(this.label, n.constants, d.overrides, "draw"), se = il({
				device: e,
				label: this.label,
				drawId: u,
				reflection: d,
				bindGroupLayouts: b,
				cache: r,
				onIdentityChange: (e) => C.markStale({
					kind: "binding-identity",
					drawLabel: this.label,
					...e
				})
			});
			af.set(this, {
				id: u,
				device: e,
				opts: n,
				vertexBufferLayouts: ee,
				cache: r,
				defaultTarget: i,
				reflection: d,
				visibility: _,
				vertexEntry: p?.name ?? "vs_main",
				fragmentEntry: m?.name ?? "fs_main",
				entryKey: h,
				setCore: se,
				bindGroupLayouts: b,
				pipelineLayout: x,
				shaderModule: S,
				pipelineStore: a,
				pipelineLayouts: s,
				errorSink: c,
				trackSettled: l,
				resolvedPipelineKeys: /* @__PURE__ */ new Set(),
				recordedIn: C,
				...w,
				...te,
				...ne,
				...re,
				...ie,
				...ae,
				...oe
			}), n.set && this.set(n.set);
			for (let e of n.targets ?? []) this.compileSync(e);
		}
		get gpu() {
			let e = X(this);
			for (let t of e.resolvedPipelineKeys) {
				let n = e.pipelineStore.getReady(t);
				if (n) return n;
			}
		}
		get targets() {
			return X(this).opts.targets;
		}
		get [Hu]() {
			return this;
		}
		writesDepth() {
			return Jd(this);
		}
		stencilWritingOps() {
			return Yd(this);
		}
		set(e) {
			let t = X(this);
			R(t.device, `${this.label}.set`);
			for (let n of t.setCore.set(e)) t.recordedIn.markStale({
				kind: "binding-identity",
				drawLabel: this.label,
				...n
			});
			return this;
		}
		group(e, t) {
			let n = X(this);
			R(n.device, `${this.label}.group`);
			let r = this.#e.get(e) ?? this.layout(e), i = n.setCore.claimGroup(e, t, r);
			return n.recordedIn.markStale({
				kind: "group-claim",
				drawLabel: this.label,
				group: e,
				previousIdentity: i,
				newIdentity: `claimed-group:${e}`
			}), this;
		}
		layout(e, t = {}) {
			return R(X(this).device, `${this.label}.layout`), t.dynamicOffsets ? this.#t(e) : X(this).setCore.layout(e);
		}
		#t(e) {
			let t = X(this);
			t.setCore.layout(e);
			let n = this.#e.get(e);
			if (n) return n;
			let r = ef(this, e), i = Xc(t.device, `${this.label}.group${e}.dynamic.bgl`, r);
			return this.#e.set(e, i), t.bindGroupLayouts.set(e, i), t.pipelineLayout = t.pipelineLayouts.get(t.bindGroupLayouts), i;
		}
		draw(e = {}) {
			R(X(this).device, `${this.label}.draw`);
			let t = Ml(e) ? { target: e } : e, n = X(this), r = t.target ?? n.defaultTarget;
			if (!r) throw ir(`${this.label}.draw`);
			nf(r, `${this.label}.draw`);
			let i = n.device.gpu.createCommandEncoder(), a = i.beginRenderPass(r.renderPassDescriptor()), o = [];
			try {
				this.encode(a, r, t, (e) => o.push(e));
			} catch (e) {
				q(o), Ps(n.device);
				try {
					a.end();
				} catch {}
				throw e;
			}
			Ws(n.device, a, o, o[0]?.context);
			let s, c = o[0]?.context;
			c && js(n.device, c);
			try {
				s = i.finish();
			} catch (e) {
				let t = c ? K(n.device) : void 0;
				q(o), t && q([t]);
				let r = t?.context ?? c;
				if (r) {
					Zd(n, r.label, r.group, e);
					return;
				}
				throw e;
			}
			if (c) {
				let e = K(n.device);
				e && (o[0] = o[0] ? Ls(e, o[0]) : e);
			}
			let l = o[0]?.context;
			l && js(n.device, l);
			try {
				n.device.gpu.queue.submit([s]);
			} catch (e) {
				let t = l ? K(n.device) : void 0;
				q(o), t && q([t]);
				let r = t?.context ?? l;
				if (r) {
					Zd(n, r.label, r.group, e);
					return;
				}
				throw e;
			}
			if (l) {
				let e = K(n.device);
				e && (o[0] = o[0] ? Ls(e, o[0]) : e);
			}
			if (o.length) {
				let e = Is(n.device, o, { errorSink: n.errorSink });
				n.trackSettled?.(e);
			}
		}
		encode(e, t, n = {}, r) {
			R(X(this).device, `${this.label}.encode`), X(this).setCore.assertUsable();
			let i = this.pipelineFor(t, !0);
			if (!i) return;
			e.setPipeline(i);
			let a = X(this);
			a.blendConstant && e.setBlendConstant(a.blendConstant), a.stencilRef !== void 0 && e.setStencilReference(a.stencilRef);
			for (let t of a.setCore.bindGroups()) this.#n(e, t, n, r);
			this.#o(e, n);
		}
		#n(e, t, n, r) {
			let i = $d(n.offsets, t.group, t.offsets);
			if (!t.claimValidation || !r) {
				e.setBindGroup(t.group, t.bindGroup, i);
				return;
			}
			js(X(this).device, t.claimValidation);
			try {
				e.setBindGroup(t.group, t.bindGroup, i);
			} catch (e) {
				throw Ns(X(this).device), wn(t.claimValidation.label, t.claimValidation.group, e);
			}
			let a = K(X(this).device);
			a && r(a);
		}
		compile(e) {
			R(X(this).device, `${this.label}.compile`);
			let { key: t, signature: n, signatureKey: r } = this.#r(e, `${this.label}.compile`);
			return X(this).pipelineStore.getAsync(t, () => this.#l(n), {
				where: `${this.label}.compile`,
				signature: r
			}).then(() => (R(X(this).device, `${this.label}.compile`), X(this).resolvedPipelineKeys.add(t), this));
		}
		compileSync(e) {
			R(X(this).device, `${this.label}.compileSync`);
			let { key: t, signature: n, signatureKey: r } = this.#r(e, `${this.label}.compileSync`);
			return X(this).pipelineStore.getSync(t, () => this.#c(n), {
				where: `${this.label}.compileSync`,
				signature: r
			}) && X(this).resolvedPipelineKeys.add(t), this;
		}
		pipelineFor(e, t = !1) {
			R(X(this).device, `${this.label}.pipelineFor`);
			let { key: n, signature: r, signatureKey: i } = this.#r(e, `${this.label}.pipelineFor`, t), a = X(this).pipelineStore.getSync(n, () => this.#c(r), {
				where: `${this.label}.pipelineFor`,
				signature: i
			});
			return a && X(this).resolvedPipelineKeys.add(n), a;
		}
		pipelineForAsync(e) {
			R(X(this).device, `${this.label}.pipelineForAsync`);
			let { key: t, signature: n, signatureKey: r } = this.#r(e, `${this.label}.pipelineForAsync`);
			return X(this).pipelineStore.getAsync(t, () => this.#l(n), {
				where: `${this.label}.pipelineForAsync`,
				signature: r
			}).then((e) => (R(X(this).device, `${this.label}.pipelineForAsync`), X(this).resolvedPipelineKeys.add(t), e));
		}
		#r(e, t, n = !1) {
			let r = this.#i(e, t, n);
			return {
				signature: r,
				signatureKey: Il(r),
				key: this.#a(r)
			};
		}
		#i(e, t, n = !1) {
			let r = X(this), i = e ?? r.defaultTarget;
			if (!i) throw ir(t);
			n || nf(i, t);
			let a = Fl(i);
			if (Ll(a, t), r.colorStates && r.colorStates.length !== a.colors.length) throw kn(this.label, `expected one entry per color attachment; colors has ${r.colorStates.length}, but the target signature has ${a.colors.length}.`, t);
			if (r.multisampleState?.alphaToCoverageEnabled && (a.sampleCount ?? 1) <= 1) throw Fn(this.label, `alphaToCoverage requires a multisampled target, but the target signature has sampleCount ${a.sampleCount ?? 1}; create the target with msaa: true.`, t);
			if ((r.stencilState || r.stencilRef !== void 0) && !kl(a.depth)) throw Nn(this.label, `stencil requires a depth format with a stencil aspect, but the target signature has ${a.depth ? `"${a.depth}"` : "no depth"}; create the target with depth: "depth24plus-stencil8".`, t);
			return a;
		}
		#a(e) {
			let t = X(this), n = t.opts.geometry;
			return Rl({
				module: t.shaderModule,
				pipelineLayout: t.pipelineLayout,
				vertexBufferLayouts: t.vertexBufferLayouts,
				signature: e,
				fragmentKey: t.fragmentKey,
				topology: n?.topology,
				stripIndexFormat: cd(n),
				cullMode: t.cullMode,
				frontFace: t.frontFace,
				unclippedDepth: t.unclippedDepth,
				depthKey: t.depthKey,
				stencilKey: t.stencilKey,
				multisampleKey: t.multisampleKey,
				constantsKey: t.constantsKey,
				entryKey: t.entryKey
			});
		}
		#o(e, t = {}) {
			let n = X(this).opts.geometry;
			if (n?.vertexBuffers && n.vertexBuffers.forEach((t, n) => e.setVertexBuffer(n, t)), t.indirect !== void 0) return this.#s(e, n, t);
			let r = sd(this.label, n, X(this).opts, t);
			if (!n?.indexBuffer) return e.draw(r.vertexCount, r.instanceCount, r.firstVertex, r.firstInstance);
			e.setIndexBuffer(n.indexBuffer, n.indexFormat ?? "uint32"), e.drawIndexed(r.indexCount, r.instanceCount, r.firstIndex, r.baseVertex, r.firstInstance);
		}
		#s(e, t, n) {
			let r = `${this.label}.draw`, i = sf.find((e) => n[e] !== void 0);
			if (i !== void 0) throw Rn(this.label, `indirect cannot be combined with ${i} in the same call; the GPU reads the draw arguments from the buffer, so the CPU-side value would be ignored.`, r);
			let a = !!t?.indexBuffer, { buffer: o, offset: s } = Pu(this.label, r, n.indirect, a ? "drawIndexedIndirect" : "drawIndirect");
			if (!a) return e.drawIndirect(o, s);
			e.setIndexBuffer(t.indexBuffer, t.indexFormat ?? "uint32"), e.drawIndexedIndirect(o, s);
		}
		#c(e) {
			let t = X(this);
			return t.device.gpu.createRenderPipeline({
				label: `${this.label}.pipeline`,
				layout: t.pipelineLayout,
				vertex: {
					module: t.shaderModule,
					entryPoint: t.vertexEntry,
					buffers: [...t.vertexBufferLayouts ?? []],
					...t.constants ? { constants: t.constants } : {}
				},
				fragment: {
					module: t.shaderModule,
					entryPoint: t.fragmentEntry,
					targets: od(e, t),
					...t.constants ? { constants: t.constants } : {}
				},
				primitive: ld(t.opts.geometry, t.cullMode, t.frontFace, t.unclippedDepth),
				depthStencil: Od(e, t),
				multisample: Ld(e, t)
			});
		}
		#l(e) {
			let t = X(this);
			return t.device.gpu.createRenderPipelineAsync({
				label: `${this.label}.pipeline`,
				layout: t.pipelineLayout,
				vertex: {
					module: t.shaderModule,
					entryPoint: t.vertexEntry,
					buffers: [...t.vertexBufferLayouts ?? []],
					...t.constants ? { constants: t.constants } : {}
				},
				fragment: {
					module: t.shaderModule,
					entryPoint: t.fragmentEntry,
					targets: od(e, t),
					...t.constants ? { constants: t.constants } : {}
				},
				primitive: ld(t.opts.geometry, t.cullMode, t.frontFace, t.unclippedDepth),
				depthStencil: Od(e, t),
				multisample: Ld(e, t)
			});
		}
	}, sf = [
		"vertices",
		"indices",
		"instances",
		"firstVertex",
		"firstIndex",
		"baseVertex",
		"firstInstance"
	], cf = {
		depthWriteEnabled: !0,
		depthCompare: "less-equal"
	}, lf = [
		"never",
		"less",
		"equal",
		"less-equal",
		"greater",
		"not-equal",
		"greater-equal",
		"always"
	], uf = -2147483648, df = 2147483647, ff = [
		"keep",
		"zero",
		"replace",
		"invert",
		"increment-clamp",
		"decrement-clamp",
		"increment-wrap",
		"decrement-wrap"
	];
}));
//#endregion
//#region node_modules/vgpu/dist/effect.js
function mf(e, t, n = {}) {
	if ("geometry" in n) throw F("effect", "effect() never accepts vertex buffers; use draw(gpu, { shader, geometry: geometry(gpu, descriptor) }).");
	let r = z(e, "effect"), i = Zu(r);
	return new yf(r.device, td(t), n, i.binds, void 0, i.pipelines, i.shaderModules, i.pipelineLayouts, (e) => r.reportError(e), (e) => {
		r.trackDelivery(e);
	});
}
function hf(e) {
	return Z(e);
}
function Z(e) {
	let t = vf.get(e);
	if (!t) throw TypeError("Invalid Effect instance");
	return t;
}
function gf(e) {
	return _f(e) ? e : `
struct VgpuFullscreenVertexOut {
  @builtin(position) position: vec4f,
  @location(0) uv: vec2f,
};
@vertex fn vgpu_fullscreen_vs(@builtin(vertex_index) vi: u32) -> VgpuFullscreenVertexOut {
  var pos = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var uv = array<vec2f, 3>(vec2f(0.0, 1.0), vec2f(2.0, 1.0), vec2f(0.0, -1.0));
  var out: VgpuFullscreenVertexOut;
  out.position = vec4f(pos[vi], 0.0, 1.0);
  out.uv = uv[vi];
  return out;
}
${e}`;
}
function _f(e) {
	return ws(e, "effect.wgsl").entryPoints.some((e) => e.stage === "vertex");
}
var vf, yf, bf = t((() => {
	Ts(), pf(), Pl(), Gu(), B(), ed(), rd(), L(), vf = /* @__PURE__ */ new WeakMap(), yf = class {
		get gpu() {
			return Z(this).gpu;
		}
		constructor(e, t, n = {}, r, i, a, o, s, c, l) {
			let u = gf(t), d = new of(e, u, {
				shader: u,
				set: n.set,
				label: n.label ?? "effect",
				blend: n.blend,
				writeMask: n.writeMask
			}, r, i, a, o, s, c, l);
			vf.set(this, d);
		}
		set(e) {
			return Z(this).set(e), this;
		}
		draw(e = {}) {
			Z(this).draw(Ml(e) ? { target: e } : e);
		}
		compile(e) {
			return Z(this).compile(e).then(() => this);
		}
		compileSync(e) {
			return Z(this).compileSync(e), this;
		}
		encode(e, t, n = {}, r) {
			Xd(Z(this), e, t, n, r);
		}
		get [Hu]() {
			return Z(this)[Hu];
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/bundle.js
function xf(e, t, n) {
	return Sf(z(e, "bundle").device, t, n);
}
function Sf(e, t, n) {
	let r = t.label ?? `bundle${Df++}`;
	if (yu(t.target) && !gu()) throw br("bundle");
	let i = Cf(t.target), a = new kf(e, r, i);
	return a.record(n), a;
}
function Cf(e) {
	let t = Fl(e);
	return Ll(t, "bundle"), t;
}
function wf(e, t, n) {
	return `bundle '${e}' is stale: the replay target signature does not match the recorded signature. Bundles freeze format/depth/sampleCount and bind groups.\n  Recorded signature: ${t}\n  Actual signature: ${n}\n  Fix: re-record the bundle for this target → ${e} = bundle(gpu, { target: scene }, ...)\n  (re-recording is always your responsibility; the library only detects this).`;
}
function Tf(e, t) {
	return t.kind === "group-claim" ? `bundle '${e}' is stale: group ${t.group} of draw\n  '${t.drawLabel}' changed bind group after recording. Bundles freeze commands and bind groups.\n  Fix: re-record it → ${e} = bundle(gpu, { target: scene }, ...)\n  (re-recording is always your responsibility; the library only detects this).` : `bundle '${e}' is stale: binding \`${t.bindingName}\` (@group(${t.group}) @binding(${t.binding})) of draw\n  '${t.drawLabel}' changed resource after recording. Bundles freeze commands and bind groups.\n  Fix: re-record it → ${e} = bundle(gpu, { target: scene }, ...)\n  (re-recording is always your responsibility; the library only detects this).`;
}
function Ef(e, t) {
	return new I({
		code: "VGPU-R3-BUNDLE-STALE",
		message: t,
		where: `bundle '${e}' replay`
	});
}
var Df, Of, kf, Af, jf = t((() => {
	zi(), pf(), bf(), su(), L(), Nu(), Gu(), B(), Df = 1, Of = 0, kf = class {
		device;
		id;
		signature;
		gpu;
		#e;
		#t;
		#n = /* @__PURE__ */ new Set();
		#r = [];
		constructor(e, t, n) {
			this.device = e, this.id = t, this.signature = n, this.#t = Il(n);
		}
		record(e) {
			try {
				this.gpu = Ii(this.device, {
					label: this.id,
					colorFormats: this.signature.colors,
					depthStencilFormat: this.signature.depth,
					sampleCount: this.signature.sampleCount ?? 1,
					record: (t) => this.#a(e, t.gpu)
				});
			} catch (e) {
				throw this.#i(), e;
			}
			for (let e of this.#n) Gd(e, this);
		}
		get [Uu]() {
			return this;
		}
		markStale(e) {
			Of > 0 && !(e.kind === "binding-identity" && e.newIdentity.startsWith("destroyed:")) || (this.#e ??= e, this.#i());
		}
		assertReplayable(e) {
			let t = Il(Cf(e));
			if (this.#t !== t) throw Ef(this.id, wf(this.id, this.#t, t));
			if (this.#e) throw Ef(this.id, Tf(this.id, this.#e));
		}
		remember(e) {
			this.#n.add(e), this.#e || this.#r.push(Wd(e, (e) => this.markStale(e)));
		}
		#i() {
			for (let e of this.#r.splice(0)) e();
		}
		#a(e, t) {
			Of += 1;
			try {
				e(new Af(this, t));
			} finally {
				--Of;
			}
		}
	}, Af = class {
		bundle;
		encoder;
		constructor(e, t) {
			this.bundle = e, this.encoder = t;
		}
		draw(e, t = {}) {
			let n = e instanceof yf ? hf(e) : e;
			if (Kd(n)) throw Dn(this.bundle.id, n.label);
			if (qd(n)) throw Pn(this.bundle.id, n.label);
			this.bundle.remember(n), Xd(n, this.encoder, this.bundle.signature, t);
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/clock.js
function Mf(e) {
	return Nf(z(e, "clock"));
}
function Nf(e) {
	return e.service(Pf, (e) => {
		let t = cu(e), n = (t) => {
			if (e.disposed) throw ci(t);
			R(e.device, t);
		};
		return {
			get time() {
				return n("clock.time"), t.time;
			},
			get deltaTime() {
				return n("clock.deltaTime"), t.deltaTime;
			},
			get frameCount() {
				return n("clock.frameCount"), t.frameCount;
			},
			advance(e) {
				if (n("clock.advance"), typeof e != "number" || !Number.isFinite(e) || e < 0) throw Dr(e);
				t.advanceBy(e);
			}
		};
	});
}
var Pf, Ff = t((() => {
	fu(), Qr(), B(), L(), Xr(), Pf = Vr("clock");
}));
//#endregion
//#region node_modules/vgpu/dist/compute.js
function If(e, t, n = {}) {
	let r = z(e, "compute");
	return new zf(r.device, td(t), n, Zu(r).binds);
}
function Lf(e, t, n) {
	let r = zl(t, e.entryPoints, "compute", n, "compute");
	if (!r) throw F(`${t}.compute`, "The compute shader requires a @compute entry point.");
	return r;
}
var Rf, zf, Bf = t((() => {
	Ts(), As(), Os(), yl(), rl(), su(), L(), Qr(), B(), ed(), rd(), Ru(), Rf = 1, zf = class {
		device;
		source;
		opts;
		cache;
		id = Rf++;
		label;
		reflection;
		entryPoint;
		setCore;
		bindGroupLayouts;
		pipelineLayout;
		shaderModule;
		pipeline;
		#e;
		constructor(e, t, n = {}, r = Es()) {
			this.device = e, this.source = t, this.opts = n, this.cache = r, R(e, "Compute.constructor"), this.label = n.label ?? "compute", this.reflection = ws(t, `${this.label}.wgsl`);
			let i = Lf(this.reflection, this.label, n.entry);
			this.entryPoint = i.name;
			let { constants: a } = Vl(this.label, n.constants, this.reflection.overrides, "compute");
			this.bindGroupLayouts = qc(e, this.label, this.reflection, Gc(this.reflection.bindings, [i])), this.pipelineLayout = Jc(e, this.bindGroupLayouts), this.shaderModule = e.gpu.createShaderModule({
				label: `${this.label}.shader`,
				code: t
			}), this.pipeline = e.gpu.createComputePipeline({
				label: `${this.label}.pipeline`,
				layout: this.pipelineLayout,
				compute: {
					module: this.shaderModule,
					entryPoint: this.entryPoint,
					...a ? { constants: a } : {}
				}
			}), this.setCore = il({
				device: e,
				label: this.label,
				drawId: `compute:${this.id}`,
				reflection: this.reflection,
				bindGroupLayouts: this.bindGroupLayouts,
				cache: this.cache
			});
			let o = new Set(ks(i, "bindings", this.label).map((e) => `${e.group}:${e.binding}`));
			this.#e = this.reflection.bindings.filter((e) => e.kind === "buffer" && e.addressSpace === "storage" && o.has(`${e.group}:${e.binding}`)), n.set && this.set(n.set);
		}
		set(e) {
			return R(this.device, `${this.label}.set`), this.setCore.set(e), this;
		}
		dispatch(e, t, n) {
			R(this.device, `${this.label}.dispatch`);
			let r = typeof e == "object" && e ? this.#t(e, t, n) : void 0;
			this.#n();
			let i = this.setCore.bindGroups(), a = this.device.gpu.createCommandEncoder({ label: `${this.label}.encoder` }), o = a.beginComputePass({ label: `${this.label}.pass` });
			o.setPipeline(this.pipeline);
			for (let e of i) o.setBindGroup(e.group, e.bindGroup, e.offsets);
			r ? o.dispatchWorkgroupsIndirect(r.buffer, r.offset) : o.dispatchWorkgroups(e, t ?? 1, n ?? 1), o.end(), this.device.gpu.queue.submit([a.finish()]);
		}
		#t(e, t, n) {
			let r = `${this.label}.dispatch`;
			if (t !== void 0 || n !== void 0) throw Rn(this.label, "indirect cannot be combined with explicit workgroup counts in the same call; the GPU reads the counts from the buffer, so the CPU-side values would be ignored.", r);
			return Pu(this.label, r, e.indirect, "dispatchWorkgroupsIndirect");
		}
		#n() {
			if (!this.#e.length) return;
			let e = /* @__PURE__ */ new Map();
			for (let t of this.#e) {
				let n = this.setCore.bindingState(t.name);
				if (!n) continue;
				let r = Ds(n.identity);
				e.has(r) || e.set(r, []), e.get(r).push({
					identity: n.identity,
					writable: t.access !== "read"
				});
			}
			for (let t of e.values()) if (!(t.length < 2) && t.some((e) => e.writable)) throw Fr(`${this.label}.dispatch`);
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/frame.js
function Vf(e, t) {
	return Uf(z(e, "frame")).frame(t);
}
function Hf(e, t, n = {}) {
	return Uf(z(e, "frameLoop")).loop(t, n);
}
function Uf(e) {
	return e.service(tp, (e) => {
		let t = cu(e);
		return new ip(() => {
			let t = () => {}, n = new np(e.device, void 0, (t) => e.reportError(t), (t) => {
				e.trackDelivery(t);
			}, () => t());
			return t = e.own("scheduler", () => n.cancel()), n;
		}, () => t.tick(), (t) => e.own("scheduler", () => t.stop()));
	});
}
function Wf(e, t) {
	if (e.writesDepth()) throw Gn(`pass cannot encode draw '${e.label}': its depth state writes depth (the default is write: true). Give the draw depth: { write: false } (or depth: false to disable depth testing).`, "Use depth: { write: false } on the draw, or open the pass without depthReadOnly.", "FramePass.draw");
	if (kl(t.depth?.format)) {
		let t = e.stencilWritingOps();
		if (t.length) throw Gn(`pass cannot encode draw '${e.label}': its stencil ops can write (${t.join(", ")}), and the pass's stencil aspect is read-only too.`, "Use \"keep\" for those ops or stencil writeMask: 0, or open the pass without depthReadOnly.", "FramePass.draw");
	}
}
function Gf(e) {
	let t = zu(e);
	if (!t) throw TypeError("Invalid Effect instance: pass.draw() expects a Draw or an Effect created by this library.");
	return t;
}
function Kf() {
	throw new I({
		code: "VGPU-R3-BUNDLE-INVALID",
		message: "p.bundles() expected bundles created by bundle(gpu, { target }, cb).",
		where: "FramePass.bundles"
	});
}
function qf(e) {
	return qn(`FramePassOptions.timer received ${Zf(e)}; expected a TimerSpan from timer.span(name).`, "Create const passTimer = timer(gpu) once, then pass passTimer.span(\"name\") per pass.", "Frame.pass");
}
function Jf(e) {
	return Yn(`FramePassOptions.visibility received ${Zf(e)}; expected a Visibility from visibility(gpu).`, "Create const vis = visibility(gpu) once, then pass { target, visibility: vis } per pass.", "Frame.pass");
}
function Yf(e, t, n) {
	if (e === void 0) return;
	if (typeof e != "object" || !e || Array.isArray(e)) throw j(`received ${Zf(e)}; expected { x?, y?, width, height, minDepth?, maxDepth? }.`);
	let { x: r = 0, y: i = 0, width: a, height: o, minDepth: s = 0, maxDepth: c = 1 } = e;
	for (let [e, t] of [
		["x", r],
		["y", i],
		["width", a],
		["height", o],
		["minDepth", s],
		["maxDepth", c]
	]) if (typeof t != "number" || !Number.isFinite(t)) throw j(`${e} received ${Zf(t)}; expected a finite number.`);
	let l = t.maxTextureDimension2D, u = l * 2, d = `target is ${n[0]}x${n[1]}px, device maxTextureDimension2D is ${l}`;
	if (!(a >= 0 && a <= l)) throw j(`width ${a} is outside [0, ${l}] (${d}).`);
	if (!(o >= 0 && o <= l)) throw j(`height ${o} is outside [0, ${l}] (${d}).`);
	if (!(r >= -u && r + a <= u - 1)) throw j(`x ${r} with width ${a} is outside [${-u}, ${u - 1}] (${d}).`);
	if (!(i >= -u && i + o <= u - 1)) throw j(`y ${i} with height ${o} is outside [${-u}, ${u - 1}] (${d}).`);
	if (!(s >= 0 && s <= 1)) throw j(`minDepth ${s} is outside [0, 1].`);
	if (!(c >= 0 && c <= 1)) throw j(`maxDepth ${c} is outside [0, 1].`);
	if (!(s <= c)) throw j(`minDepth ${s} exceeds maxDepth ${c}.`);
	return {
		x: r,
		y: i,
		width: a,
		height: o,
		minDepth: s,
		maxDepth: c
	};
}
function Xf(e, t) {
	if (e === void 0) return;
	if (!Array.isArray(e) || e.length !== 4) throw Vn(`received ${Zf(e)}; expected [x, y, width, height].`);
	let [n, r, i, a] = e;
	for (let [e, t] of [
		["x", n],
		["y", r],
		["width", i],
		["height", a]
	]) if (typeof t != "number" || !Number.isInteger(t) || t < 0) throw Vn(`${e} received ${Zf(t)}; expected a non-negative integer.`);
	let [o, s] = t;
	if (n + i > o || r + a > s) throw Vn(`[${n}, ${r}, ${i}, ${a}] exceeds the target's current size ${o}x${s}px (x + width <= ${o}, y + height <= ${s}).`);
	return [
		n,
		r,
		i,
		a
	];
}
function Zf(e) {
	return typeof e == "string" ? `'${e}'` : Array.isArray(e) ? `[${e.map((e) => Zf(e)).join(", ")}]` : typeof e == "object" && e ? "an object" : String(e);
}
function Qf(e) {
	let t = e?.code;
	return t === "VGPU-DEVICE-DISPOSED" || t === "VGPU-DEVICE-LOST";
}
function $f(e, t, n) {
	return t === void 0 || n <= 0 || e - t >= n - ap;
}
var ep, tp, np, rp, ip, ap, op = t((() => {
	Us(), Gs(), Qr(), L(), Nu(), Pl(), Gu(), fu(), B(), Xr(), tp = Vr("frame-runner"), np = class {
		device;
		defaultTarget;
		errorSink;
		trackSettled;
		releaseLifecycle;
		done = Promise.resolve();
		#e;
		#t = [];
		#n = /* @__PURE__ */ new Set();
		#r = /* @__PURE__ */ new Set();
		#i = !1;
		#a = !1;
		#o = !1;
		static {
			ep = (e) => !(#i in e) || !e.#i && !e.#a;
		}
		constructor(e, t, n, r, i) {
			this.device = e, this.defaultTarget = t, this.errorSink = n, this.trackSettled = r, this.releaseLifecycle = i, R(e, "Frame.constructor"), this.#e = e.gpu.createCommandEncoder({ label: "vgpu.frame" });
		}
		pass(e, t) {
			if (this.#a) throw Ar("Frame.pass");
			R(this.device, "Frame.pass");
			let n = Ml(e), r = typeof t == "function" ? t : (e) => e.draw(t), i = n ? e : e.target ?? this.defaultTarget;
			if (!i) throw ir("Frame.pass");
			if (yu(i) && this.#i) throw br("Frame.pass");
			let a = n ? void 0 : e.clear, o = a === !1;
			if (o && i.sampleCount === 4) throw zn();
			let s = n ? void 0 : e.clearDepth;
			if (s !== void 0) {
				if (typeof s != "number" || !(s >= 0 && s <= 1)) throw Bn(s);
				if (o) throw Hn();
				if (!i.depth) throw Bn(s, "but the target has no depth attachment, so clearDepth would have no effect.", "Create the target with depth: true (or a depth format), or drop clearDepth.");
			}
			let c = n ? void 0 : e.clearStencil;
			if (c !== void 0) {
				if (typeof c != "number" || !Number.isInteger(c) || c < 0 || c > 4294967295) throw Un(`received ${String(c)}; expected an integer in [0, 0xFFFFFFFF] (WebGPU GPUStencilValue).`);
				if (o) throw Wn();
				let e = i.depth?.format;
				if (!kl(e)) throw Un(`received ${String(c)}, but the target's depth format ${e ? `"${e}"` : "(none)"} has no stencil aspect, so clearStencil would have no effect.`);
			}
			let l = n ? void 0 : e.depthReadOnly;
			if (l !== void 0 && typeof l != "boolean") throw Gn(`received ${Zf(l)}; expected a boolean.`, "Pass depthReadOnly: true to open the pass with a read-only depth attachment, or omit it.");
			if (l) {
				if (!i.depth) throw Gn("is set, but the target has no depth attachment, so there is nothing to make read-only.", "Create the target with depth: true (or a depth format), or drop depthReadOnly.");
				if (i.sampleCount === 4) throw Kn();
				if (s !== void 0) throw Gn("cannot be combined with clearDepth; a read-only depth aspect omits its load/store ops and is never cleared.", "Remove clearDepth, or drop depthReadOnly.");
				if (c !== void 0) throw Gn("cannot be combined with clearStencil; a read-only stencil aspect omits its load/store ops and is never cleared.", "Remove clearStencil, or drop depthReadOnly.");
			}
			let u = n ? void 0 : Yf(e.viewport, this.device.gpu.limits, i.size), d = n ? void 0 : Xf(e.scissor, i.size), f = [], p;
			try {
				let t = n || e.timer === void 0 ? void 0 : this.#d(e.timer, i, f, qf), m = (n || e.visibility === void 0 ? void 0 : this.#d(e.visibility, i, f, Jf))?.occlusion, h = i.renderPassDescriptor({
					clear: a === void 0 || a === !0 || a === !1 ? i.clearColor ?? Nl : a,
					preserve: o,
					clearDepth: s,
					clearStencil: c,
					depthReadOnly: l
				});
				t?.timestampWrites && (h = {
					...h,
					timestampWrites: t.timestampWrites
				}), m && (h = {
					...h,
					occlusionQuerySet: m.querySet
				}), p = this.#e.beginRenderPass(h), u && p.setViewport(u.x, u.y, u.width, u.height, u.minDepth, u.maxDepth), d && p.setScissorRect(d[0], d[1], d[2], d[3]), this.#o = !0;
				try {
					r(new rp(p, i, this.#t, l === !0, m, this, (e) => {
						if (R(this.device, e), this.#a) throw Ar(e);
					}));
				} finally {
					this.#o = !1;
				}
			} catch (e) {
				this.#l(f), q(this.#t), this.#t.length = 0, Ps(this.device);
				try {
					p?.end();
				} catch {}
				throw e;
			}
			Ws(this.device, p, this.#t);
		}
		submit() {
			if (this.#i || this.#a) return;
			R(this.device, "Frame.submit"), this.#i = !0, this.releaseLifecycle?.();
			for (let e of this.#u()) e.finalizeFrame(this, this.#e);
			let e, t = this.#t[0]?.context;
			t && js(this.device, t);
			try {
				e = this.#e.finish();
			} catch (e) {
				this.#s(this.#c());
				let n = t ? K(this.device) : void 0;
				q(this.#t), n && q([n]);
				let r = n?.context ?? t;
				if (!r) throw e;
				this.done = this.#p(this.#f(r.label, r.group, e));
				return;
			}
			if (t) {
				let e = K(this.device);
				e && (this.#t[0] = this.#t[0] ? Ls(e, this.#t[0]) : e);
			}
			let n = this.#t[0]?.context;
			n && js(this.device, n);
			try {
				this.device.gpu.queue.submit([e]);
			} catch (e) {
				this.#s(this.#c());
				let t = n ? K(this.device) : void 0;
				q(this.#t), t && q([t]);
				let r = t?.context ?? n;
				if (!r) throw e;
				this.done = this.#p(this.#f(r.label, r.group, e));
				return;
			}
			if (n) {
				let e = K(this.device);
				e && (this.#t[0] = this.#t[0] ? Ls(e, this.#t[0]) : e);
			}
			for (let e of this.#u()) e.frameSubmitted(this);
			this.#s(this.#r), this.done = this.#p(Is(this.device, this.#t, { errorSink: this.errorSink }));
		}
		cancel() {
			if (!this.#a) {
				if (this.#i) throw Mr("Frame.cancel");
				if (this.#o) throw jr("Frame.cancel");
				this.#a = !0, this.releaseLifecycle?.(), this.#s(this.#c()), this.#n.clear(), this.#r.clear(), q(this.#t), this.#t.length = 0;
			}
		}
		#s(e) {
			for (let t of [...e]) t.frameAbandoned(this);
		}
		#c() {
			return [...this.#n, ...this.#r];
		}
		#l(e) {
			for (let t of [...e]) this.#n.delete(t), this.#r.add(t);
		}
		#u() {
			return [...this.#n].filter((e) => !this.#r.has(e));
		}
		#d(e, t, n, r) {
			let i = Vu(e);
			if (!i) throw r(e);
			let a;
			try {
				a = i[Wu]({
					frame: this,
					device: this.device,
					target: t
				});
			} catch (e) {
				throw this.#l(this.#n), e;
			}
			return this.#n.add(a.owner), n.push(a.owner), a;
		}
		async #f(e, t, n) {
			await Fs(this.device), R(this.device, "Frame.validation");
			let r = wn(e, t, n);
			this.errorSink ? await this.errorSink(r) : console.error(r);
		}
		#p(e) {
			return this.trackSettled?.(e), e;
		}
	}, rp = class {
		encoder;
		target;
		validations;
		depthReadOnly;
		occlusionSource;
		frame;
		assertFrameOpen;
		#e = !1;
		constructor(e, t, n, r = !1, i, a, o) {
			this.encoder = e, this.target = t, this.validations = n, this.depthReadOnly = r, this.occlusionSource = i, this.frame = a, this.assertFrameOpen = o;
		}
		draw(e, t = {}) {
			this.assertFrameOpen?.("FramePass.draw");
			let n = Gf(e);
			this.depthReadOnly && Wf(n, this.target), n.encode(this.encoder, this.target, t, (e) => this.validations.push(e));
		}
		occlusion(e, t) {
			if (this.assertFrameOpen?.("FramePass.occlusion"), !this.occlusionSource) throw tr();
			if (this.#e) throw nr();
			let n = this.occlusionSource.beginQuery(e, this.frame);
			this.encoder.beginOcclusionQuery(n), this.#e = !0;
			try {
				typeof t == "function" ? t() : this.draw(t);
			} finally {
				this.#e = !1, this.encoder.endOcclusionQuery();
			}
		}
		bundles(...e) {
			if (this.assertFrameOpen?.("FramePass.bundles"), this.depthReadOnly) throw Gn("pass cannot replay bundles: bundle records bundles with writable depth/stencil, and WebGPU only executes read-only-recorded bundles in a read-only pass.", "Encode the draws directly with pass.draw(...) inside the depthReadOnly pass.", "FramePass.bundles");
			let t = e.map((e) => Bu(e) ?? Kf());
			for (let e of t) e.assertReplayable(this.target);
			this.encoder.executeBundles(t.map((e) => e.gpu));
		}
	}, ip = class {
		createFrame;
		advance;
		trackLoop;
		#e = !1;
		constructor(e, t, n) {
			this.createFrame = e, this.advance = t, this.trackLoop = n;
		}
		frame(e) {
			if (this.#e || hu()) throw Or();
			this.#e = !0, _u();
			try {
				this.advance();
				let t = this.createFrame();
				if (e) {
					try {
						e(t);
					} catch (e) {
						if (ep(t)) try {
							t.cancel();
						} catch {}
						throw e;
					}
					try {
						t.submit();
					} catch (e) {
						if (!Qf(e)) throw e;
					}
				}
				return t;
			} finally {
				vu(), this.#e = !1;
			}
		}
		loop(e, t = {}) {
			let n = !1, r = globalThis.requestAnimationFrame ?? ((e) => setTimeout(() => e(performance.now()), 16)), i = globalThis.cancelAnimationFrame ?? ((e) => clearTimeout(e)), a = t.fps && t.fps > 0 ? 1e3 / t.fps : 0, o, s = 0, c, l = () => {
				n = !0, i(s), c?.(), c = void 0;
			}, u = (t) => {
				if (!n) {
					if ($f(t, o, a)) {
						o = t;
						try {
							this.frame(e);
						} catch (e) {
							throw l(), e;
						}
					}
					n || (s = r(u));
				}
			};
			s = r(u);
			let d = { stop: l };
			return c = this.trackLoop?.(d), d;
		}
	}, ap = 1;
}));
//#endregion
//#region node_modules/vgpu/dist/target-offscreen.js
function sp(e) {
	let t = [];
	for (let n of e) try {
		n.destroy();
	} catch (e) {
		t.push(e);
	}
	if (t.length) throw t[0];
}
function cp(e, t) {
	return new lp(z(e, "target").device, t);
}
var lp, up = t((() => {
	k(), Pl(), B(), L(), Qr(), lp = class {
		device;
		resourceIdentity = ke("render-target");
		#e = new je();
		#t = /* @__PURE__ */ new Set();
		#n;
		#r;
		#i;
		#a = !1;
		#o = !1;
		options;
		constructor(e, t) {
			this.device = e, Tl(t, e), this.options = Object.freeze({
				...t,
				size: Object.freeze([...t.size]),
				...t.colors ? { colors: Object.freeze(t.colors.map((e) => Object.freeze({ ...e }))) } : {}
			}), this.#i = t.clearColor === void 0 ? Nl : bl(t.clearColor, "target.clearColor"), this.#n = this.options.size, this.#r = this.#l(this.#n);
		}
		get gpu() {
			return this.color.gpu;
		}
		get size() {
			return this.#n;
		}
		get texelSize() {
			return [1 / this.#n[0], 1 / this.#n[1]];
		}
		get color() {
			return this.#r.colors[0];
		}
		get colors() {
			return this.#r.colors;
		}
		get depth() {
			return this.#r.depth;
		}
		get format() {
			return Sl(this.options)[0]?.format ?? "rgba8unorm";
		}
		get clearColor() {
			return xl(this.#i);
		}
		set clearColor(e) {
			this.#i = bl(e, "target.clearColor");
		}
		get sampleCount() {
			return wl(this.options);
		}
		resize(e) {
			if (this.#s("Target.resize"), this.#o) throw new I({
				code: "VGPU-TARGET-RESIZE-REENTRANT",
				message: "Cannot resize a target from its replacement callbacks.",
				where: "Target.resize"
			});
			if (Tl({
				...this.options,
				size: e
			}, this.device), !jl(this.#n, e)) {
				this.#o = !0;
				try {
					let t = Object.freeze([...e]), n = this.#l(t), r = this.#r;
					this.#n = t, this.#r = n;
					try {
						this.#c();
					} finally {
						sp(r.all);
					}
				} finally {
					this.#o = !1;
				}
			}
		}
		onDestroy(e) {
			return this.#e.onDestroy(this, e);
		}
		onTexturesRecreated(e) {
			return this.#s("Target.onTexturesRecreated"), this.#t.add(e), () => {
				this.#t.delete(e);
			};
		}
		destroy() {
			if (!this.#a) {
				this.#a = !0;
				try {
					this.#e.emit(this);
				} finally {
					this.#t.clear(), sp(this.#r.all);
				}
			}
		}
		renderPassDescriptor(e = {}) {
			this.#s("Target.renderPassDescriptor");
			let { clear: t = [
				0,
				0,
				0,
				1
			], preserve: n, clearDepth: r, clearStencil: i, depthReadOnly: a } = e;
			return {
				colorAttachments: this.colors.map((e, r) => Dl(e, this.#r.msaaColors?.[r], t, n)),
				depthStencilAttachment: this.depth ? Ol(this.depth, n, r, i, a) : void 0
			};
		}
		#s(e) {
			if (this.#a) throw new I({
				code: "VGPU-TARGET-DESTROYED",
				message: `Target '${this.options.label ?? "target"}' is destroyed.`,
				where: e,
				fix: "Create a new target; destroyed targets cannot be resized or rendered."
			});
			R(this.device, e);
		}
		#c() {
			let e = [];
			for (let t of [...this.#t]) try {
				t();
			} catch (t) {
				e.push(t);
			}
			if (e.length) throw e[0];
		}
		#l(e) {
			let t = [], n = (e) => {
				let n = this.device.createTexture(e);
				return t.push(n), n;
			};
			try {
				let r = this.#u(e, n), i = this.sampleCount === 4 ? this.#d(e, n) : void 0, a = this.#f(e, n);
				return {
					colors: Object.freeze(r),
					msaaColors: i && Object.freeze(i),
					depth: a,
					all: t
				};
			} catch (e) {
				try {
					sp(t);
				} catch {}
				throw e;
			}
		}
		#u(e, t) {
			return Sl(this.options).map((n, r) => t({
				kind: "2d",
				size: e,
				format: n.format,
				usage: [
					"render_attachment",
					"texture_binding",
					"copy_src"
				],
				sampleCount: 1,
				label: this.options.label ? `${this.options.label}.color${r}.resolve` : void 0
			}));
		}
		#d(e, t) {
			return Sl(this.options).map((n, r) => t({
				kind: "2d",
				size: e,
				format: n.format,
				usage: ["render_attachment"],
				sampleCount: 4,
				label: this.options.label ? `${this.options.label}.color${r}` : void 0
			}));
		}
		#f(e, t) {
			let n = Cl(this.options);
			return n ? t({
				kind: "2d",
				size: e,
				format: n,
				usage: ["render_attachment", "texture_binding"],
				sampleCount: this.sampleCount,
				label: this.options.label ? `${this.options.label}.depth` : void 0
			}) : void 0;
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/storage.js
function dp(e, t, n = "read-write") {
	let r = z(e, "storage"), i = typeof n == "string" ? { access: n } : n, a = fp(r.device, t, i.access ?? "read-write", void 0, i.indirect ?? !1);
	return ui(r, a, (e) => e.destroy(), (e) => {
		a.onDestroy(e);
	});
}
function fp(e, t, n, r, i = !1) {
	return mp.create(e, t, n, r, i);
}
function pp(e) {
	if (e instanceof ArrayBuffer || ArrayBuffer.isView(e)) return e;
	throw TypeError("StorageBuffer.write() requires ArrayBuffer or ArrayBufferView.");
}
var mp, hp = t((() => {
	B(), mp = class e {
		size;
		access;
		buffer;
		constructor(e, t) {
			this.buffer = e, this.access = t, this.size = e.options.size;
		}
		static create(t, n, r, i, a = !1) {
			let o = a ? [
				"storage",
				"copy_dst",
				"copy_src",
				"indirect"
			] : [
				"storage",
				"copy_dst",
				"copy_src"
			], s = t.createBuffer({
				size: n,
				usage: o,
				label: i
			});
			return new e(s, r);
		}
		read() {
			return this.buffer.read(this.size);
		}
		write(e, t = 0) {
			this.buffer.write(pp(e), t);
		}
		get gpu() {
			return this.buffer.gpu;
		}
		get resourceIdentity() {
			return this.buffer.resourceIdentity;
		}
		onDestroy(e) {
			return this.buffer.onDestroy(e);
		}
		destroy() {
			this.buffer.destroy();
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/ping-pong.js
function gp(e, t, n, r = {}) {
	let i = z(e, "pingPong");
	return bp(i.device, t, n, r, (e) => vp(i, e));
}
function _p(e, t) {
	let n = z(e, "pingPongStorage");
	return xp(n.device, t, "read-write", (e) => yp(n, e));
}
function vp(e, t) {
	return ui(e, t, (e) => e.destroy(), (e) => {
		t.onDestroy(e);
	});
}
function yp(e, t) {
	return ui(e, t, (e) => e.destroy(), (e) => {
		t.onDestroy(e);
	});
}
function bp(e, t, n, r = {}, i = Sp) {
	let a = [Cp(t), Cp(n)], o = {
		...r,
		size: a
	}, s = i(new lp(e, wp(o, r.label, "ping")));
	try {
		let t = i(new lp(e, wp(o, r.label, "pong")));
		return new Tp([s, t]);
	} catch (e) {
		try {
			s.destroy();
		} catch {}
		throw e;
	}
}
function xp(e, t, n = "read-write", r = Sp) {
	let i = r(fp(e, t, n, void 0)), a = r(fp(e, t, n, void 0));
	return new Ep([i, a]);
}
function Sp(e) {
	return e;
}
function Cp(e) {
	return Math.max(1, Math.floor(e));
}
function wp(e, t, n) {
	return t ? {
		...e,
		label: `${t}.${n}`
	} : e;
}
var Tp, Ep, Dp = t((() => {
	B(), up(), hp(), Tp = class {
		halves;
		#e = 0;
		constructor(e) {
			this.halves = e;
		}
		get read() {
			return this.halves[this.#e];
		}
		get write() {
			return this.halves[this.#e ^ 1];
		}
		swap() {
			this.#e ^= 1;
		}
	}, Ep = class {
		halves;
		#e = 0;
		constructor(e) {
			this.halves = e;
		}
		get read() {
			return this.halves[this.#e];
		}
		get write() {
			return this.halves[this.#e ^ 1];
		}
		swap() {
			this.#e ^= 1;
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/texture.js
function Op(e, t) {
	let n = z(e, "texture"), r = n.device.createTexture(t);
	return ui(n, r, (e) => e.destroy(), (e) => {
		r.onDestroy(e);
	});
}
var kp = t((() => {
	B();
}));
//#endregion
//#region node_modules/vgpu/dist/query-ring.js
function Ap(e, t) {
	return new Mp(e, t);
}
var jp, Mp, Np = t((() => {
	L(), jp = globalThis.GPUMapMode?.READ ?? 1, Mp = class {
		querySet;
		capacity;
		#e;
		#t;
		#n;
		#r;
		#i;
		#a = 0;
		#o = 0;
		#s = -1;
		#c;
		#l = 0;
		#u = 0;
		#d = !1;
		#f = !1;
		constructor(e, t) {
			this.capacity = t.capacity;
			let n = t.label ?? "vgpu.query-ring";
			this.#e = n;
			let r = t.capacity * 8;
			this.querySet = e.gpu.createQuerySet({
				type: t.type,
				count: t.capacity,
				label: n
			}), this.#t = e.createBuffer({
				size: r,
				usage: ["query_resolve", "copy_src"],
				label: `${n}.resolve`
			}), this.#n = Array.from({ length: t.depth ?? 3 }, (t, i) => ({
				buffer: e.createBuffer({
					size: r,
					usage: ["map_read", "copy_dst"],
					label: `${n}.staging${i}`
				}),
				mapPending: !1,
				retired: !1
			})), this.#r = t.trackSettled, this.#i = t.errorSink;
		}
		encodeResolve(e, t) {
			if (this.#c = void 0, this.#d || t <= 0) return !1;
			let n = this.#p();
			if (!n) return !1;
			let r = Math.min(t, this.capacity);
			return e.resolveQuerySet(this.querySet, 0, r, this.#t.gpu, 0), e.copyBufferToBuffer(this.#t.gpu, 0, n.buffer.gpu, 0, r * 8), this.#c = {
				staging: n,
				usedCount: r,
				seq: this.#o
			}, this.#o += 1, this.#a += 1, !0;
		}
		onSubmitted(e) {
			let t = this.#c;
			if (this.#c = void 0, !t) return;
			t.staging.mapPending = !0, this.#l += 1;
			let n = t.staging.buffer.gpu.mapAsync(jp).then(() => {
				let n = this.#m(t);
				t.seq <= this.#s || (this.#s = t.seq, e(n));
			}).catch((e) => {
				this.#_(e);
			}).finally(() => {
				t.staging.mapPending = !1, --this.#l, this.#g();
			});
			this.#r?.(n);
		}
		#p() {
			for (let e = 0; e < this.#n.length; e += 1) {
				let e = this.#n[this.#a % this.#n.length];
				if (!e.retired) return e.mapPending ? void 0 : e;
				this.#a += 1;
			}
		}
		#m(e) {
			let t;
			try {
				t = new BigUint64Array(e.staging.buffer.gpu.getMappedRange().slice(0, e.usedCount * 8));
			} catch (t) {
				throw this.#h(e.staging), t;
			}
			try {
				e.staging.buffer.gpu.unmap();
			} catch (t) {
				throw e.staging.retired = !0, t;
			}
			return t;
		}
		#h(e) {
			try {
				e.buffer.gpu.unmap();
			} catch {
				e.retired = !0;
			}
		}
		retain() {
			this.#u += 1;
		}
		release() {
			this.#u > 0 && --this.#u, this.#g();
		}
		dispose() {
			this.#d || (this.#d = !0, this.#c = void 0, this.#g());
		}
		#g() {
			if (!(!this.#d || this.#f || this.#l > 0 || this.#u > 0)) {
				this.#f = !0, this.querySet.destroy(), this.#t.dispose();
				for (let e of this.#n) e.buffer.dispose();
			}
		}
		#_(e) {
			let t = kr(this.#e, e), n = this.#i;
			if (!n) {
				console.error(t);
				return;
			}
			try {
				Promise.resolve(n(t)).catch((e) => {
					console.error(e);
				});
			} catch (e) {
				console.error(e);
			}
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/timer.js
function Pp(e) {
	let t = z(e, "timer");
	return li(t, (e) => new Vp(t.device, e));
}
function Fp(e) {
	let t = 1;
	for (; t < e;) t *= 2;
	return t;
}
function Ip(e) {
	return typeof e == "string" ? `'${e}'` : String(e);
}
var Lp, Rp, zp, Bp, Vp, Hp = t((() => {
	L(), Gu(), B(), Np(), Lp = 4096, Rp = Lp / 2, zp = 1 / 1e6, Bp = class {
		name;
		owner;
		constructor(e, t) {
			this.name = e, this.owner = t;
		}
		[Wu](e) {
			return {
				owner: this.owner,
				timestampWrites: this.owner.attachSpan(this, e.frame, e.device)
			};
		}
	}, Vp = class {
		#e;
		#t;
		#n = /* @__PURE__ */ new Map();
		#r = /* @__PURE__ */ new Set();
		#i;
		#a = 64;
		#o = 64;
		#s;
		#c = [];
		#l = /* @__PURE__ */ new Set();
		#u = 0;
		#d;
		#f = 0;
		#p = -1;
		#m = /* @__PURE__ */ new Map();
		#h = !1;
		constructor(e, t = {}) {
			if (!e.features.has("timestamp-query")) throw qn("timer(gpu) needs the \"timestamp-query\" device feature — request it at init: init({ requiredFeatures: [\"timestamp-query\"] }).", "Pass init({ requiredFeatures: [\"timestamp-query\"] }) on an adapter that supports it; gate optional timing on gpu.device.features.has(\"timestamp-query\").");
			this.#e = e, this.#t = t, this.#i = this.#b();
		}
		span(e) {
			if (this.#x("Timer.span"), typeof e != "string" || e.length === 0) throw qn(`span name received ${Ip(e)}; expected a non-empty string.`, "Name each timed pass, e.g. timer.span(\"shadows\").", "Timer.span");
			let t = this.#n.get(e);
			return t || (t = new Bp(e, this), this.#n.set(e, t)), t;
		}
		onResults(e) {
			return this.#x("Timer.onResults"), this.#r.add(e), () => {
				this.#r.delete(e);
			};
		}
		dispose() {
			this.#h || (this.#h = !0, this.#r.clear(), this.#n.clear(), this.#l.clear(), this.#c = [], this.#d = void 0, this.#i.dispose(), this.#t.onDispose?.());
		}
		attachSpan(e, t, n) {
			if (this.#x("Frame.pass"), n !== this.#e) throw qn(`span '${e.name}' belongs to a timer created on a different gpu; timestamp queries cannot cross devices.`, "Create one timer(gpu) per gpu and use its spans only with that gpu's frames.", "Frame.pass");
			if (t !== this.#s && this.#g(t), this.#l.has(e.name)) throw qn(`duplicate span '${e.name}' in one frame; each result key holds a single begin/end pair per frame.`, `Use one timer.span(name) per pass per frame, e.g. timer.span("${e.name}-2") for the second pass.`, "Frame.pass");
			if (this.#l.size >= Rp) throw Jn(Rp, Lp);
			this.#l.add(e.name);
			let r = this.#l.size * 2 - 2;
			if (this.#o < r + 2 && (this.#o = r + 2), !(r + 2 > this.#i.capacity)) return this.#u = r + 2, this.#c.push({
				name: e.name,
				begin: r
			}), this.#v(t), {
				querySet: this.#i.querySet,
				beginningOfPassWriteIndex: r,
				endOfPassWriteIndex: r + 1
			};
		}
		finalizeFrame(e, t) {
			this.#d = void 0, !(this.#h || e !== this.#s || this.#u === 0) && this.#i.encodeResolve(t, this.#u) && (this.#d = [...this.#c]);
		}
		frameSubmitted(e) {
			if (this.#y(e), e !== this.#s || this.#h) return;
			let t = this.#d;
			if (this.#d = void 0, !t || t.length === 0) return;
			let n = this.#f;
			this.#f += 1, this.#i.onSubmitted((e) => {
				n <= this.#p || (this.#p = n, this.#_(t, e));
			});
		}
		frameAbandoned(e) {
			e === this.#s && (this.#d = void 0), this.#y(e);
		}
		#g(e) {
			this.#o > this.#i.capacity && (this.#i.dispose(), this.#a = Math.min(Lp, Fp(this.#o)), this.#i = this.#b()), this.#o = this.#a, this.#s = e, this.#c = [], this.#l.clear(), this.#u = 0;
		}
		#_(e, t) {
			let n = {};
			for (let { name: r, begin: i } of e) {
				let e = t[i] ?? 0n, a = t[i + 1] ?? 0n;
				n[r] = a > e ? Number(a - e) * zp : 0;
			}
			let r = Object.freeze(n);
			for (let e of [...this.#r]) try {
				e(r);
			} catch (e) {
				console.error(e);
			}
		}
		#v(e) {
			this.#m.has(e) || (this.#m.set(e, this.#i), this.#i.retain());
		}
		#y(e) {
			let t = this.#m.get(e);
			t && (this.#m.delete(e), t.release());
		}
		#b() {
			return Ap(this.#e, {
				type: "timestamp",
				capacity: this.#a,
				label: "vgpu.timer",
				trackSettled: this.#t.trackSettled,
				errorSink: this.#t.errorSink
			});
		}
		#x(e) {
			if (this.#h) throw qn("the timer is disposed.", "Create a new timer with timer(gpu).", e);
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/uniforms-layout.js
function Up(e) {
	return JSON.stringify(Gp(e));
}
function Wp(e, t = {}) {
	return e.members?.length ? Jp(e.members, t.abbreviated === !0) : e.element ? Yp(e) : Zp(e.type);
}
function Gp(e) {
	return {
		type: qp(e.type),
		align: e.align,
		size: e.size,
		stride: e.stride,
		members: e.members?.map(Kp),
		element: e.element ? Gp(e.element) : void 0
	};
}
function Kp(e) {
	return {
		name: e.name,
		offset: e.offset,
		align: e.align,
		size: e.size,
		explicitAlign: e.explicitAlign,
		explicitSize: e.explicitSize,
		type: qp(e.type),
		layout: Gp(e.layout)
	};
}
function qp(e) {
	switch (e.kind) {
		case "scalar": return { scalar: e.name };
		case "vector": return {
			vector: e.width,
			element: qp(e.element)
		};
		case "matrix": return {
			matrix: [e.columns, e.rows],
			element: qp(e.element)
		};
		case "array": return {
			array: qp(e.element),
			count: e.count ?? e.countExpression
		};
		case "atomic": return { atomic: qp(e.element) };
		default: return e.kind;
	}
}
function Jp(e, t) {
	let n = t ? e.slice(0, 1) : e, r = t && e.length > 1 ? ", ..." : "";
	return `{ ${n.map(Xp).join(", ")}${r} }`;
}
function Yp(e) {
	let t = em(e.type), n = t === void 0 ? "" : `, ${t}`;
	return `array<${Wp(e.element)}${n}>`;
}
function Xp(e) {
	return `${e.name}: ${Wp(e.layout)}`;
}
function Zp(e) {
	switch (e.kind) {
		case "scalar": return e.name;
		case "vector": return `vec${e.width}${$p(e.element)}`;
		case "matrix": return `mat${e.columns}x${e.rows}${$p(e.element)}`;
		case "array": return Qp(e);
		case "identifier": return e.name;
		case "atomic": return `atomic<${Zp(e.element)}>`;
		default: return e.kind;
	}
}
function Qp(e) {
	let t = e.count ?? e.countExpression, n = t === void 0 ? "" : `, ${t}`;
	return `array<${Zp(e.element)}${n}>`;
}
function $p(e) {
	return e.kind === "scalar" ? e.name === "bool" ? "b" : e.name.slice(0, 1) : "";
}
function em(e) {
	return e.kind === "array" ? e.count ?? e.countExpression : void 0;
}
var tm = t((() => {}));
//#endregion
//#region node_modules/vgpu/dist/uniforms.js
function nm(e, t) {
	let n = z(e, "uniforms");
	return ui(n, new fm(n.device, t), (e) => e.destroy());
}
function rm(e) {
	if (e.bindingLayout?.kind !== "buffer") throw F("uniforms", `Binding '${e.name}' does not accept shared uniforms; the shader reflected ${e.bindingLayout?.kind ?? "none"}.`);
}
function im(e) {
	if (!e.layout) throw F("uniforms", `Binding '${e.name}' does not expose a host-shareable layout.`);
	if (e.layout.size === void 0) throw F("uniforms", `Binding '${e.name}' has a runtime-sized layout; it cannot be shared.`);
	return e.layout;
}
function am(e, t) {
	for (let [n, r] of Object.entries(t)) sm(n) || (um(r) && um(e[n]) ? am(e[n], r) : e[n] = cm(r));
}
function om(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) sm(n) || (t[n] = cm(r));
	return t;
}
function sm(e) {
	return e === "__proto__" || e === "constructor" || e === "prototype";
}
function cm(e) {
	return Array.isArray(e) ? e.map(cm) : ArrayBuffer.isView(e) ? lm(e) : um(e) ? om(e) : e;
}
function lm(e) {
	return e instanceof Float32Array || e instanceof Uint32Array || e instanceof Int32Array ? e.slice() : e;
}
function um(e) {
	return typeof e == "object" && !!e && !Array.isArray(e) && !ArrayBuffer.isView(e);
}
function dm(e) {
	return e === "storage" ? "storage" : "uniform";
}
var fm, pm = t((() => {
	B(), si(), L(), Wc(), tm(), Qr(), fm = class {
		device;
		#e;
		#t;
		#n;
		constructor(e, t) {
			this.device = e, this.#e = om(t);
		}
		get buffer() {
			return this.#n;
		}
		get gpu() {
			return this.#n?.gpu;
		}
		get size() {
			return this.#t?.layout.size;
		}
		set(e) {
			let t = om(this.#e);
			if (am(t, e), this.#t && this.#n) {
				let e = vc(this.#t.layout, t);
				this.#n.write(e, 0);
			}
			this.#e = t;
		}
		[ai](e, t) {
			rm(e);
			let n = this.#r(e, t), r = this.#o();
			return Zr(r, `${t}.set`), {
				resource: {
					buffer: r.gpu,
					offset: 0,
					size: n.layout.size
				},
				identity: r.resourceIdentity,
				unsubscribe: (e) => r.onDestroy(e)
			};
		}
		#r(e, t) {
			let n = im(e), r = dm(e.addressSpace);
			return this.#t ? (this.#a(e, n, r, t), this.#t) : this.#i(e, n, r, t);
		}
		#i(e, t, n, r) {
			let i = vc(t, this.#e), a = {
				layout: t,
				layoutSignature: Up(t),
				layoutText: Wp(t),
				sourceHint: r,
				bindingName: e.name,
				addressSpace: n
			}, o = this.device.createBuffer({
				size: t.size,
				usage: n === "storage" ? ["storage", "copy_dst"] : ["uniform", "copy_dst"],
				label: `${e.name}.sharedUniform`
			});
			try {
				o.write(i, 0);
			} catch (e) {
				throw o.destroy(), e;
			}
			return this.#t = a, this.#n = o, a;
		}
		#a(e, t, n, r) {
			let i = this.#t;
			if (i.addressSpace !== n) throw F("uniforms", `shared uniforms '${i.bindingName}' already adopted address space ${i.addressSpace}; '${e.name}' uses ${n}.`);
			if (Up(t) !== i.layoutSignature) throw Ir({
				bindingName: i.bindingName,
				adoptedLayout: i.layoutText,
				adoptedSource: i.sourceHint,
				incomingLayout: Wp(t, { abbreviated: !0 }),
				incomingSource: r
			});
		}
		#o() {
			if (!this.#n) throw F("uniforms", "shared uniforms have not adopted a layout yet.");
			return this.#n;
		}
		destroy() {
			this.#n?.destroy();
		}
	};
}));
//#endregion
//#region node_modules/vgpu/dist/visibility.js
function mm(e, t = {}) {
	let n = z(e, "visibility");
	return li(n, (e) => new ym(n.device, t, () => cu(n).frameCount, e));
}
function hm(e) {
	return typeof e == "string" ? `'${e}'` : String(e);
}
var gm, _m, vm, ym, bm = t((() => {
	L(), Gu(), fu(), B(), Np(), gm = 4096, _m = 64, vm = class {
		label;
		owner;
		#e = "unknown";
		#t;
		#n = 0;
		#r = !1;
		constructor(e, t) {
			this.label = e, this.owner = t;
		}
		get hidden() {
			return this.#e === "hidden";
		}
		get state() {
			return this.#e;
		}
		get age() {
			return this.#t === void 0 ? Infinity : this.owner.currentFrame() - this.#t;
		}
		reset() {
			if (this.#r) throw $n("query handle", "VisibilityQuery.reset");
			this.#e = "unknown", this.#t = void 0, this.#n += 1;
		}
		dispose() {
			this.#r || (this.#r = !0, this.#e = "unknown", this.#t = void 0, this.owner.releaseLabel(this));
		}
		get disposed() {
			return this.#r;
		}
		get generation() {
			return this.#n;
		}
		applyResult(e, t, n) {
			this.#r || t !== this.#n || (this.#e = e === 0n ? "hidden" : "visible", this.#t = n);
		}
	}, ym = class {
		#e;
		#t;
		#n;
		#r;
		capacity;
		#i = /* @__PURE__ */ new Map();
		#a;
		#o = [];
		#s = /* @__PURE__ */ new Set();
		#c;
		#l = /* @__PURE__ */ new Map();
		#u = !1;
		constructor(e, t, n, r = {}) {
			let i = t.capacity ?? _m;
			if (typeof i != "number" || !Number.isInteger(i) || i < 1 || i > gm) throw Xn(i, gm);
			this.#e = e, this.#t = n, this.#n = r, this.capacity = i, this.#r = Ap(e, {
				type: "occlusion",
				capacity: i,
				label: "vgpu.visibility",
				trackSettled: r.trackSettled,
				errorSink: r.errorSink
			});
		}
		query(e) {
			if (this.#m("Visibility.query"), typeof e != "string" || e.length === 0) throw Yn(`query label received ${hm(e)}; expected a non-empty string.`, "Label each queried object, e.g. vis.query(\"statue\").", "Visibility.query");
			if (this.#i.has(e)) throw Qn(e);
			let t = new vm(e, this);
			return this.#i.set(e, t), t;
		}
		reset() {
			this.#m("Visibility.reset");
			for (let e of this.#i.values()) e.reset();
		}
		dispose() {
			this.#u || (this.#u = !0, this.#i.clear(), this.#o = [], this.#s.clear(), this.#c = void 0, this.#r.dispose(), this.#n.onDispose?.());
		}
		get disposed() {
			return this.#u;
		}
		currentFrame() {
			return this.#t();
		}
		releaseLabel(e) {
			this.#i.get(e.label) === e && this.#i.delete(e.label);
		}
		get querySet() {
			return this.#r.querySet;
		}
		[Wu](e) {
			if (!e.target.depth) throw er();
			return this.attachFrame(e.frame, e.device), {
				owner: this,
				occlusion: {
					querySet: this.querySet,
					beginQuery: (e, t) => this.beginQuery(e, t)
				}
			};
		}
		attachFrame(e, t) {
			if (this.#m("Frame.pass"), t !== this.#e) throw Yn("the visibility instance belongs to a different gpu; occlusion queries cannot cross devices.", "Create one visibility(gpu) per gpu and use it only with that gpu's frames.", "Frame.pass");
			e !== this.#a && this.#d(e), this.#f(e);
		}
		beginQuery(e, t) {
			if (this.#m("FramePass.occlusion"), !(e instanceof vm)) throw Yn(`occlusion() received ${hm(e)}; expected a VisibilityQuery from vis.query(label).`, "Create const q = vis.query(\"label\") once from the pass's visibility instance, then p.occlusion(q, body).", "FramePass.occlusion");
			if (e.owner !== this) throw Yn(`query '${e.label}' belongs to a different visibility instance than the one this pass was opened with.`, "Use handles from the same visibility(gpu) instance passed as the pass's visibility option.", "FramePass.occlusion");
			if (e.disposed) throw $n("query handle", "FramePass.occlusion");
			if (t !== this.#a) throw Yn("the pass is not part of the current frame; occlusion() must run inside the frame that opened the pass.", "Encode occlusion scopes inside the pass callback of the current frame(gpu).", "FramePass.occlusion");
			if (this.#s.has(e)) throw rr(e.label);
			let n = this.#o.length;
			if (n >= this.capacity) throw Zn(this.capacity);
			return this.#s.add(e), this.#o.push({
				query: e,
				generation: e.generation
			}), n;
		}
		finalizeFrame(e, t) {
			this.#c = void 0, !(this.#u || e !== this.#a || this.#o.length === 0) && this.#r.encodeResolve(t, this.#o.length) && (this.#c = [...this.#o]);
		}
		frameSubmitted(e) {
			if (this.#p(e), e !== this.#a || this.#u) return;
			let t = this.#c;
			this.#c = void 0, t && t.length !== 0 && this.#r.onSubmitted((e) => {
				if (this.#u) return;
				let n = this.#t();
				for (let r = 0; r < t.length; r++) {
					let i = t[r], a = e[r];
					a !== void 0 && i.query.applyResult(a, i.generation, n);
				}
			});
		}
		frameAbandoned(e) {
			e === this.#a && (this.#c = void 0), this.#p(e);
		}
		#d(e) {
			this.#a = e, this.#o = [], this.#s.clear();
		}
		#f(e) {
			this.#l.has(e) || (this.#l.set(e, this.#r), this.#r.retain());
		}
		#p(e) {
			let t = this.#l.get(e);
			t && (this.#l.delete(e), t.release());
		}
		#m(e) {
			if (this.#u) throw $n("visibility", e);
		}
	};
})), xm = /* @__PURE__ */ n({
	Geometry: () => Oi,
	Uniform: () => Pi,
	VGPUError: () => I,
	bundle: () => xf,
	clock: () => Mf,
	compute: () => If,
	draw: () => id,
	effect: () => mf,
	frame: () => Vf,
	frameLoop: () => Hf,
	geometry: () => di,
	init: () => Sm,
	initFromDevice: () => $r,
	isShaderFunctionExport: () => Je,
	pingPong: () => gp,
	pingPongStorage: () => _p,
	sampler: () => Ku,
	storage: () => dp,
	surface: () => pu,
	target: () => cp,
	texture: () => Op,
	timer: () => Pp,
	uniforms: () => nm,
	visibility: () => mm
});
function Sm(e) {
	return Wr("browser", e);
}
var Cm = t((() => {
	ri(), ni(), Mi(), L(), Fi(), Qe(), jf(), Ff(), Bf(), pf(), bf(), op(), Dp(), Xu(), hp(), Nu(), up(), kp(), Hp(), pm(), bm();
})), wm = .325, Tm = .1, Em = 1e3 / 60 - 2, Dm = "(max-width: 767px)";
function Om({ canvas: e }) {
	let t = me(), n = {
		centerX: t.centerX,
		centerY: t.centerY,
		cameraRoll: t.cameraRoll,
		mouseYaw: t.mouseYaw,
		centerFade: t.centerFade
	}, r = window.matchMedia(Dm), i = () => {
		Object.assign(t, r.matches ? {
			centerX: 0,
			centerY: 0,
			cameraRoll: 0,
			mouseYaw: 0,
			centerFade: 1
		} : n);
	};
	i();
	let a = Math.min(Math.max(window.devicePixelRatio, 1), 2) / 2;
	t.bloom.radius *= a, t.bloom.strength *= a;
	let o = !1, s, c, l, u, d, f, p, m, h = typeof document > "u" || !document.hidden, g = !0, _ = !1, v = 0, y, ee = 0, b, x = !0, S = 0, C = 0, w, ie = () => {
		i(), x = !0;
	};
	r.addEventListener("change", ie);
	let ae = (e) => {
		if (e.pointerType !== "mouse") return;
		let t = Math.max(window.innerWidth, 1);
		S = Math.min(1, Math.max(-1, e.clientX / t * 2 - 1));
	}, fe = () => {
		S = 0;
	}, pe = (e) => {
		e.relatedTarget === null && fe();
	}, he = () => {
		document.hidden && fe(), h = !document.hidden, ge();
	};
	function ge() {
		if (!_ || !c || !s) return;
		let e = !o && h && g;
		e !== !!f && (e ? (y = void 0, w = void 0, f = _e(s, c)) : (f?.stop(), f = void 0));
	}
	function _e(e, t) {
		let n = !1, r, i = (o) => {
			if (!n) {
				if (r === void 0 || o - r >= Em) {
					r = o;
					try {
						e.frame(t, E);
					} catch (e) {
						we(e);
					}
				}
				n || (a = requestAnimationFrame(i));
			}
		}, a = requestAnimationFrame(i);
		return { stop() {
			n = !0, cancelAnimationFrame(a);
		} };
	}
	let T = (e) => (v += y === void 0 ? 0 : Math.max(0, (e - y) / 1e3), y = e, v), E = (e) => {
		if (o || !u || !d || !l) return;
		let n = km(), r = x;
		x = !1, r && se(u, d, t), ce(u, d, t, T(n), ve(n)), de(e, u, d, l, r);
	}, ve = (e) => {
		if (t.mouseYaw <= 0) return C = 0, w = e, 0;
		let n = w === void 0 ? 0 : Math.min(Math.max((e - w) / 1e3, 0), Tm);
		w = e;
		let r = S * Math.max(0, t.mouseYaw);
		return C += (r - C) * (1 - Math.exp(-n / wm)), C;
	}, ye = () => {
		ee = 0;
		let e = b;
		if (b = void 0, !o && e && c && s && u && d && l) try {
			let n = d, r = ne(s, c, [Math.max(1, Math.round(e.width)), Math.max(1, Math.round(e.height))]);
			try {
				oe(u, r), le(u, r, t);
			} catch (e) {
				throw re(r), e;
			}
			d = r, re(n), x = !0;
		} catch (e) {
			we(e);
		}
	}, be = (e) => {
		o || e.width <= 0 || e.height <= 0 || (b = e, ee ||= requestAnimationFrame(ye));
	}, xe = () => {
		be({
			width: e.clientWidth,
			height: e.clientHeight
		});
	}, Se = () => {
		o || (o = !0, f?.stop(), ee && cancelAnimationFrame(ee), p?.disconnect(), m?.disconnect(), typeof window < "u" && (r.removeEventListener("change", ie), window.removeEventListener("pointermove", ae), window.removeEventListener("pointerout", pe), window.removeEventListener("blur", fe), document.removeEventListener("visibilitychange", he)), c?.dispose());
	}, Ce = async () => {
		let n = await Promise.resolve().then(() => (Cm(), xm)), { init: r } = n;
		if (o) return;
		let i = await r();
		if (o) {
			i.dispose();
			return;
		}
		c = i, s = n, l = n.surface(c, e, { dpr: 1 }), u = te(n, c), d = ne(n, c, l.size), se(u, d, t), ce(u, d, t, v, C), oe(u, d), le(u, d, t), await ue(u, d, l), !o && (p = typeof ResizeObserver > "u" ? void 0 : new ResizeObserver(xe), p?.observe(e), window.addEventListener("pointermove", ae, { passive: !0 }), window.addEventListener("pointerout", pe, { passive: !0 }), window.addEventListener("blur", fe), document.addEventListener("visibilitychange", he), typeof IntersectionObserver < "u" && (m = new IntersectionObserver((e) => {
			g = e[e.length - 1]?.isIntersecting ?? g, ge();
		}, { threshold: 0 }), m.observe(e)), xe(), _ = !0, h = !document.hidden, ge());
	};
	function we(e) {
		throw Se(), e;
	}
	return {
		ready: Ce().catch((e) => {
			o || we(e);
		}),
		dispose: Se
	};
}
function km() {
	return typeof performance > "u" ? Date.now() : performance.now();
}
//#endregion
//#region fft-ocean/bloom-blur.wgsl
Cm();
var Am = {
	version: 1,
	wgsl: "// Coefficients after each level's canonical radius are zero, so one fixed\n// 22-tap loop reproduces front's 6/10/14/18/22 specialized pipelines.\nconst KERNEL_RADIUS: u32 = 22u;\nstruct BlurUniforms {\n  direction: vec2f,\n  invSize: vec2f,\n  gaussianCoefficients0: vec4f,\n  gaussianCoefficients1: vec4f,\n  gaussianCoefficients2: vec4f,\n  gaussianCoefficients3: vec4f,\n  gaussianCoefficients4: vec4f,\n  gaussianCoefficients5: vec4f,\n};\n@group(0) @binding(0) var<uniform> uniforms: BlurUniforms;\n@group(0) @binding(1) var colorTexture: texture_2d<f32>;\n@group(0) @binding(2) var linearSampler: sampler;\n\nfn coefficient(i: u32) -> f32 {\n  let packed = array<vec4f, 6>(\n    uniforms.gaussianCoefficients0,\n    uniforms.gaussianCoefficients1,\n    uniforms.gaussianCoefficients2,\n    uniforms.gaussianCoefficients3,\n    uniforms.gaussianCoefficients4,\n    uniforms.gaussianCoefficients5\n  );\n  return packed[i / 4u][i % 4u];\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {\n  // UnrealBloomPass._getSeparableBlurMaterial @ three 0.184.0.\n  var weightSum = coefficient(0u);\n  var diffuseSum = textureSample(colorTexture, linearSampler, uv).rgb * weightSum;\n  for (var i = 1u; i < KERNEL_RADIUS; i = i + 1u) {\n    let x = f32(i);\n    let w = coefficient(i);\n    let uvOffset = uniforms.direction * uniforms.invSize * x;\n    let sample1 = textureSample(colorTexture, linearSampler, uv + uvOffset).rgb;\n    let sample2 = textureSample(colorTexture, linearSampler, uv - uvOffset).rgb;\n    diffuseSum = diffuseSum + (sample1 + sample2) * w;\n  }\n  return vec4f(diffuseSum, 1.0);\n}\n",
	functionExports: []
}, jm = {
	version: 1,
	wgsl: "struct BrightUniforms {\n  luminosityThreshold: f32,\n  smoothWidth: f32,\n  _pad0: vec2f,\n};\n@group(0) @binding(0) var<uniform> uniforms: BrightUniforms;\n@group(0) @binding(1) var tDiffuse: texture_2d<f32>;\n@group(0) @binding(2) var linearSampler: sampler;\n\nfn luminance(rgb: vec3f) -> f32 {\n  return dot(rgb, vec3f(0.299, 0.587, 0.114));\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {\n  // LuminosityHighPassShader.js @ three 0.184.0, with defaultColor=0 and defaultOpacity=0.\n  let texel = textureSample(tDiffuse, linearSampler, uv);\n  let v = luminance(texel.xyz);\n  let outputColor = vec4f(vec3f(0.0), 0.0);\n  let alpha = smoothstep(uniforms.luminosityThreshold, uniforms.luminosityThreshold + uniforms.smoothWidth, v);\n  return mix(outputColor, texel, alpha);\n}\n",
	functionExports: []
}, Mm = {
	version: 1,
	wgsl: "struct CompositeUniforms {\n  bloomStrength: f32,\n  bloomRadius: f32,\n  _pad0: vec2f,\n  bloomFactors0: vec4f,\n  bloomFactors1: vec4f,\n};\n@group(0) @binding(0) var<uniform> uniforms: CompositeUniforms;\n@group(0) @binding(1) var blurTexture1: texture_2d<f32>;\n@group(0) @binding(2) var blurTexture2: texture_2d<f32>;\n@group(0) @binding(3) var blurTexture3: texture_2d<f32>;\n@group(0) @binding(4) var blurTexture4: texture_2d<f32>;\n@group(0) @binding(5) var blurTexture5: texture_2d<f32>;\n@group(0) @binding(6) var linearSampler: sampler;\n\nfn factor(i: u32) -> f32 {\n  let v = array<f32, 8>(\n    uniforms.bloomFactors0.x, uniforms.bloomFactors0.y, uniforms.bloomFactors0.z, uniforms.bloomFactors0.w,\n    uniforms.bloomFactors1.x, uniforms.bloomFactors1.y, uniforms.bloomFactors1.z, uniforms.bloomFactors1.w\n  );\n  return v[i];\n}\n\nfn lerpBloomFactor(f: f32) -> f32 {\n  let mirrorFactor = 1.2 - f;\n  return mix(f, mirrorFactor, uniforms.bloomRadius);\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {\n  // UnrealBloomPass._getCompositeMaterial @ three 0.184.0. Tint colors are all white.\n  let bloom = 3.0 * uniforms.bloomStrength * (\n    lerpBloomFactor(factor(0u)) * textureSample(blurTexture1, linearSampler, uv).rgb +\n    lerpBloomFactor(factor(1u)) * textureSample(blurTexture2, linearSampler, uv).rgb +\n    lerpBloomFactor(factor(2u)) * textureSample(blurTexture3, linearSampler, uv).rgb +\n    lerpBloomFactor(factor(3u)) * textureSample(blurTexture4, linearSampler, uv).rgb +\n    lerpBloomFactor(factor(4u)) * textureSample(blurTexture5, linearSampler, uv).rgb\n  );\n  let bloomAlpha = max(bloom.r, max(bloom.g, bloom.b));\n  return vec4f(bloom, bloomAlpha);\n}\n",
	functionExports: []
}, Q = {
	simulation: {
		oceanSize: 200,
		worldSize: 400,
		timeScale: .6,
		spectrumTimeScale: .5,
		windSpeed: 12.9,
		windAngle: 4.83,
		amplitude: 1.3,
		choppiness: 1.51,
		displacementScale: .005,
		foamThreshold: 0
	},
	particles: {
		pointSize: .75,
		fadeNear: 60,
		fadeFar: 250,
		fadePower: 3.2,
		oceanColor: [
			.003035269835488375,
			.003035269835488375,
			.003035269835488375,
			0
		],
		neonColor: [
			1,
			1,
			1,
			0
		],
		foamColor: [
			1,
			1,
			1,
			0
		]
	},
	camera: {
		eye: [
			0,
			30,
			90
		],
		target: [
			0,
			5,
			55
		],
		pitchDegrees: -10,
		fovDegrees: 90,
		near: .1,
		far: 2e3
	},
	bloom: {
		threshold: .3,
		smoothWidth: .01,
		strength: .08,
		radius: .46,
		levels: 5,
		kernelRadii: [
			6,
			10,
			14,
			18,
			22
		]
	}
};
function Nm(e) {
	return Array.from({ length: 24 }, (t, n) => n < e ? .39894 * Math.exp(-.5 * n * n / (e / 3) ** 2) / (e / 3) : 0);
}
//#endregion
//#region fft-ocean/camera.ts
function Pm(e) {
	let { eye: t, target: n, pitchDegrees: r, fovDegrees: i, near: a, far: o } = Q.camera, s = Math.atan2(t[1] - n[1], t[2] - n[2]) - r * Math.PI / 180, c = Math.cos(s), l = Math.sin(s), u = 1 / Math.tan(i * Math.PI / 360), d = /* @__PURE__ */ new Float32Array(16);
	d[0] = d[15] = 1, d[5] = d[10] = c, d[6] = l, d[9] = -l, d[13] = -(c * t[1] - l * t[2]), d[14] = -(l * t[1] + c * t[2]);
	let f = /* @__PURE__ */ new Float32Array(16);
	return f[0] = u / (e[0] / Math.max(1, e[1])), f[5] = u, f[10] = o / (a - o), f[11] = -1, f[14] = o * a / (a - o), {
		view: d,
		projection: f
	};
}
//#endregion
//#region fft-ocean/ifft-stage.wgsl
var Fm = {
	version: 1,
	wgsl: "// vgsl-module: /Users/sounak/Documents/Astrx/fft-ocean/ifft-stage.wgsl\nstruct _vgsl_6a541fbe__IfftStageUniforms {\n  resolution: f32,\n  subtransformSize: f32,\n  horizontal: f32,\n};\n@group(0) @binding(0) var<uniform> u: _vgsl_6a541fbe__IfftStageUniforms;\n@group(0) @binding(1) var u_input: texture_2d<f32>;\n\n@fragment fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {\n  let N = i32(u.resolution);\n  let horizontal = u.horizontal > 0.5;\n  let index = select(position.y - 0.5, position.x - 0.5, horizontal);\n\n  let evenIndex = floor(index / u.subtransformSize) * (u.subtransformSize * 0.5)\n                + (index % (u.subtransformSize * 0.5));\n\n  let evenCoord = select(\n    vec2i(i32(position.x - 0.5), i32(evenIndex)),\n    vec2i(i32(evenIndex), i32(position.y - 0.5)),\n    horizontal,\n  );\n  let oddCoord = select(\n    vec2i(i32(position.x - 0.5), i32(evenIndex + u.resolution * 0.5)),\n    vec2i(i32(evenIndex + u.resolution * 0.5), i32(position.y - 0.5)),\n    horizontal,\n  );\n  let even = _vgsl_bc582ee7__wrapLoad(u_input, evenCoord, N);\n  let odd = _vgsl_bc582ee7__wrapLoad(u_input, oddCoord, N);\n\n  let twiddleArg = 2.0 * _vgsl_bc582ee7__PI * (index / u.subtransformSize);\n  let twiddle = vec2f(cos(twiddleArg), sin(twiddleArg));\n\n  let outA = even.xy + _vgsl_bc582ee7__cmul(twiddle, odd.xy);\n  let outB = even.zw + _vgsl_bc582ee7__cmul(twiddle, odd.zw);\n  return vec4f(outA, outB);\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/fft-ocean/ocean-common.wgsl\nconst _vgsl_bc582ee7__PI: f32 = 3.141592653589793;\n \n\n fn _vgsl_bc582ee7__cmul(a: vec2f, b: vec2f) -> vec2f {\n  return vec2f(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);\n}\n\n fn _vgsl_bc582ee7__wrapCoord(coord: vec2i, N: i32) -> vec2u {\n  let wrapped = (coord % vec2i(N) + vec2i(N)) % vec2i(N);\n  return vec2u(wrapped);\n}\n\n fn _vgsl_bc582ee7__wrapLoad(tex: texture_2d<f32>, coord: vec2i, N: i32) -> vec4f {\n  return textureLoad(tex, _vgsl_bc582ee7__wrapCoord(coord, N), 0);\n}\n",
	functionExports: [
		{
			name: "cmul",
			resolvedName: "_vgsl_bc582ee7__cmul",
			parameterNames: ["a", "b"]
		},
		{
			name: "wrapCoord",
			resolvedName: "_vgsl_bc582ee7__wrapCoord",
			parameterNames: ["coord", "N"]
		},
		{
			name: "wrapLoad",
			resolvedName: "_vgsl_bc582ee7__wrapLoad",
			parameterNames: [
				"tex",
				"coord",
				"N"
			]
		}
	]
}, Im = {
	version: 1,
	wgsl: "// vgsl-module: /Users/sounak/Documents/Astrx/fft-ocean/initial-spectrum.wgsl\nstruct _vgsl_e36e8010__InitialSpectrumUniforms {\n  resolution: f32,\n  size: f32,\n  windSpeed: f32,\n  windAngle: f32,\n  amplitude: f32,\n};\n@group(0) @binding(0) var<uniform> u: _vgsl_e36e8010__InitialSpectrumUniforms;\n@group(0) @binding(1) var u_noise: texture_2d<f32>;\n\nfn _vgsl_e36e8010__phillips(k: vec2f) -> f32 {\n  let kk = dot(k, k);\n  if (kk < 1e-8) { return 0.0; }\n  let w = vec2f(cos(u.windAngle), sin(u.windAngle));\n  let L = (u.windSpeed * u.windSpeed) / _vgsl_bc582ee7__G;\n  let kdotw = dot(normalize(k), w);\n  var ph = u.amplitude * exp(-1.0 / (kk * L * L)) / (kk * kk) * (kdotw * kdotw);\n  let l = L * 0.001;\n  ph *= exp(-kk * l * l);\n  if (kdotw < 0.0) { ph *= 0.07; }\n  return ph;\n}\n\n@fragment fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {\n  let coord = position.xy - vec2f(0.5);\n  let n = select(coord.x - u.resolution, coord.x, coord.x < u.resolution * 0.5);\n  let m = select(coord.y - u.resolution, coord.y, coord.y < u.resolution * 0.5);\n  let k = (2.0 * _vgsl_bc582ee7__PI / u.size) * vec2f(n, m);\n\n  let rnd = textureLoad(u_noise, vec2u(coord), 0);\n\n  let h0k    = (1.0 / sqrt(2.0)) * vec2f(rnd.x, rnd.y) * sqrt(_vgsl_e36e8010__phillips(k));\n  let h0negk = (1.0 / sqrt(2.0)) * vec2f(rnd.z, rnd.w) * sqrt(_vgsl_e36e8010__phillips(-k));\n\n  return vec4f(h0k, h0negk.x, -h0negk.y);\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/fft-ocean/ocean-common.wgsl\nconst _vgsl_bc582ee7__PI: f32 = 3.141592653589793;\n const _vgsl_bc582ee7__G: f32 = 9.81;\n\n \n\n \n\n \n",
	functionExports: []
}, Lm = {
	version: 1,
	wgsl: "const SEED: u32 = 0x6f636561u;\nconst RESOLUTION: u32 = 512u;\n\n// Random-access form of front's mulberry32. `callIndex` is the number of\n// preceding PRNG calls, so each texel reproduces the CPU upload without state.\nfn mulberryAt(callIndex: u32) -> f32 {\n  let state = SEED + 0x6d2b79f5u * (callIndex + 1u);\n  var t = state;\n  t = (t ^ (t >> 15u)) * (t | 1u);\n  t = t ^ (t + ((t ^ (t >> 7u)) * (t | 61u)));\n  return f32(t ^ (t >> 14u)) / 4294967296.0;\n}\nfn gaussianPair(callIndex: u32) -> vec2f {\n  let u1 = max(mulberryAt(callIndex), 1.17549435e-38);\n  let u2 = mulberryAt(callIndex + 1u);\n  let magnitude = sqrt(-2.0 * log(u1));\n  let angle = 6.283185307179586 * u2;\n  return magnitude * vec2f(cos(angle), sin(angle));\n}\n@fragment fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {\n  let coord = vec2u(position.xy - vec2f(0.5));\n  let base = (coord.y * RESOLUTION + coord.x) * 4u;\n  return vec4f(gaussianPair(base), gaussianPair(base + 2u));\n}\n",
	functionExports: []
}, Rm = {
	version: 1,
	wgsl: "// vgsl-module: /Users/sounak/Documents/Astrx/fft-ocean/normal-foam.wgsl\nstruct _vgsl_0584c5d3__NormalFoamUniforms {\n  resolution: f32,\n  worldSize: f32,\n  displacementScale: f32,\n  foamThreshold: f32,\n};\n@group(0) @binding(0) var<uniform> u: _vgsl_0584c5d3__NormalFoamUniforms;\n@group(0) @binding(1) var u_displacement: texture_2d<f32>;\n\n@fragment fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {\n  let N = i32(u.resolution);\n  let coord = vec2i(position.xy - vec2f(0.5));\n  let dx = u.worldSize / u.resolution;\n\n  let r = _vgsl_bc582ee7__wrapLoad(u_displacement, coord + vec2i(1, 0), N).xyz * u.displacementScale;\n  let l = _vgsl_bc582ee7__wrapLoad(u_displacement, coord - vec2i(1, 0), N).xyz * u.displacementScale;\n  let t = _vgsl_bc582ee7__wrapLoad(u_displacement, coord + vec2i(0, 1), N).xyz * u.displacementScale;\n  let b = _vgsl_bc582ee7__wrapLoad(u_displacement, coord - vec2i(0, 1), N).xyz * u.displacementScale;\n\n  let dhdx = (r.y - l.y) / (2.0 * dx);\n  let dhdz = (t.y - b.y) / (2.0 * dx);\n  let normal = normalize(vec3f(-dhdx, 1.0, -dhdz));\n\n  let dDxdx = (r.x - l.x) / (2.0 * dx);\n  let dDzdz = (t.z - b.z) / (2.0 * dx);\n  let dDxdz = (t.x - b.x) / (2.0 * dx);\n  let dDzdx = (r.z - l.z) / (2.0 * dx);\n  let J = (1.0 + dDxdx) * (1.0 + dDzdz) - dDxdz * dDzdx;\n\n  let foam = 1.0 - smoothstep(u.foamThreshold, u.foamThreshold + 0.8, J);\n  return vec4f(normal, foam);\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/fft-ocean/ocean-common.wgsl\n\n \n\n \n\n fn _vgsl_bc582ee7__wrapCoord(coord: vec2i, N: i32) -> vec2u {\n  let wrapped = (coord % vec2i(N) + vec2i(N)) % vec2i(N);\n  return vec2u(wrapped);\n}\n\n fn _vgsl_bc582ee7__wrapLoad(tex: texture_2d<f32>, coord: vec2i, N: i32) -> vec4f {\n  return textureLoad(tex, _vgsl_bc582ee7__wrapCoord(coord, N), 0);\n}\n",
	functionExports: [{
		name: "wrapCoord",
		resolvedName: "_vgsl_bc582ee7__wrapCoord",
		parameterNames: ["coord", "N"]
	}, {
		name: "wrapLoad",
		resolvedName: "_vgsl_bc582ee7__wrapLoad",
		parameterNames: [
			"tex",
			"coord",
			"N"
		]
	}]
}, zm = 9;
function Bm() {
	return Object.freeze(Array.from({ length: 18 }, (e, t) => {
		let n = t % 2 ? "pong" : "ping";
		return Object.freeze({
			index: t,
			axisStage: t % zm,
			horizontal: t < zm,
			subtransformSize: 2 ** (t % zm + 1),
			input: t === 0 ? "spectrum" : n === "ping" ? "pong" : "ping",
			output: n
		});
	}));
}
//#endregion
//#region fft-ocean/particles.wgsl
var Vm = {
	version: 1,
	wgsl: "struct ParticleUniforms {\n  view: mat4x4f,\n  projection: mat4x4f,\n  viewport: vec4f,\n  world: vec4f,\n  fade: vec4f,\n  oceanColor: vec4f,\n  neonColor: vec4f,\n  foamColor: vec4f,\n};\n\nstruct VertexOut {\n  @builtin(position) position: vec4f,\n  @location(0) pointCoord: vec2f,\n  @location(1) foam: f32,\n  @location(2) normal: vec3f,\n  @location(3) viewDir: vec3f,\n  @location(4) height: f32,\n  @location(5) fade: f32,\n};\n\n@group(0) @binding(0) var<uniform> u: ParticleUniforms;\n@group(0) @binding(1) var u_displacement: texture_2d<f32>;\n@group(0) @binding(2) var u_normalFoam: texture_2d<f32>;\n\nfn quadCorner(vertexIndex: u32) -> vec2f {\n  let cornerIndex = array<u32, 6>(0u, 1u, 2u, 2u, 1u, 3u)[vertexIndex % 6u];\n  switch (cornerIndex) {\n    case 0u: { return vec2f(-1.0, -1.0); }\n    case 1u: { return vec2f( 1.0, -1.0); }\n    case 2u: { return vec2f(-1.0,  1.0); }\n    default: { return vec2f( 1.0,  1.0); }\n  }\n}\n\n@vertex fn vs_main(\n  @builtin(vertex_index) vertexIndex: u32,\n  @builtin(instance_index) instanceIndex: u32,\n) -> VertexOut {\n  let resolution = max(1u, u32(u.viewport.w));\n  let i = instanceIndex % resolution;\n  let j = instanceIndex / resolution;\n  let particleRef = vec2f(f32(i), f32(j)) / f32(resolution);\n  let texCoord = vec2u(i, j);\n\n  let disp = textureLoad(u_displacement, texCoord, 0).xyz * u.world.y;\n  let nf = textureLoad(u_normalFoam, texCoord, 0);\n\n  let halfWorld = u.world.x * 0.5;\n  let base = vec3f(\n    particleRef.x * u.world.x - halfWorld,\n    0.0,\n    particleRef.y * u.world.x - halfWorld,\n  );\n  let pos = base + disp;\n\n  let mv = u.view * vec4f(pos, 1.0);\n  let viewDir = -mv.xyz;\n  let dist = -mv.z;\n  let f = 1.0 - smoothstep(u.fade.x, u.fade.y, dist);\n  let fade = pow(clamp(f, 0.0, 1.0), u.fade.z);\n\n  let projected = u.projection * mv;\n  let ndc = projected.xy / projected.w;\n\n  let corner = quadCorner(vertexIndex);\n  let pointSizePx = 2.0 * u.world.z * u.viewport.z;\n  let clipOffset = corner * (pointSizePx / u.viewport.xy) * projected.w;\n  let clip = vec4f(ndc * projected.w + clipOffset, projected.z, projected.w);\n\n  var out: VertexOut;\n  out.position = clip;\n  out.pointCoord = corner * 0.5 + vec2f(0.5);\n  out.foam = nf.w;\n  out.normal = nf.xyz;\n  out.viewDir = viewDir;\n  out.height = disp.y;\n  out.fade = fade;\n  return out;\n}\n\n@fragment fn fs_main(in: VertexOut) -> @location(0) vec4f {\n  let cc = in.pointCoord - vec2f(0.5);\n  let d2 = dot(cc, cc);\n  if (d2 > 0.25) {\n    discard;\n  }\n\n  let n = normalize(in.normal);\n  let v = normalize(in.viewDir);\n  let fresnel = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 5.0);\n\n  let foam = clamp(in.foam, 0.0, 1.0);\n  let crest = smoothstep(-0.5, 1.5, in.height);\n\n  var color = u.oceanColor.rgb * 0.5;\n  color += u.neonColor.rgb * crest * 0.5;\n  color += u.neonColor.rgb * fresnel * 0.15;\n  color = mix(color, u.foamColor.rgb, foam);\n  var alpha = 0.02 + crest * 0.06 + fresnel * 0.04;\n  alpha = mix(alpha, 1.0, foam);\n  color *= in.fade;\n  alpha *= in.fade;\n  return vec4f(color, clamp(alpha, 0.0, 1.0));\n}\n",
	functionExports: []
}, Hm = {
	version: 1,
	wgsl: "@group(0) @binding(0) var sceneHDR: texture_2d<f32>;\n@group(0) @binding(1) var bloomTexture: texture_2d<f32>;\n@group(0) @binding(2) var linearSampler: sampler;\n\nfn LinearTosRGB(value: vec4f) -> vec4f {\n  let lt = value.rgb * 12.92;\n  let gt = 1.055 * pow(value.rgb, vec3f(0.41666)) - vec3f(0.055);\n  let rgb = select(gt, lt, value.rgb <= vec3f(0.0031308));\n  return vec4f(rgb, value.a);\n}\n\n@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {\n  let scene = textureSample(sceneHDR, linearSampler, uv);\n  let bloom = textureSample(bloomTexture, linearSampler, uv);\n  return LinearTosRGB(vec4f(scene.rgb + bloom.rgb, max(scene.a, bloom.a)));\n}\n",
	functionExports: []
}, Um = {
	version: 1,
	wgsl: "// vgsl-module: /Users/sounak/Documents/Astrx/fft-ocean/spectrum.wgsl\n// Evolves the FFT ocean spectrum each frame.\n//\n// `initial-spectrum.wgsl` seeds h0(k) and h0(-k) from the Phillips-style\n// wind spectrum. This pass applies deep-water dispersion over time to produce\n// the frequency-domain height and horizontal displacement channels consumed by\n// the IFFT passes; later passes transform them into spatial displacement,\n// normals/foam, and particles.\n\n       \n\nstruct _vgsl_bb85b049__SpectrumUniforms {\n  resolution: f32,\n  size: f32,\n  time: f32,\n  choppiness: f32,\n};\n@group(0) @binding(0) var<uniform> u: _vgsl_bb85b049__SpectrumUniforms;\n@group(0) @binding(1) var u_initialSpectrum: texture_2d<f32>;\n\n@fragment fn fs_main(@builtin(position) position: vec4f) -> @location(0) vec4f {\n  let coord = position.xy - vec2f(0.5);\n  let n = select(coord.x - u.resolution, coord.x, coord.x < u.resolution * 0.5);\n  let m = select(coord.y - u.resolution, coord.y, coord.y < u.resolution * 0.5);\n  let k = (2.0 * _vgsl_bc582ee7__PI / u.size) * vec2f(n, m);\n  let kLen = length(k);\n\n  let h0 = textureLoad(u_initialSpectrum, vec2u(coord), 0);\n  let w = sqrt(_vgsl_bc582ee7__G * kLen) * u.time;\n  let expp = vec2f(cos(w),  sin(w));\n  let expm = vec2f(cos(w), -sin(w));\n\n  let h = _vgsl_bc582ee7__cmul(h0.rg, expp) + _vgsl_bc582ee7__cmul(h0.ba, expm);\n\n  // Convert the evolved height spectrum into slope/height and choppy\n  // horizontal displacement spectra before the inverse FFT stages.\n  var kn = vec2f(0.0);\n  if (kLen > 0.0) { kn = k / kLen; }\n  let negI_h = vec2f(h.y, -h.x);\n  let hx = negI_h * kn.x * u.choppiness;\n  let hz = negI_h * kn.y * u.choppiness;\n\n  let cA = vec2f(hx.x - h.y, hx.y + h.x);\n  let cB = hz;\n  return vec4f(cA, cB);\n}\n\n// vgsl-module: /Users/sounak/Documents/Astrx/fft-ocean/ocean-common.wgsl\nconst _vgsl_bc582ee7__PI: f32 = 3.141592653589793;\n const _vgsl_bc582ee7__G: f32 = 9.81;\n\n fn _vgsl_bc582ee7__cmul(a: vec2f, b: vec2f) -> vec2f {\n  return vec2f(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);\n}\n\n \n\n \n",
	functionExports: [{
		name: "cmul",
		resolvedName: "_vgsl_bc582ee7__cmul",
		parameterNames: ["a", "b"]
	}]
}, Wm = "rgba32float", Gm = "rgba16float", Km = [
	0,
	0,
	0,
	0
];
function qm({ canvas: e }) {
	let t = !1, n, r, i, a, o = 0, s = 0;
	function c() {
		t || (t = !0, s++, ah([
			() => {
				o && cancelAnimationFrame(o);
			},
			() => a?.(),
			() => n?.dispose()
		]));
	}
	function l(e) {
		try {
			c();
		} catch {}
		throw e;
	}
	let u = async (e) => {
		if (t || !n || !r || !i || sh(i.scene.size, r.size)) return;
		let a = await Jm(n, r, `fft-ocean-resize-${e}`);
		if (t) return;
		if (e !== s) {
			try {
				rh(a);
			} catch {}
			return;
		}
		let o = i;
		i = a, rh(o);
	}, d = () => {
		if (t || o) return;
		let e = ++s;
		o = requestAnimationFrame(async () => {
			o = 0;
			try {
				await u(e);
			} catch (n) {
				!t && e === s && l(n);
			}
		});
	};
	return {
		ready: (async () => {
			let { init: o } = await Promise.resolve().then(() => (Cm(), xm));
			if (t) return;
			let s = await o();
			if (t) {
				s.dispose();
				return;
			}
			if (n = s, r = pu(n, e, { dpr: [1, 1.6] }), i = await Jm(n, r, "fft-ocean-live"), t) return;
			a = r.onResize(d);
			let c = Mf(n);
			Hf(n, (e) => {
				if (!t && i && r) try {
					$m(i, c.time * Q.simulation.timeScale), th(e, i, r);
				} catch (e) {
					l(e);
				}
			});
		})().catch((e) => {
			t || l(e);
		}),
		dispose: c
	};
}
async function Jm(e, t, n) {
	let r = [];
	try {
		let i = Ym(e, t, n, (e) => (r.push(e), e));
		return await Qm(i, t), i;
	} catch (e) {
		try {
			ih(r);
		} catch {}
		throw e;
	}
}
function Ym(e, t, n, r) {
	let i = (t, i, a) => r(cp(e, {
		size: i,
		format: a,
		label: `${n}-${t}`
	})), a = (e) => i(e, [512, 512], Wm), o = {
		noise: a("noise"),
		h0: a("h0"),
		spectrum: a("spectrum"),
		ping: a("ping"),
		pong: a("pong"),
		normalFoam: a("normal-foam")
	}, s = nh(t.size), c = i("scene", oh(t.size), Gm), l = i("bright", s[0], Gm), u = i("composite", s[0], Gm), d = Ku(e, {
		minFilter: "linear",
		magFilter: "linear"
	}), f = Xm(e, Lm, `${n}-noise`), p = Xm(e, Im, `${n}-initial-spectrum`, {
		u: {
			resolution: 512,
			size: Q.simulation.oceanSize,
			windSpeed: Q.simulation.windSpeed,
			windAngle: Q.simulation.windAngle,
			amplitude: Q.simulation.amplitude
		},
		u_noise: o.noise
	}), m = Xm(e, Um, `${n}-spectrum`, {
		u: {
			resolution: 512,
			size: Q.simulation.oceanSize,
			time: 0,
			choppiness: Q.simulation.choppiness
		},
		u_initialSpectrum: o.h0
	}), h = {
		spectrum: o.spectrum,
		ping: o.ping,
		pong: o.pong
	}, g = Bm().map((t) => ({
		spec: t,
		effect: Xm(e, Fm, `${n}-ifft-${t.index}-${t.horizontal ? "h" : "v"}`, {
			u: {
				resolution: 512,
				subtransformSize: t.subtransformSize,
				horizontal: +!!t.horizontal
			},
			u_input: h[t.input]
		}),
		output: h[t.output]
	})), _ = g.at(-1).output, v = Xm(e, Rm, `${n}-normal-foam`, {
		u: {
			resolution: 512,
			worldSize: Q.simulation.worldSize,
			displacementScale: Q.simulation.displacementScale,
			foamThreshold: Q.simulation.foamThreshold
		},
		u_displacement: _
	}), y = id(e, {
		shader: Vm,
		vertices: 6,
		instances: 262144,
		blend: {
			color: {
				src: "src-alpha",
				dst: "one"
			},
			alpha: {
				src: "one",
				dst: "one"
			}
		},
		label: `${n}-particles`
	}).set({
		u_displacement: _,
		u_normalFoam: o.normalFoam
	});
	eh(y, t);
	let ee = Xm(e, jm, `${n}-bloom-bright`, {
		uniforms: {
			luminosityThreshold: Q.bloom.threshold,
			smoothWidth: Q.bloom.smoothWidth,
			_pad0: [0, 0]
		},
		tDiffuse: c,
		linearSampler: d
	}), b = l, x = s.map((t, r) => {
		let a = i(`bloom-h${r}`, t, Gm), o = i(`bloom-v${r}`, t, Gm), s = Q.bloom.kernelRadii[r], c = Zm(e, `${n}-blur-h${r}`, b, a, d, [1, 0], s), l = Zm(e, `${n}-blur-v${r}`, a, o, d, [0, 1], s);
		return b = o, {
			horizontal: a,
			vertical: o,
			horizontalEffect: c,
			verticalEffect: l
		};
	}), S = Xm(e, Mm, `${n}-bloom-composite`, {
		uniforms: {
			bloomStrength: Q.bloom.strength,
			bloomRadius: Q.bloom.radius,
			_pad0: [0, 0],
			bloomFactors0: [
				1,
				.8,
				.6,
				.4
			],
			bloomFactors1: [
				.2,
				0,
				0,
				0
			]
		},
		blurTexture1: x[0].vertical,
		blurTexture2: x[1].vertical,
		blurTexture3: x[2].vertical,
		blurTexture4: x[3].vertical,
		blurTexture5: x[4].vertical,
		linearSampler: d
	}), C = Xm(e, Hm, `${n}-present`, {
		sceneHDR: c,
		bloomTexture: u,
		linearSampler: d
	});
	return {
		simulation: o,
		scene: c,
		bloom: {
			bright: l,
			composite: u,
			levels: x
		},
		effects: {
			noise: f,
			initialSpectrum: p,
			evolveSpectrum: m,
			normals: v,
			bright: ee,
			composite: S,
			present: C
		},
		ifft: g,
		particles: y,
		needsInitialSpectrum: !0
	};
}
function Xm(e, t, n, r) {
	let i = mf(e, t, { label: n });
	return r ? i.set(r) : i;
}
function Zm(e, t, n, r, i, a, o) {
	let s = mf(e, Am, { label: t }), c = Nm(o);
	return s.set({
		uniforms: {
			direction: a,
			invSize: r.texelSize,
			gaussianCoefficients0: c.slice(0, 4),
			gaussianCoefficients1: c.slice(4, 8),
			gaussianCoefficients2: c.slice(8, 12),
			gaussianCoefficients3: c.slice(12, 16),
			gaussianCoefficients4: c.slice(16, 20),
			gaussianCoefficients5: c.slice(20, 24)
		},
		colorTexture: n,
		linearSampler: i
	}), s;
}
async function Qm(e, t) {
	let n = (await Promise.allSettled([
		e.effects.noise.compile(e.simulation.noise),
		e.effects.initialSpectrum.compile(e.simulation.h0),
		e.effects.evolveSpectrum.compile(e.simulation.spectrum),
		...e.ifft.map(({ effect: e, output: t }) => e.compile(t)),
		e.effects.normals.compile(e.simulation.normalFoam),
		e.particles.compile(e.scene),
		e.effects.bright.compile(e.bloom.bright),
		...e.bloom.levels.flatMap((e) => [e.horizontalEffect.compile(e.horizontal), e.verticalEffect.compile(e.vertical)]),
		e.effects.composite.compile(e.bloom.composite),
		e.effects.present.compile({ colors: [t.format] })
	])).find((e) => e.status === "rejected");
	if (n) throw n.reason;
}
function $m(e, t) {
	e.effects.evolveSpectrum.set({ u: { time: t * Q.simulation.spectrumTimeScale } });
}
function eh(e, t) {
	let n = Pm(t.size), r = Q;
	e.set({ u: {
		view: n.view,
		projection: n.projection,
		viewport: [
			t.size[0],
			t.size[1],
			1,
			512
		],
		world: [
			r.simulation.worldSize,
			r.simulation.displacementScale,
			r.particles.pointSize,
			0
		],
		fade: [
			r.particles.fadeNear,
			r.particles.fadeFar,
			r.particles.fadePower,
			0
		],
		oceanColor: r.particles.oceanColor,
		neonColor: r.particles.neonColor,
		foamColor: r.particles.foamColor
	} });
}
function th(e, t, n) {
	let r = (t, n) => e.pass({
		target: t,
		clear: Km
	}, (e) => e.draw(n));
	t.needsInitialSpectrum &&= (r(t.simulation.noise, t.effects.noise), r(t.simulation.h0, t.effects.initialSpectrum), !1), r(t.simulation.spectrum, t.effects.evolveSpectrum);
	for (let e of t.ifft) r(e.output, e.effect);
	r(t.simulation.normalFoam, t.effects.normals), r(t.scene, t.particles), r(t.bloom.bright, t.effects.bright);
	for (let e of t.bloom.levels) r(e.horizontal, e.horizontalEffect), r(e.vertical, e.verticalEffect);
	r(t.bloom.composite, t.effects.composite), r(n, t.effects.present);
}
function nh(e) {
	let t = Math.max(1, Math.round(e[0] / 2)), n = Math.max(1, Math.round(e[1] / 2));
	return Array.from({ length: Q.bloom.levels }, () => {
		let e = [t, n];
		return t = Math.max(1, Math.round(t / 2)), n = Math.max(1, Math.round(n / 2)), e;
	});
}
function rh(e) {
	ih([
		...Object.values(e.simulation),
		e.scene,
		e.bloom.bright,
		e.bloom.composite,
		...e.bloom.levels.flatMap((e) => [e.horizontal, e.vertical])
	]);
}
function ih(e) {
	ah([...e].reverse().map((e) => () => e.color.destroy()));
}
function ah(e) {
	let t, n = !1;
	for (let r of e) try {
		r();
	} catch (e) {
		n || (t = e), n = !0;
	}
	if (n) throw t;
}
function oh(e) {
	return [Math.max(1, Math.floor(e[0])), Math.max(1, Math.floor(e[1]))];
}
function sh(e, t) {
	return e[0] === t[0] && e[1] === t[1];
}
var ch = new class {
	ctx = null;
	isMuted = !1;
	lastPlayedTime = 0;
	initCtx() {
		if (this.ctx) return;
		let e = window.AudioContext || window.webkitAudioContext;
		e && (this.ctx = new e());
	}
	unlockContext() {
		this.initCtx(), this.ctx && this.ctx.state === "suspended" && this.ctx.resume().catch(() => {});
	}
	playCosmicTransition(e = !1) {
		let t = Date.now() / 1e3;
		if (!e && t - this.lastPlayedTime < 3.5 || (this.lastPlayedTime = t, this.initCtx(), !this.ctx || this.isMuted)) return;
		let n = () => {
			try {
				let e = this.ctx.currentTime, t = this.ctx.createGain();
				t.gain.setValueAtTime(1e-4, e), t.gain.linearRampToValueAtTime(.28, e + 1.2), t.gain.exponentialRampToValueAtTime(1e-4, e + 5.8), t.connect(this.ctx.destination);
				let n = this.ctx.createOscillator(), r = this.ctx.createGain(), i = this.ctx.createBiquadFilter();
				n.type = "sawtooth", n.frequency.setValueAtTime(110, e), n.frequency.exponentialRampToValueAtTime(62, e + 4.5), i.type = "lowpass", i.frequency.setValueAtTime(400, e), i.frequency.exponentialRampToValueAtTime(160, e + 4.8), i.Q.setValueAtTime(3, e), r.gain.setValueAtTime(1e-4, e), r.gain.linearRampToValueAtTime(.22, e + 1.2), r.gain.exponentialRampToValueAtTime(1e-4, e + 5), n.connect(i), i.connect(r), r.connect(t), n.start(e), n.stop(e + 5.2);
				let a = this.ctx.createOscillator(), o = this.ctx.createGain();
				a.type = "triangle", a.frequency.setValueAtTime(90, e), a.frequency.exponentialRampToValueAtTime(48, e + 4), o.gain.setValueAtTime(1e-4, e), o.gain.linearRampToValueAtTime(.18, e + .8), o.gain.exponentialRampToValueAtTime(1e-4, e + 4.8), a.connect(o), o.connect(t), a.start(e), a.stop(e + 4.9);
				let s = Math.floor(this.ctx.sampleRate * 4.8), c = this.ctx.createBuffer(1, s, this.ctx.sampleRate), l = c.getChannelData(0);
				for (let e = 0; e < s; e++) l[e] = Math.random() * 2 - 1;
				let u = this.ctx.createBufferSource();
				u.buffer = c;
				let d = this.ctx.createBiquadFilter();
				d.type = "bandpass", d.frequency.setValueAtTime(240, e), d.frequency.exponentialRampToValueAtTime(800, e + 1.8), d.frequency.exponentialRampToValueAtTime(170, e + 4.5), d.Q.setValueAtTime(2.8, e);
				let f = this.ctx.createGain();
				f.gain.setValueAtTime(1e-4, e), f.gain.linearRampToValueAtTime(.16, e + 1.4), f.gain.exponentialRampToValueAtTime(1e-4, e + 4.6), u.connect(d), d.connect(f), f.connect(t), u.start(e), u.stop(e + 4.8), [
					523.25,
					659.25,
					783.99,
					987.77,
					1046.5
				].forEach((n, r) => {
					let i = this.ctx.createOscillator(), a = this.ctx.createGain();
					i.type = "sine", i.frequency.setValueAtTime(n, e + .2 + r * .12), a.gain.setValueAtTime(1e-4, e + .2 + r * .12), a.gain.linearRampToValueAtTime(.045 / (r + 1), e + 1.3 + r * .12), a.gain.exponentialRampToValueAtTime(1e-4, e + 4.9), i.connect(a), a.connect(t), i.start(e + .2 + r * .12), i.stop(e + 5.1);
				});
			} catch (e) {
				console.warn("[Cosmic audio error]:", e);
			}
		};
		this.ctx.state === "suspended" ? this.ctx.resume().then(n).catch(() => {}) : n();
	}
}();
if (typeof window < "u") {
	let e = () => {
		ch.unlockContext();
	};
	[
		"pointerdown",
		"click",
		"keydown",
		"touchstart",
		"wheel",
		"scroll",
		"mousemove"
	].forEach((t) => {
		window.addEventListener(t, e, { passive: !0 });
	});
}
function lh(e) {
	let t = e.parentElement;
	if (!t) return e;
	let n = e.cloneNode(!0);
	return t.replaceChild(n, e), n;
}
function uh() {
	let e = document.getElementById("heroTypewriterTitle");
	if (!e) return;
	let t = "Frontier intelligence engineered to advance human discovery.";
	e.innerHTML = "<span class=\"type-cursor\"></span>";
	let n = 0;
	function r() {
		n <= 60 ? (e.innerHTML = t.slice(0, n) + "<span class=\"type-cursor\"></span>", n++, setTimeout(r, 34 + Math.random() * 26)) : e.innerHTML = t + "<span class=\"type-cursor\"></span>";
	}
	setTimeout(r, 350);
}
function dh() {
	let e = document.getElementById("blackHoleCanvas");
	if (!e) return;
	let t = null;
	if (typeof navigator < "u" && "gpu" in navigator) try {
		t = Om({ canvas: e }), t.ready.catch((t) => {
			console.warn("[ASTRX Black Hole WebGPU init error, switching to WebGL]:", t), e = lh(e), fh(e);
		});
	} catch (t) {
		console.warn("[ASTRX Black Hole WebGPU exception, switching to WebGL]:", t), e = lh(e), fh(e);
	}
	else fh(e);
	return () => {
		t?.dispose();
	};
}
function fh(e) {
	let t = e.getContext("webgl") || e.getContext("experimental-webgl");
	if (!t) return;
	function n(e, n) {
		let r = t.createShader(e);
		return r ? (t.shaderSource(r, n), t.compileShader(r), r) : null;
	}
	let r = n(t.VERTEX_SHADER, "\n    attribute vec2 a_pos;\n    void main() {\n      gl_Position = vec4(a_pos, 0.0, 1.0);\n    }\n  "), i = n(t.FRAGMENT_SHADER, "\n    #ifdef GL_FRAGMENT_PRECISION_HIGH\n    precision highp float;\n    #else\n    precision mediump float;\n    #endif\n\n    uniform vec2 u_resolution;\n    uniform float u_time;\n    uniform vec2 u_mouse;\n\n    mat3 camera(vec3 ro, vec3 ta) {\n      vec3 w = normalize(ta - ro);\n      vec3 p = vec3(0.0, 1.0, 0.0);\n      vec3 u = normalize(cross(w, p));\n      vec3 v = cross(u, w);\n      return mat3(u, v, w);\n    }\n\n    void main() {\n      vec2 centerOffset = vec2(u_resolution.x * 0.50, u_resolution.y * 0.50);\n      vec2 uv = (gl_FragCoord.xy - centerOffset) / min(u_resolution.x, u_resolution.y);\n      \n      float mx = (u_mouse.x / u_resolution.x - 0.5) * 1.6;\n      float my = (u_mouse.y / u_resolution.y - 0.5) * 0.7;\n      vec3 ro = vec3(sin(mx) * 11.0, 2.2 + my * 4.0, -cos(mx) * 11.0);\n      vec3 ta = vec3(0.0, 0.0, 0.0);\n      mat3 cam = camera(ro, ta);\n      vec3 rd = normalize(cam * vec3(uv, 1.6));\n\n      vec3 p = ro;\n      vec3 dir = rd;\n      float rs = 1.5;\n      vec3 diskCol = vec3(0.0);\n      float dt = 0.07;\n      bool hitHorizon = false;\n\n      for (int i = 0; i < 160; i++) {\n        float r = length(p);\n        if (r < rs) {\n          hitHorizon = true;\n          break;\n        }\n        if (r > 26.0) break;\n\n        vec3 accel = -1.4 * rs * p / (r * r * r * r);\n        dir = normalize(dir + accel * dt * r);\n        p += dir * dt * min(r * 0.45, 1.1);\n\n        float diskR = length(p.xz);\n        if (abs(p.y) < 0.16 && diskR > 2.4 && diskR < 8.2) {\n          float v = sqrt(rs / (2.0 * diskR));\n          vec3 vDir = normalize(vec3(-p.z, 0.0, p.x));\n          float beta = v * dot(vDir, -dir);\n          float doppler = sqrt(1.0 - v * v) / (1.0 - beta);\n          doppler = clamp(doppler, 0.25, 3.2);\n\n          float angle = atan(p.z, p.x) + u_time * (2.8 / sqrt(diskR));\n          float noise = sin(angle * 8.0 + diskR * 4.5) * 0.5 + 0.5;\n          float falloff = smoothstep(2.4, 3.4, diskR) * (1.0 - smoothstep(5.2, 8.2, diskR));\n\n          vec3 baseColor = mix(vec3(1.0, 0.94, 0.88), vec3(0.9, 0.95, 1.0), smoothstep(2.4, 4.2, diskR));\n          float density = falloff * (0.65 + 0.35 * noise) * pow(doppler, 2.8) * 0.22;\n          diskCol += baseColor * density;\n        }\n      }\n\n      if (!hitHorizon) {\n        float stars = pow(fract(sin(dot(dir.xy, vec2(12.9898, 78.233))) * 43758.5453), 36.0) * 1.5;\n        diskCol += vec3(stars);\n      }\n\n      vec3 finalColor = diskCol / (diskCol + vec3(1.0));\n      finalColor = pow(finalColor, vec3(1.0 / 2.2));\n      gl_FragColor = vec4(finalColor, 1.0);\n    }\n  ");
	if (!r || !i) return;
	let a = t.createProgram();
	if (!a) return;
	t.attachShader(a, r), t.attachShader(a, i), t.linkProgram(a);
	let o = t.createBuffer();
	t.bindBuffer(t.ARRAY_BUFFER, o), t.bufferData(t.ARRAY_BUFFER, new Float32Array([
		-1,
		-1,
		1,
		-1,
		-1,
		1,
		-1,
		1,
		1,
		-1,
		1,
		1
	]), t.STATIC_DRAW);
	let s = t.getAttribLocation(a, "a_pos"), c = t.getUniformLocation(a, "u_resolution"), l = t.getUniformLocation(a, "u_time"), u = t.getUniformLocation(a, "u_mouse"), d = {
		x: window.innerWidth * .5,
		y: window.innerHeight * .5
	};
	window.addEventListener("mousemove", (e) => {
		d.x = e.clientX, d.y = e.clientY;
	}, { passive: !0 });
	let f = performance.now();
	function p() {
		let n = Math.min(window.devicePixelRatio || 1, 2), r = e.clientWidth || window.innerWidth, i = e.clientHeight || window.innerHeight, m = Math.floor(r * n), h = Math.floor(i * n);
		(e.width !== m || e.height !== h) && (e.width = m, e.height = h), t.viewport(0, 0, e.width, e.height), t.useProgram(a), t.enableVertexAttribArray(s), t.bindBuffer(t.ARRAY_BUFFER, o), t.vertexAttribPointer(s, 2, t.FLOAT, !1, 0, 0), t.uniform2f(c, e.width, e.height), t.uniform1f(l, (performance.now() - f) * .001), t.uniform2f(u, d.x * n, d.y * n), t.drawArrays(t.TRIANGLES, 0, 6), requestAnimationFrame(p);
	}
	requestAnimationFrame(p);
}
var ph = "M527.5 374C532.2 376.46 533.41 382.96 536.16 387.34C541.35 395.63 545.76 404.56 550.16 413.34C553.09 419.21 556.37 425.12 559.84 430.66C564.82 438.58 567.88 447.74 572.84 455.66C576.52 461.52 578.48 468.48 582.16 474.34C589.05 485.33 594.11 497.51 601 508.5C596.73 511.82 588.02 512.87 582.69 514.19C573.39 516.48 563.47 519.67 554.5 523C543.7 502.39 533.95 480.89 523.5 460C521.36 455.71 515.73 441.06 510.5 441.06C506.37 441.06 503.43 447.44 502.19 450.69C497.78 462.25 491.23 472.73 486.81 484.31C485.14 488.71 482.21 492.62 480.5 497C475.75 509.15 468.84 520.49 464.19 532.69C460.95 541.18 456.43 549.19 453.19 557.69C451.71 561.56 448.75 569.84 446.47 572.97C444.39 575.82 439.94 577.63 437.03 579.53C430.63 583.73 424.95 588.95 418.5 593C418.5 588.18 423.23 580.51 425.84 576.34C428.23 572.54 429.85 568.11 431.5 564C432.07 562.59 433.17 561.64 433.81 560.31C436.77 554.26 439.36 548.02 442.84 542.34C443.68 540.98 443.93 539.45 444.5 538C446.57 532.71 449.71 527.67 452.16 522.66C457.29 512.15 463.25 501.85 467.5 491C470.27 483.93 474.45 477.14 477.84 470.34C485.51 455.01 493.18 439.68 500.84 424.34C506.85 412.33 512.78 400.46 518.84 388.34C521.03 383.97 523.22 376.24 527.5 374ZM718 448.5C721.42 457.7 722.18 468.15 731.03 474.47C735.26 477.49 743.71 478.38 746.5 481C726.3 485.04 722.24 495.32 718.5 514C715.41 510.03 715.64 503.49 713.81 498.69C709.17 486.51 700.27 485 689.5 481C690.94 479.65 693.89 479.41 696.31 478.81C700.49 477.78 705.87 474.53 708.47 470.97C710.98 467.52 713.78 463.51 714.81 459.31C715.68 455.79 715.71 450.79 718 448.5ZM688 502.5C682.86 505.07 677.19 505.87 671.69 507.19C664 509.02 656.37 511.29 648.69 513.19C630.14 517.76 612.07 524.88 593.69 530.19C590.82 531.02 588.11 532.75 585.31 533.81C579.01 536.21 572.63 538.41 566.31 540.81C550.08 547 533.99 553.02 518.34 560.84C515.24 562.39 511.55 563.38 508.66 565.16C500.93 569.9 492.34 573.34 484.66 578.16C475.02 584.2 465.54 590.33 455.97 596.47C437.66 608.21 417.51 624.75 405.84 643.34C401.35 650.51 397.67 659.78 399.03 668.47C399.93 674.2 404.34 681.04 409.03 684.47C411.69 686.41 416.44 688.08 417.5 691C405.17 690.87 383.38 680.7 380.19 667.31C378.66 660.9 379.9 652.7 382.19 646.69C388.04 631.34 410.73 609.24 424.03 599.53C462.12 571.74 502.3 552.59 546.31 535.81C569.81 526.85 593.8 518.72 618.31 513.81C626.47 512.18 634.53 509.76 642.69 508.19C650.24 506.73 657.88 506.16 665.47 504.97C671.14 504.08 682.82 501.52 688 502.5ZM611.5 534C614.43 537.61 616.84 542.75 618.5 547C619.59 549.78 621.52 552.01 622.84 554.66C625.91 560.78 628.52 567.55 632.16 573.34C638.31 583.15 642 594.53 648.16 604.34C653.12 612.26 656.18 621.42 661.16 629.34C666.2 637.39 670.4 645.97 675.53 653.97C679.22 659.72 683.76 665.16 688 670.5C689.69 672.63 691.84 673.98 693.97 675.53C696.3 677.23 698.18 679.29 700.66 680.84C706.39 684.44 713.62 686.12 719 689.91C679.33 689.91 639.67 689.91 600 689.91C607.09 684.92 615.39 683.88 620.53 676.03C621.32 674.83 622.46 673.79 622.81 672.31C625.95 659.15 614.14 637.47 607.16 626.34C605.45 623.62 604.55 620.38 602.84 617.66C599.89 612.95 594.49 603.95 592.5 599C591.12 595.55 589.85 591.86 587.84 588.66C580.93 577.63 572.7 561.52 568 549.5C574.59 546.2 581.49 544.41 588.31 541.81C595.85 538.94 603.59 535.58 611.5 534Z";
function mh(e, t) {
	let n = document.createElementNS("http://www.w3.org/2000/svg", "path");
	n.setAttribute("d", e);
	let r = n.getTotalLength(), i = [];
	for (let e = 0; e < t; e++) {
		let a = n.getPointAtLength(e / t * r);
		i.push({
			x: (a.x - 563) / 185,
			y: (a.y - 532) / 185
		});
	}
	return i;
}
var hh = class {
	isLogoParticle;
	normPoint;
	x = 0;
	y = 0;
	vx = 0;
	vy = 0;
	targetX = 0;
	targetY = 0;
	size = 1;
	baseAlpha = .5;
	alpha = .5;
	mass = 1.2;
	twinkleSpeed = .02;
	twinklePhase = 0;
	color = "#ffffff";
	noiseOffsetX = 0;
	noiseOffsetY = 0;
	constructor(e, t, n, r) {
		this.isLogoParticle = e, this.normPoint = t, this.reset(!0, n, r);
	}
	reset(e, t, n) {
		this.x = Math.random() * t, this.y = e ? Math.random() * n : n + 15, this.vx = (Math.random() - .5) * .35, this.vy = -Math.random() * .45 - .1, this.size = Math.random() * 1.6 + .5, this.baseAlpha = Math.random() * .5 + .25, this.alpha = this.baseAlpha, this.mass = this.size * 1.2, this.twinkleSpeed = Math.random() * .02 + .008, this.twinklePhase = Math.random() * Math.PI * 2;
		let r = Math.floor(Math.random() * 40 + 215);
		this.color = `rgb(${r}, ${r}, ${r})`, this.noiseOffsetX = (Math.random() - .5) * 6, this.noiseOffsetY = (Math.random() - .5) * 6, this.targetX = this.x, this.targetY = this.y;
	}
	updateLogoTarget(e, t) {
		if (!this.isLogoParticle || !this.normPoint) return;
		let n = e < 768, r = Math.min(e, t) * (n ? .25 : .26), i = n ? e / 2 : e * .27, a = t / 2;
		this.targetX = i + this.normPoint.x * r + this.noiseOffsetX, this.targetY = a + this.normPoint.y * r + this.noiseOffsetY;
	}
	update(e, t, n, r, i) {
		this.twinklePhase += this.twinkleSpeed;
		let a = Math.sin(this.twinklePhase) * .15, o = e.x - this.x, s = e.y - this.y, c = Math.sqrt(o * o + s * s), l = 0, u = 0;
		if (c < e.radius && e.active) {
			let t = (1 - c / e.radius) * 2, n = Math.atan2(s, o);
			l = -Math.cos(n) * t * (3.5 / this.mass), u = -Math.sin(n) * t * (3.5 / this.mass);
		}
		if (!this.isLogoParticle || t === "free") this.y += this.vy + u, this.x += this.vx + l, this.alpha = c < e.radius && e.active ? Math.min(1, this.baseAlpha + (1 - c / e.radius) * .45) : Math.max(.1, Math.min(1, this.baseAlpha + a)), (this.y < -15 || this.x < -15 || this.x > r + 15) && this.reset(!1, r, i);
		else if (t === "forming") {
			this.updateLogoTarget(r, i);
			let e = Math.min(1, Math.max(0, n)) ** 2.6, t = .001 + e * .038, a = Math.max(0, 1 - e);
			this.x += this.vx * a + (this.targetX + l * 1.2 - this.x) * t, this.y += this.vy * a + (this.targetY + u * 1.2 - this.y) * t, this.alpha += (.92 - this.alpha) * (.005 + e * .03);
		} else t === "holding" && (this.updateLogoTarget(r, i), this.x += (this.targetX + l * 1.2 - this.x) * .035, this.y += (this.targetY + u * 1.2 - this.y) * .035, this.alpha += (.95 - this.alpha) * .025);
	}
	draw(e, t) {
		e.save(), e.beginPath(), e.arc(this.x, this.y, this.size, 0, Math.PI * 2), e.fillStyle = this.color, e.globalAlpha = Math.max(.1, Math.min(1, this.alpha)), this.isLogoParticle && (t === "holding" || t === "forming") ? (e.shadowBlur = this.size * 7, e.shadowColor = "rgba(255, 255, 255, 0.8)") : (e.shadowBlur = this.size * 3, e.shadowColor = "rgba(255, 255, 255, 0.3)"), e.fill(), e.restore();
	}
}, $ = "free", gh = 0, _h = performance.now();
function vh() {
	$ = "free", gh = 0;
}
function yh() {
	$ = "forming", _h = performance.now();
}
function bh() {
	let e = document.getElementById("logoParticlesCanvas");
	if (!e) return;
	let t = e.getContext("2d");
	if (!t) return;
	let n = e.width = e.clientWidth || window.innerWidth, r = e.height = e.clientHeight || window.innerHeight, i = n < 768, a = i ? 120 : 220, o = i ? 100 : 280, s = mh(ph, a), c = [];
	function l() {
		c = [];
		for (let e = 0; e < a; e++) c.push(new hh(!0, s[e], n, r));
		for (let e = 0; e < o; e++) c.push(new hh(!1, null, n, r));
	}
	l();
	let u = {
		x: n / 2,
		y: r / 2,
		targetX: n / 2,
		targetY: r / 2,
		radius: i ? 120 : 200,
		active: !1
	};
	window.addEventListener("resize", () => {
		n = e.width = e.clientWidth || window.innerWidth, r = e.height = e.clientHeight || window.innerHeight, u.radius = n < 768 ? 120 : 200;
	}), window.addEventListener("mousemove", (t) => {
		let n = e.getBoundingClientRect();
		u.targetX = t.clientX - n.left, u.targetY = t.clientY - n.top, u.active = !0;
	}, { passive: !0 }), document.addEventListener("mouseleave", () => {
		u.active = !1;
	});
	let d;
	function f(e = 0) {
		if ($ === "forming") {
			let t = e - _h;
			gh = Math.min(1, t / 2800), gh >= 1 && ($ = "holding");
		}
		u.x += (u.targetX - u.x) * .1, u.y += (u.targetY - u.y) * .1, t.clearRect(0, 0, n, r);
		let a = $ === "holding" || $ === "forming" ? i ? 28 : 42 : i ? 40 : 65, o = $ === "holding" ? .16 : $ === "forming" ? .08 : .04;
		for (let e = 0; e < c.length; e++) for (let n = e + 1; n < Math.min(c.length, e + 24); n++) {
			let r = c[e].x - c[n].x, s = c[e].y - c[n].y, l = Math.sqrt(r * r + s * s);
			l < a && (t.beginPath(), t.moveTo(c[e].x, c[e].y), t.lineTo(c[n].x, c[n].y), t.strokeStyle = `rgba(255, 255, 255, ${(1 - l / a) * o})`, t.lineWidth = i ? .4 : .5, t.stroke());
		}
		c.forEach((e) => {
			e.update(u, $, gh, n, r), e.draw(t, $);
		}), d = requestAnimationFrame(f);
	}
	return d = requestAnimationFrame(f), () => {
		cancelAnimationFrame(d);
	};
}
function xh() {
	let e = document.getElementById("oceanParticlesCanvas");
	if (!e) return;
	let t = null;
	if (typeof navigator < "u" && "gpu" in navigator) try {
		t = qm({ canvas: e }), t.ready.catch((t) => {
			console.warn("[ASTRX FFT Ocean WebGPU init error, switching to fallback]:", t), e = lh(e), Sh(e);
		});
	} catch (t) {
		console.warn("[ASTRX FFT Ocean WebGPU exception, switching to fallback]:", t), e = lh(e), Sh(e);
	}
	else Sh(e);
	return () => {
		t?.dispose();
	};
}
function Sh(e) {
	let t = e.getContext("2d");
	if (!t) return;
	let n = e.width = e.clientWidth || window.innerWidth, r = e.height = e.clientHeight || window.innerHeight;
	window.addEventListener("resize", () => {
		n = e.width = e.clientWidth || window.innerWidth, r = e.height = e.clientHeight || window.innerHeight;
	});
	let i = 0;
	function a() {
		i += .018, t.fillStyle = "rgba(0, 2, 8, 0.28)", t.fillRect(0, 0, n, r);
		let e = r * .62;
		for (let r = 0; r < 50; r++) for (let a = 0; a < 80; a++) {
			let o = (a - 40) * 26, s = (r + 1) * 20, c = Math.sin(a * .15 + i * 1.6 + r * .22) * 26, l = Math.cos(r * .2 - i * 1.3 + a * .09) * 18, u = Math.sin((a + r) * .09 + i * .9) * 14, d = c + l + u, f = 340 / (340 + s), p = n / 2 + o * f, m = e + (d + 70) * f, h = (d + 50) / 100, g = Math.floor(35 + h * 80), _ = Math.floor(140 + h * 115), v = Math.floor(215 + h * 40);
			t.fillStyle = `rgb(${g}, ${_}, ${v})`, t.globalAlpha = Math.min(1, Math.max(.18, f * 1.4));
			let y = Math.max(.8, 2.6 * f);
			t.beginPath(), t.arc(p, m, y, 0, Math.PI * 2), t.fill();
		}
		t.globalAlpha = 1, requestAnimationFrame(a);
	}
	requestAnimationFrame(a);
}
function Ch() {
	let e = document.getElementById("spaceSection"), t = document.getElementById("spaceIntroOverlay"), n = document.getElementById("spaceIntroText"), r = document.getElementById("blackHoleCanvas"), i = document.getElementById("blackholeLogoOverlay") || document.getElementById("blackholeLeftOverlay"), a = document.getElementById("logoLeftTitle"), o = document.getElementById("logoRightLabel"), s = document.getElementById("missionSection"), c = document.getElementById("missionStatementText"), l = document.getElementById("missionCtas"), u = "idle", d = null, f = null;
	function p() {
		clearTimeout(d), clearTimeout(f);
	}
	function m(e) {
		u !== e && (u = e, e === "intro" ? (p(), ch.playCosmicTransition(), r && (r.className = "", r.style.opacity = "0"), vh(), i?.classList.remove("visible"), a?.classList.remove("visible"), o?.classList.remove("visible"), t && (t.style.opacity = "1"), n?.classList.remove("fade-out"), n?.classList.add("visible"), d = setTimeout(() => {
			u === "intro" && m("blackhole_centered");
		}, 1800)) : e === "blackhole_centered" ? (p(), n && (n.classList.remove("visible"), n.classList.add("fade-out")), t && (t.style.opacity = "0"), r && (r.className = "visible-center", r.style.opacity = "1"), f = setTimeout(() => {
			u === "blackhole_centered" && m("panning_and_logo");
		}, 1800)) : e === "panning_and_logo" && (p(), r && (r.className = "panned-right"), i && i.classList.add("visible"), yh(), setTimeout(() => {
			a?.classList.add("visible"), o?.classList.add("visible");
		}, 1600)));
	}
	function h() {
		let d = window.innerHeight;
		if (!e) return;
		let f = e.getBoundingClientRect();
		if (f.top <= d * .45 && f.bottom >= d * .2 ? u === "idle" && m("intro") : f.top > d * .52 && (p(), u = "idle", t && (t.style.opacity = "0"), n?.classList.remove("visible"), n?.classList.remove("fade-out"), r && (r.className = "", r.style.opacity = "0"), vh(), i?.classList.remove("visible"), a?.classList.remove("visible"), o?.classList.remove("visible")), s) {
			let e = s.getBoundingClientRect();
			e.top <= d * .82 ? (c?.classList.add("visible"), l?.classList.add("visible")) : e.top > d * .98 && (c?.classList.remove("visible"), l?.classList.remove("visible"));
		}
	}
	let g = null;
	function _() {
		clearTimeout(g), g = setTimeout(() => {
			if (!e) return;
			let t = e.getBoundingClientRect(), n = window.innerHeight;
			t.top > 25 && t.top < n * .52 ? e.scrollIntoView({ behavior: "smooth" }) : t.top >= n * .52 && t.top < n - 25 && document.getElementById("heroSection")?.scrollIntoView({ behavior: "smooth" });
		}, 140);
	}
	window.addEventListener("scroll", h, { passive: !0 }), window.addEventListener("scroll", _, { passive: !0 }), h();
}
function wh() {
	typeof window < "u" && window.__ASTRX_LANDING_STARTED__ || (typeof window < "u" && (window.__ASTRX_LANDING_STARTED__ = !0), uh(), dh(), bh(), xh(), Ch());
}
typeof document < "u" && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", wh) : wh());
//#endregion
export { dh as initBlackHole, xh as initParticlesOcean, Ch as initScrollDirector, bh as initStarLogoSwarm, uh as initTypewriter, vh as resetLogoMorph, yh as triggerLogoFormation };
