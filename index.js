const Flatten = window["@flatten-js/core"]
const Extra = window["@isti/flatten-js-extra"]

const inputDescriptions = [
  { name: 'dx', min: 0, max: 10, step: 1, initial: 4 },
  { name: 'span', min: 0, max: 6, step: 0.1, initial: 4.2 },
  { name: 'height', min: 0, max: 6, step: 0.1, initial: 2.5 },
  { name: 'distributedForce', min: 0, max: 10, step: 0.1, initial: 2 },

  { name: 'snowDistributedForceL', min: 0, max: 10, step: 0.1, initial: 1 },
  { name: 'hForceL', min: 0, max: 10, step: 0.1, initial: 1 },

  { name: 'snowDistributedForceR', min: 0, max: 10, step: 0.1, initial: 2 },
  { name: 'hForceR', min: 0, max: 10, step: 0.1, initial: 1 },

]

const makeHalfArch = (
  direction,
  { span, height, distributedForce, snowDistributedForce, hForce, dx }
) => {
  const outputs = []

  const lineSep = (span / 2) / dx

  const vlines = []
  for (let i = 0; i <= dx; i++) {
    const vline = new Flatten.Line(
      new Flatten.Point(lineSep * i * direction, 0),
      new Flatten.Point(lineSep * i * direction, 1)
    )
    vline.attrs = { stroke: 'green' }
    vlines.push(vline)
  }
  outputs.push(...vlines)

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
    cumulativeForce += d * distributedForce + lineSep * snowDistributedForce
    const v = new Flatten.Vector(hForce * direction, -cumulativeForce)

    vectors.push(v)
  }

  const newPoints = [points[0]]
  for (let i = 0; i < vectors.length - 1; i++) {
    const prevPoint = newPoints.slice(-1)[0]
    const line = new Flatten.Line(prevPoint, vectors[i].rotate90CW())
    const nextPoint = line.intersect(midlines[i])[0]
    newPoints.push(nextPoint)
  }
  outputs.push(...newPoints)

  return [outputs, newPoints]
}

const update = () => {
  const inputValues = readInputs(inputDescriptions)
  const {
    span,
    height,
    distributedForce,
    snowDistributedForceL, snowDistributedForceR,
    hForceL, hForceR,
    dx
  } = inputValues
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
    span, height, dx, distributedForce,
    snowDistributedForce: snowDistributedForceL,
    hForce: hForceL,
  })

  const [rightOutputs, rightPoints] = makeHalfArch(1, {
    span, height, dx, distributedForce,
    snowDistributedForce: snowDistributedForceR,
    hForce: hForceR,
  })

  outputs.push(...leftOutputs, ...rightOutputs)

  const allPoints = [...leftPoints.reverse(), ...rightPoints]
  let previousPoint = allPoints[0]
  const originalSegments = []
  for (let i = 1; i < allPoints.length; i++) {
    originalSegments.push(new Flatten.Segment(previousPoint, allPoints[i]))
    // outputs.push(new Flatten.Segment(previousPoint, allPoints[i]))
    previousPoint = allPoints[i]
  }

  let newSpan = 0
  for (let i = 0; i < originalSegments.length; i++) {
    if (xAxis.intersect(originalSegments[i]).length != 0) {
      newSpan = newSpan + xAxis.intersect(originalSegments[i])[0].distanceTo(center)[0]
    }
  }

  const correctedPoints = []
  const finalPoints = []
  if (snowDistributedForceL != snowDistributedForceR) {
    for (let i = 0; i < allPoints.length; i++) {
      const correctedPoint = new Flatten.Point(allPoints[i].x * (span / newSpan), allPoints[i].y);
      correctedPoints.push(correctedPoint)
      // outputs.push(new Flatten.Point(allPoints[i].x * (span / newSpan), allPoints[i].y))
    }

    let previousCorrectedPoint = correctedPoints[0]
    const correctedSegments = []
    for (let i = 1; i < correctedPoints.length; i++) {
      correctedSegments.push(new Flatten.Segment(previousCorrectedPoint, correctedPoints[i]))
      previousCorrectedPoint = correctedPoints[i]
    }

    const shiftDistance = []
    for (let i = 0; i < correctedSegments.length; i++) {
      console.log(xAxis.intersect(correctedSegments[i]).length)
      if (xAxis.intersect(correctedSegments[i]).length != 0) {
        shiftDistance.push(xAxis.intersect(correctedSegments[i])[0].distanceTo(new Flatten.Point(-span / 2, 0))[0])
      }
    }


    for (let j = 0; j < correctedPoints.length; j++) {
      const finalPoint = new Flatten.Point(correctedPoints[j].x + shiftDistance[0], correctedPoints[j].y);
      finalPoints.push(finalPoint)
      outputs.push(finalPoint)
    }
  } else{
    for (let i = 0; i < originalSegments.length; i++) {
      outputs.push(originalSegments[i])
    }
  }

  let previousFinalPoint = finalPoints[0]
  for (let i = 1; i < finalPoints.length; i++) {
    outputs.push(new Flatten.Segment(previousFinalPoint, finalPoints[i]))
    previousFinalPoint = finalPoints[i]
  }


  return outputs
}

window.addEventListener('load', () => {
  window.framework.init(inputDescriptions, update)
})
