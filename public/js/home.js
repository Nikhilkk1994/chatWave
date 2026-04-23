const $tabs = document.querySelectorAll('.tab')
const $panels = { login: document.getElementById('formLogin'), signup: document.getElementById('formSignup') }
const $err = document.getElementById('authError')

function showError(msg) {
    if (!msg) {
        $err.hidden = true
        $err.textContent = ''
        return
    }
    $err.hidden = false
    $err.textContent = msg
}

$tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab
        $tabs.forEach((b) => b.classList.toggle('tab--active', b === btn))
        Object.keys($panels).forEach((key) => {
            $panels[key].classList.toggle('panel--active', key === tab)
        })
        showError('')
    })
})

async function api(path, body) {
    const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || res.statusText)
    return data
}

document.getElementById('formLogin').addEventListener('submit', async (e) => {
    e.preventDefault()
    showError('')
    const username = document.getElementById('loginUser').value.trim()
    const password = document.getElementById('loginPass').value
    try {
        await api('/api/login', { username, password })
        window.location.href = '/join'
    } catch (err) {
        showError(err.message)
    }
})

document.getElementById('formSignup').addEventListener('submit', async (e) => {
    e.preventDefault()
    showError('')
    const username = document.getElementById('signupUser').value.trim()
    const password = document.getElementById('signupPass').value
    try {
        await api('/api/signup', { username, password })
        window.location.href = '/join'
    } catch (err) {
        showError(err.message)
    }
})

;(async () => {
    try {
        const res = await fetch('/api/me', { credentials: 'same-origin' })
        if (res.ok) window.location.href = '/join'
    } catch (_) {}
})()
