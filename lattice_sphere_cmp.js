const jscad = require('@jscad/modeling')
const { hull } = require('@jscad/modeling').hulls
const { sphere } = jscad.primitives
const { translate } = jscad.transforms

reusedvertex = sphere({radius:0.25})
function fastvertex(c) { return(translate(c, reusedvertex)) }

function main(params) {
  m = Math.floor(Math.sqrt(params.n))
  out = []
  for(x=-m;x<=m;++x)
    for(y=-m;y<=m;++y)
      for(z=-m;z<=m;++z)
        if (x*x+y*y+z*z<=params.n)
          out.push(fastvertex([x,y,z]))
  return hull(out)
}

function getParameterDefinitions() {
  return [
    { name: 'n', type: 'slider', initial: 42, min: 3, max: 100, step: 1, caption: 'n:' },
  ]
}

module.exports = { main, getParameterDefinitions }
