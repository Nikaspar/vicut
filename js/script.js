let uploadBtn = document.getElementById('uploadBtn');
let progressBlock = document.getElementById('ProgressBlock');
let bar = document.getElementById('Bar');
let timeBlock = document.getElementById('TimeBlock');
let stime = document.getElementById('stime');
let etime = document.getElementById('etime');
let fname = document.getElementById('fname');
let trimBtn = document.getElementById('trimBtn');
let downloadBlock = document.getElementById('downloadBlock');
let downloadBtn = document.getElementById('downloadBtn');
let main = document.getElementsByTagName('main')[0];

let xhr = new XMLHttpRequest();
let inputFile = document.createElement('input', false);
let body = document.getElementsByTagName('body')[0];
inputFile.type = 'file';
inputFile.name = 'file';
inputFile.accept = 'video/mp4';

uploadBtn.addEventListener('click', () => {
    inputFile.click();
});
main.addEventListener('dragover', (ev) => {
    main.classList.add('dragover');
    console.log("File(s) in drop zone");
    ev.preventDefault();
}) 
main.addEventListener('dragleave', (ev) => {
    main.classList.remove('dragover');
    console.log("File(s) leave drop zone");
    ev.preventDefault();
})
main.addEventListener('drop', async (ev) => {
    console.log("File(s) droped");
    console.log(ev);
    main.classList.remove('dragover');
    ev.preventDefault();
    let fileList = ev.dataTransfer.files;
    if (fileList.length != 1) {
        return
    } else if (fileList.length === 1) {
        let xhr = new XMLHttpRequest();
        let url = 'http://192.168.1.45:4554/upload';
        let urlStatus = 'http://192.168.1.45:4554/status'
        let selectedFile = ev.dataTransfer.files[0];
        let formData = new FormData();
        formData.append('file', selectedFile);
        if (await checkServer(urlStatus)) {
            xhr.open('POST', url, true);
            let xhru = xhr.upload;
            xhru.addEventListener('error', errorHandler, false);
            xhru.addEventListener('progress', progressHandler, false);
            xhr.addEventListener('loadend', loadEndHandler, false);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === 4) {
                    let json = JSON.parse(xhr.response);
                    updateVars(json.filename, json.filestart, json.fileend);
                }
            }
            xhr.send(formData);
        } else {
            errorHandler();
        }
    }
})

let filename = '';
let filestart = '00:00:00';
let fileend = '00:00:00';

function updateVars(fn, fs, fe) {
    filename = fn;
    filestart = fs;
    fileend = fe;
}

inputFile.addEventListener('change', async (e) => {
    let url = 'http://192.168.1.45:4554/upload';
    let urlStatus = 'http://192.168.1.45:4554/status'
    let selectedFile = e.target.files[0];
    let formData = new FormData();
    formData.append('file', selectedFile);
    if (await checkServer(urlStatus)) {
        xhr.open('POST', url, true);
        let xhru = xhr.upload;
        xhru.addEventListener('error', errorHandler, false);
        xhru.addEventListener('progress', progressHandler, false);
        xhr.addEventListener('loadend', loadEndHandler, false);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                let json = JSON.parse(xhr.response);
                updateVars(json.filename, json.filestart, json.fileend);
            }
        }
        xhr.send(formData);
    } else {
        errorHandler();
    }
});

function progressHandler(event) {
    progressBlock.classList.remove('hidden');
    body.style.transform = 'translateY(-100%)';
    let percentLoaded = Math.round((event.loaded / event.total) * 100);
    bar.style.width = percentLoaded+'%';
};

function loadEndHandler(event) {
    setTimeout(() => {
        timeBlock.classList.remove('hidden');
        body.style.transform = 'translateY(-200%)';
    }, 1000);
    fname.value = filename.split('.')[0] + '_trimmed.' + filename.split('.')[1];
    stime.value = filestart;
    etime.value = fileend;
}

// check server
async function checkServer(url) {
    try {
        let response = await fetch(url, { method: 'GET' });
        if (response.ok) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Server error:', error);
        return false;
    }
};

// change button when upload error
function errorHandler() {
    let errorModal = document.getElementById('error');
    errorModal.style.display = 'flex';
    
    setTimeout(() => {
        errorModal.style.display = 'none';
    }, 1500);
};

trimBtn.addEventListener('click', async () => {
    let xhr = new XMLHttpRequest();
    let url = 'http://192.168.1.45:4554/trim';
    
    let object = {'filename': filename, 'new_filename': fname.value,'filestart': stime.value, 'fileend': etime.value};
    xhr.open('POST', url, true);
    let xhru = xhr.upload;
    xhr.addEventListener('error', errorHandler, false);
    xhru.addEventListener('progress', progressTrimHandler, false);
    xhr.addEventListener('loadend', loadEndTrimHandler, false);
    xhr.send(JSON.stringify(object));
    // xhr.onreadystatechange = () => {
    //     if (xhr.readyState === 4) {
    //         let json = JSON.parse(xhr.response);
    //         console.log(json)
    //     }
    // }
});

let waitModal = document.getElementById('wait');

function progressTrimHandler(e) {
    waitModal.style.display = 'flex';
}

function loadEndTrimHandler(e) {
    waitModal.style.display = 'none';
    setTimeout(() => {
        downloadBlock.classList.remove('hidden');
        body.style.transform = 'translateY(-300%)';
    }, 300);
}

downloadBtn.addEventListener('click', async (e) => {
    try {
        const filename = fname.value;
        const url = `http://192.168.1.45:4554/download/${filename}`;
        const response = await fetch(url);
        if (response.ok) {
            const blob = await response.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            a.click();
            window.location.reload();
        } else {
            console.error('Ошибка при загрузке файла:', response.statusText);
            errorHandler();
        }
    } catch (error) {
        console.error('Ошибка при выполнении запроса:', error);
        errorHandler();
    }
})