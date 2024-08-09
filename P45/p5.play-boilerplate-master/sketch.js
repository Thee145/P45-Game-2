let engine, world, render, paddle, ball;
let bricks = [];
const paddleSpeed = 5;
const canvasWidth = 800;
const canvasHeight = 600;
let leftKeyPressed = false;
let rightKeyPressed = false;

function setup() {
    engine = Matter.Engine.create();
    world = engine.world;
    engine.world.gravity.y = 0;

    const canvas = document.getElementById('gameCanvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    render = Matter.Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: canvasWidth,
            height: canvasHeight,
            wireframes: false,
            background: '#333',
        },
    });
    Matter.Render.run(render);

    createPaddle();
    createBall();
    createBricks();

    Matter.Engine.run(engine);
    setupControls();
    setupCollisions();
    Matter.Events.on(engine, 'beforeUpdate', updatePaddle);
}

function createPaddle() {
    paddle = Matter.Bodies.rectangle(canvasWidth / 2, canvasHeight - 50, 120, 20, {
        isStatic: true,
        render: { fillStyle: '#FFF' }
    });
    Matter.World.add(world, paddle);
}

function createBall() {
    ball = Matter.Bodies.circle(canvasWidth / 2, canvasHeight - 80, 10, {
        restitution: 1,
        friction: 0,
        frictionAir: 0,
        render: { fillStyle: '#FF0' }
    });
    Matter.World.add(world, ball);
    Matter.Body.setVelocity(ball, { x: 2, y: 5 });
}

function createBricks() {
    const rows = 5;
    const cols = 10;
    const brickWidth = 70;
    const brickHeight = 20;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const brick = Matter.Bodies.rectangle(
                75 + col * (brickWidth + 10),
                50 + row * (brickHeight + 10),
                brickWidth,
                brickHeight,
                {
                    isStatic: true,
                    render: { fillStyle: '#F00' }
                }
            );
            brick.row = row + 1;
            bricks.push(brick);
        }
    }
    Matter.World.add(world, bricks);
}

function setupControls() {
    document.addEventListener('keydown', function (event) {
        if (event.code === 'ArrowLeft') {
            leftKeyPressed = true;
        } else if (event.code === 'ArrowRight') {
            rightKeyPressed = true;
        }
    });

    document.addEventListener('keyup', function (event) {
        if (event.code === 'ArrowLeft') {
            leftKeyPressed = false;
        } else if (event.code === 'ArrowRight') {
            rightKeyPressed = false;
        }
    });
}

function updatePaddle() {
    if (leftKeyPressed) {
        if (paddle.position.x - paddleSpeed > paddle.bounds.min.x) {
            Matter.Body.setPosition(paddle, { x: paddle.position.x - paddleSpeed, y: paddle.position.y });
        }
    } else if (rightKeyPressed) {
        if (paddle.position.x + paddleSpeed < canvasWidth - (paddle.bounds.max.x - paddle.position.x)) {
            Matter.Body.setPosition(paddle, { x: paddle.position.x + paddleSpeed, y: paddle.position.y });
        }
    }
}

function setupCollisions() {
    Matter.Events.on(engine, 'beforeUpdate', function () {
        if (ball.position.x - ball.circleRadius <= 0 || ball.position.x + ball.circleRadius >= canvasWidth) {
            Matter.Body.setVelocity(ball, { x: -ball.velocity.x, y: ball.velocity.y });
        }
        if (ball.position.y - ball.circleRadius <= 0) {
            Matter.Body.setVelocity(ball, { x: ball.velocity.x, y: -ball.velocity.y });
        }
        if (ball.position.y + ball.circleRadius >= canvasHeight) {
            resetGame();
        }
    });

    Matter.Events.on(engine, 'collisionStart', function (event) {
        const pairs = event.pairs;
        pairs.forEach(pair => {
            if (pair.bodyA === paddle || pair.bodyB === paddle) {
                const ballVelocity = ball.velocity;
                const offset = ball.position.x - paddle.position.x;
                const angle = (offset / (paddle.bounds.max.x - paddle.bounds.min.x)) * Math.PI / 4;
                const newVelocityX = 5 * Math.sin(angle);
                const newVelocityY = -Math.abs(ballVelocity.y);
                Matter.Body.setVelocity(ball, { x: newVelocityX, y: newVelocityY });
            } else if (bricks.includes(pair.bodyA) || bricks.includes(pair.bodyB)) {
                const brick = bricks.includes(pair.bodyA) ? pair.bodyA : pair.bodyB;
                Matter.World.remove(world, brick);
                bricks = bricks.filter(b => b !== brick);
                adjustBallSpeed(brick.row);
            }
        });
    });
}

function adjustBallSpeed(row) {
    let speedMultiplier = 1;
    if (row === 2) {
        speedMultiplier = 1.2;
    } else if (row === 3) {
        speedMultiplier = 1.4;
    }
    const currentVelocity = ball.velocity;
    const newVelocity = {
        x: currentVelocity.x * speedMultiplier,
        y: currentVelocity.y * speedMultiplier
    };
    Matter.Body.setVelocity(ball, newVelocity);
}

function resetGame() {
    Matter.Body.setPosition(ball, { x: paddle.position.x, y: paddle.position.y - 30 });
    Matter.Body.setVelocity(ball, { x: 2, y: -5 });
}

setup();