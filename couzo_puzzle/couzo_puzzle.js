'use strict'

var PIXEL_RATIO = window.devicePixelRatio || 1
var ROTATION_TIME = 350 // 350ms for 1/6 turn

function copy(data) {
    return JSON.parse(JSON.stringify(data))
}

function Game(game_options, ctx) {
    this.data = copy(game_options.circles)
    this.solution = copy(game_options.circles)
    this.center = game_options.center
    this.win_animation_order = game_options.win_animation_order
    this.shuffled = false

    this.undo_history = []

    this.ctx = ctx
    this.animating = {}
    this.circles = {}

    requestAnimationFrame(this.animation_step.bind(this))
}

Game.prototype.colors = [
    '#C41E3A',
    '#FF5800',
    '#FFD500',
    '#009E60',
    '#005160',
    '#FFFFFF',
    '#000000'
]

Game.prototype.piece_ratio = 0.4

Game.prototype.center_piece = function(style) {
    var center_piece = document.createElement('canvas')
    center_piece.width = this.radius / 2
    center_piece.height = this.radius
    var cp_ctx = center_piece.getContext('2d')

    cp_ctx.fillStyle = style
    cp_ctx.fillRect(0, 0, center_piece.width, center_piece.height)
    cp_ctx.globalCompositeOperation = 'destination-out'

    cp_ctx.beginPath()
    cp_ctx.arc(
        center_piece.width  / 2 + Math.sin(2 * Math.PI * 5 / 6) * this.radius * (1 + this.piece_ratio),
        center_piece.height / 2,
        this.radius, 0, 2 * Math.PI
    )
    cp_ctx.fill()

    cp_ctx.beginPath()
    cp_ctx.arc(
        center_piece.width  / 2 + Math.sin(2 * Math.PI * 1 / 6) * this.radius * (1 + this.piece_ratio),
        center_piece.height / 2,
        this.radius, 0, 2 * Math.PI
    )
    cp_ctx.fill()

    cp_ctx.globalCompositeOperation = 'destination-in'

    cp_ctx.beginPath()
    cp_ctx.arc(
        center_piece.width  / 2,
        center_piece.height / 2 - this.radius * (this.piece_ratio * Math.sqrt(3)),
        this.radius, 0, 2 * Math.PI
    )
    cp_ctx.fill()

    cp_ctx.beginPath()
    cp_ctx.arc(
        center_piece.width  / 2,
        center_piece.height / 2 + this.radius * (this.piece_ratio * Math.sqrt(3)),
        this.radius, 0, 2 * Math.PI
    )
    cp_ctx.fill()

    return center_piece
}

Game.prototype.draw_circle = function(circle_idx) {
    var circle = document.createElement('canvas')
    circle.width = this.radius * 2 + this.line_width * 2
    circle.height = this.radius * 2 + this.line_width * 2
    var ctx = circle.getContext('2d')

    ctx.lineWidth = this.line_width

    // Center circle
    ctx.fillStyle = this.colors[this.data[circle_idx].center]
    ctx.beginPath()
    ctx.arc(circle.width  / 2, circle.height / 2, this.radius, 0, 2 * Math.PI)
    ctx.fill()

    // Pieces
    ctx.save()
    ctx.globalCompositeOperation = 'source-atop'
    ctx.translate(circle.width / 2, circle.height / 2)
    ctx.rotate(-2.5 * Math.PI / 3)
    for (var i = 1; i < 12; i += 2) {
        ctx.beginPath()
        ctx.fillStyle = this.colors[this.data[circle_idx].pieces[i]]
        ctx.fillRect(-this.radius / 4, -this.radius, this.radius / 2, this.radius / 2)
        ctx.rotate(Math.PI / 3)
    }

    ctx.restore()

    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.translate(circle.width / 2, circle.height / 2)

    for (var i = 0; i < 12; i += 2) {
        var center_piece = this.center_pieces[this.data[circle_idx].pieces[i]]
        if (center_piece.width) {
            ctx.drawImage(
                center_piece,
                -center_piece.width / 2,
                this.radius * this.piece_ratio / 2
            )
        }
        ctx.rotate(Math.PI / 3)
    }
    ctx.restore()

    // Outlines
    ctx.globalCompositeOperation = 'source-atop'
    for (var i = 0; i < 6; i++) {
        ctx.beginPath()
        ctx.arc(
            ctx.canvas.width  / 2 + Math.sin(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio),
            ctx.canvas.height / 2 - Math.cos(Math.PI * i / 3) * this.radius * (1 + this.piece_ratio),
            this.radius, 0, 2 * Math.PI
        )
        ctx.stroke()
    }

    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = this.colors[this.data[circle_idx].center]
    ctx.beginPath()
    ctx.arc(circle.width / 2, circle.height / 2, this.radius, 0, 2 * Math.PI)
    ctx.stroke()

    return circle
}

Game.prototype.rotate_circle = function(circle) {
    var circle_pos = this.get_circle_pos(circle)
    var x = circle_pos[0]
    var y = circle_pos[1]

    // Behold: code below is a piece of shit
    if (this.data[[x, y + 1]]) {
        this.data[[x, y + 1]].pieces[11] = this.data[[x, y]].pieces[5]
        this.data[[x, y + 1]].pieces[0]  = this.data[[x, y]].pieces[4]
        this.data[[x, y + 1]].pieces[1]  = this.data[[x, y]].pieces[3]
    }

    if (this.data[[x, y - 1]]) {
        this.data[[x, y - 1]].pieces[5] = this.data[[x, y]].pieces[11]
        this.data[[x, y - 1]].pieces[6] = this.data[[x, y]].pieces[10]
        this.data[[x, y - 1]].pieces[7] = this.data[[x, y]].pieces[9]
    }

    if (Math.abs(x) % 2 == 0) {
        if (this.data[[x - 1, y]]) {
            this.data[[x - 1, y]].pieces[3] = this.data[[x, y]].pieces[9]
            this.data[[x - 1, y]].pieces[4] = this.data[[x, y]].pieces[8]
            this.data[[x - 1, y]].pieces[5] = this.data[[x, y]].pieces[7]
        }
        if (this.data[[x - 1, y + 1]]) {
            this.data[[x - 1, y + 1]].pieces[1] = this.data[[x, y]].pieces[7]
            this.data[[x - 1, y + 1]].pieces[2] = this.data[[x, y]].pieces[6]
            this.data[[x - 1, y + 1]].pieces[3] = this.data[[x, y]].pieces[5]
        }
        if (this.data[[x + 1, y]]) {
            this.data[[x + 1, y]].pieces[7] = this.data[[x, y]].pieces[1]
            this.data[[x + 1, y]].pieces[8] = this.data[[x, y]].pieces[0]
            this.data[[x + 1, y]].pieces[9] = this.data[[x, y]].pieces[11]
        }
        if (this.data[[x + 1, y + 1]]) {
            this.data[[x + 1, y + 1]].pieces[9] = this.data[[x, y]].pieces[3]
            this.data[[x + 1, y + 1]].pieces[10] = this.data[[x, y]].pieces[2]
            this.data[[x + 1, y + 1]].pieces[11] = this.data[[x, y]].pieces[1]
        }
    } else {
        if (this.data[[x - 1, y]]) {
            this.data[[x - 1, y]].pieces[1] = this.data[[x, y]].pieces[7]
            this.data[[x - 1, y]].pieces[2] = this.data[[x, y]].pieces[6]
            this.data[[x - 1, y]].pieces[3] = this.data[[x, y]].pieces[5]
        }
        if (this.data[[x - 1, y - 1]]) {
            this.data[[x - 1, y - 1]].pieces[3] = this.data[[x, y]].pieces[9]
            this.data[[x - 1, y - 1]].pieces[4] = this.data[[x, y]].pieces[8]
            this.data[[x - 1, y - 1]].pieces[5] = this.data[[x, y]].pieces[7]
        }
        if (this.data[[x + 1, y]]) {
            this.data[[x + 1, y]].pieces[9] = this.data[[x, y]].pieces[3]
            this.data[[x + 1, y]].pieces[10] = this.data[[x, y]].pieces[2]
            this.data[[x + 1, y]].pieces[11] = this.data[[x, y]].pieces[1]
        }
        if (this.data[[x + 1, y - 1]]) {
            this.data[[x + 1, y - 1]].pieces[7] = this.data[[x, y]].pieces[1]
            this.data[[x + 1, y - 1]].pieces[8] = this.data[[x, y]].pieces[0]
            this.data[[x + 1, y - 1]].pieces[9] = this.data[[x, y]].pieces[11]
        }
    }

    this.data[[x, y]].pieces.unshift(this.data[[x, y]].pieces.pop())
    this.data[[x, y]].pieces.unshift(this.data[[x, y]].pieces.pop())
}

Game.prototype.undo = function() {
    if (this.undo_history.length) {
        var data = this.undo_history.pop()
        this.data = data.data
        this.animate_piece(data.circle, data.angle_start, ROTATION_TIME)
    }
}

Game.prototype.shuffle = function(n) {
    this.data = copy(this.solution)
    var circles = Object.keys(this.data)
    for (var i = 0; i < n; i++) {
        var circle = circles[Math.floor(Math.random() * circles.length)]
        if (Math.random() < 0.5) { // Rotate clock-wise
            this.rotate_circle(circle)
        } else { // Rotate counter clock-wise
            for (var j = 0; j < 5; j++) {
                this.rotate_circle(circle)
            }
        }
    }
    this.undo_history = []
    this.shuffled = true
}

Game.prototype.is_solved = function() {
    return JSON.stringify(this.data) == JSON.stringify(this.solution)
}

Game.prototype.update_circles = function() {
    this.center_pieces = []
    for (var i = 0; i < this.colors.length; i++) {
        this.center_pieces.push(this.center_piece(this.colors[i]))
    }

    for (var circle in this.data) {
        this.circles[circle] = this.draw_circle(circle)
    }
}

Game.prototype.bounding_box = function() {
    var min_x = Infinity
    var max_x = -Infinity
    var min_y = Infinity
    var max_y = -Infinity

    for (var circle_idx in this.data) {
        var circle_pos = this.get_circle_pos(circle_idx)
        var x = circle_pos[0]
        var y = circle_pos[1]
        min_x = Math.min(min_x, x)
        max_x = Math.max(max_x, x)
        min_y = Math.min(min_y, y)
        max_y = Math.max(max_y, y)
    }

    return [min_x, min_y, max_x, max_y]
}

Game.prototype.get_circle_pos = function(circle) {
    var x_y = circle.split(',')
    return [parseInt(x_y[0]), parseInt(x_y[1])]
}

Game.prototype.get_circle_screen_pos = function(circle) {
    var circle_pos = this.get_circle_pos(circle)
    var x = circle_pos[0]
    var y = circle_pos[1]

    var bounding_box = this.bounding_box()
    var width  = bounding_box[2] - bounding_box[0] + 1
    var height = bounding_box[3] - bounding_box[1] + 1

    var x_offset = -this.center[0] * this.radius
    var y_offset = -this.center[1] * this.radius

    if (x % 2 === 0) {
        return [this.ctx.canvas.width  / 2 + x * Math.sqrt(3) / 2 * this.radius * (1 + this.piece_ratio) + x_offset,
                this.ctx.canvas.height / 2 + y * this.radius * (1 + this.piece_ratio) + y_offset]
    } else {
        return [this.ctx.canvas.width  / 2 + x * Math.sqrt(3) / 2 * this.radius * (1 + this.piece_ratio) + x_offset,
                this.ctx.canvas.height / 2 + (y <= 0 ? y - 1 : y) * this.radius * (1 + this.piece_ratio) * 0.5 + y_offset]
    }
}

Game.prototype.draw = function(keep_circles) {
    var ctx = this.ctx
    ctx.fillStyle = '#F5F5DD'
    ctx.fillRect(0, 0, ctx.canvas.width - 1, ctx.canvas.height - 1)

    var bounding_box = this.bounding_box()
    var width  = bounding_box[2] - bounding_box[0] + 1
    var height = bounding_box[3] - bounding_box[1] + 1
    if (height === 2) {
        this.radius = Math.min(ctx.canvas.width / (width + 2), ctx.canvas.height / (height + 3))
    } else {
        this.radius = Math.min(ctx.canvas.width / (width + 2), ctx.canvas.height / (height + 2))
    }
    this.line_width = this.radius / 20

    if (!keep_circles) this.update_circles()

    for (var circle_idx in this.data) {
        if (this.animating[circle_idx]) {
            continue
        }

        var circle_pos = this.get_circle_screen_pos(circle_idx)

        ctx.save()
        ctx.translate(circle_pos[0], circle_pos[1])
        ctx.scale(-1, -1)
        var circle = this.circles[circle_idx]
        ctx.drawImage(circle, -circle.width / 2, -circle.height / 2)
        ctx.restore()
    }

    for (var circle_idx in this.data) {
        if (!this.animating[circle_idx]) {
            continue
        }

        var circle_pos = this.get_circle_screen_pos(circle_idx)

        ctx.save()
        ctx.translate(circle_pos[0], circle_pos[1])
        ctx.scale(-1, -1)
        var circle = this.circles[circle_idx]
        var animation = this.animating[circle_idx]
        var t = Math.min(animation.func((performance.now() - animation.start) / animation.duration), 1)
        ctx.rotate((animation.angle_start * (1 - t) + animation.angle_end * t) / 2)
        ctx.drawImage(circle, -circle.width / 2, -circle.height / 2)
        ctx.restore()
    }
}

Game.prototype.animate_piece = function(circle_idx, angle_start, duration, keep_old_circles, redraw) {
    /*if (!keep_old_circles) {
        for (var i = -1; i <= 1; i++) {
            var index = mod(circle_n + i, 6)
            var circle = this.draw_circle(index)
            this.circles[index] = circle
        }
    }*/

    this.animating[circle_idx] = {
        start: performance.now(),
        duration: duration,
        angle_start: angle_start,
        angle_end: 0,
        func: function(x) { return Math.sin(Math.PI * x / 2) },
        redraw: redraw === undefined ? true : redraw
    }
}

Game.prototype.animation_step = function(timestamp) {
    for (var piece_n in this.animating) {
        var animation = this.animating[piece_n]
        if (animation.start + animation.duration < timestamp) {
            delete this.animating[piece_n]
            this.draw(true)
            continue
        }
        this.draw(true)
    }
    requestAnimationFrame(this.animation_step.bind(this))
}

function setup_context(game) {
    var ctx = game.ctx

    ctx.canvas.style.width  = window.innerWidth  + 'px'
    ctx.canvas.style.height = window.innerHeight + 'px'

    ctx.canvas.width  = window.innerWidth  * PIXEL_RATIO
    ctx.canvas.height = window.innerHeight * PIXEL_RATIO

    var undo_button = document.getElementById("undo_button")
    var size = Math.min(ctx.canvas.width, ctx.canvas.height)
    undo_button.width  = size / 10
    undo_button.height = size / 10

    game.update_circles()
    game.draw()
}

document.addEventListener('DOMContentLoaded', function() {
    var canvas = document.getElementById('canvas')
    var ctx = canvas.getContext('2d')

    /*
     *         -1  |   0   |  1
     *              ------
     * -1          / 0,-1 \
     *       ------\      /------
     *  0   / -1,0  ------   1,0 \
     *      \      /      \      /
     *  0    ------   0,0  ------
     *  1   / -1,1 \      /  1,1 \
     *      \       ------       /
     *  1    ------/  0,1 \------
     *             \      /
     *              ------
     */

    var game_modes = {
        classic: {
            circles: {
                '0,-1': {center: 0, pieces: [0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0]},
                '1,0':  {center: 1, pieces: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0]},
                '1,1':  {center: 2, pieces: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1]},
                '0,1':  {center: 3, pieces: [3, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3]},
                '-1,1': {center: 4, pieces: [4, 4, 4, 3, 3, 3, 4, 4, 4, 4, 4, 4]},
                '-1,0': {center: 5, pieces: [5, 5, 5, 5, 5, 4, 4, 4, 5, 5, 5, 5]}
            },
            center: [0, 0],
            win_animation_order: [['0,-1', '1,1', '-1,1'], ['1,0', '0,1', '-1,0']]
        },
        two: {
            circles: {
                '0,1': {center: 0, pieces: [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]},
                '0,0': {center: 2, pieces: [2, 2, 2, 2, 2, 1, 1, 1, 2, 2, 2, 2]}
            },
            center: [0, 0.5],
            win_animation_order: [['0,1'], ['0,0']]
        },
        three: {
            circles: {
                '0,-1': {center: 0, pieces: [0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0]},
                '0,0':  {center: 1, pieces: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]},
                '0,1':  {center: 2, pieces: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1]}
            },
            center: [0, 0],
            win_animation_order: [['0,0'], ['0,1', '0,-1']]
        },
        x: {
            circles: {
                '-1,0': {center: 4, pieces: [4, 4, 4, 5, 5, 5, 4, 4, 4, 4, 4, 4]},
                '1,0':  {center: 0, pieces: [0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0]},
                '-1,1': {center: 4, pieces: [4, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4]},
                '1,1':  {center: 0, pieces: [0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 5]},
                '0,0':  {center: 5, pieces: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]}
            },
            center: [0, 0],
            win_animation_order: [['0,0'], ['-1,0', '1,1'], ['-1,1', '1,0']]
        },
        y: {
            circles: {
                '-1,0': {center: 4, pieces: [4, 4, 4, 5, 5, 5, 4, 4, 4, 4, 4, 4]},
                '1,0':  {center: 0, pieces: [0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0]},
                '0,0':  {center: 5, pieces: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]},
                '0,1':  {center: 2, pieces: [5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 2, 5]}
            },
            center: [0, 0],
            win_animation_order: [['0,0'], ['-1,0', '1,0', '0,1']]
        },
        triangle: {
            circles: {
                '0,0': {center: 4, pieces: [4, 4, 4, 5, 3, 3, 4, 4, 4, 4, 4, 4]},
                '1,0': {center: 0, pieces: [0, 0, 0, 0, 0, 0, 0, 5, 4, 4, 0, 0]},
                '1,1': {center: 3, pieces: [0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5]}
            },
            center: [0.5, 0],
            win_animation_order: [['0,0'], ['1,1'], ['1,0']]
        },
        middle: {
            circles: {
                '0,-1': {center: 0, pieces: [0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0]},
                '1,0':  {center: 1, pieces: [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0]},
                '1,1':  {center: 2, pieces: [1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1]},
                '0,1':  {center: 3, pieces: [3, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3]},
                '-1,1': {center: 4, pieces: [4, 4, 4, 3, 3, 3, 4, 4, 4, 4, 4, 4]},
                '-1,0': {center: 5, pieces: [5, 5, 5, 5, 5, 4, 4, 4, 5, 5, 5, 5]},
                '0,0':  {center: 6, pieces: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]}
            },
            center: [0, 0],
            win_animation_order: [['0,0'], ['0,-1', '1,1', '-1,1'], ['1,0', '0,1', '-1,0']]
        },
        wide: {
            circles: {
                '0,-1': {center: 0, pieces: [0, 0, 0, 0, 0, 0, 0, 5, 5, 5, 0, 0]},
                '1,0':  {center: 1, pieces: [1, 1, 1, 5, 5, 5, 1, 1, 1, 0, 0, 0]},
                '1,1':  {center: 2, pieces: [1, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 1]},
                '0,1':  {center: 3, pieces: [3, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3]},
                '-1,1': {center: 4, pieces: [4, 4, 4, 3, 3, 3, 4, 4, 4, 2, 2, 2]},
                '-1,0': {center: 5, pieces: [5, 5, 5, 5, 5, 4, 4, 2, 2, 2, 5, 5]},
                '0,0':  {center: 6, pieces: [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]},
                '2,0':  {center: 5, pieces: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5]},
                '-2,0': {center: 2, pieces: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]}
            },
            center: [0, 0],
            win_animation_order: [['0,0', '2,0', '-2,0'], ['0,-1', '1,1', '-1,1'], ['1,0', '0,1', '-1,0']]
        }
    }

    var selected_game_mode = 'classic'

    for (var game_mode in game_modes) {
        var game_mode_elem = document.createElement('a')
        game_mode_elem.innerText = game_mode
        game_mode_elem.href = "#"
        game_mode_elem.dataset.game_mode = game_mode
        game_mode_elem.classList.add("game-mode")
        game_mode_elem.classList.add("list-group-item")
        game_mode_elem.classList.add("list-group-item-action")
        if (game_mode === selected_game_mode) {
            game_mode_elem.classList.add("active")
        }

        game_mode_elem.addEventListener('click', function() {
            var elems = document.getElementsByClassName("game-mode")
            for (var i = 0; i < elems.length; i++) {
                elems[i].classList.remove("active")
            }
            this.classList.add("active")

            selected_game_mode = this.dataset.game_mode
            game = new Game(game_modes[selected_game_mode], ctx)
            setup_context(game)
        })

        document.getElementById('game_modes').appendChild(game_mode_elem)
    }

    var game = new Game(game_modes[selected_game_mode], ctx)
    setup_context(game)

    document.getElementById('solve_button').addEventListener("click", function() {
        game = new Game(game_modes[selected_game_mode], ctx)
        setup_context(game)

        document.getElementById('menu_button').style.visibility = 'visible'
        document.getElementById('menu').style.visibility = 'hidden'
    })

    document.getElementById('menu_button').addEventListener("click", function() {
        document.getElementById('menu_button').style.visibility = 'hidden'
        document.getElementById('menu').style.visibility = 'visible'
    })

    var shuffles = 10

    var drop_downs = document.getElementsByClassName('difficulty-choice')
    for (var i = 0; i < drop_downs.length; i++) {
        drop_downs[i].addEventListener('click', function() {
            shuffles = this.dataset.shuffles
        })
    }

    document.getElementById("undo_button").addEventListener("click", function() {
        game.undo()
        game.draw()

        document.getElementById('menu_button').style.visibility = 'visible'
        document.getElementById('menu').style.visibility = 'hidden'
    })
    document.getElementById("shuffle_button").addEventListener("click", function() {
        game.shuffle(shuffles)
        game.draw()

        document.getElementById('menu_button').style.visibility = 'visible'
        document.getElementById('menu').style.visibility = 'hidden'
    })

    window.addEventListener('resize', function() {
        setup_context(game)
    })

    function onclick(x, y, left_click) {
        document.getElementById('menu_button').style.visibility = 'visible'
        document.getElementById('menu').style.visibility = 'hidden'

        var found_circle
        for (var circle_idx in game.data) {
            var circle_pos = game.get_circle_screen_pos(circle_idx)
            if (Math.hypot(x - circle_pos[0], y - circle_pos[1]) < game.radius) {
                if (found_circle !== undefined) {
                    // Clicked two (or three) circles at once
                    return
                }
                found_circle = circle_idx
            }
        }

        if (found_circle === undefined) return

        game.undo_history.push({
            data: copy(game.data),
            circle: found_circle,
            angle_start: (Math.PI / 1.5) * (left_click ? 1 : -1)
        })
        if (!left_click) {
            for (var i = 0; i < 4; i++) {
                game.rotate_circle(found_circle)
            }
        }

        game.animating = {}
        game.rotate_circle(found_circle)
        game.draw()
        game.animate_piece(found_circle, (Math.PI / 1.5) * (left_click ? -1 : 1), ROTATION_TIME)

        if (game.is_solved() && game.shuffled) {
            game.shuffled = false
            var win_animation = function(step) {
                if (!game.is_solved() || step >= game.win_animation_order.length) {
                    return
                }

                for (var i = 0; i < game.win_animation_order[step].length; i++) {
                    game.animate_piece(game.win_animation_order[step][i], Math.PI * 4, ROTATION_TIME * 4, true, false)
                }
                setTimeout(win_animation, ROTATION_TIME * 4, step + 1)
            }
            setTimeout(win_animation, ROTATION_TIME, 0)
        }
    }

    canvas.addEventListener('mousedown', function(e) {
        if (e.which == 1) {
            onclick(e.pageX * PIXEL_RATIO, e.pageY * PIXEL_RATIO, true)
        }
        return false
    })
    canvas.addEventListener('contextmenu', function(e) {
        onclick(e.pageX * PIXEL_RATIO, e.pageY * PIXEL_RATIO, false)
        e.preventDefault()
        return false
    })

    game.draw()
})
