// https://math.stackexchange.com/questions/4917740/which-faces-does-sphere-lattice-polyhedron-operatornamehullp-in-mathbbz
//
const jscad = require('@jscad/modeling')
const { star } = jscad.primitives
const { hull } = jscad.hulls
const { geom3, poly3 } = jscad.geometries
const { colorize } = jscad.colors
const { cuboid, sphere, cylinder, circle } = jscad.primitives
const { rotate, translate, translateX, scale:scale3d } = jscad.transforms
const { angle, add, length, subtract, scale, dot } = jscad.maths.vec3
const { vec3, plane } = jscad.maths
const { fromPoints } = jscad.maths.plane

const { vectorText } = jscad.text
const { union } = jscad.booleans
const { extrudeLinear } = jscad.extrusions
const { measureBoundingBox } = jscad.measurements
const { hullChain } = jscad.hulls

function txt(mesg, w) {
    const lineRadius = w / 8 // 2
    const lineCorner = circle({ radius: lineRadius })

    const lineSegmentPointArrays = vectorText({ x: 0, y: 0, height: 0.125, input: mesg })

    const lineSegments = []
    lineSegmentPointArrays.forEach(function(segmentPoints) {
        const corners = segmentPoints.map((point) => translate(point, lineCorner))
        lineSegments.push(hullChain(corners))
    })
    const message2D = union(lineSegments)
    ret = extrudeLinear({ height: w }, message2D)
    return ret
}

let map = new Map()

function txt2(mesg, w) {
    let xofs = 0
    let ret = []
    for(i in mesg){
      if(map.get(mesg[i])===undefined) { 
        map.set(mesg[i], txt(mesg[i], w))
      }
      ret.push(translateX(xofs, map.get(mesg[i])))
      xofs += measureBoundingBox(map.get(mesg[i]))[1][0]
    }
    return ret
}

function vtxt(p1, num) {
    str = num.toString()
    la1 = Math.atan2(p1[1], p1[0])    
    ph1 = Math.PI/2-Math.acos(p1[2]/vec3.length(p1))
    lab = txt2(str, 0.05)
    return translate([0, 0, 0],
        rotate([0, 0, la1],
            rotate([0, -ph1, 0],
                translate([vec3.length(p1)+0.1, -measureBoundingBox(lab[lab.length-1])[1][0]/2],
                    rotate([Math.PI/2, 0, Math.PI/2],
                        colorize([1, 1, 1],
                            lab
                        )
                    )
                )
            )
        )
    )
}

segments = 6
const oneCylinder = cylinder({radius: 1, height: 1, segments: segments})
let reusedsphere = undefined
function fastvertex(c) { return(translate(c, reusedsphere)) }

function edge(_v, _w, r = 0.05, segs = segments) {
    d = [0, 0, 0]
    w = [0, 0, 0]
    subtract(d, _w, _v)
    add(w, _v, _w)
    scale(w, w, 0.5)
    return translate(w,
             rotate([0, Math.acos(d[2]/length(d)), Math.atan2(d[1], d[0])],
               scale3d([r,r,length(d)],oneCylinder)
             )
           )
}

let nsqrt = 0

const line3 = ((_v, _w) => edge(_v, _w, 0.004*nsqrt, segments));

const centroid = ((ps) => { ret=[0,0,0]
  ps.forEach((p) => add(ret, ret, p))
  return  scale(ret, ret, 1.0/ps.length)
})

const isPointOnPlane = (pla, pt, tol=1e-10) =>
  Math.abs(vec3.dot(pt, pla) - pla[3]) < tol

const arePointsOnPlane = (pla, pts, tol=1e-10) =>
  pts.every((p) => isPointOnPlane(pla, p, tol))

// issue #1347 workaround: works for all points in same plane as well
function fromPointsConvex(pts) {
  pla = plane.fromPoints(plane.create(), ...pts)

  if (!arePointsOnPlane(pla, pts)) {
    console.log("foobar")
    return geom3.fromPointsConvex(pts)
  }

  np = vec3.subtract(vec3.create(),
                     pts[0],
                     vec3.scale(vec3.create(), pla, 1e-3)
                    )

  g = geom3.fromPointsConvex([np, ...pts])

  p3 = g.polygons.reduce((a,p) =>
    (p!==undefined&&!p.vertices.some((v)=>vec3.equals(v,np)))?a=p:a,{})

  g.polygons = [p3, poly3.invert(p3)]

  return g
}

const assert = (b) => {if(!b){throw("assert")}}

function fromPointsConvexPlaneℤ3(pts) {
  allℤ = pts.every((p) => p.every((e) => Number.isInteger(e)))
  console.assert(allℤ); assert(allℤ)

  s01 = vec3.subtract(vec3.create(), pts[1], pts[0])
  s02 = pts.reduce((a,p) =>
    (p!=undefined && (
      s = vec3.subtract(vec3.create(), p, pts[0]),
      !vec3.equals([0,0,0], vec3.cross(vec3.create(), s01, s)))
    )
    ? a=s : a,
    {}
  )

  nor = vec3.cross(vec3.create(), s01, s02)
  console.assert(b = !vec3.equals([0,0,0], nor)); assert(b)

  d = vec3.dot(pts[0], nor)
  samePlane = pts.every((p) => (d == vec3.dot(p, nor)))
  console.assert(samePlane); assert(samePlane)

  np = vec3.subtract(vec3.create(), pts[0], nor)

  g = geom3.fromPointsConvex([np, ...pts])

  p3 = g.polygons.reduce((a,p) =>
    (p !== undefined && !p.vertices.some((v) => vec3.equals(v, np)))
    ? a=p : a,
    {}
  )

  g.polygons = [p3, poly3.invert(p3)]

  return g
}

// https://en.wikipedia.org/wiki/Sum_of_squares_function#k_=_3
// computed with PARI/GP: 12*qfbclassno(-4*p*q)
const r3 = ((p,q) => R3[P1.indexOf(p)][P1.indexOf(q)])
P1=[5, 13, 17, 29, 37, 41, 53, 61, 73, 89, 97]
R3=[[0,96,48,96,192,96,96,192,240,96,240],
[96,0,192,192,192,144,480,96,144,336,240],
[48,192,0,144,432,96,288,240,384,192,576],
[96,192,144,0,288,240,192,768,432,432,720],
[192,192,432,288,0,576,384,288,576,528,528],
[96,144,96,240,576,0,240,672,576,480,672],
[96,480,288,192,384,240,0,672,1104,288,864],
[192,96,240,768,288,672,672,0,288,912,384],
[240,144,384,432,576,576,1104,288,0,768,768],
[96,336,192,432,528,480,288,912,768,0,768],
[240,240,576,720,528,672,864,384,768,768,0]]

function main(params) {
  if(params.cmp==="= n"){j=params.n;while(j%4==0)j>>=2;if(j%8==7)return(star())}
  n = (params.cmp==="= pq") ? params.p*params.q : params.n
  nsqrt = Math.sqrt(n)
  reusedsphere = sphere({radius:0.007*nsqrt, segments: segments})
  m = Math.floor(Math.sqrt(n))
  cmp = params.cmp==="≤ n" ? ((x,y) => x<=y) : ((x,y) => x==y)
  out = []
  for(x=-m;x<=m;++x)
    for(y=-m;y<=m;++y)
      for(z=-m;z<=m;++z)
        if (cmp(x*x+y*y+z*z,n))
          out.push([x,y,z])
  h = geom3.fromPointsConvex(out) 
  cnt=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  bad=false
  h.polygons.forEach((p)=>{
    l=p.vertices.length;
    if(l<3 || l==11 || (l>12 && l!=18)) {bad=true;console.log("bad "+l)} else {cnt[l]++}
  })
  for(i=3;i<=18;++i){
    if((i<=10||i==12||i==18)&&cnt[i]>0) {console.log(i+"-gons: "+cnt[i])}
  }
  console.log(bad?"bad!!!":"ok")
  for(i=18;;--i) if(cnt[i]>0) break;
  
  done=false
  h.polygons.forEach((p)=>{
    if(!done && p.vertices.length==i){
      console.log("first max length face: "+JSON.stringify(p.vertices))
      done=true
    }
  })

  nfaces = h.polygons.length
  nedges = 0
  h.polygons.forEach((p) => nedges += p.vertices.length)
  nedges /= 2
  nvertices = nedges + 2 - nfaces
  console.log("#faces="+nfaces+" #edges="+nedges+" #vertices="+nvertices)
  if(params.cmp==="= pq")
    if(r3(params.p,params.q)!=0)
      console.log("r3(pq)=",r3(params.p,params.q))

  if(params.display!=="faces"){
    edges = []
    vertices = []
    normals = []
    angles = []
    outside = []
    R = m+1
    h.polygons.forEach((p)=>{
      vs = p.vertices
      for(i=0;i<vs.length;i++){
        edges.push(edge(vs[i], vs[(i+1)%vs.length]))
        w = [0, 0, 0]
        add(w, vs[i], vs[(i+1)%vs.length])
        scale(w, w, 0.5)
        if(length(w)<R)  R=length(w)
        vertices.push(fastvertex(vs[i]))
      }

      fplane = []
      aux = []
      aux2 = []
      fromPoints(fplane, ...vs)
      cent = centroid(vs)
      if(0!==angle(cent,fplane)) {
        if (params.display.startsWith("faces+normals(")) {
          console.log(cent,fplane)
          console.log(scale(aux,fplane,fplane[3]))
          console.log(angle(cent,fplane))
        }
        angles.push(colorize([1,1,1],fastvertex(cent)))
        outside.push(line3(scale(vec3.create(),fplane,fplane[3]),cent))
        if(params.text===true)
        vs.forEach((v)=>outside.push(vtxt(v,JSON.stringify(v))))

        outside.push(fromPointsConvexPlaneℤ3(vs))
      }
      normals.push(colorize([1,1,1],line3(cent, add(aux2,cent,fplane))))
    })
    if (params.display.startsWith("faces+normals")){
      return params.display==="faces+normals" ? [h, normals] : [h, normals, angles]
    }
    if (params.display==="sphere+edges+vertices (slowest)"){
      return [sphere({radius: R-0.1}), edges, vertices]
    }
    if (params.display==="centroid!=normal +face"){
      return [outside, edges]
    }
    return params.display==="edges+vertices (slow)" ? [edges, vertices] : [h, edges, vertices]
  }

  return h
}

function getParameterDefinitions() {
  return [
    { name: 'n', type: 'slider', initial: 96, min: 3, max: 100, step: 1, caption: 'n:', live: true },
    { name: 'cmp', type: 'choice', values: ['≤ n', '= n', "= pq"], initial: '≤ n', caption: 'x²+y²+z²' },
    { name: 'p', type: 'choice', values: [5, 13, 17, 29, 37, 41, 53, 61, 73, 89, 97], initial: 13, caption: 'p' },
    { name: 'q', type: 'choice', values: [5, 13, 17, 29, 37, 41, 53, 61, 73, 89, 97], initial: 17, caption: 'q' },
    { name: 'display', type: 'choice', values: ['faces', 'faces+normals', 'faces+normals(+centroids)', 'centroid!=normal +face', 'edges+vertices (slow)', 'faces+edges+vertices (slower)', 'sphere+edges+vertices (slowest)'], initial: 'faces', caption: 'display' },
    { name: 'text', type: 'checkbox', checked: false, caption: 'text:' },
  ]
}

module.exports = { main, getParameterDefinitions }
