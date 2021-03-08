const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");

//Get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const socket = io();

//Join chatroom
socket.emit("jointRoom", { username, room });

//Message from server
socket.on("message", (message) => {
  //   console.log(message);
  outputMessage(message);

  //Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = e.target.elements.msg.value;
  socket.emit("chatMessage", msg);

  //Clear Input
  e.target.elements.msg.value = "";
  e.target.elements.msg.focus();
});

//Output message to DOM
function outputMessage(message) {
  const div = document.createElement("div");
  div.classList.add("message");
  div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
            <p class="text">
              ${message.text}
            </p>`;
  document.querySelector(".chat-messages").appendChild(div);
}

// NEWLY ADDED
$.ajax({
  url: "http://localhost:3000/get_messages",
  method: "GET",
  success: function (response) {
    // console.log(response);
    var data = JSON.parse(response);
    for (var a = 0; a < data.length; a++) {
      //   console.log(data[a]);
      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = `<p class="meta">${data[a].user} <span>${data[a].time}</span></p>
            <p class="text">
              ${data[a].message}
            </p>`;
      document.querySelector(".chat-messages").appendChild(div);
    }
  },
});
// NEWLY ADDED
