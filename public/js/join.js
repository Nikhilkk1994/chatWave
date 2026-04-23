const $who = document.getElementById('whoami')
const $form = document.getElementById('joinForm')
const $room = document.getElementById('room')
const $signOut = document.getElementById('signOut')

;(async () => {
    let me
    try {
        const res = await fetch('/api/me', { credentials: 'same-origin' })
        if (!res.ok) {
            window.location.href = '/'
            return
        }
        me = await res.json()
    } catch (_) {
        window.location.href = '/'
        return
    }
    $who.textContent = me.username

    $form.addEventListener('submit', (e) => {
        e.preventDefault()
        const room = $room.value.trim()
        if (!room) return
        window.location.href = `/chat.html?room=${encodeURIComponent(room)}`
    })

    $signOut.addEventListener('click', async () => {
        await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
        window.location.href = '/'
    })
})()
