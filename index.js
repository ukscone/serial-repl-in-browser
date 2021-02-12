let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;

const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton')
const ctrlaButton = document.getElementById('ctrla')
const ctrlbButton = document.getElementById('ctrlb')
const ctrlcButton = document.getElementById('ctrlc')
const ctrldButton = document.getElementById('ctrld')
const ctrleButton = document.getElementById('ctrle')
const enterRawREPLButton = document.getElementById('enterRawREPL')
const leaveRawREPLButton = document.getElementById('leaveRawREPL')
const sendButton = document.getElementById('send')
const clearButton = document.getElementById('clear')


window.addEventListener('DOMContentLoaded', e => {
    const notSupported = document.getElementById('notSupported');
    notSupported.classList.toggle('hidden', 'serial' in navigator);

});

connectButton.addEventListener('click', e => {
    clickConnect();
});

disconnectButton.addEventListener('click', e => {
    disconnect();
})

ctrlaButton.addEventListener('click', e => {
    writeToStream('\01');
})

ctrlbButton.addEventListener('click', e => {
    writeToStream('\02');
})

ctrlcButton.addEventListener('click', e => {
    writeToStream('\03\03');
})

ctrldButton.addEventListener('click', e => {
    writeToStream('\04');
})

ctrleButton.addEventListener('click',e => {
    writeToStream('\05')
} )


sendButton.addEventListener('click', e => {
    var inputText = document.getElementById('multiLineInput')
    it = inputText.value
    console.log(it);
    ait = it.split('\n');
    console.log(ait);
    for (i = 0; i < ait.length; i++) {
        writeToStream(ait[i]);
      }
    
})

clearButton.addEventListener('click', e => {
    document.getElementById('multiLineInput').value = "";
})



enterRawREPLButton.addEventListener('click',e => {
    writeToStream('\01\05A\x01')
} )

leaveRawREPLButton.addEventListener('click',e => {
    writeToStream('\04\02')
} )


//Connect to the Serial Port
const connect = async () => {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 })  // Permission issues caused by this


    //Creating an Input Stream 
    let decoder = new TextDecoderStream();
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    reader = inputStream.getReader();


    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    writeToStream('\n');
    await readOne();
}

//disconnect from the serial port
const disconnect = async () => {
    if (reader) {
        await reader.cancel();
        await inputDone.catch(() => { });
        reader = null;
        inputDone = null;
    }

    if (outputStream) {
        await outputStream.getWriter().close();
        await outputDone;
        outputStream = null;
        outputDone = null;
    }

    await port.close();
    port = null;
}

const clickConnect = async () => {
    await connect()
}

const readLoop = async () => {


    while (true) {
        const { value, done } = await reader.read();
        if (value) {
            console.log(value);

        }
        if (done) {
            console.log('[readLoop] DONE', done);
            reader.releaseLock();
            console.log('disconnected')
            break;
        }
    }
}

const readOne = async () => {

    for (let i = 0; i < 20; i++) {
        const { value, done } = await reader.read();
        if (value) {
            console.log(value);
            document.getElementById('multiLineOutput').textContent += value;   
            document.getElementById("multiLineOutput").scrollTop = document.getElementById("multiLineOutput").scrollHeight
        }
    }
}

function findTextInBuffer(textList,textToFind) {
    let wordArrayPosition = 0;
    textList.some((el, idx) => {
        let innerIndex = el.indexOf(textToFind);
        if (innerIndex !== -1) {
            wordArrayPosition = idx;
            return;
        }


    })
    return wordArrayPosition
}


const writeToStream = (...lines) => {
    const writer = outputStream.getWriter();
    lines.forEach((line) => {
        console.log('[SEND]', line);
        writer.write(line + '\r');
    });
    writer.releaseLock();
}