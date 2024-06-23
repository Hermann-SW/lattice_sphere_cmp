// https://hermann-sw.github.io/lattice_sphere_cmp/tangential_faces.html
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

segments = 6
const oneCylinder = cylinder({radius: 1, height: 1, segments: segments})
let reusedsphere = sphere({radius:1, segments: segments})
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

const line3 = ((_v, _w) => edge(_v, _w, 0.05, segments));

const tol = 1e-6
const equals = (v,w) => Math.abs(v-w)<tol

function main(params) {
  l=12
  o=[params.ox,params.oy,params.oz]
  out = [[-20,-4,-4],[-4,-20,4],[-l,l,-l],[-4,4,12],
         [l,-l,-l],[l,-l,l],[l,l,-l],[l,l,l]]
        .map((p)=>vec3.add(vec3.create(), p, o))
  h = geom3.fromPointsConvex(out) 
  v = h.polygons.map((o)=>o.vertices).flat()
  u = [...
    v.reduce((m,a) => (k=a.join("@"),m.has(k)?m:m.set(k,a)), new Map())
      .values()
  ];

  c = vec3.add(vec3.create(), o, [params.cx,params.cy,params.cz])
  
      S = []
      h.polygons.forEach((p) => {
          vs = p.vertices
          prevprev = vec3.subtract(vec3.create(),vs[vs.length-2], c)
          dpp = vec3.dot(prevprev, prevprev)
          prev = vec3.subtract(vec3.create(),vs[vs.length-1], c)
          dp = vec3.dot(prev, prev)

          vs.forEach((p) => {
            P = vec3.subtract(vec3.create(),p, c)
            const d = vec3.dot(P, P)

            s = solve([prevprev,prev,P],[dpp,dp,d])

            S.push(vec3.add(vec3.create(), s, c))

            prevprev = prev
            dpp = dp
            prev = P
            dp = d
          });
        }
      )
  //console.log(JSON.stringify(S))
  g = geom3.fromPointsConvex(S)
  nfaces = g.polygons.length
  nedges = 0
  g.polygons.forEach((p) => nedges += p.vertices.length)
  nedges /= 2
  nvertices = nedges + 2 - nfaces
  console.log("dual: #faces="+nfaces+" #edges="+nedges+" #vertices="+nvertices)

  return [colorize([0,0,1,0.5],h), u.map((v)=>fastvertex(v)), 
          colorize([0.5,0.5,0.5,0.6], g),
          colorize([1,1,1], fastvertex(c)),
          u.map((p)=> colorize([0.5,0.5,0.5], line3(c,p)))]
}

function getParameterDefinitions() {
  return [
    { name: 'cx', type: 'slider', initial: 0, min: -10, max: 10, step: 1, caption: 'cx:', live: true },
    { name: 'cy', type: 'slider', initial: 0, min: -10, max: 10, step: 1, caption: 'cy:', live: true },
    { name: 'cz', type: 'slider', initial: 0, min: -10, max: 10, step: 1, caption: 'cz:', live: true },
    { name: 'ox', type: 'slider', initial: 0, min: -30, max: 30, step: 1, caption: 'ox:', live: true },
    { name: 'oy', type: 'slider', initial: 0, min: -30, max: 30, step: 1, caption: 'oy:', live: true },
    { name: 'oz', type: 'slider', initial: 0, min: -30, max: 30, step: 1, caption: 'oz:', live: true },
  ]
}

module.exports = { main, getParameterDefinitions }
