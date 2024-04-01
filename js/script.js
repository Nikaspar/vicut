let uploadBtn = document.getElementById('uploadBtn');
let progressBlock = document.getElementById('ProgressBlock');
let bar = document.getElementById('Bar');
let timeBlock = document.getElementById('TimeBlock');
let stime = document.getElementById('stime');
let etime = document.getElementById('etime');
let fname = document.getElementById('fname');
let trimBtn = document.getElementById('trimBtn');


let xhr = new XMLHttpRequest();
let inputFile = document.createElement('input', false);
let body = document.getElementsByTagName('body')[0];
inputFile.type = 'file';
inputFile.name = 'file';
inputFile.accept = 'video/mp4';

uploadBtn.addEventListener('click', () => {
    inputFile.click();
});

let filename = '';
let filestart = '00:00:00';
let fileend = '00:00:00';

function updateVars(fn, fs, fe) {
    filename = fn;
    filestart = fs;
    fileend = fe;
}

inputFile.addEventListener('change', async (e) => {
    let url = 'http://127.0.0.1:4554/upload';
    let urlStatus = 'http://127.0.0.1:4554/status'
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
    console.log('trim click');
    let xhr = new XMLHttpRequest();
    let url = 'http://127.0.0.1:4554/trim';
    
    let object = {'filename': filename, 'new_filename': fname.value,'filestart': stime.value, 'fileend': etime.value};
    xhr.open('POST', url, true);
    let xhru = xhr.upload;
    xhr.addEventListener('error', errorHandler, false);
    xhru.addEventListener('progress', progressTrimHandler, false);
    xhr.addEventListener('loadend', loadEndTrimHandler, false);
    xhr.send(JSON.stringify(object));
});

let waitModal = document.getElementById('wait');

function progressTrimHandler(e) {
    console.log('progress:');
    console.log(e);
    waitModal.style.display = 'flex';
}

function loadEndTrimHandler(e) {
    console.log('loadend:');
    console.log(e);
    waitModal.style.display = 'none';
}