const socket = io();
const $messageForm = document.querySelector('#chatForm')
const $messageInput = document.querySelector('#message')
const $messageButton = document.querySelector('#send')
const $sendLocation = document.querySelector('#sendLocation')

const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

// Helper to capitalize first letter
const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users: users.map(u => ({ ...u, username: capitalize(u.username) }) )
    })
    document.querySelector('#sidebar').innerHTML = html
})

socket.on('personChatMessage', (eventData) => {
    const displayName = capitalize(eventData.username)
    const isOwn = displayName.toLowerCase() === username.toLowerCase()
    const isLocation = eventData.isLocation;

    if (isLocation && eventData.url) {
        const locationTemplate = document.querySelector('#location-template').innerHTML;
        const html = Mustache.render(locationTemplate, {
            url: eventData.url,
            username: displayName,
            createdAt: moment().format('h:mm a'),
            messageClass: isOwn ? 'my-message' : 'other-message',
            avatar: displayName.charAt(0),
            latitude: eventData.latitude,
            longitude: eventData.longitude
        });
        $messages.insertAdjacentHTML('beforeend', html);
    } else {
        const html = Mustache.render(messageTemplate, {
            message: eventData.text,
            username: displayName,
            createdAt: moment().format('h:mm a'),
            messageClass: isOwn ? 'my-message' : 'other-message',
            avatar: displayName.charAt(0)
        });
        $messages.insertAdjacentHTML('beforeend', html);
    }
    $messages.scrollTop = $messages.scrollHeight;
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageButton.setAttribute('disabled', 'disabled')
    const message = $messageInput.value
    const eventData = {
        text: message,
        username: username,
        room: room
    }
    socket.emit('sendMessage', eventData, (error) => {
        $messageButton.removeAttribute('disabled')
        $messageInput.value = ''
        $messageInput.focus()
        if (error) {
            return console.log(message)
        }
        console.log('Message delivered')
    })
})

$sendLocation.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }
    navigator.geolocation.getCurrentPosition((position) => {
        console.log('sendLocation', JSON.stringify(position))
        socket.emit('sendLocation', position.coords.latitude, position.coords.longitude);
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})

const $logoutBtn = document.getElementById('logout');
if ($logoutBtn) {
  $logoutBtn.addEventListener('click', () => {
    window.location.href = '/index.html';
  });
}