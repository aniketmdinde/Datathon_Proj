from flask import Flask
import joblib
import os
import pickle
import pandas as pd
from lightfm.data import Dataset
from joblib import load
import json

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

main_dataset_path = os.path.join(BASE_DIR, "retail_data.csv")
main_dataset_df = pd.read_csv(main_dataset_path)

feature_names_data_path = os.path.join(BASE_DIR, "feature_names.txt")
user_product_interaction_data_path = os.path.join(BASE_DIR, "user_product_interactions_large.csv")

sales_model_path = os.path.join(BASE_DIR, "sales_prediction_model.joblib")
sales_encoders_path = os.path.join(BASE_DIR, "label_encoders.joblib")
sales_scaler_path = os.path.join(BASE_DIR, "scaler.joblib")

churn_model_path = os.path.join(BASE_DIR, "rf_model.joblib")
churn_feature_path = os.path.join(BASE_DIR, "feature_list.json")
churn_scalar_path = os.path.join(BASE_DIR, "churn_scaler.joblib")


sales_model = joblib.load(sales_model_path)
sales_encoders = joblib.load(sales_encoders_path)
sales_scaler = joblib.load(sales_scaler_path)

user_product_interaction_df = pd.read_csv(user_product_interaction_data_path)
user_product_interaction_data = Dataset()
user_product_interaction_data.fit(
    users=user_product_interaction_df["user_id"].unique(),
    items=user_product_interaction_df["product_id"].unique()
)

product_recommendation_model_path = os.path.join(BASE_DIR, "lightfm_model.pkl")

with open(feature_names_data_path, 'r') as f:
    feature_names = f.read().split(',')

with open(product_recommendation_model_path, "rb") as f:
    product_recommendation_model = pickle.load(f)

churn_model = load(churn_model_path)
churn_scaler = load(churn_scalar_path)

with open(churn_feature_path, 'r') as f:
    churn_feature_list = json.load(f)

if isinstance(churn_feature_list, dict):
    churn_feature_list = list(churn_feature_list.values())


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

    from .views import views
    app.register_blueprint(views, url_prefix='/')

    return app