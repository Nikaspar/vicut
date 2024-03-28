let uploadBtn = document.getElementById('uploadBtn');
let progressBlock = document.getElementById('ProgressBlock');
let bar = document.getElementById('Bar');
let timeBlock = document.getElementById('TimeBlock');
let stime = document.getElementById('stime');
let etime = document.getElementById('etime');
let fname = document.getElementById('fname');


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
        xhru.addEventListener('load', loadHandler, false);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                let json = JSON.parse(xhr.response);
                filename = json.filename;
                filestart = json.filestart;
                fileend = json.fileend;
            }
        }
        xhr.send(formData);
        filename = selectedFile.name
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

function loadHandler(event) {
    setTimeout(() => {
        timeBlock.classList.remove('hidden');
        body.style.transform = 'translateY(-200%)';
    }, 1000)
    fname.value = filename;
    stime.value = filestart;
    etime.value = fileend;
    console.log(filename);
    console.log(filestart);
    console.log(fileend);
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
