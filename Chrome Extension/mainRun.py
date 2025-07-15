import matplotlib.pyplot as plt
import pandas as pd
import joblib
from flask import Flask, request, render_template, Response
import io
import base64

app = Flask(__name__)

# Load the trained model and scaler
model = joblib.load('DehydrationModel.pkl')
scaler = joblib.load('scaler.pkl')

# Function to predict dehydration
def predict_dehydration(input_data):
    input_data_scaled = scaler.transform(input_data)
    prediction = model.predict(input_data_scaled)
    return 1 if prediction[0] == 1 else 0  # 1 = Yes, 0 = No

# Route for home page
@app.route("/", methods=["GET", "POST"])
def home():
    result = None
    input_data = None

    if request.method == "POST":
        # Get user inputs
        water_intake = float(request.form["water_intake"])
        physical_activity = float(request.form["physical_activity"])
        ambient_temperature = float(request.form["ambient_temperature"])
        sweat_rate = float(request.form["sweat_rate"])

        # ✅ Fix: Ensure feature names match model's expected format
        input_data = pd.DataFrame({
            "Water_Intake (liters)": [water_intake],
            "Physical_Activity (hours)": [physical_activity],
            "Ambient_Temperature (°C)": [ambient_temperature],
            "Sweat_Rate (liters/hour)": [sweat_rate]
        })

        # Predict dehydration
        result = predict_dehydration(input_data)

    return render_template("index.html", result=result, input_data=input_data.to_dict(orient='list') if input_data is not None else None)


@app.route("/chart")
def chart():
    # Get query parameters
    water_intake = float(request.args.get("water_intake", 0))
    physical_activity = float(request.args.get("physical_activity", 0))
    ambient_temperature = float(request.args.get("ambient_temperature", 0))
    sweat_rate = float(request.args.get("sweat_rate", 0))

    # Create input dataframe
    input_data = pd.DataFrame({
        "Water_Intake": [water_intake],
        "Physical_Activity": [physical_activity],
        "Ambient_Temperature": [ambient_temperature],
        "Sweat_Rate": [sweat_rate]
    })

    # Predict dehydration
    prediction = predict_dehydration(input_data)

    # Create plot
    labels = ["Water Intake", "Physical Activity", "Ambient Temperature", "Sweat Rate", "Prediction"]
    values = [water_intake, physical_activity, ambient_temperature, sweat_rate, prediction]

    plt.figure(figsize=(8, 5))
    plt.plot(labels, values, marker="o", linestyle="-", color="blue", label="User Input vs Prediction")
    plt.xlabel("Features")
    plt.ylabel("Values")
    plt.title("User Input vs Predicted Dehydration")
    plt.legend()
    plt.grid(True)

    # Save plot to a buffer
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    
    # Convert to base64
    return Response(buf.getvalue(), mimetype="image/png")

if __name__ == "__main__":
    app.run(debug=True)
