from flask import Flask, request, jsonify
import google.generativeai as gemini
import mysql.connector
from datetime import date
import json
import os
import pandas as pd
import matplotlib
matplotlib.use('Agg')  # Non-GUI mode for Flask
import matplotlib.pyplot as plt

# ✅ Database Configuration
DB_Config = {
    "host": "localhost",
    "user": "root",
    "password": "harsha139vivo!",
    "database": "aiextension"
}

def get_connection():
    return mysql.connector.connect(**DB_Config)

app = Flask(__name__)

# ✅ Configure Gemini API
GEMINI_API_KEY = "AIzaSyCkaiqx8ejPyGbC5r3qzwD-nj_7aIX1SS4"
gemini.configure(api_key=GEMINI_API_KEY)

# ✅ API: Get Riddle
@app.route("/get_riddle", methods=["POST"])
def get_riddle():
    try:
        data = request.get_json()
        category = data.get("category", "general life")

        prompt_text = f"""
        Give me a hard and short 'Who Am I?' riddle on the topic {category}. 
        Provide the response in the format: "question"|"answer".
        """

        model = gemini.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(prompt_text)

        if response and hasattr(response, "text"):
            riddle_parts = response.text.strip().split("|")
            return jsonify({
                "riddle": riddle_parts[0] if len(riddle_parts) > 0 else "No riddle found.",
                "answer": riddle_parts[1] if len(riddle_parts) > 1 else "Unknown"
            })
        return jsonify({"error": "Riddle generation failed."}), 500

    except Exception as e:
        return jsonify({"error": "Failed to generate riddle.", "message": str(e)}), 500 

# ✅ API: Classify Website
@app.route("/get_category", methods=["POST"])
def get_category():
    try:
        data = request.get_json()   
        domain = data.get("domain", "")

        if not domain:
            return jsonify({"error": "Domain not provided"}), 400

        prompt = f"""Classify this website "{domain}" into one of: Entertainment, Education, General, News."""
        model = gemini.GenerativeModel("gemini-1.5-pro")
        response = model.generate_content(prompt)

        if response and hasattr(response, "text"):
            return jsonify({"domain": domain, "category": response.text.strip()})
        return jsonify({"error": "Category generation failed."}), 500
    except Exception as e:
        return jsonify({"error": "Error processing request.", "message": str(e)}), 500

# ✅ Fetch Browsing Data
def get_browsing_data():
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        today_date = date.today().strftime('%Y-%m-%d')

        query = "SELECT category, domain, duration FROM statistics_table WHERE DATE(date) = %s"
        cursor.execute(query, (today_date,))
        data = cursor.fetchall()
        conn.close()
        return data
    except Exception as e:
        print("Database error:", e)
        return []

# ✅ API: Analyze Today's Browsing Data
@app.route("/analyze_today_data", methods=["GET"])
def analyze_today_data():
    data = get_browsing_data()
    if not data:
        return jsonify({"message": "No browsing data available for today."})
    return jsonify({"message": analyze_browsing_with_gemini(data)})

# ✅ Save Browsing Data API
@app.route("/save_data", methods=["POST"])
def save_data():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        data = request.json
        site_data = data.get("lastClosedSite", {})

        cursor.execute(
            "INSERT INTO statistics_table (category, domain, duration) VALUES (%s, %s, %s)",
            (site_data.get("category", ""), site_data.get("domain", ""), int(site_data.get("duration", "0")))
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "Data saved successfully"})
    except Exception as e:
        return jsonify({"error": "Failed to save data", "message": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)

