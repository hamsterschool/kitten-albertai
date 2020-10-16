const Resource = require('./resource.js');

function AlbertAiController() {
	this.prevDirection = 0;
	this.prevDirectionFinal = 0;
	this.directionCount = 0;
	this.directionCountFinal = 0;
	this.positionCount = 0;
	this.positionCountFinal = 0;
	this.isBackward = false;
}

AlbertAiController.prototype.PI = 3.14159265;
AlbertAiController.prototype.PI2 = 6.2831853;
AlbertAiController.prototype.GAIN_ANGLE = 30;
AlbertAiController.prototype.GAIN_ANGLE_FINE = 30;
AlbertAiController.prototype.GAIN_POSITION_FINE = 30;
AlbertAiController.prototype.STRAIGHT_SPEED = 50;//30;
AlbertAiController.prototype.MAX_BASE_SPEED = 50;//30;
AlbertAiController.prototype.GAIN_BASE_SPEED = 2;//1.5;
AlbertAiController.prototype.GAIN_POSITION = 70;//52.5;
AlbertAiController.prototype.POSITION_TOLERANCE_FINE = 3;
AlbertAiController.prototype.POSITION_TOLERANCE_FINE_LARGE = 5;
AlbertAiController.prototype.POSITION_TOLERANCE_ROUGH = 5;
AlbertAiController.prototype.POSITION_TOLERANCE_ROUGH_LARGE = 10;
AlbertAiController.prototype.ORIENTATION_TOLERANCE_FINAL = 0.087;
AlbertAiController.prototype.ORIENTATION_TOLERANCE_FINAL_LARGE = 0.122;
AlbertAiController.prototype.ORIENTATION_TOLERANCE_FINAL_LARGE_LARGE = 0.262;
AlbertAiController.prototype.ORIENTATION_TOLERANCE_ROUGH = 0.122;
AlbertAiController.prototype.ORIENTATION_TOLERANCE_ROUGH_LARGE = 0.262;
AlbertAiController.prototype.ORIENTATION_TOLERANCE_ROUGH_LARGE_LARGE = 0.524;
AlbertAiController.prototype.MINIMUM_WHEEL_SPEED = 18;
AlbertAiController.prototype.MINIMUM_WHEEL_SPEED_FINE = 15;

AlbertAiController.prototype.clear = function() {
	this.prevDirection = 0;
	this.prevDirectionFinal = 0;
	this.directionCount = 0;
	this.directionCountFinal = 0;
	this.positionCount = 0;
	this.positionCountFinal = 0;
};

AlbertAiController.prototype.setBackward = function(backward) {
	this.isBackward = backward;
};

AlbertAiController.prototype.controlAngleInitial = function(wheels, currentRadian, targetRadian) {
	if(this.isBackward) {
		currentRadian += this.PI;
	}
	var diff = this.validateRadian(targetRadian - currentRadian);
	var mag = Math.abs(diff);
	if (mag < this.ORIENTATION_TOLERANCE_ROUGH) return true;
	
	var direction = diff > 0 ? 1 : -1;
	if(mag < this.ORIENTATION_TOLERANCE_ROUGH_LARGE && direction * this.prevDirection < 0) return true;
	this.prevDirection = direction;
	
	var value = 0;
	if(diff > 0) {
		value = Math.log(1 + mag) * this.GAIN_ANGLE;
		if(value < this.MINIMUM_WHEEL_SPEED) value = this.MINIMUM_WHEEL_SPEED;
	} else {
		value = -Math.log(1 + mag) * this.GAIN_ANGLE;
		if(value > -this.MINIMUM_WHEEL_SPEED) value = -this.MINIMUM_WHEEL_SPEED;
	}
	value = parseInt(value);
	wheels.left = -value;
	wheels.right = value;
	return false;
};

AlbertAiController.prototype.controlAngleFinal = function(wheels, currentRadian, targetRadian) {
	var diff = this.validateRadian(targetRadian - currentRadian);
	var mag = Math.abs(diff);
	if(mag < this.ORIENTATION_TOLERANCE_FINAL) return true;

	var direction = diff > 0 ? 1 : -1;
	if(mag < this.ORIENTATION_TOLERANCE_FINAL_LARGE && direction * this.prevDirectionFinal < 0) return true;
	if(mag < this.ORIENTATION_TOLERANCE_FINAL_LARGE_LARGE && direction * this.prevDirectionFinal < 0) {
		if(++this.directionCountFinal > 3) return true;
	}
	this.prevDirectionFinal = direction;
	
	var value = 0;
	if(diff > 0) {
		value = Math.log(1 + mag) * this.GAIN_ANGLE_FINE;
		if(value < this.MINIMUM_WHEEL_SPEED) value = this.MINIMUM_WHEEL_SPEED;
	} else {
		value = -Math.log(1 + mag) * this.GAIN_ANGLE_FINE;
		if(value > -this.MINIMUM_WHEEL_SPEED) value = -this.MINIMUM_WHEEL_SPEED;
	}
	value = parseInt(value);
	wheels.left = -value;
	wheels.right = value;
	return false;
};

AlbertAiController.prototype.controlPositionFine = function(wheels, currentX, currentY, currentRadian, targetX, targetY) {
	var targetRadian = -Math.atan2(targetY - currentY, targetX - currentX);
	if(this.isBackward) {
		currentRadian += this.PI;
	}
	var diff = this.validateRadian(targetRadian - currentRadian);
	var mag = Math.abs(diff);
	var ex = targetX - currentX;
	var ey = targetY - currentY;
	var dist = Math.sqrt(ex * ex + ey * ey);
	if(dist < this.POSITION_TOLERANCE_FINE) return true;
	if(dist < this.POSITION_TOLERANCE_FINE_LARGE) {
		if (++this.positionCountFinal > 5) {
			this.positionCountFinal = 0;
			return true;
		}
	}
	var value = 0;
	if (diff > 0) value = Math.log(1 + mag) * this.GAIN_POSITION_FINE;
	else value = -Math.log(1 + mag) * this.GAIN_POSITION_FINE;
	if(this.isBackward) {
		value = -value;
	}
	value = parseInt(value);
	wheels.left = this.MINIMUM_WHEEL_SPEED_FINE - value;
	wheels.right = this.MINIMUM_WHEEL_SPEED_FINE + value;
	if(this.isBackward) {
		wheels.left = -wheels.left;
		wheels.right = -wheels.right;
	}
	return false;
};

AlbertAiController.prototype.controlPosition = function(wheels, currentX, currentY, currentRadian, targetX, targetY) {
	var targetRadian = -Math.atan2(targetY - currentY, targetX - currentX);
	if(this.isBackward) {
		currentRadian += this.PI;
	}
	var diff = this.validateRadian(targetRadian - currentRadian);
	var mag = Math.abs(diff);
	var ex = targetX - currentX;
	var ey = targetY - currentY;
	var dist = Math.sqrt(ex * ex + ey * ey);
	if(dist < this.POSITION_TOLERANCE_ROUGH) return true;
	if(dist < this.POSITION_TOLERANCE_ROUGH_LARGE) {
		if(++this.positionCount > 10) {
			this.positionCount = 0;
			return true;
		}
	} else {
		this.positionCount = 0;
	}
	if(mag < 0.01) {
		wheels.left = this.STRAIGHT_SPEED;
		wheels.right = this.STRAIGHT_SPEED;
	} else {
		var base = (this.MINIMUM_WHEEL_SPEED + 0.5 / mag) * this.GAIN_BASE_SPEED;
		if(base > this.MAX_BASE_SPEED) base = this.MAX_BASE_SPEED;
		
		var value = 0;
		if(diff > 0) value = Math.log(1 + mag) * this.GAIN_POSITION;
		else value = -Math.log(1 + mag) * this.GAIN_POSITION;
		if(this.isBackward) {
			value = -value;
		}
		base = parseInt(base);
		value = parseInt(value);
		wheels.left = base - value;
		wheels.right = base + value;
	}
	if(this.isBackward) {
		wheels.left = -wheels.left;
		wheels.right = -wheels.right;
	}
	return false;
};

AlbertAiController.prototype.validateRadian = function(radian) {
	if(radian > this.PI) return radian - this.PI2;
	else if(radian < -this.PI) return radian + this.PI2;
	return radian;
};

AlbertAiController.prototype.toRadian = function(degree) {
	return degree * 3.14159265 / 180.0;
};

function AlbertAiNavigator() {
	this.controller = new AlbertAiController();
	this.mode = 0;
	this.state = 0;
	this.initialized = false;
	this.currentX = -1;
	this.currentY = -1;
	this.currentTheta = -200;
	this.targetX = -1;
	this.targetY = -1;
	this.targetTheta = -200;
	this.wheels = { completed: false, left: 0, right: 0 };
}

AlbertAiNavigator.prototype.clear = function() {
	this.mode = 0;
	this.state = 0;
	this.initialized = false;
	this.currentX = -1;
	this.currentY = -1;
	this.currentTheta = -200;
	this.targetX = -1;
	this.targetY = -1;
	this.targetTheta = -200;
	this.wheels.completed = false;
	this.wheels.left = 0;
	this.wheels.right = 0;
	this.controller.clear();
};

AlbertAiNavigator.prototype.setBackward = function(backward) {
	this.controller.setBackward(backward);
};

AlbertAiNavigator.prototype.moveTo = function(x, y) {
	this.clear();
	this.targetX = x;
	this.targetY = y;
	this.state = 1;
	this.mode = 1;
};

AlbertAiNavigator.prototype.turnTo = function(deg) {
	this.clear();
	this.targetTheta = deg;
	this.state = 1;
	this.mode = 2;
};

AlbertAiNavigator.prototype.handleSensory = function(sensory) {
	if(this.mode == 1) {
		var x = sensory.positionX;
		var y = sensory.positionY;
		if(x >= 0) this.currentX = x;
		if(y >= 0) this.currentY = y;
		this.currentTheta = sensory.orientation;
		switch(this.state) {
			case 1: {
				if(this.initialized == false) {
					if(this.currentX < 0 || this.currentY < 0) {
						this.wheels.left = 20;
						this.wheels.right = -20;
					} else {
						this.initialized = true;
					}
				}
				if(this.initialized) {
					var currentRadian = this.controller.toRadian(this.currentTheta);
					var dx = this.targetX - this.currentX;
					var dy = this.targetY - this.currentY;
					var targetRadian = -Math.atan2(dy, dx);
					if(this.controller.controlAngleInitial(this.wheels, currentRadian, targetRadian)) {
						this.state = 2;
					}
				}
				break;
			}
			case 2: {
				var currentRadian = this.controller.toRadian(this.currentTheta);
				if(this.controller.controlPosition(this.wheels, this.currentX, this.currentY, currentRadian, this.targetX, this.targetY)) {
					this.state = 3;
				}
				break;
			}
			case 3: {
				var currentRadian = this.controller.toRadian(this.currentTheta);
				if(this.controller.controlPositionFine(this.wheels, this.currentX, this.currentY, currentRadian, this.targetX, this.targetY)) {
					this.clear();
					this.wheels.completed = true;
				}
				break;
			}
		}
	} else if(this.mode == 2) {
		this.currentTheta = sensory.orientation;
		switch(this.state) {
			case 1: {
				var currentRadian = this.controller.toRadian(this.currentTheta);
				var targetRadian = this.controller.toRadian(this.targetTheta);
				if(this.controller.controlAngleInitial(this.wheels, currentRadian, targetRadian)) {
					this.state = 2;
				}
				break;
			}
			case 2: {
				var currentRadian = this.controller.toRadian(this.currentTheta);
				var targetRadian = this.controller.toRadian(this.targetTheta);
				if(this.controller.controlAngleFinal(this.wheels, currentRadian, targetRadian)) {
					this.clear();
					this.wheels.completed = true;
				}
				break;
			}
		}
	}
	return this.wheels;
};

function AlbertAi(index) {
	this.sensory = {
		map1: 0,
		map2: 0,
		signalStrength: 0,
		leftProximity: 0,
		rightProximity: 0,
		accelerationX: 0,
		accelerationY: 0,
		accelerationZ: 0,
		positionX: -1,
		positionY: -1,
		orientation: -200,
		light: 0,
		micTouch: 0,
		volumeUpTouch: 0,
		volumeDownTouch: 0,
		playTouch: 0,
		backTouch: 0,
		oidMode: 0,
		oid: -1,
		lift: 0,
		pulseCount: 0,
		wheelState: 0,
		soundState: 0,
		batteryState: 2,
		tilt: 0,
		handFound: false
	};
	this.motoring = {
		module: 'albertai',
		index: index,
		map: 0xbfc00000,
		leftWheel: 0,
		rightWheel: 0,
		leftRed: 0,
		leftGreen: 0,
		leftBlue: 0,
		rightRed: 0,
		rightGreen: 0,
		rightBlue: 0,
		micRed: 0,
		micGreen: 0,
		micBlue: 0,
		buzzer: 0,
		pulse: 0,
		note: 0,
		sound: 0,
		boardWidth: 0,
		boardHeight: 0,
		motionType: 0,
		motionUnit: 0,
		motionSpeed: 0,
		motionValue: 0,
		motionRadius: 0
	};
	this.blockId = 0;
	this.navigationCallback = undefined;
	this.navigator = undefined;
	this.motionCallback = undefined;
	this.currentSound = 0;
	this.soundRepeat = 1;
	this.soundCallback = undefined;
	this.noteId = 0;
	this.noteTimer1 = undefined;
	this.noteTimer2 = undefined;
	this.micClicked = false;
	this.volumeUpClicked = false;
	this.volumeDownClicked = false;
	this.playClicked = false;
	this.backClicked = false;
	this.micLongPressed = false;
	this.volumeUpLongPressed = false;
	this.volumeDownLongPressed = false;
	this.playLongPressed = false;
	this.backLongPressed = false;
	this.micLongLongPressed = false;
	this.volumeUpLongLongPressed = false;
	this.volumeDownLongLongPressed = false;
	this.playLongLongPressed = false;
	this.backLongLongPressed = false;
	this.tap = false;
	this.tempo = 60;
	this.timeouts = [];
}

AlbertAi.prototype.reset = function() {
	var motoring = this.motoring;
	motoring.map = 0xbffe0000;
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	motoring.leftRed = 0;
	motoring.leftGreen = 0;
	motoring.leftBlue = 0;
	motoring.rightRed = 0;
	motoring.rightGreen = 0;
	motoring.rightBlue = 0;
	motoring.micRed = 0;
	motoring.micGreen = 0;
	motoring.micBlue = 0;
	motoring.buzzer = 0;
	motoring.pulse = 0;
	motoring.note = 0;
	motoring.sound = 0;
	motoring.boardWidth = 0;
	motoring.boardHeight = 0;
	motoring.motionType = 0;
	motoring.motionUnit = 0;
	motoring.motionSpeed = 0;
	motoring.motionValue = 0;
	motoring.motionRadius = 0;
	
	this.blockId = 0;
	this.navigationCallback = undefined;
	this.navigator = undefined;
	this.motionCallback = undefined;
	this.currentSound = 0;
	this.soundRepeat = 1;
	this.soundCallback = undefined;
	this.noteId = 0;
	this.noteTimer1 = undefined;
	this.noteTimer2 = undefined;
	this.micClicked = false;
	this.volumeUpClicked = false;
	this.volumeDownClicked = false;
	this.playClicked = false;
	this.backClicked = false;
	this.micLongPressed = false;
	this.volumeUpLongPressed = false;
	this.volumeDownLongPressed = false;
	this.playLongPressed = false;
	this.backLongPressed = false;
	this.micLongLongPressed = false;
	this.volumeUpLongLongPressed = false;
	this.volumeDownLongLongPressed = false;
	this.playLongLongPressed = false;
	this.backLongLongPressed = false;
	this.tap = false;
	this.tempo = 60;
	
	this.__removeAllTimeouts();
};

AlbertAi.prototype.__removeTimeout = function(id) {
	clearTimeout(id);
	var idx = this.timeouts.indexOf(id);
	if(idx >= 0) {
		this.timeouts.splice(idx, 1);
	}
};

AlbertAi.prototype.__removeAllTimeouts = function() {
	var timeouts = this.timeouts;
	for(var i in timeouts) {
		clearTimeout(timeouts[i]);
	}
	this.timeouts = [];
};

AlbertAi.prototype.clearMotoring = function() {
	this.motoring.map = 0xbfc00000;
};

AlbertAi.prototype.clearEvent = function() {
	this.micClicked = false;
	this.volumeUpClicked = false;
	this.volumeDownClicked = false;
	this.playClicked = false;
	this.backClicked = false;
	this.micLongPressed = false;
	this.volumeUpLongPressed = false;
	this.volumeDownLongPressed = false;
	this.playLongPressed = false;
	this.backLongPressed = false;
	this.micLongLongPressed = false;
	this.volumeUpLongLongPressed = false;
	this.volumeDownLongLongPressed = false;
	this.playLongLongPressed = false;
	this.backLongLongPressed = false;
	this.tap = false;
};

AlbertAi.prototype.__setPulse = function(pulse) {
	this.motoring.pulse = pulse;
	this.motoring.map |= 0x00200000;
};

AlbertAi.prototype.__setNote = function(note) {
	this.motoring.note = note;
	this.motoring.map |= 0x00100000;
};

AlbertAi.prototype.__issueNoteId = function() {
	this.noteId = this.blockId = (this.blockId % 65535) + 1;
	return this.noteId;
};

AlbertAi.prototype.__cancelNote = function() {
	this.noteId = 0;
	if(this.noteTimer1 !== undefined) {
		this.__removeTimeout(this.noteTimer1);
	}
	if(this.noteTimer2 !== undefined) {
		this.__removeTimeout(this.noteTimer2);
	}
	this.noteTimer1 = undefined;
	this.noteTimer2 = undefined;
};

AlbertAi.prototype.__setSound = function(sound) {
	this.motoring.sound = sound;
	this.motoring.map |= 0x00080000;
};

AlbertAi.prototype.__runSound = function(sound, count) {
	if(typeof count != 'number') count = 1;
	if(count < 0) count = -1;
	if(count) {
		this.currentSound = sound;
		this.soundRepeat = count;
		this.__setSound(sound);
	}
};

AlbertAi.prototype.__cancelSound = function() {
	this.soundCallback = undefined;
};

AlbertAi.prototype.__setBoardSize = function(width, height) {
	this.motoring.boardWidth = width;
	this.motoring.boardHeight = height;
	this.motoring.map |= 0x00040000;
};

AlbertAi.prototype.__setMotion = function(type, unit, speed, value, radius) {
	var motoring = this.motoring;
	motoring.motionType = type;
	motoring.motionUnit = unit;
	motoring.motionSpeed = speed;
	motoring.motionValue = value;
	motoring.motionRadius = radius;
	motoring.map |= 0x00020000;
};

AlbertAi.prototype.__cancelMotion = function() {
	this.motionCallback = undefined;
};

AlbertAi.prototype.__getNavigator = function() {
	if(this.navigator == undefined) {
		this.navigator = new AlbertAiNavigator();
	}
	return this.navigator;
};

AlbertAi.prototype.__cancelNavigation = function() {
	this.navigationCallback = undefined;
	if(this.navigator) {
		this.navigator.clear();
	}
};

AlbertAi.prototype.handleSensory = function() {
	var self = this;
	var sensory = self.sensory;
	
	if(sensory.map1 & 0x00000008) self.micClicked = true;
	if(sensory.map1 & 0x00000004) self.volumeUpClicked = true;
	if(sensory.map1 & 0x00000002) self.volumeDownClicked = true;
	if(sensory.map1 & 0x00000001) self.playClicked = true;
	if(sensory.map2 & 0x80000000) self.backClicked = true;
	if(sensory.map2 & 0x40000000) self.micLongPressed = true;
	if(sensory.map2 & 0x20000000) self.volumeUpLongPressed = true;
	if(sensory.map2 & 0x10000000) self.volumeDownLongPressed = true;
	if(sensory.map2 & 0x08000000) self.playLongPressed = true;
	if(sensory.map2 & 0x04000000) self.backLongPressed = true;
	if(sensory.map2 & 0x02000000) self.micLongLongPressed = true;
	if(sensory.map2 & 0x01000000) self.volumeUpLongLongPressed = true;
	if(sensory.map2 & 0x00800000) self.volumeDownLongLongPressed = true;
	if(sensory.map2 & 0x00400000) self.playLongLongPressed = true;
	if(sensory.map2 & 0x00200000) self.backLongLongPressed = true;
	if(sensory.map2 & 0x00100000) self.tap = true;
	
	if(self.motionCallback && (sensory.map2 & 0x00008000) != 0) {
		if(sensory.wheelState == 2) {
			self.motoring.leftWheel = 0;
			self.motoring.rightWheel = 0;
			var callback = self.motionCallback;
			self.__cancelMotion();
			if(callback) callback();
		}
	}
	if(self.navigationCallback) {
		if(self.navigator) {
			var result = self.navigator.handleSensory(self.sensory);
			self.motoring.leftWheel = result.left;
			self.motoring.rightWheel = result.right;
			if(result.completed) {
				var callback = self.navigationCallback;
				self.__cancelNavigation();
				if(callback) callback();
			}
		}
	}
	if((sensory.map2 & 0x00004000) != 0) {
		if(sensory.soundState == 0) {
			if(self.currentSound > 0) {
				if(self.soundRepeat < 0) {
					self.__runSound(self.currentSound, -1);
				} else if(self.soundRepeat > 1) {
					self.soundRepeat --;
					self.__runSound(self.currentSound, self.soundRepeat);
				} else {
					self.currentSound = 0;
					self.soundRepeat = 1;
					var callback = self.soundCallback;
					self.__cancelSound();
					if(callback) callback();
				}
			} else {
				self.currentSound = 0;
				self.soundRepeat = 1;
				var callback = self.soundCallback;
				self.__cancelSound();
				if(callback) callback();
			}
		}
	}
};

AlbertAi.prototype.__UNITS = {
	'cm': 1,
	'degrees': 1,
	'seconds': 2,
	'pulses': 3
};

AlbertAi.prototype.__motion = function(type, callback) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	this.__setPulse(0);
	this.__setMotion(type, 1, 0, 0, 0); // type, unit, speed, value, radius
	this.motionCallback = callback;
};

AlbertAi.prototype.__motionUnit = function(type, unit, value, callback) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelMotion();
	
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	this.__setPulse(0);
	value = parseFloat(value);
	if(value && value > 0) {
		this.__setMotion(type, unit, 0, value, 0); // type, unit, speed, value, radius
		this.motionCallback = callback;
	} else {
		this.__setMotion(0, 0, 0, 0, 0);
		callback();
	}
};

AlbertAi.prototype.moveForward = function(callback) {
	this.__motion(101, callback);
};

AlbertAi.prototype.moveBackward = function(callback) {
	this.__motion(102, callback);
};

AlbertAi.prototype.turn = function(direction, callback) {
	if(direction == 'left') {
		this.__motion(103, callback);
	} else {
		this.__motion(104, callback);
	}
};

AlbertAi.prototype.moveForwardUnit = function(value, unit, callback) {
	if(value < 0) this.__motionUnit(2, this.__UNITS[unit], -value, callback);
	else this.__motionUnit(1, this.__UNITS[unit], value, callback);
};

AlbertAi.prototype.moveBackwardUnit = function(value, unit, callback) {
	if(value < 0) this.__motionUnit(1, this.__UNITS[unit], -value, callback);
	else this.__motionUnit(2, this.__UNITS[unit], value, callback);
};

AlbertAi.prototype.turnUnit = function(direction, value, unit, callback) {
	if(direction == 'left') {
		if(value < 0) this.__motionUnit(4, this.__UNITS[unit], -value, callback);
		else this.__motionUnit(3, this.__UNITS[unit], value, callback);
	} else {
		if(value < 0) this.__motionUnit(3, this.__UNITS[unit], -value, callback);
		else this.__motionUnit(4, this.__UNITS[unit], value, callback);
	}
};

AlbertAi.prototype.pivotUnit = function(part, value, unit, toward, callback) {
	unit = this.__UNITS[unit];
	if(part == 'left') {
		if(toward == 'forward') {
			if(value < 0) this.__motionUnit(6, unit, -value, callback);
			else this.__motionUnit(5, unit, value, callback);
		} else {
			if(value < 0) this.__motionUnit(5, unit, -value, callback);
			else this.__motionUnit(6, unit, value, callback);
		}
	} else {
		if(toward == 'forward') {
			if(value < 0) this.__motionUnit(8, unit, -value, callback);
			else this.__motionUnit(7, unit, value, callback);
		} else {
			if(value < 0) this.__motionUnit(7, unit, -value, callback);
			else this.__motionUnit(8, unit, value, callback);
		}
	}
};

AlbertAi.prototype.setWheels = function(leftVelocity, rightVelocity) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelMotion();
	
	leftVelocity = parseFloat(leftVelocity);
	rightVelocity = parseFloat(rightVelocity);
	if(typeof leftVelocity == 'number') {
		motoring.leftWheel = leftVelocity;
	}
	if(typeof rightVelocity == 'number') {
		motoring.rightWheel = rightVelocity;
	}
	this.__setPulse(0);
	this.__setMotion(0, 0, 0, 0, 0);
};

AlbertAi.prototype.changeWheels = function(leftVelocity, rightVelocity) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelMotion();
	
	leftVelocity = parseFloat(leftVelocity);
	rightVelocity = parseFloat(rightVelocity);
	if(typeof leftVelocity == 'number') {
		motoring.leftWheel += leftVelocity;
	}
	if(typeof rightVelocity == 'number') {
		motoring.rightWheel += rightVelocity;
	}
	this.__setPulse(0);
	this.__setMotion(0, 0, 0, 0, 0);
};

AlbertAi.prototype.setWheel = function(wheel, velocity) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelMotion();
	
	velocity = parseFloat(velocity);
	if(typeof velocity == 'number') {
		if(wheel == 'left') {
			motoring.leftWheel = velocity;
		} else if(wheel == 'right') {
			motoring.rightWheel = velocity;
		} else {
			motoring.leftWheel = velocity;
			motoring.rightWheel = velocity;
		}
	}
	this.__setPulse(0);
	this.__setMotion(0, 0, 0, 0, 0);
};

AlbertAi.prototype.changeWheel = function(wheel, velocity) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelMotion();
	
	velocity = parseFloat(velocity);
	if(typeof velocity == 'number') {
		if(wheel == 'left') {
			motoring.leftWheel += velocity;
		} else if(wheel == 'right') {
			motoring.rightWheel += velocity;
		} else {
			motoring.leftWheel += velocity;
			motoring.rightWheel += velocity;
		}
	}
	this.__setPulse(0);
	this.__setMotion(0, 0, 0, 0, 0);
};

AlbertAi.prototype.stop = function() {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelMotion();
	
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	this.__setPulse(0);
	this.__setMotion(0, 0, 0, 0, 0);
};

AlbertAi.prototype.moveToOnBoard = function(toward, x, y, callback) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelMotion();
	
	x = parseInt(x);
	y = parseInt(y);
	var navi = this.__getNavigator();
	if((typeof x == 'number') && (typeof y == 'number') && x >= 0 && y >= 0) {
		motoring.leftWheel = 0;
		motoring.rightWheel = 0;
		this.__setPulse(0);
		this.__setMotion(0, 0, 0, 0, 0);
		navi.setBackward(toward == 'backward');
		navi.moveTo(x, y);
		this.navigationCallback = callback;
	}
};

AlbertAi.prototype.setOrientationToOnBoard = function(degree, callback) {
	var motoring = this.motoring;
	this.__cancelNavigation();
	this.__cancelMotion();
	
	degree = parseInt(degree);
	if(typeof degree == 'number') {
		var navi = this.__getNavigator();
		motoring.leftWheel = 0;
		motoring.rightWheel = 0;
		this.__setPulse(0);
		this.__setMotion(0, 0, 0, 0, 0);
		navi.setBackward(false);
		navi.turnTo(degree);
		this.navigationCallback = callback;
	}
};

AlbertAi.prototype.__RGBS = {
	'red': [255, 0, 0],
	'orange': [255, 63, 0],
	'yellow': [255, 255, 0],
	'green': [0, 255, 0],
	'sky blue': [0, 255, 255],
	'blue': [0, 0, 255],
	'violet': [63, 0, 255],
	'purple': [255, 0, 255],
	'white': [255, 255, 255]
};

AlbertAi.prototype.setEyeColor = function(eye, color) {
	var rgb = this.__RGBS[color];
	if(rgb) {
		this.setRgb(eye, rgb[0], rgb[1], rgb[2]);
	}
};

AlbertAi.prototype.clearEye = function(eye) {
	this.setRgb(eye, 0, 0, 0);
};

AlbertAi.prototype.setRgbArray = function(eye, rgb) {
	if(rgb) {
		this.setRgb(eye, rgb[0], rgb[1], rgb[2]);
	}
};

AlbertAi.prototype.setRgb = function(eye, red, green, blue) {
	var motoring = this.motoring;
	red = parseInt(red);
	green = parseInt(green);
	blue = parseInt(blue);
	if(eye == 'left') {
		if(typeof red == 'number') {
			motoring.leftRed = red;
		}
		if(typeof green == 'number') {
			motoring.leftGreen = green;
		}
		if(typeof blue == 'number') {
			motoring.leftBlue = blue;
		}
	} else if(eye == 'right') {
		if(typeof red == 'number') {
			motoring.rightRed = red;
		}
		if(typeof green == 'number') {
			motoring.rightGreen = green;
		}
		if(typeof blue == 'number') {
			motoring.rightBlue = blue;
		}
	} else {
		if(typeof red == 'number') {
			motoring.leftRed = red;
			motoring.rightRed = red;
		}
		if(typeof green == 'number') {
			motoring.leftGreen = green;
			motoring.rightGreen = green;
		}
		if(typeof blue == 'number') {
			motoring.leftBlue = blue;
			motoring.rightBlue = blue;
		}
	}
};

AlbertAi.prototype.changeRgb = function(eye, red, green, blue) {
	var motoring = this.motoring;
	red = parseInt(red);
	green = parseInt(green);
	blue = parseInt(blue);
	if(eye == 'left') {
		if(typeof red == 'number') {
			motoring.leftRed += red;
		}
		if(typeof green == 'number') {
			motoring.leftGreen += green;
		}
		if(typeof blue == 'number') {
			motoring.leftBlue += blue;
		}
	} else if(eye == 'right') {
		if(typeof red == 'number') {
			motoring.rightRed += red;
		}
		if(typeof green == 'number') {
			motoring.rightGreen += green;
		}
		if(typeof blue == 'number') {
			motoring.rightBlue += blue;
		}
	} else {
		if(typeof red == 'number') {
			motoring.leftRed += red;
			motoring.rightRed += red;
		}
		if(typeof green == 'number') {
			motoring.leftGreen += green;
			motoring.rightGreen += green;
		}
		if(typeof blue == 'number') {
			motoring.leftBlue += blue;
			motoring.rightBlue += blue;
		}
	}
};

AlbertAi.prototype.__SOUNDS = {
	'beep': 1,
	'random beep': 2,
	'noise': 10,
	'siren': 3,
	'engine': 4,
	'robot': 5,
	'march': 6,
	'birthday': 7,
	'dibidibidip': 8,
	'good job': 9
};

AlbertAi.prototype.playSound = function(sound, count) {
	var motoring = this.motoring;
	this.__cancelNote();
	this.__cancelSound();
	
	sound = this.__SOUNDS[sound];
	count = parseInt(count);
	motoring.buzzer = 0;
	this.__setNote(0);
	if(sound && count) {
		this.__runSound(sound, count);
	} else {
		this.__runSound(0);
	}
};

AlbertAi.prototype.playSoundUntil = function(sound, count, callback) {
	var motoring = this.motoring;
	this.__cancelNote();
	this.__cancelSound();
	
	sound = this.__SOUNDS[sound];
	count = parseInt(count);
	motoring.buzzer = 0;
	this.__setNote(0);
	if(sound && count) {
		this.__runSound(sound, count);
		this.soundCallback = callback;
	} else {
		this.__runSound(0);
		callback();
	}
};

AlbertAi.prototype.setBuzzer = function(hz) {
	var motoring = this.motoring;
	this.__cancelNote();
	this.__cancelSound();
	
	hz = parseFloat(hz);
	if(typeof hz == 'number') {
		motoring.buzzer = hz;
	}
	this.__setNote(0);
	this.__runSound(0);
};

AlbertAi.prototype.changeBuzzer = function(hz) {
	var motoring = this.motoring;
	this.__cancelNote();
	this.__cancelSound();
	
	hz = parseFloat(hz);
	if(typeof hz == 'number') {
		motoring.buzzer += hz;
	}
	this.__setNote(0);
	this.__runSound(0);
};

AlbertAi.prototype.clearSound = function() {
	this.__cancelNote();
	this.__cancelSound();
	this.motoring.buzzer = 0;
	this.__setNote(0);
	this.__runSound(0);
};

AlbertAi.prototype.__NOTES = {
	'C': 4,
	'C♯ (D♭)': 5,
	'D': 6,
	'D♯ (E♭)': 7,
	'E': 8,
	'F': 9,
	'F♯ (G♭)': 10,
	'G': 11,
	'G♯ (A♭)': 12,
	'A': 13,
	'A♯ (B♭)': 14,
	'B': 15
};

AlbertAi.prototype.playNote = function(note, octave) {
	var motoring = this.motoring;
	this.__cancelNote();
	this.__cancelSound();
	
	note = this.__NOTES[note];
	octave = parseInt(octave);
	motoring.buzzer = 0;
	if(note && octave && octave > 0 && octave < 8) {
		note += (octave - 1) * 12;
		this.__setNote(note);
	} else {
		this.__setNote(0);
	}
	this.__runSound(0);
};

AlbertAi.prototype.playNoteBeat = function(note, octave, beat, callback) {
	var self = this;
	var motoring = self.motoring;
	self.__cancelNote();
	self.__cancelSound();
	
	note = this.__NOTES[note];
	octave = parseInt(octave);
	beat = parseFloat(beat);
	motoring.buzzer = 0;
	if(note && octave && octave > 0 && octave < 8 && beat && beat > 0 && self.tempo > 0) {
		var id = self.__issueNoteId();
		note += (octave - 1) * 12;
		self.__setNote(note);
		var timeout = beat * 60 * 1000 / self.tempo;
		var tail = (timeout > 100) ? 100 : 0;
		if(tail > 0) {
			self.noteTimer1 = setTimeout(function() {
				if(self.noteId == id) {
					self.__setNote(0);
					if(self.noteTimer1 !== undefined) self.__removeTimeout(self.noteTimer1);
					self.noteTimer1 = undefined;
				}
			}, timeout - tail);
			self.timeouts.push(self.noteTimer1);
		}
		self.noteTimer2 = setTimeout(function() {
			if(self.noteId == id) {
				self.__setNote(0);
				self.__cancelNote();
				callback();
			}
		}, timeout);
		self.timeouts.push(self.noteTimer2);
		self.__runSound(0);
	} else {
		self.__setNote(0);
		self.__runSound(0);
		callback();
	}
};

AlbertAi.prototype.restBeat = function(beat, callback) {
	var self = this;
	var motoring = self.motoring;
	self.__cancelNote();
	self.__cancelSound();
	
	beat = parseFloat(beat);
	motoring.buzzer = 0;
	self.__setNote(0);
	self.__runSound(0);
	if(beat && beat > 0 && self.tempo > 0) {
		var id = self.__issueNoteId();
		self.noteTimer1 = setTimeout(function() {
			if(self.noteId == id) {
				self.__cancelNote();
				callback();
			}
		}, beat * 60 * 1000 / self.tempo);
		self.timeouts.push(self.noteTimer1);
	} else {
		callback();
	}
};

AlbertAi.prototype.setTempo = function(bpm) {
	bpm = parseFloat(bpm);
	if(typeof bpm == 'number') {
		this.tempo = bpm;
		if(this.tempo < 1) this.tempo = 1;
	}
};

AlbertAi.prototype.changeTempo = function(bpm) {
	bpm = parseFloat(bpm);
	if(typeof bpm == 'number') {
		this.tempo += bpm;
		if(this.tempo < 1) this.tempo = 1;
	}
};

AlbertAi.prototype.getLeftProximity = function() {
	return this.sensory.leftProximity;
};

AlbertAi.prototype.getRightProximity = function() {
	return this.sensory.rightProximity;
};

AlbertAi.prototype.getAccelerationX = function() {
	return this.sensory.accelerationX;
};

AlbertAi.prototype.getAccelerationY = function() {
	return this.sensory.accelerationY;
};

AlbertAi.prototype.getAccelerationZ = function() {
	return this.sensory.accelerationZ;
};

AlbertAi.prototype.getMicTouch = function() {
	return this.sensory.micTouch;
};

AlbertAi.prototype.getVolumeUpTouch = function() {
	return this.sensory.volumeUpTouch;
};

AlbertAi.prototype.getVolumeDownTouch = function() {
	return this.sensory.volumeDownTouch;
};

AlbertAi.prototype.getPlayTouch = function() {
	return this.sensory.playTouch;
};

AlbertAi.prototype.getBackTouch = function() {
	return this.sensory.backTouch;
};

AlbertAi.prototype.getOidMode = function() {
	return this.sensory.oidMode;
};

AlbertAi.prototype.getOid = function() {
	return this.sensory.oid;
};

AlbertAi.prototype.getLift = function() {
	return this.sensory.lift;
};

AlbertAi.prototype.getPositionX = function() {
	return this.sensory.positionX;
};

AlbertAi.prototype.getPositionY = function() {
	return this.sensory.positionY;
};

AlbertAi.prototype.getOrientation = function() {
	return this.sensory.orientation;
};

AlbertAi.prototype.getLight = function() {
	return this.sensory.light;
};

AlbertAi.prototype.getSignalStrength = function() {
	return this.sensory.signalStrength;
};

AlbertAi.prototype.checkHandFound = function() {
	var sensory = this.sensory;
	return (sensory.handFound === undefined) ? (sensory.leftProximity > 40 || sensory.rightProximity > 40) : sensory.handFound;
};

AlbertAi.prototype.checkTouchState = function(sensor, event) {
	switch(sensor) {
		case 'mic':
			switch(event) {
				case 'clicked': return this.micClicked;
				case 'long-pressed (1.5 secs)': return this.micLongPressed;
				case 'long-long-pressed (3 secs)': return this.micLongLongPressed;
			}
			break;
		case 'volume up':
			switch(event) {
				case 'clicked': return this.volumeUpClicked;
				case 'long-pressed (1.5 secs)': return this.volumeUpLongPressed;
				case 'long-long-pressed (3 secs)': return this.volumeUpLongLongPressed;
			}
			break;
		case 'volume down':
			switch(event) {
				case 'clicked': return this.volumeDownClicked;
				case 'long-pressed (1.5 secs)': return this.volumeDownLongPressed;
				case 'long-long-pressed (3 secs)': return this.volumeDownLongLongPressed;
			}
			break;
		case 'play':
			switch(event) {
				case 'clicked': return this.playClicked;
				case 'long-pressed (1.5 secs)': return this.playLongPressed;
				case 'long-long-pressed (3 secs)': return this.playLongLongPressed;
			}
			break;
		case 'back':
			switch(event) {
				case 'clicked': return this.backClicked;
				case 'long-pressed (1.5 secs)': return this.backLongPressed;
				case 'long-long-pressed (3 secs)': return this.backLongLongPressed;
			}
			break;
	}
	return false;
};

AlbertAi.prototype.checkOid = function(value) {
	return this.sensory.oid == parseInt(value);
};

AlbertAi.prototype.checkTilt = function(tilt) {
	var sensory = this.sensory;
	switch(tilt) {
		case 'tilt forward': return sensory.tilt == 1;
		case 'tilt backward': return sensory.tilt == -1;
		case 'tilt left': return sensory.tilt == 2;
		case 'tilt right': return sensory.tilt == -2;
		case 'tilt flip': return sensory.tilt == 3;
		case 'not tilt': return sensory.tilt == -3;
		case 'tap': return this.tap;
		case 'lift': return sensory.lift == 1;
	}
	return false;
};

AlbertAi.prototype.__BATTERY_STATES = {
	'normal': 2,
	'low': 1,
	'empty': 0
};

AlbertAi.prototype.checkBattery = function(battery) {
	return this.sensory.batteryState == this.__BATTERY_STATES[battery];
};

const RoboidUtil = {
	toNumber: function(value, defaultValue) {
		if(defaultValue === undefined) defaultValue = 0;
		const n = Number(value);
		if(isNaN(n)) return defaultValue;
		return n;
	},
	toBoolean: function(value) {
		if(typeof value === 'boolean') {
			return value;
		}
		if(typeof value === 'string') {
			if((value === '') || (value === '0') || (value.toLowerCase() === 'false')) {
				return false;
			}
			return true;
		}
		return Boolean(value);
	},
	toString: function(value) {
		return String(value);
	},
	hexToRgb: function(hex) {
		const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	},
	decimalToRgb: function(decimal) {
		const a = (decimal >> 24) & 0xff;
		const r = (decimal >> 16) & 0xff;
		const g = (decimal >> 8) & 0xff;
		const b = decimal & 0xff;
		return {r: r, g: g, b: b, a: a > 0 ? a : 255};
	},
	toRgbArray: function(value) {
		let color;
		if(typeof value === 'string' && value.substring(0, 1) === '#') {
			color = RoboidUtil.hexToRgb(value);
		} else {
			color = RoboidUtil.decimalToRgb(RoboidUtil.toNumber(value));
		}
		return [color.r, color.g, color.b];
	}
};

class RoboidRunner {
	constructor(creators) {
		this.creators = creators;
		this.robots = {};
		this.robotsByGroup = {};
		this.robotsByModule = {};
		this.packet = {};
		this.retryId = undefined;
		this.alive = false;
		this.canSend = false;
	}
	
	addRobotByModule(module, key, robot) {
		let robots = this.robotsByModule[module];
		if(robots === undefined) {
			robots = this.robotsByModule[module] = {};
		}
		robots[key] = robot;
	}
	
	getOrCreateRobot(group, module, index) {
		const robots = this.robots;
		const key = module + index;
		let robot = robots[key];
		if(!robot) {
			const creator = this.creators[module];
			if(creator) {
				robot = creator(index);
			}
			if(robot) {
				robots[key] = robot;
				this.packet[key] = robot.motoring;
				this.addRobotByModule(module, key, robot);
			}
		}
		this.robotsByGroup[group + index] = robot;
		return robot;
	}
	
	getRobot(group, index) {
		return this.robotsByGroup[group + index];
	}
	
	clearMotorings() {
		const robots = this.robots;
		for(const i in robots) {
			robots[i].clearMotoring();
		}
	}
	
	afterTick() {
		const robots = this.robots;
		for(const i in robots) {
			robots[i].clearEvent();
		}
	}
	
	reset(module) {
		const robots = this.robotsByModule[module];
		if(robots) {
			for(const i in robots) {
				robots[i].reset();
			}
		}
	}
	
	open() {
		try {
			const self = this;
			const sock = new WebSocket('ws://localhost:56417');
			sock.binaryType = 'arraybuffer';
			self.socket = sock;
			sock.onmessage = function(message) {
				try {
					const received = JSON.parse(message.data);
					if(received.type == 0) {
					} else if(received.type == 2) {
						for(const module in received.modules) {
						}
					} else {
						if(received.index >= 0) {
							const robot = self.getOrCreateRobot(received.group, received.module, received.index);
							if(robot) {
								robot.clearEvent();
								robot.sensory = received;
								robot.handleSensory();
							}
						}
					}
				} catch (e) {
				}
			};
			sock.onclose = function() {
				self.alive = false;
				self.canSend = false;
				if(self.retryId === undefined) {
					self.retryId = setInterval(function() {
						if(self.alive) {
							if(self.retryId !== undefined) {
								clearInterval(self.retryId);
								self.retryId = undefined;
							}
						} else {
							self.open();
						}
					}, 2000);
				}
			};
			sock.onopen = function() {
				self.alive = true;
				
				let targetTime = Date.now();
				const run = function() {
					if(self.canSend && self.socket) {
						if(Date.now() > targetTime) {
							try {
								const json = JSON.stringify(self.packet);
								if(self.canSend && self.socket) self.socket.send(json);
								self.clearMotorings();
							} catch (e) {
							}
							targetTime += 20;
						}
						setTimeout(run, 5);
					}
				};
				self.canSend = true;
				run();
			};
			return true;
		} catch(e) {
		}
		return false;
	}
	
	close() {
		this.canSend = false;
		if(this.socket) {
			this.socket.close();
			this.socket = undefined;
		}
	}
}

class AlbertAiExtension {
	constructor(runtime) {
		this.runtime = runtime;
		if(runtime.roboidCreators === undefined) {
			runtime.roboidCreators = {};
		}
		runtime.roboidCreators['albertai'] = function(index) {
			return new AlbertAi(index);
		};
		if(runtime.roboidRunner === undefined) {
			runtime.roboidRunner = new RoboidRunner(runtime.roboidCreators);
			setTimeout(() => {
				runtime.roboidRunner.open();
			}, 1000);
		}
		runtime.registerPeripheralExtension('albertai', this);
		runtime.on('PROJECT_STOP_ALL', this.onStop.bind(this));
	}
	
	onStop() {
		if(this.runtime.roboidRunner) {
			this.runtime.roboidRunner.reset('albertai');
		}
	}
	
	getInfo() {
		return {
			id: 'albertai',
			name: '알버트 AI',
      color1: '#0FBD8C',
      color2: '#0DA57A',
			menuIconURI: Resource.iconURI,
			blockIconURI: Resource.iconURI,
			blocks: [
				{"opcode":"albertaiMoveForwardUnit","text":"앞으로 [VALUE][UNIT] 이동하기","blockType":"command","arguments":{"VALUE":{"type":"number","defaultValue":5},"UNIT":{"type":"string","menu":"move_unit","defaultValue":"cm"}},"func":"albertaiMoveForwardUnit","blockCategory":"motion"},
				{"opcode":"albertaiMoveBackwardUnit","text":"뒤로 [VALUE][UNIT] 이동하기","blockType":"command","arguments":{"VALUE":{"type":"number","defaultValue":5},"UNIT":{"type":"string","menu":"move_unit","defaultValue":"cm"}},"func":"albertaiMoveBackwardUnit","blockCategory":"motion"},
				{"opcode":"albertaiTurnUnitInPlace","text":"[DIRECTION]으로 [VALUE][UNIT] 제자리 돌기","blockType":"command","arguments":{"DIRECTION":{"type":"string","menu":"left_right","defaultValue":"left"},"VALUE":{"type":"number","defaultValue":90},"UNIT":{"type":"string","menu":"turn_unit","defaultValue":"degrees"}},"func":"albertaiTurnUnitInPlace","blockCategory":"motion"},
				{"opcode":"albertaiPivotAroundWheelUnitInDirection","text":"[WHEEL] 바퀴 중심으로 [VALUE][UNIT] [TOWARD] 방향으로 돌기","blockType":"command","arguments":{"WHEEL":{"type":"string","menu":"left_right","defaultValue":"left"},"VALUE":{"type":"number","defaultValue":90},"UNIT":{"type":"string","menu":"turn_unit","defaultValue":"degrees"},"TOWARD":{"type":"string","menu":"forward_backward","defaultValue":"forward"}},"func":"albertaiPivotAroundWheelUnitInDirection","blockCategory":"motion"},
				{"opcode":"albertaiChangeBothWheelsBy","text":"왼쪽 바퀴 [LEFT] 오른쪽 바퀴 [RIGHT]만큼 바꾸기","blockType":"command","arguments":{"LEFT":{"type":"number","defaultValue":10},"RIGHT":{"type":"number","defaultValue":10}},"func":"albertaiChangeBothWheelsBy","blockCategory":"motion"},
				{"opcode":"albertaiSetBothWheelsTo","text":"왼쪽 바퀴 [LEFT] 오른쪽 바퀴 [RIGHT](으)로 정하기","blockType":"command","arguments":{"LEFT":{"type":"number","defaultValue":50},"RIGHT":{"type":"number","defaultValue":50}},"func":"albertaiSetBothWheelsTo","blockCategory":"motion"},
				{"opcode":"albertaiChangeWheelBy","text":"[WHEEL] 바퀴 [VALUE]만큼 바꾸기","blockType":"command","arguments":{"WHEEL":{"type":"string","menu":"left_right_both","defaultValue":"left"},"VALUE":{"type":"number","defaultValue":10}},"func":"albertaiChangeWheelBy","blockCategory":"motion"},
				{"opcode":"albertaiSetWheelTo","text":"[WHEEL] 바퀴 [VALUE](으)로 정하기","blockType":"command","arguments":{"WHEEL":{"type":"string","menu":"left_right_both","defaultValue":"left"},"VALUE":{"type":"number","defaultValue":50}},"func":"albertaiSetWheelTo","blockCategory":"motion"},
				{"opcode":"albertaiStop","text":"정지하기","blockType":"command","func":"albertaiStop","blockCategory":"motion"},
				{"opcode":"albertaiMoveToOnBoard","text":"말판 [TOWARD] x: [X] y: [Y] 위치로 이동하기","blockType":"command","arguments":{"TOWARD":{"type":"string","menu":"move_forward_backward","defaultValue":"forward"},"X":{"type":"number","defaultValue":0},"Y":{"type":"number","defaultValue":0}},"func":"albertaiMoveToOnBoard","blockCategory":"motion"},
				{"opcode":"albertaiSetOrientationToOnBoard","text":"말판 [DEGREE]도 방향으로 돌기","blockType":"command","arguments":{"DEGREE":{"type":"number","defaultValue":0}},"func":"albertaiSetOrientationToOnBoard","blockCategory":"motion"},"---",
				{"opcode":"albertaiSetEyeTo","text":"[EYE] 눈을 [COLOR]으로 정하기","blockType":"command","arguments":{"EYE":{"type":"string","menu":"left_right_both","defaultValue":"left"},"COLOR":{"type":"string","menu":"led_color","defaultValue":"red"}},"func":"albertaiSetEyeTo","blockCategory":"looks"},
				{"opcode":"albertaiSetEyeToPicker","text":"[EYE] 눈을 [COLOR]로 정하기","blockType":"command","arguments":{"EYE":{"type":"string","menu":"left_right_both","defaultValue":"left"},"COLOR":{"type":"color","defaultValue":"#ff0000"}},"func":"albertaiSetEyeToPicker","blockCategory":"looks"},
				{"opcode":"albertaiChangeEyeByRGB","text":"[EYE] 눈을 R: [RED] G: [GREEN] B: [BLUE]만큼 바꾸기","blockType":"command","arguments":{"EYE":{"type":"string","menu":"left_right_both","defaultValue":"left"},"RED":{"type":"number","defaultValue":10},"GREEN":{"type":"number","defaultValue":0},"BLUE":{"type":"number","defaultValue":0}},"func":"albertaiChangeEyeByRGB","blockCategory":"looks"},
				{"opcode":"albertaiSetEyeToRGB","text":"[EYE] 눈을 R: [RED] G: [GREEN] B: [BLUE](으)로 정하기","blockType":"command","arguments":{"EYE":{"type":"string","menu":"left_right_both","defaultValue":"left"},"RED":{"type":"number","defaultValue":255},"GREEN":{"type":"number","defaultValue":0},"BLUE":{"type":"number","defaultValue":0}},"func":"albertaiSetEyeToRGB","blockCategory":"looks"},
				{"opcode":"albertaiClearEye","text":"[EYE] 눈 끄기","blockType":"command","arguments":{"EYE":{"type":"string","menu":"left_right_both","defaultValue":"left"}},"func":"albertaiClearEye","blockCategory":"looks"},"---",
				{"opcode":"albertaiPlaySoundTimes","text":"[SOUND] 소리 [REPEAT]번 재생하기","blockType":"command","arguments":{"SOUND":{"type":"string","menu":"albertai_sound","defaultValue":"beep"},"REPEAT":{"type":"number","defaultValue":1}},"func":"albertaiPlaySoundTimes","blockCategory":"sound"},
				{"opcode":"albertaiPlaySoundTimesUntilDone","text":"[SOUND] 소리 [REPEAT]번 재생하고 기다리기","blockType":"command","arguments":{"SOUND":{"type":"string","menu":"albertai_sound","defaultValue":"beep"},"REPEAT":{"type":"number","defaultValue":1}},"func":"albertaiPlaySoundTimesUntilDone","blockCategory":"sound"},
				{"opcode":"albertaiChangeBuzzerBy","text":"버저 음을 [HZ]만큼 바꾸기","blockType":"command","arguments":{"HZ":{"type":"number","defaultValue":10}},"func":"albertaiChangeBuzzerBy","blockCategory":"sound"},
				{"opcode":"albertaiSetBuzzerTo","text":"버저 음을 [HZ](으)로 정하기","blockType":"command","arguments":{"HZ":{"type":"number","defaultValue":1000}},"func":"albertaiSetBuzzerTo","blockCategory":"sound"},
				{"opcode":"albertaiClearSound","text":"소리 끄기","blockType":"command","func":"albertaiClearSound","blockCategory":"sound"},
				{"opcode":"albertaiPlayNote","text":"[NOTE][OCTAVE] 음을 연주하기","blockType":"command","arguments":{"NOTE":{"type":"string","menu":"note","defaultValue":"C"},"OCTAVE":{"type":"string","menu":"octave","defaultValue":"4"}},"func":"albertaiPlayNote","blockCategory":"sound"},
				{"opcode":"albertaiPlayNoteFor","text":"[NOTE][OCTAVE] 음을 [BEAT]박자 연주하기","blockType":"command","arguments":{"NOTE":{"type":"string","menu":"note","defaultValue":"C"},"OCTAVE":{"type":"string","menu":"octave","defaultValue":"4"},"BEAT":{"type":"number","defaultValue":0.5}},"func":"albertaiPlayNoteFor","blockCategory":"sound"},
				{"opcode":"albertaiRestFor","text":"[BEAT]박자 쉬기","blockType":"command","arguments":{"BEAT":{"type":"number","defaultValue":0.25}},"func":"albertaiRestFor","blockCategory":"sound"},
				{"opcode":"albertaiChangeTempoBy","text":"연주 속도를 [BPM]만큼 바꾸기","blockType":"command","arguments":{"BPM":{"type":"number","defaultValue":20}},"func":"albertaiChangeTempoBy","blockCategory":"sound"},
				{"opcode":"albertaiSetTempoTo","text":"연주 속도를 [BPM]BPM으로 정하기","blockType":"command","arguments":{"BPM":{"type":"number","defaultValue":60}},"func":"albertaiSetTempoTo","blockCategory":"sound"},"---",
				{"opcode":"albertaiLeftProximity","text":"왼쪽 근접 센서","blockType":"reporter","func":"albertaiLeftProximity","blockCategory":"sensing"},
				{"opcode":"albertaiRightProximity","text":"오른쪽 근접 센서","blockType":"reporter","func":"albertaiRightProximity","blockCategory":"sensing"},
				{"opcode":"albertaiAccelerationX","text":"x축 가속도","blockType":"reporter","func":"albertaiAccelerationX","blockCategory":"sensing"},
				{"opcode":"albertaiAccelerationY","text":"y축 가속도","blockType":"reporter","func":"albertaiAccelerationY","blockCategory":"sensing"},
				{"opcode":"albertaiAccelerationZ","text":"z축 가속도","blockType":"reporter","func":"albertaiAccelerationZ","blockCategory":"sensing"},
				{"opcode":"albertaiMicTouch","text":"마이크 터치","blockType":"reporter","func":"albertaiMicTouch","blockCategory":"sensing"},
				{"opcode":"albertaiVolumeUpTouch","text":"소리 크게 터치","blockType":"reporter","func":"albertaiVolumeUpTouch","blockCategory":"sensing"},
				{"opcode":"albertaiVolumeDownTouch","text":"소리 작게 터치","blockType":"reporter","func":"albertaiVolumeDownTouch","blockCategory":"sensing"},
				{"opcode":"albertaiPlayTouch","text":"실행 터치","blockType":"reporter","func":"albertaiPlayTouch","blockCategory":"sensing"},
				{"opcode":"albertaiBackTouch","text":"뒤로 터치","blockType":"reporter","func":"albertaiBackTouch","blockCategory":"sensing"},
				{"opcode":"albertaiOidMode","text":"OID 모드","blockType":"reporter","func":"albertaiOidMode","blockCategory":"sensing"},
				{"opcode":"albertaiOid","text":"OID","blockType":"reporter","func":"albertaiOid","blockCategory":"sensing"},
				{"opcode":"albertaiLift","text":"들어올림","blockType":"reporter","func":"albertaiLift","blockCategory":"sensing"},
				{"opcode":"albertaiPositionX","text":"x 위치","blockType":"reporter","func":"albertaiPositionX","blockCategory":"sensing"},
				{"opcode":"albertaiPositionY","text":"y 위치","blockType":"reporter","func":"albertaiPositionY","blockCategory":"sensing"},
				{"opcode":"albertaiOrientation","text":"방향","blockType":"reporter","func":"albertaiOrientation","blockCategory":"sensing"},
				{"opcode":"albertaiLight","text":"밝기","blockType":"reporter","func":"albertaiLight","blockCategory":"sensing"},
				{"opcode":"albertaiSignalStrength","text":"신호 세기","blockType":"reporter","func":"albertaiSignalStrength","blockCategory":"sensing"},
				{"opcode":"albertaiWhenHandFound","text":"손 찾았을 때","blockType":"hat","func":"albertaiWhenHandFound","blockCategory":"sensing"},
				{"opcode":"albertaiWhenTouchState","text":"[SENSOR] 터치 센서를 [EVENT] 때","blockType":"hat","arguments":{"SENSOR":{"type":"string","menu":"touch_sensor","defaultValue":"mic"},"EVENT":{"type":"string","menu":"when_touch_state","defaultValue":"clicked"}},"func":"albertaiWhenTouchState","blockCategory":"sensing"},
				{"opcode":"albertaiWhenOid","text":"OID가 [VALUE]일 때","blockType":"hat","arguments":{"VALUE":{"type":"number","defaultValue":0}},"func":"albertaiWhenOid","blockCategory":"sensing"},
				{"opcode":"albertaiWhenTilt","text":"[TILT] 때","blockType":"hat","arguments":{"TILT":{"type":"string","menu":"when_albertai_tilt","defaultValue":"tilt forward"}},"func":"albertaiWhenTilt","blockCategory":"sensing"},
				{"opcode":"albertaiHandFound","text":"손 찾음?","blockType":"Boolean","func":"albertaiHandFound","blockCategory":"sensing"},
				{"opcode":"albertaiTouchState","text":"[SENSOR] 터치 센서를 [EVENT]?","blockType":"Boolean","arguments":{"SENSOR":{"type":"string","menu":"touch_sensor","defaultValue":"mic"},"EVENT":{"type":"string","menu":"touch_state","defaultValue":"clicked"}},"func":"albertaiTouchState","blockCategory":"sensing"},
				{"opcode":"albertaiIsOid","text":"OID가 [VALUE]인가?","blockType":"Boolean","arguments":{"VALUE":{"type":"number","defaultValue":0}},"func":"albertaiIsOid","blockCategory":"sensing"},
				{"opcode":"albertaiTilt","text":"[TILT]?","blockType":"Boolean","arguments":{"TILT":{"type":"string","menu":"albertai_tilt","defaultValue":"tilt forward"}},"func":"albertaiTilt","blockCategory":"sensing"},
				{"opcode":"albertaiBattery","text":"배터리 [BATTERY]?","blockType":"Boolean","arguments":{"BATTERY":{"type":"string","menu":"battery","defaultValue":"normal"}},"func":"albertaiBattery","blockCategory":"sensing"}
			],
			menus: {
				"move_unit":[{"text":"cm","value":"cm"},{"text":"초","value":"seconds"},{"text":"펄스","value":"pulses"}],
				"turn_unit":[{"text":"도","value":"degrees"},{"text":"초","value":"seconds"},{"text":"펄스","value":"pulses"}],
				"cm_sec":[{"text":"cm","value":"cm"},{"text":"초","value":"seconds"}],
				"deg_sec":[{"text":"도","value":"degrees"},{"text":"초","value":"seconds"}],
				"left_right":[{"text":"왼쪽","value":"left"},{"text":"오른쪽","value":"right"}],
				"left_right_both":[{"text":"왼쪽","value":"left"},{"text":"오른쪽","value":"right"},{"text":"양쪽","value":"both"}],
				"forward_backward":[{"text":"앞쪽","value":"forward"},{"text":"뒤쪽","value":"backward"}],
				"move_forward_backward":[{"text":"앞으로","value":"forward"},{"text":"뒤로","value":"backward"}],
				"led_color":[{"text":"빨간색","value":"red"},{"text":"주황색","value":"orange"},{"text":"노란색","value":"yellow"},{"text":"초록색","value":"green"},{"text":"하늘색","value":"sky blue"},{"text":"파란색","value":"blue"},{"text":"보라색","value":"violet"},{"text":"자주색","value":"purple"},{"text":"하얀색","value":"white"}],
				"albertai_sound":[{"text":"삐","value":"beep"},{"text":"무작위 삐","value":"random beep"},{"text":"지지직","value":"noise"},{"text":"사이렌","value":"siren"},{"text":"엔진","value":"engine"},{"text":"로봇","value":"robot"}],
				"note":[{"text":"도","value":"C"},{"text":"도♯ (레♭)","value":"C♯ (D♭)"},{"text":"레","value":"D"},{"text":"레♯ (미♭)","value":"D♯ (E♭)"},{"text":"미","value":"E"},{"text":"파","value":"F"},{"text":"파♯ (솔♭)","value":"F♯ (G♭)"},{"text":"솔","value":"G"},{"text":"솔♯ (라♭)","value":"G♯ (A♭)"},{"text":"라","value":"A"},{"text":"라♯ (시♭)","value":"A♯ (B♭)"},{"text":"시","value":"B"}],
				"octave":[{"text":"1","value":"1"},{"text":"2","value":"2"},{"text":"3","value":"3"},{"text":"4","value":"4"},{"text":"5","value":"5"},{"text":"6","value":"6"},{"text":"7","value":"7"}],
				"touch_sensor":[{"text":"마이크","value":"mic"},{"text":"소리 크게","value":"volume up"},{"text":"소리 작게","value":"volume down"},{"text":"실행","value":"play"},{"text":"뒤로","value":"back"}],
				"when_touch_state":[{"text":"클릭했을","value":"clicked"},{"text":"오래 눌렀을(1.5초)","value":"long-pressed (1.5 secs)"},{"text":"아주 오래 눌렀을(3초)","value":"long-long-pressed (3 secs)"}],
				"when_albertai_tilt":[{"text":"앞으로 기울였을","value":"tilt forward"},{"text":"뒤로 기울였을","value":"tilt backward"},{"text":"왼쪽으로 기울였을","value":"tilt left"},{"text":"오른쪽으로 기울였을","value":"tilt right"},{"text":"거꾸로 뒤집었을","value":"tilt flip"},{"text":"기울이지 않았을","value":"not tilt"},{"text":"두드렸을","value":"tap"},{"text":"들어올렸을","value":"lift"}],
				"touch_state":[{"text":"클릭했는가","value":"clicked"},{"text":"오래 눌렀는가(1.5초)","value":"long-pressed (1.5 secs)"},{"text":"아주 오래 눌렀는가(3초)","value":"long-long-pressed (3 secs)"}],
				"albertai_tilt":[{"text":"앞으로 기울임","value":"tilt forward"},{"text":"뒤로 기울임","value":"tilt backward"},{"text":"왼쪽으로 기울임","value":"tilt left"},{"text":"오른쪽으로 기울임","value":"tilt right"},{"text":"거꾸로 뒤집음","value":"tilt flip"},{"text":"기울이지 않음","value":"not tilt"},{"text":"두드림","value":"tap"},{"text":"들어올림","value":"lift"}],
				"battery":[{"text":"정상","value":"normal"},{"text":"부족","value":"low"},{"text":"없음","value":"empty"}]
			}
		};
	}
	
	getRobot(args) {
		if(args.INDEX === undefined) {
			if(this.runtime.roboidRunner) {
				return this.runtime.roboidRunner.getRobot('albertai', 0);
			}
		} else {
			const index = RoboidUtil.toNumber(args.INDEX, -1);
			if(index >= 0 && this.runtime.roboidRunner) {
				return this.runtime.roboidRunner.getRobot('albertai', index);
			}
		}
	}
	
	albertaiMoveForwardUnit(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.moveForwardUnit(args.VALUE, args.UNIT, resolve);
		});
	}
	
	albertaiMoveBackwardUnit(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.moveBackwardUnit(args.VALUE, args.UNIT, resolve);
		});
	}
	
	albertaiTurnUnitInPlace(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.turnUnit(args.DIRECTION, args.VALUE, args.UNIT, resolve);
		});
	}
	
	albertaiPivotAroundWheelUnitInDirection(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.pivotUnit(args.WHEEL, args.VALUE, args.UNIT, args.TOWARD, resolve);
		});
	}
	
	albertaiChangeBothWheelsBy(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeWheels(args.LEFT, args.RIGHT);
	}
	
	albertaiSetBothWheelsTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setWheels(args.LEFT, args.RIGHT);
	}
	
	albertaiChangeWheelBy(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeWheel(args.WHEEL, args.VALUE);
	}
	
	albertaiSetWheelTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setWheel(args.WHEEL, args.VALUE);
	}
	
	albertaiStop(args) {
		const robot = this.getRobot(args);
		if(robot) robot.stop();
	}
	
	albertaiMoveToOnBoard(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.moveToOnBoard(args.TOWARD, args.X, args.Y, resolve);
		});
	}
	
	albertaiSetOrientationToOnBoard(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.setOrientationToOnBoard(args.DEGREE, resolve);
		});
	}
	
	albertaiSetEyeTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setEyeColor(args.EYE, args.COLOR);
	}
	
	albertaiSetEyeToPicker(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setRgbArray(args.EYE, RoboidUtil.toRgbArray(args.COLOR));
	}
	
	albertaiChangeEyeByRGB(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeRgb(args.EYE, args.RED, args.GREEN, args.BLUE);
	}
	
	albertaiSetEyeToRGB(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setRgb(args.EYE, args.RED, args.GREEN, args.BLUE);
	}
	
	albertaiClearEye(args) {
		const robot = this.getRobot(args);
		if(robot) robot.clearEye(args.EYE);
	}
	
	albertaiPlaySound(args) {
		const robot = this.getRobot(args);
		if(robot) robot.playSound(args.SOUND, 1);
	}
	
	albertaiPlaySoundTimes(args) {
		const robot = this.getRobot(args);
		if(robot) robot.playSound(args.SOUND, args.REPEAT);
	}
	
	albertaiPlaySoundTimesUntilDone(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.playSoundUntil(args.SOUND, args.REPEAT, resolve);
		});
	}
	
	albertaiChangeBuzzerBy(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeBuzzer(args.HZ);
	}
	
	albertaiSetBuzzerTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setBuzzer(args.HZ);
	}
	
	albertaiClearSound(args) {
		const robot = this.getRobot(args);
		if(robot) robot.clearSound();
	}
	
	albertaiPlayNote(args) {
		const robot = this.getRobot(args);
		if(robot) robot.playNote(args.NOTE, args.OCTAVE);
	}
	
	albertaiPlayNoteFor(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.playNoteBeat(args.NOTE, args.OCTAVE, args.BEAT, resolve);
		});
	}
	
	albertaiRestFor(args) {
		return new Promise(resolve => {
			const robot = this.getRobot(args);
			if(robot) robot.restBeat(args.BEAT, resolve);
		});
	}
	
	albertaiChangeTempoBy(args) {
		const robot = this.getRobot(args);
		if(robot) robot.changeTempo(args.BPM);
	}
	
	albertaiSetTempoTo(args) {
		const robot = this.getRobot(args);
		if(robot) robot.setTempo(args.BPM);
	}
	
	albertaiLeftProximity(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getLeftProximity() : 0;
	}
	
	albertaiRightProximity(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getRightProximity() : 0;
	}
	
	albertaiAccelerationX(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getAccelerationX() : 0;
	}
	
	albertaiAccelerationY(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getAccelerationY() : 0;
	}
	
	albertaiAccelerationZ(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getAccelerationZ() : 0;
	}
	
	albertaiMicTouch(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getMicTouch() : 0;
	}
	
	albertaiVolumeUpTouch(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getVolumeUpTouch() : 0;
	}
	
	albertaiVolumeDownTouch(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getVolumeDownTouch() : 0;
	}
	
	albertaiPlayTouch(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getPlayTouch() : 0;
	}
	
	albertaiBackTouch(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getBackTouch() : 0;
	}
	
	albertaiOidMode(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getOidMode() : 0;
	}
	
	albertaiOid(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getOid() : -1;
	}
	
	albertaiLift(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getLift() : 0;
	}
	
	albertaiPositionX(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getPositionX() : -1;
	}
	
	albertaiPositionY(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getPositionY() : -1;
	}
	
	albertaiOrientation(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getOrientation() : -200;
	}
	
	albertaiLight(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getLight() : 0;
	}
	
	albertaiSignalStrength(args) {
		const robot = this.getRobot(args);
		return robot ? robot.getSignalStrength() : 0;
	}
	
	albertaiWhenHandFound(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkHandFound() : false;
	}
	
	albertaiWhenTouchState(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkTouchState(args.SENSOR, args.EVENT) : false;
	}
	
	albertaiWhenOid(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkOid(args.VALUE) : false;
	}
	
	albertaiWhenTilt(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkTilt(args.TILT) : false;
	}
	
	albertaiHandFound(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkHandFound() : false;
	}
	
	albertaiTouchState(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkTouchState(args.SENSOR, args.EVENT) : false;
	}
	
	albertaiIsOid(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkOid(args.VALUE) : false;
	}
	
	albertaiTilt(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkTilt(args.TILT) : false;
	}
	
	albertaiBattery(args) {
		const robot = this.getRobot(args);
		return robot ? robot.checkBattery(args.BATTERY) : false;
	}
}

if(!Date.now) {
	Date.now = function() {
		return new Date().getTime();
	};
}

module.exports = AlbertAiExtension;
