
// ==========================================
// VINYL — MUSIC PLAYER
// ==========================================


// 1. VARIABLES

let video;
let canvas;
let ;

let latestPose = null;

let songs = [];
let currentSong = 0;

let isPlaying = false;
let gestureMode = false;

let volume = 0.7;

// PoseNet keypoint indexes
const LEFT_WRIST = 9;
const RIGHT_WRIST = 10;

// Wrist movement tracking
let previousLeftY = null;
let previousRightY = null;

let lastTrackChange = 0;
let lastVolumeUpdate = 0;

// Gesture sensitivity
const VOLUME_THRESHOLD = 8;
const TRACK_THRESHOLD = 15;

const VOLUME_COOLDOWN = 100;
const TRACK_COOLDOWN = 1000;


// ==========================================
// 2. LOAD AUDIO FILES
// ==========================================

function preload() {

    songs[0] = loadSound("Ghungroo - War.mp3");
    songs[1] = loadSound("Butter.mp3");

}


// ==========================================
// 3. INITIALIZE APPLICATION
// ==========================================

function setup() {

    canvas = createCanvas(480, 360);
    canvas.parent("cameraFeed");

    video = createCapture(VIDEO);

    video.size(480, 360);
    video.hide();


    // MUSIC BUTTONS

    document.getElementById("playBtn")
        .addEventListener("click", togglePlayback);

    document.getElementById("nextBtn")
        .addEventListener("click", nextSong);

    document.getElementById("previousBtn")
        .addEventListener("click", previousSong);

    document.getElementById("volumeSlider")
        .addEventListener("input", changeVolume);


    // GESTURE MODE BUTTON

    document.getElementById("gestureToggleBtn")
        .addEventListener("click", toggleGestureMode);


    updateTrackInfo();

    updateVolume();

}


// ==========================================
// 4. DRAW WEBCAM
// ==========================================

function draw() {

    background(0);

    if (video) {
        image(video, 0, 0, width, height);
    }

}


// ==========================================
// 5. MODEL LOADED
// ==========================================

function modelLoaded() {

    console.log("PoseNet is ready!");

    document.getElementById("cameraState").textContent =
        gestureMode ? "TRACKING YOUR WRISTS" : "MODEL READY";

}


// ==========================================
// 6. RECEIVE POSE DETECTION
// ==========================================


// temp removed
// function gotPoses(results) {

//     if (results.length === 0) {

//         latestPose = null;

//         previousLeftY = null;
//         previousRightY = null;

//         return;

//     }

//     latestPose = results[0].pose;

//     if (gestureMode) {

//         processWristControls();

//     }

// }
//temp

let poseLogCounter = 0;

function gotPoses(results) {
    if (results.length === 0) {
        latestPose = null;
        return;
    }

    latestPose = results[0].pose;

    poseLogCounter++;

    if (poseLogCounter % 15 === 0) {
        const left = latestPose.keypoints[9];
        const right = latestPose.keypoints[10];

        console.log("Left wrist score:", left.score);
        console.log("Right wrist score:", right.score);
    }

    if (gestureMode) {
        processWristControls();
    }
}
// ==========================================
// 7. GET BODY KEYPOINT
// ==========================================

function getPoint(index) {

    if (!latestPose || !latestPose.keypoints) {
        return null;
    }

    const point = latestPose.keypoints[index];

    if (!point || point.score < 0.2) {
        return null;
    }

    return point.position;

}


// ==========================================
// 8. TOGGLE GESTURE MODE
// ==========================================

function toggleGestureMode() {

    gestureMode = !gestureMode;

    const cameraPanel =
        document.getElementById("cameraPanel");

    const placeholder =
        document.getElementById("cameraPlaceholder");

    const status =
        document.getElementById("gestureStatus");

    const gestureText =
        document.getElementById("gestureText");

    const cameraState =
        document.getElementById("cameraState");

    const toggleButton =
        document.getElementById("gestureToggleBtn");


    if (gestureMode) {

        cameraPanel.classList.add("active");
        placeholder.classList.add("hidden");
        status.classList.add("active");
        toggleButton.classList.add("active");

        gestureText.textContent = "GESTURE MODE ACTIVE";
        toggleButton.textContent = "DISABLE GESTURE MODE";

        cameraState.textContent = "TRACKING YOUR WRISTS";

    }

    else {

        cameraPanel.classList.remove("active");
        placeholder.classList.remove("hidden");
        status.classList.remove("active");
        toggleButton.classList.remove("active");

        gestureText.textContent = "GESTURE MODE OFF";
        toggleButton.textContent = "ENABLE GESTURE MODE";

        cameraState.textContent = "WAITING FOR GESTURE";

    }


    // Reset previous wrist positions

    previousLeftY = null;
    previousRightY = null;

}


// ==========================================
// 9. WRIST MUSIC CONTROLS
// ==========================================

function processWristControls() {

    const leftWrist = getPoint(LEFT_WRIST);
    const rightWrist = getPoint(RIGHT_WRIST);


    // --------------------------------------
    // LEFT WRIST = VOLUME CONTROL
    // --------------------------------------

    if (leftWrist) {

        if (previousLeftY !== null) {

            const movement = previousLeftY - leftWrist.y;

            if (millis() - lastVolumeUpdate > VOLUME_COOLDOWN) {

                // Wrist moves UP
                if (movement > VOLUME_THRESHOLD) {

                    volume = Math.min(1, volume + 0.02);

                    updateVolume();

                    lastVolumeUpdate = millis();

                }

                // Wrist moves DOWN
                else if (movement < -VOLUME_THRESHOLD) {

                    volume = Math.max(0, volume - 0.02);

                    updateVolume();

                    lastVolumeUpdate = millis();

                }

            }

        }

        previousLeftY = leftWrist.y;

    }

    else {

        previousLeftY = null;

    }


    // --------------------------------------
    // RIGHT WRIST = SONG CONTROL
    // --------------------------------------

    if (rightWrist) {

        if (previousRightY !== null) {

            const movement = previousRightY - rightWrist.y;

            if (millis() - lastTrackChange > TRACK_COOLDOWN) {

                // Wrist moves UP = NEXT SONG
                if (movement > TRACK_THRESHOLD) {

                    nextSong();

                    lastTrackChange = millis();

                }

                // Wrist moves DOWN = PREVIOUS SONG
                else if (movement < -TRACK_THRESHOLD) {

                    previousSong();

                    lastTrackChange = millis();

                }

            }

        }

        previousRightY = rightWrist.y;

    }

    else {

        previousRightY = null;

    }

}


// ==========================================
// 10. PLAY / PAUSE
// ==========================================

function togglePlayback() {

    const playButton =
        document.getElementById("playBtn");

    const vinyl =
        document.getElementById("vinyl");

    const tonearm =
        document.getElementById("tonearm");


    if (isPlaying) {

        songs[currentSong].pause();

        isPlaying = false;

        playButton.textContent = "▶";

        vinyl.classList.remove("playing");
        tonearm.classList.remove("playing");

    }

    else {

        songs[currentSong].play();

        songs[currentSong].setVolume(volume);

        isPlaying = true;

        playButton.textContent = "Ⅱ";

        vinyl.classList.add("playing");
        tonearm.classList.add("playing");

    }

}


// ==========================================
// 11. NEXT SONG
// ==========================================

function nextSong() {

    if (!songs.length) return;

    songs[currentSong].stop();

    currentSong++;

    if (currentSong >= songs.length) {

        currentSong = 0;

    }

    updateTrackInfo();

    if (isPlaying) {

        songs[currentSong].setVolume(volume);
        songs[currentSong].play();

    }

}


// ==========================================
// 12. PREVIOUS SONG
// ==========================================

function previousSong() {

    if (!songs.length) return;

    songs[currentSong].stop();

    currentSong--;

    if (currentSong < 0) {

        currentSong = songs.length - 1;

    }

    updateTrackInfo();

    if (isPlaying) {

        songs[currentSong].setVolume(volume);
        songs[currentSong].play();

    }

}


// ==========================================
// 13. UPDATE SONG INFORMATION
// ==========================================

function updateTrackInfo() {

    const songTitle =
        document.getElementById("songTitle");

    const artistName =
        document.getElementById("artistName");


    if (currentSong === 0) {

        songTitle.textContent = "Ghungroo";
        artistName.textContent = "War Soundtrack";

    }

    else {

        songTitle.textContent = "Butter";
        artistName.textContent = "BTS";

    }

}


// ==========================================
// 14. VOLUME CONTROL
// ==========================================

function changeVolume(event) {

    volume = Number(event.target.value) / 100;

    updateVolume();

}


function updateVolume() {

    // Update actual audio volume

    songs[currentSong].setVolume(volume);


    // Synchronize the visual volume slider

    document.getElementById("volumeSlider").value =
        Math.round(volume * 100);

}
