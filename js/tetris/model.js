
var tetris = tetris || {};
tetris.model = tetris.model || {};

// A Scope for model definitions

(function(_, undefined) {

var model = tetris.model;

model.Point = function(x, y) {
    this.x = x;
    this.y = y;
}

model.Point.prototype = {

    move: function(dx, dy) { 
        return new model.Point(this.x + dx, this.y + dy); 
    },

    rotateRight: function(p) {
        var newX = Math.round(-(this.y - p.y) + p.x);
        var newY = Math.round((this.x - p.x) + p.y);
        return new model.Point(newX, newY);
    },

    rotateLeft: function(p) {
        var newX = Math.round((this.y - p.y) + p.x);
        var newY = Math.round(-(this.x - p.x) + p.y);
        return new model.Point(newX, newY);
    },

    isEqual: function(that) {
        return (that instanceof model.Point) && this.x == that.x && this.y == that.y;
    },
}

model.Polyomino = function(points, rotationPoint) {
    this._points = []

    for(var i = 0; i < points.length; i++)
        this._points.push(new model.Point(points[i].x, points[i].y));

    this._rotationPoint = new model.Point(rotationPoint.x, rotationPoint.y);
}

model.Polyomino.prototype = {

    moveLeft: function() { return this._tryMove(this._moveLeft); },

    moveRight: function() { return this._tryMove(this._moveRight); },

    moveUp: function() { return this._tryMove(this._moveUp); },

    moveDown: function() { return this._tryMove(this._moveDown); },

    rotateLeft: function() { return this._tryMove(this._rotateLeft); },

    rotateRight: function() { return this._tryMove(this._rotateRight); },
   
    getDimensions: function() {
	return {
            fromX: _.chain(this._points).pluck('x').min().value(),
            toX  : _.chain(this._points).pluck('x').max().value() + 1,
            fromY: _.chain(this._points).pluck('y').min().value(),
            toY  : _.chain(this._points).pluck('y').max().value() + 1
        };
    },

    toString: function() {
        var d = this.getDimensions();
        var s = "\n";

        for(var y = d.fromY; y < d.toY; y++) {
            for(var x = d.fromX; x < d.toX; x++) {
                if(_(this._points).any(function(p) { return p.x == x && p.y == y}))
                    s += "[]";
                else
                    s += "  ";
            }

            s += "\n";
        }

        return s;
    },

    _create: function(points, rotationPoint) { return new model.Polyomino(points, rotationPoint); },

    _move: function(dx, dy) { 
        var ps = _(this._points).map(function(p) { return p.move(dx, dy); });
        var rp = this._rotationPoint.move(dx, dy);
        return this._create(ps, rp);
    },

    _moveRight: function() { return this._move(1, 0); },

    _moveLeft: function() { return this._move(-1, 0); },

    _moveDown: function() { return this._move(0, 1); },

    _moveUp: function() { return this._move(0, -1); },

    _rotateRight: function() { 
        var self = this;
        var ps = _(self._points).map(function(p) { return p.rotateRight(self._rotationPoint); });
        return this._create(ps, this._rotationPoint);
    },

    _rotateLeft: function() {
        var self = this;
        var ps = _(self._points).map(function(p) { return p.rotateLeft(self._rotationPoint); });
        return this._create(ps, this._rotationPoint);
    },

    _isValid: function() {
        var self = this;
        return _(self._points).every(function(p) { return self._isValidPoint(p); });
    },

    _isValidPoint: function(p) {
        return true;
    },

    _tryMove: function(fn) {
        var newPolyomino = fn.call(this);
        return newPolyomino._isValid() ? newPolyomino : this;
    }
}

model.Field = function(width, height) {
    // array that holds number of minos(blocks) in every line
    this._minoCounters = _(height).times(_.constant(0));
    
    this.field = _(width).times(function() {
        return _(height).times(_.constant(null));
    });
} 
		    
model.Field.prototype = {

    getWidth: function() { return this.field.length; },

    getHeight: function() {
        if(this.field.length <= 0)
            throw new Error("Cannot get height of a field that has width zero");	    

        return this.field[0].length;
    },
    
    isValid: function(x, y) {
        return x >= 0 && x < this.getWidth() && y < this.getHeight();
    },	
    
    setMino: function(x, y, value) {
        if(!this.isValid(x, y))
	    throw new Error("Trying to set an invalid cell");

	if(this._field[x][y] === null && value !== null) {
	    this._minoCounter[y] += 1;
	} else if(this._field[x][y] !== null && value === null) {
	    this._minoCounter[y] -= 1;
	}

        this.field[x][y] = value;
	return this;
    },
    
    getMino: function(x, y) {
        if(!this.isValid(x, y))
	    throw new Error("Trying to get a value of an invalid cell");

	if(y < 0)
            return null;

        return this.field[x][y];
    },

    clear: function(x, y) {
	this.setMino(null);
    },    

    isEmpty: function(x, y) {
        return this.getMino(x, y) === null	    
    },    

    getNumberOfMinosInLine: function(y) {
	return this._minoCounters[y];
    },    

    isLineComplete: function(y) {
	return this.getNumberOfMinosInLine(y) == this.getWidth();
    },    

    clearLine: function(lineNumber) {
	for(var y = lineNumber; y >= 0; y--)
	    for(var x = 0; x < this.getWidth(); x++)
	        this._field[x][y] = this.getMino(x, y - 1);
    },

    toString: function(x, y) {
	var s = "\n";

	for(var y = 0; y < this.getHeight(); y++) {
	    for(var x = 0; x < this.getWidth(); x++)
                s += this.isEmpty(x, y) ? "  " : "[]";	    

	    s += "\n";
	}

	return s;
    }
}

// End of scope
})(_);


var testPentamino = new tetris.model.Polyomino(
    [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 2, y: 1}, {x: 3, y: 0}], 
    {x: 1, y: 0}   
);

var testITetramino = new tetris.model.Polyomino(
    [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0} ], 
    {x: 1.5, y: 0.5}   
);

var testOTetramino = new tetris.model.Polyomino(
    [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1} ], 
    {x: 0.5, y: 0.5}   
);

