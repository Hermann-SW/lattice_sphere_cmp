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

function main(params) {
  n = params.n
  m = Math.floor(Math.sqrt(n))
  out = []
  for(x=-m;x<=m;++x)
    for(y=-m;y<=m;++y)
      for(z=-m;z<=m;++z)
        if (x*x+y*y+z*z<=n)
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

  return h
}

function getParameterDefinitions() {
  return [
    { name: 'n', type: 'slider', initial: 96, min: 3, max: 100, step: 1, caption: 'n:', live: true },
 ]
}

module.exports = { main, getParameterDefinitions }
