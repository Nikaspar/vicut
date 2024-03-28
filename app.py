import aiofiles

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

    return JSONResponse({'filename': file.filename}, status.HTTP_200_OK)



@app.get('/status')
def read_status():
    return JSONResponse('Server is OK', status.HTTP_200_OK)

if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=4554)
