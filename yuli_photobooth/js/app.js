const $ = selector =>
    document.querySelector(selector);


/* ==========================================
   ELEMENTS
========================================== */

const homePage =
    $("#homePage");

const cameraPage =
    $("#cameraPage");

const editorPage =
    $("#editorPage");

const video =
    $("#video");

const canvas =
    $("#canvas");

const ctx =
    canvas.getContext("2d");

const cameraMessage =
    $("#cameraMessage");

const countdown =
    $("#countdown");

const flash =
    $("#flash");

const filmstrip =
    $("#filmstrip");

const photoCount =
    $("#photoCount");

const toast =
    $("#toast");


/* ==========================================
   STATE
========================================== */

let stream = null;

let mirrored = true;

let photos = [];

let currentFilter =
    "normal";

let currentLayout =
    "grid";

let capturing = false;


/* ==========================================
   FILTERS
========================================== */

const filters = {

    normal: "none",

    grayscale:
        "grayscale(1)",

    sepia:
        "sepia(.75)",

    vintage:
        "sepia(.35) saturate(.8) contrast(1.08)",

    pink:
        "saturate(1.3) hue-rotate(-10deg) brightness(1.04)",

    moody:
        "brightness(.82) contrast(1.15) saturate(.75)"
};


/* ==========================================
   PAGE NAVIGATION
========================================== */

function showPage(page) {

    homePage.classList.remove(
        "active"
    );

    cameraPage.classList.remove(
        "active"
    );

    editorPage.classList.remove(
        "active"
    );

    page.classList.add(
        "active"
    );

    window.scrollTo(
        0,
        0
    );
}


/* ==========================================
   TOAST
========================================== */

function showToast(message) {

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );

    clearTimeout(
        showToast.timer
    );

    showToast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2000
        );
}


/* ==========================================
   CAMERA
========================================== */

async function startCamera() {

    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        showToast(
            "Camera is not supported."
        );

        return false;
    }


    try {

        if (stream) {

            stream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );
        }


        stream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: true,

                    audio: false

                });


        video.srcObject =
            stream;


        await video.play();


        cameraMessage.classList.add(
            "hidden"
        );


        return true;

    } catch (error) {

        console.error(error);

        cameraMessage.classList.remove(
            "hidden"
        );

        showToast(
            "Please allow camera access."
        );

        return false;
    }
}


/* ==========================================
   MIRROR
========================================== */

$("#mirrorBtn")
    .addEventListener(
        "click",
        () => {

            mirrored =
                !mirrored;


            video.style.transform =
                mirrored
                    ? "scaleX(-1)"
                    : "scaleX(1)";


            $("#mirrorBtn")
                .textContent =
                `Mirror: ${
                    mirrored
                        ? "ON"
                        : "OFF"
                }`;
        }
    );


/* ==========================================
   CAPTURE FRAME
========================================== */

function captureFrame() {

    if (
        !video.videoWidth
    ) {

        return null;
    }


    const captureCanvas =
        document.createElement(
            "canvas"
        );


    captureCanvas.width =
        video.videoWidth;

    captureCanvas.height =
        video.videoHeight;


    const captureContext =
        captureCanvas
            .getContext("2d");


    if (mirrored) {

        captureContext.translate(
            captureCanvas.width,
            0
        );

        captureContext.scale(
            -1,
            1
        );
    }


    captureContext.drawImage(

        video,

        0,
        0,

        captureCanvas.width,
        captureCanvas.height
    );


    return captureCanvas.toDataURL(
        "image/jpeg",
        .92
    );
}


/* ==========================================
   COUNTDOWN
========================================== */

function wait(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


async function runCountdown() {

    for (
        let i = 3;
        i >= 1;
        i--
    ) {

        countdown.textContent =
            i;

        await wait(1000);
    }

    countdown.textContent =
        "";
}


/* ==========================================
   FLASH
========================================== */

async function cameraFlash() {

    flash.classList.remove(
        "active"
    );

    void flash.offsetWidth;

    flash.classList.add(
        "active"
    );

    await wait(300);
}


/* ==========================================
   ADD PHOTO
========================================== */

function addPhoto(image) {

    photos.push(image);

    renderFilmstrip();

    photoCount.textContent =
        `${photos.length} / 3`;
}


/* ==========================================
   FILMSTRIP
========================================== */

function renderFilmstrip() {

    filmstrip.innerHTML =
        "";

    photos.forEach(
        image => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "photo";


            const img =
                document.createElement(
                    "img"
                );

            img.src =
                image;


            item.appendChild(
                img
            );


            filmstrip.appendChild(
                item
            );
        }
    );
}


/* ==========================================
   TAKE THREE PHOTOS
========================================== */

async function takePhotos() {

    if (capturing) {
        return;
    }


    if (!stream) {

        const started =
            await startCamera();

        if (!started) {
            return;
        }
    }


    capturing = true;


    photos = [];

    renderFilmstrip();

    photoCount.textContent =
        "0 / 3";


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        showToast(
            `Get ready for photo ${
                i + 1
            }`
        );


        await runCountdown();


        const image =
            captureFrame();


        if (image) {

            await cameraFlash();

            addPhoto(
                image
            );
        }


        await wait(600);
    }


    capturing = false;


    if (
        photos.length === 3
    ) {

        renderCollage();

        showPage(
            editorPage
        );

        showToast(
            "Your collage is ready."
        );
    }
}


/* ==========================================
   COLLAGE
========================================== */

function loadImage(src) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();

            image.onload =
                () => resolve(image);

            image.onerror =
                reject;

            image.src =
                src;
        }
    );
}


async function renderCollage() {

    if (
        photos.length === 0
    ) {
        return;
    }


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    const images = [];


    for (
        const photo of photos
    ) {

        images.push(
            await loadImage(
                photo
            )
        );
    }


    ctx.filter =
        filters[
            currentFilter
        ];


    if (
        currentLayout ===
        "grid"
    ) {

        drawGrid(
            images
        );

    } else if (
        currentLayout ===
        "strip"
    ) {

        drawStrip(
            images
        );

    } else {

        drawFocus(
            images
        );
    }


    ctx.filter =
        "none";
}


/* ==========================================
   COVER DRAWING
========================================== */

function drawCover(
    image,
    x,
    y,
    width,
    height
) {

    const imageRatio =
        image.width /
        image.height;

    const boxRatio =
        width /
        height;


    let sourceWidth;
    let sourceHeight;
    let sourceX;
    let sourceY;


    if (
        imageRatio >
        boxRatio
    ) {

        sourceHeight =
            image.height;

        sourceWidth =
            image.height *
            boxRatio;

        sourceX =
            (
                image.width -
                sourceWidth
            ) / 2;

        sourceY =
            0;

    } else {

        sourceWidth =
            image.width;

        sourceHeight =
            image.width /
            boxRatio;

        sourceX =
            0;

        sourceY =
            (
                image.height -
                sourceHeight
            ) / 2;
    }


    ctx.drawImage(

        image,

        sourceX,
        sourceY,

        sourceWidth,
        sourceHeight,

        x,
        y,

        width,
        height
    );
}


/* ==========================================
   GRID
========================================== */

function drawGrid(images) {

    const padding =
        30;

    const gap =
        15;

    const size =
        (
            1000 -
            padding * 2 -
            gap
        ) / 2;


    images.forEach(
        (image, index) => {

            const row =
                Math.floor(
                    index / 2
                );

            const column =
                index % 2;


            drawCover(

                image,

                padding +
                    column *
                    (size + gap),

                padding +
                    row *
                    (size + gap),

                size,
                size
            );
        }
    );
}


/* ==========================================
   STRIP
========================================== */

function drawStrip(images) {

    const padding =
        30;

    const gap =
        15;

    const height =
        (
            1000 -
            padding * 2 -
            gap * 2
        ) / 3;


    images.forEach(
        (image, index) => {

            drawCover(

                image,

                padding,

                padding +
                    index *
                    (height + gap),

                940,

                height
            );
        }
    );
}


/* ==========================================
   FOCUS
========================================== */

function drawFocus(images) {

    const padding =
        30;

    const gap =
        15;

    const bigHeight =
        600;


    drawCover(

        images[0],

        padding,
        padding,

        940,
        bigHeight
    );


    const smallWidth =
        (
            940 -
            gap
        ) / 2;


    const smallHeight =
        325;


    drawCover(

        images[1],

        padding,

        padding +
            bigHeight +
            gap,

        smallWidth,

        smallHeight
    );


    drawCover(

        images[2],

        padding +
            smallWidth +
            gap,

        padding +
            bigHeight +
            gap,

        smallWidth,

        smallHeight
    );
}


/* ==========================================
   FILTER EVENTS
========================================== */

document
    .querySelectorAll(
        ".filter"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter"
                        )
                        .forEach(
                            item =>
                                item
                                    .classList
                                    .remove(
                                        "active"
                                    )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset
                            .filter;


                    renderCollage();
                }
            );
        }
    );


/* ==========================================
   LAYOUT EVENTS
========================================== */

document
    .querySelectorAll(
        ".layout"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".layout"
                        )
                        .forEach(
                            item =>
                                item
                                    .classList
                                    .remove(
                                        "active"
                                    )
                        );


                    button.classList.add(
                        "active"
                    );


                    currentLayout =
                        button.dataset
                            .layout;


                    renderCollage();
                }
            );
        }
    );


/* ==========================================
   DOWNLOAD
========================================== */

$("#downloadBtn")
    .addEventListener(
        "click",
        () => {

            const link =
                document.createElement(
                    "a"
                );


            link.download =
                "yuli-photobooth.png";


            link.href =
                canvas.toDataURL(
                    "image/png"
                );


            link.click();


            showToast(
                "Collage downloaded."
            );
        }
    );


/* ==========================================
   PRINT
========================================== */

$("#printBtn")
    .addEventListener(
        "click",
        () => {

            const image =
                canvas.toDataURL(
                    "image/png"
                );


            const printWindow =
                window.open(
                    "",
                    "_blank"
                );


            if (!printWindow) {

                showToast(
                    "Allow popups to print."
                );

                return;
            }


            printWindow.document.write(`

                <html>

                <head>

                    <title>
                        Yuli PhotoBooth
                    </title>

                    <style>

                        body {
                            margin: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                        }

                        img {
                            max-width: 95%;
                            max-height: 95vh;
                        }

                    </style>

                </head>

                <body>

                    <img src="${image}">

                </body>

                </html>

            `);


            printWindow.document.close();


            printWindow.onload =
                () => {

                    printWindow.print();

                    printWindow.close();
                };
        }
    );


/* ==========================================
   RETAKE
========================================== */

$("#retakeBtn")
    .addEventListener(
        "click",
        async () => {

            photos = [];

            photoCount.textContent =
                "0 / 3";

            renderFilmstrip();

            showPage(
                cameraPage
            );

            await startCamera();
        }
    );


/* ==========================================
   HOME
========================================== */

$("#startBtn")
    .addEventListener(
        "click",
        async () => {

            showPage(
                cameraPage
            );

            await startCamera();
        }
    );


$("#homeBtn")
    .addEventListener(
        "click",
        () => {

            if (stream) {

                stream
                    .getTracks()
                    .forEach(
                        track =>
                            track.stop()
                    );

                stream = null;
            }

            showPage(
                homePage
            );
        }
    );


/* ==========================================
   ENABLE CAMERA
========================================== */

$("#enableCamera")
    .addEventListener(
        "click",
        startCamera
    );


/* ==========================================
   CAPTURE
========================================== */

$("#captureBtn")
    .addEventListener(
        "click",
        takePhotos
    );


/* ==========================================
   CLEAR
========================================== */

$("#clearBtn")
    .addEventListener(
        "click",
        () => {

            photos = [];

            renderFilmstrip();

            photoCount.textContent =
                "0 / 3";

            showToast(
                "Photos cleared."
            );
        }
    );


/* ==========================================
   CLEANUP
========================================== */

window.addEventListener(
    "beforeunload",
    () => {

        if (stream) {

            stream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );
        }
    }
);