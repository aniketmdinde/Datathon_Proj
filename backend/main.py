from app import create_app
from dotenv import load_dotenv
from flask_cors import CORS
from flask import Flask, jsonify, request
import pandas as pd
import numpy as np
from lightfm import LightFM
from lightfm.data import Dataset
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import random

load_dotenv()

app = create_app()
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Add these category-based offers
category_offers = {
    "Electronics": [
        {"discount": "20% off", "min_purchase": 500, "description": "Big savings on premium electronics"},
        {"discount": "10% off", "min_purchase": 200, "description": "Standard electronics discount"},
    ],
    "Furniture": [
        {"discount": "15% off", "min_purchase": 1000, "description": "Home makeover savings"},
        {"discount": "Free delivery", "min_purchase": 500, "description": "No shipping costs"},
    ],
    "Clothing": [
        {"discount": "Buy 2 Get 1 Free", "min_purchase": 100, "description": "Triple the style"},
        {"discount": "30% off", "min_purchase": 200, "description": "Wardrobe refresh savings"},
    ],
    "Toys": [
        {"discount": "25% off", "min_purchase": 100, "description": "Fun savings for kids"},
        {"discount": "Free gift", "min_purchase": 50, "description": "Bonus toy with purchase"},
    ],
    "Groceries": [
        {"discount": "10% off", "min_purchase": 150, "description": "Grocery savings"},
        {"discount": "5% cashback", "min_purchase": 100, "description": "Money back on essentials"},
    ]
}

# Add store locations
store_locations = {
    "Electronics": "Croma, Seawoods Grand Central Mall",
    "Groceries": "D-Mart, Sector 19, Nerul",
    "Clothing": "Westside, Sector 15, Nerul",
    "Toys": "Hamleys, Seawoods Mall",
    "Furniture": "Home Centre, Seawoods Mall"
}

def send_email(user_email, subject, body):
    sender_email = "your-email@gmail.com"  # Replace with your email
    sender_password = "your-app-password"   # Replace with your app password
    
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = user_email
    msg['Subject'] = subject
    
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        text = msg.as_string()
        server.sendmail(sender_email, user_email, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@app.route('/send-recommendations', methods=['POST'])
def send_recommendations():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400
        
        user_id = data.get('user_id')
        recommendations = data.get('recommendations', [])
        user_email = data.get('user_email', "rajneelchouguleone8@gmail.com")
        
        if not recommendations:
            return jsonify({"success": False, "message": "No recommendations provided"}), 400

        # Format email content
        email_body = f"Hello User {user_id},\n\nHere are your personalized recommendations:\n\n"
        
        for item in recommendations:
            category = item.get('category', 'Unknown')
            store = store_locations.get(category, "Store location not available")
            store_name = item.get('storeName', 'Store name not available')
            price = item.get('price', 0)
            offers = item.get('offers', [])
            
            email_body += f"\nStore: {store_name}\n"
            email_body += f"Category: {category}\n"
            email_body += f"Location: {store}\n"
            email_body += f"Price: ₹{price:.2f}\n"
            
            if offers:
                email_body += "Available Offers:\n"
                for offer in offers:
                    email_body += f"- {offer.get('description', '')}: {offer.get('discount', '')}\n"
            
            email_body += "-" * 40 + "\n"
        
        email_body += "\nThank you for using our service!\n"

        # Email configuration
        sender_email = "rajneelchoughule@gmail.com"
        sender_password = "uuua zboo fiij oshp"
        subject = "Your Personalized Shopping Recommendations"

        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = user_email
        msg['Subject'] = subject
        msg.attach(MIMEText(email_body, 'plain'))

        # Send email
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(sender_email, sender_password)
            server.send_message(msg)
            print(f"Email sent successfully to {user_email}")
            return jsonify({
                "success": True, 
                "message": "Recommendations sent successfully"
            })

    except Exception as e:
        print(f"Error sending recommendations: {str(e)}")
        return jsonify({
            "success": False, 
            "message": f"Failed to send recommendations: {str(e)}"
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)