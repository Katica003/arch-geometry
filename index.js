const Flatten = window["@flatten-js/core"]
const Extra = window["@isti/flatten-js-extra"]

const inputDescriptions = [
  { name: 'span', min: 0, max: 6, step: 0.1, initial: 4.2 },
  { name: 'height', min: 0, max: 6, step: 0.1, initial: 2.5 },
  { name: 'distributedForce', min: 0, max: 10, step: 0.1, initial: 2 },
  { name: 'hForce', min: 0, max: 10, step: 0.1, initial: 2 },
  { name: 'dx', min: 0, max: 10, step: 1, initial: 4 }
]

const makeHalfArch = (
  direction,
  { span, height, distributedForce, hForce, dx }
) => {
  const outputs = []

  const lineSep = (span / 2) / dx

  const lines = []
  for (let i = 0; i <= dx; i++) {
    const vline = new Flatten.Line(
      new Flatten.Point(lineSep * i * direction, 0),
      new Flatten.Point(lineSep * i * direction, 1)
    )
    vline.attrs = { stroke: 'green' }
    lines.push(vline)
  }
  outputs.push(...lines)

  const midlines = []
  for (let i = 1; i <= dx + 1; i++) {
    const vline = new Flatten.Line(
      new Flatten.Point(((-0.5 * lineSep) + lineSep * i) * direction, 0),
      new Flatten.Point(((-0.5 * lineSep) + lineSep * i) * direction, 1)
    )
    vline.attrs = { stroke: 'green', strokeDashArray: '0.1' }
    midlines.push(vline)
  }
  outputs.push(...midlines)

  const arch1Inverse = y => Math.acosh(-y + 1 + height)
  const arch1Inverse0 = arch1Inverse(0)
  const arch1Function = x => (-Math.cosh(x * arch1Inverse0 / span * 2) + 1 + height)
  const f = new Extra.Formula(arch1Function, 0, 10 * direction, 0.01 * direction)
  outputs.push(f)

  const points = []
  for (let i = 0; i <= dx + 1; i++) {
    const x = lineSep * direction * i
    const Pdx = new Flatten.Point(x, arch1Function(x))

    Pdx.attrs = { r: 5, fill: 'green' }
    points.push(Pdx)
    // outputs.push(new Extra.Text(Pdx, `P<tspan dy ="0.1">${i * direction}</tspan>`))
  }
  outputs.push(...points)

  const vectors = [new Flatten.Vector(direction, 0)]
  let cumulativeForce = 0
  for (let i = 1; i < points.length; i++) {
    const d = points[i].distanceTo(points[i - 1])[0]
    cumulativeForce += d * distributedForce
    const v = new Flatten.Vector(hForce * direction, -cumulativeForce)

    vectors.push(v)
  }

  const newPoints = [points[0]]
  for (let i = 0; i < vectors.length - 1; i++) {
    const prevPoint = newPoints.slice(-1)[0]
    const line = new Flatten.Line(prevPoint, vectors[i].rotate90CW())
    const nextPoint = line.intersect(midlines[i])[0]
    newPoints.push(nextPoint)
    outputs.push(new Flatten.Segment(prevPoint, nextPoint))
  }
  outputs.push(...newPoints)

  return outputs
}

const update = () => {
  const inputValues = readInputs(inputDescriptions)
  // const {
  //   span,
  //   height,
  //   distributedForce,
  //   hForce,
  //   dx
  // } = inputValues
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

  outputs.push(...makeHalfArch(-1, inputValues))
  outputs.push(...makeHalfArch(1, { ...inputValues, hForce: inputValues.hForce + 1 }))

  return outputs
}

window.addEventListener('load', () => {
  window.framework.init(inputDescriptions, update)
})
