// https://math.stackexchange.com/questions/4917740/which-faces-does-sphere-lattice-polyhedron-operatornamehullp-in-mathbbz
//
const jscad = require('@jscad/modeling')
const { star } = jscad.primitives
const { hull } = jscad.hulls
const { geom3 } = jscad.geometries
const { colorize } = jscad.colors
const { cuboid, sphere, cylinder } = jscad.primitives
const { rotate, translate, scale:scale3d } = jscad.transforms
const { angle, add, length, subtract, scale, dot } = jscad.maths.vec3
const { fromPoints } = jscad.maths.plane

function hullFromPoints3(listofpoints) {
  return hull([geom3.create(),
    geom3.fromPoints(listofpoints.map((p) => [p,p,p]))])
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
  h = hullFromPoints3(out) 
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
      }
      normals.push(colorize([1,1,1],line3(cent, add(aux2,cent,fplane))))
    })
    if (params.display.startsWith("faces+normals")){
      return params.display==="faces+normals" ? [h, normals] : [h, normals, angles]
    }
    if (params.display==="sphere+edges+vertices (slowest)"){
      return [sphere({radius: R-0.1}), edges, vertices]
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
    { name: 'display', type: 'choice', values: ['faces', 'faces+normals', 'faces+normals(+centroids)', 'edges+vertices (slow)', 'faces+edges+vertices (slower)', 'sphere+edges+vertices (slowest)'], initial: 'faces', caption: 'display' },
  ]
}

module.exports = { main, getParameterDefinitions }
