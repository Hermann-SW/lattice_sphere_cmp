const jscad = require('@jscad/modeling')
const { geom3 } = jscad.geometries
const { colorize } = jscad.colors
const { sphere } = jscad.primitives
const { translate } = jscad.transforms
const { vec3 } = jscad.maths

const det = ([[a,b,c],[d,e,f],[g,h,i]]) => a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)
const rep = (A,b,i) => (C=[A[0].slice(),A[1].slice(),A[2].slice()],
                        C[0][i]=b[0],C[1][i]=b[1],C[2][i]=b[2], C)
const solve = (A,b) =>
  (d=det(A), [det(rep(A,b,0))/d, det(rep(A,b,1))/d, det(rep(A,b,2))/d])

const assert = (b) => {if(!b){throw("assert")}}

segments = 6
let reusedsphere = sphere({radius:1, segments: segments})
function fastvertex(c) { return(translate(c, reusedsphere)) }

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
    v.reduce((m,a) => (k=a.join(""),m.has(k)?m:m.set(k,a)), new Map())
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
  console.log(JSON.stringify(S))
  return [colorize([0,0,1,0.5],h), u.map((v)=>fastvertex(v)), 
          colorize([0.5,0.5,0.5,0.6], geom3.fromPointsConvex(S)),
          colorize([1,1,1], fastvertex(c))]
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
