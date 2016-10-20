from flask import Flask
from flask import render_template
from werkzeug.serving import WSGIRequestHandler

WSGIRequestHandler.protocol_version = "HTTP/1.1"
app = Flask(__name__)

@app.route('/')
def hello_world():
    return render_template('index.html')