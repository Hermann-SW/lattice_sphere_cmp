// https://math.stackexchange.com/questions/4917740/which-faces-does-sphere-lattice-polyhedron-operatornamehullp-in-mathbbz
//
const jscad = require('@jscad/modeling')
const { star } = jscad.primitives
const { hull } = jscad.hulls
const { geom3 } = jscad.geometries
const { colorize } = jscad.colors
const { cuboid, sphere, cylinder } = jscad.primitives
const { rotate, translate } = jscad.transforms
const { add, length, subtract, scale } = jscad.maths.vec3
const { union } = jscad.booleans

function hullFromPoints3(listofpoints) {
  return hull([geom3.create(),
    geom3.fromPoints(listofpoints.map((p) => [p,p,p]))])
}

segments = 6
reusedsphere = sphere({radius:0.075, segments: segments})
function fastvertex(c) { return(translate(c, reusedsphere)) }

function edge(_v, _w) {
    d = [0, 0, 0]
    w = [0, 0, 0]
    subtract(d, _w, _v)
    add(w, _v, _w)
    scale(w, w, 0.5)
    return translate(w,
             rotate([0, Math.acos(d[2]/length(d)), Math.atan2(d[1], d[0])],
               cylinder({radius: 0.05, height: length(d), segments: segments})
             )
           )
}

function main(params) {
  if(params.cmp==="= n"){j=params.n;while(j%4==0)j>>=2;if(j%8==7)return(star())}
  n = (params.cmp==="= pq") ? params.p*params.q : params.n
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

  if(params.display!=="faces"){
    edges = []
    vertices = []
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
    })
    if (params.display==="sphere+edges+vertices (slowest)"){
      return union(sphere({radius: R-0.1}), edges, vertices)
    }
    return params.display==="edges+vertices (slow)" ? union(edges, vertices) : union(h, edges, vertices)
  }

  return h
}

function getParameterDefinitions() {
  return [
    { name: 'n', type: 'slider', initial: 96, min: 3, max: 100, step: 1, caption: 'n:', live: true },
    { name: 'cmp', type: 'choice', values: ['≤ n', '= n', "= pq"], initial: '≤ n', caption: 'x²+y²+z²' },
    { name: 'p', type: 'choice', values: [5, 13, 17, 29, 37, 41, 53, 61, 73, 89, 97], initial: 13, caption: 'p' },
    { name: 'q', type: 'choice', values: [5, 13, 17, 29, 37, 41, 53, 61, 73, 89, 97], initial: 17, caption: 'q' },
    { name: 'display', type: 'choice', values: ['faces', 'edges+vertices (slow)', 'faces+edges+vertices (slower)', 'sphere+edges+vertices (slowest)'], initial: 'faces', caption: 'display' },
  ]
}

module.exports = { main, getParameterDefinitions }
