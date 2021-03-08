const imageUpload = document.getElementById("photo");
var submitted = document.getElementById("submitted");
var appendInfo = document.querySelector(".appendInfo");
var loaded = document.querySelector("#loaded");
var contentarea = document.querySelector(".contentarea");
var uploadedImage = document.querySelector("#uploadedImage");
var auth = document.getElementById("authenticated");
var userId = document.getElementById("user_id");
appendInfo.innerText = "";

var authenticated = false;
var user_id = -1;
var mainData;
var image;
fetch("/fetchImages")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    mainData = data;
    reg_no = mainData.map((d) => d.id);
    image = mainData.map((d) => ({ img1: d.image1, img2: d.image2 }));

    Promise.all([
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    ]).then(start);
  });

async function start() {
  const container = document.querySelector("#uploadedImage");
  container.style.position = "relative";
  // document.body.append(container);
  const labeledFaceDescriptors = await loadLabeledImages();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

  let image;
  let canvas;
  // document.body.append("Loaded");
  loaded.innerText = "Loaded";
  console.log(imageUpload);
  submitted.addEventListener("click", async () => {
    const video = document.querySelector("video");

    // A video's MediaStream object is available through its srcObject attribute
    const mediaStream = video.srcObject;

    // Through the MediaStream, you can get the MediaStreamTracks with getTracks():
    const tracks = mediaStream.getTracks();

    // Tracks are returned as an array, so if you know you only have one, you can stop it with:
    tracks[0].stop();

    // Or stop all like so:
    tracks.forEach((track) => track.stop());
    // console.log(imageUpload);
    contentarea.classList.add("displayNone");
    contentarea.innerHTML = "";
    submitted.classList.add("displayNone");
    loaded.classList.add("displayNone");
    if (image) image.remove();
    if (canvas) canvas.remove();
    // image = await faceapi.bufferToImage(imageUpload.files[0]);
    // console.log(image);
    image = imageUpload;

    container.append(image);
    canvas = faceapi.createCanvasFromMedia(image);
    container.append(canvas);
    const displaySize = { width: image.width, height: image.height };
    faceapi.matchDimensions(canvas, displaySize);
    const detectionssamp = await faceapi
      .detectAllFaces(image)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(
      detectionssamp,
      displaySize
    );
    const results = resizedDetections.map((d) =>
      faceMatcher.findBestMatch(d.descriptor)
    );

    // console.log(results[0].label);
    appendInfo.innerText = results[0].label;
    var answer = results[0].label;
    auth.value = authenticated;
    userId.value = user_id;
    appendInfo.innerHTML = "<p> Please Register </p>";
    for (var i = 0; i < mainData.length; i++) {
      if (mainData[i].id == answer) {
        console.log(mainData[i]);
        authenticated = true;
        user_id = mainData[i].id;
        appendInfo.innerHTML =
          "<p> User Id: " +
          mainData[i].id +
          "</p>" +
          "<p> Name : " +
          mainData[i].first_name +
          " " +
          mainData[i].last_name +
          "</p>";
        auth.value = authenticated;
        userId.value = user_id;
        break;
      }
    }

    results.forEach((sampreeth, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: sampreeth.toString(),
      });
      drawBox.draw(canvas);
    });
  });
}

function loadLabeledImages() {
  // const labels = [
  //   "Black Widow",
  //   "Captain America",
  //   "Captain Marvel",
  //   "Hawkeye",
  //   "Jim Rhodes",
  //   "Thor",
  //   "Tony Stark",
  // ];

  const labels = reg_no;

  return Promise.all(
    // labels.map(async (label) => {
    //   const descriptions = [];
    //   for (let i = 1; i <= 2; i++) {
    //     const img = await faceapi.fetchImage(
    //       `https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`
    //     );
    //     const detections = await faceapi
    //       .detectSingleFace(img)
    //       .withFaceLandmarks()
    //       .withFaceDescriptor();
    //     descriptions.push(detections.descriptor);
    //   }

    image.map(async (label, pos) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(label[`img${i}`]);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(reg_no[pos], descriptions);
    })
  );
}
