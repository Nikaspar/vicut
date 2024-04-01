import aiofiles
import asyncio
import datetime
import ffmpeg
import math
import os
import uvicorn
from fastapi import FastAPI, Request, HTTPException, UploadFile, status
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from werkzeug.utils import secure_filename

app = FastAPI()
app.mount("/css", StaticFiles(directory='css'), name='css')
app.mount("/img", StaticFiles(directory='img'), name='img')
app.mount("/js", StaticFiles(directory='js'), name='js')
templates = Jinja2Templates(directory='.')
app.add_middleware(CORSMiddleware,
                   allow_origins=['*'],
                   allow_credentials=True,
                   allow_methods=['GET', 'POST'],
                   allow_headers=['*'],)


def allowed_file(filename: str):
    allowed_extensions = ['mp4']
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def get_video_len(filepath):
    probe = ffmpeg.probe(filepath)
    video_stream = next((stream for stream in probe['streams'] if stream['codec_type'] == 'video'), None)
    duration = round(float(video_stream['duration']) + float(video_stream['start_time']))
    raw_time = f'{int(duration // 3600)}:{int(duration % 3600 // 60)}:{duration % 60}'
    time_obj = datetime.datetime.strptime(raw_time, "%H:%M:%S")
    end_time = time_obj.strftime("%H:%M:%S")
    print(end_time)
    return end_time


@app.get('/', response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse('index.html', {'request': request})


@app.post('/upload')
async def upload(file: UploadFile):
    try:
        content = await file.read()
        async with aiofiles.open(os.path.join('uploads', secure_filename(file.filename)), 'wb') as f:
            await f.write(content)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='There was an error uploading the file',
        )
    
    vlen = get_video_len(os.path.join('uploads', secure_filename(file.filename)))
    content = {'filename': file.filename, 'filestart': '00:00:00', 'fileend': vlen}
    return JSONResponse(content, status.HTTP_200_OK)


async def cut_video(in_file, out_file, start_time, end_time):
    import subprocess
    input_video_path = os.path.join('uploads', in_file)
    output_video_path = os.path.join('uploads', 'trimed', out_file)
    command = [
        "ffmpeg",
        "-i", input_video_path,
        "-ss", start_time,
        "-to", end_time,
        "-acodec", "copy",
        "-vcodec", "copy",
        output_video_path
    ]
    subprocess.run(command)
    return output_video_path


@app.post('/trim')
async def trim(request: Request):
    data = await request.json()
    trimed_path = await cut_video(data.get('filename'), data.get('new_filename'), data.get('filestart'), data.get('fileend'))
    print(data)
    return {'please': 'wait'}


@app.get('/status')
def read_status():
    return JSONResponse('Server is OK', status.HTTP_200_OK)

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=4554)
