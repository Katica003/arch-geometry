const Flatten = window["@flatten-js/core"]
const Extra = window["@isti/flatten-js-extra"]

const inputDescriptions = [
  { name: 'span', min: 0, max: 6, step: 0.1, initial: 4.2 },
  { name: 'height', min: 0, max: 6, step: 0.1, initial: 2.5 },
  { name: 'distributedForce', min: 0, max: 10, step: 0.1, initial: 2 },
  { name: 'dx', min: 0, max: 10, step: 1, initial: 4 }
]

const update = () => {
  const {
    span,
    height,
    distributedForce,
    dx
  } = readInputs(inputDescriptions)
  const outputs = []

  const center = new Flatten.Point(0, 0)

  const xAxis = new Flatten.Line(
    center,
    new Flatten.Vector(center, new Flatten.Point(0, 1))
  )

  const yAxis = new Flatten.Line(
    center,
    new Flatten.Vector(center, new Flatten.Point(1, 0))
  )

  outputs.push(xAxis, yAxis)

  for (let i = -dx; i <= dx; i++) {
    const vline = new Flatten.Line(
      new Flatten.Point((span/2)/dx*i, 0),
      new Flatten.Point((span/2)/dx*i, 1)
    )
    vline.attrs = { stroke: 'green' }
    outputs.push(vline)
  }
  // const textA = new Extra.Text(A, 'A')
  // outputs.push(A, textA)

  // const archFunction = x => (10 * Math.cosh(span * x/10))
  // const f = new Extra.Formula(archFunction, -10, 10, 1)
  // outputs.push(f)

  const arch1Inverse = y => Math.acosh(-y + 1 + height)
  const arch1Inverse0 = arch1Inverse(0)
  const arch1Function = x => (-Math.cosh(x * arch1Inverse0 / span*2) + 1 + height)
  const f = new Extra.Formula(arch1Function, -10, 10, 0.01)
  outputs.push(f)

  // const P = f.intersect(xAxis)[0]

  const P = new Flatten.Point(span/2, 0)
  const textP = new Extra.Text(P, 'P')
  outputs.push(P, textP)

  // const arch2Function = x => (-1 * Math.cosh(.x * x) + 1 + height)
  // const g = new Extra.Formula(arch2Function, -5, 5, 0.01)
  // outputs.push(P)

  // const segment1 = new Flatten.Segment(A, new Flatten.Point(3, 4))
  // const segment2 = new Flatten.Segment(new Flatten.Point(1, 1), new Flatten.Point(4, 7))

  // outputs.push(segment1, segment2)

  // segment1.intersect(segment2).forEach(p => {
  //   outputs.push(p)
  // })

  // if (tmp.length > 0) {
  //   const pointE = tmp[0]
  //   pointE.attrs = { r: 10, fill: 'green' }
  //   const text = new Extra.Text(pointE, 'Intersection')

  //   outputs.push(pointE, text)
  // }

  // const f = new Extra.Formula(x => (10 * Math.cosh(test * x / 300)), -100, 100, 1)
  // f.attrs = { stroke: 'red', strokeWidth: 3 }
  // outputs.push(f)

  // const tmp2 = f.intersect(segment2)
  // if (tmp2.length > 0) {
  //   const pointF = tmp2[0]
  //   pointF.attrs = { r: 5, fill: 'yellow' }
  //   const text = new Extra.Text(pointF, 'S')

  //   outputs.push(pointF, text)
  // }

  return outputs
}

window.addEventListener('load', () => {
  window.framework.init(inputDescriptions, update)
})
