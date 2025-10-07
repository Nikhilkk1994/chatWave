
const messagePrint = (data) => {
    console.log('messagePrint', data.message)
}


const hello = (data) => {
    console.log('hello start', data.message)
    data.message = 'hello1 ' + Math.random()
    messagePrint(data)
}

const handle = (data) => {
    hello({...data})
    hello({...data})
}

handle({message: 'hello'})



