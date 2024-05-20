import { PolygonFactory, RegularPolygonFactory, TextureFactory } from "./factory.js"

function getScore(origImgData, imgData, priorityData) {
  const { data: origData, width, height } = origImgData
  const { data } = imgData

  let score = 0

  if (priorityData) {
    const pData = priorityData.data
    for (var i = 0; i < width * height * 4; i++) {
      // score += ((origData[i] - data[i]) / 255) ** 2 * pData[i] / 255
      score += Math.abs(origData[i] - data[i]) * pData[i] / 255
    }
  } else {
    for (let i = 0; i < width * height * 4; i++) {
      // score += ((origData[i] - data[i]) / 255) ** 2
      score += Math.abs(origData[i] - data[i])
    }
  }

  return score
}

let bestScore = Infinity
let shapes = []
let overdrawData

self.addEventListener("message", (event) => {
  const { action, data } = event.data

  if (action === "generate") {
    const { options, imageData, priorityData, textureData } = data
    const { shapeCount, overdraw } = options

    const canvas = new OffscreenCanvas(imageData.width, imageData.height)
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    overdrawData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const textureCanvas = textureData && new OffscreenCanvas(textureData.width, textureData.height)
    textureCanvas && textureCanvas.getContext("2d").putImageData(textureData, 0, 0)

    const acceptNewStateAlgorithms = {
      'Simulated annealing': function (score, bestScore, generation) {
        if (score <= bestScore) {
          return true
        } else {
          const temperature = 10000 / Math.log(generation + 1)
          return Math.exp(-(score - bestScore) / temperature) >= Math.random()
        }
      },
      'Hill climbing': function (score, bestScore, generation) {
        return score <= bestScore
      }
    }

    const shapeFactory = new {
      Polygons: PolygonFactory,
      'Regular polygons': RegularPolygonFactory,
      Textures: TextureFactory
    }[options.style](canvas.width, canvas.height, options, textureCanvas)

    const tmpCanvas = new OffscreenCanvas(canvas.width, canvas.height)
    const tmpCtx = tmpCanvas.getContext('2d', { willReadFrequently: true })

    if (!overdraw) {
      for (let i = 0; i < shapeCount; i++) {
        const shape = shapeFactory.generate()
        shapes.push(shape)
      }
    }

    let totalGenerations = 0
    let stepEvolutions = 0
    let stepGenerations = 0

    function step() {
      let evolutionShapes
      let newImageData
      let evolutionImageData

      const steps = 20 + Math.floor(Math.random() * 5)
      for (let i = 0; i < steps; i++) {
        totalGenerations++
        stepGenerations++

        let oldShapes = shapes.slice()
        if (!overdraw) {
          tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height)

          const steps = -Math.log2(Math.random()) + 1
          for (let j = 0; j < steps; j++) {
            const r = Math.random()
            const r1 = Math.floor(Math.random() * shapeCount)
            if (r < 0.7) {
              shapes[r1] = shapeFactory.tweak(shapes[r1])
            } else if (r < 0.8) {
              const r2 = Math.floor(Math.random() * shapeCount)
              ;[shapes[r1], shapes[r2]] = [shapes[r2], shapes[r1]]
            } else {
              shapes[r1] = shapeFactory.generate()
            }
          }

          for (const shape of shapes) {
            shapeFactory.draw(tmpCtx, shape)
          }
        } else {
          tmpCtx.putImageData(overdrawData, 0, 0)
          const shape = shapeFactory.generate()
          shapes.push(shape)
          shapeFactory.draw(tmpCtx, shape)
        }

        newImageData = tmpCtx.getImageData(0, 0, canvas.width, canvas.height)
        const score = getScore(imageData, newImageData, priorityData)

        if (acceptNewStateAlgorithms[options.algorithm](score, bestScore, totalGenerations)) {
          bestScore = score
          stepEvolutions++
          evolutionShapes = shapes.slice()
          evolutionImageData = newImageData
        } else {
          shapes = oldShapes
        }
      }

      if (evolutionShapes) {
        self.postMessage({
          stepEvolutions,
          stepGenerations,
          shapes: evolutionShapes,
          imageData: evolutionImageData,
          score: bestScore
        })
        stepEvolutions = 0
        stepGenerations = 0
      }

      setTimeout(step, 0)
    }

    step()
  } else if (action === "evolution") {
    if (data.score < bestScore) {
      bestScore = data.score
      shapes = data.shapes
      if (data.imageData) {
        overdrawData = data.imageData
      }
    }
  }
})