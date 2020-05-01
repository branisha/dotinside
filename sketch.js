let dotList = new Array();
let lineList = new Array();
let gridList = new Array();
let origin_vector = new p5.Vector(0, 0);


let canvas_dot_size = 10; // px
let compare_dot_size = 10; // px

let line_weight = 1; // px

let canvas_dot_color = "blue";

let mouse_dot_tolerane = 10; // if same dot tolerance; in px
let line_angle_tolerance = 0.1; // from 0.0 to 1.0;

// -1 for easy checking in draw loop
let compare_dot_vector = new p5.Vector(-1, 0);

// extension for quadrant number
p5.Vector.prototype.getQuadrant = function () {

    // tweaked  to match the picture
    // original origin extends from 0,0 in upper left corner
    // to max_width, max_height at bottom right corner
    if (this.x >= 0 && this.y >= 0) {
        return 4;
    }
    if (this.x >= 0 && this.y < 0) {
        return 1;
    }
    if (this.x < 0 && this.y >= 0) {
        return 3;
    }
    if (this.x < 0 && this.y < 0) {
        return 2;
    }
}
// extension for equasion
p5.Vector.prototype.getD = function (v2) {
    return (this.x * v2.y - v2.x * this.y) * (this.y - v2.y);
}

class CanvasDot extends p5.Vector {
    constructor(x, y, z = 0, color = "red") {
        super(x, y, z);
        this.__color = color;
    }

    get canvas_color() {
        return this.__color;
    }
    set canvas_color(color) {
        this.__color = color;
    }

    // deep copy
    copy() {
        return new CanvasDot(this.x, this.y, this.z, this.canvas_color);
    }
}



class CanvasLine {
    constructor(v1, v2, color = "blue") {
        this.__v1 = v1;
        this.__v2 = v2;
        this.__color = color;
    }

    get v1() {
        return this.__v1;
    }

    get v2() {
        return this.__v2;
    }
    set v1(_v1) {
        this.__v1 = _v1;
    }

    set v2(_v2) {
        this.__v2 = _v2;
    }

    get canvas_color() {
        return this.__color;
    }
    set canvas_color(color) {
        this.__color = color;
    }

    // deep copy
    copy() {
        return new CanvasLine(this.v1.copy(), this.v2.copy(), this.canvas_color);
    }
}

function isSwap() {
    let elms = document.getElementsByName("swap");
    let sel = elms[0];
    for (let i = 0; i < elms.length; i++) {
        if (elms[i].checked) {
            sel = elms[i];
            break;
        }
    }
    return sel.value == "1";
}

function resetDots() {
    dotList.forEach(d => {
        d.canvas_color = "red";
    });
}

function resetLines() {
    lineList.forEach(l => {
        l.canvas_color = "blue";
    });
}


let dot_tolerance_range = document.getElementById("dot_tolerance");
let dot_tolerance_value = document.getElementById("dot_tolerance_value");

let angle_tolerance_range = document.getElementById("line_tolerance");
let angle_tolerance_value = document.getElementById("line_tolerance_value");

let line_weight_range = document.getElementById("line_weight");
let line_weight_value = document.getElementById("line_weight_value");

let dot_weight_range = document.getElementById("dot_weight");
let dot_weight_value = document.getElementById("dot_weight_value");


let DEBUG_MODE = false;

function setStatusString(message){
    document.getElementById("status_span").textContent = message;
}

let sketch = function (p) {
    p.setup = function () {
        p.createCanvas(1024, 640);
    }

    p.draw = function () {
        
        // GUI SETUP //
        
        dot_tolerance_value.textContent = dot_tolerance_range.value.padStart(3, ' ');
        angle_tolerance_value.textContent = angle_tolerance_range.value.padStart(3, ' ');
        line_weight_value.textContent = line_weight_range.value.padStart(3, ' ');
        dot_weight_value.textContent = dot_weight_range.value.padStart(3, ' ');


        mouse_dot_tolerane = parseInt(dot_tolerance_range.value);
        canvas_dot_size = parseInt(dot_weight_range.value);
        line_weight = parseInt(line_weight_range.value);
        // first convert to precentage based
        let angle_deg = parseInt(angle_tolerance_range.value) / 180;
        // convert to rad
        line_angle_tolerance = p.PI * angle_deg;

        DEBUG_MODE = document.getElementById("debug_on").checked;

        // GUI END //

        // CANVAS START //

        p.background(220, 220, 220);


        lineList.forEach(__line => {
            p.push();
            p.stroke(__line.canvas_color);
            p.strokeWeight(line_weight);
            p.fill(__line.canvas_color);
            p.line(__line.v1.x, __line.v1.y, __line.v2.x, __line.v2.y);
            p.pop();
        });
        if(DEBUG_MODE == true){

            gridList.forEach(__line => {
                p.push();
                p.stroke(__line.canvas_color);
                p.strokeWeight(line_weight);
                p.fill(__line.canvas_color);
                p.line(__line.v1.x, __line.v1.y, __line.v2.x, __line.v2.y);
                p.pop();
            });
        }

        dotList.forEach(dot => {
            p.push();
            p.stroke("black");
            p.fill(dot.canvas_color);
            p.ellipse(dot.x, dot.y, canvas_dot_size, canvas_dot_size);
            p.pop();
        });

        if (compare_dot_vector.x > -1) {
            p.push();
            p.stroke("magenta");
            p.strokeWeight(line_weight);
            p.fill(0, 0, 0, 0);
            p.ellipse(compare_dot_vector.x, compare_dot_vector.y, canvas_dot_size, canvas_dot_size);
            p.pop();
        }
    }

    p.checkMouseBound = function () {
        let _mouse_x = p.mouseX >= 0 && p.mouseX <= p.width;
        let _mouse_y = p.mouseY >= 0 && p.mouseY <= p.height;
        return _mouse_x && _mouse_y;
    }

    p.mouseClicked = function () {
        if (p.checkMouseBound() != true) {
            return true;
        }




        if (isSwap()) {
            // INIT
            compare_dot_vector.x = p.mouseX;
            compare_dot_vector.y = p.mouseY;


            gridList = [];

            let flag_done = false;

            resetDots();
            resetLines();

            origin_vector.set(x = p.mouseX, y = p.mouseY, z = 0);

            let v1 = new CanvasDot(0, p.mouseY);
            let v2 = new CanvasDot(p.width, p.mouseY);

            let v3 = new CanvasDot(p.mouseX, 0);
            let v4 = new CanvasDot(p.mouseX, p.height);

            gridList.push(new CanvasLine(v1, v2, "green"));
            gridList.push(new CanvasLine(v3, v4, "yellow"));

            // control line
            let c_1 = new CanvasDot(p.mouseX, p.mouseY);
            let c_2 = new CanvasDot(0, p.mouseY);
            gridList.push(new CanvasLine(c_1, c_2, "cyan"));



            // transform vectors
            let total_d = 0;
            let transformedLines = new Array();

            lineList.forEach(__line => {

                if (flag_done == true) {
                    return;
                }

                let line_copy = __line.copy();
                line_copy.v1.sub(origin_vector);
                line_copy.v2.sub(origin_vector);
                transformedLines.push(line_copy);


                // algorithm start

                // same dot
                let delta_x = Math.abs(p.mouseX - __line.v1.x);
                let delta_y = Math.abs(p.mouseY - __line.v1.y);

                if (delta_x <= mouse_dot_tolerane &&
                    delta_y <= mouse_dot_tolerane) {
                    resetDots();
                    flag_done = true;
                    setStatusString("Na točki");
                    __line.v1.canvas_color = "Orange";

                    return;
                }

                delta_x = Math.abs(p.mouseX - __line.v2.x);
                delta_y = Math.abs(p.mouseY - __line.v2.y);

                if (delta_x <= mouse_dot_tolerane &&
                    delta_y <= mouse_dot_tolerane) {
                    resetDots();
                    flag_done = true;
                    setStatusString("Na točki");
                    __line.v2.canvas_color = "Orange";
                    return;
                }

                // case on line

                let new_v1 = p5.Vector.sub(__line.v1, __line.v2);
                let new_v2 = p5.Vector.sub(compare_dot_vector, __line.v2);



                // first, they need to be in same direction,
                // and magntude of new vector shouldn't be greater 
                // then magnitutde of the original

                if (new_v1.dot(new_v2) > 0 && new_v1.magSq() > new_v2.magSq()) {
                    // now we check angles

                    let ang = new_v1.angleBetween(new_v2);

                    let new2_v1 = p5.Vector.sub(__line.v2, __line.v1);
                    let new2_v2 = p5.Vector.sub(compare_dot_vector, __line.v1);
    
                    let ang2 = new2_v1.angleBetween(new2_v2);


                    if (Math.abs(ang) < line_angle_tolerance && Math.abs(ang2) < line_angle_tolerance) {
                        __line.canvas_color = "yellow";
                        setStatusString("Na liniji");
                        flag_done = true;
                        return;
                    }
                }

                // quadrants
                const q_v1 = line_copy.v1.getQuadrant();
                const q_v2 = line_copy.v2.getQuadrant();

                // case 1
                if (q_v1 == 2 && q_v2 == 3 ||
                    q_v1 == 3 && q_v2 == 2) {
                    if(DEBUG_MODE == true){
                        __line.v1.canvas_color = "purple";
                        __line.v2.canvas_color = "purple";
                    }
                    total_d++;
                    return;
                }
                // case 2
                if (q_v1 == 1 && q_v2 == 3 || q_v2 == 1 && q_v1 == 3) {
                    if (line_copy.v1.getD(line_copy.v2) > 0) {
                        if(DEBUG_MODE == true){
                            __line.v1.canvas_color = "yellow";
                            __line.v2.canvas_color = "yellow";
                        }
                        total_d++;
                        return;
                    }
                }
                // case 3
                if (q_v1 == 2 && q_v2 == 4 || q_v1 == 4 && q_v2 == 2) {
                    if (line_copy.v1.getD(line_copy.v2) > 0) {
                        if(DEBUG_MODE == true){
                            __line.v1.canvas_color = "cyan";
                            __line.v2.canvas_color = "cyan";
                        }
                        total_d++;
                        return;
                    }
                }

            });


            if (flag_done == false) {

                if (total_d % 2 == 0) {
                    setStatusString("Zunaj");
                }
                else {
                    setStatusString("Znotraj");
                }

            }

        }
        else {

            compare_dot_vector.x = -1;

            dotList.push(new CanvasDot(p.mouseX, p.mouseY));

            // last line will always be last->first
            // thats why we pop it and update it
            let last_line = lineList.length > 0 ? lineList.pop() : new CanvasLine(dotList[0], 0);

            if (dotList.length > 1) {
                let __line = new CanvasLine(dotList[dotList.length - 2], dotList[dotList.length - 1]);
                lineList.push(__line);
                // v1 will always be 1. dot
                last_line.v2 = dotList[dotList.length - 1];
                lineList.push(last_line);
            }
        }

    }
}


new p5(sketch, "canvas_container");