const Flatten = window['@flatten-js/core']
const Extra = window['@isti/flatten-js-extra']

const inputs = [
  { name: 'dx', min: 0, max: 10, step: 1, initial: 4 },
  { name: 'span', min: 0, max: 6, step: 0.1, initial: 4.2 },
  { name: 'height', min: 0, max: 6, step: 0.1, initial: 2.5 },
  { name: 'thickness', min: 0, max: 0.2, step: 0.01, initial: 0.06 },
  { name: 'distributedForce', min: 0, max: 10, step: 0.1, initial: 2 },

  { name: 'snowDistributedForceL', min: 0, max: 10, step: 0.1, initial: 0 },
  { name: 'hForceL', min: 0, max: 10, step: 0.1, initial: 2.3 },

  { name: 'snowDistributedForceR', min: 0, max: 10, step: 0.1, initial: 0 },
  { name: 'hForceR', min: 0, max: 10, step: 0.1, initial: 2.3 }

]

const makeHalfArch = (
  direction,
  { span, height, distributedForce, snowDistributedForce, hForce, dx, thickness }
) => {
  const outputs = []

  const lineSep = (span / 2) / dx

  const vlines = []
  for (let i = 0; i <= dx; i++) {
    const vline = new Flatten.Line(
      new Flatten.Point(lineSep * i * direction, 0),
      new Flatten.Point(lineSep * i * direction, 1)
    )
    vline.attrs = { stroke: 'green', strokeWidth: 0.01 }
    vlines.push(vline)
  }
  outputs.push(...vlines)

  const midlines = []
  for (let i = 1; i <= dx + 1; i++) {
    const vline = new Flatten.Line(
      new Flatten.Point(((-0.5 * lineSep) + lineSep * i) * direction, 0),
      new Flatten.Point(((-0.5 * lineSep) + lineSep * i) * direction, 1)
    )
    vline.attrs = { stroke: 'green', strokeWidth: 0.01, strokeDashArray: '0.1' }
    midlines.push(vline)
  }
  outputs.push(...midlines)

  const arch1Inverse = y => Math.acosh(-y + 1 + height)
  const arch1Inverse0 = arch1Inverse(0)
  const arch1Function = x => (-Math.cosh(x * arch1Inverse0 / span * 2) + 1 + height)
  const f = new Extra.Formula(arch1Function, 0, 10 * direction, 0.01 * direction)
  f.attrs = { stroke: 'rgba(50, 50, 50, 0.5)', strokeWidth: thickness }
  outputs.push(f)

  const points = []
  for (let i = 0; i <= dx + 1; i++) {
    const x = lineSep * direction * i
    const Pdx = new Flatten.Point(x, arch1Function(x))

    Pdx.attrs = { r: 0.02, fill: 'black' }
    points.push(Pdx)
    // outputs.push(new Extra.Text(Pdx, `P<tspan dy ="0.1">${i * direction}</tspan>`))
  }
  outputs.push(...points)

  const vectors = [new Flatten.Vector(direction, 0)]
  let cumulativeForce = 0
  for (let i = 1; i < points.length; i++) {
    const d = points[i].distanceTo(points[i - 1])[0]
    cumulativeForce += d * distributedForce + lineSep * snowDistributedForce
    const v = new Flatten.Vector(hForce * direction, -cumulativeForce)

    vectors.push(v)
  }

  const newPoints = [points[0]]
  for (let i = 0; i < vectors.length - 1; i++) {
    const prevPoint = newPoints.slice(-1)[0]
    const line = new Flatten.Line(prevPoint, vectors[i].rotate90CW())
    const nextPoint = line.intersect(midlines[i])[0]
    nextPoint.attrs = { r: 0.02, stroke: 'red' }
    newPoints.push(nextPoint)
  }
  // outputs.push(...newPoints)

  return [outputs, newPoints]
}

const update = ({
  span,
  height,
  thickness,
  distributedForce,
  snowDistributedForceL, snowDistributedForceR,
  hForceL, hForceR,
  dx
}) => {
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

  const [leftOutputs, leftPoints] = makeHalfArch(-1, {
    span,
    height,
    thickness,
    dx,
    distributedForce,
    snowDistributedForce: snowDistributedForceL,
    hForce: hForceL
  })

  const [rightOutputs, rightPoints] = makeHalfArch(1, {
    span,
    height,
    thickness,
    dx,
    distributedForce,
    snowDistributedForce: snowDistributedForceR,
    hForce: hForceR
  })

  outputs.push(...leftOutputs, ...rightOutputs)

  const allPoints = [...leftPoints.reverse(), ...rightPoints]
  let previousPoint = allPoints[0]
  const originalSegments = []
  for (let i = 1; i < allPoints.length; i++) {
    originalSegments.push(new Flatten.Segment(previousPoint, allPoints[i]))
    previousPoint = allPoints[i]
  }

  let newSpan = 0
  for (let i = 0; i < originalSegments.length; i++) {
    if (xAxis.intersect(originalSegments[i]).length !== 0) {
      newSpan = newSpan + xAxis.intersect(originalSegments[i])[0].distanceTo(center)[0]
    }
  }

  const correctedPoints = []
  if (snowDistributedForceL !== snowDistributedForceR) {
    for (let i = 0; i < allPoints.length; i++) {
      const correctedPoint = new Flatten.Point(allPoints[i].x * (span / newSpan), allPoints[i].y)
      correctedPoints.push(correctedPoint)
    }

    let previousCorrectedPoint = correctedPoints[0]
    const correctedSegments = []
    for (let i = 1; i < correctedPoints.length; i++) {
      correctedSegments.push(new Flatten.Segment(previousCorrectedPoint, correctedPoints[i]))
      previousCorrectedPoint = correctedPoints[i]
    }

    let shiftDistance
    for (let i = 0; shiftDistance === undefined; i++) {
      console.log(xAxis.intersect(correctedSegments[i]).length)
      if (xAxis.intersect(correctedSegments[i]).length !== 0) {
        shiftDistance = (xAxis.intersect(correctedSegments[i])[0].distanceTo(new Flatten.Point(-span / 2, 0))[0])
      }
    }

    const finalPoints = []
    for (const cp of correctedPoints) {
      const finalPoint = new Flatten.Point(cp.x + shiftDistance, cp.y)
      finalPoint.attrs = { stroke: 'blue' }
      finalPoints.push(finalPoint)
      outputs.push(finalPoint)
    }

    let previousFinalPoint = finalPoints[0]
    for (let i = 1; i < finalPoints.length; i++) {
      const finalSegment = new Flatten.Segment(previousFinalPoint, finalPoints[i])
      finalSegment.attrs = { stroke: 'blue' }
      outputs.push(finalSegment)
      previousFinalPoint = finalPoints[i]
    }
  } else {
    for (let i = 0; i < originalSegments.length; i++) {
      originalSegments[i].attrs = { stroke: 'red' }
      outputs.push(originalSegments[i])
    }
    for (let i = 0; i < allPoints.length; i++) {
      outputs.push(allPoints[i])
    }
  }

  return outputs
}

window.addEventListener('load', () => {
  const output = document.getElementById('output')
  const f = new window.Framework(inputs, update, output)
})
