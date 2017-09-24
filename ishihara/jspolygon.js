function Polygon(x, y) {
    this.points = new Array();
    this.x = x;
    this.y = y
}

Polygon.prototype.addPoint = function(p) {
    this.points.push(p);
}

Polygon.prototype.addAbsolutePoint = function(p) {
    this.points.push({x: p.x - this.x, y: p.y - this.y});
}

Polygon.prototype.getNumberOfSides = function() {
    return this.points.length;
}

Polygon.prototype.rotate = function(rads) {
    for (var i = 0; i < this.points.length; i++) {
        var x = this.points[i].x;
        var y = this.points[i].y;
        this.points[i].x = Math.cos(rads) * x - Math.sin(rads) * y;
        this.points[i].y = Math.sin(rads) * x + Math.cos(rads) * y;
    }
}

Polygon.prototype.containsPoint = function(pnt) {
    var testx = pnt.x;
    var testy = pnt.y;

    var vertx = new Array();
    for (var q = 0; q < this.points.length; q++) {
        vertx.push(this.points[q].x + this.x);
    }

    var verty = new Array();
    for (var w = 0; w < this.points.length; w++) {
        verty.push(this.points[w].y + this.y);
    }

    var i, j = 0;
    var c = false;
    for (i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
        if ((verty[i]>testy != verty[j]>testy) &&
            (testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i])) {
            c = !c;
        }
    }

    return c;
}

Polygon.prototype.intersectsWith = function(other) {
    var axis = {};
    var tmp, minA, maxA, minB, maxB;
    var smallest = null;
    var overlap = 99999999;

    /* test polygon A's sides */
    for (var side = 0; side < this.getNumberOfSides(); side++) {
        /* get the axis that we will project onto */
        if (side == 0) {
            axis.x = this.points[this.getNumberOfSides() - 1].y - this.points[0].y;
            axis.y = this.points[0].x - this.points[this.getNumberOfSides() - 1].x;
        } else {
            axis.x = this.points[side - 1].y - this.points[side].y;
            axis.y = this.points[side].x - this.points[side - 1].x;
        }

        /* normalize the axis */
        tmp = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
        axis.x /= tmp;
        axis.y /= tmp;

        /* project polygon A onto axis to determine the min/max */
        minA = maxA = this.points[0].x * axis.x + this.points[0].y * axis.y;
        for (var i = 1; i < this.getNumberOfSides(); i++) {
            tmp = this.points[i].x * axis.x + this.points[i].y * axis.y;
            maxA = Math.max(maxA, tmp);
            minA = Math.min(minA, tmp);
        }
        /* correct for offset */
        tmp = this.x * axis.x + this.y * axis.y;
        minA += tmp;
        maxA += tmp;

        /* project polygon B onto axis to determine the min/max */
        minB = maxB = other.points[0].x * axis.x + other.points[0].y * axis.y;
        for (var i = 1; i < other.getNumberOfSides(); i++) {
            tmp = other.points[i].x * axis.x + other.points[i].y * axis.y;
            maxB = Math.max(maxB, tmp);
            minB = Math.min(minB, tmp);
        }
        /* correct for offset */
        tmp = other.x * axis.x + other.y * axis.y;
        minB += tmp;
        maxB += tmp;

        /* test if lines intersect, if not, return false */
        if (maxA < minB || minA > maxB) {
            return false;
        } else {
            var o = (maxA > maxB ? maxB - minA : maxA - minB);
            if (o < overlap) {
                overlap = o;
                smallest = {x: axis.x, y: axis.y};
            }
        }
    }

    /* test polygon B's sides */
    for (var side = 0; side < other.getNumberOfSides(); side++) {
        /* get the axis that we will project onto */
        if (side == 0) {
            axis.x = other.points[other.getNumberOfSides() - 1].y - other.points[0].y;
            axis.y = other.points[0].x - other.points[other.getNumberOfSides() - 1].x;
        } else {
            axis.x = other.points[side - 1].y - other.points[side].y;
            axis.y = other.points[side].x - other.points[side - 1].x;
        }

        /* normalize the axis */
        tmp = Math.sqrt(axis.x * axis.x + axis.y * axis.y);
        axis.x /= tmp;
        axis.y /= tmp;

        /* project polygon A onto axis to determine the min/max */
        minA = maxA = this.points[0].x * axis.x + this.points[0].y * axis.y;
        for (var i = 1; i < this.getNumberOfSides(); i++) {
            tmp = this.points[i].x * axis.x + this.points[i].y * axis.y;
            maxA = Math.max(maxA, tmp);
            minA = Math.min(minA, tmp);
        }
        /* correct for offset */
        tmp = this.x * axis.x + this.y * axis.y;
        minA += tmp;
        maxA += tmp;

        /* project polygon B onto axis to determine the min/max */
        minB = maxB = other.points[0].x * axis.x + other.points[0].y * axis.y;
        for (var i = 1; i < other.getNumberOfSides(); i++) {
            tmp = other.points[i].x * axis.x + other.points[i].y * axis.y;
            maxB = Math.max(maxB, tmp);
            minB = Math.min(minB, tmp);
        }
        /* correct for offset */
        tmp = other.x * axis.x + other.y * axis.y;
        minB += tmp;
        maxB += tmp;

        /* test if lines intersect, if not, return false */
        if (maxA < minB || minA > maxB) {
            return false;
        } else {
            var o = (maxA > maxB ? maxB - minA : maxA - minB);
            if (o < overlap) {
                overlap = o;
                smallest = {x: axis.x, y: axis.y};
            }
        }
    }

    return {"overlap": overlap + 0.001, "axis": smallest};
}
