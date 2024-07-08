// https://hermann-sw.github.io/lattice_sphere_cmp/se.html
// https://github.com/Hermann-sw/lattice_sphere_cmp/
//
const jscad = require('@jscad/modeling')
const { geom3 } = jscad.geometries
const { colorize } = jscad.colors
const { sphere, cylinder } = jscad.primitives
const { translate, rotate, scale:scale3d } = jscad.transforms
const { vec3 } = jscad.maths

const det = ([[a,b,c],[d,e,f],[g,h,i]]) => a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)
const rep = (A,b,i) => (C=[A[0].slice(),A[1].slice(),A[2].slice()],
                        C[0][i]=b[0],C[1][i]=b[1],C[2][i]=b[2], C)
const solve = (A,b) =>
  (d=det(A), [det(rep(A,b,0))/d, det(rep(A,b,1))/d, det(rep(A,b,2))/d])

const assert = (b) => {if(!b){throw("assert")}}

function inv([[a,b,c],[d,e,f],[g,h,i]]){ // https://stackoverflow.com/a/72596891
  let x=e*i-h*f, y=f*g-d*i, z=d*h-g*e, det=a*x+b*y+c*z; assert(det != 0);
  return [[x, c*h-b*i, b*f-c*e], [y, a*i-c*g, d*c-a*f], [z, g*b-a*h, a*e-d*b]]
    .map(r => r.map(v => v /= det));
}

const mul = ([[a,b,c],[d,e,f],[g,h,i]],[x,y,z]) => [x*a+y*b+z*c,x*d+y*e+z*f,x*g+y*h+z*i]

segments = 36
const oneCylinder = cylinder({radius: 1, height: 1, segments: segments})
let reusedsphere = sphere({radius:0.1, segments: segments})
function fastvertex(c) { return(translate(c, reusedsphere)) }

function edge(_v, _w, r = 0.05, segs = segments) {
    d = [0, 0, 0]
    w = [0, 0, 0]
    vec3.subtract(d, _w, _v)
    vec3.add(w, _v, _w)
    vec3.scale(w, w, 0.5)
    return translate(w,
             rotate([0, Math.acos(d[2]/vec3.length(d)), Math.atan2(d[1], d[0])],
               scale3d([r,r,vec3.length(d)],oneCylinder)
             )
           )
}

function main(params) {
  n = 17
  G=[[-17, -21, -84],[4, 5, 20],[1, 1, 5]]

  m = Math.floor(Math.sqrt(n))
  out = []
  for(x=-m;x<=m;++x)
    for(y=-m;y<=m;++y)
      for(z=-m;z<=m;++z)
        if (x*x+y*y+z*z==n)
          out.push([x,y,z])
  console.log("#out=",out.length)
  h = geom3.fromPointsConvex(out) 
  v = h.polygons.map((o)=>o.vertices).flat()
  u = [...
    v.reduce((m,a) => (k=a.join("@"),m.has(k)?m:m.set(k,a)), new Map())
      .values()
  ];
  nfaces = h.polygons.length
  nedges = 0
  h.polygons.forEach((p) => nedges += p.vertices.length)
  nedges /= 2
  nvertices = nedges + 2 - nfaces
  console.log("#faces="+nfaces+" #edges="+nedges+" #vertices="+nvertices)
  assert(u.length==nvertices)
  assert(out.length==nvertices)
  
  console.log(JSON.stringify(G));
  console.log(JSON.stringify(inv(G)));
  console.log(JSON.stringify(mul(inv(G),[0,0,1])));

  vs=[];
  out.forEach(u => vs.push(fastvertex(mul(G,u))))
  es=[];
  h.polygons.forEach((p)=>{
    ps = p.vertices
    for(i=0;i<ps.length;i++){
      es.push(
        edge(
          mul(G, ps[i]), 
          mul(G, ps[(i+1)%ps.length])
        )
      )
    }
  })

  return [
    colorize([0,0,1,0.5],h),
    colorize([1,0,0],vs),
    colorize([0,1,0],es)
  ]
}

module.exports = { main }
