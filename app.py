from flask import Flask, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/planets')
def get_planets():
    df = pd.read_csv('data_planets.csv')
    return jsonify(df.to_dict(orient='records'))

if __name__ == '__main__':
    app.run(debug=True, port=5000)