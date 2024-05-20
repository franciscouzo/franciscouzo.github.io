import { PolygonFactory, RegularPolygonFactory, TextureFactory } from "./factory.js"

function showController(gui, property, show) {
  gui.controllers.find(c => c.property === property).show(show)
}

function enableController(gui, property, enable) {
  gui.controllers.find(c => c.property === property).enable(enable)
}

function showFolder(gui, folderName, show) {
  gui.folders.find(f => f._title === folderName).show(show)
}

document.addEventListener('DOMContentLoaded', function () {
  let workers = []
  let imageData
  let shapes
  let shapeFactory

  const options = {
    loadImage: function () {
      imageUpload.click()
    },
    loadPriorityImage: function () {
      priorityImageUpload.click()
    },
    algorithm: 'Simulated annealing',
    style: 'Regular polygons',
    transparent: false,
    minSides: 4,
    maxSides: 4,
    minRadius: 30,
    maxRadius: 50,
    restriction: {
      enable: false,
      sides: 4,
      angle: 0
    },
    loadTexture: function () {
      textureUpload.click()
    },
    resize: true,
    maintainAspectRatio: true,
    maxWidth: 512,
    maxHeight: 512,
    overdraw: false,
    shapeCount: 500,
    generate: function () {
      for (const controller of gui.controllersRecursive()) {
        if (controller.property !== "stop") {
          controller.disable()
        }
      }

      shapeFactory = new {
        Polygons: PolygonFactory,
        'Regular polygons': RegularPolygonFactory,
        Textures: TextureFactory
      }[options.style](canvas.width, canvas.height, options)

      enableController(gui, "stop", true)
      enableController(gui, 'downloadSvg', Boolean(shapeFactory.svg))

      let bestScore = Infinity
      let generations = 0
      let evolutions = 0
      let generationTag = document.getElementById('generation')

      for (let i = 0; i < navigator.hardwareConcurrency; i++) {
        const worker = new Worker("worker.js", { type: "module" })
        workers.push(worker)

        const opts = Object.fromEntries(Object.entries(options).filter(([key, value]) => typeof value !== "function"))
        worker.postMessage({
          action: "generate",
          data: {
            options: opts,
            imageData,
            priorityData,
            textureData
          }
        })

        const start = performance.now()
        worker.addEventListener("message", ({ data }) => {
          evolutions += data.stepEvolutions
          generations += data.stepGenerations

          if (data.score < bestScore) {
            bestScore = data.score
            shapes = data.shapes

            for (const w of workers) {
              if (w != worker) {
                w.postMessage({
                  action: "evolution",
                  data: {
                    shapes,
                    score: data.score,
                    ...(options.overdraw ? { imageData: data.imageData } : {})
                  }
                })
              }
            }

            ctx.putImageData(data.imageData, 0, 0)
          }

          const elapsed = (performance.now() - start) / 1000
          const generationsPerSecond = (generations / elapsed).toFixed(2)

          generationTag.innerHTML = `Generations: ${generations}<br>Evolutions: ${evolutions}<br>Score: ${bestScore.toFixed(0)}<br>Generations/s: ${generationsPerSecond}`
        })
      }
    },
    stop: function () {
      for (const controller of gui.controllersRecursive()) {
        if (controller.property !== "downloadSvg") {
          controller.enable()
        }
      }
      enableController(gui, 'stop', false)

      for (const worker of workers) {
        worker.terminate()
      }

      workers = []

    },
    downloadSvg: function () {
      const svgElements = shapes.map(shape => shapeFactory.svg(shape))
      const data = [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" ' +
        `width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">`
      ].concat(svgElements, '</svg>').join('\n')
      download(filename.replace(/\.[^.]+$/, '') + '.svg', 'data:image/svg+xml,' + encodeURIComponent(data))
    }
  }
  const gui = new lil.GUI()
  gui.add(options, 'loadImage').name('Load image')
  gui.add(options, 'loadPriorityImage').name('Load priority image')
  gui.add(options, 'algorithm', ['Simulated annealing', 'Hill climbing']).name('Algorithm')
  gui.add(options, 'style', ['Polygons', 'Regular polygons', 'Textures']).name('Style').onChange(function (value) {
    showFolder(gui, 'Radius', value === 'Regular polygons' || value === 'Textures')
    showFolder(gui, 'Shape restriction', value === 'Polygons')
    showFolder(gui, 'Sides', value !== 'Textures')
    showController(gui, 'loadTexture', value === 'Textures')
  })
  gui.add(options, 'transparent').name('Transparent')

  const sidesFolder = gui.addFolder('Sides').close()
  sidesFolder.add(options, 'minSides', 2, 50, 1).name('Min sides').onChange(function (value) {
    options.maxSides = Math.max(options.minSides, options.maxSides)
  }).listen()
  sidesFolder.add(options, 'maxSides', 2, 50, 1).name('Max sides').onChange(function (value) {
    options.minSides = Math.min(options.minSides, options.maxSides)
  }).listen()

  const radiusFolder = gui.addFolder('Radius').close()
  radiusFolder.add(options, 'minRadius', 5, 100).name('Min radius').onChange(function (value) {
    options.maxRadius = Math.max(options.minRadius, options.maxRadius)
  }).listen()
  radiusFolder.add(options, 'maxRadius', 5, 100).name('Max radius').onChange(function (value) {
    options.minRadius = Math.min(options.minRadius, options.maxRadius)
  }).listen()

  const shapeRestrictionFolder = gui.addFolder('Shape restriction').close()
  shapeRestrictionFolder.add(options.restriction, 'enable').name('Restrict').onChange(function (value) {
    showController(shapeRestrictionFolder, 'sides', value)
    showController(shapeRestrictionFolder, 'angle', value)
  })
  shapeRestrictionFolder.add(options.restriction, 'sides', 3, 50, 1).name('Sides')
  shapeRestrictionFolder.add(options.restriction, 'angle', 0, 2 * Math.PI).name('Angle')

  gui.add(options, 'loadTexture').name('Load texture')

  gui.add(options, 'resize').name('Resize').onChange(function (value) {
    showController(gui, 'maintainAspectRatio', value)
    showController(gui, 'maxWidth', value)
    showController(gui, 'maxHeight', value)
  })
  gui.add(options, 'maintainAspectRatio').name('Maintain aspect ratio')
  gui.add(options, 'maxWidth', 64, 1024, 1).name('Max width')
  gui.add(options, 'maxHeight', 64, 1024, 1).name('Max height')

  gui.add(options, 'overdraw').name('Overdraw').onChange(function (value) {
    showController(gui, 'shapeCount', !value)
  })
  gui.add(options, 'shapeCount', 1, 5000).name('Shape count')
  gui.add(options, 'generate').name('Generate')
  gui.add(options, 'stop').name('Stop')
  gui.add(options, 'downloadSvg').name('Download SVG')

  showController(gui, 'loadTexture', false)
  showController(shapeRestrictionFolder, 'sides', false)
  showController(shapeRestrictionFolder, 'angle', false)

  enableController(gui, 'generate', false)
  enableController(gui, 'stop', false)
  enableController(gui, 'downloadSvg', false)

  showFolder(gui, 'Shape restriction', false)

  const imageUpload = document.getElementById('imageUpload')
  const priorityImageUpload = document.getElementById('priorityImageUpload')
  const textureUpload = document.getElementById('textureUpload')

  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  let priorityData
  let textureData

  let filename = 'default'

  imageUpload.addEventListener('change', function (e) {
    const reader = new FileReader()
    reader.onload = function (event) {
      const img = new Image()
      img.src = event.target.result
      img.onload = function () {
        if (options.resize) {
          if (options.maintainAspectRatio) {
            const ratio = Math.min(options.maxWidth / img.width, options.maxHeight / img.height)
            canvas.width = img.width * ratio
            canvas.height = img.height * ratio
          } else {
            canvas.width = options.maxWidth
            canvas.height = options.maxHeight
          }
        } else {
          canvas.width = img.width
          canvas.height = img.height
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        enableController(gui, 'generate', true)
      }
    }
    const file = e.target.files[0]
    reader.readAsDataURL(file)
    filename = file.name
  }, false)

  priorityImageUpload.addEventListener('change', function (e) {
    const reader = new FileReader()
    reader.onload = function (event) {
      const img = new Image()
      img.src = event.target.result
      img.onload = function () {
        const priorityCanvas = document.createElement('canvas')
        const priorityCtx = priorityCanvas.getContext('2d')

        priorityCanvas.width = canvas.width
        priorityCanvas.height = canvas.height
        priorityCtx.drawImage(img, 0, 0, canvas.width, canvas.height)

        priorityData = priorityCtx.getImageData(0, 0, canvas.width, canvas.height)
      }
    }
    reader.readAsDataURL(e.target.files[0])
  }, false)

  textureUpload.addEventListener('change', function (e) {
    const reader = new FileReader()
    reader.onload = function (event) {
      const img = new Image()
      img.src = event.target.result
      img.onload = function () {
        const textureCanvas = document.createElement('canvas')
        const textureCtx = textureCanvas.getContext('2d')

        textureCanvas.width = img.width
        textureCanvas.height = img.height
        textureCtx.drawImage(img, 0, 0)

        textureData = textureCtx.getImageData(0, 0, img.width, img.height)
      }
    }
    reader.readAsDataURL(e.target.files[0])
  }, false)
})
